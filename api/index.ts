import express from "express";

const app = express();

app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

// Lazy-load and mount the full Express app on first non-health request
let fullAppLoaded = false;

app.use(async (req, res, next) => {
  if (req.path === "/api/healthz" || req.path === "/api/health") {
    next();
    return;
  }

  if (!fullAppLoaded) {
    try {
      const mod = await import("../artifacts/api-server/dist/vercel-handler.mjs");
      const fullApp = mod.default as express.Express;
      app.use(fullApp);
      fullAppLoaded = true;
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

  next();
});

// Catch-all 404 (only reached if full app doesn't handle the route)
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

export default app;
