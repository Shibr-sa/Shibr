"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Package, TrendingUp, TrendingDown, Lock, QrCode, Search, Eye, MessageSquare, BarChart3, Banknote, ScanLine, Store, ChevronLeft, ChevronRight } from "lucide-react"
import { useLanguage } from "@/contexts/localization-context"
import { useBrandData } from "@/contexts/brand-data-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useCurrentUser } from "@/hooks/use-current-user"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { cn } from "@/lib/utils"

export default function BrandShelvesPage() {
  const { t, direction, language } = useLanguage()
  const { isBrandDataComplete } = useBrandData()
  const router = useRouter()
  const { user } = useCurrentUser()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Get user ID from current user
  const userId = user?.id ? (user.id as Id<"users">) : null

  // Fetch rental requests for the brand owner
  const rentalRequests = useQuery(
    api.rentalRequests.getUserRentalRequests,
    userId ? {
      userId: userId,
      userType: "brand" as const
    } : "skip"
  )

  // Fetch rental statistics with percentage changes based on selected period
  const rentalStats = useQuery(
    api.rentalRequests.getRentalStatsWithChanges,
    userId ? {
      userId: userId,
      userType: "brand" as const,
      period: selectedPeriod === "daily" ? "weekly" : selectedPeriod as "weekly" | "monthly" | "yearly"
    } : "skip"
  )

  // Filter rental requests based on search
  const filteredRequests = rentalRequests?.filter(request => {
    const matchesSearch = !searchQuery || 
      request.otherUserName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.shelfName?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  }) || []

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex)

  // Calculate statistics from all requests (not filtered)
  const allRequests = rentalRequests || []
  const activeRentals = allRequests.filter(r => r.status === "active").length
  const pendingRentals = allRequests.filter(r => r.status === "pending").length
  const totalRentals = allRequests.length
  
  // Loading state
  const isLoading = userId && !rentalRequests

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            {t("status.active")}
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            {t("status.pending")}
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            {t("status.rejected")}
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        )
    }
  }

  return (
    <div className="w-full space-y-6 overflow-hidden">
      {/* Statistics Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-semibold">{t("brand.shelves.stats_overview")}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t("brand.shelves.stats_description")}
              </p>
            </div>
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={selectedPeriod === "daily" ? "default" : "ghost"}
                size="sm"
                className="h-8 px-3"
                onClick={() => setSelectedPeriod("daily")}
              >
                {t("time.daily")}
              </Button>
              <Button
                variant={selectedPeriod === "weekly" ? "default" : "ghost"}
                size="sm"
                className="h-8 px-3"
                onClick={() => setSelectedPeriod("weekly")}
              >
                {t("time.weekly")}
              </Button>
              <Button
                variant={selectedPeriod === "monthly" ? "default" : "ghost"}
                size="sm"
                className="h-8 px-3"
                onClick={() => setSelectedPeriod("monthly")}
              >
                {t("time.monthly")}
              </Button>
              <Button
                variant={selectedPeriod === "yearly" ? "default" : "ghost"}
                size="sm"
                className="h-8 px-3"
                onClick={() => setSelectedPeriod("yearly")}
              >
                {t("time.yearly")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Rented Shelves Count Card */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t("brand.shelves.rented_count")}
                  </p>
                  <div className="text-3xl font-bold">
                    {rentalStats?.active ?? activeRentals}
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
                          {rentalStats.activeChange > 0 ? '+' : ''}{rentalStats.activeChange.toFixed(1)}% {t("time.from")} {t(`time.last_${selectedPeriod === "daily" ? "week" : selectedPeriod === "weekly" ? "week" : selectedPeriod === "yearly" ? "year" : "month"}`)}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        0.0% {t("time.from")} {t(`time.last_${selectedPeriod === "daily" ? "week" : selectedPeriod === "weekly" ? "week" : selectedPeriod === "yearly" ? "year" : "month"}`)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Store className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>

            {/* QR Code Scans Card */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t("brand.shelves.qr_scans")}
                  </p>
                  <div className="text-3xl font-bold">
                    0
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-muted-foreground">
                      0.0% {t("time.from")} {t(`time.last_${selectedPeriod === "daily" ? "week" : selectedPeriod === "weekly" ? "week" : selectedPeriod === "yearly" ? "year" : "month"}`)}
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <QrCode className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>

            {/* Total Sales Card */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t("brand.shelves.total_sales")}
                  </p>
                  <div className="text-3xl font-bold text-primary">
                    {language === "ar" 
                      ? `0 ${t("common.currency")}`
                      : `${t("common.currency")} 0`
                    }
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-muted-foreground">
                      0.0% {t("time.from")} {t(`time.last_${selectedPeriod === "daily" ? "week" : selectedPeriod === "weekly" ? "week" : selectedPeriod === "yearly" ? "year" : "month"}`)}
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Banknote className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Shelves Section */}
      <Card className="w-full overflow-hidden">
        <CardHeader className="pb-4">
          <div className="space-y-4">
            <div>
              <CardTitle className="text-xl font-semibold">{t("brand.current_shelves")}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t("brand.current_shelves_description")}
              </p>
            </div>
            {/* Search and Add Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 sm:flex-initial sm:w-80 max-w-full">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("ui.search_placeholder")}
                  className="ps-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="sm:ms-auto">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => {
                          if (isBrandDataComplete) {
                            router.push("/brand-dashboard/shelves/marketplace")
                          }
                        }}
                        disabled={!isBrandDataComplete}
                        className="w-full sm:w-auto"
                      >
                        <Plus className="h-4 w-4 me-2" />
                        {t("ui.rent_new_shelf")}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {!isBrandDataComplete && (
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          <span>{t("ui.complete_data_first")}</span>
                        </div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-4 pb-4 sm:px-6 sm:pb-6">
          {/* Table */}
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-h-[432px]"> {/* Fixed height for 5 rows + header */}
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-start">
                          {t("table.store_name")}
                        </TableHead>
                        <TableHead className="text-start">
                          {t("table.city")}
                        </TableHead>
                        <TableHead className="text-start">
                          {t("table.sales_count")}
                        </TableHead>
                        <TableHead className="text-start">
                          {t("table.rental_start_date")}
                        </TableHead>
                        <TableHead className="text-start">
                          {t("table.rental_end_date")}
                        </TableHead>
                        <TableHead className="text-start">
                          {t("table.status")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        // Loading state - show 5 skeleton rows
                        Array.from({ length: itemsPerPage }).map((_, index) => (
                          <TableRow key={`skeleton-${index}`} className="h-[72px]">
                            <TableCell colSpan={6} className="text-center">
                              <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : paginatedRequests.length > 0 ? (
                        // Show paginated requests
                        <>
                          {paginatedRequests.map((request) => (
                      <TableRow key={request._id} className="h-[72px]">
                        <TableCell className="font-medium">
                          {request.otherUserName || "-"}
                        </TableCell>
                        <TableCell>
                          {request.city || "-"}
                        </TableCell>
                        <TableCell>
                          {request.salesCount !== undefined ? request.salesCount : "-"}
                        </TableCell>
                        <TableCell>
                          {request.startDate 
                            ? format(new Date(request.startDate), "d MMM yyyy", {
                                locale: language === "ar" ? ar : enUS
                              })
                            : "-"
                          }
                        </TableCell>
                        <TableCell>
                          {request.endDate
                            ? format(new Date(request.endDate), "d MMM yyyy", {
                                locale: language === "ar" ? ar : enUS
                              })
                            : "-"
                          }
                        </TableCell>
                        <TableCell>{request.status ? getStatusBadge(request.status) : "-"}</TableCell>
                      </TableRow>
                ))}
                          {/* Fill remaining rows if less than 5 items */}
                          {paginatedRequests.length < itemsPerPage && Array.from({ length: itemsPerPage - paginatedRequests.length }).map((_, index) => (
                            <TableRow key={`filler-${index}`} className="h-[72px]">
                              <TableCell colSpan={6}>&nbsp;</TableCell>
                            </TableRow>
                          ))}
                        </>
                      ) : (
                    // Empty state - show 5 empty rows with message in middle
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`empty-${index}`} className="h-[72px]">
                        {index === 2 ? (
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Package className="h-8 w-8 text-muted-foreground" />
                              <span className="text-sm">
                                {searchQuery 
                                  ? t("brand.no_matching_shelves")
                                  : t("brand.no_shelves_yet")
                                }
                              </span>
                              {!searchQuery && isBrandDataComplete && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-2"
                                  onClick={() => router.push("/brand-dashboard/shelves/marketplace")}
                                >
                                  <Plus className="h-4 w-4 me-2" />
                                  {t("brand.rent_first_shelf")}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        ) : (
                          <TableCell colSpan={6}>&nbsp;</TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div> {/* end overflow-x-auto */}
          </div> {/* end min-h-[432px] */}
        </div> {/* end border rounded-lg */}
        
        {/* Pagination Controls */}
        {filteredRequests.length > itemsPerPage && (
          <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                {language === "ar" 
                  ? `عرض ${startIndex + 1}-${Math.min(endIndex, filteredRequests.length)} من ${filteredRequests.length}`
                  : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredRequests.length)} of ${filteredRequests.length}`
                }
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3"
                >
                  <ChevronLeft className="h-4 w-4 rtl:rotate-180 me-1" />
                  {t("common.previous")}
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="h-8 w-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3"
                >
                  {t("common.next")}
                  <ChevronRight className="h-4 w-4 rtl:rotate-180 ms-1" />
                </Button>
            </div>
          </div>
        )}
      </div> {/* end space-y-4 */}
        </CardContent>
      </Card>
    </div>
  )
}