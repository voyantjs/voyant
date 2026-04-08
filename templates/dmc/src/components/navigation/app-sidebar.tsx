import {
  Building2,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronsUpDown,
  DollarSign,
  Globe2,
  LayoutDashboard,
  Package,
  Plus,
  Users,
  Wrench,
} from "lucide-react"
import type * as React from "react"
import { NavGroup } from "@/components/navigation/nav-group"
import { NavUser } from "@/components/navigation/nav-user"
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
import { authClient } from "@/lib/auth"

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
      title: "Contacts",
      url: "/contacts",
      icon: Users,
    },
    {
      title: "Suppliers",
      url: "/suppliers",
      icon: Building2,
    },
    {
      title: "Products",
      url: "/products",
      icon: Package,
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
      title: "Bookings",
      url: "/bookings",
      icon: CalendarCheck,
    },
    {
      title: "Distribution",
      url: "/distribution",
      icon: Globe2,
    },
    {
      title: "Finance",
      url: "/finance",
      icon: DollarSign,
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
  const { data: orgList } = authClient.useListOrganizations()
  const { data: activeOrg } = authClient.useActiveOrganization()

  const handleSwitch = (orgId: string) => {
    void authClient.organization.setActive({ organizationId: orgId })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
            {activeOrg?.name?.charAt(0)?.toUpperCase() ?? "V"}
          </div>
          <span className="flex-1 truncate text-sm font-semibold">
            {activeOrg?.name ?? "Voyant"}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {orgList?.map((org) => (
          <DropdownMenuItem key={org.id} onClick={() => handleSwitch(org.id)}>
            <span className="flex-1 truncate">{org.name}</span>
            {activeOrg?.id === org.id && <Check className="ml-2 h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            if (typeof window !== "undefined") {
              window.location.href = "/onboarding"
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
