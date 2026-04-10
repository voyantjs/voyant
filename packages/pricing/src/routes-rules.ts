import { Hono } from "hono"
import { type Env, notFound } from "./routes-shared.js"
import { pricingService } from "./service.js"
import {
  dropoffPriceRuleListQuerySchema,
  extraPriceRuleListQuerySchema,
  insertDropoffPriceRuleSchema,
  insertExtraPriceRuleSchema,
  insertOptionPriceRuleSchema,
  insertOptionStartTimeRuleSchema,
  insertOptionUnitPriceRuleSchema,
  insertOptionUnitTierSchema,
  insertPickupPriceRuleSchema,
  optionPriceRuleListQuerySchema,
  optionStartTimeRuleListQuerySchema,
  optionUnitPriceRuleListQuerySchema,
  optionUnitTierListQuerySchema,
  pickupPriceRuleListQuerySchema,
  updateDropoffPriceRuleSchema,
  updateExtraPriceRuleSchema,
  updateOptionPriceRuleSchema,
  updateOptionStartTimeRuleSchema,
  updateOptionUnitPriceRuleSchema,
  updateOptionUnitTierSchema,
  updatePickupPriceRuleSchema,
} from "./validation.js"

export const pricingRuleRoutes = new Hono<Env>()
  .get("/option-price-rules", async (c) =>
    c.json(
      await pricingService.listOptionPriceRules(
        c.get("db"),
        optionPriceRuleListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams)),
      ),
    ),
  )
  .post("/option-price-rules", async (c) =>
    c.json(
      {
        data: await pricingService.createOptionPriceRule(
          c.get("db"),
          insertOptionPriceRuleSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/option-price-rules/:id", async (c) => {
    const row = await pricingService.getOptionPriceRuleById(c.get("db"), c.req.param("id"))
    return row ? c.json({ data: row }) : notFound(c, "Option price rule not found")
  })
  .patch("/option-price-rules/:id", async (c) => {
    const row = await pricingService.updateOptionPriceRule(
      c.get("db"),
      c.req.param("id"),
      updateOptionPriceRuleSchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Option price rule not found")
  })
  .delete("/option-price-rules/:id", async (c) => {
    const row = await pricingService.deleteOptionPriceRule(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Option price rule not found")
  })
  .get("/option-unit-price-rules", async (c) =>
    c.json(
      await pricingService.listOptionUnitPriceRules(
        c.get("db"),
        optionUnitPriceRuleListQuerySchema.parse(
          Object.fromEntries(new URL(c.req.url).searchParams),
        ),
      ),
    ),
  )
  .post("/option-unit-price-rules", async (c) =>
    c.json(
      {
        data: await pricingService.createOptionUnitPriceRule(
          c.get("db"),
          insertOptionUnitPriceRuleSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/option-unit-price-rules/:id", async (c) => {
    const row = await pricingService.getOptionUnitPriceRuleById(c.get("db"), c.req.param("id"))
    return row ? c.json({ data: row }) : notFound(c, "Option unit price rule not found")
  })
  .patch("/option-unit-price-rules/:id", async (c) => {
    const row = await pricingService.updateOptionUnitPriceRule(
      c.get("db"),
      c.req.param("id"),
      updateOptionUnitPriceRuleSchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Option unit price rule not found")
  })
  .delete("/option-unit-price-rules/:id", async (c) => {
    const row = await pricingService.deleteOptionUnitPriceRule(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Option unit price rule not found")
  })
  .get("/option-start-time-rules", async (c) =>
    c.json(
      await pricingService.listOptionStartTimeRules(
        c.get("db"),
        optionStartTimeRuleListQuerySchema.parse(
          Object.fromEntries(new URL(c.req.url).searchParams),
        ),
      ),
    ),
  )
  .post("/option-start-time-rules", async (c) =>
    c.json(
      {
        data: await pricingService.createOptionStartTimeRule(
          c.get("db"),
          insertOptionStartTimeRuleSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/option-start-time-rules/:id", async (c) => {
    const row = await pricingService.getOptionStartTimeRuleById(c.get("db"), c.req.param("id"))
    return row ? c.json({ data: row }) : notFound(c, "Option start time rule not found")
  })
  .patch("/option-start-time-rules/:id", async (c) => {
    const row = await pricingService.updateOptionStartTimeRule(
      c.get("db"),
      c.req.param("id"),
      updateOptionStartTimeRuleSchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Option start time rule not found")
  })
  .delete("/option-start-time-rules/:id", async (c) => {
    const row = await pricingService.deleteOptionStartTimeRule(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Option start time rule not found")
  })
  .get("/option-unit-tiers", async (c) =>
    c.json(
      await pricingService.listOptionUnitTiers(
        c.get("db"),
        optionUnitTierListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams)),
      ),
    ),
  )
  .post("/option-unit-tiers", async (c) =>
    c.json(
      {
        data: await pricingService.createOptionUnitTier(
          c.get("db"),
          insertOptionUnitTierSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/option-unit-tiers/:id", async (c) => {
    const row = await pricingService.getOptionUnitTierById(c.get("db"), c.req.param("id"))
    return row ? c.json({ data: row }) : notFound(c, "Option unit tier not found")
  })
  .patch("/option-unit-tiers/:id", async (c) => {
    const row = await pricingService.updateOptionUnitTier(
      c.get("db"),
      c.req.param("id"),
      updateOptionUnitTierSchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Option unit tier not found")
  })
  .delete("/option-unit-tiers/:id", async (c) => {
    const row = await pricingService.deleteOptionUnitTier(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Option unit tier not found")
  })
  .get("/pickup-price-rules", async (c) =>
    c.json(
      await pricingService.listPickupPriceRules(
        c.get("db"),
        pickupPriceRuleListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams)),
      ),
    ),
  )
  .post("/pickup-price-rules", async (c) =>
    c.json(
      {
        data: await pricingService.createPickupPriceRule(
          c.get("db"),
          insertPickupPriceRuleSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/pickup-price-rules/:id", async (c) => {
    const row = await pricingService.getPickupPriceRuleById(c.get("db"), c.req.param("id"))
    return row ? c.json({ data: row }) : notFound(c, "Pickup price rule not found")
  })
  .patch("/pickup-price-rules/:id", async (c) => {
    const row = await pricingService.updatePickupPriceRule(
      c.get("db"),
      c.req.param("id"),
      updatePickupPriceRuleSchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Pickup price rule not found")
  })
  .delete("/pickup-price-rules/:id", async (c) => {
    const row = await pricingService.deletePickupPriceRule(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Pickup price rule not found")
  })
  .get("/dropoff-price-rules", async (c) =>
    c.json(
      await pricingService.listDropoffPriceRules(
        c.get("db"),
        dropoffPriceRuleListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams)),
      ),
    ),
  )
  .post("/dropoff-price-rules", async (c) =>
    c.json(
      {
        data: await pricingService.createDropoffPriceRule(
          c.get("db"),
          insertDropoffPriceRuleSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/dropoff-price-rules/:id", async (c) => {
    const row = await pricingService.getDropoffPriceRuleById(c.get("db"), c.req.param("id"))
    return row ? c.json({ data: row }) : notFound(c, "Dropoff price rule not found")
  })
  .patch("/dropoff-price-rules/:id", async (c) => {
    const row = await pricingService.updateDropoffPriceRule(
      c.get("db"),
      c.req.param("id"),
      updateDropoffPriceRuleSchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Dropoff price rule not found")
  })
  .delete("/dropoff-price-rules/:id", async (c) => {
    const row = await pricingService.deleteDropoffPriceRule(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Dropoff price rule not found")
  })
  .get("/extra-price-rules", async (c) =>
    c.json(
      await pricingService.listExtraPriceRules(
        c.get("db"),
        extraPriceRuleListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams)),
      ),
    ),
  )
  .post("/extra-price-rules", async (c) =>
    c.json(
      {
        data: await pricingService.createExtraPriceRule(
          c.get("db"),
          insertExtraPriceRuleSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/extra-price-rules/:id", async (c) => {
    const row = await pricingService.getExtraPriceRuleById(c.get("db"), c.req.param("id"))
    return row ? c.json({ data: row }) : notFound(c, "Extra price rule not found")
  })
  .patch("/extra-price-rules/:id", async (c) => {
    const row = await pricingService.updateExtraPriceRule(
      c.get("db"),
      c.req.param("id"),
      updateExtraPriceRuleSchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Extra price rule not found")
  })
  .delete("/extra-price-rules/:id", async (c) => {
    const row = await pricingService.deleteExtraPriceRule(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Extra price rule not found")
  })
