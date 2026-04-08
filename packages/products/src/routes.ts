import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"

import { productsService } from "./service.js"
import {
  insertDaySchema,
  insertDayServiceSchema,
  insertOptionUnitSchema,
  insertOptionUnitTranslationSchema,
  insertProductActivationSettingSchema,
  insertProductCapabilitySchema,
  insertProductCategorySchema,
  insertProductDeliveryFormatSchema,
  insertProductFaqSchema,
  insertProductFeatureSchema,
  insertProductLocationSchema,
  insertProductMediaSchema,
  insertProductNoteSchema,
  insertProductOptionSchema,
  insertProductOptionTranslationSchema,
  insertProductSchema,
  insertProductTagSchema,
  insertProductTicketSettingSchema,
  insertProductTranslationSchema,
  insertProductTypeSchema,
  insertProductVisibilitySettingSchema,
  insertVersionSchema,
  optionUnitListQuerySchema,
  optionUnitTranslationListQuerySchema,
  productActivationSettingListQuerySchema,
  productCapabilityListQuerySchema,
  productCategoryListQuerySchema,
  productDeliveryFormatListQuerySchema,
  productFaqListQuerySchema,
  productFeatureListQuerySchema,
  productListQuerySchema,
  productLocationListQuerySchema,
  productMediaListQuerySchema,
  productOptionListQuerySchema,
  productOptionTranslationListQuerySchema,
  productTagListQuerySchema,
  productTicketSettingListQuerySchema,
  productTranslationListQuerySchema,
  productTypeListQuerySchema,
  productVisibilitySettingListQuerySchema,
  reorderProductMediaSchema,
  updateDaySchema,
  updateDayServiceSchema,
  updateOptionUnitSchema,
  updateOptionUnitTranslationSchema,
  updateProductActivationSettingSchema,
  updateProductCapabilitySchema,
  updateProductCategorySchema,
  updateProductDeliveryFormatSchema,
  updateProductFaqSchema,
  updateProductFeatureSchema,
  updateProductLocationSchema,
  updateProductMediaSchema,
  updateProductOptionSchema,
  updateProductOptionTranslationSchema,
  updateProductSchema,
  updateProductTagSchema,
  updateProductTicketSettingSchema,
  updateProductTranslationSchema,
  updateProductTypeSchema,
  updateProductVisibilitySettingSchema,
} from "./validation.js"

type Env = {
  Variables: {
    db: PostgresJsDatabase
    userId?: string
  }
}

// ==========================================================================
// Products — method-chained routes for Hono RPC type inference
// ==========================================================================

export const productRoutes = new Hono<Env>()

  // GET / — List products
  .get("/", async (c) => {
    const query = productListQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams))
    return c.json(await productsService.listProducts(c.get("db"), query))
  })

  // POST / — Create product
  .post("/", async (c) => {
    return c.json(
      {
        data: await productsService.createProduct(
          c.get("db"),
          insertProductSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })

  // ==========================================================================
  // Product operating configuration
  // ==========================================================================

  .get("/activation-settings", async (c) => {
    const query = productActivationSettingListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await productsService.listActivationSettings(c.get("db"), query))
  })

  .get("/activation-settings/:id", async (c) => {
    const row = await productsService.getActivationSettingById(c.get("db"), c.req.param("id"))
    if (!row) {
      return c.json({ error: "Product activation setting not found" }, 404)
    }

    return c.json({ data: row })
  })

  .post("/:id/activation-settings", async (c) => {
    const row = await productsService.upsertActivationSetting(
      c.get("db"),
      c.req.param("id"),
      insertProductActivationSettingSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Product not found" }, 404)
    }

    return c.json({ data: row }, 201)
  })

  .patch("/activation-settings/:id", async (c) => {
    const row = await productsService.updateActivationSetting(
      c.get("db"),
      c.req.param("id"),
      updateProductActivationSettingSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Product activation setting not found" }, 404)
    }

    return c.json({ data: row })
  })

  .delete("/activation-settings/:id", async (c) => {
    const row = await productsService.deleteActivationSetting(c.get("db"), c.req.param("id"))

    if (!row) {
      return c.json({ error: "Product activation setting not found" }, 404)
    }

    return c.json({ success: true }, 200)
  })

  .get("/ticket-settings", async (c) => {
    const query = productTicketSettingListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await productsService.listTicketSettings(c.get("db"), query))
  })

  .get("/ticket-settings/:id", async (c) => {
    const row = await productsService.getTicketSettingById(c.get("db"), c.req.param("id"))
    if (!row) {
      return c.json({ error: "Product ticket setting not found" }, 404)
    }

    return c.json({ data: row })
  })

  .post("/:id/ticket-settings", async (c) => {
    const row = await productsService.upsertTicketSetting(
      c.get("db"),
      c.req.param("id"),
      insertProductTicketSettingSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Product not found" }, 404)
    }

    return c.json({ data: row }, 201)
  })

  .patch("/ticket-settings/:id", async (c) => {
    const row = await productsService.updateTicketSetting(
      c.get("db"),
      c.req.param("id"),
      updateProductTicketSettingSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Product ticket setting not found" }, 404)
    }

    return c.json({ data: row })
  })

  .delete("/ticket-settings/:id", async (c) => {
    const row = await productsService.deleteTicketSetting(c.get("db"), c.req.param("id"))

    if (!row) {
      return c.json({ error: "Product ticket setting not found" }, 404)
    }

    return c.json({ success: true }, 200)
  })

  .get("/visibility-settings", async (c) => {
    const query = productVisibilitySettingListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await productsService.listVisibilitySettings(c.get("db"), query))
  })

  .get("/visibility-settings/:id", async (c) => {
    const row = await productsService.getVisibilitySettingById(c.get("db"), c.req.param("id"))
    if (!row) {
      return c.json({ error: "Product visibility setting not found" }, 404)
    }

    return c.json({ data: row })
  })

  .post("/:id/visibility-settings", async (c) => {
    const row = await productsService.upsertVisibilitySetting(
      c.get("db"),
      c.req.param("id"),
      insertProductVisibilitySettingSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Product not found" }, 404)
    }

    return c.json({ data: row }, 201)
  })

  .patch("/visibility-settings/:id", async (c) => {
    const row = await productsService.updateVisibilitySetting(
      c.get("db"),
      c.req.param("id"),
      updateProductVisibilitySettingSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Product visibility setting not found" }, 404)
    }

    return c.json({ data: row })
  })

  .delete("/visibility-settings/:id", async (c) => {
    const row = await productsService.deleteVisibilitySetting(c.get("db"), c.req.param("id"))

    if (!row) {
      return c.json({ error: "Product visibility setting not found" }, 404)
    }

    return c.json({ success: true }, 200)
  })

  .get("/capabilities", async (c) => {
    const query = productCapabilityListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await productsService.listCapabilities(c.get("db"), query))
  })

  .get("/capabilities/:id", async (c) => {
    const row = await productsService.getCapabilityById(c.get("db"), c.req.param("id"))
    if (!row) {
      return c.json({ error: "Product capability not found" }, 404)
    }

    return c.json({ data: row })
  })

  .post("/:id/capabilities", async (c) => {
    const row = await productsService.createCapability(
      c.get("db"),
      c.req.param("id"),
      insertProductCapabilitySchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Product not found" }, 404)
    }

    return c.json({ data: row }, 201)
  })

  .patch("/capabilities/:id", async (c) => {
    const row = await productsService.updateCapability(
      c.get("db"),
      c.req.param("id"),
      updateProductCapabilitySchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Product capability not found" }, 404)
    }

    return c.json({ data: row })
  })

  .delete("/capabilities/:id", async (c) => {
    const row = await productsService.deleteCapability(c.get("db"), c.req.param("id"))

    if (!row) {
      return c.json({ error: "Product capability not found" }, 404)
    }

    return c.json({ success: true }, 200)
  })

  .get("/delivery-formats", async (c) => {
    const query = productDeliveryFormatListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await productsService.listDeliveryFormats(c.get("db"), query))
  })

  .get("/delivery-formats/:id", async (c) => {
    const row = await productsService.getDeliveryFormatById(c.get("db"), c.req.param("id"))
    if (!row) {
      return c.json({ error: "Product delivery format not found" }, 404)
    }

    return c.json({ data: row })
  })

  .post("/:id/delivery-formats", async (c) => {
    const row = await productsService.createDeliveryFormat(
      c.get("db"),
      c.req.param("id"),
      insertProductDeliveryFormatSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Product not found" }, 404)
    }

    return c.json({ data: row }, 201)
  })

  .patch("/delivery-formats/:id", async (c) => {
    const row = await productsService.updateDeliveryFormat(
      c.get("db"),
      c.req.param("id"),
      updateProductDeliveryFormatSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Product delivery format not found" }, 404)
    }

    return c.json({ data: row })
  })

  .delete("/delivery-formats/:id", async (c) => {
    const row = await productsService.deleteDeliveryFormat(c.get("db"), c.req.param("id"))

    if (!row) {
      return c.json({ error: "Product delivery format not found" }, 404)
    }

    return c.json({ success: true }, 200)
  })

  .get("/features", async (c) => {
    const query = productFeatureListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await productsService.listFeatures(c.get("db"), query))
  })

  .get("/features/:id", async (c) => {
    const row = await productsService.getFeatureById(c.get("db"), c.req.param("id"))
    if (!row) {
      return c.json({ error: "Product feature not found" }, 404)
    }

    return c.json({ data: row })
  })

  .post("/:id/features", async (c) => {
    const row = await productsService.createFeature(
      c.get("db"),
      c.req.param("id"),
      insertProductFeatureSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Product not found" }, 404)
    }

    return c.json({ data: row }, 201)
  })

  .patch("/features/:id", async (c) => {
    const row = await productsService.updateFeature(
      c.get("db"),
      c.req.param("id"),
      updateProductFeatureSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Product feature not found" }, 404)
    }

    return c.json({ data: row })
  })

  .delete("/features/:id", async (c) => {
    const row = await productsService.deleteFeature(c.get("db"), c.req.param("id"))

    if (!row) {
      return c.json({ error: "Product feature not found" }, 404)
    }

    return c.json({ success: true }, 200)
  })

  .get("/faqs", async (c) => {
    const query = productFaqListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await productsService.listFaqs(c.get("db"), query))
  })

  .get("/faqs/:id", async (c) => {
    const row = await productsService.getFaqById(c.get("db"), c.req.param("id"))
    if (!row) {
      return c.json({ error: "Product FAQ not found" }, 404)
    }

    return c.json({ data: row })
  })

  .post("/:id/faqs", async (c) => {
    const row = await productsService.createFaq(
      c.get("db"),
      c.req.param("id"),
      insertProductFaqSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Product not found" }, 404)
    }

    return c.json({ data: row }, 201)
  })

  .patch("/faqs/:id", async (c) => {
    const row = await productsService.updateFaq(
      c.get("db"),
      c.req.param("id"),
      updateProductFaqSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Product FAQ not found" }, 404)
    }

    return c.json({ data: row })
  })

  .delete("/faqs/:id", async (c) => {
    const row = await productsService.deleteFaq(c.get("db"), c.req.param("id"))

    if (!row) {
      return c.json({ error: "Product FAQ not found" }, 404)
    }

    return c.json({ success: true }, 200)
  })

  .get("/locations", async (c) => {
    const query = productLocationListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await productsService.listLocations(c.get("db"), query))
  })

  .get("/locations/:id", async (c) => {
    const row = await productsService.getLocationById(c.get("db"), c.req.param("id"))
    if (!row) {
      return c.json({ error: "Product location not found" }, 404)
    }

    return c.json({ data: row })
  })

  .post("/:id/locations", async (c) => {
    const row = await productsService.createLocation(
      c.get("db"),
      c.req.param("id"),
      insertProductLocationSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Product not found" }, 404)
    }

    return c.json({ data: row }, 201)
  })

  .patch("/locations/:id", async (c) => {
    const row = await productsService.updateLocation(
      c.get("db"),
      c.req.param("id"),
      updateProductLocationSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Product location not found" }, 404)
    }

    return c.json({ data: row })
  })

  .delete("/locations/:id", async (c) => {
    const row = await productsService.deleteLocation(c.get("db"), c.req.param("id"))

    if (!row) {
      return c.json({ error: "Product location not found" }, 404)
    }

    return c.json({ success: true }, 200)
  })

  // ==========================================================================
  // Options
  // ==========================================================================

  // GET /options — List options
  .get("/options", async (c) => {
    const query = productOptionListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await productsService.listOptions(c.get("db"), query))
  })

  // GET /options/:optionId — Get single option
  .get("/options/:optionId", async (c) => {
    const row = await productsService.getOptionById(c.get("db"), c.req.param("optionId"))

    if (!row) {
      return c.json({ error: "Product option not found" }, 404)
    }

    return c.json({ data: row })
  })

  // POST /:id/options — Create option for product
  .post("/:id/options", async (c) => {
    const row = await productsService.createOption(
      c.get("db"),
      c.req.param("id"),
      insertProductOptionSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Product not found" }, 404)
    }

    return c.json({ data: row }, 201)
  })

  // PATCH /options/:optionId — Update option
  .patch("/options/:optionId", async (c) => {
    const row = await productsService.updateOption(
      c.get("db"),
      c.req.param("optionId"),
      updateProductOptionSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Product option not found" }, 404)
    }

    return c.json({ data: row })
  })

  // DELETE /options/:optionId — Delete option
  .delete("/options/:optionId", async (c) => {
    const row = await productsService.deleteOption(c.get("db"), c.req.param("optionId"))

    if (!row) {
      return c.json({ error: "Product option not found" }, 404)
    }

    return c.json({ success: true }, 200)
  })

  // ==========================================================================
  // Option Units
  // ==========================================================================

  // GET /units — List units
  .get("/units", async (c) => {
    const query = optionUnitListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await productsService.listUnits(c.get("db"), query))
  })

  // GET /units/:unitId — Get single unit
  .get("/units/:unitId", async (c) => {
    const row = await productsService.getUnitById(c.get("db"), c.req.param("unitId"))

    if (!row) {
      return c.json({ error: "Option unit not found" }, 404)
    }

    return c.json({ data: row })
  })

  // POST /options/:optionId/units — Create unit for option
  .post("/options/:optionId/units", async (c) => {
    const row = await productsService.createUnit(
      c.get("db"),
      c.req.param("optionId"),
      insertOptionUnitSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Product option not found" }, 404)
    }

    return c.json({ data: row }, 201)
  })

  // PATCH /units/:unitId — Update unit
  .patch("/units/:unitId", async (c) => {
    const row = await productsService.updateUnit(
      c.get("db"),
      c.req.param("unitId"),
      updateOptionUnitSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Option unit not found" }, 404)
    }

    return c.json({ data: row })
  })

  // DELETE /units/:unitId — Delete unit
  .delete("/units/:unitId", async (c) => {
    const row = await productsService.deleteUnit(c.get("db"), c.req.param("unitId"))

    if (!row) {
      return c.json({ error: "Option unit not found" }, 404)
    }

    return c.json({ success: true }, 200)
  })

  // ==========================================================================
  // Translations
  // ==========================================================================

  .get("/translations", async (c) => {
    const query = productTranslationListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await productsService.listProductTranslations(c.get("db"), query))
  })

  .get("/translations/:translationId", async (c) => {
    const row = await productsService.getProductTranslationById(
      c.get("db"),
      c.req.param("translationId"),
    )

    if (!row) {
      return c.json({ error: "Product translation not found" }, 404)
    }

    return c.json({ data: row })
  })

  .post("/:id/translations", async (c) => {
    const row = await productsService.createProductTranslation(
      c.get("db"),
      c.req.param("id"),
      insertProductTranslationSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Product not found" }, 404)
    }

    return c.json({ data: row }, 201)
  })

  .patch("/translations/:translationId", async (c) => {
    const row = await productsService.updateProductTranslation(
      c.get("db"),
      c.req.param("translationId"),
      updateProductTranslationSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Product translation not found" }, 404)
    }

    return c.json({ data: row })
  })

  .delete("/translations/:translationId", async (c) => {
    const row = await productsService.deleteProductTranslation(
      c.get("db"),
      c.req.param("translationId"),
    )

    if (!row) {
      return c.json({ error: "Product translation not found" }, 404)
    }

    return c.json({ success: true }, 200)
  })

  .get("/option-translations", async (c) => {
    const query = productOptionTranslationListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await productsService.listOptionTranslations(c.get("db"), query))
  })

  .get("/option-translations/:translationId", async (c) => {
    const row = await productsService.getOptionTranslationById(
      c.get("db"),
      c.req.param("translationId"),
    )

    if (!row) {
      return c.json({ error: "Option translation not found" }, 404)
    }

    return c.json({ data: row })
  })

  .post("/options/:optionId/translations", async (c) => {
    const row = await productsService.createOptionTranslation(
      c.get("db"),
      c.req.param("optionId"),
      insertProductOptionTranslationSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Product option not found" }, 404)
    }

    return c.json({ data: row }, 201)
  })

  .patch("/option-translations/:translationId", async (c) => {
    const row = await productsService.updateOptionTranslation(
      c.get("db"),
      c.req.param("translationId"),
      updateProductOptionTranslationSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Option translation not found" }, 404)
    }

    return c.json({ data: row })
  })

  .delete("/option-translations/:translationId", async (c) => {
    const row = await productsService.deleteOptionTranslation(
      c.get("db"),
      c.req.param("translationId"),
    )

    if (!row) {
      return c.json({ error: "Option translation not found" }, 404)
    }

    return c.json({ success: true }, 200)
  })

  .get("/unit-translations", async (c) => {
    const query = optionUnitTranslationListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await productsService.listUnitTranslations(c.get("db"), query))
  })

  .get("/unit-translations/:translationId", async (c) => {
    const row = await productsService.getUnitTranslationById(
      c.get("db"),
      c.req.param("translationId"),
    )

    if (!row) {
      return c.json({ error: "Unit translation not found" }, 404)
    }

    return c.json({ data: row })
  })

  .post("/units/:unitId/translations", async (c) => {
    const row = await productsService.createUnitTranslation(
      c.get("db"),
      c.req.param("unitId"),
      insertOptionUnitTranslationSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Option unit not found" }, 404)
    }

    return c.json({ data: row }, 201)
  })

  .patch("/unit-translations/:translationId", async (c) => {
    const row = await productsService.updateUnitTranslation(
      c.get("db"),
      c.req.param("translationId"),
      updateOptionUnitTranslationSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Unit translation not found" }, 404)
    }

    return c.json({ data: row })
  })

  .delete("/unit-translations/:translationId", async (c) => {
    const row = await productsService.deleteUnitTranslation(
      c.get("db"),
      c.req.param("translationId"),
    )

    if (!row) {
      return c.json({ error: "Unit translation not found" }, 404)
    }

    return c.json({ success: true }, 200)
  })

  // ==========================================================================
  // Product Types
  // ==========================================================================

  .get("/product-types", async (c) => {
    const query = productTypeListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await productsService.listProductTypes(c.get("db"), query))
  })

  .get("/product-types/:typeId", async (c) => {
    const row = await productsService.getProductTypeById(c.get("db"), c.req.param("typeId"))
    if (!row) {
      return c.json({ error: "Product type not found" }, 404)
    }
    return c.json({ data: row })
  })

  .post("/product-types", async (c) => {
    return c.json(
      {
        data: await productsService.createProductType(
          c.get("db"),
          insertProductTypeSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })

  .patch("/product-types/:typeId", async (c) => {
    const row = await productsService.updateProductType(
      c.get("db"),
      c.req.param("typeId"),
      updateProductTypeSchema.parse(await c.req.json()),
    )
    if (!row) {
      return c.json({ error: "Product type not found" }, 404)
    }
    return c.json({ data: row })
  })

  .delete("/product-types/:typeId", async (c) => {
    const row = await productsService.deleteProductType(c.get("db"), c.req.param("typeId"))
    if (!row) {
      return c.json({ error: "Product type not found" }, 404)
    }
    return c.json({ success: true }, 200)
  })

  // ==========================================================================
  // Product Categories
  // ==========================================================================

  .get("/product-categories", async (c) => {
    const query = productCategoryListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await productsService.listProductCategories(c.get("db"), query))
  })

  .get("/product-categories/:categoryId", async (c) => {
    const row = await productsService.getProductCategoryById(c.get("db"), c.req.param("categoryId"))
    if (!row) {
      return c.json({ error: "Product category not found" }, 404)
    }
    return c.json({ data: row })
  })

  .post("/product-categories", async (c) => {
    return c.json(
      {
        data: await productsService.createProductCategory(
          c.get("db"),
          insertProductCategorySchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })

  .patch("/product-categories/:categoryId", async (c) => {
    const row = await productsService.updateProductCategory(
      c.get("db"),
      c.req.param("categoryId"),
      updateProductCategorySchema.parse(await c.req.json()),
    )
    if (!row) {
      return c.json({ error: "Product category not found" }, 404)
    }
    return c.json({ data: row })
  })

  .delete("/product-categories/:categoryId", async (c) => {
    const row = await productsService.deleteProductCategory(c.get("db"), c.req.param("categoryId"))
    if (!row) {
      return c.json({ error: "Product category not found" }, 404)
    }
    return c.json({ success: true }, 200)
  })

  // ==========================================================================
  // Product Tags
  // ==========================================================================

  .get("/product-tags", async (c) => {
    const query = productTagListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(await productsService.listProductTags(c.get("db"), query))
  })

  .get("/product-tags/:tagId", async (c) => {
    const row = await productsService.getProductTagById(c.get("db"), c.req.param("tagId"))
    if (!row) {
      return c.json({ error: "Product tag not found" }, 404)
    }
    return c.json({ data: row })
  })

  .post("/product-tags", async (c) => {
    return c.json(
      {
        data: await productsService.createProductTag(
          c.get("db"),
          insertProductTagSchema.parse(await c.req.json()),
        ),
      },
      201,
    )
  })

  .patch("/product-tags/:tagId", async (c) => {
    const row = await productsService.updateProductTag(
      c.get("db"),
      c.req.param("tagId"),
      updateProductTagSchema.parse(await c.req.json()),
    )
    if (!row) {
      return c.json({ error: "Product tag not found" }, 404)
    }
    return c.json({ data: row })
  })

  .delete("/product-tags/:tagId", async (c) => {
    const row = await productsService.deleteProductTag(c.get("db"), c.req.param("tagId"))
    if (!row) {
      return c.json({ error: "Product tag not found" }, 404)
    }
    return c.json({ success: true }, 200)
  })

  // ==========================================================================
  // Media
  // ==========================================================================

  // GET /media/:mediaId — Get single media item
  .get("/media/:mediaId", async (c) => {
    const row = await productsService.getMediaById(c.get("db"), c.req.param("mediaId"))
    if (!row) {
      return c.json({ error: "Media not found" }, 404)
    }
    return c.json({ data: row })
  })

  // PATCH /media/:mediaId — Update media metadata
  .patch("/media/:mediaId", async (c) => {
    const row = await productsService.updateMedia(
      c.get("db"),
      c.req.param("mediaId"),
      updateProductMediaSchema.parse(await c.req.json()),
    )
    if (!row) {
      return c.json({ error: "Media not found" }, 404)
    }
    return c.json({ data: row })
  })

  // PATCH /media/:mediaId/set-cover — Set as cover image
  .patch("/media/:mediaId/set-cover", async (c) => {
    const media = await productsService.getMediaById(c.get("db"), c.req.param("mediaId"))
    if (!media) {
      return c.json({ error: "Media not found" }, 404)
    }
    const row = await productsService.setCoverMedia(
      c.get("db"),
      media.productId,
      media.id,
      media.dayId,
    )
    if (!row) {
      return c.json({ error: "Failed to set cover" }, 500)
    }
    return c.json({ data: row })
  })

  // DELETE /media/:mediaId — Delete media
  .delete("/media/:mediaId", async (c) => {
    const row = await productsService.deleteMedia(c.get("db"), c.req.param("mediaId"))
    if (!row) {
      return c.json({ error: "Media not found" }, 404)
    }
    return c.json({ data: row })
  })

  // GET /:id — Get single product
  .get("/:id", async (c) => {
    const row = await productsService.getProductById(c.get("db"), c.req.param("id"))

    if (!row) {
      return c.json({ error: "Product not found" }, 404)
    }

    return c.json({ data: row })
  })

  // PATCH /:id — Update product
  .patch("/:id", async (c) => {
    const row = await productsService.updateProduct(
      c.get("db"),
      c.req.param("id"),
      updateProductSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Product not found" }, 404)
    }

    return c.json({ data: row })
  })

  // DELETE /:id — Delete product
  .delete("/:id", async (c) => {
    const row = await productsService.deleteProduct(c.get("db"), c.req.param("id"))

    if (!row) {
      return c.json({ error: "Product not found" }, 404)
    }

    return c.json({ success: true }, 200)
  })

  // ==========================================================================
  // Days
  // ==========================================================================

  // GET /:id/days — List days for product
  .get("/:id/days", async (c) => {
    return c.json({ data: await productsService.listDays(c.get("db"), c.req.param("id")) })
  })

  // POST /:id/days — Add day to product
  .post("/:id/days", async (c) => {
    const row = await productsService.createDay(
      c.get("db"),
      c.req.param("id"),
      insertDaySchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Product not found" }, 404)
    }

    return c.json({ data: row }, 201)
  })

  // PATCH /:id/days/:dayId — Update day
  .patch("/:id/days/:dayId", async (c) => {
    const row = await productsService.updateDay(
      c.get("db"),
      c.req.param("dayId"),
      updateDaySchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Day not found" }, 404)
    }

    return c.json({ data: row })
  })

  // DELETE /:id/days/:dayId — Delete day
  .delete("/:id/days/:dayId", async (c) => {
    const row = await productsService.deleteDay(c.get("db"), c.req.param("dayId"))

    if (!row) {
      return c.json({ error: "Day not found" }, 404)
    }

    return c.json({ success: true }, 200)
  })

  // ==========================================================================
  // Day Services
  // ==========================================================================

  // GET /:id/days/:dayId/services — List services for a day
  .get("/:id/days/:dayId/services", async (c) => {
    return c.json({
      data: await productsService.listDayServices(c.get("db"), c.req.param("dayId")),
    })
  })

  // POST /:id/days/:dayId/services — Add service to day
  .post("/:id/days/:dayId/services", async (c) => {
    const row = await productsService.createDayService(
      c.get("db"),
      c.req.param("id"),
      c.req.param("dayId"),
      insertDayServiceSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Day not found" }, 404)
    }

    return c.json({ data: row }, 201)
  })

  // PATCH /:id/days/:dayId/services/:serviceId — Update service
  .patch("/:id/days/:dayId/services/:serviceId", async (c) => {
    const row = await productsService.updateDayService(
      c.get("db"),
      c.req.param("id"),
      c.req.param("serviceId"),
      updateDayServiceSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Service not found" }, 404)
    }

    return c.json({ data: row })
  })

  // DELETE /:id/days/:dayId/services/:serviceId — Delete service
  .delete("/:id/days/:dayId/services/:serviceId", async (c) => {
    const row = await productsService.deleteDayService(
      c.get("db"),
      c.req.param("id"),
      c.req.param("serviceId"),
    )

    if (!row) {
      return c.json({ error: "Service not found" }, 404)
    }

    return c.json({ success: true }, 200)
  })

  // ==========================================================================
  // Versions
  // ==========================================================================

  // GET /:id/versions — List versions for product
  .get("/:id/versions", async (c) => {
    return c.json({ data: await productsService.listVersions(c.get("db"), c.req.param("id")) })
  })

  // POST /:id/versions — Create version snapshot
  .post("/:id/versions", async (c) => {
    const userId = c.get("userId")

    if (!userId) {
      return c.json({ error: "User ID required to create versions" }, 400)
    }
    const row = await productsService.createVersion(
      c.get("db"),
      c.req.param("id"),
      userId,
      insertVersionSchema.parse(await c.req.json().catch(() => ({}))),
    )

    if (!row) {
      return c.json({ error: "Product not found" }, 404)
    }

    return c.json({ data: row }, 201)
  })

  // ==========================================================================
  // Notes
  // ==========================================================================

  // GET /:id/notes — List notes for product
  .get("/:id/notes", async (c) => {
    return c.json({ data: await productsService.listNotes(c.get("db"), c.req.param("id")) })
  })

  // POST /:id/notes — Add note to product
  .post("/:id/notes", async (c) => {
    const userId = c.get("userId")

    if (!userId) {
      return c.json({ error: "User ID required to create notes" }, 400)
    }
    const row = await productsService.createNote(
      c.get("db"),
      c.req.param("id"),
      userId,
      insertProductNoteSchema.parse(await c.req.json()),
    )

    if (!row) {
      return c.json({ error: "Product not found" }, 404)
    }

    return c.json({ data: row }, 201)
  })

  // ==========================================================================
  // Product <-> Category associations
  // ==========================================================================

  .get("/:id/categories", async (c) => {
    return c.json({
      data: await productsService.listProductCategories_(c.get("db"), c.req.param("id")),
    })
  })

  .post("/:id/categories", async (c) => {
    const { categoryId, sortOrder } = (await c.req.json()) as {
      categoryId: string
      sortOrder?: number
    }
    const row = await productsService.addProductToCategory(
      c.get("db"),
      c.req.param("id"),
      categoryId,
      sortOrder,
    )
    if (!row) {
      return c.json({ error: "Already assigned or not found" }, 409)
    }
    return c.json({ success: true }, 201)
  })

  .delete("/:id/categories/:categoryId", async (c) => {
    const row = await productsService.removeProductFromCategory(
      c.get("db"),
      c.req.param("id"),
      c.req.param("categoryId"),
    )
    if (!row) {
      return c.json({ error: "Association not found" }, 404)
    }
    return c.json({ success: true }, 200)
  })

  // ==========================================================================
  // Product <-> Tag associations
  // ==========================================================================

  .get("/:id/tags", async (c) => {
    return c.json({
      data: await productsService.listProductTags_(c.get("db"), c.req.param("id")),
    })
  })

  .post("/:id/tags", async (c) => {
    const { tagId } = (await c.req.json()) as { tagId: string }
    const row = await productsService.addProductTag(c.get("db"), c.req.param("id"), tagId)
    if (!row) {
      return c.json({ error: "Already assigned or not found" }, 409)
    }
    return c.json({ success: true }, 201)
  })

  .delete("/:id/tags/:tagId", async (c) => {
    const row = await productsService.removeProductTag(
      c.get("db"),
      c.req.param("id"),
      c.req.param("tagId"),
    )
    if (!row) {
      return c.json({ error: "Association not found" }, 404)
    }
    return c.json({ success: true }, 200)
  })

  // ==========================================================================
  // Product Media (nested under product)
  // ==========================================================================

  // GET /:id/media — List product-level media
  .get("/:id/media", async (c) => {
    const query = productMediaListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(
      await productsService.listProductLevelMedia(c.get("db"), c.req.param("id"), query),
    )
  })

  // POST /:id/media — Create media for product
  .post("/:id/media", async (c) => {
    const row = await productsService.createMedia(
      c.get("db"),
      c.req.param("id"),
      insertProductMediaSchema.parse(await c.req.json()),
    )
    if (!row) {
      return c.json({ error: "Product not found or invalid dayId" }, 404)
    }
    return c.json({ data: row }, 201)
  })

  // POST /:id/media/reorder — Batch reorder media
  .post("/:id/media/reorder", async (c) => {
    const data = reorderProductMediaSchema.parse(await c.req.json())
    const results = await productsService.reorderMedia(c.get("db"), data)
    return c.json({ data: results })
  })

  // GET /:id/days/:dayId/media — List day media
  .get("/:id/days/:dayId/media", async (c) => {
    const query = productMediaListQuerySchema.parse(
      Object.fromEntries(new URL(c.req.url).searchParams),
    )
    return c.json(
      await productsService.listMedia(c.get("db"), c.req.param("id"), {
        ...query,
        dayId: c.req.param("dayId"),
      }),
    )
  })

  // POST /:id/days/:dayId/media — Create day media
  .post("/:id/days/:dayId/media", async (c) => {
    const body = insertProductMediaSchema.parse(await c.req.json())
    const row = await productsService.createMedia(c.get("db"), c.req.param("id"), {
      ...body,
      dayId: c.req.param("dayId"),
    })
    if (!row) {
      return c.json({ error: "Product or day not found" }, 404)
    }
    return c.json({ data: row }, 201)
  })

  // ==========================================================================
  // Recalculate
  // ==========================================================================

  // POST /:id/recalculate — Recalculate product cost and margin
  .post("/:id/recalculate", async (c) => {
    const result = await productsService.recalculate(c.get("db"), c.req.param("id"))

    if (!result) {
      return c.json({ error: "Product not found" }, 404)
    }

    return c.json({ data: result })
  })

export type ProductRoutes = typeof productRoutes
