import { describe, expect, it } from "vitest"

import {
  type AdminExtension,
  defineAdminExtension,
  resolveAdminNavigation,
  resolveAdminWidgets,
} from "../../src/extensions.js"

describe("admin extensions", () => {
  it("keeps the extension object shape intact", () => {
    const extension = defineAdminExtension({
      id: "finance-sync",
      routes: [{ id: "finance-sync-route", path: "/finance/sync", title: "Finance sync" }],
    })

    expect(extension.id).toBe("finance-sync")
    expect(extension.routes?.[0]?.path).toBe("/finance/sync")
  })

  it("appends navigation contributions after the base items in order", () => {
    const baseItems = [{ id: "dashboard", title: "Dashboard", url: "/" }]
    const extensions: AdminExtension[] = [
      defineAdminExtension({
        id: "late",
        navigation: [{ order: 20, items: [{ id: "reports", title: "Reports", url: "/reports" }] }],
      }),
      defineAdminExtension({
        id: "early",
        navigation: [{ order: 10, items: [{ id: "sync", title: "Sync", url: "/sync" }] }],
      }),
    ]

    const items = resolveAdminNavigation({ baseItems, extensions })

    expect(items.map((item) => item.id)).toEqual(["dashboard", "sync", "reports"])
  })

  it("returns widgets for one slot in order", () => {
    function BookingStatusCard() {
      return null
    }

    function BookingAuditCard() {
      return null
    }

    const extensions: AdminExtension[] = [
      defineAdminExtension({
        id: "booking-status",
        widgets: [
          {
            id: "status",
            slot: "booking.details.sidebar",
            order: 20,
            component: BookingStatusCard,
          },
          {
            id: "ignored",
            slot: "finance.invoice.sidebar",
            order: 5,
            component: BookingStatusCard,
          },
        ],
      }),
      defineAdminExtension({
        id: "booking-audit",
        widgets: [
          { id: "audit", slot: "booking.details.sidebar", order: 10, component: BookingAuditCard },
        ],
      }),
    ]

    const widgets = resolveAdminWidgets({ slot: "booking.details.sidebar", extensions })

    expect(widgets.map((widget) => widget.id)).toEqual(["audit", "status"])
  })
})
