import { and, asc, desc, eq, ilike, inArray, notInArray, or, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

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
} from "./schema.js"
import type {
  PublicCatalogCategoryListQuery,
  PublicCatalogProductListQuery,
  PublicCatalogProductLookupBySlugQuery,
  PublicCatalogTagListQuery,
} from "./validation-public.js"

type PublicCatalogProductRow = typeof products.$inferSelect

function impossibleCondition() {
  return sql`1 = 0`
}

function normalizeDate(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null
  }

  return value instanceof Date ? value.toISOString() : value
}

function normalizeLanguageTag(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase()
  return normalized || null
}

async function listProductIdsForCategory(db: PostgresJsDatabase, categoryId: string) {
  const rows = await db
    .select({ productId: productCategoryProducts.productId })
    .from(productCategoryProducts)
    .innerJoin(productCategories, eq(productCategories.id, productCategoryProducts.categoryId))
    .where(
      and(eq(productCategoryProducts.categoryId, categoryId), eq(productCategories.active, true)),
    )

  return rows.map((row) => row.productId)
}

async function listProductIdsForTag(db: PostgresJsDatabase, tagId: string) {
  const rows = await db
    .select({ productId: productTagProducts.productId })
    .from(productTagProducts)
    .where(eq(productTagProducts.tagId, tagId))

  return rows.map((row) => row.productId)
}

async function listFeaturedProductIds(db: PostgresJsDatabase) {
  const rows = await db
    .select({ productId: productVisibilitySettings.productId })
    .from(productVisibilitySettings)
    .where(eq(productVisibilitySettings.isFeatured, true))

  return rows.map((row) => row.productId)
}

async function hydrateCatalogProducts(
  db: PostgresJsDatabase,
  productRows: PublicCatalogProductRow[],
  options?: { includeContent?: boolean; languageTag?: string | null },
) {
  if (productRows.length === 0) {
    return []
  }

  const productIds = productRows.map((product) => product.id)
  const productTypeIds = Array.from(
    new Set(
      productRows
        .map((product) => product.productTypeId)
        .filter((value): value is string => Boolean(value)),
    ),
  )

  const [
    categoryRows,
    tagRows,
    translationRows,
    typeRows,
    capabilityRows,
    mediaRows,
    featuredRows,
    featureRows,
    faqRows,
    locationRows,
  ] = await Promise.all([
    db
      .select({
        productId: productCategoryProducts.productId,
        id: productCategories.id,
        parentId: productCategories.parentId,
        name: productCategories.name,
        slug: productCategories.slug,
        description: productCategories.description,
        sortOrder: productCategories.sortOrder,
      })
      .from(productCategoryProducts)
      .innerJoin(productCategories, eq(productCategories.id, productCategoryProducts.categoryId))
      .where(
        and(
          inArray(productCategoryProducts.productId, productIds),
          eq(productCategories.active, true),
        ),
      )
      .orderBy(
        asc(productCategoryProducts.sortOrder),
        asc(productCategories.sortOrder),
        asc(productCategories.name),
      ),
    db
      .select({
        productId: productTagProducts.productId,
        id: productTags.id,
        name: productTags.name,
      })
      .from(productTagProducts)
      .innerJoin(productTags, eq(productTags.id, productTagProducts.tagId))
      .where(inArray(productTagProducts.productId, productIds))
      .orderBy(asc(productTags.name)),
    options?.languageTag
      ? db
          .select({
            productId: productTranslations.productId,
            languageTag: productTranslations.languageTag,
            slug: productTranslations.slug,
            name: productTranslations.name,
            shortDescription: productTranslations.shortDescription,
            description: productTranslations.description,
            seoTitle: productTranslations.seoTitle,
            seoDescription: productTranslations.seoDescription,
          })
          .from(productTranslations)
          .where(
            and(
              inArray(productTranslations.productId, productIds),
              eq(productTranslations.languageTag, options.languageTag),
            ),
          )
      : Promise.resolve([]),
    productTypeIds.length > 0
      ? db
          .select({
            id: productTypes.id,
            code: productTypes.code,
            name: productTypes.name,
            description: productTypes.description,
          })
          .from(productTypes)
          .where(and(inArray(productTypes.id, productTypeIds), eq(productTypes.active, true)))
      : Promise.resolve([]),
    db
      .select({
        productId: productCapabilities.productId,
        capability: productCapabilities.capability,
      })
      .from(productCapabilities)
      .where(
        and(
          inArray(productCapabilities.productId, productIds),
          eq(productCapabilities.enabled, true),
        ),
      )
      .orderBy(asc(productCapabilities.capability)),
    db
      .select({
        productId: productMedia.productId,
        id: productMedia.id,
        mediaType: productMedia.mediaType,
        name: productMedia.name,
        url: productMedia.url,
        mimeType: productMedia.mimeType,
        altText: productMedia.altText,
        sortOrder: productMedia.sortOrder,
        isCover: productMedia.isCover,
      })
      .from(productMedia)
      .where(inArray(productMedia.productId, productIds))
      .orderBy(
        desc(productMedia.isCover),
        asc(productMedia.sortOrder),
        asc(productMedia.createdAt),
      ),
    db
      .select({ productId: productVisibilitySettings.productId })
      .from(productVisibilitySettings)
      .where(
        and(
          inArray(productVisibilitySettings.productId, productIds),
          eq(productVisibilitySettings.isFeatured, true),
        ),
      ),
    options?.includeContent
      ? db
          .select({
            productId: productFeatures.productId,
            id: productFeatures.id,
            featureType: productFeatures.featureType,
            title: productFeatures.title,
            description: productFeatures.description,
            sortOrder: productFeatures.sortOrder,
          })
          .from(productFeatures)
          .where(inArray(productFeatures.productId, productIds))
          .orderBy(asc(productFeatures.sortOrder), asc(productFeatures.createdAt))
      : Promise.resolve([]),
    options?.includeContent
      ? db
          .select({
            productId: productFaqs.productId,
            id: productFaqs.id,
            question: productFaqs.question,
            answer: productFaqs.answer,
            sortOrder: productFaqs.sortOrder,
          })
          .from(productFaqs)
          .where(inArray(productFaqs.productId, productIds))
          .orderBy(asc(productFaqs.sortOrder), asc(productFaqs.createdAt))
      : Promise.resolve([]),
    options?.includeContent
      ? db
          .select({
            productId: productLocations.productId,
            id: productLocations.id,
            locationType: productLocations.locationType,
            title: productLocations.title,
            address: productLocations.address,
            city: productLocations.city,
            countryCode: productLocations.countryCode,
            latitude: productLocations.latitude,
            longitude: productLocations.longitude,
            sortOrder: productLocations.sortOrder,
          })
          .from(productLocations)
          .where(inArray(productLocations.productId, productIds))
          .orderBy(asc(productLocations.sortOrder), asc(productLocations.createdAt))
      : Promise.resolve([]),
  ])

  const categoriesByProduct = new Map<string, Array<(typeof categoryRows)[number]>>()
  for (const row of categoryRows) {
    const existing = categoriesByProduct.get(row.productId) ?? []
    existing.push(row)
    categoriesByProduct.set(row.productId, existing)
  }

  const tagsByProduct = new Map<string, Array<(typeof tagRows)[number]>>()
  for (const row of tagRows) {
    const existing = tagsByProduct.get(row.productId) ?? []
    existing.push(row)
    tagsByProduct.set(row.productId, existing)
  }

  const translationByProduct = new Map(translationRows.map((row) => [row.productId, row] as const))

  const capabilitiesByProduct = new Map<string, string[]>()
  for (const row of capabilityRows) {
    const existing = capabilitiesByProduct.get(row.productId) ?? []
    existing.push(row.capability)
    capabilitiesByProduct.set(row.productId, existing)
  }

  const mediaByProduct = new Map<string, Array<(typeof mediaRows)[number]>>()
  for (const row of mediaRows) {
    const existing = mediaByProduct.get(row.productId) ?? []
    existing.push(row)
    mediaByProduct.set(row.productId, existing)
  }

  const featuresByProduct = new Map<string, Array<(typeof featureRows)[number]>>()
  for (const row of featureRows) {
    const existing = featuresByProduct.get(row.productId) ?? []
    existing.push(row)
    featuresByProduct.set(row.productId, existing)
  }

  const faqsByProduct = new Map<string, Array<(typeof faqRows)[number]>>()
  for (const row of faqRows) {
    const existing = faqsByProduct.get(row.productId) ?? []
    existing.push(row)
    faqsByProduct.set(row.productId, existing)
  }

  const locationsByProduct = new Map<string, Array<(typeof locationRows)[number]>>()
  for (const row of locationRows) {
    const existing = locationsByProduct.get(row.productId) ?? []
    existing.push(row)
    locationsByProduct.set(row.productId, existing)
  }

  const typeById = new Map(typeRows.map((row) => [row.id, row] as const))
  const featuredIds = new Set(featuredRows.map((row) => row.productId))

  return productRows.map((product) => {
    const translation = translationByProduct.get(product.id) ?? null
    const media = (mediaByProduct.get(product.id) ?? []).map((row) => ({
      id: row.id,
      mediaType: row.mediaType,
      name: row.name,
      url: row.url,
      mimeType: row.mimeType ?? null,
      altText: row.altText ?? null,
      sortOrder: row.sortOrder,
      isCover: row.isCover,
    }))

    const base = {
      id: product.id,
      name: translation?.name ?? product.name,
      description: translation?.description ?? product.description ?? null,
      contentLanguageTag: translation?.languageTag ?? null,
      slug: translation?.slug ?? null,
      shortDescription: translation?.shortDescription ?? null,
      seoTitle: translation?.seoTitle ?? null,
      seoDescription: translation?.seoDescription ?? null,
      bookingMode: product.bookingMode,
      capacityMode: product.capacityMode,
      visibility: product.visibility,
      sellCurrency: product.sellCurrency,
      sellAmountCents: product.sellAmountCents ?? null,
      startDate: normalizeDate(product.startDate),
      endDate: normalizeDate(product.endDate),
      pax: product.pax ?? null,
      productType: product.productTypeId ? (typeById.get(product.productTypeId) ?? null) : null,
      categories: (categoriesByProduct.get(product.id) ?? []).map((row) => ({
        id: row.id,
        parentId: row.parentId ?? null,
        name: row.name,
        slug: row.slug,
        description: row.description ?? null,
        sortOrder: row.sortOrder,
      })),
      tags: (tagsByProduct.get(product.id) ?? []).map((row) => ({
        id: row.id,
        name: row.name,
      })),
      capabilities: capabilitiesByProduct.get(product.id) ?? [],
      coverMedia: media.find((item) => item.isCover) ?? media[0] ?? null,
      isFeatured: featuredIds.has(product.id),
    }

    if (!options?.includeContent) {
      return base
    }

    return {
      ...base,
      media,
      features: (featuresByProduct.get(product.id) ?? []).map((row) => ({
        id: row.id,
        featureType: row.featureType,
        title: row.title,
        description: row.description ?? null,
        sortOrder: row.sortOrder,
      })),
      faqs: (faqsByProduct.get(product.id) ?? []).map((row) => ({
        id: row.id,
        question: row.question,
        answer: row.answer,
        sortOrder: row.sortOrder,
      })),
      locations: (locationsByProduct.get(product.id) ?? []).map((row) => ({
        id: row.id,
        locationType: row.locationType,
        title: row.title,
        address: row.address ?? null,
        city: row.city ?? null,
        countryCode: row.countryCode ?? null,
        latitude: row.latitude ?? null,
        longitude: row.longitude ?? null,
        sortOrder: row.sortOrder,
      })),
    }
  })
}

function orderProducts(query: PublicCatalogProductListQuery) {
  const direction = query.direction === "desc" ? desc : asc

  switch (query.sort) {
    case "createdAt":
      return direction(products.createdAt)
    case "startDate":
      return direction(products.startDate)
    case "price":
      return direction(products.sellAmountCents)
    default:
      return direction(products.name)
  }
}

export const publicProductsService = {
  async listCatalogProducts(db: PostgresJsDatabase, query: PublicCatalogProductListQuery) {
    const conditions = [
      eq(products.status, "active"),
      eq(products.activated, true),
      eq(products.visibility, "public"),
    ]

    if (query.search) {
      const term = `%${query.search}%`
      const searchCondition = or(ilike(products.name, term), ilike(products.description, term))
      if (searchCondition) {
        conditions.push(searchCondition)
      }
    }

    if (query.bookingMode) {
      conditions.push(eq(products.bookingMode, query.bookingMode))
    }

    if (query.capacityMode) {
      conditions.push(eq(products.capacityMode, query.capacityMode))
    }

    if (query.productTypeId) {
      conditions.push(eq(products.productTypeId, query.productTypeId))
    }

    if (query.categoryId) {
      const productIds = await listProductIdsForCategory(db, query.categoryId)
      conditions.push(
        productIds.length > 0 ? inArray(products.id, productIds) : impossibleCondition(),
      )
    }

    if (query.tagId) {
      const productIds = await listProductIdsForTag(db, query.tagId)
      conditions.push(
        productIds.length > 0 ? inArray(products.id, productIds) : impossibleCondition(),
      )
    }

    if (query.featured !== undefined) {
      const productIds = await listFeaturedProductIds(db)
      conditions.push(
        query.featured
          ? productIds.length > 0
            ? inArray(products.id, productIds)
            : impossibleCondition()
          : productIds.length > 0
            ? notInArray(products.id, productIds)
            : sql`1 = 1`,
      )
    }

    const where = and(...conditions)

    const [rows, countResult] = await Promise.all([
      db
        .select()
        .from(products)
        .where(where)
        .orderBy(orderProducts(query), asc(products.id))
        .limit(query.limit)
        .offset(query.offset),
      db.select({ count: sql<number>`count(*)::int` }).from(products).where(where),
    ])

    return {
      data: await hydrateCatalogProducts(db, rows, {
        languageTag: normalizeLanguageTag(query.languageTag),
      }),
      total: countResult[0]?.count ?? 0,
      limit: query.limit,
      offset: query.offset,
    }
  },

  async getCatalogProductById(
    db: PostgresJsDatabase,
    id: string,
    query: { languageTag?: string | null } = {},
  ) {
    const [row] = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.id, id),
          eq(products.status, "active"),
          eq(products.activated, true),
          eq(products.visibility, "public"),
        ),
      )
      .limit(1)

    if (!row) {
      return null
    }

    const [product] = await hydrateCatalogProducts(db, [row], {
      includeContent: true,
      languageTag: normalizeLanguageTag(query.languageTag),
    })
    return product ?? null
  },

  async getCatalogProductBySlug(
    db: PostgresJsDatabase,
    slug: string,
    query: PublicCatalogProductLookupBySlugQuery = {},
  ) {
    const normalizedSlug = slug.trim().toLowerCase()
    const normalizedLanguageTag = normalizeLanguageTag(query.languageTag)
    const conditions = [
      sql`lower(${productTranslations.slug}) = ${normalizedSlug}`,
      eq(products.status, "active"),
      eq(products.activated, true),
      eq(products.visibility, "public"),
    ]

    if (normalizedLanguageTag) {
      conditions.push(eq(productTranslations.languageTag, normalizedLanguageTag))
    }

    const [row] = await db
      .select({
        productId: products.id,
        languageTag: productTranslations.languageTag,
      })
      .from(productTranslations)
      .innerJoin(products, eq(products.id, productTranslations.productId))
      .where(and(...conditions))
      .orderBy(desc(productTranslations.updatedAt))
      .limit(1)

    if (!row) {
      return null
    }

    return this.getCatalogProductById(db, row.productId, {
      languageTag: normalizedLanguageTag ?? row.languageTag,
    })
  },

  async listCatalogCategories(db: PostgresJsDatabase, query: PublicCatalogCategoryListQuery) {
    const conditions = [eq(productCategories.active, true)]

    if (query.parentId) {
      conditions.push(eq(productCategories.parentId, query.parentId))
    }

    if (query.search) {
      const term = `%${query.search}%`
      const searchCondition = or(
        ilike(productCategories.name, term),
        ilike(productCategories.slug, term),
      )
      if (searchCondition) {
        conditions.push(searchCondition)
      }
    }

    const where = and(...conditions)

    const [rows, countResult] = await Promise.all([
      db
        .select({
          id: productCategories.id,
          parentId: productCategories.parentId,
          name: productCategories.name,
          slug: productCategories.slug,
          description: productCategories.description,
          sortOrder: productCategories.sortOrder,
        })
        .from(productCategories)
        .where(where)
        .orderBy(asc(productCategories.sortOrder), asc(productCategories.name))
        .limit(query.limit)
        .offset(query.offset),
      db.select({ count: sql<number>`count(*)::int` }).from(productCategories).where(where),
    ])

    return {
      data: rows.map((row) => ({
        ...row,
        parentId: row.parentId ?? null,
        description: row.description ?? null,
      })),
      total: countResult[0]?.count ?? 0,
      limit: query.limit,
      offset: query.offset,
    }
  },

  async listCatalogTags(db: PostgresJsDatabase, query: PublicCatalogTagListQuery) {
    const conditions = []

    if (query.search) {
      conditions.push(ilike(productTags.name, `%${query.search}%`))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, countResult] = await Promise.all([
      db
        .select({
          id: productTags.id,
          name: productTags.name,
        })
        .from(productTags)
        .where(where)
        .orderBy(asc(productTags.name))
        .limit(query.limit)
        .offset(query.offset),
      db.select({ count: sql<number>`count(*)::int` }).from(productTags).where(where),
    ])

    return {
      data: rows,
      total: countResult[0]?.count ?? 0,
      limit: query.limit,
      offset: query.offset,
    }
  },
}
