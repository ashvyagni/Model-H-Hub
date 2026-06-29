import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const providersTable = pgTable("providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  providerType: text("provider_type").notNull().default("custom"),
  apiKey: text("api_key"),
  baseUrl: text("base_url"),
  model: text("model"),
  customHeaders: text("custom_headers"),
  organizationId: text("organization_id"),
  endpoint: text("endpoint"),
  enabled: boolean("enabled").notNull().default(true),
  detectedType: text("detected_type"),
  confidence: integer("confidence"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProviderSchema = createInsertSchema(providersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type Provider = typeof providersTable.$inferSelect;
