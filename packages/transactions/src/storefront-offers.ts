import { desc, eq, inArray } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { z } from "zod"

import { offerItems, offers } from "./schema.js"
import { storefrontOfferDiscountTypeSchema, storefrontOfferMetadataSchema } from "./validation.js"

export const storefrontOfferEnvelopeSchema = z.object({
  storefrontPromotionalOffer: storefrontOfferMetadataSchema,
})

export const storefrontPromotionalOfferSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().nullable(),
  description: z.string().nullable(),
  discountType: storefrontOfferDiscountTypeSchema,
  discountValue: z.string(),
  currency: z.string().nullable(),
  applicableProductIds: z.array(z.string()),
  applicableDepartureIds: z.array(z.string()),
  validFrom: z.string().nullable(),
  validTo: z.string().nullable(),
  minPassengers: z.number().int().nullable(),
  imageMobileUrl: z.string().nullable(),
  imageDesktopUrl: z.string().nullable(),
  stackable: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type StorefrontOfferMetadata = z.infer<typeof storefrontOfferMetadataSchema>
export type StorefrontPromotionalOffer = z.infer<typeof storefrontPromotionalOfferSchema>

function parseStorefrontMetadata(metadata: unknown) {
  if (!metadata) {
    return null
  }

  const nested = storefrontOfferEnvelopeSchema.safeParse(metadata)
  if (nested.success) {
    return nested.data.storefrontPromotionalOffer
  }

  const direct = storefrontOfferMetadataSchema.safeParse(metadata)
  if (direct.success) {
    return direct.data
  }

  return null
}

function normalizeDateToIso(
  value: Date | string | null | undefined,
  mode: "start" | "end" = "start",
): string | null {
  if (!value) {
    return null
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T${mode === "end" ? "23:59:59.999" : "00:00:00.000"}Z`).toISOString()
  }

  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function isOfferActive(now: Date, validFrom: string | null, validTo: string | null) {
  const from = validFrom ? new Date(validFrom) : null
  const to = validTo ? new Date(validTo) : null

  if (from && from > now) {
    return false
  }

  if (to && to < now) {
    return false
  }

  return true
}

function matchesLocale(metadata: StorefrontOfferMetadata, locale?: string) {
  if (!locale || !metadata.locale) {
    return true
  }

  return metadata.locale.toLowerCase() === locale.toLowerCase()
}

function matchesApplicability(input: {
  productId: string
  departureId?: string
  applicableProductIds: string[]
  applicableDepartureIds: string[]
}) {
  if (!input.applicableProductIds.includes(input.productId)) {
    return false
  }

  if (!input.departureId) {
    return true
  }

  if (input.applicableDepartureIds.length === 0) {
    return true
  }

  return input.applicableDepartureIds.includes(input.departureId)
}

export async function listStorefrontPromotionalOffers(
  db: PostgresJsDatabase,
  input: {
    productId: string
    departureId?: string
    locale?: string
    now?: Date
  },
): Promise<StorefrontPromotionalOffer[]> {
  const now = input.now ?? new Date()
  const rows = await db
    .select()
    .from(offers)
    .where(eq(offers.status, "published"))
    .orderBy(desc(offers.createdAt))

  if (rows.length === 0) {
    return []
  }

  const offerIds = rows.map((row) => row.id)
  const itemRows = await db
    .select({ offerId: offerItems.offerId, productId: offerItems.productId })
    .from(offerItems)
    .where(inArray(offerItems.offerId, offerIds))

  const productIdsByOffer = new Map<string, Set<string>>()
  for (const item of itemRows) {
    if (!item.productId) {
      continue
    }

    let set = productIdsByOffer.get(item.offerId)
    if (!set) {
      set = new Set<string>()
      productIdsByOffer.set(item.offerId, set)
    }
    set.add(item.productId)
  }

  return rows
    .map((row) => {
      const metadata = parseStorefrontMetadata(row.metadata)
      if (!metadata?.enabled || !matchesLocale(metadata, input.locale)) {
        return null
      }

      const validFrom = normalizeDateToIso(metadata.validFrom ?? row.validFrom, "start")
      const validTo = normalizeDateToIso(metadata.validTo ?? row.validUntil, "end")
      if (!isOfferActive(now, validFrom, validTo)) {
        return null
      }

      const applicableProductIds = metadata.applicableProductIds.length
        ? metadata.applicableProductIds
        : Array.from(productIdsByOffer.get(row.id) ?? [])

      if (
        !matchesApplicability({
          productId: input.productId,
          departureId: input.departureId,
          applicableProductIds,
          applicableDepartureIds: metadata.applicableDepartureIds,
        })
      ) {
        return null
      }

      return storefrontPromotionalOfferSchema.parse({
        id: row.id,
        name: row.title,
        slug: metadata.slug ?? null,
        description: metadata.description ?? null,
        discountType: metadata.discountType,
        discountValue: metadata.discountValue,
        currency: metadata.currency ?? row.currency ?? null,
        applicableProductIds,
        applicableDepartureIds: metadata.applicableDepartureIds,
        validFrom,
        validTo,
        minPassengers: metadata.minPassengers ?? null,
        imageMobileUrl: metadata.imageMobileUrl ?? null,
        imageDesktopUrl: metadata.imageDesktopUrl ?? null,
        stackable: metadata.stackable,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })
    })
    .filter((row): row is StorefrontPromotionalOffer => row !== null)
}

export async function getStorefrontPromotionalOfferBySlug(
  db: PostgresJsDatabase,
  input: {
    slug: string
    locale?: string
    now?: Date
  },
): Promise<StorefrontPromotionalOffer | null> {
  const now = input.now ?? new Date()
  const rows = await db
    .select()
    .from(offers)
    .where(eq(offers.status, "published"))
    .orderBy(desc(offers.createdAt))

  for (const row of rows) {
    const metadata = parseStorefrontMetadata(row.metadata)
    if (!metadata?.enabled || !metadata.slug || !matchesLocale(metadata, input.locale)) {
      continue
    }

    if (metadata.slug !== input.slug) {
      continue
    }

    const validFrom = normalizeDateToIso(metadata.validFrom ?? row.validFrom, "start")
    const validTo = normalizeDateToIso(metadata.validTo ?? row.validUntil, "end")
    if (!isOfferActive(now, validFrom, validTo)) {
      continue
    }

    const productIds = await db
      .select({ productId: offerItems.productId })
      .from(offerItems)
      .where(eq(offerItems.offerId, row.id))

    const applicableProductIds = metadata.applicableProductIds.length
      ? metadata.applicableProductIds
      : productIds.map((item) => item.productId).filter((item): item is string => Boolean(item))

    return storefrontPromotionalOfferSchema.parse({
      id: row.id,
      name: row.title,
      slug: metadata.slug,
      description: metadata.description ?? null,
      discountType: metadata.discountType,
      discountValue: metadata.discountValue,
      currency: metadata.currency ?? row.currency ?? null,
      applicableProductIds,
      applicableDepartureIds: metadata.applicableDepartureIds,
      validFrom,
      validTo,
      minPassengers: metadata.minPassengers ?? null,
      imageMobileUrl: metadata.imageMobileUrl ?? null,
      imageDesktopUrl: metadata.imageDesktopUrl ?? null,
      stackable: metadata.stackable,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })
  }

  return null
}

export function createStorefrontPromotionalOffersResolver(db: PostgresJsDatabase) {
  return {
    listApplicableOffers(input: { productId: string; departureId?: string; locale?: string }) {
      return listStorefrontPromotionalOffers(db, input)
    },
    getOfferBySlug(input: { slug: string; locale?: string }) {
      return getStorefrontPromotionalOfferBySlug(db, input)
    },
  }
}
