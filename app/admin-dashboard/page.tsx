"use client"

import { useLanguage } from "@/contexts/localization-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

// Sample data for charts
const revenueData = [
  { month: "Jan", revenue: 400000, orders: 1200, users: 450 },
  { month: "Feb", revenue: 350000, orders: 1100, users: 480 },
  { month: "Mar", revenue: 200000, orders: 850, users: 520 },
  { month: "Apr", revenue: 280000, orders: 950, users: 540 },
  { month: "May", revenue: 450000, orders: 1400, users: 580 },
  { month: "Jun", revenue: 320000, orders: 1050, users: 610 },
]

const recentRevenueData = [
  { day: "Mon", value: 45000 },
  { day: "Tue", value: 52000 },
  { day: "Wed", value: 48000 },
  { day: "Thu", value: 61000 },
  { day: "Fri", value: 55000 },
  { day: "Sat", value: 67000 },
  { day: "Sun", value: 43000 },
]

const categoryData = [
  { name: "Electronics", value: 35, color: "#8b5cf6" },
  { name: "Fashion", value: 25, color: "#3b82f6" },
  { name: "Beauty", value: 20, color: "#10b981" },
  { name: "Food", value: 12, color: "#f59e0b" },
  { name: "Others", value: 8, color: "#6b7280" },
]

const topStores = [
  { name: "Store X - Riyadh", revenue: 85000, growth: 12.5, avatar: "/api/placeholder/32/32" },
  { name: "Glow Cosmetics", revenue: 72000, growth: 8.3, avatar: "/api/placeholder/32/32" },
  { name: "Nova Perfumes", revenue: 65000, growth: -2.4, avatar: "/api/placeholder/32/32" },
  { name: "FitZone", revenue: 58000, growth: 15.7, avatar: "/api/placeholder/32/32" },
  { name: "Coffee Box", revenue: 45000, growth: 5.2, avatar: "/api/placeholder/32/32" },
]

// Sample data for recent activities
const recentActivities = [
  {
    id: 1,
    type: "new_store",
    title: "New store registered",
    description: "Fashion Hub joined the platform",
    time: "2 minutes ago",
    icon: Store,
    color: "text-blue-600"
  },
  {
    id: 2,
    type: "new_rental",
    title: "New shelf rental",
    description: "Glow Cosmetics rented a shelf in Store X",
    time: "15 minutes ago",
    icon: Package,
    color: "text-green-600"
  },
  {
    id: 3,
    type: "payment",
    title: "Payment received",
    description: "320,000 SAR from monthly rentals",
    time: "1 hour ago",
    icon: DollarSign,
    color: "text-purple-600"
  },
  {
    id: 4,
    type: "new_user",
    title: "New brand registered",
    description: "Tech Gadgets created an account",
    time: "3 hours ago",
    icon: Users,
    color: "text-orange-600"
  },
]

// Sample data for stores table
const storesData = [
  {
    id: 1,
    storeName: "Store X",
    branch: "Riyadh",
    owner: "Ahmed Ali",
    shelves: { total: 12, rented: 8 },
    revenue: 85000,
    dateAdded: "June 24, 2023",
    status: "active",
    avatar: "/api/placeholder/40/40"
  },
  {
    id: 2,
    storeName: "Perfume Store",
    branch: "Jeddah",
    owner: "Sara Mohammad",
    shelves: { total: 8, rented: 6 },
    revenue: 72000,
    dateAdded: "June 23, 2023",
    status: "active",
    avatar: "/api/placeholder/40/40"
  },
  {
    id: 3,
    storeName: "Modern Style",
    branch: "Dammam",
    owner: "Khalid Ibrahim",
    shelves: { total: 15, rented: 10 },
    revenue: 65000,
    dateAdded: "June 22, 2023",
    status: "pending",
    avatar: "/api/placeholder/40/40"
  },
  {
    id: 4,
    storeName: "Fashion Hub",
    branch: "Riyadh",
    owner: "Fatima Hassan",
    shelves: { total: 10, rented: 4 },
    revenue: 45000,
    dateAdded: "June 21, 2023",
    status: "active",
    avatar: "/api/placeholder/40/40"
  },
]

export default function AdminDashboard() {
  const { language, t, direction } = useLanguage()

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const formatCurrency = (num: number) => {
    return `${formatNumber(num)} ${t("common.currency")}`
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.control_panel")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("dashboard.platform_overview")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard.total_users")}
            </CardTitle>
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(2845)}</div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600 font-medium">+12.5%</span>
              <span className="text-xs text-muted-foreground">{t("dashboard.from_last_month")}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard.shelves_count")}
            </CardTitle>
            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(890)}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs px-2 py-0">
                620 {t("dashboard.rented")}
              </Badge>
              <Badge variant="outline" className="text-xs px-2 py-0">
                270 {t("dashboard.available")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard.total_revenue")}
            </CardTitle>
            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(1450000)}</div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600 font-medium">+8.2%</span>
              <span className="text-xs text-muted-foreground">{t("dashboard.from_rentals")}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("dashboard.rental_requests")}
            </CardTitle>
            <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(145)}</div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowDownRight className="h-4 w-4 text-red-600" />
              <span className="text-xs text-red-600 font-medium">-3.1%</span>
              <span className="text-xs text-muted-foreground">{t("dashboard.from_last_month")}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        {/* Revenue Chart - Takes more space */}
        <Card className="col-span-1 lg:col-span-4 border-0 shadow-sm">
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
                <AreaChart data={revenueData}>
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
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Top Performing Stores</CardTitle>
              <CardDescription>Based on monthly revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topStores.map((store, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={store.avatar} />
                        <AvatarFallback>{store.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">{store.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatCurrency(store.revenue)}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 ${store.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {store.growth >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span className="text-xs font-medium">{Math.abs(store.growth)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  )
}