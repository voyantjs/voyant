import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router"
import type { LucideIcon } from "lucide-react"
import { Hash, Layers, Package, Tag, Tags } from "lucide-react"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_workspace/settings")({
  component: SettingsLayout,
})

type NavItem = { label: string; href: string; icon: LucideIcon }
type NavGroup = { group: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    group: "General",
    items: [
      { label: "Channels", href: "/settings/channels", icon: Hash },
      { label: "Pricing Categories", href: "/settings/pricing-categories", icon: Tags },
      { label: "Price Catalogs", href: "/settings/price-catalogs", icon: Layers },
    ],
  },
  {
    group: "Products",
    items: [
      { label: "Product Types", href: "/settings/product-types", icon: Package },
      { label: "Product Tags", href: "/settings/product-tags", icon: Tag },
    ],
  },
]

function SettingsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const isActive = (href: string) => {
    const normalized = pathname.replace(/\/$/, "")
    return normalized === href
  }

  return (
    <div className="flex h-[calc(100vh-0px)]">
      <aside className="w-64 shrink-0 border-r p-6 overflow-y-auto">
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your workspace configuration</p>
        <nav className="mt-6 flex flex-col gap-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.group}>
              <h3 className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {group.group}
              </h3>
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                        isActive(item.href)
                          ? "bg-accent text-accent-foreground font-medium"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}
