import { bookingsService } from "@voyantjs/bookings"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import { contractRecordsService } from "./service-contracts.js"
import type { ContractDocumentGenerator } from "./service-documents.js"
import { contractDocumentsService } from "./service-documents.js"
import { contractSeriesService } from "./service-series.js"
import { contractTemplatesService } from "./service-templates.js"

/**
 * Event shape emitted by `@voyantjs/bookings` on confirm. Duplicated here so
 * legal doesn't have to import the bookings service just for the interface —
 * the concrete `bookingsService` lookup happens inside the handler.
 */
export interface BookingConfirmedLikeEvent {
  bookingId: string
  bookingNumber: string
  actorId: string | null
}

/**
 * Variables passed to the contract template at render time. Consumers can
 * augment via `resolveVariables`; the built-in resolver supplies the fields
 * the default contract template expects.
 */
export interface DefaultContractVariables {
  contract: {
    issuedAt: string
    date: string
  }
  booking: {
    id: string
    number: string
    status: string
    currency: string | null
    startDate: string | null
    endDate: string | null
    pax: number | null
    internalNotes: string | null
    totalAmountCents: number | null
  }
  travelers: Array<{
    id: string
    firstName: string
    lastName: string
    email: string | null
    phone: string | null
    isPrimary: boolean
    participantType: string
  }>
  leadTraveler: {
    id: string
    firstName: string
    lastName: string
    email: string | null
    phone: string | null
  } | null
}

/**
 * Hook point so consumers can extend (or replace) the template variables.
 * Receives the default payload plus the raw booking/travelers so the
 * consumer can fold in product/person/etc. lookups without re-fetching.
 */
export type ResolveContractVariablesFn = (context: {
  db: PostgresJsDatabase
  booking: NonNullable<Awaited<ReturnType<typeof bookingsService.getBookingById>>>
  travelers: Awaited<ReturnType<typeof bookingsService.listTravelers>>
  defaults: DefaultContractVariables
}) => Promise<Record<string, unknown>> | Record<string, unknown>

export interface AutoGenerateContractOptions {
  enabled?: boolean
  /**
   * Slug of the contract template to use. The contract is created against
   * that template's `currentVersionId`. If the template has no current
   * version, the handler logs + bails.
   */
  templateSlug: string
  /**
   * Scope the contract defaults to when creating. Matches
   * `contractScopeEnum`; the default `"customer"` is right for the common
   * operator-issues-to-traveler case.
   */
  scope?: "customer" | "supplier" | "partner" | "channel" | "other"
  /**
   * When set, the contract tries to allocate a number from the matching
   * active series on issuance. Without it, the contract issues unnumbered.
   */
  seriesName?: string
  /**
   * Language code written onto the contract row. Used by the PDF
   * renderer to pick the right locale for date/currency filters.
   */
  language?: string
  /**
   * Optional variable extender — see `ResolveContractVariablesFn`.
   */
  resolveVariables?: ResolveContractVariablesFn
}

export interface AutoGenerateContractRuntime {
  generator: ContractDocumentGenerator
  eventBus?: import("@voyantjs/core").EventBus
}

/**
 * Core auto-generate handler. Fire this from a `booking.confirmed` subscriber.
 * On success, the booking now has an issued contract with an attachment
 * (the PDF / storage object produced by the configured generator) and a
 * `contract.document.generated` event has been emitted post-commit.
 *
 * Failure modes (all surfaced via the returned status):
 *  - `template_not_found`       — no active template matches the slug
 *  - `template_version_missing` — template exists but has no published version
 *  - `booking_not_found`        — booking disappeared between confirm + fire
 *  - `contract_create_failed`   — insert returned null
 *  - `document_<…>`             — pass-through of generateContractDocument statuses
 *
 * Callers (the subscriber wrapper) log these and move on — per the EventBus
 * contract, handler throws are swallowed anyway; returning a discriminated
 * status keeps tests honest.
 */
export async function autoGenerateContractForBooking(
  db: PostgresJsDatabase,
  event: BookingConfirmedLikeEvent,
  options: AutoGenerateContractOptions,
  runtime: AutoGenerateContractRuntime,
): Promise<
  | { status: "ok"; contractId: string; attachmentId: string }
  | { status: "template_not_found" }
  | { status: "template_version_missing" }
  | { status: "booking_not_found" }
  | { status: "contract_create_failed" }
  | { status: "document_failed"; reason: string }
> {
  // Resolve the template + its current version. Consumers configure the slug
  // once at module bootstrap; we look up on every fire so template body
  // edits are picked up without restart.
  const template = await contractTemplatesService.findTemplateBySlug(db, options.templateSlug)
  if (!template) {
    return { status: "template_not_found" }
  }
  if (!template.currentVersionId) {
    return { status: "template_version_missing" }
  }

  const booking = await bookingsService.getBookingById(db, event.bookingId)
  if (!booking) {
    return { status: "booking_not_found" }
  }

  const travelers = await bookingsService.listTravelers(db, event.bookingId)
  const leadTraveler =
    travelers.find((t) => t.isPrimary) ??
    travelers.find((t) => t.participantType === "traveler") ??
    travelers[0] ??
    null

  const now = new Date()
  const defaults: DefaultContractVariables = {
    contract: {
      issuedAt: now.toISOString(),
      date: now.toISOString().slice(0, 10),
    },
    booking: {
      id: booking.id,
      number: booking.bookingNumber,
      status: booking.status,
      currency: booking.sellCurrency ?? null,
      startDate: booking.startDate,
      endDate: booking.endDate,
      pax: booking.pax,
      internalNotes: booking.internalNotes,
      totalAmountCents: booking.sellAmountCents ?? null,
    },
    travelers: travelers.map((t) => ({
      id: t.id,
      firstName: t.firstName,
      lastName: t.lastName,
      email: t.email,
      phone: t.phone,
      isPrimary: t.isPrimary,
      participantType: t.participantType,
    })),
    leadTraveler: leadTraveler
      ? {
          id: leadTraveler.id,
          firstName: leadTraveler.firstName,
          lastName: leadTraveler.lastName,
          email: leadTraveler.email,
          phone: leadTraveler.phone,
        }
      : null,
  }

  const variables = options.resolveVariables
    ? await options.resolveVariables({ db, booking, travelers, defaults })
    : (defaults as unknown as Record<string, unknown>)

  // Resolve a series id if the consumer gave a name — failure to find is
  // non-fatal since a contract can issue without a number (some operators
  // use templates as standalone records and number externally).
  let seriesId: string | null = null
  if (options.seriesName) {
    const series = await contractSeriesService.findSeriesByName(db, options.seriesName)
    seriesId = series?.id ?? null
  }

  const contract = await contractRecordsService.createContract(db, {
    scope: options.scope ?? "customer",
    status: "draft",
    title: `${template.name} — ${booking.bookingNumber}`,
    templateVersionId: template.currentVersionId,
    seriesId,
    bookingId: event.bookingId,
    personId: booking.personId ?? null,
    organizationId: booking.organizationId ?? null,
    language: options.language ?? template.language ?? "en",
    variables,
    metadata: {
      autoGenerated: true,
      trigger: "booking.confirmed",
      triggerActorId: event.actorId,
    },
  })
  if (!contract) {
    return { status: "contract_create_failed" }
  }

  const result = await contractDocumentsService.generateContractDocument(
    db,
    contract.id,
    {
      issueIfDraft: true,
      replaceExisting: true,
      kind: "document",
    },
    {
      generator: runtime.generator,
      eventBus: runtime.eventBus,
    },
  )

  if (result.status === "generated") {
    return { status: "ok", contractId: contract.id, attachmentId: result.attachment.id }
  }

  return { status: "document_failed", reason: result.status }
}
