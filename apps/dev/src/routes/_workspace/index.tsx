import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useOrganizations, usePeople } from "@voyantjs/voyant-crm-ui"
import {
  Building2,
  CalendarCheck,
  DollarSign,
  type LucideIcon,
  Package,
  UserRound,
  Users,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TypographyH1, TypographyLead } from "@/components/ui/typography"
import { getApiUrl } from "@/lib/env"

export const Route = createFileRoute("/_workspace/")({
  component: Dashboard,
})

type ListEnvelope = { total: number }

function useModuleCount(path: string) {
  return useQuery({
    queryKey: ["dashboard-count", path],
    queryFn: async (): Promise<ListEnvelope> => {
      const res = await fetch(`${getApiUrl()}${path}?limit=1`, {
        credentials: "include",
      })
      if (!res.ok) {
        throw new Error(`Failed to load ${path} (${res.status})`)
      }
      return res.json()
    },
  })
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  isLoading,
  isError,
}: {
  title: string
  value: number | undefined
  description: string
  icon: LucideIcon
  isLoading: boolean
  isError: boolean
}) {
  return (
    <Card size="sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : isError ? (
          <div className="text-2xl font-semibold tracking-tight text-muted-foreground">—</div>
        ) : (
          <div className="text-2xl font-semibold tracking-tight">{value ?? 0}</div>
        )}
        <p className="text-xs text-muted-foreground">{isError ? "Failed to load" : description}</p>
      </CardContent>
    </Card>
  )
}

function Dashboard() {
  const people = usePeople({ limit: 1 })
  const organizations = useOrganizations({ limit: 1 })
  const bookings = useModuleCount("/v1/bookings/")
  const suppliers = useModuleCount("/v1/suppliers/")
  const products = useModuleCount("/v1/products/")
  const invoices = useModuleCount("/v1/finance/invoices")

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 md:p-8">
      <header className="space-y-1">
        <TypographyH1 className="text-2xl">Dashboard</TypographyH1>
        <TypographyLead className="text-sm">Overview of your travel operations.</TypographyLead>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="People"
          value={people.data?.total}
          description="People in your CRM"
          icon={UserRound}
          isLoading={people.isLoading}
          isError={people.isError}
        />
        <StatCard
          title="Organizations"
          value={organizations.data?.total}
          description="Companies in your CRM"
          icon={Users}
          isLoading={organizations.isLoading}
          isError={organizations.isError}
        />
        <StatCard
          title="Bookings"
          value={bookings.data?.total}
          description="Total bookings on file"
          icon={CalendarCheck}
          isLoading={bookings.isLoading}
          isError={bookings.isError}
        />
        <StatCard
          title="Suppliers"
          value={suppliers.data?.total}
          description="Supplier accounts"
          icon={Building2}
          isLoading={suppliers.isLoading}
          isError={suppliers.isError}
        />
        <StatCard
          title="Products"
          value={products.data?.total}
          description="Itineraries and tours"
          icon={Package}
          isLoading={products.isLoading}
          isError={products.isError}
        />
        <StatCard
          title="Invoices"
          value={invoices.data?.total}
          description="Issued invoices"
          icon={DollarSign}
          isLoading={invoices.isLoading}
          isError={invoices.isError}
        />
      </section>
    </div>
  )
}
