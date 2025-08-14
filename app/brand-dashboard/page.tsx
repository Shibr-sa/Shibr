"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Package, 
  Store, 
  Plus, 
  AlertTriangle, 
  ArrowRight, 
  Lock,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Layers,
  BarChart3
} from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/contexts/localization-context"
import { useRouter } from "next/navigation"
import { useBrandData } from "@/contexts/brand-data-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Id } from "@/convex/_generated/dataModel"
import { formatCurrency } from "@/lib/formatters"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export default function BrandDashboardPage() {
  const { t, direction, language } = useLanguage()
  const router = useRouter()
  const { user } = useCurrentUser()
  
  // Use the brand data context for consistent state
  const { isBrandDataComplete, isLoading } = useBrandData()
  
  // Fetch rental requests for the brand owner
  const rentalRequests = useQuery(
    api.rentalRequests.getUserRentalRequests,
    user?.id ? {
      userId: user.id as Id<"users">,
      userType: "brand" as const
    } : "skip"
  )
  
  // Fetch rental statistics with percentage changes
  const rentalStats = useQuery(
    api.rentalRequests.getRentalStatsWithChanges,
    user?.id ? {
      userId: user.id as Id<"users">,
      userType: "brand" as const,
      period: "monthly" as const
    } : "skip"
  )
  
  // Fetch products data
  const products = useQuery(
    api.products.getOwnerProducts,
    user?.id ? { ownerId: user.id as Id<"users"> } : "skip"
  )
  
  // Fetch product statistics
  const productStats = useQuery(
    api.products.getProductStats,
    user?.id ? { 
      ownerId: user.id as Id<"users">,
      period: "monthly" as const
    } : "skip"
  )
  
  // Fetch sales chart data
  const salesChartDataRaw = useQuery(
    api.products.getSalesChartData,
    user?.id ? { ownerId: user.id as Id<"users"> } : "skip"
  )
  
  // Get active rentals (max 3 for display)
  const activeRentals = rentalRequests?.filter(r => r.status === "active").slice(0, 3) || []
  
  // Calculate statistics
  const pendingRequests = rentalRequests?.filter(r => r.status === "pending").length || 0
  const totalRevenue = productStats?.totalRevenue || 0
  const totalSales = productStats?.totalSales || 0
  
  // Prepare chart data - use real data if available, otherwise show empty state
  const salesChartData = salesChartDataRaw || []
  
  // Chart configuration for shadcn/ui
  const chartConfig = {
    revenue: {
      label: t("brand.dashboard.revenue"),
      color: "#725CAD",
    },
    sales: {
      label: t("brand.dashboard.sales_count"),
      color: "#A899DD",
    },
  }
  
  // Format currency helper
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Data Completion Warning - Only show if data is incomplete */}
      {isBrandDataComplete === false && (
        <Alert className="border-destructive/50 bg-destructive/10 [&>svg]:top-1/2 [&>svg]:-translate-y-1/2 [&>svg+div]:translate-y-0">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <AlertTitle className="text-destructive font-semibold mb-0">
                {t("dashboard.incomplete_profile_warning")}
              </AlertTitle>
              <AlertDescription className="mt-1">
                <span className="text-muted-foreground">
                  {t("brand.dashboard.complete_data_description")}
                </span>
              </AlertDescription>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => router.push("/brand-dashboard/settings")}
              className="gap-2 ms-4 flex-shrink-0"
            >
              {t("dashboard.complete_profile_now")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </div>
        </Alert>
      )}

      {/* Statistics Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">{t("brand.dashboard.welcome_to_shelfy")}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t("brand.dashboard.monitor_description")}
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button 
                      className="gap-2"
                      disabled={!isBrandDataComplete}
                      onClick={() => router.push("/brand-dashboard/shelves/marketplace")}
                    >
                      {!isBrandDataComplete && <Lock className="h-4 w-4" />}
                      {isBrandDataComplete && <Plus className="h-4 w-4" />}
                      {t("brand.dashboard.rent_new_shelf")}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!isBrandDataComplete && (
                  <TooltipContent>
                    <p>{t("brand.dashboard.complete_profile_to_enable")}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t("brand.dashboard.rented_shelves_count")}
                  </p>
                  <div className="text-3xl font-bold">
                    {activeRentals.length}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {rentalStats?.activeChange !== undefined && rentalStats.activeChange !== 0 ? (
                      <>
                        {rentalStats.activeChange > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                        <span className={`text-xs font-medium ${rentalStats.activeChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {rentalStats.activeChange > 0 ? '+' : ''}{rentalStats.activeChange.toFixed(1)}% {t("time.from")} {t("time.last_month")}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        0.0% {t("time.from")} {t("time.last_month")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Store className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t("brand.dashboard.total_sales")}
                  </p>
                  <div className="text-3xl font-bold text-primary">
                    {language === "ar" 
                      ? `${formatPrice(totalRevenue)} ${t("common.currency")}`
                      : `${t("common.currency")} ${formatPrice(totalRevenue)}`
                    }
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {productStats?.revenueChange !== undefined && productStats.revenueChange !== 0 ? (
                      <>
                        {productStats.revenueChange > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                        <span className={`text-xs font-medium ${productStats.revenueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {productStats.revenueChange > 0 ? '+' : ''}{productStats.revenueChange.toFixed(1)}% {t("time.from")} {t("time.last_month")}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        0.0% {t("time.from")} {t("time.last_month")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t("brand.dashboard.total_products")}
                  </p>
                  <div className="text-3xl font-bold">
                    {products?.length || 0}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {productStats?.productsChange !== undefined && productStats.productsChange !== 0 ? (
                      <>
                        {productStats.productsChange > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                        <span className={`text-xs font-medium ${productStats.productsChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {productStats.productsChange > 0 ? '+' : ''}{productStats.productsChange.toFixed(1)}% {t("time.from")} {t("time.last_month")}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        0.0% {t("time.from")} {t("time.last_month")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales and Shelves Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">{t("brand.dashboard.sales")}</CardTitle>
          </CardHeader>
          <CardContent>
            {salesChartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart 
                  data={salesChartData}
                  margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    hide={true}
                  />
                  <YAxis 
                    hide={true}
                  />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        formatter={(value) => 
                          language === 'ar' 
                            ? `${formatPrice(Number(value))} ${t("common.currency")}` 
                            : `${t("common.currency")} ${formatPrice(Number(value))}`
                        }
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
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-[280px]">
                <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                  <BarChart3 className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground mb-2">{t("brand.dashboard.no_sales_data")}</p>
                <p className="text-sm text-muted-foreground">
                  {products && products.length > 0 
                    ? t("brand.dashboard.sales_will_appear_here")
                    : t("brand.dashboard.add_products_first")
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold">{t("brand.dashboard.your_rented_shelves")}</CardTitle>
            {isBrandDataComplete ? (
              <Link href="/brand-dashboard/shelves" className="text-sm text-primary">
                {t("brand.dashboard.see_more")}
              </Link>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm text-muted-foreground cursor-not-allowed flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      {t("brand.dashboard.see_more")}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("brand.dashboard.complete_profile_to_enable")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </CardHeader>
          <CardContent>
            {activeRentals.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-start">{t("table.city")}</TableHead>
                      <TableHead className="text-start">{t("shelves.table.shelf_name")}</TableHead>
                      <TableHead className="text-start">{t("shelves.table.branch_name")}</TableHead>
                      <TableHead className="text-start">{t("table.operations_count")}</TableHead>
                      <TableHead className="text-start">{t("table.rental_price")}</TableHead>
                      <TableHead className="text-start">{t("table.status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeRentals.map((rental, index) => (
                      <TableRow key={rental._id} className="h-[52px]">
                        <TableCell className="font-medium">
                          {rental.shelfCity || rental.city || t("common.riyadh")}
                        </TableCell>
                        <TableCell>{rental.shelfName || "-"}</TableCell>
                        <TableCell>{rental.shelfBranch || "-"}</TableCell>
                        <TableCell>
                          {language === "ar" ? `${formatPrice(rental.productCount || 0)} منتجات` : `${formatPrice(rental.productCount || 0)} products`}
                        </TableCell>
                        <TableCell>
                          {language === "ar" 
                            ? `${formatPrice(rental.monthlyPrice || rental.shelfPrice || 0)} ${t("common.currency")}`
                            : `${t("common.currency")} ${formatPrice(rental.monthlyPrice || rental.shelfPrice || 0)}`
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                            {t("status.active")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Add empty rows to maintain 3 rows */}
                    {activeRentals.length < 3 && Array.from({ length: 3 - activeRentals.length }).map((_, index) => (
                      <TableRow key={`empty-${index}`} className="h-[52px]">
                        <TableCell colSpan={6}>&nbsp;</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                  <Layers className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground mb-2">{t("brand.dashboard.no_shelves_currently")}</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button 
                          variant={!isBrandDataComplete ? "outline" : "link"} 
                          className={!isBrandDataComplete ? "gap-1" : "text-primary gap-1"}
                          disabled={!isBrandDataComplete}
                          onClick={() => router.push("/brand-dashboard/shelves/marketplace")}
                        >
                          {!isBrandDataComplete && <Lock className="h-4 w-4" />}
                          {isBrandDataComplete && <Plus className="h-4 w-4" />}
                          {t("brand.dashboard.add_new_shelf")}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!isBrandDataComplete && (
                      <TooltipContent>
                        <p>{t("brand.dashboard.complete_profile_to_enable")}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Latest Sales Operations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold">{t("brand.dashboard.latest_sales_operations")}</CardTitle>
          {isBrandDataComplete ? (
            <Link href="/brand-dashboard/sales" className="text-sm text-primary">
              {t("brand.dashboard.see_more")}
            </Link>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-sm text-muted-foreground cursor-not-allowed flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    {t("brand.dashboard.see_more")}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("brand.dashboard.complete_profile_to_enable")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center h-64">
          <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
            <ShoppingCart className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground">{t("brand.dashboard.no_sales_operations")}</p>
        </CardContent>
      </Card>
    </div>
  )
}
