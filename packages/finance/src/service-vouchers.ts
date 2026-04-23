import { and, asc, desc, eq, gt, ilike, or, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { z } from "zod"

import { voucherRedemptions, vouchers } from "./schema.js"
import type {
  insertVoucherSchema,
  redeemVoucherSchema,
  updateVoucherSchema,
  voucherListQuerySchema,
} from "./validation-vouchers.js"

type CreateVoucherInput = z.infer<typeof insertVoucherSchema>
type UpdateVoucherInput = z.infer<typeof updateVoucherSchema>
type RedeemVoucherInput = z.infer<typeof redeemVoucherSchema>
type VoucherListQuery = z.infer<typeof voucherListQuerySchema>

/**
 * Raised by the voucher service. Code + message; route handlers map to HTTP.
 * Reasons the route layer cares about:
 *  - `code_in_use`        — supplied code collides with an existing voucher
 *  - `voucher_not_found`  — id-not-found / code-not-found read path
 *  - `voucher_inactive`   — redeem attempted against non-active status
 *  - `voucher_expired`    — expiresAt has passed
 *  - `insufficient_balance` — requested amount > remainingAmountCents
 */
export class VoucherServiceError extends Error {
  constructor(
    readonly code:
      | "code_in_use"
      | "voucher_not_found"
      | "voucher_inactive"
      | "voucher_expired"
      | "insufficient_balance",
    message?: string,
  ) {
    super(message ?? code)
    this.name = "VoucherServiceError"
  }
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

/**
 * Generate a short, human-friendly voucher code. Crockford-style alphabet
 * (no 0/O/1/I) so codes stay readable when typed from a receipt or email.
 * 12 chars from a 32-symbol alphabet ≈ 60 bits of entropy; unique-index on
 * `code` catches the astronomically-unlikely collision.
 */
function generateVoucherCode(): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  let out = ""
  for (let i = 0; i < bytes.length; i++) {
    const index = (bytes[i] ?? 0) % CODE_ALPHABET.length
    out += CODE_ALPHABET[index]
    if (i === 3 || i === 7) out += "-"
  }
  return out
}

export const vouchersService = {
  async list(db: PostgresJsDatabase, query: VoucherListQuery) {
    const conditions = []
    if (query.status) conditions.push(eq(vouchers.status, query.status))
    if (query.issuedToPersonId) {
      conditions.push(eq(vouchers.issuedToPersonId, query.issuedToPersonId))
    }
    if (query.issuedToOrganizationId) {
      conditions.push(eq(vouchers.issuedToOrganizationId, query.issuedToOrganizationId))
    }
    if (query.hasBalance) {
      conditions.push(gt(vouchers.remainingAmountCents, 0))
    }
    if (query.search) {
      const term = `%${query.search}%`
      conditions.push(or(ilike(vouchers.code, term), ilike(vouchers.notes, term)))
    }

    const where = conditions.length ? and(...conditions) : undefined

    const [rows, countResult] = await Promise.all([
      db
        .select()
        .from(vouchers)
        .where(where)
        .limit(query.limit)
        .offset(query.offset)
        .orderBy(desc(vouchers.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(vouchers).where(where),
    ])

    return {
      data: rows,
      total: countResult[0]?.count ?? 0,
      limit: query.limit,
      offset: query.offset,
    }
  },

  async getById(db: PostgresJsDatabase, id: string) {
    const [row] = await db.select().from(vouchers).where(eq(vouchers.id, id)).limit(1)
    if (!row) return null
    const redemptions = await db
      .select()
      .from(voucherRedemptions)
      .where(eq(voucherRedemptions.voucherId, id))
      .orderBy(asc(voucherRedemptions.createdAt))
    return { ...row, redemptions }
  },

  async create(db: PostgresJsDatabase, input: CreateVoucherInput, issuedByUserId?: string) {
    const code = input.code?.trim() || generateVoucherCode()
    const [existing] = await db
      .select({ id: vouchers.id })
      .from(vouchers)
      .where(eq(vouchers.code, code))
      .limit(1)
    if (existing) {
      throw new VoucherServiceError("code_in_use")
    }

    const [row] = await db
      .insert(vouchers)
      .values({
        code,
        currency: input.currency,
        initialAmountCents: input.amountCents,
        remainingAmountCents: input.amountCents,
        issuedToPersonId: input.issuedToPersonId ?? null,
        issuedToOrganizationId: input.issuedToOrganizationId ?? null,
        sourceType: input.sourceType,
        sourceBookingId: input.sourceBookingId ?? null,
        sourcePaymentId: input.sourcePaymentId ?? null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        notes: input.notes ?? null,
        issuedByUserId: issuedByUserId ?? null,
      })
      .returning()
    return row ?? null
  },

  async update(db: PostgresJsDatabase, id: string, input: UpdateVoucherInput) {
    const [row] = await db
      .update(vouchers)
      .set({
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.expiresAt !== undefined
          ? { expiresAt: input.expiresAt ? new Date(input.expiresAt) : null }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.issuedToPersonId !== undefined
          ? { issuedToPersonId: input.issuedToPersonId }
          : {}),
        ...(input.issuedToOrganizationId !== undefined
          ? { issuedToOrganizationId: input.issuedToOrganizationId }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(vouchers.id, id))
      .returning()
    return row ?? null
  },

  /**
   * Apply a voucher against a booking. Runs in a transaction so
   * `remainingAmountCents` and the redemption row either both land or neither.
   * Guards: voucher must exist, be active, not expired, and have enough
   * balance for the requested amount. When remaining hits zero the voucher
   * flips to `status = 'redeemed'`.
   */
  async redeem(
    db: PostgresJsDatabase,
    voucherId: string,
    input: RedeemVoucherInput,
    userId?: string,
  ) {
    return db.transaction(async (tx) => {
      const [voucher] = await tx.select().from(vouchers).where(eq(vouchers.id, voucherId)).limit(1)

      if (!voucher) throw new VoucherServiceError("voucher_not_found")
      if (voucher.status !== "active") throw new VoucherServiceError("voucher_inactive")
      if (voucher.expiresAt && voucher.expiresAt.getTime() < Date.now()) {
        throw new VoucherServiceError("voucher_expired")
      }
      if (input.amountCents > voucher.remainingAmountCents) {
        throw new VoucherServiceError("insufficient_balance")
      }

      const [redemption] = await tx
        .insert(voucherRedemptions)
        .values({
          voucherId: voucher.id,
          bookingId: input.bookingId,
          paymentId: input.paymentId ?? null,
          amountCents: input.amountCents,
          createdByUserId: userId ?? null,
        })
        .returning()

      const newRemaining = voucher.remainingAmountCents - input.amountCents
      const [updated] = await tx
        .update(vouchers)
        .set({
          remainingAmountCents: newRemaining,
          status: newRemaining === 0 ? "redeemed" : voucher.status,
          updatedAt: new Date(),
        })
        .where(eq(vouchers.id, voucher.id))
        .returning()

      return { voucher: updated ?? voucher, redemption: redemption ?? null }
    })
  },
}
