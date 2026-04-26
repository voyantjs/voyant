import { useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { fetchWithValidation } from "../client.js"
import { useVoyantCruisesContext } from "../provider.js"
import { cruisesQueryKeys } from "../query-keys.js"
import { quoteSchema, singleEnvelope } from "../schemas.js"

// ---------- shared input shapes (mirror server cruisesBookingService) ----------

export interface BookingPassengerInput {
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  travelerCategory?: "adult" | "child" | "infant" | "senior" | "other" | null
  preferredLanguage?: string | null
  specialRequests?: string | null
  isPrimary?: boolean
  notes?: string | null
}

export interface BookingContactInput {
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  language?: string | null
  country?: string | null
  region?: string | null
  city?: string | null
  address?: string | null
  postalCode?: string | null
}

export type BookingMode = "inquiry" | "reserve"

// ---------- single-cabin booking ----------

export interface CreateCruiseBookingInput {
  sailingId: string
  cabinCategoryId: string
  cabinId?: string | null
  occupancy: number
  fareCode?: string | null
  mode?: BookingMode
  personId?: string | null
  organizationId?: string | null
  contact: BookingContactInput
  passengers: BookingPassengerInput[]
  notes?: string | null
}

const cruiseBookingResultSchema = singleEnvelope(
  z.object({
    bookingId: z.string(),
    bookingNumber: z.string(),
    cruiseDetails: z.unknown(),
    quote: quoteSchema,
  }),
)

const cruisePartyBookingResultSchema = singleEnvelope(
  z.object({
    groupId: z.string(),
    primaryBookingId: z.string().nullable(),
    groupDetails: z.unknown(),
    cabins: z.array(
      z.object({
        bookingId: z.string(),
        bookingNumber: z.string(),
        cruiseDetails: z.unknown(),
        quote: quoteSchema,
      }),
    ),
  }),
)

export type CreateCruiseBookingResult = z.infer<typeof cruiseBookingResultSchema>["data"]
export type CreateCruisePartyBookingResult = z.infer<typeof cruisePartyBookingResultSchema>["data"]

// ---------- multi-cabin party booking ----------

export interface PartyCabinEntry {
  cabinCategoryId: string
  cabinId?: string | null
  occupancy: number
  fareCode?: string | null
  passengers: BookingPassengerInput[]
  notes?: string | null
}

export interface CreateCruisePartyBookingInput {
  sailingId: string
  cabins: PartyCabinEntry[]
  leadPersonId?: string | null
  organizationId?: string | null
  contact: BookingContactInput
  mode?: BookingMode
  label?: string
  notes?: string | null
}

/**
 * Booking creation hooks. The route layer detects local vs external
 * sailings from the unified key and dispatches accordingly — this hook
 * doesn't need to branch.
 */
export function useCruiseBookingMutation() {
  const { baseUrl, fetcher } = useVoyantCruisesContext()
  const client = { baseUrl, fetcher }
  const queryClient = useQueryClient()

  const createSingle = useMutation({
    mutationFn: async ({
      sailingKey,
      input,
    }: {
      sailingKey: string
      input: CreateCruiseBookingInput
    }): Promise<CreateCruiseBookingResult> => {
      const result = await fetchWithValidation(
        `/v1/admin/cruises/sailings/${encodeURIComponent(sailingKey)}/bookings`,
        cruiseBookingResultSchema,
        client,
        { method: "POST", body: JSON.stringify(input) },
      )
      return result.data
    },
    onSuccess: () => {
      // Bookings live in the bookings module; we invalidate cruise aggregates
      // because price availability may have changed (cabin sold).
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.cruises() })
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.sailings() })
    },
  })

  const createParty = useMutation({
    mutationFn: async ({
      sailingKey,
      input,
    }: {
      sailingKey: string
      input: CreateCruisePartyBookingInput
    }): Promise<CreateCruisePartyBookingResult> => {
      const result = await fetchWithValidation(
        `/v1/admin/cruises/sailings/${encodeURIComponent(sailingKey)}/party-bookings`,
        cruisePartyBookingResultSchema,
        client,
        { method: "POST", body: JSON.stringify(input) },
      )
      return result.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.cruises() })
      void queryClient.invalidateQueries({ queryKey: cruisesQueryKeys.sailings() })
    },
  })

  return { createSingle, createParty }
}
