"use client"

import { type FetchWithValidationOptions, fetchWithValidation, withQueryParams } from "./client.js"
import {
  type StorefrontDepartureListQuery,
  type StorefrontDeparturePricePreviewInput,
  type StorefrontProductExtensionsQuery,
  type StorefrontPromotionalOfferListQuery,
  storefrontDepartureItineraryResponseSchema,
  storefrontDepartureListResponseSchema,
  storefrontDeparturePricePreviewInputSchema,
  storefrontDeparturePricePreviewResponseSchema,
  storefrontDepartureResponseSchema,
  storefrontProductExtensionsResponseSchema,
  storefrontPromotionalOfferListResponseSchema,
  storefrontPromotionalOfferResponseSchema,
  storefrontSettingsResponseSchema,
} from "./schemas.js"

export function getStorefrontSettings(client: FetchWithValidationOptions) {
  return fetchWithValidation("/v1/public/settings", storefrontSettingsResponseSchema, client)
}

export function getStorefrontDeparture(client: FetchWithValidationOptions, departureId: string) {
  return fetchWithValidation(
    `/v1/public/departures/${departureId}`,
    storefrontDepartureResponseSchema,
    client,
  )
}

export function listStorefrontProductDepartures(
  client: FetchWithValidationOptions,
  productId: string,
  query?: StorefrontDepartureListQuery,
) {
  return fetchWithValidation(
    withQueryParams(`/v1/public/products/${productId}/departures`, query),
    storefrontDepartureListResponseSchema,
    client,
  )
}

export function previewStorefrontDeparturePrice(
  client: FetchWithValidationOptions,
  departureId: string,
  input: StorefrontDeparturePricePreviewInput,
) {
  const parsed = storefrontDeparturePricePreviewInputSchema.parse(input)

  return fetchWithValidation(
    `/v1/public/departures/${departureId}/price`,
    storefrontDeparturePricePreviewResponseSchema,
    client,
    { method: "POST", body: JSON.stringify(parsed) },
  )
}

export function listStorefrontProductExtensions(
  client: FetchWithValidationOptions,
  productId: string,
  query?: StorefrontProductExtensionsQuery,
) {
  return fetchWithValidation(
    withQueryParams(`/v1/public/products/${productId}/extensions`, query),
    storefrontProductExtensionsResponseSchema,
    client,
  )
}

export function getStorefrontDepartureItinerary(
  client: FetchWithValidationOptions,
  productId: string,
  departureId: string,
) {
  return fetchWithValidation(
    `/v1/public/products/${productId}/departures/${departureId}/itinerary`,
    storefrontDepartureItineraryResponseSchema,
    client,
  )
}

export function listStorefrontProductOffers(
  client: FetchWithValidationOptions,
  productId: string,
  query?: StorefrontPromotionalOfferListQuery,
) {
  return fetchWithValidation(
    withQueryParams(`/v1/public/products/${productId}/offers`, query),
    storefrontPromotionalOfferListResponseSchema,
    client,
  )
}

export function getStorefrontOfferBySlug(
  client: FetchWithValidationOptions,
  slug: string,
  query?: Pick<StorefrontPromotionalOfferListQuery, "locale">,
) {
  return fetchWithValidation(
    withQueryParams(`/v1/public/offers/${slug}`, query),
    storefrontPromotionalOfferResponseSchema,
    client,
  )
}
