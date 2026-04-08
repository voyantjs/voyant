/**
 * Better Auth API Key table definition.
 *
 * This table is managed by the `@better-auth/api-key` plugin.
 * We define it in Drizzle so it is created by `pnpm db:migrate`
 * and can be queried with typed Drizzle queries (e.g. CF Worker middleware).
 *
 * Column names use snake_case in SQL but Better Auth accesses them via
 * camelCase JS property names — the Drizzle adapter handles the mapping.
 *
 * `referenceId` stores the organizationId (org-owned keys via `references: "organization"`).
 */

import { boolean, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const apikeyTable = pgTable(
  "apikey",
  {
    id: text("id").primaryKey(),
    configId: text("config_id").notNull().default("default"),
    name: text("name"),
    start: text("start"),
    prefix: text("prefix"),
    key: text("key").notNull(),
    referenceId: text("reference_id").notNull(),
    refillInterval: integer("refill_interval"),
    refillAmount: integer("refill_amount"),
    lastRefillAt: timestamp("last_refill_at", { withTimezone: true }),
    enabled: boolean("enabled").notNull().default(true),
    rateLimitEnabled: boolean("rate_limit_enabled").notNull().default(false),
    rateLimitTimeWindow: integer("rate_limit_time_window"),
    rateLimitMax: integer("rate_limit_max"),
    requestCount: integer("request_count").notNull().default(0),
    remaining: integer("remaining"),
    lastRequest: timestamp("last_request", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    permissions: text("permissions"),
    metadata: text("metadata"),
  },
  (table) => [
    index("idx_apikey_reference_id").on(table.referenceId),
    index("idx_apikey_config_id").on(table.configId),
  ],
)

export type SelectApikey = typeof apikeyTable.$inferSelect
export type InsertApikey = typeof apikeyTable.$inferInsert
