import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import { UpdateSettingsBody } from "@workspace/api-zod";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

// GET /settings — always returns a single row, creating one if needed
router.get("/settings", async (_req, res): Promise<void> => {
  let [settings] = await db.select().from(settingsTable).limit(1);

  if (!settings) {
    [settings] = await db.insert(settingsTable).values({}).returning();
  }

  res.json(settings);
});

// PUT /settings
router.put("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Upsert: update if exists, insert if not
  let [settings] = await db.select().from(settingsTable).limit(1);

  if (!settings) {
    [settings] = await db.insert(settingsTable).values(parsed.data).returning();
  } else {
    const updateData: Record<string, unknown> = {};
    if (parsed.data.defaultProviderId !== undefined) updateData.defaultProviderId = parsed.data.defaultProviderId;
    if (parsed.data.defaultModel !== undefined) updateData.defaultModel = parsed.data.defaultModel;
    if (parsed.data.streamingEnabled !== undefined) updateData.streamingEnabled = parsed.data.streamingEnabled;
    if (parsed.data.autoSave !== undefined) updateData.autoSave = parsed.data.autoSave;
    if (parsed.data.retryCount !== undefined) updateData.retryCount = parsed.data.retryCount;

    [settings] = await db.update(settingsTable)
      .set(updateData)
      .where(sql`id = ${settings.id}`)
      .returning();
  }

  res.json(settings);
});

export default router;
