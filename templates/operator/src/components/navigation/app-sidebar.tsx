import { useNavigate } from "@tanstack/react-router"
import {
  Building,
  Building2,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronsUpDown,
  DollarSign,
  LayoutDashboard,
  Package,
  Plus,
  Settings,
  Users,
  Wrench,
} from "lucide-react"
import type * as React from "react"
import { NavGroup } from "@/components/navigation/nav-group"
import { NavUser } from "@/components/navigation/nav-user"
import { useWorkspace } from "@/components/providers/workspace-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui"
import { useAdminMessages } from "@/lib/admin-i18n"

export const COMING_SOON = "COMING_SOON" as const
export const BETA = "BETA" as const

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: {
    name?: string
    firstName?: string
    lastName?: string
    email?: string
    avatar?: string
  }
}

function OrgSwitcher() {
  const navigate = useNavigate()
  const { activeOrganization, organizations, isSwitchingOrganization, setActiveOrganization } =
    useWorkspace()
  const messages = useAdminMessages()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
            {activeOrganization?.name?.charAt(0)?.toUpperCase() ?? "V"}
          </div>
          <span className="flex-1 truncate text-sm font-semibold">
            {activeOrganization?.name ?? "Voyant"}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            disabled={isSwitchingOrganization}
            onClick={() => {
              void setActiveOrganization(org.id)
            }}
          >
            <span className="flex-1 truncate">{org.name}</span>
            {activeOrganization?.id === org.id && <Check className="ml-2 h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            void navigate({ to: "/" })
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          {messages.createOrganization}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const messages = useAdminMessages()
  const resolvedUser = {
    name: user?.name ?? "",
    firstName: user?.firstName,
    lastName: user?.lastName,
    email: user?.email ?? "",
    avatar: user?.avatar ?? "",
  }
  const navMain = [
    {
      title: messages.nav.dashboard,
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: messages.nav.products,
      url: "/products",
      icon: Package,
      items: [{ title: messages.nav.categories, url: "/products/categories" }],
    },
    {
      title: messages.nav.bookings,
      url: "/bookings",
      icon: CalendarCheck,
    },
    {
      title: messages.nav.suppliers,
      url: "/suppliers",
      icon: Building2,
    },
    {
      title: messages.nav.people,
      url: "/people",
      icon: Users,
    },
    {
      title: messages.nav.organizations,
      url: "/organizations",
      icon: Building,
    },
    {
      title: messages.nav.availability,
      url: "/availability",
      icon: CalendarDays,
    },
    {
      title: messages.nav.resources,
      url: "/resources",
      icon: Wrench,
    },
    {
      title: messages.nav.finance,
      url: "/finance",
      icon: DollarSign,
    },
    {
      title: messages.nav.settings,
      url: "/settings",
      icon: Settings,
    },
  ] as const

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrgSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavGroup items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={resolvedUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
