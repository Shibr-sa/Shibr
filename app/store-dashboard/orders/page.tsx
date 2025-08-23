"use client"

import React, { useState, Suspense, useCallback, useMemo } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Search, 
  AlertCircle, 
  Inbox,
  FileSearch,
  Eye,
  Star,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useLanguage } from "@/contexts/localization-context"
import { useStoreData } from "@/contexts/store-data-context"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useRouter, usePathname } from "next/navigation"
import { formatDate, formatDuration } from "@/lib/formatters"
import { cn } from "@/lib/utils"

function OrdersContent() {
  const { t, direction, language } = useLanguage()
  const { user } = useCurrentUser()
  const router = useRouter()
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const markNotificationsAsRead = useMutation(api.notifications.markRentalRequestNotificationsAsRead)

  // Get the userId as a Convex Id
  const userId = user?.id ? (user.id as Id<"users">) : null

  // Fetch rental requests for the store owner
  const rentalRequests = useQuery(
    api.rentalRequests.getUserRentalRequests,
    userId ? {
      userType: "store" as const
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

  // Filter options for orders section
  const ordersFilterOptions = [
    { value: "all", label: t("orders.all") },
    { value: "pending", label: t("orders.under_review") },
    { value: "active", label: t("orders.accepted") },
    { value: "completed", label: t("orders.completed") },
    { value: "rejected", label: t("orders.rejected") },
    { value: "expired", label: t("orders.expired") }
  ]
  
  // Reverse for RTL to show "All" first from the right
  const orderedOrdersFilters = direction === "rtl" ? [...ordersFilterOptions].reverse() : ordersFilterOptions

  // Filter rental requests based on selected filter and search query
  const filteredRequests = useMemo(() => {
    return rentalRequests?.filter(request => {
      const matchesFilter = filter === "all" || request.status === filter
      const matchesSearch = !searchQuery || 
        request.otherUserName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.shelfBranch?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesFilter && matchesSearch
    }) || []
  }, [rentalRequests, filter, searchQuery])

  // Calculate pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedRequests = useMemo(() => 
    filteredRequests.slice(startIndex, endIndex),
    [filteredRequests, startIndex, endIndex]
  )

  // Reset to page 1 when filter or search changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [filter, searchQuery])

  // Force refresh notification counts when returning to this page
  React.useEffect(() => {
    const handleFocus = () => {
      // Convex queries are reactive, they should auto-update
      // This is just to ensure the UI refreshes
      console.log("Page focused, notifications should auto-update")
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

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

  const calculateDuration = (startDate: string, endDate: string) => {
    return formatDuration(startDate, endDate, language)
  }

  if (!userId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t("orders.login_to_view")}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {t("store.incoming_requests")}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("store.incoming_requests_description")}
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          {/* Filter Pills */}
          <RadioGroup value={filter} onValueChange={setFilter} className="flex items-center gap-4">
            {orderedOrdersFilters.map((option) => (
              <div key={option.value} className="flex items-center gap-2">
                <RadioGroupItem 
                  value={option.value} 
                  id={`orders-${option.value}`} 
                  className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                />
                <Label htmlFor={`orders-${option.value}`} className="cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {/* Search */}
          <div className="relative w-full sm:w-80 ms-auto">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={t("orders.search_placeholder")}
              className="ps-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Warning Alert */}
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t("store.cancellation_notice")}
          </AlertDescription>
        </Alert>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-start">{t("table.store")}</TableHead>
                  <TableHead className="text-start">{t("table.branch")}</TableHead>
                  <TableHead className="text-start">{t("table.rental_duration")}</TableHead>
                  <TableHead className="text-start">{t("table.status")}</TableHead>
                  <TableHead className="text-start">{t("table.request_date")}</TableHead>
                  <TableHead className="text-start">{t("table.options")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRequests.length === 0 && currentPage === 1 ? (
                  // Show empty state only on first page with no data
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <TableRow key={`empty-${index}`} className="h-[72px]">
                      {index === 2 ? (
                        <TableCell colSpan={6} className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {searchQuery || filter !== "all" ? (
                              <FileSearch className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <Inbox className="h-5 w-5 text-muted-foreground" />
                            )}
                            <p className="text-sm text-muted-foreground">
                              {searchQuery || filter !== "all" 
                                ? t("store.no_matching_requests")
                                : t("store.no_requests_yet")
                              }
                            </p>
                          </div>
                        </TableCell>
                      ) : (
                        <TableCell colSpan={6}>&nbsp;</TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <>
                    {paginatedRequests.map((request) => (
                      <TableRow key={request._id} className="h-[72px]">
                        <TableCell className="font-medium">
                          {request.otherUserName}
                        </TableCell>
                        <TableCell>
                          {request.shelfBranch || t("common.jeddah")}
                        </TableCell>
                        <TableCell>
                          {calculateDuration(request.startDate, request.endDate)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(request.status)}
                        </TableCell>
                        <TableCell>
                          {formatDate(request.createdAt, language, 'long')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 relative"
                                    onClick={() => {
                                      router.push(`/store-dashboard/orders/${request._id}`)
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
                                  <p>{t("orders.view_details")}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {request.status === "completed" && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                      onClick={() => {
                                        // TODO: Implement rating dialog
                                        console.log("Rate brand:", request.otherUserName)
                                      }}
                                    >
                                      <Star className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{t("orders.rate_brand")}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Add empty rows to maintain fixed height */}
                    {(() => {
                      const emptyRows = itemsPerPage - paginatedRequests.length
                      return emptyRows > 0 && Array.from({ length: emptyRows }).map((_, index) => (
                        <TableRow key={`empty-${index}`} className="h-[72px]">
                          <TableCell className="py-3"><Skeleton className="h-4 w-[100px]" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-[80px]" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-[120px]" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-[100px]" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-8 w-8 rounded" /></TableCell>
                        </TableRow>
                      ))
                    })()}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-end mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={(e) => {
                    e.preventDefault()
                    setCurrentPage(prev => Math.max(1, prev - 1))
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map(page => {
                // Show first page, last page, current page, and pages around current
                const showPage = 
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                
                // Show ellipsis after first page if there's a gap
                const showEllipsisBefore = page === currentPage - 1 && currentPage > 3
                
                // Show ellipsis before last page if there's a gap  
                const showEllipsisAfter = page === currentPage + 1 && currentPage < totalPages - 2
                
                if (!showPage && !showEllipsisBefore && !showEllipsisAfter) return null
                
                return (
                  <React.Fragment key={page}>
                    {showEllipsisBefore && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    {showPage && (
                      <PaginationItem>
                        <PaginationLink
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage(page)
                          }}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )}
                    {showEllipsisAfter && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                  </React.Fragment>
                )
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={(e) => {
                    e.preventDefault()
                    setCurrentPage(prev => Math.min(Math.max(1, totalPages), prev + 1))
                  }}
                  className={currentPage === totalPages || totalPages <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>

    </>
  )
}

export default function StoreDashboardOrdersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <OrdersContent />
    </Suspense>
  )
}