import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, modelsTable } from "@workspace/db";
import {
  CreateModelBody,
  UpdateModelBody,
  UpdateModelParams,
  DeleteModelParams,
  ListModelsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /models
router.get("/models", async (req, res): Promise<void> => {
  const query = ListModelsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.providerId !== undefined) {
    conditions.push(eq(modelsTable.providerId, query.data.providerId));
  }

  const models = conditions.length > 0
    ? await db.select().from(modelsTable).where(conditions[0]).orderBy(modelsTable.createdAt)
    : await db.select().from(modelsTable).orderBy(modelsTable.createdAt);

  res.json(models);
});

// POST /models
router.post("/models", async (req, res): Promise<void> => {
  const parsed = CreateModelBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [model] = await db.insert(modelsTable).values(parsed.data).returning();
  res.status(201).json(model);
});

// PATCH /models/:id
router.patch("/models/:id", async (req, res): Promise<void> => {
  const params = UpdateModelParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateModelBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [model] = await db.update(modelsTable)
    .set(parsed.data)
    .where(eq(modelsTable.id, params.data.id))
    .returning();

  if (!model) {
    res.status(404).json({ error: "Model not found" });
    return;
  }

  res.json(model);
});

// DELETE /models/:id
router.delete("/models/:id", async (req, res): Promise<void> => {
  const params = DeleteModelParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(modelsTable).where(eq(modelsTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Model not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
