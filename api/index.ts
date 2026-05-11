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

  // Health endpoints respond immediately without importing the full app
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
    const fullApp = mod.default as (
      req: IncomingMessage,
      res: ServerResponse,
      next?: (err?: unknown) => void,
    ) => void;

    await new Promise<void>((resolve) => {
      if ((res as ServerResponse).writableEnded) {
        resolve();
        return;
      }

      let responded = false;
      let settleTimer: NodeJS.Timeout | null = null;

      const done = () => {
        if (responded) return;
        responded = true;
        if (settleTimer) clearTimeout(settleTimer);
        resolve();
      };

      res.once("finish", done);
      res.once("close", done);

      // Safety net — if Express hangs for 25s, send fallback response
      settleTimer = setTimeout(() => {
        if (!responded) {
          responded = true;
          json(res, 500, { error: "Express did not send a response within 25s" });
          resolve();
        }
      }, 25000);

      fullApp(req, res, (err?: unknown) => {
        if (!responded) {
          if (err) {
            const message = err instanceof Error ? err.message : String(err);
            json(res, 500, { error: "Unhandled error", message });
          } else {
            json(res, 404, { error: "Not found" });
          }
          done();
        }
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    json(res, 500, {
      error: "App load failed",
      message,
      stack: err instanceof Error ? err.stack?.split("\n").slice(0, 5).join("\n") : undefined,
    });
  }
}
