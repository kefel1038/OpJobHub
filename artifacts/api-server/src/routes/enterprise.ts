import { Router, type Request, type Response } from "express";
import { authMiddleware, requireRole } from "../lib/auth";
import { tenantOrchestrator } from "../services/enterprise/tenant-orchestrator";
import { apiGovernance } from "../services/enterprise/api-governance";
import { enterpriseApiGateway } from "../services/enterprise/enterprise-api-gateway";
import { partnerNetworkService } from "../services/enterprise/partner-network";
import { signalStream } from "../services/enterprise/signal-stream";

const router = Router();
const requireAdmin = requireRole("admin");
const requireEmployerOrAdmin = requireRole("employer", "admin");

// ─── API Key Auth Middleware ──────────────────────────────

async function enterpriseAuth(req: Request, res: Response, next: () => void) {
  const apiKey = req.headers["x-api-key"] as string;
  if (!apiKey) {
    res.status(401).json({ error: "Missing x-api-key header" });
    return;
  }
  const validation = await tenantOrchestrator.validateApiKey(apiKey);
  if (!validation.valid) {
    res.status(401).json({ error: "Invalid or expired API key" });
    return;
  }
  (req as any).enterpriseTenant = validation.tenant;
  (req as any).enterpriseKey = validation.key;
  next();
}

async function governanceMiddleware(req: Request, res: Response, next: () => void) {
  const tenant = (req as any).enterpriseTenant;
  const key = (req as any).enterpriseKey;
  const start = Date.now();
  const ctx = {
    tenantId: tenant?.id,
    apiKeyId: key?.id,
    method: req.method,
    path: req.path,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    rateLimitTier: key?.rateLimitTier ?? "standard",
  };
  const governance = await apiGovernance.checkAccess(ctx);
  if (!governance.allowed) {
    res.status(429).json({ error: governance.reason });
    return;
  }
  const originalJson = res.json.bind(res);
  res.json = function (body: unknown) {
    const duration = Date.now() - start;
    apiGovernance.recordAccess(ctx, res.statusCode, duration).catch(() => {});
    return originalJson(body);
  };
  next();
}

// ─── Tenant Management ───────────────────────────────────

router.post("/enterprise/tenants", authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, slug, tenantType, industry, region, size, contactName, contactEmail, domain, features } = req.body ?? {};
    if (!name || !slug || !tenantType) {
      res.status(400).json({ error: "name, slug, and tenantType are required" });
      return;
    }
    const tenant = await tenantOrchestrator.createTenant({ name, slug, tenantType, industry, region, size, contactName, contactEmail, domain, features });
    res.json(tenant);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/enterprise/tenants", authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const activeOnly = req.query.activeOnly !== "false";
    const tenants = await tenantOrchestrator.listTenants(activeOnly);
    res.json({ tenants });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/enterprise/tenants/:id", authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const tenant = await tenantOrchestrator.getTenant(parseInt(req.params.id as string));
    if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }
    res.json(tenant);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.put("/enterprise/tenants/:id", authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const tenant = await tenantOrchestrator.updateTenant(parseInt(req.params.id as string), req.body ?? {});
    if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }
    res.json(tenant);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/enterprise/stats", authMiddleware, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const stats = await tenantOrchestrator.getTenantStats();
    res.json(stats);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── API Key Management ──────────────────────────────────

router.post("/enterprise/api-keys", authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { tenantId, name, permissions, rateLimitTier, expiresAt } = req.body ?? {};
    if (!tenantId || !name) {
      res.status(400).json({ error: "tenantId and name are required" });
      return;
    }
    const result = await tenantOrchestrator.createApiKey(tenantId, { name, permissions: permissions ?? [], rateLimitTier, expiresAt });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/enterprise/api-keys/:tenantId", authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const keys = await tenantOrchestrator.listApiKeys(parseInt(req.params.tenantId as string));
    res.json({ keys });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/enterprise/api-keys/:id/revoke", authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.body ?? {};
    if (!tenantId) { res.status(400).json({ error: "tenantId is required" }); return; }
    await tenantOrchestrator.revokeApiKey(parseInt(req.params.id as string), tenantId);
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Quota Management ────────────────────────────────────

router.get("/enterprise/quotas/:tenantId", authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const quotas = await tenantOrchestrator.getQuotas(parseInt(req.params.tenantId as string));
    res.json({ quotas });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Audit Log ───────────────────────────────────────────

router.get("/enterprise/audit-log/:tenantId", authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const log = await tenantOrchestrator.getAuditLog(parseInt(req.params.tenantId as string), limit);
    res.json({ log });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Partner Network ─────────────────────────────────────

router.post("/enterprise/partners", authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const partner = await partnerNetworkService.registerPartner(req.body ?? {});
    res.json(partner);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/enterprise/partners", authMiddleware, requireEmployerOrAdmin, async (req: Request, res: Response) => {
  try {
    const { partnerType, region, activeOnly, limit } = req.query;
    const partners = await partnerNetworkService.listPartners({
      partnerType: partnerType as string, region: region as string,
      activeOnly: activeOnly !== "false", limit: parseInt(limit as string) || undefined,
    });
    res.json({ partners });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/enterprise/partners/stats", authMiddleware, requireEmployerOrAdmin, async (_req: Request, res: Response) => {
  try { res.json(await partnerNetworkService.getPartnerStats()); }
  catch (error: unknown) { res.status(500).json({ error: error instanceof Error ? error.message : String(error) }); }
});

router.get("/enterprise/partners/:id", authMiddleware, requireEmployerOrAdmin, async (req: Request, res: Response) => {
  try {
    const partner = await partnerNetworkService.getPartner(parseInt(req.params.id as string));
    if (!partner) { res.status(404).json({ error: "Partner not found" }); return; }
    res.json(partner);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.put("/enterprise/partners/:id", authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const partner = await partnerNetworkService.updatePartner(parseInt(req.params.id as string), req.body ?? {});
    if (!partner) { res.status(404).json({ error: "Partner not found" }); return; }
    res.json(partner);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/enterprise/partners/:id/verify", authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const partner = await partnerNetworkService.verifyPartner(parseInt(req.params.id as string));
    if (!partner) { res.status(404).json({ error: "Partner not found" }); return; }
    res.json(partner);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Partner Integrations ────────────────────────────────

router.post("/enterprise/integrations", authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { partnerId, integrationType, name, configuration, tenantId } = req.body ?? {};
    if (!partnerId || !integrationType || !name) {
      res.status(400).json({ error: "partnerId, integrationType, and name are required" });
      return;
    }
    const integration = await partnerNetworkService.createIntegration({ partnerId, integrationType, name, configuration, tenantId });
    res.json(integration);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/enterprise/integrations/:partnerId", authMiddleware, requireEmployerOrAdmin, async (req: Request, res: Response) => {
  try {
    const integrations = await partnerNetworkService.getIntegrations(parseInt(req.params.partnerId as string));
    res.json({ integrations });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.put("/enterprise/integrations/:id/status", authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, errorDetails } = req.body ?? {};
    if (!status) { res.status(400).json({ error: "status is required" }); return; }
    const integration = await partnerNetworkService.updateIntegrationStatus(parseInt(req.params.id as string), status, errorDetails);
    if (!integration) { res.status(404).json({ error: "Integration not found" }); return; }
    res.json(integration);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ─── Signal Subscriptions ─────────────────────────────────

router.post("/enterprise/signal-subscriptions", authMiddleware, requireEmployerOrAdmin, async (req: Request, res: Response) => {
  try {
    const { tenantId, signalType, channel, endpoint, filters, throttleSeconds } = req.body ?? {};
    if (!tenantId || !signalType) {
      res.status(400).json({ error: "tenantId and signalType are required" });
      return;
    }
    const sub = await signalStream.createSubscription({ tenantId, signalType, channel: channel ?? "webhook", endpoint, filters, throttleSeconds });
    res.json(sub);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/enterprise/signal-subscriptions/:tenantId", authMiddleware, requireEmployerOrAdmin, async (req: Request, res: Response) => {
  try {
    const activeOnly = req.query.activeOnly !== "false";
    const subs = await signalStream.getSubscriptions(parseInt(req.params.tenantId as string), activeOnly);
    res.json({ subscriptions: subs });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.put("/enterprise/signal-subscriptions/:id", authMiddleware, requireEmployerOrAdmin, async (req: Request, res: Response) => {
  try {
    const sub = await signalStream.updateSubscription(parseInt(req.params.id as string), req.body ?? {});
    if (!sub) { res.status(404).json({ error: "Subscription not found" }); return; }
    res.json(sub);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.post("/enterprise/signal-subscriptions/detect", authMiddleware, requireEmployerOrAdmin, async (_req: Request, res: Response) => {
  try {
    const events = await signalStream.detectAndEmitAll();
    res.json({ events, count: events.length });
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// ═══════════════════════════════════════════════════════════
// ENTERPRISE INTELLIGENCE APIs (API Key Auth)
// ═══════════════════════════════════════════════════════════

router.get("/enterprise-api/v1/workforce/intelligence", enterpriseAuth, governanceMiddleware, async (req: Request, res: Response) => {
  try {
    const { region, industry, metricType } = req.query;
    const result = await enterpriseApiGateway.getWorkforceIntelligence({
      region: region as string, industry: industry as string, metricType: metricType as string,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/enterprise-api/v1/workforce/forecasts", enterpriseAuth, governanceMiddleware, async (req: Request, res: Response) => {
  try {
    const { role, region, horizon } = req.query;
    const result = await enterpriseApiGateway.getWorkforceForecasts({
      role: role as string, region: region as string, horizon: horizon as string,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/enterprise-api/v1/migration/intelligence", enterpriseAuth, governanceMiddleware, async (req: Request, res: Response) => {
  try {
    const { source, destination, corridor } = req.query;
    const result = await enterpriseApiGateway.getMigrationIntelligence({
      source: source as string, destination: destination as string, corridor: corridor as string,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/enterprise-api/v1/migration/forecasts", enterpriseAuth, governanceMiddleware, async (req: Request, res: Response) => {
  try {
    const { source, destination, corridor } = req.query;
    const result = await enterpriseApiGateway.getCorridorForecasts({
      source: source as string, destination: destination as string, corridor: corridor as string,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/enterprise-api/v1/hiring/predictions", enterpriseAuth, governanceMiddleware, async (req: Request, res: Response) => {
  try {
    const { role, industry, region } = req.query;
    const result = await enterpriseApiGateway.getHiringPredictions({
      role: role as string, industry: industry as string, region: region as string,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/enterprise-api/v1/skills/economy", enterpriseAuth, governanceMiddleware, async (req: Request, res: Response) => {
  try {
    const { skill, industry, region } = req.query;
    const result = await enterpriseApiGateway.getSkillEconomy({
      skill: skill as string, industry: industry as string, region: region as string,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/enterprise-api/v1/graph/query", enterpriseAuth, governanceMiddleware, async (req: Request, res: Response) => {
  try {
    const { query, limit } = req.query;
    if (!query) { res.status(400).json({ error: "query parameter is required" }); return; }
    const result = await enterpriseApiGateway.queryWorkforceGraph({
      query: query as string, limit: parseInt(limit as string) || undefined,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/enterprise-api/v1/graph/explore", enterpriseAuth, governanceMiddleware, async (req: Request, res: Response) => {
  try {
    const { nodeType, nodeId, relationship, depth } = req.query;
    const result = await enterpriseApiGateway.getGraphIntelligence({
      nodeType: nodeType as string, nodeId: nodeId as string,
      relationship: relationship as string,
      depth: parseInt(depth as string) || undefined,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/enterprise-api/v1/sponsorship/intelligence", enterpriseAuth, governanceMiddleware, async (req: Request, res: Response) => {
  try {
    const { source, destination } = req.query;
    const result = await enterpriseApiGateway.getSponsorshipIntelligence({
      source: source as string, destination: destination as string,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/enterprise-api/v1/economic/signals", enterpriseAuth, governanceMiddleware, async (req: Request, res: Response) => {
  try {
    const { signalType, limit } = req.query;
    const result = await enterpriseApiGateway.getEconomicSignals({
      signalType: signalType as string, limit: parseInt(limit as string) || undefined,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/enterprise-api/v1/risk/intelligence", enterpriseAuth, governanceMiddleware, async (req: Request, res: Response) => {
  try {
    const { riskType, region, industry } = req.query;
    const result = await enterpriseApiGateway.getRiskIntelligence({
      riskType: riskType as string, region: region as string, industry: industry as string,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/enterprise-api/v1/market/balance", enterpriseAuth, governanceMiddleware, async (req: Request, res: Response) => {
  try {
    const { role, region } = req.query;
    const result = await enterpriseApiGateway.getMarketBalance({
      role: role as string, region: region as string,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/enterprise-api/v1/ecosystem/metrics", enterpriseAuth, governanceMiddleware, async (_req: Request, res: Response) => {
  try {
    const result = await enterpriseApiGateway.getEcosystemMetrics();
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/enterprise-api/v1/employer/intelligence", enterpriseAuth, governanceMiddleware, async (req: Request, res: Response) => {
  try {
    const { employerId, industry, region } = req.query;
    const result = await enterpriseApiGateway.getEmployerIntelligence({
      employerId: employerId ? parseInt(employerId as string) : undefined,
      industry: industry as string, region: region as string,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/enterprise-api/v1/workforce/flows", enterpriseAuth, governanceMiddleware, async (req: Request, res: Response) => {
  try {
    const { source, destination, timeRange } = req.query;
    const result = await enterpriseApiGateway.getWorkforceFlows({
      source: source as string, destination: destination as string, timeRange: timeRange as string,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

router.get("/enterprise-api/v1/platform/intelligence", enterpriseAuth, governanceMiddleware, async (req: Request, res: Response) => {
  try {
    const { includeWorkforce, includeMigration, includeSkills, includeRisks, includeEconomic, region } = req.query;
    const result = await enterpriseApiGateway.getPlatformIntelligence({
      includeWorkforce: includeWorkforce !== "false",
      includeMigration: includeMigration !== "false",
      includeSkills: includeSkills !== "false",
      includeRisks: includeRisks !== "false",
      includeEconomic: includeEconomic !== "false",
      region: region as string,
    });
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

export default router;
