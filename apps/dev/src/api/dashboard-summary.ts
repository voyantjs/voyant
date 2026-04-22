import { bookings } from "@voyantjs/bookings"
import { organizations, people } from "@voyantjs/crm"
import { invoices } from "@voyantjs/finance"
import { products } from "@voyantjs/products"
import { suppliers } from "@voyantjs/suppliers"
import { and, eq, gte, inArray, lt, lte, ne, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

const BOOKING_STATUS_ORDER = [
  "draft",
  "on_hold",
  "confirmed",
  "in_progress",
  "completed",
  "expired",
  "cancelled",
] as const

const UPCOMING_DEPARTURE_STATUSES = ["confirmed", "in_progress"] as const
const MONTH_RANGE_LENGTH = 6

export type DashboardBookingStatus = (typeof BOOKING_STATUS_ORDER)[number]

export interface DashboardMonthPoint {
  month: string
  count: number
}

export interface DashboardCurrencyMonthPoint {
  month: string
  totalCents: number
  count: number
}

export interface DashboardCurrencyBreakdown {
  currency: string
  totalCents: number
  count: number
}

export interface DashboardRevenueSeries {
  currency: string
  totalCents: number
  invoiceCount: number
  points: DashboardCurrencyMonthPoint[]
}

export interface DashboardSummary {
  generatedAt: string
  counts: {
    people: number
    organizations: number
    bookings: number
    confirmedBookings: number
    suppliers: number
    products: number
    liveProducts: number
    invoices: number
    departuresNext30Days: number
  }
  bookingsByStatus: Array<{
    status: DashboardBookingStatus
    count: number
  }>
  monthlyBookings: DashboardMonthPoint[]
  outstandingInvoices: {
    count: number
    byCurrency: DashboardCurrencyBreakdown[]
  }
  revenueByCurrency: DashboardRevenueSeries[]
}

function startOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

function addUtcMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1))
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10)
}

function formatYearMonth(date: Date) {
  return date.toISOString().slice(0, 7)
}

export function buildRecentMonths(now: Date, length = MONTH_RANGE_LENGTH) {
  const currentMonth = startOfUtcMonth(now)
  return Array.from({ length }, (_, index) =>
    formatYearMonth(addUtcMonths(currentMonth, index - (length - 1))),
  )
}

export function normalizeBookingStatusCounts(
  rows: Array<{ status: string; count: number }>,
): DashboardSummary["bookingsByStatus"] {
  const counts = new Map(rows.map((row) => [row.status, row.count]))

  return BOOKING_STATUS_ORDER.map((status) => ({
    status,
    count: counts.get(status) ?? 0,
  }))
}

export function fillMonthlyCounts(
  months: string[],
  rows: Array<{ month: string; count: number }>,
): DashboardMonthPoint[] {
  const counts = new Map(rows.map((row) => [row.month, row.count]))

  return months.map((month) => ({
    month,
    count: counts.get(month) ?? 0,
  }))
}

export function groupCurrencyBreakdown(
  rows: Array<{ currency: string; totalCents: number; count: number }>,
): DashboardCurrencyBreakdown[] {
  return rows
    .map((row) => ({
      currency: row.currency,
      totalCents: row.totalCents,
      count: row.count,
    }))
    .sort(
      (left, right) =>
        right.totalCents - left.totalCents || left.currency.localeCompare(right.currency),
    )
}

export function groupCurrencyTimeSeries(
  months: string[],
  rows: Array<{ currency: string; month: string; totalCents: number; count: number }>,
): DashboardRevenueSeries[] {
  const byCurrency = new Map<string, Map<string, DashboardCurrencyMonthPoint>>()

  for (const row of rows) {
    const bucket = byCurrency.get(row.currency) ?? new Map<string, DashboardCurrencyMonthPoint>()
    bucket.set(row.month, {
      month: row.month,
      totalCents: row.totalCents,
      count: row.count,
    })
    byCurrency.set(row.currency, bucket)
  }

  return Array.from(byCurrency.entries())
    .map(([currency, series]) => {
      const points = months.map((month) => series.get(month) ?? { month, totalCents: 0, count: 0 })
      return {
        currency,
        totalCents: points.reduce((total, point) => total + point.totalCents, 0),
        invoiceCount: points.reduce((total, point) => total + point.count, 0),
        points,
      }
    })
    .sort(
      (left, right) =>
        right.totalCents - left.totalCents || left.currency.localeCompare(right.currency),
    )
}

export async function getDashboardSummary(
  db: PostgresJsDatabase,
  now = new Date(),
): Promise<DashboardSummary> {
  const months = buildRecentMonths(now)
  const firstMonthStart = `${months[0]}-01`
  const currentMonthStart = startOfUtcMonth(now)
  const nextMonthStart = addUtcMonths(currentMonthStart, 1)
  const today = formatDateOnly(now)
  const departuresThrough = formatDateOnly(addUtcDays(now, 30))

  const [
    peopleCountRows,
    organizationCountRows,
    bookingCountRows,
    supplierCountRows,
    productCountRows,
    liveProductCountRows,
    invoiceCountRows,
    upcomingDepartureCountRows,
    bookingStatusRows,
    monthlyBookingRows,
    outstandingInvoiceRows,
    revenueRows,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(people),
    db.select({ count: sql<number>`count(*)::int` }).from(organizations),
    db.select({ count: sql<number>`count(*)::int` }).from(bookings),
    db.select({ count: sql<number>`count(*)::int` }).from(suppliers),
    db.select({ count: sql<number>`count(*)::int` }).from(products),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(and(eq(products.status, "active"), eq(products.activated, true))),
    db.select({ count: sql<number>`count(*)::int` }).from(invoices),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookings)
      .where(
        and(
          inArray(bookings.status, [...UPCOMING_DEPARTURE_STATUSES]),
          gte(bookings.startDate, today),
          lte(bookings.startDate, departuresThrough),
        ),
      ),
    db
      .select({
        status: bookings.status,
        count: sql<number>`count(*)::int`,
      })
      .from(bookings)
      .groupBy(bookings.status),
    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${bookings.createdAt}), 'YYYY-MM')`,
        count: sql<number>`count(*)::int`,
      })
      .from(bookings)
      .where(
        and(
          gte(bookings.createdAt, new Date(firstMonthStart)),
          lt(bookings.createdAt, nextMonthStart),
        ),
      )
      .groupBy(sql`date_trunc('month', ${bookings.createdAt})`)
      .orderBy(sql`date_trunc('month', ${bookings.createdAt})`),
    db
      .select({
        currency: invoices.currency,
        totalCents: sql<number>`coalesce(sum(${invoices.balanceDueCents}), 0)::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(invoices)
      .where(
        and(
          sql`${invoices.balanceDueCents} > 0`,
          ne(invoices.status, "void"),
          ne(invoices.status, "paid"),
        ),
      )
      .groupBy(invoices.currency),
    db
      .select({
        currency: invoices.currency,
        month: sql<string>`to_char(date_trunc('month', ${invoices.issueDate}::date), 'YYYY-MM')`,
        totalCents: sql<number>`coalesce(sum(${invoices.totalCents}), 0)::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(invoices)
      .where(
        and(
          gte(invoices.issueDate, firstMonthStart),
          lt(invoices.issueDate, formatDateOnly(nextMonthStart)),
          ne(invoices.status, "void"),
        ),
      )
      .groupBy(sql`date_trunc('month', ${invoices.issueDate}::date)`, invoices.currency)
      .orderBy(sql`date_trunc('month', ${invoices.issueDate}::date)`, invoices.currency),
  ])

  const bookingsByStatus = normalizeBookingStatusCounts(
    bookingStatusRows.map((row) => ({
      status: row.status,
      count: row.count,
    })),
  )
  const outstandingByCurrency = groupCurrencyBreakdown(outstandingInvoiceRows)
  const revenueByCurrency = groupCurrencyTimeSeries(months, revenueRows)

  return {
    generatedAt: now.toISOString(),
    counts: {
      people: peopleCountRows[0]?.count ?? 0,
      organizations: organizationCountRows[0]?.count ?? 0,
      bookings: bookingCountRows[0]?.count ?? 0,
      confirmedBookings: bookingsByStatus.find((row) => row.status === "confirmed")?.count ?? 0,
      suppliers: supplierCountRows[0]?.count ?? 0,
      products: productCountRows[0]?.count ?? 0,
      liveProducts: liveProductCountRows[0]?.count ?? 0,
      invoices: invoiceCountRows[0]?.count ?? 0,
      departuresNext30Days: upcomingDepartureCountRows[0]?.count ?? 0,
    },
    bookingsByStatus,
    monthlyBookings: fillMonthlyCounts(months, monthlyBookingRows),
    outstandingInvoices: {
      count: outstandingByCurrency.reduce((total, row) => total + row.count, 0),
      byCurrency: outstandingByCurrency,
    },
    revenueByCurrency,
  }
}
