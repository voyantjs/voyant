import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"

import { pricingService } from "./service.js"
import {
  cancellationPolicyListQuerySchema,
  cancellationPolicyRuleListQuerySchema,
  dropoffPriceRuleListQuerySchema,
  extraPriceRuleListQuerySchema,
  insertCancellationPolicyRuleSchema,
  insertCancellationPolicySchema,
  insertDropoffPriceRuleSchema,
  insertExtraPriceRuleSchema,
  insertOptionPriceRuleSchema,
  insertOptionStartTimeRuleSchema,
  insertOptionUnitPriceRuleSchema,
  insertOptionUnitTierSchema,
  insertPickupPriceRuleSchema,
  insertPriceCatalogSchema,
  insertPriceScheduleSchema,
  insertPricingCategoryDependencySchema,
  insertPricingCategorySchema,
  optionPriceRuleListQuerySchema,
  optionStartTimeRuleListQuerySchema,
  optionUnitPriceRuleListQuerySchema,
  optionUnitTierListQuerySchema,
  pickupPriceRuleListQuerySchema,
  priceCatalogListQuerySchema,
  priceScheduleListQuerySchema,
  pricingCategoryDependencyListQuerySchema,
  pricingCategoryListQuerySchema,
  updateCancellationPolicyRuleSchema,
  updateCancellationPolicySchema,
  updateDropoffPriceRuleSchema,
  updateExtraPriceRuleSchema,
  updateOptionPriceRuleSchema,
  updateOptionStartTimeRuleSchema,
  updateOptionUnitPriceRuleSchema,
  updateOptionUnitTierSchema,
  updatePickupPriceRuleSchema,
  updatePriceCatalogSchema,
  updatePriceScheduleSchema,
  updatePricingCategoryDependencySchema,
  updatePricingCategorySchema,
} from "./validation.js"

type Env = {
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

export const pricingRoutes = new Hono<Env>()
  .get("/pricing-categories", async (c) => {
    const query = pricingCategoryListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await pricingService.listPricingCategories(c.get("db"), query))
  })
  .post("/pricing-categories", async (c) => {
    return c.json(
      {
        data: await pricingService.createPricingCategory(
          c.get("db"),
          insertPricingCategorySchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/pricing-categories/:id", async (c) => {
    const row = await pricingService.getPricingCategoryById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Pricing category not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/pricing-categories/:id", async (c) => {
    const row = await pricingService.updatePricingCategory(
      c.get("db"),
      c.req.param("id"),
      updatePricingCategorySchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Pricing category not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/pricing-categories/:id", async (c) => {
    const row = await pricingService.deletePricingCategory(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Pricing category not found" }, 404)
    return c.json({ success: true })
  })
  .get("/pricing-category-dependencies", async (c) => {
    const query = pricingCategoryDependencyListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await pricingService.listPricingCategoryDependencies(c.get("db"), query))
  })
  .post("/pricing-category-dependencies", async (c) => {
    return c.json(
      {
        data: await pricingService.createPricingCategoryDependency(
          c.get("db"),
          insertPricingCategoryDependencySchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/pricing-category-dependencies/:id", async (c) => {
    const row = await pricingService.getPricingCategoryDependencyById(
      c.get("db"),
      c.req.param("id"),
    )
    if (!row) return c.json({ error: "Pricing category dependency not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/pricing-category-dependencies/:id", async (c) => {
    const row = await pricingService.updatePricingCategoryDependency(
      c.get("db"),
      c.req.param("id"),
      updatePricingCategoryDependencySchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Pricing category dependency not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/pricing-category-dependencies/:id", async (c) => {
    const row = await pricingService.deletePricingCategoryDependency(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Pricing category dependency not found" }, 404)
    return c.json({ success: true })
  })
  .get("/cancellation-policies", async (c) => {
    const query = cancellationPolicyListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await pricingService.listCancellationPolicies(c.get("db"), query))
  })
  .post("/cancellation-policies", async (c) => {
    return c.json(
      {
        data: await pricingService.createCancellationPolicy(
          c.get("db"),
          insertCancellationPolicySchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/cancellation-policies/:id", async (c) => {
    const row = await pricingService.getCancellationPolicyById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Cancellation policy not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/cancellation-policies/:id", async (c) => {
    const row = await pricingService.updateCancellationPolicy(
      c.get("db"),
      c.req.param("id"),
      updateCancellationPolicySchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Cancellation policy not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/cancellation-policies/:id", async (c) => {
    const row = await pricingService.deleteCancellationPolicy(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Cancellation policy not found" }, 404)
    return c.json({ success: true })
  })
  .get("/cancellation-policy-rules", async (c) => {
    const query = cancellationPolicyRuleListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await pricingService.listCancellationPolicyRules(c.get("db"), query))
  })
  .post("/cancellation-policy-rules", async (c) => {
    return c.json(
      {
        data: await pricingService.createCancellationPolicyRule(
          c.get("db"),
          insertCancellationPolicyRuleSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/cancellation-policy-rules/:id", async (c) => {
    const row = await pricingService.getCancellationPolicyRuleById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Cancellation policy rule not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/cancellation-policy-rules/:id", async (c) => {
    const row = await pricingService.updateCancellationPolicyRule(
      c.get("db"),
      c.req.param("id"),
      updateCancellationPolicyRuleSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Cancellation policy rule not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/cancellation-policy-rules/:id", async (c) => {
    const row = await pricingService.deleteCancellationPolicyRule(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Cancellation policy rule not found" }, 404)
    return c.json({ success: true })
  })
  .get("/price-catalogs", async (c) => {
    const query = priceCatalogListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await pricingService.listPriceCatalogs(c.get("db"), query))
  })
  .post("/price-catalogs", async (c) => {
    return c.json(
      {
        data: await pricingService.createPriceCatalog(
          c.get("db"),
          insertPriceCatalogSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/price-catalogs/:id", async (c) => {
    const row = await pricingService.getPriceCatalogById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Price catalog not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/price-catalogs/:id", async (c) => {
    const row = await pricingService.updatePriceCatalog(
      c.get("db"),
      c.req.param("id"),
      updatePriceCatalogSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Price catalog not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/price-catalogs/:id", async (c) => {
    const row = await pricingService.deletePriceCatalog(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Price catalog not found" }, 404)
    return c.json({ success: true })
  })
  .get("/price-schedules", async (c) => {
    const query = priceScheduleListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await pricingService.listPriceSchedules(c.get("db"), query))
  })
  .post("/price-schedules", async (c) => {
    return c.json(
      {
        data: await pricingService.createPriceSchedule(
          c.get("db"),
          insertPriceScheduleSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/price-schedules/:id", async (c) => {
    const row = await pricingService.getPriceScheduleById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Price schedule not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/price-schedules/:id", async (c) => {
    const row = await pricingService.updatePriceSchedule(
      c.get("db"),
      c.req.param("id"),
      updatePriceScheduleSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Price schedule not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/price-schedules/:id", async (c) => {
    const row = await pricingService.deletePriceSchedule(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Price schedule not found" }, 404)
    return c.json({ success: true })
  })
  .get("/option-price-rules", async (c) => {
    const query = optionPriceRuleListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await pricingService.listOptionPriceRules(c.get("db"), query))
  })
  .post("/option-price-rules", async (c) => {
    return c.json(
      {
        data: await pricingService.createOptionPriceRule(
          c.get("db"),
          insertOptionPriceRuleSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/option-price-rules/:id", async (c) => {
    const row = await pricingService.getOptionPriceRuleById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Option price rule not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/option-price-rules/:id", async (c) => {
    const row = await pricingService.updateOptionPriceRule(
      c.get("db"),
      c.req.param("id"),
      updateOptionPriceRuleSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Option price rule not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/option-price-rules/:id", async (c) => {
    const row = await pricingService.deleteOptionPriceRule(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Option price rule not found" }, 404)
    return c.json({ success: true })
  })
  .get("/option-unit-price-rules", async (c) => {
    const query = optionUnitPriceRuleListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await pricingService.listOptionUnitPriceRules(c.get("db"), query))
  })
  .post("/option-unit-price-rules", async (c) => {
    return c.json(
      {
        data: await pricingService.createOptionUnitPriceRule(
          c.get("db"),
          insertOptionUnitPriceRuleSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/option-unit-price-rules/:id", async (c) => {
    const row = await pricingService.getOptionUnitPriceRuleById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Option unit price rule not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/option-unit-price-rules/:id", async (c) => {
    const row = await pricingService.updateOptionUnitPriceRule(
      c.get("db"),
      c.req.param("id"),
      updateOptionUnitPriceRuleSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Option unit price rule not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/option-unit-price-rules/:id", async (c) => {
    const row = await pricingService.deleteOptionUnitPriceRule(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Option unit price rule not found" }, 404)
    return c.json({ success: true })
  })
  .get("/option-start-time-rules", async (c) => {
    const query = optionStartTimeRuleListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await pricingService.listOptionStartTimeRules(c.get("db"), query))
  })
  .post("/option-start-time-rules", async (c) => {
    return c.json(
      {
        data: await pricingService.createOptionStartTimeRule(
          c.get("db"),
          insertOptionStartTimeRuleSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/option-start-time-rules/:id", async (c) => {
    const row = await pricingService.getOptionStartTimeRuleById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Option start time rule not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/option-start-time-rules/:id", async (c) => {
    const row = await pricingService.updateOptionStartTimeRule(
      c.get("db"),
      c.req.param("id"),
      updateOptionStartTimeRuleSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Option start time rule not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/option-start-time-rules/:id", async (c) => {
    const row = await pricingService.deleteOptionStartTimeRule(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Option start time rule not found" }, 404)
    return c.json({ success: true })
  })
  .get("/option-unit-tiers", async (c) => {
    const query = optionUnitTierListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await pricingService.listOptionUnitTiers(c.get("db"), query))
  })
  .post("/option-unit-tiers", async (c) => {
    return c.json(
      {
        data: await pricingService.createOptionUnitTier(
          c.get("db"),
          insertOptionUnitTierSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/option-unit-tiers/:id", async (c) => {
    const row = await pricingService.getOptionUnitTierById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Option unit tier not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/option-unit-tiers/:id", async (c) => {
    const row = await pricingService.updateOptionUnitTier(
      c.get("db"),
      c.req.param("id"),
      updateOptionUnitTierSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Option unit tier not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/option-unit-tiers/:id", async (c) => {
    const row = await pricingService.deleteOptionUnitTier(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Option unit tier not found" }, 404)
    return c.json({ success: true })
  })
  .get("/pickup-price-rules", async (c) => {
    const query = pickupPriceRuleListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await pricingService.listPickupPriceRules(c.get("db"), query))
  })
  .post("/pickup-price-rules", async (c) => {
    return c.json(
      {
        data: await pricingService.createPickupPriceRule(
          c.get("db"),
          insertPickupPriceRuleSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/pickup-price-rules/:id", async (c) => {
    const row = await pricingService.getPickupPriceRuleById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Pickup price rule not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/pickup-price-rules/:id", async (c) => {
    const row = await pricingService.updatePickupPriceRule(
      c.get("db"),
      c.req.param("id"),
      updatePickupPriceRuleSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Pickup price rule not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/pickup-price-rules/:id", async (c) => {
    const row = await pricingService.deletePickupPriceRule(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Pickup price rule not found" }, 404)
    return c.json({ success: true })
  })
  .get("/dropoff-price-rules", async (c) => {
    const query = dropoffPriceRuleListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await pricingService.listDropoffPriceRules(c.get("db"), query))
  })
  .post("/dropoff-price-rules", async (c) => {
    return c.json(
      {
        data: await pricingService.createDropoffPriceRule(
          c.get("db"),
          insertDropoffPriceRuleSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/dropoff-price-rules/:id", async (c) => {
    const row = await pricingService.getDropoffPriceRuleById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Dropoff price rule not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/dropoff-price-rules/:id", async (c) => {
    const row = await pricingService.updateDropoffPriceRule(
      c.get("db"),
      c.req.param("id"),
      updateDropoffPriceRuleSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Dropoff price rule not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/dropoff-price-rules/:id", async (c) => {
    const row = await pricingService.deleteDropoffPriceRule(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Dropoff price rule not found" }, 404)
    return c.json({ success: true })
  })
  .get("/extra-price-rules", async (c) => {
    const query = extraPriceRuleListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await pricingService.listExtraPriceRules(c.get("db"), query))
  })
  .post("/extra-price-rules", async (c) => {
    return c.json(
      {
        data: await pricingService.createExtraPriceRule(
          c.get("db"),
          insertExtraPriceRuleSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })
  .get("/extra-price-rules/:id", async (c) => {
    const row = await pricingService.getExtraPriceRuleById(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Extra price rule not found" }, 404)
    return c.json({ data: row })
  })
  .patch("/extra-price-rules/:id", async (c) => {
    const row = await pricingService.updateExtraPriceRule(
      c.get("db"),
      c.req.param("id"),
      updateExtraPriceRuleSchema.parse(await c.req.json()),
    )
    if (!row) return c.json({ error: "Extra price rule not found" }, 404)
    return c.json({ data: row })
  })
  .delete("/extra-price-rules/:id", async (c) => {
    const row = await pricingService.deleteExtraPriceRule(c.get("db"), c.req.param("id"))
    if (!row) return c.json({ error: "Extra price rule not found" }, 404)
    return c.json({ success: true })
  })

export type PricingRoutes = typeof pricingRoutes
