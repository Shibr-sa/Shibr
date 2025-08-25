"use client"

import { useState, useEffect } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useLanguage } from "@/contexts/localization-context"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Users, 
  Package, 
  DollarSign, 
  FileText, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Store,
  Activity
} from "lucide-react"
import { 
  Bar, 
  BarChart, 
  Line, 
  LineChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Empty data structure for loading state
const emptyChartData = [
  { month: "Jan", revenue: 0, orders: 0, users: 0 },
  { month: "Feb", revenue: 0, orders: 0, users: 0 },
  { month: "Mar", revenue: 0, orders: 0, users: 0 },
  { month: "Apr", revenue: 0, orders: 0, users: 0 },
  { month: "May", revenue: 0, orders: 0, users: 0 },
  { month: "Jun", revenue: 0, orders: 0, users: 0 },
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
  const adminStats = useQuery(api.admin.getAdminStats, { timePeriod })
  const isLoading = adminStats === undefined

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const formatCurrency = (num: number) => {
    return `${formatNumber(num)} ${t("common.currency")}`
  }

  return (
    <div className="space-y-6">
      {/* Header and Stats in Single Card */}
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

      {/* Charts Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        {/* Revenue Chart - Takes more space */}
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">{t("dashboard.revenue_rate")}</CardTitle>
                <CardDescription className="mt-1">
                  {t("dashboard.monthly")} {t("dashboard.revenue_rate").toLowerCase()}
                </CardDescription>
              </div>
              <Tabs defaultValue="monthly" className="w-auto">
                <TabsList className="h-8">
                  <TabsTrigger value="daily" className="text-xs h-7 px-2">
                    {t("dashboard.daily")}
                  </TabsTrigger>
                  <TabsTrigger value="weekly" className="text-xs h-7 px-2">
                    {t("dashboard.weekly")}
                  </TabsTrigger>
                  <TabsTrigger value="monthly" className="text-xs h-7 px-2">
                    {t("dashboard.monthly")}
                  </TabsTrigger>
                  <TabsTrigger value="yearly" className="text-xs h-7 px-2">
                    {t("dashboard.yearly")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: {
                  label: t("dashboard.total_revenue"),
                  color: "#8b5cf6",
                },
              }}
              className="h-[350px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={isLoading ? emptyChartData : (adminStats?.charts?.revenueByMonth || [])}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    tickFormatter={(value) => `${value/1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    formatter={(value: any) => formatCurrency(value)}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Right Side - Top Stores */}
        <div className="col-span-1 lg:col-span-3">
          {/* Top Performing Stores */}
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Top Performing Stores</CardTitle>
              <CardDescription>Based on monthly revenue</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-4">
                {isLoading ? (
                  // Loading skeletons for top stores
                  Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))
                ) : (
                  (adminStats?.charts?.topStores || []).slice(0, 5).map((store, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={store.avatar} />
                        <AvatarFallback>{store.name?.slice(0, 2).toUpperCase() || "ST"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">{store.name || "Unknown Store"}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatCurrency(store.revenue || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {(store.growth || 0) >= 0 ? (
                        <>
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <span className="text-xs font-medium text-green-600">+{store.growth || 0}%</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3 w-3 text-destructive" />
                          <span className="text-xs font-medium text-destructive">{store.growth || 0}%</span>
                        </>
                      )}
                    </div>
                  </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  )
}