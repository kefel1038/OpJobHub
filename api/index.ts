import { IncomingMessage, ServerResponse } from "node:http";

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

export default async function handler(
  req: IncomingMessage & { query?: Record<string, string>; body?: unknown },
  res: ServerResponse,
) {
  const path = req.url ?? "/";

  if (path === "/api/healthz") {
    json(res, 200, { status: "ok" });
    return;
  }

  if (path === "/api/health") {
    json(res, 200, { status: "ok", version: "1.0.0" });
    return;
  }

  try {
    const mod = await import("../artifacts/api-server/dist/vercel-handler.mjs");
    return mod.default(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    json(res, 500, {
      error: "App load failed",
      message,
      stack: err instanceof Error ? err.stack?.split("\n").slice(0, 5).join("\n") : undefined,
    });
  }
}
