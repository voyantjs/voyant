import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
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
} from "@/components/ui/chart"
import {
  bookingStatusConfig,
  deriveMonthlyBookingCounts,
  deriveMonthlyRevenue,
  deriveStatusBreakdown,
  deriveUpcomingDepartures,
  formatCurrency,
  getDashboardBookingsQueryOptions,
  getDashboardInvoicesQueryOptions,
  getDashboardProductsQueryOptions,
  getDashboardSuppliersQueryOptions,
  monthlyBookingsConfig,
  revenueChartConfig,
} from "./dashboard-shared"

export function DashboardPage() {
  const { data: bookingsData } = useQuery(getDashboardBookingsQueryOptions())
  const { data: productsData } = useQuery(getDashboardProductsQueryOptions())
  const { data: suppliersData } = useQuery(getDashboardSuppliersQueryOptions())
  const { data: invoicesData } = useQuery(getDashboardInvoicesQueryOptions())

  const bookings = bookingsData?.data ?? []
  const products = productsData?.data ?? []
  const suppliers = suppliersData?.data ?? []
  const invoices = invoicesData?.data ?? []
  const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.sellAmountCents ?? 0), 0)
  const confirmedBookings = bookings.filter(
    (booking) => booking.status === "confirmed" || booking.status === "in_progress",
  ).length
  const totalPax = bookings.reduce((sum, booking) => sum + (booking.pax ?? 0), 0)
  const activeProducts = products.filter(
    (product) => product.status === "active" || product.status === "published",
  ).length
  const outstandingInvoices = invoices.filter(
    (invoice) =>
      invoice.status === "issued" || invoice.status === "sent" || invoice.status === "overdue",
  )
  const outstandingAmount = outstandingInvoices.reduce(
    (sum, invoice) => sum + (invoice.totalAmountCents ?? 0),
    0,
  )
  const monthlyRevenue = deriveMonthlyRevenue(bookings)
  const statusBreakdown = deriveStatusBreakdown(bookings)
  const monthlyBookings = deriveMonthlyBookingCounts(bookings)
  const upcoming = deriveUpcomingDepartures(bookings)
  const currentMonthRevenue = monthlyRevenue[monthlyRevenue.length - 1]?.revenue ?? 0
  const prevMonthRevenue = monthlyRevenue[monthlyRevenue.length - 2]?.revenue ?? 0
  const revenueTrend =
    prevMonthRevenue > 0 ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0
  const currentMonthBookings = monthlyBookings[monthlyBookings.length - 1]?.count ?? 0
  const prevMonthBookings = monthlyBookings[monthlyBookings.length - 2]?.count ?? 0
  const bookingTrend =
    prevMonthBookings > 0
      ? ((currentMonthBookings - prevMonthBookings) / prevMonthBookings) * 100
      : 0
  const defaultCurrency = bookings[0]?.sellCurrency ?? "USD"

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Tour operations overview</p>
      </div>
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

      <div className="grid gap-4 lg:grid-cols-7">
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
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
                />
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

      <div className="grid gap-4 lg:grid-cols-7">
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
                {upcoming.map((booking) => (
                  <Link
                    key={booking.id}
                    to="/bookings/$id"
                    params={{ id: booking.id }}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{booking.bookingNumber}</span>
                      <span className="text-xs text-muted-foreground">
                        {booking.startDate
                          ? new Date(booking.startDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "No date"}
                        {booking.pax ? ` · ${booking.pax} pax` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {booking.sellAmountCents != null && (
                        <span className="text-sm font-medium tabular-nums">
                          {formatCurrency(booking.sellAmountCents, booking.sellCurrency)}
                        </span>
                      )}
                      <Badge variant="outline" className="capitalize">
                        {booking.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Outstanding Invoices</CardTitle>
            <CardDescription>Invoices still awaiting payment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
              <div>
                <p className="text-sm font-medium">Outstanding total</p>
                <p className="text-xs text-muted-foreground">
                  {outstandingInvoices.length} invoices currently due
                </p>
              </div>
              <p className="text-lg font-semibold">
                {formatCurrency(outstandingAmount, invoices[0]?.currency ?? "USD")}
              </p>
            </div>
            {outstandingInvoices.slice(0, 5).map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{invoice.id.slice(0, 8)}</span>
                  <span className="text-xs text-muted-foreground">
                    {invoice.issuedAt
                      ? new Date(invoice.issuedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "No issue date"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {formatCurrency(invoice.totalAmountCents ?? 0, invoice.currency)}
                  </span>
                  <Badge variant="secondary" className="capitalize">
                    {invoice.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

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
  const isPositive = (trend ?? 0) >= 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend != null && trendLabel ? (
          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
                isPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(trend).toFixed(1)}%
            </span>
            <span>{trendLabel}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
