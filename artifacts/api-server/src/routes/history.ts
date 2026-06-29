import { Router, type IRouter } from "express";
import { eq, desc, like, and, sql } from "drizzle-orm";
import { db, historyTable, providersTable } from "@workspace/db";
import {
  CreateHistoryBody,
  UpdateHistoryBody,
  UpdateHistoryParams,
  GetHistoryParams,
  DeleteHistoryParams,
  ListHistoryQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /history
router.get("/history", async (req, res): Promise<void> => {
  const query = ListHistoryQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { search, providerId, starred, limit = 50, offset = 0 } = query.data;

  // Build conditions
  const conditions: ReturnType<typeof eq>[] = [];
  if (providerId !== undefined) conditions.push(eq(historyTable.providerId, providerId));
  if (starred !== undefined) conditions.push(eq(historyTable.starred, starred));
  if (search) conditions.push(like(historyTable.model, `%${search}%`));

  const whereClause = conditions.length > 0
    ? conditions.length === 1 ? conditions[0] : and(...conditions)
    : undefined;

  const [items, countResult] = await Promise.all([
    whereClause
      ? db.select({
          id: historyTable.id,
          providerId: historyTable.providerId,
          providerName: providersTable.name,
          model: historyTable.model,
          requestType: historyTable.requestType,
          status: historyTable.status,
          latencyMs: historyTable.latencyMs,
          promptTokens: historyTable.promptTokens,
          completionTokens: historyTable.completionTokens,
          totalTokens: historyTable.totalTokens,
          costEstimate: historyTable.costEstimate,
          starred: historyTable.starred,
          rawRequest: historyTable.rawRequest,
          rawResponse: historyTable.rawResponse,
          errorMessage: historyTable.errorMessage,
          createdAt: historyTable.createdAt,
        })
          .from(historyTable)
          .leftJoin(providersTable, eq(historyTable.providerId, providersTable.id))
          .where(whereClause)
          .orderBy(desc(historyTable.createdAt))
          .limit(limit ?? 50)
          .offset(offset ?? 0)
      : db.select({
          id: historyTable.id,
          providerId: historyTable.providerId,
          providerName: providersTable.name,
          model: historyTable.model,
          requestType: historyTable.requestType,
          status: historyTable.status,
          latencyMs: historyTable.latencyMs,
          promptTokens: historyTable.promptTokens,
          completionTokens: historyTable.completionTokens,
          totalTokens: historyTable.totalTokens,
          costEstimate: historyTable.costEstimate,
          starred: historyTable.starred,
          rawRequest: historyTable.rawRequest,
          rawResponse: historyTable.rawResponse,
          errorMessage: historyTable.errorMessage,
          createdAt: historyTable.createdAt,
        })
          .from(historyTable)
          .leftJoin(providersTable, eq(historyTable.providerId, providersTable.id))
          .orderBy(desc(historyTable.createdAt))
          .limit(limit ?? 50)
          .offset(offset ?? 0),
    whereClause
      ? db.select({ count: sql<number>`count(*)` }).from(historyTable).where(whereClause)
      : db.select({ count: sql<number>`count(*)` }).from(historyTable),
  ]);

  res.json({
    items,
    total: Number(countResult[0]?.count ?? 0),
  });
});

// POST /history
router.post("/history", async (req, res): Promise<void> => {
  const parsed = CreateHistoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [entry] = await db.insert(historyTable).values(parsed.data).returning();
  res.status(201).json(entry);
});

// GET /history/:id
router.get("/history/:id", async (req, res): Promise<void> => {
  const params = GetHistoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [entry] = await db.select({
    id: historyTable.id,
    providerId: historyTable.providerId,
    providerName: providersTable.name,
    model: historyTable.model,
    requestType: historyTable.requestType,
    status: historyTable.status,
    latencyMs: historyTable.latencyMs,
    promptTokens: historyTable.promptTokens,
    completionTokens: historyTable.completionTokens,
    totalTokens: historyTable.totalTokens,
    costEstimate: historyTable.costEstimate,
    starred: historyTable.starred,
    rawRequest: historyTable.rawRequest,
    rawResponse: historyTable.rawResponse,
    errorMessage: historyTable.errorMessage,
    createdAt: historyTable.createdAt,
  })
    .from(historyTable)
    .leftJoin(providersTable, eq(historyTable.providerId, providersTable.id))
    .where(eq(historyTable.id, params.data.id));

  if (!entry) {
    res.status(404).json({ error: "History entry not found" });
    return;
  }

  res.json(entry);
});

// PATCH /history/:id
router.patch("/history/:id", async (req, res): Promise<void> => {
  const params = UpdateHistoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateHistoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [entry] = await db.update(historyTable)
    .set(parsed.data)
    .where(eq(historyTable.id, params.data.id))
    .returning();

  if (!entry) {
    res.status(404).json({ error: "History entry not found" });
    return;
  }

  res.json(entry);
});

// DELETE /history/:id
router.delete("/history/:id", async (req, res): Promise<void> => {
  const params = DeleteHistoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(historyTable).where(eq(historyTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "History entry not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
