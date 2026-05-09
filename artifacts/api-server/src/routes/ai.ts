import { Router } from "express";
import multer from "multer";
import { openai, getEmbedding } from "../lib/openai";
import { extractTextFromFile } from "../lib/extractor";
import { db, resumes, resumeEmbeddings, atsReports, jobs, jobEmbeddings } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
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

  } catch (error: any) {
    logger.error({ err: error }, "Error analyzing resume");
    res.status(500).json({ error: "Failed to analyze resume: " + error.message });
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
