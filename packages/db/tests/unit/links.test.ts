import { defineLink, type LinkableDefinition, type LinkRow } from "@voyantjs/core"
import { describe, expect, it, vi } from "vitest"

import { createLinkService, syncLinks } from "../../src/links.js"

const person: LinkableDefinition = {
  module: "crm",
  entity: "person",
  table: "people",
  idPrefix: "pers",
}

const product: LinkableDefinition = {
  module: "products",
  entity: "product",
  table: "products",
  idPrefix: "prod",
}

function makeRow(id: string, leftId: string, rightId: string): LinkRow {
  const now = new Date()
  return {
    id,
    leftId,
    rightId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
}

describe("read-only links", () => {
  it("lists rows from the externally-owned resolver", async () => {
    const list = vi.fn(async () => [makeRow("lnk_1", "pers_a", "prod_1")])
    const link = defineLink(person, { linkable: product, isList: true }, { readOnly: { list } })
    const svc = createLinkService(() => ({ execute: vi.fn() }) as never, [link])

    const rows = await svc.list(link.tableName, { leftId: "pers_a" })

    expect(rows).toHaveLength(1)
    expect(rows[0]?.rightId).toBe("prod_1")
    expect(list).toHaveBeenCalledWith({ leftId: "pers_a" })
  })

  it("rejects mutations against read-only links", async () => {
    const link = defineLink(person, product, {
      readOnly: { list: async () => [] },
    })
    const svc = createLinkService(() => ({ execute: vi.fn() }) as never, [link])

    await expect(svc.create(link.tableName, "pers_a", "prod_1")).rejects.toThrow(/read-only link/)
    await expect(svc.dismiss(link.tableName, "pers_a", "prod_1")).rejects.toThrow(/read-only link/)
    await expect(svc.delete(link.tableName, "pers_a", "prod_1")).rejects.toThrow(/read-only link/)
  })

  it("skips read-only links during sync", async () => {
    const execute = vi.fn()
    const db = { execute } as never
    const managed = defineLink(person, product)
    const readOnly = defineLink(
      person,
      { linkable: product, isList: true },
      {
        database: { tableName: "crm_person_products_product_read_only" },
        readOnly: { list: async () => [] },
      },
    )

    await syncLinks(db, [managed, readOnly])

    expect(execute).toHaveBeenCalledTimes(4)
  })
})
