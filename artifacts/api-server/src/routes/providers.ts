import { Router, type IRouter } from "express";
import { eq, sql, and, gte } from "drizzle-orm";
import { db, providersTable, historyTable, modelsTable } from "@workspace/db";
import {
  CreateProviderBody,
  UpdateProviderBody,
  UpdateProviderParams,
  GetProviderParams,
  DeleteProviderParams,
  GetProviderModelsParams,
  TestProviderParams,
} from "@workspace/api-zod";
import { detectProvider } from "../lib/detection";
import { listModels, testProvider } from "../lib/providerAdapter";

const router: IRouter = Router();

// GET /providers
router.get("/providers", async (req, res): Promise<void> => {
  const providers = await db.select().from(providersTable).orderBy(providersTable.createdAt);
  // Mask API keys
  const masked = providers.map((p) => ({
    ...p,
    apiKey: p.apiKey ? `...${p.apiKey.slice(-4)}` : null,
  }));
  res.json(masked);
});

// POST /providers
router.post("/providers", async (req, res): Promise<void> => {
  const parsed = CreateProviderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  // Run detection if apiKey/baseUrl provided and no explicit type
  let detectedType: string | null = null;
  let confidence: number | null = null;
  if (data.apiKey || data.baseUrl || data.endpoint) {
    const detection = detectProvider(data.apiKey, data.baseUrl, data.endpoint);
    if (detection.detected) {
      detectedType = detection.providerType;
      confidence = detection.confidence;
    }
  }

  const [provider] = await db.insert(providersTable).values({
    name: data.name,
    providerType: data.providerType ?? "custom",
    apiKey: data.apiKey,
    baseUrl: data.baseUrl,
    model: data.model,
    customHeaders: data.customHeaders,
    organizationId: data.organizationId,
    endpoint: data.endpoint,
    enabled: data.enabled ?? true,
    detectedType,
    confidence,
  }).returning();

  res.status(201).json({ ...provider, apiKey: provider.apiKey ? `...${provider.apiKey.slice(-4)}` : null });
});

// GET /providers/:id
router.get("/providers/:id", async (req, res): Promise<void> => {
  const params = GetProviderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [provider] = await db.select().from(providersTable).where(eq(providersTable.id, params.data.id));
  if (!provider) {
    res.status(404).json({ error: "Provider not found" });
    return;
  }

  res.json({ ...provider, apiKey: provider.apiKey ? `...${provider.apiKey.slice(-4)}` : null });
});

// PATCH /providers/:id
router.patch("/providers/:id", async (req, res): Promise<void> => {
  const params = UpdateProviderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProviderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.providerType !== undefined) updateData.providerType = data.providerType;
  if (data.baseUrl !== undefined) updateData.baseUrl = data.baseUrl;
  if (data.model !== undefined) updateData.model = data.model;
  if (data.customHeaders !== undefined) updateData.customHeaders = data.customHeaders;
  if (data.organizationId !== undefined) updateData.organizationId = data.organizationId;
  if (data.endpoint !== undefined) updateData.endpoint = data.endpoint;
  if (data.enabled !== undefined) updateData.enabled = data.enabled;

  // Only update API key if a new non-masked value is provided
  if (data.apiKey !== undefined && !data.apiKey.startsWith("...")) {
    updateData.apiKey = data.apiKey;
    // Re-detect if key changed
    const detection = detectProvider(data.apiKey, data.baseUrl, data.endpoint);
    if (detection.detected) {
      updateData.detectedType = detection.providerType;
      updateData.confidence = detection.confidence;
    }
  }

  const [provider] = await db.update(providersTable)
    .set(updateData)
    .where(eq(providersTable.id, params.data.id))
    .returning();

  if (!provider) {
    res.status(404).json({ error: "Provider not found" });
    return;
  }

  res.json({ ...provider, apiKey: provider.apiKey ? `...${provider.apiKey.slice(-4)}` : null });
});

// DELETE /providers/:id
router.delete("/providers/:id", async (req, res): Promise<void> => {
  const params = DeleteProviderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(providersTable).where(eq(providersTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Provider not found" });
    return;
  }

  res.sendStatus(204);
});

// GET /providers/:id/models
router.get("/providers/:id/models", async (req, res): Promise<void> => {
  const params = GetProviderModelsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [provider] = await db.select().from(providersTable).where(eq(providersTable.id, params.data.id));
  if (!provider) {
    res.status(404).json({ error: "Provider not found" });
    return;
  }

  try {
    const models = await listModels(provider);
    res.json(models);
  } catch (err) {
    req.log.warn({ err }, "Failed to fetch models");
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to fetch models" });
  }
});

// POST /providers/:id/test
router.post("/providers/:id/test", async (req, res): Promise<void> => {
  const params = TestProviderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [provider] = await db.select().from(providersTable).where(eq(providersTable.id, params.data.id));
  if (!provider) {
    res.status(404).json({ error: "Provider not found" });
    return;
  }

  const result = await testProvider(provider);
  res.json(result);
});

// GET /dashboard/stats
router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [providers, allHistory, todayHistory] = await Promise.all([
    db.select().from(providersTable).where(eq(providersTable.enabled, true)),
    db.select({ id: providersTable.id }).from(providersTable),
    db.select().from(historyTable).where(gte(historyTable.createdAt, today)),
  ]);

  // Count saved models from DB
  const modelCount = await db.select({ count: sql<number>`count(*)` }).from(modelsTable);

  const requestsToday = todayHistory.length;
  const tokensToday = todayHistory.reduce((acc, h) => acc + (h.totalTokens ?? 0), 0);
  const costToday = todayHistory.reduce((acc, h) => acc + (h.costEstimate ?? 0), 0);

  // Requests by provider
  const providerMap = new Map<number, { providerName: string; requestCount: number; tokensUsed: number; costEstimate: number }>();
  for (const prov of providers) {
    providerMap.set(prov.id, { providerName: prov.name, requestCount: 0, tokensUsed: 0, costEstimate: 0 });
  }
  for (const h of todayHistory) {
    const entry = providerMap.get(h.providerId);
    if (entry) {
      entry.requestCount++;
      entry.tokensUsed += h.totalTokens ?? 0;
      entry.costEstimate += h.costEstimate ?? 0;
    }
  }

  // Recent activity (last 5)
  const recentActivity = await db
    .select()
    .from(historyTable)
    .orderBy(sql`${historyTable.createdAt} desc`)
    .limit(5);

  res.json({
    connectedProviders: providers.length,
    availableModels: Number(modelCount[0]?.count ?? 0),
    requestsToday,
    tokensToday,
    costToday,
    requestsByProvider: Array.from(providerMap.values()).filter((p) => p.requestCount > 0),
    recentActivity,
  });
});

export default router;
