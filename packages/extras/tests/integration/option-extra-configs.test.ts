import { describe, expect, it } from "vitest"

import { createExtrasTestContext, DB_AVAILABLE, json } from "./test-helpers"

describe.skipIf(!DB_AVAILABLE)("Option Extra Config routes", () => {
  const ctx = createExtrasTestContext()

  describe("Option Extra Configs", () => {
    it("creates an option extra config", async () => {
      const product = await ctx.seedProduct()
      const option = await ctx.seedProductOption(product.id)
      const extra = await ctx.seedProductExtra({ productId: product.id })
      const config = await ctx.seedOptionExtraConfig(option.id, extra.id)
      expect(config.id).toMatch(/^oexc_/)
      expect(config.active).toBe(true)
      expect(config.isDefault).toBe(false)
    })

    it("creates with overrides", async () => {
      const product = await ctx.seedProduct()
      const option = await ctx.seedProductOption(product.id)
      const extra = await ctx.seedProductExtra({ productId: product.id })
      const config = await ctx.seedOptionExtraConfig(option.id, extra.id, {
        selectionType: "required",
        pricingMode: "per_person",
        isDefault: true,
        notes: "Always include",
      })
      expect(config.selectionType).toBe("required")
      expect(config.pricingMode).toBe("per_person")
      expect(config.isDefault).toBe(true)
      expect(config.notes).toBe("Always include")
    })

    it("gets an option extra config by id", async () => {
      const product = await ctx.seedProduct()
      const option = await ctx.seedProductOption(product.id)
      const extra = await ctx.seedProductExtra({ productId: product.id })
      const config = await ctx.seedOptionExtraConfig(option.id, extra.id)

      const res = await ctx.request(`/option-extra-configs/${config.id}`, { method: "GET" })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.id).toBe(config.id)
    })

    it("returns 404 for non-existent option extra config", async () => {
      const res = await ctx.request("/option-extra-configs/oexc_00000000000000000000000000", {
        method: "GET",
      })
      expect(res.status).toBe(404)
    })

    it("updates an option extra config", async () => {
      const product = await ctx.seedProduct()
      const option = await ctx.seedProductOption(product.id)
      const extra = await ctx.seedProductExtra({ productId: product.id })
      const config = await ctx.seedOptionExtraConfig(option.id, extra.id)

      const res = await ctx.request(`/option-extra-configs/${config.id}`, {
        method: "PATCH",
        ...json({ active: false, isDefault: true }),
      })
      expect(res.status).toBe(200)
      const { data } = await res.json()
      expect(data.active).toBe(false)
      expect(data.isDefault).toBe(true)
    })

    it("deletes an option extra config", async () => {
      const product = await ctx.seedProduct()
      const option = await ctx.seedProductOption(product.id)
      const extra = await ctx.seedProductExtra({ productId: product.id })
      const config = await ctx.seedOptionExtraConfig(option.id, extra.id)

      const res = await ctx.request(`/option-extra-configs/${config.id}`, { method: "DELETE" })
      expect(res.status).toBe(200)

      const check = await ctx.request(`/option-extra-configs/${config.id}`, { method: "GET" })
      expect(check.status).toBe(404)
    })
  })

  describe("Option Extra Configs list & filters", () => {
    it("lists with pagination", async () => {
      const product = await ctx.seedProduct()
      const option = await ctx.seedProductOption(product.id)
      const e1 = await ctx.seedProductExtra({ productId: product.id, code: "A" })
      const e2 = await ctx.seedProductExtra({ productId: product.id, code: "B" })
      const e3 = await ctx.seedProductExtra({ productId: product.id, code: "C" })
      await ctx.seedOptionExtraConfig(option.id, e1.id)
      await ctx.seedOptionExtraConfig(option.id, e2.id)
      await ctx.seedOptionExtraConfig(option.id, e3.id)

      const res = await ctx.request("/option-extra-configs?limit=2", { method: "GET" })
      const body = await res.json()
      expect(body.data.length).toBe(2)
      expect(body.total).toBe(3)
    })

    it("filters by optionId", async () => {
      const product = await ctx.seedProduct()
      const o1 = await ctx.seedProductOption(product.id)
      const o2 = await ctx.seedProductOption(product.id)
      const extra = await ctx.seedProductExtra({ productId: product.id })
      await ctx.seedOptionExtraConfig(o1.id, extra.id)
      await ctx.seedOptionExtraConfig(o2.id, extra.id)

      const res = await ctx.request(`/option-extra-configs?optionId=${o1.id}`, {
        method: "GET",
      })
      const body = await res.json()
      expect(body.total).toBe(1)
    })

    it("filters by productExtraId", async () => {
      const product = await ctx.seedProduct()
      const option = await ctx.seedProductOption(product.id)
      const e1 = await ctx.seedProductExtra({ productId: product.id, code: "X" })
      const e2 = await ctx.seedProductExtra({ productId: product.id, code: "Y" })
      await ctx.seedOptionExtraConfig(option.id, e1.id)
      await ctx.seedOptionExtraConfig(option.id, e2.id)

      const res = await ctx.request(`/option-extra-configs?productExtraId=${e1.id}`, {
        method: "GET",
      })
      const body = await res.json()
      expect(body.total).toBe(1)
    })
  })
})
