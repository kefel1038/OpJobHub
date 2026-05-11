import { IncomingMessage, ServerResponse, createServer } from "node:http";

function json(res: ServerResponse, status: number, body: unknown) {
  try {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  } catch {
    /* response already sent or connection closed */
  }
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

      res.once("finish", () => { responded = true; resolve(); });
      res.once("close", () => { if (!responded) resolve(); });

      const timeout = setTimeout(() => {
        if (!responded) {
          responded = true;
          json(res, 500, { error: "Handler did not respond within 25s" });
          resolve();
        }
      }, 25000);

      // Use app.handle() which is the proper way to manually dispatch through Express.
      // Setting the next callback allows Express to call us when done.
      (fullApp as any).handle(req, res, (err?: unknown) => {
        clearTimeout(timeout);
        if (responded) return;
        if (err) {
          const message = err instanceof Error ? err.message : String(err);
          json(res, 500, { error: "Unhandled error", message });
        } else {
          json(res, 404, { error: "Not found" });
        }
        responded = true;
        resolve();
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
