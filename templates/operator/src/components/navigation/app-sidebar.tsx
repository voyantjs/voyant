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

export const COMING_SOON = "COMING_SOON" as const
export const BETA = "BETA" as const

const baseData = {
  user: {
    name: "",
    email: "",
    avatar: "",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Products",
      url: "/products",
      icon: Package,
      items: [{ title: "Categories", url: "/products/categories" }],
    },
    {
      title: "Bookings",
      url: "/bookings",
      icon: CalendarCheck,
    },
    {
      title: "Suppliers",
      url: "/suppliers",
      icon: Building2,
    },
    {
      title: "People",
      url: "/people",
      icon: Users,
    },
    {
      title: "Organizations",
      url: "/organizations",
      icon: Building,
    },
    {
      title: "Availability",
      url: "/availability",
      icon: CalendarDays,
    },
    {
      title: "Resources",
      url: "/resources",
      icon: Wrench,
    },
    {
      title: "Finance",
      url: "/finance",
      icon: DollarSign,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ],
} as const

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
  const { activeOrganization, organizations, isSwitchingOrganization, setActiveOrganization } =
    useWorkspace()

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
            if (typeof window !== "undefined") {
              window.location.href = "/"
            }
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const resolvedUser = {
    name: user?.name ?? baseData.user.name,
    firstName: user?.firstName,
    lastName: user?.lastName,
    email: user?.email ?? baseData.user.email,
    avatar: user?.avatar ?? baseData.user.avatar,
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrgSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavGroup items={baseData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={resolvedUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
