import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck,
  DollarSign,
  Package,
  Users,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { api } from "@/lib/api-client"

export const Route = createFileRoute("/_workspace/")({
  component: Dashboard,
})

// ---------- types for API responses ----------

type BookingRow = {
  id: string
  bookingNumber: string
  status: string
  sellCurrency: string
  sellAmountCents: number | null
  pax: number | null
  startDate: string | null
  createdAt: string
}

type ProductRow = {
  id: string
  name: string
  status: string
}

type SupplierRow = {
  id: string
  name: string
}

type InvoiceRow = {
  id: string
  status: string
  totalAmountCents: number | null
  currency: string
  issuedAt: string | null
  createdAt: string
}

// ---------- helpers ----------

function formatCurrency(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100)
}

function getMonthLabel(date: Date): string {
  return date.toLocaleString("en-US", { month: "short" })
}

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    confirmed: "var(--color-chart-1, hsl(142 71% 45%))",
    completed: "var(--color-chart-2, hsl(221 83% 53%))",
    in_progress: "var(--color-chart-3, hsl(47 96% 53%))",
    draft: "var(--color-chart-4, hsl(215 14% 55%))",
    cancelled: "var(--color-chart-5, hsl(0 84% 60%))",
  }
  return map[status] ?? "hsl(215 14% 55%)"
}

// ---------- chart configs ----------

const revenueChartConfig = {
  revenue: { label: "Revenue", color: "hsl(221 83% 53%)" },
  bookings: { label: "Bookings", color: "hsl(142 71% 45%)" },
} satisfies ChartConfig

const bookingStatusConfig = {
  confirmed: { label: "Confirmed", color: "hsl(142 71% 45%)" },
  completed: { label: "Completed", color: "hsl(221 83% 53%)" },
  in_progress: { label: "In Progress", color: "hsl(47 96% 53%)" },
  draft: { label: "Draft", color: "hsl(215 14% 55%)" },
  cancelled: { label: "Cancelled", color: "hsl(0 84% 60%)" },
} satisfies ChartConfig

const monthlyBookingsConfig = {
  count: { label: "Bookings", color: "hsl(221 83% 53%)" },
} satisfies ChartConfig

// ---------- data derivation ----------

function deriveMonthlyRevenue(bookings: BookingRow[]) {
  const now = new Date()
  const months: { month: string; revenue: number; bookings: number }[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ month: getMonthLabel(d), revenue: 0, bookings: 0 })
  }

  for (const b of bookings) {
    const created = new Date(b.createdAt)
    const label = getMonthLabel(created)
    const entry = months.find((m) => m.month === label)
    if (entry) {
      entry.bookings += 1
      entry.revenue += (b.sellAmountCents ?? 0) / 100
    }
  }

  return months
}

function deriveStatusBreakdown(bookings: BookingRow[]) {
  const counts: Record<string, number> = {}
  for (const b of bookings) {
    counts[b.status] = (counts[b.status] ?? 0) + 1
  }
  return Object.entries(counts).map(([status, count]) => ({
    status,
    count,
    fill: getStatusColor(status),
  }))
}

function deriveMonthlyBookingCounts(bookings: BookingRow[]) {
  const now = new Date()
  const months: { month: string; count: number }[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ month: getMonthLabel(d), count: 0 })
  }

  for (const b of bookings) {
    const created = new Date(b.createdAt)
    const label = getMonthLabel(created)
    const entry = months.find((m) => m.month === label)
    if (entry) {
      entry.count += 1
    }
  }

  return months
}

function deriveUpcomingDepartures(bookings: BookingRow[]) {
  const now = new Date()
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  return bookings
    .filter((b) => {
      if (!b.startDate) return false
      const start = new Date(b.startDate)
      return start >= now && start <= thirtyDays && b.status !== "cancelled"
    })
    .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime())
    .slice(0, 8)
}

// ---------- component ----------

function Dashboard() {
  const { data: bookingsData } = useQuery({
    queryKey: ["dashboard-bookings"],
    queryFn: () =>
      api.get<{ data: BookingRow[]; total: number }>("/v1/admin/bookings?limit=500"),
    staleTime: 60_000,
  })

  const { data: productsData } = useQuery({
    queryKey: ["dashboard-products"],
    queryFn: () =>
      api.get<{ data: ProductRow[]; total: number }>("/v1/admin/products?limit=500"),
    staleTime: 60_000,
  })

  const { data: suppliersData } = useQuery({
    queryKey: ["dashboard-suppliers"],
    queryFn: () =>
      api.get<{ data: SupplierRow[]; total: number }>("/v1/admin/suppliers?limit=500"),
    staleTime: 60_000,
  })

  const { data: invoicesData } = useQuery({
    queryKey: ["dashboard-invoices"],
    queryFn: () =>
      api.get<{ data: InvoiceRow[]; total: number }>("/v1/admin/finance/invoices?limit=500"),
    staleTime: 60_000,
  })

  const bookings = bookingsData?.data ?? []
  const products = productsData?.data ?? []
  const suppliers = suppliersData?.data ?? []
  const invoices = invoicesData?.data ?? []

  // KPI calculations
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.sellAmountCents ?? 0), 0)
  const confirmedBookings = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "in_progress",
  ).length
  const totalPax = bookings.reduce((sum, b) => sum + (b.pax ?? 0), 0)
  const activeProducts = products.filter((p) => p.status === "active" || p.status === "published").length

  const outstandingInvoices = invoices.filter(
    (inv) => inv.status === "issued" || inv.status === "sent" || inv.status === "overdue",
  )
  const outstandingAmount = outstandingInvoices.reduce(
    (sum, inv) => sum + (inv.totalAmountCents ?? 0),
    0,
  )

  // Chart data
  const monthlyRevenue = deriveMonthlyRevenue(bookings)
  const statusBreakdown = deriveStatusBreakdown(bookings)
  const monthlyBookings = deriveMonthlyBookingCounts(bookings)
  const upcoming = deriveUpcomingDepartures(bookings)

  // Trend: compare current month to previous
  const currentMonthRevenue = monthlyRevenue[monthlyRevenue.length - 1]?.revenue ?? 0
  const prevMonthRevenue = monthlyRevenue[monthlyRevenue.length - 2]?.revenue ?? 0
  const revenueTrend =
    prevMonthRevenue > 0
      ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
      : 0

  const currentMonthBookings = monthlyBookings[monthlyBookings.length - 1]?.count ?? 0
  const prevMonthBookings = monthlyBookings[monthlyBookings.length - 2]?.count ?? 0
  const bookingTrend =
    prevMonthBookings > 0
      ? ((currentMonthBookings - prevMonthBookings) / prevMonthBookings) * 100
      : 0

  const defaultCurrency = bookings[0]?.sellCurrency ?? "USD"

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Tour operations overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue, defaultCurrency)}
          description="All-time booking revenue"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          trend={revenueTrend}
          trendLabel="vs last month"
        />
        <KpiCard
          title="Active Bookings"
          value={confirmedBookings.toString()}
          description={`${bookings.length} total bookings`}
          icon={<CalendarCheck className="h-4 w-4 text-muted-foreground" />}
          trend={bookingTrend}
          trendLabel="vs last month"
        />
        <KpiCard
          title="Total Passengers"
          value={totalPax.toLocaleString()}
          description="Across all bookings"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <KpiCard
          title="Active Products"
          value={activeProducts.toString()}
          description={`${products.length} total / ${suppliers.length} suppliers`}
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Charts Row 1: Revenue + Status */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Revenue Area Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly booking revenue (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueChartConfig} className="h-[300px] w-full">
              <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(221 83% 53%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(221 83% 53%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) =>
                        typeof value === "number"
                          ? formatCurrency(value * 100, defaultCurrency)
                          : String(value)
                      }
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(221 83% 53%)"
                  fill="url(#fillRevenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Booking Status Pie */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Booking Status</CardTitle>
            <CardDescription>Distribution by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={bookingStatusConfig} className="mx-auto h-[300px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
                <Pie
                  data={statusBreakdown}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {statusBreakdown.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="status" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Monthly Bookings Bar + Outstanding Invoices + Upcoming */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Monthly Bookings Bar */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Monthly Bookings</CardTitle>
            <CardDescription>New bookings per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={monthlyBookingsConfig} className="h-[250px] w-full">
              <BarChart data={monthlyBookings} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Upcoming Departures */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Departures</CardTitle>
              <CardDescription>Next 30 days</CardDescription>
            </div>
            <Link to="/bookings" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No upcoming departures in the next 30 days
              </p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((b) => (
                  <Link
                    key={b.id}
                    to="/bookings/$id"
                    params={{ id: b.id }}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{b.bookingNumber}</span>
                      <span className="text-xs text-muted-foreground">
                        {b.startDate
                          ? new Date(b.startDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "No date"}
                        {b.pax ? ` \u00b7 ${b.pax} pax` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {b.sellAmountCents != null && (
                        <span className="text-sm font-medium tabular-nums">
                          {formatCurrency(b.sellAmountCents, b.sellCurrency)}
                        </span>
                      )}
                      <StatusBadge status={b.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Outstanding Invoices</CardTitle>
            <CardDescription>Unpaid invoice total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">
              {formatCurrency(outstandingAmount, defaultCurrency)}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {outstandingInvoices.length} invoice{outstandingInvoices.length !== 1 ? "s" : ""}{" "}
              pending
            </p>
            <Link to="/finance" className="mt-3 inline-block text-sm text-primary hover:underline">
              View invoices
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supplier Network</CardTitle>
            <CardDescription>Active supplier relationships</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">{suppliers.length}</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Contracted suppliers
            </p>
            <Link
              to="/suppliers"
              className="mt-3 inline-block text-sm text-primary hover:underline"
            >
              Manage suppliers
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Catalog</CardTitle>
            <CardDescription>Tours, packages & experiences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">{products.length}</div>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeProducts} active / {products.length - activeProducts} draft
            </p>
            <Link
              to="/products"
              className="mt-3 inline-block text-sm text-primary hover:underline"
            >
              Manage products
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ---------- sub-components ----------

function KpiCard({
  title,
  value,
  description,
  icon,
  trend,
  trendLabel,
}: {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  trend?: number
  trendLabel?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <div className="flex items-center gap-1 mt-1">
          {trend != null && trend !== 0 && (
            <span
              className={`flex items-center text-xs font-medium ${trend > 0 ? "text-emerald-500" : "text-red-500"}`}
            >
              {trend > 0 ? (
                <ArrowUpRight className="mr-0.5 h-3 w-3" />
              ) : (
                <ArrowDownRight className="mr-0.5 h-3 w-3" />
              )}
              {Math.abs(trend).toFixed(0)}%
            </span>
          )}
          <p className="text-xs text-muted-foreground">
            {trendLabel && trend != null && trend !== 0 ? trendLabel : description}
          </p>
        </div>
        {trendLabel && trend != null && trend !== 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const variant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    draft: "outline",
    confirmed: "default",
    in_progress: "secondary",
    completed: "secondary",
    cancelled: "destructive",
  }
  return (
    <Badge variant={variant[status] ?? "outline"} className="text-xs capitalize">
      {status.replace(/_/g, " ")}
    </Badge>
  )
}
