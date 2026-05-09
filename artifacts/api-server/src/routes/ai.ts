import { Router } from "express";
import multer from "multer";
import { openai, getEmbedding } from "../lib/openai";
import { extractTextFromFile } from "../lib/extractor";
import { db, resumes, resumeEmbeddings, atsReports, jobs, jobEmbeddings } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";
import { logger } from "../lib/logger";
import { authMiddleware } from "../lib/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

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
    
    // 1. Semantic Extraction & ATS Scoring via GPT
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert ATS (Applicant Tracking System) and Career Intelligence AI. Analyze the provided resume text and extract structured information, calculate ATS scores, and provide optimization suggestions. Return ONLY valid JSON.",
        },
        {
          role: "user",
          content: `Analyze this resume text:\n\n${text}\n\nReturn JSON with following structure:
          {
            "parsed": { "fullName": "", "headline": "", "skills": [], "experience": [], "education": [] },
            "scores": { "ats": 0-100, "keyword": 0-100, "readability": 0-100, "skills": 0-100, "market": 0-100 },
            "suggestions": { "missingKeywords": [], "weakAreas": [], "optimizationTips": [] },
            "marketPosition": { "rank": "", "demand": "High/Medium/Low", "salaryRange": "" }
          }`
        }
      ],
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(completion.choices[0].message.content || "{}");

    // 2. Store Resume
    const [resume] = await db.insert(resumes).values({
      userId,
      fileName: req.file.originalname,
      fileUrl: "internal://resumes/" + req.file.originalname, // Placeholder
      rawText: text,
      parsedData: analysis.parsed,
    }).returning();

    // 3. Generate Embedding & Store
    const embedding = await getEmbedding(text);
    await db.insert(resumeEmbeddings).values({
      resumeId: resume.id,
      embedding,
    });

    // 4. Store ATS Report
    await db.insert(atsReports).values({
      resumeId: resume.id,
      scores: analysis.scores,
      suggestions: analysis.suggestions,
      marketPosition: analysis.marketPosition,
    });

    // 5. Semantic Job Matching (using pgvector)
    // Find top 5 matching jobs
    const matches = await db.execute(sql`
      SELECT j.*, 1 - (je.embedding <=> ${JSON.stringify(embedding)}::vector) as similarity
      FROM ${jobs} j
      JOIN ${jobEmbeddings} je ON j.id = je.job_id
      ORDER BY similarity DESC
      LIMIT 5
    `);

    res.json({
      resumeId: resume.id,
      analysis,
      matches,
    });

  } catch (error: unknown) {
    logger.error({ err: error }, "Error analyzing resume");
    res.status(500).json({ error: "Failed to analyze resume: " + (error instanceof Error ? error.message : String(error)) });
  }
});

router.get("/matches", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Get the latest resume and its embedding
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

// ─── Profile-Based Matching (no resume required) ────────────────
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

      // 1. Skill overlap (40%)
      const alignedSkills = jobSkills.filter((js) => userSkills.includes(js));
      const overlapCount = alignedSkills.length;
      const skillScore = jobSkills.length > 0 ? (overlapCount / Math.max(jobSkills.length, userSkills.length)) * 40 : 0;

      // 2. Experience fit (20%)
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
        expScore = 10; // neutral
      } else {
        expScore = 20; // no filter — full marks
      }

      // 3. Location match (10%)
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

      // 4. Preference match (10%)
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

// ─── Career Gap Analysis ────────────────────────────────────────
router.post("/career-gaps", async (req, res) => {
  try {
    const { skills = [], targetRole } = req.body;
    const userSkills = skills.map((s: string) => s.toLowerCase().trim());

    // Find active jobs, optionally filtered by target role
    const relevantJobs = targetRole
      ? await db.select().from(jobs).where(and(eq(jobs.status, "active"), sql`LOWER(${jobs.title}) LIKE ${`%${targetRole.toLowerCase()}%`}`)).limit(100)
      : await db.select().from(jobs).where(eq(jobs.status, "active")).limit(100);

    // Count skill demand
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

    // Sort by demand
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
