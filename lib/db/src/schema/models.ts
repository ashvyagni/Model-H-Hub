import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { providersTable } from "./providers";

export const modelsTable = pgTable("models", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providersTable.id, { onDelete: "cascade" }),
  modelId: text("model_id").notNull(),
  name: text("name").notNull(),
  contextLength: integer("context_length"),
  supportsVision: boolean("supports_vision").notNull().default(false),
  supportsReasoning: boolean("supports_reasoning").notNull().default(false),
  supportsFunctionCalling: boolean("supports_function_calling").notNull().default(false),
  supportsImageGeneration: boolean("supports_image_generation").notNull().default(false),
  supportsAudio: boolean("supports_audio").notNull().default(false),
  supportsEmbeddings: boolean("supports_embeddings").notNull().default(false),
  supportsStreaming: boolean("supports_streaming").notNull().default(true),
  supportsJsonMode: boolean("supports_json_mode").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertModelSchema = createInsertSchema(modelsTable).omit({ id: true, createdAt: true });
export type InsertModel = z.infer<typeof insertModelSchema>;
export type Model = typeof modelsTable.$inferSelect;
