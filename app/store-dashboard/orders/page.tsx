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
  Check, 
  X, 
  Edit,
  Star,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { useLanguage } from "@/contexts/localization-context"
import { useStoreData } from "@/contexts/store-data-context"
import { useCurrentUser } from "@/hooks/use-current-user"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { cn } from "@/lib/utils"

function OrdersContent() {
  const { t, direction, language } = useLanguage()
  const { user } = useCurrentUser()
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
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
      request.shelfName?.toLowerCase().includes(searchQuery.toLowerCase())
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
    const start = new Date(startDate)
    const end = new Date(endDate)
    const months = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))
    return `${months} ${months === 1 ? t("duration.month_singular") : t("duration.months_plural")}`
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
              placeholder={t("search.store_or_city_placeholder")}
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
          <div className="h-[420px] overflow-y-auto">
            <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className={direction === "rtl" ? "text-right" : "text-left"}>
                  {t("table.store")}
                </TableHead>
                <TableHead className={direction === "rtl" ? "text-right" : "text-left"}>
                  {t("table.branch")}
                </TableHead>
                <TableHead className={direction === "rtl" ? "text-right" : "text-left"}>
                  {t("table.rental_duration")}
                </TableHead>
                <TableHead className={direction === "rtl" ? "text-right" : "text-left"}>
                  {t("table.status")}
                </TableHead>
                <TableHead className={direction === "rtl" ? "text-right" : "text-left"}>
                  {t("table.request_date")}
                </TableHead>
                <TableHead className={direction === "rtl" ? "text-right" : "text-left"}>
                  {t("table.rating")}
                </TableHead>
                <TableHead className={cn("w-[150px]", direction === "rtl" ? "text-right" : "text-left")}>
                  {t("table.options")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.length > 0 ? (
                <>
                  {paginatedRequests.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {request.otherUserName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {request.shelfName || t("common.jeddah")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {calculateDuration(request.startDate, request.endDate)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {format(new Date(request.createdAt), "d MMM yyyy", {
                          locale: language === "ar" ? ar : enUS
                        })}
                      </span>
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
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleReject(request._id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))}
                </>
              ) : null}
            </TableBody>
          </Table>
          {filteredRequests.length === 0 && (
            <div className="flex items-center justify-center h-[360px]">
              <div className="text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {searchQuery || filter !== "all" 
                    ? t("store.no_matching_requests")
                    : t("store.no_requests_yet")
                  }
                </p>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Pagination */}
        {filteredRequests.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              {t("pagination.showing")
                .replace("{start}", String(startIndex + 1))
                .replace("{end}", String(Math.min(endIndex, filteredRequests.length)))
                .replace("{total}", String(filteredRequests.length))
              }
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                {direction === "rtl" ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                {t("pagination.previous")}
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(page)}
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
              >
                {t("pagination.next")}
                {direction === "rtl" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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