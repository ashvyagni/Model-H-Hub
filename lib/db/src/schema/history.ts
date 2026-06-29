import { pgTable, text, serial, timestamp, boolean, integer, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { providersTable } from "./providers";

export const historyTable = pgTable("history", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull().references(() => providersTable.id, { onDelete: "cascade" }),
  model: text("model").notNull(),
  requestType: text("request_type").notNull().default("chat"),
  status: text("status").notNull().default("success"),
  latencyMs: integer("latency_ms").notNull().default(0),
  promptTokens: integer("prompt_tokens"),
  completionTokens: integer("completion_tokens"),
  totalTokens: integer("total_tokens"),
  costEstimate: doublePrecision("cost_estimate"),
  starred: boolean("starred").notNull().default(false),
  rawRequest: text("raw_request"),
  rawResponse: text("raw_response"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHistorySchema = createInsertSchema(historyTable).omit({ id: true, createdAt: true, starred: true });
export type InsertHistory = z.infer<typeof insertHistorySchema>;
export type History = typeof historyTable.$inferSelect;
