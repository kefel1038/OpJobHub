import express from "express";

const app = express();

// Health endpoints respond immediately without loading the full app
app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

// Lazy-load and mount the full Express app for all other routes
let fullApp: express.Express | null = null;

app.use(async (req, res, next) => {
  if (req.path === "/api/healthz" || req.path === "/api/health") {
    next();
    return;
  }

  if (!fullApp) {
    try {
      const mod = await import("../artifacts/api-server/dist/vercel-handler.mjs");
      fullApp = mod.default;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({
        error: "App load failed",
        message,
        stack: err instanceof Error ? err.stack?.split("\n").slice(0, 5).join("\n") : undefined,
      });
      return;
    }
  }

  fullApp(req, res);
});

// Not strictly needed — Express returns 404 by default, but keep for explicitness
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

export default app;
