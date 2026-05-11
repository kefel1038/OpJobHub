import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Diagnostic: does a simple route through the sub-app work?
app.get("/api/_ping", (_req, res) => {
  res.json({ pong: true });
});

app.use("/api", router);

// Global error handler — always returns JSON
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : String(err);
  try { logger.error({ err }, "Unhandled error"); } catch { /* logger unavailable */ }
  try { res.status(500).json({ error: message }); } catch { _next(err); }
});

export default app;
