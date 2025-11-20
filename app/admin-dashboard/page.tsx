"use client"

import { useState, useEffect } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useLanguage } from "@/contexts/localization-context"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Users, 
  Package, 
  DollarSign, 
  FileText, 
  TrendingUp,
  TrendingDown,
  Store
} from "lucide-react"
import { 
  Bar, 
  BarChart, 
  XAxis, 
  CartesianGrid
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Empty data structure for loading state - full year
const emptyChartData = [
  { month: "Jan", revenue: 0, orders: 0, users: 0 },
  { month: "Feb", revenue: 0, orders: 0, users: 0 },
  { month: "Mar", revenue: 0, orders: 0, users: 0 },
  { month: "Apr", revenue: 0, orders: 0, users: 0 },
  { month: "May", revenue: 0, orders: 0, users: 0 },
  { month: "Jun", revenue: 0, orders: 0, users: 0 },
  { month: "Jul", revenue: 0, orders: 0, users: 0 },
  { month: "Aug", revenue: 0, orders: 0, users: 0 },
  { month: "Sep", revenue: 0, orders: 0, users: 0 },
  { month: "Oct", revenue: 0, orders: 0, users: 0 },
  { month: "Nov", revenue: 0, orders: 0, users: 0 },
  { month: "Dec", revenue: 0, orders: 0, users: 0 },
]


export default function AdminDashboard() {
  const { language, t, direction } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Initialize state from URL params for persistence
  const [timePeriod, setTimePeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">(
    (searchParams.get("period") as "daily" | "weekly" | "monthly" | "yearly") || "monthly"
  )
  
  // Update URL when period changes
  useEffect(() => {
    const params = new URLSearchParams()
    if (timePeriod !== "monthly") params.set("period", timePeriod)
    
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(newUrl, { scroll: false })
  }, [timePeriod, pathname, router])
  
  // Fetch real stats from Convex
  const adminStats = useQuery(api.admin.analytics.getAdminStats, { timePeriod })
  const chartData = useQuery(api.admin.analytics.getAdminChartData, {}) // Separate query for charts
  const topStores = useQuery(api.admin.analytics.getTopPerformingStores, { timePeriod, limit: 5 }) // New: Top stores query
  const isLoading = adminStats === undefined
  const isChartLoading = chartData === undefined
  const isTopStoresLoading = topStores === undefined

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const formatCurrency = (num: number) => {
    return `${formatNumber(num)} ${t("common.currency")}`
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard.control_panel")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("dashboard.platform_overview")}
          </p>
        </div>
        <Tabs value={timePeriod} onValueChange={(value) => setTimePeriod(value as "daily" | "weekly" | "monthly" | "yearly")} className="w-auto">
          <TabsList className="grid grid-cols-4 w-auto bg-muted">
            <TabsTrigger value="daily" className="px-4">
              {t("dashboard.daily")}
            </TabsTrigger>
            <TabsTrigger value="weekly" className="px-4">
              {t("dashboard.weekly")}
            </TabsTrigger>
            <TabsTrigger value="monthly" className="px-4">
              {t("dashboard.monthly")}
            </TabsTrigger>
            <TabsTrigger value="yearly" className="px-4">
              {t("dashboard.yearly")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
              <Card className="bg-muted/50 border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-[14px] w-20" />
                      <Skeleton className="h-[30px] w-28 mt-1" />
                      <Skeleton className="h-[16px] w-24 mt-1" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-lg" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <StatCard
                title={t("dashboard.total_users")}
                value={formatNumber(adminStats?.users?.totalUsers || 0)}
                trend={{
                  value: adminStats?.users?.change || 0,
                  label: timePeriod === "daily" ? t("dashboard.from_yesterday") : 
                         timePeriod === "weekly" ? t("dashboard.from_last_week") :
                         timePeriod === "yearly" ? t("dashboard.from_last_year") :
                         t("dashboard.from_last_month")
                }}
                icon={<Users className="h-6 w-6 text-primary" />}
              />
            )}

            {isLoading ? (
              <Card className="bg-muted/50 border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-[14px] w-20" />
                      <Skeleton className="h-[30px] w-28 mt-1" />
                      <Skeleton className="h-[16px] w-24 mt-1" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-lg" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <StatCard
                title={t("dashboard.shelves_count")}
                value={formatNumber(adminStats?.shelves?.total || 0)}
                description={
                  language === "ar" ? 
                    `${(adminStats?.shelves?.total || 0) - (adminStats?.shelves?.available || 0)} مؤجر، ${adminStats?.shelves?.available || 0} متاح` : 
                    `${(adminStats?.shelves?.total || 0) - (adminStats?.shelves?.available || 0)} rented, ${adminStats?.shelves?.available || 0} available`
                }
                icon={<Package className="h-6 w-6 text-primary" />}
              />
            )}

            {isLoading ? (
              <Card className="bg-muted/50 border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-[14px] w-20" />
                      <Skeleton className="h-[30px] w-28 mt-1" />
                      <Skeleton className="h-[16px] w-24 mt-1" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-lg" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <StatCard
                title={t("dashboard.total_revenue")}
                value={formatCurrency(adminStats?.revenue?.totalRevenue || 0)}
                trend={{
                  value: adminStats?.revenue?.change || 0,
                  label: t("dashboard.from_rentals")
                }}
                icon={<DollarSign className="h-6 w-6 text-primary" />}
              />
            )}

            {isLoading ? (
              <Card className="bg-muted/50 border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-[14px] w-20" />
                      <Skeleton className="h-[30px] w-28 mt-1" />
                      <Skeleton className="h-[16px] w-24 mt-1" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-lg" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <StatCard
                title={t("dashboard.rental_requests")}
                value={formatNumber(adminStats?.rentals?.total || 0)}
                trend={{
                  value: adminStats?.rentals?.change || 0,
                  label: timePeriod === "daily" ? t("dashboard.from_yesterday") : 
                         timePeriod === "weekly" ? t("dashboard.from_last_week") :
                         timePeriod === "yearly" ? t("dashboard.from_last_year") :
                         t("dashboard.from_last_month")
                }}
                icon={<FileText className="h-6 w-6 text-primary" />}
              />
            )}
      </div>

      {/* Charts Section - Stacked Vertically */}
      <div className="space-y-6">
        {/* Revenue Chart - Full Width */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">{t("dashboard.revenue_overview")}</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ChartContainer
              config={{
                revenue: {
                  label: t("dashboard.revenue"),
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[200px] sm:h-[250px] w-full"
            >
              <BarChart 
                data={isChartLoading ? emptyChartData : (chartData?.revenueByMonth || [])}
                accessibilityLayer
              >
                <CartesianGrid vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <ChartTooltip 
                  content={
                    <ChartTooltipContent 
                      formatter={(value: any) => formatCurrency(value as number)}
                    />
                  } 
                />
                <Bar 
                  dataKey="revenue" 
                  fill="var(--color-revenue)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Selling Brands Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{t("dashboard.top_performing_stores")}</h3>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="h-12 text-start font-medium">
                    {t("dashboard.brand_name")}
                  </TableHead>
                  <TableHead className="h-12 text-start font-medium hidden md:table-cell">
                    {t("dashboard.revenue")}
                  </TableHead>
                  <TableHead className="h-12 text-start font-medium">
                    {t("dashboard.growth")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTopStoresLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index} className="h-[72px]">
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </TableCell>
                      <TableCell className="py-3 hidden md:table-cell">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : topStores && topStores.length > 0 ? (
                  <>
                    {topStores.map((store, index) => (
                      <TableRow key={store.id || index} className="h-[72px]">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={store.avatar || undefined} alt={store.name} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {store.name?.charAt(0)?.toUpperCase() || "S"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {store.name || t("common.unknown")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-muted-foreground hidden md:table-cell">
                          {formatCurrency(store.revenue || 0)}
                        </TableCell>
                        <TableCell className="py-3">
                          {(store.growth || 0) >= 0 ? (
                            <Badge variant="outline" className="font-normal border-green-200 bg-green-50 text-green-700">
                              <TrendingUp className="mr-1 h-3 w-3" />
                              +{store.growth || 0}%
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="font-normal border-red-200 bg-red-50 text-red-700">
                              <TrendingDown className="mr-1 h-3 w-3" />
                              {store.growth || 0}%
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                      {/* Fill remaining rows to always show 5 rows */}
                    {topStores && topStores.length < 5 &&
                      Array.from({ length: 5 - topStores.length }).map((_, index) => (
                        <TableRow key={`filler-${index}`} className="h-[72px]">
                          <TableCell className="py-3" colSpan={3}></TableCell>
                        </TableRow>
                      ))
                    }
                  </>
                ) : (
                  // Empty state - centered view with fixed height
                  <TableRow>
                    <TableCell colSpan={3} className="h-[360px] text-center">
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="flex flex-col items-center gap-1 py-10">
                          <Store className="h-10 w-10 text-muted-foreground/40 mb-2" />
                          <h3 className="font-medium">
                            {t("dashboard.no_stores_data")}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {t("stores.stores_will_appear_here")}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

    </div>
  )
}