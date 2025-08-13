"use client"

import React, { useState, Suspense } from "react"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
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
  Package,
  Inbox,
  FileSearch,
  Check, 
  X, 
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
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
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

  // Mutations
  const acceptRequest = useMutation(api.rentalRequests.acceptRentalRequest)
  const rejectRequest = useMutation(api.rentalRequests.rejectRentalRequest)

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
  const filteredRequests = rentalRequests?.filter(request => {
    const matchesFilter = filter === "all" || request.status === filter
    const matchesSearch = !searchQuery || 
      request.otherUserName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.shelfBranch?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  }) || []

  // Calculate pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex)

  // Reset to page 1 when filter or search changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [filter, searchQuery])

  const handleAccept = async (requestId: Id<"rentalRequests">) => {
    try {
      await acceptRequest({ requestId })
    } catch (error) {
      console.error("Failed to accept request:", error)
    }
  }

  const handleReject = async (requestId: Id<"rentalRequests">) => {
    try {
      await rejectRequest({ requestId })
    } catch (error) {
      console.error("Failed to reject request:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
            {t("status.pending")}
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
                          <div className="flex items-center gap-2">
                            {request.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleAccept(request._id)}
                                  title={t("orders.accept")}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleReject(request._id)}
                                  title={t("orders.reject")}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
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
                          </div>
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
    <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold">
                {t("orders.request_details")}
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{t("orders.cancel_warning")}</span>
              </div>
            </div>
            <Separator />
          </div>
        </DialogHeader>
        
        {selectedRequest && (
          <div className="space-y-6 mt-4">
            {/* Request Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("orders.request_number")}</p>
                <p className="font-medium">#{selectedRequest._id?.slice(-10) || "0000000000"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("orders.city")}</p>
                <p className="font-medium">{t("common.jeddah")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("orders.activity_type")}</p>
                <p className="font-medium">{t("orders.cafe")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("orders.renter_name")}</p>
                <p className="font-medium">{selectedRequest.otherUserName || "-"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("orders.commercial_register")}</p>
                <p className="font-medium">101234567</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("orders.website")}</p>
                <p className="font-medium">www.example.com</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("orders.email")}</p>
                <p className="font-medium">info@example.com</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("orders.rating")}</p>
                <div className="flex items-center gap-1">
                  <span className="font-medium">4/5</span>
                  <div className="flex">
                    {[1, 2, 3, 4].map((star) => (
                      <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                    <Star className="h-3 w-3 text-gray-300" />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Request Details Table */}
            <div>
              <h3 className="font-semibold mb-4">{t("orders.request_details_title")}</h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-start">{t("orders.branch")}</TableHead>
                      <TableHead className="text-start">{t("orders.activity")}</TableHead>
                      <TableHead className="text-start">{t("orders.rental_duration")}</TableHead>
                      <TableHead className="text-start">{t("orders.rental_type")}</TableHead>
                      <TableHead className="text-start">{t("orders.rental_date")}</TableHead>
                      <TableHead className="text-start">{t("orders.notes")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">
                        {selectedRequest.shelfBranch || t("common.jeddah")}
                      </TableCell>
                      <TableCell>{t("orders.new_shelf")}</TableCell>
                      <TableCell>
                        {selectedRequest.startDate && selectedRequest.endDate 
                          ? calculateDuration(selectedRequest.startDate, selectedRequest.endDate)
                          : "-"}
                      </TableCell>
                      <TableCell>{t("orders.monthly")}</TableCell>
                      <TableCell>
                        {selectedRequest.createdAt 
                          ? formatDate(selectedRequest.createdAt, language, 'long')
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {selectedRequest.additionalNotes || t("orders.want_to_rent")}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                {t("orders.agreement_confirmation")}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedRequest.status === "pending") {
                    handleReject(selectedRequest._id)
                    setShowDetailsDialog(false)
                  }
                }}
                disabled={selectedRequest.status !== "pending"}
              >
                {t("orders.reject_request")}
              </Button>
              <Button
                onClick={() => {
                  if (selectedRequest.status === "pending") {
                    handleAccept(selectedRequest._id)
                    setShowDetailsDialog(false)
                  }
                }}
                disabled={selectedRequest.status !== "pending"}
              >
                {t("orders.accept_request")}
              </Button>
            </div>

            {/* Bottom Info */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>{selectedRequest.otherUserName || t("orders.requester")}</span>
                <Badge variant="outline" className="text-xs">
                  {t("status.online")}
                </Badge>
              </div>
              <Button variant="link" className="text-sm h-auto p-0">
                {t("orders.thank_you_message")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
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