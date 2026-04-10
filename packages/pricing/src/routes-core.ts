import { Hono } from "hono"
import { type Env, notFound } from "./routes-shared.js"
import { pricingService } from "./service.js"
import {
  cancellationPolicyListQuerySchema,
  cancellationPolicyRuleListQuerySchema,
  insertCancellationPolicyRuleSchema,
  insertCancellationPolicySchema,
  insertPriceCatalogSchema,
  insertPriceScheduleSchema,
  insertPricingCategoryDependencySchema,
  insertPricingCategorySchema,
  priceCatalogListQuerySchema,
  priceScheduleListQuerySchema,
  pricingCategoryDependencyListQuerySchema,
  pricingCategoryListQuerySchema,
  updateCancellationPolicyRuleSchema,
  updateCancellationPolicySchema,
  updatePriceCatalogSchema,
  updatePriceScheduleSchema,
  updatePricingCategoryDependencySchema,
  updatePricingCategorySchema,
} from "./validation.js"

export const pricingCoreRoutes = new Hono<Env>()
  .get("/pricing-categories", async (c) =>
    c.json(
      await pricingService.listPricingCategories(
        c.get("db"),
        pricingCategoryListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams)),
      ),
    ),
  )
  .post("/pricing-categories", async (c) =>
    c.json(
      {
        data: await pricingService.createPricingCategory(
          c.get("db"),
          insertPricingCategorySchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/pricing-categories/:id", async (c) => {
    const row = await pricingService.getPricingCategoryById(c.get("db"), c.req.param("id"))
    return row ? c.json({ data: row }) : notFound(c, "Pricing category not found")
  })
  .patch("/pricing-categories/:id", async (c) => {
    const row = await pricingService.updatePricingCategory(
      c.get("db"),
      c.req.param("id"),
      updatePricingCategorySchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Pricing category not found")
  })
  .delete("/pricing-categories/:id", async (c) => {
    const row = await pricingService.deletePricingCategory(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Pricing category not found")
  })
  .get("/pricing-category-dependencies", async (c) =>
    c.json(
      await pricingService.listPricingCategoryDependencies(
        c.get("db"),
        pricingCategoryDependencyListQuerySchema.parse(
          Object.fromEntries(new URL(c.req.url).searchParams),
        ),
      ),
    ),
  )
  .post("/pricing-category-dependencies", async (c) =>
    c.json(
      {
        data: await pricingService.createPricingCategoryDependency(
          c.get("db"),
          insertPricingCategoryDependencySchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/pricing-category-dependencies/:id", async (c) => {
    const row = await pricingService.getPricingCategoryDependencyById(
      c.get("db"),
      c.req.param("id"),
    )
    return row ? c.json({ data: row }) : notFound(c, "Pricing category dependency not found")
  })
  .patch("/pricing-category-dependencies/:id", async (c) => {
    const row = await pricingService.updatePricingCategoryDependency(
      c.get("db"),
      c.req.param("id"),
      updatePricingCategoryDependencySchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Pricing category dependency not found")
  })
  .delete("/pricing-category-dependencies/:id", async (c) => {
    const row = await pricingService.deletePricingCategoryDependency(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Pricing category dependency not found")
  })
  .get("/cancellation-policies", async (c) =>
    c.json(
      await pricingService.listCancellationPolicies(
        c.get("db"),
        cancellationPolicyListQuerySchema.parse(
          Object.fromEntries(new URL(c.req.url).searchParams),
        ),
      ),
    ),
  )
  .post("/cancellation-policies", async (c) =>
    c.json(
      {
        data: await pricingService.createCancellationPolicy(
          c.get("db"),
          insertCancellationPolicySchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/cancellation-policies/:id", async (c) => {
    const row = await pricingService.getCancellationPolicyById(c.get("db"), c.req.param("id"))
    return row ? c.json({ data: row }) : notFound(c, "Cancellation policy not found")
  })
  .patch("/cancellation-policies/:id", async (c) => {
    const row = await pricingService.updateCancellationPolicy(
      c.get("db"),
      c.req.param("id"),
      updateCancellationPolicySchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Cancellation policy not found")
  })
  .delete("/cancellation-policies/:id", async (c) => {
    const row = await pricingService.deleteCancellationPolicy(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Cancellation policy not found")
  })
  .get("/cancellation-policy-rules", async (c) =>
    c.json(
      await pricingService.listCancellationPolicyRules(
        c.get("db"),
        cancellationPolicyRuleListQuerySchema.parse(
          Object.fromEntries(new URL(c.req.url).searchParams),
        ),
      ),
    ),
  )
  .post("/cancellation-policy-rules", async (c) =>
    c.json(
      {
        data: await pricingService.createCancellationPolicyRule(
          c.get("db"),
          insertCancellationPolicyRuleSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/cancellation-policy-rules/:id", async (c) => {
    const row = await pricingService.getCancellationPolicyRuleById(c.get("db"), c.req.param("id"))
    return row ? c.json({ data: row }) : notFound(c, "Cancellation policy rule not found")
  })
  .patch("/cancellation-policy-rules/:id", async (c) => {
    const row = await pricingService.updateCancellationPolicyRule(
      c.get("db"),
      c.req.param("id"),
      updateCancellationPolicyRuleSchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Cancellation policy rule not found")
  })
  .delete("/cancellation-policy-rules/:id", async (c) => {
    const row = await pricingService.deleteCancellationPolicyRule(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Cancellation policy rule not found")
  })
  .get("/price-catalogs", async (c) =>
    c.json(
      await pricingService.listPriceCatalogs(
        c.get("db"),
        priceCatalogListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams)),
      ),
    ),
  )
  .post("/price-catalogs", async (c) =>
    c.json(
      {
        data: await pricingService.createPriceCatalog(
          c.get("db"),
          insertPriceCatalogSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/price-catalogs/:id", async (c) => {
    const row = await pricingService.getPriceCatalogById(c.get("db"), c.req.param("id"))
    return row ? c.json({ data: row }) : notFound(c, "Price catalog not found")
  })
  .patch("/price-catalogs/:id", async (c) => {
    const row = await pricingService.updatePriceCatalog(
      c.get("db"),
      c.req.param("id"),
      updatePriceCatalogSchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Price catalog not found")
  })
  .delete("/price-catalogs/:id", async (c) => {
    const row = await pricingService.deletePriceCatalog(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Price catalog not found")
  })
  .get("/price-schedules", async (c) =>
    c.json(
      await pricingService.listPriceSchedules(
        c.get("db"),
        priceScheduleListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams)),
      ),
    ),
  )
  .post("/price-schedules", async (c) =>
    c.json(
      {
        data: await pricingService.createPriceSchedule(
          c.get("db"),
          insertPriceScheduleSchema.parse(await c.req.json()),
        ),
      },
      201,
    ),
  )
  .get("/price-schedules/:id", async (c) => {
    const row = await pricingService.getPriceScheduleById(c.get("db"), c.req.param("id"))
    return row ? c.json({ data: row }) : notFound(c, "Price schedule not found")
  })
  .patch("/price-schedules/:id", async (c) => {
    const row = await pricingService.updatePriceSchedule(
      c.get("db"),
      c.req.param("id"),
      updatePriceScheduleSchema.parse(await c.req.json()),
    )
    return row ? c.json({ data: row }) : notFound(c, "Price schedule not found")
  })
  .delete("/price-schedules/:id", async (c) => {
    const row = await pricingService.deletePriceSchedule(c.get("db"), c.req.param("id"))
    return row ? c.json({ success: true }) : notFound(c, "Price schedule not found")
  })
