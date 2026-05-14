import { Router } from "express";
import multer from "multer";
import { openrouter, getEmbedding } from "../lib/openai";
import { extractTextFromFile } from "../lib/extractor";
import { db, resumes, resumeEmbeddings, atsReports, jobs, jobEmbeddings, applications, users, profiles } from "@workspace/db";
import { eq, sql, and, inArray, desc, lte, gte } from "drizzle-orm";
import { logger } from "../lib/logger";
import { authMiddleware, requireRole } from "../lib/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/** Strip markdown code-fences that some LLMs add despite "Return ONLY valid JSON" */
function stripJsonFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
}

const JD_MODEL = "openrouter/free";

const JD_SYSTEM_PROMPT = `You are an expert HR and Recruitment Assistant for the Gulf / Middle East job market.
Generate professional job descriptions in valid JSON only — no markdown, no code fences, no explanations.
You know GCC labor laws, visa sponsorship norms, and market salary ranges.`;

const JD_USER_PROMPT = (fields: Record<string, any>) => {
  const parts: string[] = [];
  if (fields.title) parts.push(`Job Title: ${fields.title}`);
  if (fields.industry) parts.push(`Industry: ${fields.industry}`);
  if (fields.location) parts.push(`Location: ${fields.location}`);
  if (fields.experienceLevel) parts.push(`Experience Level: ${fields.experienceLevel}`);
  if (fields.employmentType) parts.push(`Employment Type: ${fields.employmentType}`);
  if (fields.skills?.length) parts.push(`Key Skills: ${fields.skills.join(", ")}`);
  if (fields.salaryRange) parts.push(`Salary Range: ${fields.salaryRange}`);
  if (fields.companyName) parts.push(`Company: ${fields.companyName}`);
  if (fields.companyOverview) parts.push(`Company Overview: ${fields.companyOverview}`);
  if (fields.aboutRole) parts.push(`Additional Context: ${fields.aboutRole}`);

  return `Generate a professional job description for a Gulf/Middle East market role.

${parts.join("\n")}

Respond with ONLY this JSON (no markdown):
{
  "description": "3-4 paragraph professional description of the role, company, and impact",
  "responsibilities": ["6-8 bullet points of key responsibilities"],
  "requirements": ["6-8 bullet points of qualifications and requirements including education, experience, certifications"],
  "benefits": ["4-6 bullet points of benefits, perks, and why join"],
  "socialLinkedIn": "2-3 sentence LinkedIn-optimized summary with hashtags",
  "socialWhatsApp": "Short WhatsApp-friendly announcement with emoji and key highlights",
  "seoKeywords": ["10-15 SEO keywords for the job listing"],
  "interviewQuestions": ["5-7 role-specific interview questions"]
}`;
};

router.post("/generate-job-description", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { title, industry, location, experienceLevel, employmentType, skills, salaryRange, companyName, companyOverview, aboutRole } = req.body ?? {};
    if (!title) {
      return res.status(400).json({ error: "Job title is required" });
    }

    const completion = await openrouter().chat.completions.create({
      model: JD_MODEL,
      messages: [
        { role: "system", content: JD_SYSTEM_PROMPT },
        { role: "user", content: JD_USER_PROMPT({ title, industry, location, experienceLevel, employmentType, skills, salaryRange, companyName, companyOverview, aboutRole }) },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const raw = completion.choices[0].message.content || "{}";
    const parsed = JSON.parse(stripJsonFences(raw));

    res.json({
      description: parsed.description || "",
      responsibilities: parsed.responsibilities || [],
      requirements: parsed.requirements || [],
      benefits: parsed.benefits || [],
      socialLinkedIn: parsed.socialLinkedIn || "",
      socialWhatsApp: parsed.socialWhatsApp || "",
      seoKeywords: parsed.seoKeywords || [],
      interviewQuestions: parsed.interviewQuestions || [],
    });
  } catch (error: unknown) {
    logger.error({ err: error }, "Error generating job description");
    res.status(500).json({ error: "Failed to generate job description: " + (error instanceof Error ? error.message : String(error)) });
  }
});

// ─── Protected: require employer/admin ────────────────────────────

const requireEmployerOrAdmin = requireRole("employer", "admin");

// ─── Semantic Matching Engine ──────────────────────────────────────

const SKILL_INFERENCE_PROMPT = `You are an expert recruitment AI specializing in the Gulf/Middle East job market.
Given a candidate's profile, infer their transferable skills and compatible roles.
Return ONLY valid JSON with no markdown or explanation.`;

router.post("/semantic-match", async (req, res) => {
  try {
    const { skills = [], title = "", experience = "", location = "", industry = "", topN = 20 } = req.body;

    if (!skills.length && !title) {
      return res.status(400).json({ error: "At least one skill or job title is required" });
    }

    const queryText = [title, ...skills, experience, industry, location].filter(Boolean).join(" ");

    let inferredSkills: string[] = [];
    let inferredTransferableRoles: string[] = [];

    try {
      const completion = await openrouter().chat.completions.create({
        model: "openrouter/free",
        messages: [
          { role: "system", content: SKILL_INFERENCE_PROMPT },
          {
            role: "user",
            content: `Candidate profile:
Title: ${title || "Not specified"}
Skills: ${skills.join(", ") || "Not specified"}
Experience: ${experience || "Not specified"}
Industry: ${industry || "Not specified"}

Respond with ONLY this JSON:
{
  "inferredSkills": ["skill1", "skill2", ...] (8-12 related/transferable skills this candidate could likely perform),
  "transferableRoles": ["role1", "role2", ...] (5-8 job roles this candidate could transition into based on their profile)
}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 600,
      });

      const raw = completion.choices[0].message.content || "{}";
      const parsed = JSON.parse(stripJsonFences(raw));
      inferredSkills = parsed.inferredSkills || [];
      inferredTransferableRoles = parsed.transferableRoles || [];
    } catch {
      inferredSkills = [...skills];
      inferredTransferableRoles = [];
    }

    const allSkills = [...new Set([...skills, ...inferredSkills])];
    const skillLower = allSkills.map((s) => s.toLowerCase().trim());

    let activeJobs: any[] = [];
    let vectorResults: any[] = [];

    try {
      const embedding = await getEmbedding(queryText);
      const vecResult = await db.execute(sql`
        SELECT j.id, j.title, j.company, j.location, j.salary, j.salary_min, j.salary_max,
               j.skills, j.employment_type, j.experience_level, j.industry, j.description,
               j.visa_sponsored, j.is_remote, j.is_urgent, j.posted_at,
               1 - (je.embedding <=> ${JSON.stringify(embedding)}::vector) as vector_similarity
        FROM ${jobs} j
        JOIN ${jobEmbeddings} je ON j.id = je.job_id
        WHERE j.status = 'active'
        ORDER BY vector_similarity DESC
        LIMIT ${topN}
      `);
      vectorResults = (vecResult.rows || []).map((r: any) => ({ ...r, skills: typeof r.skills === 'string' ? JSON.parse(r.skills) : r.skills }));
    } catch {
      const all = await db.select().from(jobs).where(eq(jobs.status, "active")).limit(topN);
      vectorResults = all.map((j) => ({ ...j, vector_similarity: 0.5 }));
    }

    if (vectorResults.length === 0) {
      activeJobs = await db.select().from(jobs).where(eq(jobs.status, "active")).limit(200);
    } else {
      activeJobs = vectorResults;
    }

    const scored = activeJobs.map((job: any) => {
      const jobSkills: string[] = (job.skills || []).map((s: string) => s.toLowerCase().trim()).filter(Boolean);

      const exactMatchSkills = jobSkills.filter((js) => skillLower.includes(js));

      const transferableMatchSkills = jobSkills.filter(
        (js) => !exactMatchSkills.includes(js) && inferredSkills.some((inf) => js.includes(inf) || inf.includes(js))
      );

      const roleCompatible = inferredTransferableRoles.some(
        (r) => job.title?.toLowerCase().includes(r.toLowerCase().split(" ").slice(0, 2).join(" "))
      );

      const skillScore = jobSkills.length > 0
        ? Math.round(((exactMatchSkills.length + transferableMatchSkills.length * 0.6) / Math.max(jobSkills.length, 1)) * 35)
        : 15;

      const vecScore = job.vector_similarity ? Math.round(job.vector_similarity * 25) : 10;

      const titleWords = (job.title || "").toLowerCase().split(/\s+/);
      const queryWords = queryText.toLowerCase().split(/\s+/);
      const titleOverlap = titleWords.filter((w: string) => queryWords.includes(w) && w.length > 2).length;
      const titleScore = Math.min(15, Math.round((titleOverlap / Math.max(titleWords.length, 1)) * 15));

      let expScore = 0;
      if (experience && job.experience_level) {
        const levels = ["entry", "mid", "senior", "lead", "executive", "principal"];
        const ci = levels.indexOf(experience.toLowerCase());
        const ji = levels.indexOf(job.experience_level.toLowerCase());
        if (ci >= 0 && ji >= 0) expScore = Math.max(0, 10 - Math.abs(ci - ji) * 2);
        else if (job.experience_level.toLowerCase().includes(experience.toLowerCase())) expScore = 10;
        else expScore = 5;
      } else {
        expScore = 5;
      }

      let locScore = 0;
      if (location && job.location) {
        const cl = location.toLowerCase();
        const jl = job.location.toLowerCase();
        if (cl.includes(jl) || jl.includes(cl)) locScore = 10;
        else {
          const cWords = cl.split(/[\s,]+/);
          const jWords = jl.split(/[\s,]+/);
          const common = cWords.filter((w: string) => jWords.includes(w) && w.length > 2).length;
          locScore = Math.min(10, common * 3);
        }
      } else {
        locScore = 5;
      }

      const visaBonus = job.visa_sponsored ? 5 : 0;

      const hiddenTalentBonus = (transferableMatchSkills.length > 0 && exactMatchSkills.length === 0) ? 8 : 0;

      const totalScore = Math.min(100, skillScore + vecScore + titleScore + expScore + locScore + visaBonus + hiddenTalentBonus);

      return {
        jobId: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
        employmentType: job.employment_type,
        experienceLevel: job.experience_level,
        industry: job.industry,
        visaSponsored: job.visa_sponsored,
        isRemote: job.is_remote,
        postedAt: job.posted_at,
        matchScore: totalScore,
        vectorScore: vecScore,
        skillMatchScore: Math.round((exactMatchSkills.length / Math.max(jobSkills.length, 1)) * 100),
        exactMatchSkills,
        transferableMatchSkills,
        hiddenTalent: hiddenTalentBonus > 0,
        sponsorshipScore: visaBonus > 0 ? Math.min(95, 60 + exactMatchSkills.length * 5) : 30,
        skillGaps: jobSkills.filter((js) => !skillLower.includes(js)).slice(0, 8),
        reasons: [
          ...(exactMatchSkills.length > 0 ? [`${exactMatchSkills.length} direct skill match${exactMatchSkills.length > 1 ? "es" : ""}`] : []),
          ...(transferableMatchSkills.length > 0 ? [`${transferableMatchSkills.length} transferable skill${transferableMatchSkills.length > 1 ? "s" : ""} detected`] : []),
          ...(vecScore > 15 ? ["Strong semantic profile fit"] : []),
          ...(titleScore > 8 ? ["Title aligns with your background"] : []),
          ...(locScore >= 10 ? ["Location match"] : [locScore > 0 ? "Partial location match" : ""]),
          ...(visaBonus > 0 ? ["Visa sponsorship available"] : []),
        ].filter(Boolean),
      };
    });

    const sorted = scored
      .sort((a: any, b: any) => b.matchScore - a.matchScore)
      .slice(0, topN);

    const hiddenGems = sorted.filter((j: any) => j.hiddenTalent);
    const sponsorshipEligible = sorted.filter((j: any) => j.visaSponsored && j.matchScore > 50);

    res.json({
      matches: sorted,
      hiddenGems: hiddenGems.slice(0, 5),
      sponsorshipEligible: sponsorshipEligible.slice(0, 5),
      inferredSkills,
      transferableRoles: inferredTransferableRoles,
      totalScored: sorted.length,
    });
  } catch (error: unknown) {
    logger.error({ err: error }, "Error in semantic-match");
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── AI Recruitment Copilot ──────────────────────────────────────

const COPILOT_SYSTEM_PROMPT = `You are OpJobHub's AI Recruitment Copilot — an expert hiring assistant for the Gulf/Middle East job market.
You help recruiters and job seekers with:
- Finding candidates and jobs
- Market insights and salary data
- Resume analysis and improvement
- Career advice and skill recommendations
- Hiring workflow automation

Be concise, professional, and data-driven. Use the conversation history for context.`;

router.post("/copilot", async (req, res) => {
  try {
    const { messages, context } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const lastMessage = messages[messages.length - 1]?.content || "";
    const lower = lastMessage.toLowerCase();

    let marketData = "";
    let jobData = "";
    let skillData = "";

    const searchTerms = extractSearchTerms(lastMessage);
    if (searchTerms.jobs) {
      try {
        const recentJobs = await db.select({
          id: jobs.id, title: jobs.title, company: jobs.company, location: jobs.location,
          salary: jobs.salary, employmentType: jobs.employmentType, experienceLevel: jobs.experienceLevel,
          industry: jobs.industry, visaSponsored: jobs.visaSponsored, isRemote: jobs.isRemote, postedAt: jobs.postedAt,
        }).from(jobs).where(eq(jobs.status, "active")).orderBy(desc(jobs.postedAt)).limit(10);
        jobData = `\nRecent active jobs: ${JSON.stringify(recentJobs.slice(0, 5))}`;
      } catch { /* ignore */ }
    }

    if (searchTerms.market || searchTerms.salary) {
      try {
        const allJobs = await db.select({ skills: jobs.skills, salaryMin: jobs.salaryMin, title: jobs.title, industry: jobs.industry })
          .from(jobs).where(eq(jobs.status, "active")).limit(200);
        const salaryData = allJobs.filter((j) => j.salaryMin).map((j) => j.salaryMin);
        const avgSalary = salaryData.length > 0 ? Math.round(salaryData.reduce((a: number, b: number) => a + b, 0) / salaryData.length) : 0;
        const industries = [...new Set(allJobs.map((j) => j.industry).filter(Boolean))];
        marketData = `\nMarket snapshot: ${allJobs.length} active jobs, average salary ${avgSalary}, industries: ${industries.slice(0, 8).join(", ")}`;
      } catch { /* ignore */ }
    }

    let userSkills: string[] = [];
    if (lower.includes("skill") || lower.includes("match") || lower.includes("candidate")) {
      const words = lastMessage.split(/[\s,]+/);
      const knownSkills = words.filter((w: string) =>
        w.length > 2 && ["react", "node", "python", "java", "aws", "docker", "sql", "management", "engineer", "developer", "design", "marketing", "sales", "finance"].some((k) => w.toLowerCase().includes(k))
      );
      if (knownSkills.length > 0) userSkills = knownSkills;
    }

    const userId = (req as any).user?.id;

    const completion = await openrouter().chat.completions.create({
      model: "openrouter/free",
      messages: [
        { role: "system", content: COPILOT_SYSTEM_PROMPT + marketData + jobData },
        ...messages.slice(-6).map((m: { role: string; content: string }) => ({
          role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
          content: m.content,
        })),
        {
          role: "user",
          content: userSkills.length > 0
            ? `${lastMessage}\n\nContext: The user mentioned these skills/roles: ${userSkills.join(", ")}. Incorporate relevant job market data in your response.`
            : lastMessage,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const reply = completion.choices[0].message.content || "I'm sorry, I couldn't process that request.";

    res.json({ reply, context: { hasMarketData: !!marketData, hasJobData: !!jobData, mentionedSkills: userSkills } });
  } catch (error: unknown) {
    logger.error({ err: error }, "Error in copilot");
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

function extractSearchTerms(text: string): { jobs: boolean; market: boolean; salary: boolean; resume: boolean } {
  const lower = text.toLowerCase();
  return {
    jobs: /\b(find|search|look|job|role|position|opening|vacancy|hiring)\b/.test(lower),
    market: /\b(market|trend|demand|industry|sector|gulf|qatar|dubai|saudi|middle east)\b/.test(lower),
    salary: /\b(salary|pay|compensation|earn|income|wage)\b/.test(lower),
    resume: /\b(resume|cv|optimize|improve|ats|application|apply)\b/.test(lower),
  };
}

async function runAiAnalysis(text: string) {
  const completion = await openrouter().chat.completions.create({
    model: "openrouter/free",
    messages: [
      {
        role: "system",
        content: "You are an expert ATS and Career Intelligence AI. Return ONLY valid JSON with no markdown, no code fences, no explanation.",
      },
      {
        role: "user",
        content: `Analyze this resume text:\n\n${text.slice(0, 3000)}\n\nRespond with ONLY this JSON object (no markdown):\n{"parsed":{"fullName":"","headline":"","skills":[],"experience":[],"education":[]},"scores":{"ats":0,"keyword":0,"readability":0,"skills":0,"market":0},"suggestions":{"missingKeywords":[],"weakAreas":[],"optimizationTips":[]},"marketPosition":{"rank":"","demand":"High","salaryRange":""}}`,
      },
    ],
  });

  const raw = completion.choices[0].message.content || "{}";
  return JSON.parse(stripJsonFences(raw));
}

router.post("/analyze-resume", authMiddleware, upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No resume file provided" });
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const text = await extractTextFromFile(req.file.buffer, req.file.mimetype);

    const [resume] = await db.insert(resumes).values({
      userId,
      fileName: req.file.originalname,
      fileUrl: "internal://resumes/" + req.file.originalname,
      rawText: text,
    }).returning();

    let analysis: any;
    try {
      analysis = await Promise.race([
        runAiAnalysis(text),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT")), 25000)
        ),
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "TIMEOUT") {
        res.status(202).json({ resumeId: resume.id, status: "processing" });

        try {
          analysis = await runAiAnalysis(text);
        } catch (bgErr) {
          logger.error({ err: bgErr }, "Background AI analysis failed");
          await db.update(resumes).set({ parsedData: { error: "Analysis failed" } }).where(eq(resumes.id, resume.id));
          return;
        }

        await db.update(resumes).set({ parsedData: analysis.parsed }).where(eq(resumes.id, resume.id));
        const embedding = await getEmbedding(text);
        await db.insert(resumeEmbeddings).values({ resumeId: resume.id, embedding });
        await db.insert(atsReports).values({
          resumeId: resume.id,
          scores: analysis.scores,
          suggestions: analysis.suggestions,
          marketPosition: analysis.marketPosition,
        });
        return;
      }
      throw err;
    }

    await db.update(resumes).set({ parsedData: analysis.parsed }).where(eq(resumes.id, resume.id));
    const embedding = await getEmbedding(text);
    await db.insert(resumeEmbeddings).values({ resumeId: resume.id, embedding });
    await db.insert(atsReports).values({
      resumeId: resume.id,
      scores: analysis.scores,
      suggestions: analysis.suggestions,
      marketPosition: analysis.marketPosition,
    });

    const matches = await db.execute(sql`
      SELECT j.*, 1 - (je.embedding <=> ${JSON.stringify(embedding)}::vector) as similarity
      FROM ${jobs} j
      JOIN ${jobEmbeddings} je ON j.id = je.job_id
      ORDER BY similarity DESC
      LIMIT 5
    `);

    res.json({ resumeId: resume.id, status: "complete", analysis, matches });
  } catch (error: unknown) {
    logger.error({ err: error }, "Error analyzing resume");
    res.status(500).json({ error: "Failed to analyze resume: " + (error instanceof Error ? error.message : String(error)) });
  }
});

router.get("/analyze-resume/status/:id", authMiddleware, async (req, res) => {
  try {
    const [resume] = await db.select().from(resumes).where(eq(resumes.id, parseInt(req.params.id))).limit(1);
    if (!resume) return res.status(404).json({ error: "Resume not found" });

    if (resume.parsedData && typeof resume.parsedData === "object" && !("error" in (resume.parsedData as object))) {
      const [report] = await db.select().from(atsReports).where(eq(atsReports.resumeId, resume.id)).limit(1);
      res.json({ status: "complete", analysis: { parsed: resume.parsedData, scores: report?.scores, suggestions: report?.suggestions, marketPosition: report?.marketPosition } });
    } else if ((resume.parsedData as any)?.error) {
      res.json({ status: "error", error: (resume.parsedData as any).error });
    } else {
      res.json({ status: "processing" });
    }
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/matches", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const [lastResume] = await db.select()
      .from(resumes)
      .where(eq(resumes.userId, userId))
      .orderBy(sql`${resumes.createdAt} DESC`)
      .limit(1);

    if (!lastResume) return res.json({ matches: [] });

    const [embeddingRow] = await db.select()
      .from(resumeEmbeddings)
      .where(eq(resumeEmbeddings.resumeId, lastResume.id))
      .limit(1);

    if (!embeddingRow) return res.json({ matches: [] });

    const matches = await db.execute(sql`
      SELECT j.*, 1 - (je.embedding <=> ${JSON.stringify(embeddingRow.embedding)}::vector) as similarity
      FROM ${jobs} j
      JOIN ${jobEmbeddings} je ON j.id = je.job_id
      ORDER BY similarity DESC
      LIMIT 10
    `);

    res.json({ matches });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/match-by-profile", async (req, res) => {
  try {
    const { skills = [], experience, location, preferences = [] } = req.body;
    if (!skills.length) {
      return res.status(400).json({ error: "At least one skill is required" });
    }

    const allJobs = await db.select().from(jobs).where(eq(jobs.status, "active")).limit(200);
    const userSkills = skills.map((s: string) => s.toLowerCase().trim());

    const scored = allJobs.map((job) => {
      const jobSkills = ((job.skills ?? []) as string[]).map((s: string) => s.toLowerCase().trim());
      const alignedSkills = jobSkills.filter((js) => userSkills.includes(js));
      const overlapCount = alignedSkills.length;
      const skillScore = jobSkills.length > 0 ? (overlapCount / Math.max(jobSkills.length, userSkills.length)) * 40 : 0;

      let expScore = 0;
      if (experience && job.experienceLevel) {
        const exp = experience.toLowerCase();
        const jobExp = job.experienceLevel.toLowerCase();
        if (jobExp.includes(exp) || exp.includes(jobExp)) expScore = 20;
        else {
          const levels = ["entry", "mid", "senior", "lead", "principal"];
          const ui = levels.indexOf(exp);
          const ji = levels.indexOf(jobExp);
          if (ui >= 0 && ji >= 0) expScore = Math.max(0, 20 - Math.abs(ui - ji) * 5);
        }
      } else if (experience && !job.experienceLevel) {
        expScore = 10;
      } else {
        expScore = 20;
      }

      let locScore = 0;
      if (location && job.location) {
        const loc = location.toLowerCase();
        const jobLoc = job.location.toLowerCase();
        if (jobLoc.includes(loc) || loc.includes(jobLoc)) locScore = 10;
        else {
          const locWords = loc.split(/[\s,]+/);
          const jobLocWords = jobLoc.split(/[\s,]+/);
          const common = locWords.filter((w) => jobLocWords.includes(w) && w.length > 2).length;
          locScore = Math.min(10, common * 3);
        }
      } else if (location && !job.location) {
        locScore = 5;
      } else {
        locScore = 10;
      }

      let prefScore = 0;
      const prefs = preferences.map((p: string) => p.toLowerCase());
      if (prefs.length > 0) {
        if (job.employmentType && prefs.includes(job.employmentType.toLowerCase())) prefScore += 5;
        if (prefs.includes("remote") && job.isRemote) prefScore += 5;
        else if (prefs.includes("hybrid")) prefScore += 2;
      } else {
        prefScore = 10;
      }

      const totalScore = Math.round(skillScore + expScore + locScore + prefScore);
      const skillGaps = jobSkills.filter((js) => !userSkills.includes(js));

      return {
        jobId: job.id,
        title: job.title,
        company: job.company,
        companyLogo: job.companyLogo,
        location: job.location,
        salary: job.salary,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        employmentType: job.employmentType,
        experienceLevel: job.experienceLevel,
        isRemote: job.isRemote,
        isVerified: job.isVerified,
        matchScore: totalScore,
        reasons: [
          ...alignedSkills.slice(0, 3).map((s) => `Your ${s} skill matches a key requirement`),
          ...(expScore >= 15 ? [`Your experience level aligns with this role`] : []),
          ...(locScore >= 8 ? [`Location matches your preference`] : []),
        ],
        alignedSkills,
        skillGaps: skillGaps.slice(0, 5),
        improvementSuggestions:
          skillGaps.length > 0
            ? [
                `Learning ${skillGaps.slice(0, 2).join(" and ")} could boost your match by ${Math.min(30, skillGaps.length * 8)}%`,
              ]
            : ["You have all the skills this job requires!"],
      };
    });

    const matches = scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
    res.json({ matches });
  } catch (error: unknown) {
    logger.error({ err: error }, "Error in match-by-profile");
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/career-gaps", async (req, res) => {
  try {
    const { skills = [], targetRole } = req.body;
    const userSkills = skills.map((s: string) => s.toLowerCase().trim());

    const relevantJobs = targetRole
      ? await db.select().from(jobs).where(and(eq(jobs.status, "active"), sql`LOWER(${jobs.title}) LIKE ${`%${targetRole.toLowerCase()}%`}`)).limit(100)
      : await db.select().from(jobs).where(eq(jobs.status, "active")).limit(100);

    const skillDemand = new Map<string, { count: number; avgSalary: number }>();
    for (const job of relevantJobs) {
      const jobSkills = (job.skills ?? []) as string[];
      for (const skill of jobSkills) {
        const key = skill.toLowerCase().trim();
        if (!skillDemand.has(key)) {
          skillDemand.set(key, { count: 0, avgSalary: 0 });
        }
        const entry = skillDemand.get(key)!;
        entry.count++;
        if (job.salaryMin) entry.avgSalary = (entry.avgSalary * (entry.count - 1) + job.salaryMin) / entry.count;
      }
    }

    const sorted = [...skillDemand.entries()]
      .map(([skill, data]) => ({ skill, demand: data.count, avgSalary: Math.round(data.avgSalary) }))
      .sort((a, b) => b.demand - a.demand);

    const missingSkills = sorted.filter((s) => !userSkills.includes(s.skill)).slice(0, 10);
    const topSkills = sorted.slice(0, 5);

    let aiAdvice = "";
    if (missingSkills.length > 0) {
      const topMissing = missingSkills.slice(0, 3).map((s) => s.skill).join(", ");
      aiAdvice = `Adding ${topMissing} to your skillset could significantly increase your job opportunities. `;
      if (targetRole) {
        const pct = Math.round(((missingSkills[0]?.demand ?? 0) / Math.max(1, relevantJobs.length)) * 100);
        aiAdvice += `For ${targetRole} roles in the Gulf market, these skills appear in ${pct}% of job postings.`;
      }
    } else {
      aiAdvice = "Your skills are well-aligned with the current market demands.";
    }

    res.json({
      marketSkills: topSkills,
      missingSkills,
      aiAdvice,
      totalJobsAnalyzed: relevantJobs.length,
    });
  } catch (error: unknown) {
    logger.error({ err: error }, "Error in career-gaps");
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

export default router;
