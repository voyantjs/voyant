import {
  type AdminExtension,
  createAdminExtensionRegistry,
  defineAdminExtension,
} from "@voyantjs/voyant-admin"

import { DashboardOutstandingInvoicesWidget } from "@/components/admin/widgets/dashboard-outstanding-invoices-widget"

/**
 * Operator admin contributions composed through the shared admin runtime.
 *
 * Keep this explicit and source-controlled so the template still owns shell
 * composition while the extension seam stays typed and framework-level.
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
export const adminExtensions: ReadonlyArray<AdminExtension> = createAdminExtensionRegistry(
  defineAdminExtension({
    id: "dashboard-outstanding-invoices",
    widgets: [
      {
        id: "dashboard-outstanding-invoices.card",
        slot: "dashboard.after-kpis",
        order: 10,
        component: DashboardOutstandingInvoicesWidget,
      },
    ],
  }),
)
