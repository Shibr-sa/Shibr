"use client"

import { useState } from "react"
import { StatCard } from "@/components/ui/stat-card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

export default function BrandShelvesPage() {
  const { t, direction, language } = useLanguage()
  const { isBrandDataComplete } = useBrandData()
  const router = useRouter()
  const { user } = useCurrentUser()
  const [searchQuery, setSearchQuery] = useState("")
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
      userId: userId,
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
      userId: userId,
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
      userId: userId,
      userType: "brand" as const,
      period: selectedPeriod as "daily" | "weekly" | "monthly" | "yearly"
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
  const acceptedRentals = allRequests.filter(r => r.status === "accepted" || r.status === "payment_pending").length
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm"
                  variant="default"
                  className="h-8 w-8 p-0"
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
                    router.push(`/brand-dashboard/shelves/${request._id}`)
                    // Mark notifications as read when viewing details
                    if (userId && notificationCounts?.[request._id] && notificationCounts[request._id] > 0) {
                      await markNotificationsAsRead({
                        userId: userId,
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
                        userId: userId,
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
                          userId: userId,
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
                      console.log("Rate store:", request.otherUserName)
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
            <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as "daily" | "weekly" | "monthly" | "yearly")}>
              <TabsList>
                <TabsTrigger value="daily">{t("time.daily")}</TabsTrigger>
                <TabsTrigger value="weekly">{t("time.weekly")}</TabsTrigger>
                <TabsTrigger value="monthly">{t("time.monthly")}</TabsTrigger>
                <TabsTrigger value="yearly">{t("time.yearly")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
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
                        <TableHead className="text-start">
                          {t("table.action")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        // Loading state - show 5 skeleton rows
                        Array.from({ length: itemsPerPage }).map((_, index) => (
                          <TableRow key={`skeleton-${index}`} className="h-[72px]">
                            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-[60px] rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-[60px] rounded" /></TableCell>
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
                        <TableCell>{getActionButton(request)}</TableCell>
                      </TableRow>
                ))}
                          {/* Fill remaining rows if less than 5 items */}
                          {paginatedRequests.length < itemsPerPage && Array.from({ length: itemsPerPage - paginatedRequests.length }).map((_, index) => (
                            <TableRow key={`filler-${index}`} className="h-[72px]">
                              <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                              <TableCell><Skeleton className="h-6 w-[60px] rounded-full" /></TableCell>
                              <TableCell><Skeleton className="h-8 w-[60px] rounded" /></TableCell>
                            </TableRow>
                          ))}
                        </>
                      ) : (
                    // Empty state - show 5 empty rows with message in middle
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`empty-${index}`} className="h-[72px]">
                        {index === 2 ? (
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            <div className="flex items-center justify-center gap-2">
                              <Package className="h-5 w-5 text-muted-foreground" />
                              <span className="text-sm">
                                {searchQuery 
                                  ? t("brand.no_matching_shelves")
                                  : t("brand.no_shelves_yet")
                                }
                              </span>
                            </div>
                          </TableCell>
                        ) : (
                          <TableCell colSpan={7}>&nbsp;</TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div> {/* end overflow-x-auto */}
          </div> {/* end min-h-[432px] */}
        </div> {/* end border rounded-lg */}
        
        {/* Pagination Controls - Always visible */}
        <div className="mt-4">
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
      </div> {/* end space-y-4 */}
        </CardContent>
      </Card>
      
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