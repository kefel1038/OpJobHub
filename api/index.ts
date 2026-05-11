import express from "express";

const app = express();

app.get("/api/healthz", (_req: any, res: any) => {
  res.json({ status: "ok" });
});

app.get("/api/health", (_req: any, res: any) => {
  res.json({ status: "ok", version: "1.0.0" });
});

app.all("*", async (req: any, res: any) => {
  try {
    const mod = await import("../artifacts/api-server/src/app");
    return mod.default(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      error: "App load failed",
      message,
      stack: err instanceof Error ? err.stack?.split("\n").slice(0, 5).join("\n") : undefined,
    });
  }
});

export default app;
