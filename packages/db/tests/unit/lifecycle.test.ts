import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { describe, expect, it } from "vitest"

import { hasSoftDelete, whereActive } from "../../src/lifecycle.js"

const tableWithDeletedAt = pgTable("with_deleted_at", {
  id: text("id").primaryKey(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
})

const tableWithoutDeletedAt = pgTable("without_deleted_at", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
})

describe("hasSoftDelete()", () => {
  it("returns true for tables with a deletedAt column", () => {
    expect(hasSoftDelete(tableWithDeletedAt)).toBe(true)
  })

  it("returns false for tables without a deletedAt column", () => {
    expect(hasSoftDelete(tableWithoutDeletedAt)).toBe(false)
  })
})

describe("whereActive()", () => {
  it("returns a SQL predicate for tables with deletedAt", () => {
    const predicate = whereActive(tableWithDeletedAt)
    expect(predicate).toBeDefined()
  })

  it("returns undefined for tables without deletedAt", () => {
    expect(whereActive(tableWithoutDeletedAt)).toBeUndefined()
  })
})
