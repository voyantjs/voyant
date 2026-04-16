"use client"

import { type UseBookingItemsOptions, useBookingItems } from "./use-booking-items.js"

export type UseBookingPrimaryProductOptions = UseBookingItemsOptions

export interface UseBookingPrimaryProductResult {
  /**
   * The productId of the first booking item that has a non-null productId,
   * or null if no item has one (or items haven't loaded yet).
   */
  productId: string | null
  /**
   * The optionUnitId from the same item the `productId` was sourced from,
   * or null if that item has none (or no item resolved).
   */
  optionUnitId: string | null
  /** True while the underlying items query has no data yet. */
  isPending: boolean
  /** True while the underlying items query is loading for the first time. */
  isLoading: boolean
}

/**
 * Derive the "primary product" of a booking from its items.
 *
 * Tour-operator-style bookings are almost always scoped to a single product,
 * but the product association lives on `bookingItem`, not `booking`. This hook
 * encapsulates the canonical resolution — "first item with a non-null
 * productId" — so consumers don't duplicate it.
 */
export function useBookingPrimaryProduct(
  bookingId: string | null | undefined,
  options: UseBookingPrimaryProductOptions = {},
): UseBookingPrimaryProductResult {
  const query = useBookingItems(bookingId, options)
  const primary = query.data?.data.find((i) => i.productId) ?? null

  return {
    productId: primary?.productId ?? null,
    optionUnitId: primary?.optionUnitId ?? null,
    isPending: query.isPending,
    isLoading: query.isLoading,
  }
}
