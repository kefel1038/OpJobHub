import { Router, type IRouter } from "express";
import { db, jobs } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { authMiddleware, requireRole } from "../lib/auth";

const router: IRouter = Router();

router.get("/jobs", async (_req, res) => {
  const allJobs = await db
    .select()
    .from(jobs)
    .orderBy(desc(jobs.isFeatured), desc(jobs.createdAt));
  res.json(allJobs);
});

router.get("/jobs/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid job id." });
    return;
  }
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) {
    res.status(404).json({ error: "Job not found." });
    return;
  }
  res.json(job);
});

router.post("/jobs", authMiddleware, requireRole("employer", "admin"), async (req, res) => {
  const { title, company, location, salary, description, isFeatured } = req.body ?? {};

  if (
    typeof title !== "string" ||
    typeof company !== "string" ||
    typeof location !== "string" ||
    typeof description !== "string"
  ) {
    res.status(400).json({ error: "title, company, location, and description are required." });
    return;
  }

  const [created] = await db
    .insert(jobs)
    .values({
      title,
      company,
      location,
      salary: typeof salary === "string" ? salary : null,
      description,
      createdBy: req.user!.id,
      isFeatured: Boolean(isFeatured),
    })
    .returning();

  res.status(201).json(created);
});

router.delete("/jobs/:id", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid job id." });
    return;
  }
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) {
    res.status(404).json({ error: "Job not found." });
    return;
  }
  if (req.user!.role !== "admin" && job.createdBy !== req.user!.id) {
    res.status(403).json({ error: "Forbidden." });
    return;
  }
  await db.delete(jobs).where(eq(jobs.id, id));
  res.json({ success: true });
});

export default router;
