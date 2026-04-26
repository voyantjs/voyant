import { bookingGroupsService, bookingsService } from "@voyantjs/bookings"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import {
  type BookingCruiseDetail,
  type BookingGroupCruiseDetail,
  bookingCruiseDetailsService,
  bookingGroupCruiseDetailsService,
} from "./booking-extension.js"
import { pricingService, type Quote } from "./service-pricing.js"

// ---------- shared shapes ----------

export type CruiseBookingPassenger = {
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  travelerCategory?: "adult" | "child" | "infant" | "senior" | "other" | null
  preferredLanguage?: string | null
  specialRequests?: string | null
  personId?: string | null
  isPrimary?: boolean
  notes?: string | null
}

export type CruiseBookingContact = {
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

export type CruiseBookingMode = "inquiry" | "reserve"

// ---------- single-cabin booking ----------

export type CreateCruiseBookingInput = {
  sailingId: string
  cabinCategoryId: string
  cabinId?: string | null
  occupancy: number
  fareCode?: string | null
  mode?: CruiseBookingMode
  personId?: string | null
  organizationId?: string | null
  contact: CruiseBookingContact
  passengers: CruiseBookingPassenger[]
  notes?: string | null
}

export type CreateCruiseBookingResult = {
  bookingId: string
  bookingNumber: string
  cruiseDetails: BookingCruiseDetail
  quote: Quote
}

function generateCruiseBookingNumber(suffix?: string | number): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return suffix === undefined ? `CR-${ts}-${rand}` : `CR-${ts}-${rand}-${suffix}`
}

function priceCentsFromString(s: string): number {
  // For passing to bookingsService which expects integer cents.
  // Pricing service emits decimal strings already validated to ^-?\d+(\.\d{1,2})?$
  const negative = s.startsWith("-")
  const abs = negative ? s.slice(1) : s
  const parts = abs.split(".")
  const whole = parts[0] ?? "0"
  const frac = parts[1] ?? ""
  const fracPadded = (frac + "00").slice(0, 2)
  const cents = Number(whole) * 100 + Number(fracPadded)
  return negative ? -cents : cents
}

export const cruisesBookingService = {
  /**
   * Create a single-cabin cruise booking.
   *
   * Atomic: assembles the quote, creates the booking via bookingsService,
   * inserts travelers, snapshots the quote into booking_cruise_details — all
   * in one transaction. If any step fails the transaction is rolled back.
   *
   * Self-managed (local) sailings only in v1. External sailings flow through
   * the adapter contract in §10 of the design doc; that branch lands in phase 3.
   */
  async createCruiseBooking(
    db: PostgresJsDatabase,
    input: CreateCruiseBookingInput,
    userId?: string,
  ): Promise<CreateCruiseBookingResult> {
    const guestCount = input.passengers.length
    if (guestCount < 1) throw new Error("At least one passenger is required")
    if (guestCount > input.occupancy) {
      throw new Error(
        `passengers.length (${guestCount}) cannot exceed occupancy (${input.occupancy})`,
      )
    }

    return db.transaction(async (tx) => {
      // 1. Resolve quote (reads pricing for self-managed sailings).
      const quote = await pricingService.assembleQuote(tx, {
        sailingId: input.sailingId,
        cabinCategoryId: input.cabinCategoryId,
        occupancy: input.occupancy,
        guestCount,
        fareCode: input.fareCode ?? null,
      })

      // 2. Create the booking row.
      const bookingNumber = generateCruiseBookingNumber()
      const totalCents = priceCentsFromString(quote.totalForCabin)
      const booking = await bookingsService.createBooking(
        tx,
        {
          bookingNumber,
          sellCurrency: quote.currency,
          status: "draft",
          sourceType: "manual",
          personId: input.personId ?? null,
          organizationId: input.organizationId ?? null,
          contactFirstName: input.contact.firstName,
          contactLastName: input.contact.lastName,
          contactEmail: input.contact.email ?? null,
          contactPhone: input.contact.phone ?? null,
          contactPreferredLanguage: input.contact.language ?? null,
          contactCountry: input.contact.country ?? null,
          contactRegion: input.contact.region ?? null,
          contactCity: input.contact.city ?? null,
          contactAddressLine1: input.contact.address ?? null,
          contactPostalCode: input.contact.postalCode ?? null,
          sellAmountCents: totalCents,
          pax: guestCount,
          internalNotes: input.notes ?? null,
        },
        userId,
      )
      if (!booking) throw new Error("bookingsService.createBooking returned null")

      // 3. Insert travelers.
      for (const passenger of input.passengers) {
        await bookingsService.createTraveler(
          tx,
          booking.id,
          {
            firstName: passenger.firstName,
            lastName: passenger.lastName,
            email: passenger.email ?? null,
            phone: passenger.phone ?? null,
            travelerCategory: passenger.travelerCategory ?? null,
            preferredLanguage: passenger.preferredLanguage ?? null,
            specialRequests: passenger.specialRequests ?? null,
            isPrimary: passenger.isPrimary ?? false,
            notes: passenger.notes ?? null,
          },
          userId,
        )
      }

      // 4. Snapshot the quote into booking_cruise_details.
      const cruiseDetails = await bookingCruiseDetailsService.upsert(tx, booking.id, {
        sailingId: input.sailingId,
        cabinCategoryId: input.cabinCategoryId,
        cabinId: input.cabinId ?? null,
        occupancy: input.occupancy,
        fareCode: input.fareCode ?? null,
        mode: input.mode ?? "inquiry",
        quotedPricePerPerson: quote.totalPerPerson,
        quotedTotalForCabin: quote.totalForCabin,
        quotedCurrency: quote.currency,
        quotedComponentsJson: quote.components,
        connectorBookingRef: null,
        connectorStatus: null,
        notes: input.notes ?? null,
      })

      return {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        cruiseDetails,
        quote,
      }
    })
  },

  /**
   * Create a multi-cabin cruise booking — one booking_group of kind 'cruise_party'
   * containing N child cabin bookings on the same sailing.
   *
   * Same atomicity guarantees as createCruiseBooking. The group is the unit of
   * shared confirmation / atomic cancellation / single deposit.
   */
  async createCruisePartyBooking(
    db: PostgresJsDatabase,
    input: CreateCruisePartyBookingInput,
    userId?: string,
  ): Promise<CreateCruisePartyBookingResult> {
    if (input.cabins.length < 2) {
      throw new Error(
        "createCruisePartyBooking requires at least 2 cabins; use createCruiseBooking for a single cabin",
      )
    }
    if (input.cabins.length > 20) {
      throw new Error("createCruisePartyBooking supports at most 20 cabins per group")
    }

    return db.transaction(async (tx) => {
      // 1. Quote each cabin independently and validate currency consistency.
      const quotes: Array<{ quote: Quote; cabin: CruisePartyCabinEntry }> = []
      for (const cabin of input.cabins) {
        const guestCount = cabin.passengers.length
        if (guestCount < 1)
          throw new Error("Each cabin in a party booking must have at least one passenger")
        if (guestCount > cabin.occupancy)
          throw new Error(
            `Cabin passengers.length (${guestCount}) cannot exceed occupancy (${cabin.occupancy})`,
          )
        const quote = await pricingService.assembleQuote(tx, {
          sailingId: input.sailingId,
          cabinCategoryId: cabin.cabinCategoryId,
          occupancy: cabin.occupancy,
          guestCount,
          fareCode: cabin.fareCode ?? null,
        })
        quotes.push({ quote, cabin })
      }
      const firstCurrency = quotes[0]?.quote.currency
      if (!firstCurrency) throw new Error("No quotes assembled")
      for (const q of quotes) {
        if (q.quote.currency !== firstCurrency) {
          throw new Error(
            `All cabins in a party booking must share a currency; got ${q.quote.currency} after ${firstCurrency}`,
          )
        }
      }

      // 2. Create the booking group up front so we have a primaryBookingId target.
      const group = await bookingGroupsService.createBookingGroup(tx, {
        kind: "cruise_party",
        label: input.label ?? `Party booking on sailing ${input.sailingId}`,
        primaryBookingId: null,
        productId: null,
        optionUnitId: null,
        metadata: { sailingId: input.sailingId, cabinCount: input.cabins.length },
      })

      // 3. Create each cabin booking and add it to the group.
      const cabinResults: CreateCruiseBookingResult[] = []
      let primaryBookingId: string | null = null
      for (let i = 0; i < quotes.length; i++) {
        const { cabin, quote } = quotes[i]!
        const isPrimary = i === 0
        const bookingNumber = generateCruiseBookingNumber(i + 1)
        const totalCents = priceCentsFromString(quote.totalForCabin)
        const booking = await bookingsService.createBooking(
          tx,
          {
            bookingNumber,
            sellCurrency: quote.currency,
            status: "draft",
            sourceType: "manual",
            personId: input.leadPersonId ?? null,
            organizationId: input.organizationId ?? null,
            contactFirstName: input.contact.firstName,
            contactLastName: input.contact.lastName,
            contactEmail: input.contact.email ?? null,
            contactPhone: input.contact.phone ?? null,
            contactPreferredLanguage: input.contact.language ?? null,
            contactCountry: input.contact.country ?? null,
            contactRegion: input.contact.region ?? null,
            contactCity: input.contact.city ?? null,
            contactAddressLine1: input.contact.address ?? null,
            contactPostalCode: input.contact.postalCode ?? null,
            sellAmountCents: totalCents,
            pax: cabin.passengers.length,
            internalNotes: cabin.notes ?? null,
          },
          userId,
        )
        if (!booking) throw new Error("bookingsService.createBooking returned null")

        for (const passenger of cabin.passengers) {
          await bookingsService.createTraveler(
            tx,
            booking.id,
            {
              firstName: passenger.firstName,
              lastName: passenger.lastName,
              email: passenger.email ?? null,
              phone: passenger.phone ?? null,
              travelerCategory: passenger.travelerCategory ?? null,
              preferredLanguage: passenger.preferredLanguage ?? null,
              specialRequests: passenger.specialRequests ?? null,
              isPrimary: passenger.isPrimary ?? false,
              notes: passenger.notes ?? null,
            },
            userId,
          )
        }

        const cruiseDetails = await bookingCruiseDetailsService.upsert(tx, booking.id, {
          sailingId: input.sailingId,
          cabinCategoryId: cabin.cabinCategoryId,
          cabinId: cabin.cabinId ?? null,
          occupancy: cabin.occupancy,
          fareCode: cabin.fareCode ?? null,
          mode: input.mode ?? "inquiry",
          quotedPricePerPerson: quote.totalPerPerson,
          quotedTotalForCabin: quote.totalForCabin,
          quotedCurrency: quote.currency,
          quotedComponentsJson: quote.components,
          connectorBookingRef: null,
          connectorStatus: null,
          notes: cabin.notes ?? null,
        })

        const memberResult = await bookingGroupsService.addGroupMember(tx, group.id, {
          bookingId: booking.id,
          role: isPrimary ? "primary" : "shared",
        })
        if (memberResult.status !== "ok") {
          throw new Error(
            `Failed to add booking ${booking.id} to group ${group.id}: ${memberResult.status}`,
          )
        }
        if (isPrimary) primaryBookingId = booking.id

        cabinResults.push({
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          cruiseDetails,
          quote,
        })
      }

      // 4. Sum the per-cabin totals for the group snapshot.
      let totalCents = 0
      for (const r of cabinResults) {
        totalCents += priceCentsFromString(r.quote.totalForCabin)
      }
      const totalString = `${Math.trunc(totalCents / 100)}.${(Math.abs(totalCents) % 100).toString().padStart(2, "0")}`

      const groupDetails = await bookingGroupCruiseDetailsService.upsert(tx, group.id, {
        sailingId: input.sailingId,
        cabinCount: input.cabins.length,
        totalQuotedAmount: totalString,
        quotedCurrency: firstCurrency,
        connectorBookingRef: null,
        notes: input.notes ?? null,
      })

      return {
        groupId: group.id,
        primaryBookingId,
        groupDetails,
        cabins: cabinResults,
      }
    })
  },
}

export type CruisePartyCabinEntry = {
  cabinCategoryId: string
  cabinId?: string | null
  occupancy: number
  fareCode?: string | null
  passengers: CruiseBookingPassenger[]
  notes?: string | null
}

export type CreateCruisePartyBookingInput = {
  sailingId: string
  cabins: CruisePartyCabinEntry[]
  leadPersonId?: string | null
  organizationId?: string | null
  contact: CruiseBookingContact
  mode?: CruiseBookingMode
  label?: string
  notes?: string | null
}

export type CreateCruisePartyBookingResult = {
  groupId: string
  primaryBookingId: string | null
  groupDetails: BookingGroupCruiseDetail
  cabins: CreateCruiseBookingResult[]
}
