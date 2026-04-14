import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import {
  getStorefrontDeparture,
  getStorefrontDepartureItinerary,
  getStorefrontProductExtensions,
  listStorefrontProductDepartures,
  previewStorefrontDeparturePrice,
} from "./service-departures.js"
import {
  type StorefrontDepartureListQuery,
  type StorefrontDeparturePricePreviewInput,
  type StorefrontFormField,
  type StorefrontFormFieldInput,
  type StorefrontPaymentMethod,
  type StorefrontPaymentMethodCode,
  type StorefrontPaymentMethodInput,
  type StorefrontPromotionalOffer,
  type StorefrontSettings,
  type StorefrontSettingsInput,
  storefrontSettingsInputSchema,
  storefrontSettingsSchema,
} from "./validation.js"

export interface StorefrontServiceOptions {
  settings?: StorefrontSettingsInput
  offers?: {
    listApplicableOffers?: (input: {
      productId: string
      departureId?: string
      locale?: string
    }) => Promise<StorefrontPromotionalOffer[]> | StorefrontPromotionalOffer[]
    getOfferBySlug?: (input: {
      slug: string
      locale?: string
    }) => Promise<StorefrontPromotionalOffer | null> | StorefrontPromotionalOffer | null
  }
}

const defaultPaymentLabels: Record<StorefrontPaymentMethodCode, string> = {
  card: "Card",
  bank_transfer: "Bank transfer",
  cash: "Cash",
  voucher: "Voucher",
  invoice: "Invoice",
}

function normalizeField(field: StorefrontFormFieldInput): StorefrontFormField {
  return {
    key: field.key,
    label: field.label,
    type: field.type,
    required: field.required,
    placeholder: field.placeholder ?? null,
    description: field.description ?? null,
    autocomplete: field.autocomplete ?? null,
    options: field.options,
  }
}

function normalizePaymentMethod(method: StorefrontPaymentMethodInput): StorefrontPaymentMethod {
  return {
    code: method.code,
    label: method.label ?? defaultPaymentLabels[method.code],
    description: method.description ?? null,
    enabled: method.enabled,
  }
}

export function resolveStorefrontSettings(input?: StorefrontSettingsInput): StorefrontSettings {
  const parsed = storefrontSettingsInputSchema.parse(input ?? {})

  return storefrontSettingsSchema.parse({
    branding: {
      logoUrl: parsed.branding?.logoUrl ?? null,
      supportedLanguages: parsed.branding?.supportedLanguages ?? [],
    },
    support: {
      email: parsed.support?.email ?? null,
      phone: parsed.support?.phone ?? null,
    },
    legal: {
      termsUrl: parsed.legal?.termsUrl ?? null,
      privacyUrl: parsed.legal?.privacyUrl ?? null,
      defaultContractTemplateId: parsed.legal?.defaultContractTemplateId ?? null,
    },
    forms: {
      billing: {
        fields: (parsed.forms?.billing?.fields ?? []).map(normalizeField),
      },
      passengers: {
        fields: (parsed.forms?.passengers?.fields ?? []).map(normalizeField),
      },
    },
    payment: {
      defaultMethod: parsed.payment?.defaultMethod ?? null,
      methods: (parsed.payment?.methods ?? []).map(normalizePaymentMethod),
    },
  })
}

export function createStorefrontService(options?: StorefrontServiceOptions) {
  const settings = resolveStorefrontSettings(options?.settings)

  return {
    getSettings(): StorefrontSettings {
      return settings
    },
    getDeparture(db: PostgresJsDatabase, departureId: string) {
      return getStorefrontDeparture(db, departureId)
    },
    listProductDepartures(
      db: PostgresJsDatabase,
      productId: string,
      query: StorefrontDepartureListQuery,
    ) {
      return listStorefrontProductDepartures(db, productId, query)
    },
    previewDeparturePrice(
      db: PostgresJsDatabase,
      departureId: string,
      input: StorefrontDeparturePricePreviewInput,
    ) {
      return previewStorefrontDeparturePrice(db, departureId, input)
    },
    getProductExtensions(db: PostgresJsDatabase, productId: string, optionId?: string) {
      return getStorefrontProductExtensions(db, productId, optionId)
    },
    getDepartureItinerary(
      db: PostgresJsDatabase,
      input: { departureId: string; productId: string },
    ) {
      return getStorefrontDepartureItinerary(db, input)
    },
    async listApplicableOffers(input: {
      productId: string
      departureId?: string
      locale?: string
    }): Promise<StorefrontPromotionalOffer[]> {
      const offers = await options?.offers?.listApplicableOffers?.(input)
      return offers ?? []
    },
    async getOfferBySlug(input: {
      slug: string
      locale?: string
    }): Promise<StorefrontPromotionalOffer | null> {
      return (await options?.offers?.getOfferBySlug?.(input)) ?? null
    },
  }
}
