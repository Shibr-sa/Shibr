"use client"

import { useState, useEffect } from "react"
import { StatCard } from "@/components/ui/stat-card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Plus, Package, TrendingUp, TrendingDown, Lock, QrCode, Search, Eye, MessageSquare, BarChart3, Banknote, ScanLine, Store, Clock, Star, AlertCircle } from "lucide-react"
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
// Removed PaymentTransferDialog - now using Tap payment gateway
import React, { useMemo } from "react"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import BrandShelvesLoading from "./loading"
import { formatCurrency } from "@/lib/formatters"

// Helper function to calculate rental months
const calculateRentalMonths = (startDate: number | undefined, endDate: number | undefined) => {
  if (!startDate || !endDate) return 0
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
  return Math.max(1, Math.ceil(daysDiff / 30))
}

export default function BrandShelvesPage() {
  const { t, direction, language } = useLanguage()
  const { isBrandDataComplete } = useBrandData()
  const router = useRouter()
  const { user, isLoading: userLoading } = useCurrentUser()
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)
  const [selectedPeriod, setSelectedPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly")
  const [currentPage, setCurrentPage] = useState(1)

  // Payment now redirects to Tap payment page instead of using dialog
  const itemsPerPage = 5

  // Get user ID from current user
  const userId = user?.id ? (user.id as Id<"users">) : null

  // Fetch rental requests for the brand owner
  const rentalRequests = useQuery(
    api.rentalRequests.getUserRentalRequests,
    userId ? {
      userType: "brand" as const
    } : "skip"
  )
  
  // Get unread message counts
  const unreadCounts = useQuery(
    api.chats.getUnreadMessageCounts,
    userId ? { userId: userId } : "skip"
  )


  // Fetch rental statistics with percentage changes based on selected period
  const rentalStats = useQuery(
    api.rentalRequests.getRentalStatsWithChanges,
    userId ? {
      userType: "brand" as const,
      period: selectedPeriod as "daily" | "weekly" | "monthly" | "yearly"
    } : "skip"
  )

  // Fetch shelf store statistics (QR scans, orders, revenue)
  const shelfStoreStats = useQuery(
    api.shelfStores.getBrandShelfStoresStats,
    userId ? {
      period: selectedPeriod as "daily" | "weekly" | "monthly" | "yearly"
    } : "skip"
  )

  // Filter rental requests based on debounced search
  const filteredRequests = rentalRequests?.filter(request => {
    const matchesSearch = !debouncedSearchQuery || 
      request.otherUserName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      request.shelfName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
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
  const acceptedRentals = allRequests.filter(r => r.status === "payment_pending").length
  const totalRentals = allRequests.length
  
  // Loading state
  const isLoading = userId && !rentalRequests
  
  // Check if search is in progress (user typed but debounce hasn't fired yet)
  const isSearching = searchQuery !== debouncedSearchQuery

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
      case "payment_pending":
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
            {t("status.payment_pending")}
          </Badge>
        )
      case "completed":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            {t("status.completed")}
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            {t("status.rejected")}
          </Badge>
        )
      case "expired":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            {t("status.expired")}
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
  const getActionButton = (request: any) => {
    switch (request.status) {
      case "payment_pending":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative inline-block">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      // Navigate to the shelf details page where payment can be made
                      router.push(`/brand-dashboard/shelves/marketplace/${request.shelfId}`)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {request.conversationId && unreadCounts?.byConversation?.[request.conversationId] && unreadCounts.byConversation[request.conversationId] > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -end-1 h-4 min-w-4 px-1 text-[10px] font-medium"
                    >
                      {unreadCounts.byConversation[request.conversationId] > 9 ? "9+" : unreadCounts.byConversation[request.conversationId]}
                    </Badge>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("action.view_details")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      
      case "active":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative inline-block">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      // Navigate to the shelf details page with conversation
                      if (request.conversationId) {
                        router.push(`/brand-dashboard/shelves/marketplace/${request.shelfId}?conversation=${request.conversationId}`)
                      } else {
                        router.push(`/brand-dashboard/shelves/marketplace/${request.shelfId}`)
                      }
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {request.conversationId && unreadCounts?.byConversation?.[request.conversationId] && unreadCounts.byConversation[request.conversationId] > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -end-1 h-4 min-w-4 px-1 text-[10px] font-medium"
                    >
                      {unreadCounts.byConversation[request.conversationId] > 9 ? "9+" : unreadCounts.byConversation[request.conversationId]}
                    </Badge>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("action.view")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      
      case "pending":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative inline-block">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      // Always go to marketplace page with conversation if exists
                      if (request.conversationId) {
                        router.push(`/brand-dashboard/shelves/marketplace/${request.shelfId}?conversation=${request.conversationId}`)
                      } else {
                        router.push(`/brand-dashboard/shelves/marketplace/${request.shelfId}`)
                      }
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {request.conversationId && unreadCounts?.byConversation?.[request.conversationId] && unreadCounts.byConversation[request.conversationId] > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -end-1 h-4 min-w-4 px-1 text-[10px] font-medium"
                    >
                      {unreadCounts.byConversation[request.conversationId] > 9 ? "9+" : unreadCounts.byConversation[request.conversationId]}
                    </Badge>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("action.view_details")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      
      case "completed":
        return (
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative inline-block">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        // Always go to marketplace page with conversation if exists
                        if (request.conversationId) {
                          router.push(`/brand-dashboard/shelves/marketplace/${request.shelfId}?conversation=${request.conversationId}`)
                        } else {
                          router.push(`/brand-dashboard/shelves/marketplace/${request.shelfId}`)
                        }
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {request.conversationId && unreadCounts?.byConversation?.[request.conversationId] && unreadCounts.byConversation[request.conversationId] > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -end-1 h-4 min-w-4 px-1 text-[10px] font-medium"
                      >
                        {unreadCounts.byConversation[request.conversationId] > 9 ? "9+" : unreadCounts.byConversation[request.conversationId]}
                      </Badge>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("action.view")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      // TODO: Implement rating dialog
                    }}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("orders.rate_store")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )
      
      case "rejected":
      case "expired":
        return (
          <span className="text-sm text-muted-foreground">
            -
          </span>
        )
      
      default:
        return null
    }
  }

  // Show full page skeleton while user is loading
  if (userLoading) {
    return <BrandShelvesLoading />
  }

  return (
    <div className="w-full space-y-6">
      {/* Profile Completion Warning */}
      {!isLoading && !isBrandDataComplete && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
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

      {/* Statistics Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{t("brand.shelves.stats_overview")}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t("brand.shelves.stats_description")}
            </p>
          </div>
          <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as "daily" | "weekly" | "monthly" | "yearly")}>
            <TabsList>
              <TabsTrigger value="daily">{t("time.daily")}</TabsTrigger>
              <TabsTrigger value="weekly">{t("time.weekly")}</TabsTrigger>
              <TabsTrigger value="monthly">{t("time.monthly")}</TabsTrigger>
              <TabsTrigger value="yearly">{t("time.yearly")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Rented Shelves Count Card */}
            <StatCard
              title={t("brand.shelves.rented_count")}
              value={rentalStats?.active ?? activeRentals}
              trend={{
                value: rentalStats?.activeChange || 0,
                label: `${t("time.from")} ${t(`time.last_${selectedPeriod === "daily" ? "day" : selectedPeriod === "weekly" ? "week" : selectedPeriod === "yearly" ? "year" : "month"}`)}`
              }}
              icon={<Store className="h-5 w-5 text-primary" />}
            />

            {/* QR Code Scans Card */}
            <StatCard
              title={t("brand.shelves.qr_scans")}
              value={shelfStoreStats?.totalScans || 0}
              trend={{
                value: shelfStoreStats?.scansChange || 0,
                label: `${t("time.from")} ${t(`time.last_${selectedPeriod === "daily" ? "day" : selectedPeriod === "weekly" ? "week" : selectedPeriod === "yearly" ? "year" : "month"}`)}`
              }}
              icon={<QrCode className="h-5 w-5 text-primary" />}
            />

            {/* Total Sales Card */}
            <StatCard
              title={t("brand.shelves.total_sales")}
              value={formatCurrency(shelfStoreStats?.totalRevenue || 0, language)}
              trend={{
                value: shelfStoreStats?.revenueChange || 0,
                label: `${t("time.from")} ${t(`time.last_${selectedPeriod === "daily" ? "day" : selectedPeriod === "weekly" ? "week" : selectedPeriod === "yearly" ? "year" : "month"}`)}`
              }}
              icon={<Banknote className="h-5 w-5 text-primary" />}
            />
        </div>
      </div>

      {/* Current Shelves Section */}
      <div className="space-y-4 w-full">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">{t("brand.current_shelves")}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t("brand.current_shelves_description")}
            </p>
          </div>
          {/* Search and Add Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 overflow-visible">
              <div className="relative flex-1 sm:flex-initial sm:w-80 max-w-full overflow-visible">
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
        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="h-12 text-start font-medium w-[20%]">
                  {t("table.store_name")}
                </TableHead>
                <TableHead className="h-12 text-start font-medium w-[15%]">
                  {t("table.city")}
                </TableHead>
                <TableHead className="h-12 text-start font-medium w-[10%]">
                  {t("table.sales_count")}
                </TableHead>
                <TableHead className="h-12 text-start font-medium w-[12%]">
                  {t("table.rental_duration")}
                </TableHead>
                <TableHead className="h-12 text-start font-medium w-[13%]">
                  {t("table.rental_start_date")}
                </TableHead>
                <TableHead className="h-12 text-start font-medium w-[13%]">
                  {t("table.rental_end_date")}
                </TableHead>
                <TableHead className="h-12 text-start font-medium w-[12%]">
                  {t("table.status")}
                </TableHead>
                <TableHead className="h-12 text-start font-medium w-[10%]">
                  {t("table.action")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || isSearching ? (
                // Loading state - show 5 skeleton rows
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`loading-${index}`} className="h-[72px]">
                    <TableCell className="py-3 w-[20%]"><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell className="py-3 w-[15%]"><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell className="py-3 w-[10%]"><Skeleton className="h-4 w-[40px]" /></TableCell>
                    <TableCell className="py-3 w-[12%]"><Skeleton className="h-4 w-[60px]" /></TableCell>
                    <TableCell className="py-3 w-[13%]"><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell className="py-3 w-[13%]"><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell className="py-3 w-[12%]"><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                    <TableCell className="py-3 w-[10%]"><Skeleton className="h-8 w-8 rounded" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedRequests.length > 0 ? (
                // Data state - show actual requests with fillers
                <>
                  {paginatedRequests.map((request) => (
                    <TableRow key={request._id} className="h-[72px]">
                      <TableCell className="py-3 font-medium w-[20%]">
                        {request.otherUserName || "-"}
                      </TableCell>
                      <TableCell className="py-3 text-muted-foreground w-[15%]">
                        {request.city || "-"}
                      </TableCell>
                      <TableCell className="py-3 text-muted-foreground w-[10%]">
                        {(request as any).salesCount !== undefined ? (request as any).salesCount : "0"}
                      </TableCell>
                      <TableCell className="py-3 text-muted-foreground w-[12%]">
                        {(() => {
                          const months = calculateRentalMonths(request.startDate, request.endDate)
                          if (language === "ar") {
                            if (months === 1) return "شهر واحد"
                            if (months === 2) return "شهرين"
                            return `${months} أشهر`
                          } else {
                            return months === 1 ? "1 month" : `${months} months`
                          }
                        })()}
                      </TableCell>
                      <TableCell className="py-3 text-muted-foreground w-[13%]">
                        {request.startDate
                          ? format(new Date(request.startDate), "d MMM yyyy", {
                              locale: language === "ar" ? ar : enUS
                            })
                          : "-"
                        }
                      </TableCell>
                      <TableCell className="py-3 text-muted-foreground w-[13%]">
                        {request.endDate
                          ? format(new Date(request.endDate), "d MMM yyyy", {
                              locale: language === "ar" ? ar : enUS
                            })
                          : "-"
                        }
                      </TableCell>
                      <TableCell className="py-3 w-[12%]">
                        {request.status ? getStatusBadge(request.status) : "-"}
                      </TableCell>
                      <TableCell className="py-3 w-[10%]">{getActionButton(request)}</TableCell>
                    </TableRow>
                  ))}
                  {/* Fill remaining rows to always show 5 rows */}
                  {paginatedRequests.length < 5 && Array.from({ length: 5 - paginatedRequests.length }).map((_, index) => (
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
                        <Store className="h-10 w-10 text-muted-foreground/40 mb-2" />
                        <h3 className="font-medium">
                          {debouncedSearchQuery ? t("brand.no_search_results") : t("brand.no_shelves_yet")}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {debouncedSearchQuery 
                            ? t("brand.try_different_search")
                            : t("brand.start_renting_shelves_description")}
                        </p>
                        {debouncedSearchQuery ? (
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
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  className="mt-4"
                                  onClick={() => {
                                    if (isBrandDataComplete) {
                                      router.push("/brand-dashboard/shelves/marketplace")
                                    }
                                  }}
                                  disabled={!isBrandDataComplete}
                                >
                                  <Plus className="h-4 w-4 me-2" />
                                  {t("brand.rent_your_first_shelf")}
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
    </div>
  )
}