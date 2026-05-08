import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, users } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, authMiddleware } from "../lib/auth";

const router: IRouter = Router();

const VALID_ROLES = new Set(["jobseeker", "employer", "admin"]);

router.post("/register", async (req, res) => {
  const { email, password, role } = req.body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters." });
    return;
  }

  const userRole = typeof role === "string" && VALID_ROLES.has(role) && role !== "admin"
    ? role
    : "jobseeker";

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered." });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const [created] = await db
    .insert(users)
    .values({ email, password: hashed, role: userRole })
    .returning({ id: users.id, email: users.email, role: users.role });

  const token = signToken({ id: created.id, email: created.email, role: created.role });
  res.status(201).json({ token, user: created });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role },
  });
});

router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

router.post("/register-admin", async (req, res) => {
  const { email, password, adminSecret } = req.body ?? {};
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof adminSecret !== "string"
  ) {
    res.status(400).json({ error: "Email, password, and adminSecret are required." });
    return;
  }
  if (!process.env.ADMIN_PASSWORD) {
    res.status(500).json({ error: "Admin signup is not configured." });
    return;
  }
  if (adminSecret !== process.env.ADMIN_PASSWORD) {
    res.status(403).json({ error: "Invalid admin secret." });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters." });
    return;
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered." });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const [created] = await db
    .insert(users)
    .values({ email, password: hashed, role: "admin" })
    .returning({ id: users.id, email: users.email, role: users.role });

  const token = signToken({ id: created.id, email: created.email, role: created.role });
  res.status(201).json({ token, user: created });
});

export default router;
