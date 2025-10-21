"use client"

import { useState, useEffect } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useLanguage } from "@/contexts/localization-context"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, Eye, Package, TrendingUp, ShoppingBag, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"

export default function BrandsPage() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Initialize state from URL params for persistence
  const [timePeriod, setTimePeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">(
    (searchParams.get("period") as "daily" | "weekly" | "monthly" | "yearly") || "monthly"
  )
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const itemsPerPage = 5
  
  // Track if we've loaded initial data
  const [hasInitialData, setHasInitialData] = useState(false)
  
  // Debounced search value
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)
  
  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("search", searchQuery)
    if (timePeriod !== "monthly") params.set("period", timePeriod)
    if (currentPage > 1) params.set("page", String(currentPage))
    
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(newUrl, { scroll: false })
  }, [searchQuery, timePeriod, currentPage, pathname, router])
  
  // Fetch stats data with time period
  const statsResult = useQuery(api.admin.getBrands, {
    searchQuery: "",
    page: 1,
    limit: 1, // We only need stats, not items
    timePeriod,
  })
  
  // Fetch brands table data with debounced search
  const brandsResult = useQuery(api.admin.getBrands, {
    searchQuery: debouncedSearchQuery,
    page: currentPage,
    limit: itemsPerPage,
    // Don't pass timePeriod for table data
  })
  
  const brands = brandsResult?.items || []
  
  // Check if search is in progress (user typed but debounce hasn't fired yet)
  const isSearching = searchQuery !== debouncedSearchQuery
  
  // Track when we have initial data
  useEffect(() => {
    if (brandsResult !== undefined && !hasInitialData) {
      setHasInitialData(true)
    }
  }, [brandsResult, hasInitialData])

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "suspended":
        return "destructive"
      default:
        return "outline"
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ${t("common.currency")}`
  }

  const totalPages = brandsResult?.totalPages || 1

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("brands.title")}</h2>
          <p className="text-muted-foreground mt-1">{t("brands.description")}</p>
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {statsResult === undefined ? (
          <>
            <Card className="bg-muted/50 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{t("brands.total_brands")}</p>
                    <Skeleton className="h-[30px] w-24 mt-1" />
                    <Skeleton className="h-[16px] w-32 mt-1" />
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{t("brands.total_products")}</p>
                    <Skeleton className="h-[30px] w-24 mt-1" />
                    <Skeleton className="h-[16px] w-32 mt-1" />
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{t("brands.total_revenue")}</p>
                    <Skeleton className="h-[30px] w-24 mt-1" />
                    <Skeleton className="h-[16px] w-32 mt-1" />
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <StatCard
              title={t("brands.total_brands")}
              value={statsResult.stats?.totalBrands || 0}
              trend={{
                value: statsResult.stats?.brandsChange || 0,
                label: timePeriod === "daily" ? t("dashboard.from_yesterday") : 
                       timePeriod === "weekly" ? t("dashboard.from_last_week") :
                       timePeriod === "yearly" ? t("dashboard.from_last_year") :
                       t("dashboard.from_last_month")
              }}
              icon={<Package className="h-6 w-6 text-primary" />}
            />
            
            <StatCard
              title={t("brands.total_products")}
              value={statsResult.stats?.totalProducts || 0}
              trend={{
                value: statsResult.stats?.productsChange || 0,
                label: timePeriod === "daily" ? t("dashboard.from_yesterday") : 
                       timePeriod === "weekly" ? t("dashboard.from_last_week") :
                       timePeriod === "yearly" ? t("dashboard.from_last_year") :
                       t("dashboard.from_last_month")
              }}
              icon={<ShoppingBag className="h-6 w-6 text-primary" />}
            />
            
            <StatCard
              title={t("brands.total_revenue")}
              value={formatCurrency(statsResult.stats?.totalRevenue || 0)}
              trend={{
                value: statsResult.stats?.revenueChange || 0,
                label: timePeriod === "daily" ? t("dashboard.from_yesterday") : 
                       timePeriod === "weekly" ? t("dashboard.from_last_week") :
                       timePeriod === "yearly" ? t("dashboard.from_last_year") :
                       t("dashboard.from_last_month")
              }}
              icon={<DollarSign className="h-6 w-6 text-primary" />}
            />
          </>
        )}
      </div>

      {/* Brands Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-xl font-semibold">{t("brands.all_brands")}</h3>
        <div className="relative w-full sm:w-80">
          <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={t("brands.search_placeholder")}
            className="pe-10"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1) // Reset to first page on search
            }}
          />
        </div>
      </div>

      {/* Brands Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="h-12 text-start font-medium">
                      {t("brands.table.brand")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium hidden lg:table-cell">
                      {t("brands.table.category")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium hidden lg:table-cell">
                      {t("brands.table.products")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium hidden lg:table-cell">
                      {t("brands.table.stores")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium hidden md:table-cell">
                      {t("brands.table.revenue")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("brands.table.status")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("dashboard.options")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!hasInitialData || brandsResult === undefined || isSearching ? (
                    // Loading state - show skeletons
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`loading-${index}`} className="h-[72px]">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-20" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 hidden lg:table-cell"><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                        <TableCell className="py-3 hidden lg:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
                        <TableCell className="py-3 hidden lg:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
                        <TableCell className="py-3 hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-8 w-8 rounded" /></TableCell>
                      </TableRow>
                    ))
                  ) : brands.length > 0 ? (
                    <>
                      {brands.map((brand, index) => (
                          <TableRow
                            key={brand.id}
                            className={`h-[72px] ${index < brands.length - 1 ? 'border-b' : ''}`}
                          >
                            <TableCell className="py-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={brand.profileImageUrl || undefined} alt={brand.name} />
                                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                    {brand.name?.charAt(0)?.toUpperCase() || "B"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{brand.name}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 hidden lg:table-cell">
                              <Badge variant="outline">{brand.category || t("brands.category.general")}</Badge>
                            </TableCell>
                            <TableCell className="py-3 text-muted-foreground hidden lg:table-cell">{brand.products}</TableCell>
                            <TableCell className="py-3 text-muted-foreground hidden lg:table-cell">{brand.stores}</TableCell>
                            <TableCell className="py-3 font-medium hidden md:table-cell">{formatCurrency(brand.revenue)}</TableCell>
                            <TableCell className="py-3">
                              <Badge variant={getStatusVariant(brand.status)} className="font-normal">
                                {t(`brands.status.${brand.status}`)}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => router.push(`/admin-dashboard/brands/${brand.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                      ))}
                      {/* Fill remaining rows to always show 5 rows */}
                      {brands.length < 5 && Array.from({ length: 5 - brands.length }).map((_, index) => (
                        <TableRow key={`filler-${index}`} className="h-[72px]">
                          <TableCell className="py-3" colSpan={7}></TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : (
                    // Empty state - centered view with fixed height
                    <TableRow>
                      <TableCell colSpan={7} className="h-[360px] text-center">
                        <div className="flex h-full w-full items-center justify-center">
                          <div className="flex flex-col items-center gap-1 py-10">
                            <Package className="h-10 w-10 text-muted-foreground/40 mb-2" />
                            <h3 className="font-medium">
                              {searchQuery ? t("brands.no_results") : t("brands.no_brands")}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {searchQuery ? t("brands.try_different_search") : t("brands.brands_will_appear_here")}
                            </p>
                            {searchQuery && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="mt-4"
                                onClick={() => {
                                  setSearchQuery("")
                                  setCurrentPage(1)
                                }}
                              >
                                {t("common.clear_search")}
                              </Button>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className={cn(
                    "cursor-pointer",
                    (currentPage === 1 || totalPages === 0) && "pointer-events-none opacity-50"
                  )}
                  aria-disabled={currentPage === 1 || totalPages === 0}
                >
                  {t("common.previous")}
                </PaginationPrevious>
              </PaginationItem>
              
              {totalPages > 0 ? (
                Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return page;
                }).map(page => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))
              ) : (
                <PaginationItem>
                  <PaginationLink isActive className="pointer-events-none">
                    1
                  </PaginationLink>
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className={cn(
                    "cursor-pointer",
                    (currentPage === totalPages || totalPages <= 1) && "pointer-events-none opacity-50"
                  )}
                  aria-disabled={currentPage === totalPages || totalPages <= 1}
                >
                  {t("common.next")}
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>

    </div>
  )
}