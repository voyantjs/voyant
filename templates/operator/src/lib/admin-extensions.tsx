import type { AdminExtension } from "@voyantjs/voyant-admin"

/**
 * Template-local admin extension registry.
 *
 * Keep this explicit and source-controlled so projects can add navigation
 * contributions, widget slots, and route metadata without relying on a more
 * dynamic plugin runtime in the admin shell.
 *
 * Widget slots currently exposed by the operator template:
 * - `dashboard.header`
 * - `dashboard.after-kpis`
 * - `dashboard.footer`
 * - `booking.details.header`
 * - `booking.details.after-summary`
 * - `invoice.details.header`
 * - `invoice.details.after-summary`
 */
export const adminExtensions: ReadonlyArray<AdminExtension> = []
