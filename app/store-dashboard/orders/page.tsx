"use client"

import React, { useState, Suspense, useCallback, useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RequestDetailsDialog, type RentalRequestDetails } from "@/components/dialogs/request-details-dialog"
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
import { useLanguage } from "@/contexts/localization-context"
import { useStoreData } from "@/contexts/store-data-context"
import { useCurrentUser } from "@/hooks/use-current-user"
import { formatDate, formatDuration } from "@/lib/formatters"
import { cn } from "@/lib/utils"

function OrdersContent() {
  const { t, direction, language } = useLanguage()
  const { user } = useCurrentUser()
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<RentalRequestDetails | null>(null)
  const itemsPerPage = 5

  // Get the userId as a Convex Id
  const userId = user?.id ? (user.id as Id<"users">) : null

  // Fetch rental requests for the store owner
  const rentalRequests = useQuery(
    api.rentalRequests.getUserRentalRequests,
    userId ? {
      userId: userId,
      userType: "store" as const
    } : "skip"
  )

  // Filter options for orders section
  const ordersFilterOptions = [
    { value: "all", label: t("orders.all") },
    { value: "pending", label: t("orders.under_review") },
    { value: "active", label: t("orders.accepted") },
    { value: "rejected", label: t("orders.rejected") }
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

  const getStatusBadge = (status: string) => {
    switch (status) {
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
      case "payment_processing":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            {t("status.payment_processing")}
          </Badge>
        )
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            {t("status.active")}
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
          <h1 className="text-2xl font-bold mb-2">
            {t("store.incoming_requests")}
          </h1>
          <p className="text-muted-foreground">
            {t("store.incoming_requests_description")}
          </p>
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
                  <TableHead className="text-start">{t("table.rating")}</TableHead>
                  <TableHead className="text-start">{t("table.options")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRequests.length === 0 && currentPage === 1 ? (
                  // Show empty state only on first page with no data
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <TableRow key={`empty-${index}`} className="h-[72px]">
                      {index === 2 ? (
                        <TableCell colSpan={7} className="text-center">
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
                        <TableCell colSpan={7}>&nbsp;</TableCell>
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
                          <div className="flex items-center gap-1">
                            <span className="text-sm">4/5</span>
                            <div className="flex">
                              {[1, 2, 3, 4].map((star) => (
                                <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              ))}
                              <Star className="h-3 w-3 text-gray-300" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                            title={t("orders.view_details")}
                            onClick={() => {
                              setSelectedRequest(request)
                              setShowDetailsDialog(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Add empty rows to maintain fixed height */}
                    {(() => {
                      const emptyRows = itemsPerPage - paginatedRequests.length
                      return emptyRows > 0 && Array.from({ length: emptyRows }).map((_, index) => (
                        <TableRow key={`empty-${index}`} className="h-[72px]">
                          <TableCell colSpan={7}>&nbsp;</TableCell>
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
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            {language === "ar" 
              ? `عرض ${paginatedRequests.length} من ${filteredRequests.length} طلب`
              : `Showing ${paginatedRequests.length} of ${filteredRequests.length} requests`}
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map(page => (
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
              size="icon"
              onClick={() => setCurrentPage(prev => Math.min(Math.max(1, totalPages), prev + 1))}
              disabled={currentPage === totalPages || totalPages <= 1}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Request Details Dialog */}
    <RequestDetailsDialog 
      open={showDetailsDialog}
      onOpenChange={setShowDetailsDialog}
      request={selectedRequest}
    />
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