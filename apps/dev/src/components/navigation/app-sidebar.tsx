import {
  Building,
  Building2,
  Bus,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronsUpDown,
  ClipboardList,
  DollarSign,
  FileText,
  Globe,
  Globe2,
  Handshake,
  Hotel,
  IdCard,
  LayoutDashboard,
  Link2,
  ListTodo,
  Package,
  Receipt,
  Scale,
  Settings,
  ShieldCheck,
  Sparkles,
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
      title: "Opportunities",
      url: "/opportunities",
      icon: Handshake,
    },
    {
      title: "Activities",
      url: "/activities",
      icon: ListTodo,
    },
    {
      title: "Quotes",
      url: "/quotes",
      icon: FileText,
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
      title: "Booking Requirements",
      url: "/booking-requirements",
      icon: ClipboardList,
    },
    {
      title: "Extras",
      url: "/extras",
      icon: Sparkles,
    },
    {
      title: "Facilities",
      url: "/facilities",
      icon: Hotel,
      items: [
        { title: "All Facilities", url: "/facilities" },
        { title: "Properties", url: "/properties" },
        { title: "Property Groups", url: "/property-groups" },
      ],
    },
    {
      title: "Ground",
      url: "/ground",
      icon: Bus,
    },
    {
      title: "Identity",
      url: "/identity",
      icon: IdCard,
    },
    {
      title: "External Refs",
      url: "/external-refs",
      icon: Link2,
    },
    {
      title: "Markets",
      url: "/markets",
      icon: Globe,
    },
    {
      title: "Sellability",
      url: "/sellability",
      icon: ShieldCheck,
    },
    {
      title: "Distribution",
      url: "/distribution",
      icon: Globe2,
    },
    {
      title: "Transactions",
      url: "/transactions",
      icon: Receipt,
    },
    {
      title: "Finance",
      url: "/finance",
      icon: DollarSign,
    },
    {
      title: "Legal",
      url: "/legal/contracts",
      icon: Scale,
      items: [
        { title: "Contracts", url: "/legal/contracts" },
        { title: "Policies", url: "/legal/policies" },
        { title: "Templates", url: "/legal/templates" },
        { title: "Number Series", url: "/legal/number-series" },
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
      items: [
        { title: "Price Catalogs", url: "/settings/pricing/catalogs" },
        { title: "Pricing Categories", url: "/settings/pricing/categories" },
        { title: "Category Dependencies", url: "/settings/pricing/category-dependencies" },
        { title: "Cancellation Policies", url: "/settings/pricing/cancellation-policies" },
        { title: "Price Schedules", url: "/settings/pricing/schedules" },
        { title: "Option Price Rules", url: "/settings/pricing/option-price-rules" },
        { title: "Unit Price Rules", url: "/settings/pricing/option-unit-price-rules" },
        { title: "Start Time Rules", url: "/settings/pricing/option-start-time-rules" },
        { title: "Unit Tiers", url: "/settings/pricing/option-unit-tiers" },
        { title: "Pickup Rules", url: "/settings/pricing/pickup-price-rules" },
        { title: "Dropoff Rules", url: "/settings/pricing/dropoff-price-rules" },
        { title: "Extra Rules", url: "/settings/pricing/extra-price-rules" },
      ],
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
