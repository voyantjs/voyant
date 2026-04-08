/**
 * Small formatting helpers shared across booking-portal pages.
 */

export function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export function formatDuration(days: number): string {
  if (days === 1) return "1 day"
  return `${days} days`
}
