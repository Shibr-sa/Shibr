"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Id } from "@/convex/_generated/dataModel"
import { formatCurrency, formatNumber, formatDate } from "@/lib/formatters"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import BrandDashboardLoading from "./loading"

export default function BrandDashboardPage() {
  const { t, direction, language } = useLanguage()
  const router = useRouter()
  const { user, isLoading: userLoading } = useCurrentUser()
  const [activeTab, setActiveTab] = useState("shelves")
  
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
  
  // Fetch unified dashboard statistics (products + shelf stores)
  const dashboardStats = useQuery(
    api.products.getBrandDashboardStats,
    { period: "monthly" as const }
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
  const totalRevenue = dashboardStats?.totalRevenue || 0
  const totalSales = dashboardStats?.totalSales || 0
  
  // Calculate products on shelves (products from active rentals)
  const productsOnShelves = rentalRequests?.filter(r => r.status === "active")
    .reduce((total, rental) => {
      // Count selected products from the new structure
      if (rental.selectedProducts && rental.selectedProducts.length > 0) {
        return total + rental.selectedProducts.length
      }
      return total
    }, 0) || 0
  
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

  // Show loading skeleton while user is loading
  if (userLoading) {
    return <BrandDashboardLoading />
  }

  return (
    <div className="space-y-6">
      {/* Data Completion Warning - Only show if data is incomplete */}
      {isBrandDataComplete === false && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t("dashboard.incomplete_profile_warning")}</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{t("dashboard.complete_profile_first")}</span>
            <Button
              variant="outline"
              size="sm"
              className="ms-4"
              onClick={() => router.push("/brand-dashboard/settings")}
            >
              {t("dashboard.complete_profile_now")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("brand.dashboard.welcome_to_shelfy")}</h1>
          <p className="text-muted-foreground mt-1">
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

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {!rentalRequests || !rentalStats ? (
          // Loading skeleton for first stat card
          <div className="rounded-lg border bg-card">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-8 w-20 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
            </div>
          </div>
        ) : (
          <StatCard
            title={t("brand.dashboard.rented_shelves_count")}
            value={activeRentals.length}
            trend={{
              value: rentalStats?.activeChange || 0,
              label: `${t("time.from")} ${t("time.last_month")}`
            }}
            icon={<Store className="h-6 w-6 text-primary" />}
          />
        )}
        
        {!dashboardStats ? (
          // Loading skeleton for second stat card
          <div className="rounded-lg border bg-card">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-8 w-20 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
            </div>
          </div>
        ) : (
          <StatCard
            title={t("brand.dashboard.total_sales")}
            value={formatCurrency(totalRevenue, language)}
            trend={{
              value: dashboardStats?.revenueChange || 0,
              label: `${t("time.from")} ${t("time.last_month")}`
            }}
            icon={<TrendingUp className="h-6 w-6 text-primary" />}
          />
        )}

        {!products || !dashboardStats ? (
          // Loading skeleton for third stat card
          <div className="rounded-lg border bg-card">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-8 w-20 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
            </div>
          </div>
        ) : (
          <StatCard
            title={t("brand.dashboard.total_products")}
            value={productsOnShelves}
            trend={{
              value: dashboardStats?.productsChange || 0,
              label: `${t("time.from")} ${t("time.last_month")}`
            }}
            icon={<Package className="h-6 w-6 text-primary" />}
          />
        )}
      </div>

      {/* Sales Chart Section */}
      <div className="rounded-md border">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">{t("brand.dashboard.sales")}</h2>
          {salesChartDataRaw === undefined ? (
            // Loading state for chart
            <div className="h-[200px] sm:h-[280px] flex items-center justify-center">
              <div className="space-y-3 w-full">
                <Skeleton className="h-[200px] w-full" />
                <div className="flex gap-2 justify-center">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-2 w-8" />
                  ))}
                </div>
              </div>
            </div>
          ) : salesChartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
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
              <div className="flex flex-col items-center justify-center text-center h-[200px] sm:h-[280px]">
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
        </div>
      </div>

      {/* Tabs Section for Tables */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tab Header with See More Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto">
            <TabsTrigger value="shelves">{t("brand.dashboard.rented_shelves_tab")}</TabsTrigger>
            <TabsTrigger value="sales">{t("brand.dashboard.sales_operations_tab")}</TabsTrigger>
          </TabsList>
          
          {isBrandDataComplete ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={activeTab === "shelves" ? "/brand-dashboard/shelves" : "/brand-dashboard/products?tab=sales"}>
                {t("brand.dashboard.see_more")}
              </Link>
            </Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button variant="outline" size="sm" disabled>
                      <Lock className="h-3 w-3 me-2" />
                      {t("brand.dashboard.see_more")}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("brand.dashboard.complete_profile_to_enable")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Rented Shelves Tab */}
        <TabsContent value="shelves" className="mt-6">
          <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-start">{t("table.store_name")}</TableHead>
                    <TableHead className="text-start hidden md:table-cell">{t("table.city")}</TableHead>
                    <TableHead className="text-start hidden lg:table-cell">{t("table.product_count")}</TableHead>
                    <TableHead className="text-start hidden lg:table-cell">{t("table.sales_count")}</TableHead>
                    <TableHead className="text-start">{t("brand.dashboard.table.rental_status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!rentalRequests ? (
                    // Loading state - show 3 skeleton rows
                    Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={`rental-loading-${index}`} className="h-[52px]">
                        <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[80px]" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-[40px]" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-[40px]" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : activeRentals.length > 0 ? (
                    <>
                      {activeRentals.map((rental, index) => (
                        <TableRow key={`${rental._id}-${index}`} className="h-[52px]">
                          <TableCell className="font-medium">
                            {rental.otherUserName || "-"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {(rental as any).shelfCity || rental.city || t("common.riyadh")}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {formatNumber(
                              rental.selectedProducts?.length || 0
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {formatNumber((rental as any).salesCount || 0)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={rental.status === "active" ? "default" : "secondary"}>
                              {t(`stores.rental_status.${rental.status}`) || t("common.unknown")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Add empty rows to maintain 3 rows */}
                      {activeRentals.length < 3 && Array.from({ length: 3 - activeRentals.length }).map((_, index) => (
                        <TableRow key={`empty-${index}`} className="h-[52px]">
                          <TableCell colSpan={5}>&nbsp;</TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : (
                    // Empty state - centered view with fixed height for 3 rows
                    <TableRow>
                      <TableCell colSpan={5} className="h-[156px] text-center">
                        <div className="flex h-full w-full items-center justify-center">
                          <div className="flex flex-col items-center gap-1 py-10">
                            <Layers className="h-10 w-10 text-muted-foreground/40 mb-2" />
                            <h3 className="font-medium">
                              {t("brand.dashboard.no_shelves_currently")}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {t("brand.dashboard.rented_shelves_description")}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
          </div>
        </TabsContent>

        {/* Sales Operations Tab */}
        <TabsContent value="sales" className="mt-6">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-start">{t("table.order_number")}</TableHead>
                  <TableHead className="text-start">{t("table.product_name")}</TableHead>
                  <TableHead className="text-start hidden md:table-cell">{t("table.store_name")}</TableHead>
                  <TableHead className="text-start hidden lg:table-cell">{t("table.city")}</TableHead>
                  <TableHead className="text-start">{t("table.price")}</TableHead>
                  <TableHead className="text-start hidden lg:table-cell">{t("table.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!salesOperations ? (
                  // Loading state - show 3 skeleton rows
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={`sales-loading-${index}`} className="h-[52px]">
                      <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-[60px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-[70px]" /></TableCell>
                    </TableRow>
                  ))
                ) : salesOperations.length > 0 ? (
                  <>
                    {/* Show only first 3 sales operations */}
                    {salesOperations.slice(0, 3).map((sale, index) => (
                      <TableRow key={`${sale.invoiceNumber}-${index}`} className="h-[52px]">
                        <TableCell className="font-medium">
                          {sale.invoiceNumber.startsWith('PENDING')
                            ? t("common.processing")
                            : sale.invoiceNumber
                          }
                        </TableCell>
                        <TableCell>
                          {sale.productName}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {sale.storeName}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {sale.city}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(sale.price, language)}
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden lg:table-cell">
                          {formatDate(sale.date, language)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Add empty rows to maintain exactly 3 rows */}
                    {salesOperations.length < 3 && Array.from({ length: 3 - salesOperations.length }).map((_, index) => (
                      <TableRow key={`empty-${index}`} className="h-[52px]">
                        <TableCell colSpan={6}>&nbsp;</TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : (
                  // Empty state - centered view with fixed height for 3 rows
                  <TableRow>
                    <TableCell colSpan={6} className="h-[156px] text-center">
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="flex flex-col items-center gap-1 py-10">
                          <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mb-2" />
                          <h3 className="font-medium">
                            {t("brand.dashboard.no_sales_operations")}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {t("brand.dashboard.sales_operations_description")}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
