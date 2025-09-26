"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  Eye,
  Star,
  Package,
  QrCode
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useLanguage } from "@/contexts/localization-context"
import { useStoreData } from "@/contexts/store-data-context"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useRouter } from "next/navigation"
import { formatDate, formatDuration } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"

export default function StoreDashboardOrdersPage() {
  const { t, direction, language } = useLanguage()
  const { user } = useCurrentUser()
  const router = useRouter()
  const { isLoading: storeLoading, isStoreDataComplete } = useStoreData()
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [hasInitialData, setHasInitialData] = useState(false)
  const itemsPerPage = 5
  
  // Debounced search value for better performance
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)

  // Get the userId as a Convex Id
  const userId = user?.id ? (user.id as Id<"users">) : null

  // Fetch rental requests for the store owner
  const rentalRequests = useQuery(
    api.rentalRequests.getUserRentalRequests,
    userId ? {
      userType: "store" as const
    } : "skip"
  )
  
  // Get unread message counts
  const unreadCounts = useQuery(
    api.chats.getUnreadMessageCounts,
    userId ? { userId: userId } : "skip"
  )


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

  // Filter rental requests based on selected filter and debounced search query
  const filteredRequests = useMemo(() => {
    return rentalRequests?.filter(request => {
      const matchesFilter = filter === "all" || request.status === filter
      const matchesSearch = !debouncedSearchQuery || 
        request.otherUserName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        request.shelfBranch?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      return matchesFilter && matchesSearch
    }) || []
  }, [rentalRequests, filter, debouncedSearchQuery])

  // Calculate pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedRequests = useMemo(() => 
    filteredRequests.slice(startIndex, endIndex),
    [filteredRequests, startIndex, endIndex]
  )

  // Track initial data load
  useEffect(() => {
    if (rentalRequests !== undefined && !hasInitialData) {
      setHasInitialData(true)
    }
  }, [rentalRequests, hasInitialData])

  // Check if search is in progress (user typed but debounce hasn't fired yet)
  const isSearching = searchQuery !== debouncedSearchQuery

  // Reset to page 1 when filter or debounced search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, debouncedSearchQuery])

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
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h2 className="text-xl font-semibold">
          {t("store.incoming_requests")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("store.incoming_requests_description")}
        </p>
      </div>

      {/* Profile Completion Warning */}
      {!storeLoading && !isStoreDataComplete && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("dashboard.incomplete_profile_warning")}</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{t("dashboard.complete_profile_first")}</span>
            <Button
              variant="outline"
              size="sm"
              className="ms-4"
              onClick={() => router.push("/store-dashboard/settings")}
            >
              {t("dashboard.complete_profile_now")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
        <div className="relative w-80 ms-auto">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t("orders.search_placeholder")}
            className="ps-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Warning Alert - Only show when there are orders */}
      {paginatedRequests.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t("store.cancellation_notice")}
          </AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="h-12 text-start font-medium">{t("table.store")}</TableHead>
              <TableHead className="h-12 text-start font-medium">{t("table.branch")}</TableHead>
              <TableHead className="h-12 text-start font-medium">{t("table.rental_duration")}</TableHead>
              <TableHead className="h-12 text-start font-medium">{t("table.status")}</TableHead>
              <TableHead className="h-12 text-start font-medium">{t("table.request_date")}</TableHead>
              <TableHead className="h-12 text-start font-medium">{t("table.options")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!hasInitialData || rentalRequests === undefined || isSearching ? (
              // Loading state - show skeletons
              Array.from({ length: itemsPerPage }).map((_, index) => (
                <TableRow key={`loading-${index}`} className="h-[72px]">
                  <TableCell className="py-3"><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="py-3"><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="py-3"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="py-3"><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell className="py-3"><Skeleton className="h-8 w-8 rounded" /></TableCell>
                </TableRow>
              ))
            ) : paginatedRequests.length > 0 ? (
              // Data state - show requests with empty row fillers
              <>
                {paginatedRequests.map((request) => (
                  <TableRow key={request._id} className="h-[72px]">
                    <TableCell className="py-3 font-medium">
                      {request.otherUserName}
                    </TableCell>
                    <TableCell className="py-3">
                      {request.shelfBranch || t("common.jeddah")}
                    </TableCell>
                    <TableCell className="py-3">
                      {calculateDuration(request.startDate, request.endDate)}
                    </TableCell>
                    <TableCell className="py-3">
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell className="py-3">
                      {formatDate(request._creationTime, language, 'long')}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="relative inline-block">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    router.push(`/store-dashboard/orders/${request._id}`)
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
                              <p>{t("orders.view_details")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {request.status === "completed" && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    // TODO: Implement rating dialog
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
                {/* Fill remaining rows to always show 5 rows */}
                {paginatedRequests.length < itemsPerPage && Array.from({ length: itemsPerPage - paginatedRequests.length }).map((_, index) => (
                  <TableRow key={`filler-${index}`} className="h-[72px]">
                    <TableCell className="py-3" colSpan={6}></TableCell>
                  </TableRow>
                ))}
              </>
            ) : (
              // Empty state - centered view with fixed height
              <TableRow>
                <TableCell colSpan={6} className="h-[360px] text-center">
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="flex flex-col items-center gap-1 py-10">
                      <Package className="h-10 w-10 text-muted-foreground/40 mb-2" />
                      <h3 className="font-medium">
                        {searchQuery || filter !== "all" ? t("store.no_matching_requests") : t("store.no_requests_yet")}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {searchQuery || filter !== "all" ? t("store.try_different_search") : t("store.requests_will_appear_here")}
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

      {/* Pagination */}
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
            />
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
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}