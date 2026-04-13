import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { Hono } from "hono"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"

import { publicProductRoutes } from "../../src/routes-public.js"
import {
  productCapabilities,
  productCategories,
  productCategoryProducts,
  productFaqs,
  productFeatures,
  productLocations,
  productMedia,
  products,
  productTagProducts,
  productTags,
  productTranslations,
  productTypes,
  productVisibilitySettings,
} from "../../src/schema.js"

const DB_AVAILABLE = !!process.env.TEST_DATABASE_URL

describe.skipIf(!DB_AVAILABLE)("Public product routes", () => {
  let app: Hono
  let db: PostgresJsDatabase

  beforeAll(async () => {
    const { createTestDb, cleanupTestDb } = await import("@voyantjs/db/test-utils")
    db = createTestDb()
    await cleanupTestDb(db)

    app = new Hono()
    app.use("*", async (c, next) => {
      c.set("db" as never, db)
      c.set("userId" as never, "test-user-id")
      await next()
    })
    app.route("/", publicProductRoutes)
  })

  beforeEach(async () => {
    const { cleanupTestDb } = await import("@voyantjs/db/test-utils")
    await cleanupTestDb(db)
  })

  it("lists only storefront-visible products with catalog relations", async () => {
    const [productType] = await db
      .insert(productTypes)
      .values({ name: "Tour", code: "tour", active: true })
      .returning()

    const [category] = await db
      .insert(productCategories)
      .values({ name: "City Breaks", slug: "city-breaks", active: true })
      .returning()

    const [tag] = await db.insert(productTags).values({ name: "Family" }).returning()

    const [publicProduct] = await db
      .insert(products)
      .values({
        name: "Barcelona Weekend",
        description: "A curated city break itinerary.",
        status: "active",
        activated: true,
        visibility: "public",
        sellCurrency: "EUR",
        sellAmountCents: 49900,
        productTypeId: productType.id,
      })
      .returning()

    await db.insert(productCategoryProducts).values({
      productId: publicProduct.id,
      categoryId: category.id,
    })
    await db.insert(productTagProducts).values({ productId: publicProduct.id, tagId: tag.id })
    await db.insert(productCapabilities).values({
      productId: publicProduct.id,
      capability: "instant_confirmation",
      enabled: true,
    })
    await db.insert(productVisibilitySettings).values({
      productId: publicProduct.id,
      isSearchable: true,
      isBookable: true,
      isFeatured: true,
    })
    await db.insert(productMedia).values({
      productId: publicProduct.id,
      mediaType: "image",
      name: "Cover",
      url: "https://example.com/barcelona.jpg",
      isCover: true,
    })

    await db.insert(products).values({
      name: "Internal Product",
      status: "active",
      activated: true,
      visibility: "private",
      sellCurrency: "EUR",
    })

    const res = await app.request("/", { method: "GET" })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.total).toBe(1)
    expect(body.data).toHaveLength(1)
    expect(body.data[0]?.name).toBe("Barcelona Weekend")
    expect(body.data[0]?.productType?.code).toBe("tour")
    expect(body.data[0]?.categories[0]?.slug).toBe("city-breaks")
    expect(body.data[0]?.tags[0]?.name).toBe("Family")
    expect(body.data[0]?.coverMedia?.url).toContain("barcelona")
    expect(body.data[0]?.isFeatured).toBe(true)
  })

  it("returns hydrated public product detail", async () => {
    const [product] = await db
      .insert(products)
      .values({
        name: "Danube Cruise",
        description: "River cruise through major capitals.",
        status: "active",
        activated: true,
        visibility: "public",
        sellCurrency: "EUR",
      })
      .returning()

    await db.insert(productMedia).values({
      productId: product.id,
      mediaType: "image",
      name: "Gallery",
      url: "https://example.com/danube.jpg",
      isCover: true,
    })
    await db.insert(productFeatures).values({
      productId: product.id,
      featureType: "highlight",
      title: "Premium cabin",
    })
    await db.insert(productFaqs).values({
      productId: product.id,
      question: "Are transfers included?",
      answer: "Yes.",
    })
    await db.insert(productLocations).values({
      productId: product.id,
      locationType: "start",
      title: "Budapest Port",
      city: "Budapest",
      countryCode: "HU",
    })

    const res = await app.request(`/${product.id}`, { method: "GET" })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.id).toBe(product.id)
    expect(body.data.media).toHaveLength(1)
    expect(body.data.features[0]?.title).toBe("Premium cabin")
    expect(body.data.faqs[0]?.answer).toBe("Yes.")
    expect(body.data.locations[0]?.city).toBe("Budapest")
  })

  it("returns localized public catalog fields and slug lookup", async () => {
    const [product] = await db
      .insert(products)
      .values({
        name: "Danube Cruise",
        description: "River cruise through major capitals.",
        status: "active",
        activated: true,
        visibility: "public",
        sellCurrency: "EUR",
      })
      .returning()

    await db.insert(productTranslations).values({
      productId: product.id,
      languageTag: "ro",
      slug: "croaziera-dunare",
      name: "Croaziera pe Dunare",
      shortDescription: "Croaziera fluviala prin capitale europene.",
      description: "Itinerar localizat pentru croaziera pe Dunare.",
      seoTitle: "Croaziera pe Dunare",
      seoDescription: "Rezerva croaziera pe Dunare.",
    })

    const detailRes = await app.request(`/${product.id}?languageTag=ro`, { method: "GET" })
    expect(detailRes.status).toBe(200)
    const detailBody = await detailRes.json()
    expect(detailBody.data.name).toBe("Croaziera pe Dunare")
    expect(detailBody.data.slug).toBe("croaziera-dunare")
    expect(detailBody.data.seoTitle).toBe("Croaziera pe Dunare")
    expect(detailBody.data.contentLanguageTag).toBe("ro")

    const slugRes = await app.request("/slug/croaziera-dunare?languageTag=ro", { method: "GET" })
    expect(slugRes.status).toBe(200)
    const slugBody = await slugRes.json()
    expect(slugBody.data.id).toBe(product.id)
    expect(slugBody.data.shortDescription).toBe("Croaziera fluviala prin capitale europene.")
  })

  it("lists active public categories and tags", async () => {
    await db.insert(productCategories).values([
      { name: "Beach", slug: "beach", active: true },
      { name: "Hidden", slug: "hidden", active: false },
    ])
    await db.insert(productTags).values([{ name: "Summer" }, { name: "Adventure" }])

    const categoriesRes = await app.request("/categories", { method: "GET" })
    expect(categoriesRes.status).toBe(200)
    const categoriesBody = await categoriesRes.json()
    expect(categoriesBody.total).toBe(1)
    expect(categoriesBody.data[0]?.slug).toBe("beach")

    const tagsRes = await app.request("/tags", { method: "GET" })
    expect(tagsRes.status).toBe(200)
    const tagsBody = await tagsRes.json()
    expect(tagsBody.total).toBe(2)
    expect(tagsBody.data.map((tag: { name: string }) => tag.name)).toEqual(["Adventure", "Summer"])
  })
})
