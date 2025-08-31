"use client"

import { useState, useEffect } from "react"
import { StatCard } from "@/components/ui/stat-card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Plus, Package, TrendingUp, TrendingDown, Lock, QrCode, Search, Eye, MessageSquare, BarChart3, Banknote, ScanLine, Store, CreditCard, Clock, Star } from "lucide-react"
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
import { PaymentTransferDialog } from "@/components/dialogs/payment-transfer-dialog"
import { useMutation } from "convex/react"
import React, { useMemo } from "react"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import BrandShelvesLoading from "./loading"

export default function BrandShelvesPage() {
  const { t, direction, language } = useLanguage()
  const { isBrandDataComplete } = useBrandData()
  const router = useRouter()
  const { user, isLoading: userLoading } = useCurrentUser()
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)
  const [selectedPeriod, setSelectedPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly")
  const [currentPage, setCurrentPage] = useState(1)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedPaymentRequest, setSelectedPaymentRequest] = useState<any>(null)
  const itemsPerPage = 5
  const markNotificationsAsRead = useMutation(api.notifications.markRentalRequestNotificationsAsRead)

  // Get user ID from current user
  const userId = user?.id ? (user.id as Id<"users">) : null

  // Fetch rental requests for the brand owner
  const rentalRequests = useQuery(
    api.rentalRequests.getUserRentalRequests,
    userId ? {
      userType: "brand" as const
    } : "skip"
  )
  
  // Get all rental request IDs for notification counts
  const rentalRequestIds = useMemo(() => {
    return rentalRequests?.map(r => r._id) || []
  }, [rentalRequests])

  // Fetch notification counts for all rental requests
  const notificationCounts = useQuery(
    api.notifications.getUnreadCountByRentalRequests,
    userId && rentalRequestIds.length > 0 ? {
      rentalRequestIds: rentalRequestIds
    } : "skip"
  )

  // Calculate total unread notifications
  const totalUnreadNotifications = useMemo(() => {
    if (!notificationCounts) return 0
    return Object.values(notificationCounts).reduce((sum, count) => sum + count, 0)
  }, [notificationCounts])

  // Fetch rental statistics with percentage changes based on selected period
  const rentalStats = useQuery(
    api.rentalRequests.getRentalStatsWithChanges,
    userId ? {
      userType: "brand" as const,
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
  const acceptedRentals = allRequests.filter(r => r.status === "accepted" || r.status === "payment_pending").length
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
      case "accepted":
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
  
  const handlePaymentClick = (request: any) => {
    setSelectedPaymentRequest(request)
    setPaymentDialogOpen(true)
  }
  
  const getActionButton = (request: any) => {
    switch (request.status) {
      case "accepted":
      case "payment_pending":
        return (
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-8 w-8 p-0 relative"
                    onClick={async () => {
                      // Navigate to the shelf details page with conversation
                      if (request.conversationId && request.shelfId) {
                        router.push(`/brand-dashboard/shelves/marketplace/${request.shelfId}?conversation=${request.conversationId}`)
                      }
                      // Mark notifications as read when viewing details
                      if (userId && notificationCounts?.[request._id] && notificationCounts[request._id] > 0) {
                        await markNotificationsAsRead({
                          rentalRequestId: request._id
                        })
                      }
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    {notificationCounts && notificationCounts[request._id] > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground animate-pulse flex items-center justify-center">
                        {notificationCounts[request._id]}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("action.view_details")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm"
                    variant="default"
                    className="h-8 px-3"
                    onClick={() => handlePaymentClick(request)}
                  >
                    <CreditCard className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("action.pay_now")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )
      
      case "active":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="h-8 w-8 p-0 relative"
                  onClick={async () => {
                    // Navigate to the shelf details page with conversation
                    if (request.conversationId) {
                      router.push(`/brand-dashboard/shelves/marketplace/${request.shelfId}?conversation=${request.conversationId}`)
                    } else {
                      router.push(`/brand-dashboard/shelves/marketplace/${request.shelfId}`)
                    }
                    // Mark notifications as read when viewing details
                    if (userId && notificationCounts?.[request._id] && notificationCounts[request._id] > 0) {
                      await markNotificationsAsRead({
                        rentalRequestId: request._id
                      })
                    }
                  }}
                >
                  <Eye className="h-4 w-4" />
                  {notificationCounts && notificationCounts[request._id] > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground animate-pulse flex items-center justify-center">
                      {notificationCounts[request._id]}
                    </span>
                  )}
                </Button>
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
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="h-8 w-8 p-0 relative"
                  onClick={async () => {
                    // Navigate to the shelf details page with conversation
                    if (request.conversationId) {
                      router.push(`/brand-dashboard/shelves/marketplace/${request.shelfId}?conversation=${request.conversationId}`)
                    } else {
                      router.push(`/brand-dashboard/shelves/${request._id}`)
                    }
                    // Mark notifications as read when viewing details
                    if (userId && notificationCounts?.[request._id] && notificationCounts[request._id] > 0) {
                      await markNotificationsAsRead({
                        rentalRequestId: request._id
                      })
                    }
                  }}
                >
                  <Eye className="h-4 w-4" />
                  {notificationCounts && notificationCounts[request._id] > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground animate-pulse flex items-center justify-center">
                      {notificationCounts[request._id]}
                    </span>
                  )}
                </Button>
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
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-8 w-8 p-0 relative"
                    onClick={async () => {
                      router.push(`/brand-dashboard/shelves/${request._id}`)
                      // Mark notifications as read when viewing details
                      if (userId && notificationCounts?.[request._id] && notificationCounts[request._id] > 0) {
                        await markNotificationsAsRead({
                          rentalRequestId: request._id
                        })
                      }
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    {notificationCounts && notificationCounts[request._id] > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground animate-pulse flex items-center justify-center">
                        {notificationCounts[request._id]}
                      </span>
                    )}
                  </Button>
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
              value={0}
              trend={{
                value: 0,
                label: `${t("time.from")} ${t(`time.last_${selectedPeriod === "daily" ? "day" : selectedPeriod === "weekly" ? "week" : selectedPeriod === "yearly" ? "year" : "month"}`)}`
              }}
              icon={<QrCode className="h-5 w-5 text-primary" />}
            />

            {/* Total Sales Card */}
            <StatCard
              title={t("brand.shelves.total_sales")}
              value={language === "ar" ? `0 ${t("common.currency")}` : `${t("common.currency")} 0`}
              trend={{
                value: 0,
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
                <TableHead className="h-12 text-start font-medium w-[15%]">
                  {t("table.rental_start_date")}
                </TableHead>
                <TableHead className="h-12 text-start font-medium w-[15%]">
                  {t("table.rental_end_date")}
                </TableHead>
                <TableHead className="h-12 text-start font-medium w-[15%]">
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
                    <TableCell className="py-3 w-[15%]"><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell className="py-3 w-[15%]"><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell className="py-3 w-[15%]"><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
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
                      <TableCell className="py-3 text-muted-foreground w-[15%]">
                        {request.startDate 
                          ? format(new Date(request.startDate), "d MMM yyyy", {
                              locale: language === "ar" ? ar : enUS
                            })
                          : "-"
                        }
                      </TableCell>
                      <TableCell className="py-3 text-muted-foreground w-[15%]">
                        {request.endDate
                          ? format(new Date(request.endDate), "d MMM yyyy", {
                              locale: language === "ar" ? ar : enUS
                            })
                          : "-"
                        }
                      </TableCell>
                      <TableCell className="py-3 w-[15%]">{request.status ? getStatusBadge(request.status) : "-"}</TableCell>
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
      
      {/* Payment Transfer Dialog */}
      <PaymentTransferDialog
        request={selectedPaymentRequest}
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        onPaymentConfirmed={() => {
          // Refresh the data after payment confirmation
          router.refresh()
        }}
      />
    </div>
  )
}