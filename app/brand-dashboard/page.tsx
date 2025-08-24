"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { StatCard } from "@/components/ui/stat-card"
import { Skeleton } from "@/components/ui/skeleton"
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
import { formatCurrency, formatNumber, formatDate } from "@/lib/formatters"
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
      userType: "brand" as const
    } : "skip"
  )
  
  // Fetch rental statistics with percentage changes
  const rentalStats = useQuery(
    api.rentalRequests.getRentalStatsWithChanges,
    user?.id ? {
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
  
  // Fetch latest sales operations
  const salesOperations = useQuery(
    api.products.getLatestSalesOperations,
    user?.id ? { ownerId: user.id as Id<"users">, limit: 3 } : "skip"
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
  
  // Helper function to get badge variant
  const getBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "active":
        return "default"
      case "pending":
        return "outline"
      case "rejected":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-6">
      {/* Data Completion Warning - Only show if data is incomplete */}
      {isBrandDataComplete === false && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t("dashboard.incomplete_profile_warning")}</AlertTitle>
          <AlertDescription className="mt-2">
            <div className="flex items-center justify-between">
              <span>{t("brand.dashboard.complete_data_description")}</span>
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
          </AlertDescription>
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
            <StatCard
              title={t("brand.dashboard.rented_shelves_count")}
              value={activeRentals.length}
              trend={{
                value: rentalStats?.activeChange || 0,
                label: `${t("time.from")} ${t("time.last_month")}`
              }}
              icon={<Store className="h-5 w-5 text-primary" />}
            />
            
            <StatCard
              title={t("brand.dashboard.total_sales")}
              value={formatCurrency(totalRevenue, language)}
              trend={{
                value: productStats?.revenueChange || 0,
                label: `${t("time.from")} ${t("time.last_month")}`
              }}
              icon={<TrendingUp className="h-5 w-5 text-primary" />}
            />
            
            <StatCard
              title={t("brand.dashboard.total_products")}
              value={products?.length || 0}
              trend={{
                value: productStats?.productsChange || 0,
                label: `${t("time.from")} ${t("time.last_month")}`
              }}
              icon={<Package className="h-5 w-5 text-primary" />}
            />
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
                          formatCurrency(Number(value), language)
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
          <CardHeader>
            <div className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">{t("brand.dashboard.your_rented_shelves")}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("brand.dashboard.rented_shelves_description")}
                </p>
              </div>
            {isBrandDataComplete ? (
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <Link href="/brand-dashboard/shelves">
                  {t("brand.dashboard.see_more")}
                </Link>
              </Button>
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
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-start">{t("table.store_name")}</TableHead>
                    <TableHead className="text-start">{t("table.city")}</TableHead>
                    <TableHead className="text-start">{t("table.product_count")}</TableHead>
                    <TableHead className="text-start">{t("table.sales_count")}</TableHead>
                    <TableHead className="text-start">{t("brand.dashboard.table.rental_status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeRentals.length > 0 ? (
                    <>
                      {activeRentals.map((rental, index) => (
                        <TableRow key={rental._id} className="h-[52px]">
                          <TableCell className="font-medium">
                            {rental.otherUserName || "-"}
                          </TableCell>
                          <TableCell>
                            {(rental as any).shelfCity || rental.city || t("common.riyadh")}
                          </TableCell>
                          <TableCell>
                            {formatNumber(rental.productCount || 0)}
                          </TableCell>
                          <TableCell>
                            {formatNumber(0)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={rental.status === "active" ? "default" : "secondary"}>
                              {rental.status === "active" ? t("status.active") : t("stores.rental_status.expired")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Add skeleton rows to maintain 3 rows */}
                      {activeRentals.length < 3 && Array.from({ length: 3 - activeRentals.length }).map((_, index) => (
                        <TableRow key={`empty-${index}`} className="h-[52px]">
                          <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : (
                    // Show empty state message in the middle of 3 rows
                    Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={`empty-${index}`} className="h-[52px]">
                        {index === 1 ? (
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            <div className="flex items-center justify-center gap-2">
                              <Layers className="h-4 w-4" />
                              <span>{t("brand.dashboard.no_shelves_currently")}</span>
                            </div>
                          </TableCell>
                        ) : (
                          <>
                            <TableCell>&nbsp;</TableCell>
                            <TableCell>&nbsp;</TableCell>
                            <TableCell>&nbsp;</TableCell>
                            <TableCell>&nbsp;</TableCell>
                            <TableCell>&nbsp;</TableCell>
                          </>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Latest Sales Operations */}
      <Card>
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">{t("brand.dashboard.latest_sales_operations")}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t("brand.dashboard.sales_operations_description")}
              </p>
            </div>
            {isBrandDataComplete ? (
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <Link href="/brand-dashboard/products">
                  {t("brand.dashboard.see_more")}
                </Link>
              </Button>
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-start">{t("table.order_number")}</TableHead>
                  <TableHead className="text-start">{t("table.product_name")}</TableHead>
                  <TableHead className="text-start">{t("table.store_name")}</TableHead>
                  <TableHead className="text-start">{t("table.city")}</TableHead>
                  <TableHead className="text-start">{t("table.price")}</TableHead>
                  <TableHead className="text-start">{t("table.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!salesOperations ? (
                  // Loading state - show 3 skeleton rows
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={`sales-loading-${index}`} className="h-[52px]">
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    </TableRow>
                  ))
                ) : salesOperations.length > 0 ? (
                  <>
                    {salesOperations.map((sale, index) => (
                      <TableRow key={sale.orderNumber} className="h-[52px]">
                        <TableCell className="font-medium">
                          {sale.orderNumber}
                        </TableCell>
                        <TableCell>
                          {sale.productName}
                        </TableCell>
                        <TableCell>
                          {sale.storeName}
                        </TableCell>
                        <TableCell>
                          {sale.city}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(sale.price, language)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(sale.date, language)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Add skeleton rows to maintain 3 rows */}
                    {salesOperations.length < 3 && Array.from({ length: 3 - salesOperations.length }).map((_, index) => (
                      <TableRow key={`empty-${index}`} className="h-[52px]">
                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : (
                  // Show empty state message in table
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={`sales-empty-${index}`} className="h-[52px]">
                      {index === 1 ? (
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            <span>{t("brand.dashboard.no_sales_operations")}</span>
                          </div>
                        </TableCell>
                      ) : (
                        <>
                          <TableCell>&nbsp;</TableCell>
                          <TableCell>&nbsp;</TableCell>
                          <TableCell>&nbsp;</TableCell>
                          <TableCell>&nbsp;</TableCell>
                          <TableCell>&nbsp;</TableCell>
                          <TableCell>&nbsp;</TableCell>
                        </>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
