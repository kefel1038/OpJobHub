import { Router, type IRouter } from "express";
import { db, users, jobs } from "@workspace/db";
import { eq, sql, count } from "drizzle-orm";
import { authMiddleware, requireRole } from "../lib/auth";

const router: IRouter = Router();

router.use("/admin", authMiddleware, requireRole("admin"));

router.get("/admin/stats", async (_req, res) => {
  const [{ totalUsers }] = await db
    .select({ totalUsers: count() })
    .from(users);
  const [{ totalJobs }] = await db.select({ totalJobs: count() }).from(jobs);
  const [{ featuredJobs }] = await db
    .select({ featuredJobs: count() })
    .from(jobs)
    .where(eq(jobs.isFeatured, true));

  const roleRows = await db
    .select({ role: users.role, count: count() })
    .from(users)
    .groupBy(users.role);

  const usersByRole: Record<string, number> = {
    jobseeker: 0,
    employer: 0,
    admin: 0,
  };
  for (const row of roleRows) {
    usersByRole[row.role] = Number(row.count);
  }

  res.json({
    totalUsers: Number(totalUsers),
    totalJobs: Number(totalJobs),
    featuredJobs: Number(featuredJobs),
    usersByRole,
  });
});

router.get("/admin/users", async (_req, res) => {
  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(sql`${users.createdAt} DESC`);
  res.json(allUsers);
});

const VALID_ROLES = new Set(["jobseeker", "employer", "admin"]);

router.patch("/admin/users/:id/role", async (req, res) => {
  const id = Number(req.params.id);
  const { role } = req.body ?? {};
  if (Number.isNaN(id) || typeof role !== "string" || !VALID_ROLES.has(role)) {
    res.status(400).json({ error: "Invalid id or role." });
    return;
  }
  if (id === req.user!.id && role !== "admin") {
    res.status(400).json({ error: "You cannot demote yourself." });
    return;
  }
  const [updated] = await db
    .update(users)
    .set({ role })
    .where(eq(users.id, id))
    .returning({ id: users.id, email: users.email, role: users.role });
  if (!updated) {
    res.status(404).json({ error: "User not found." });
    return;
  }
  res.json(updated);
});

router.delete("/admin/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id." });
    return;
  }
  if (id === req.user!.id) {
    res.status(400).json({ error: "You cannot delete your own account." });
    return;
  }
  const result = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
  if (result.length === 0) {
    res.status(404).json({ error: "User not found." });
    return;
  }
  res.json({ success: true });
});

export default router;
