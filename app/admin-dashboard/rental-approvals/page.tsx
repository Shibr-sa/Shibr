"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useLanguage } from "@/contexts/localization-context"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { Card, CardContent } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, Eye, Package, TrendingUp, DollarSign, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Id } from "@/convex/_generated/dataModel"

export default function RentalApprovalsPage() {
  const { t, language, direction } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialize state from URL params for persistence
  const [timePeriod, setTimePeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">(
    (searchParams.get("period") as "daily" | "weekly" | "monthly" | "yearly") || "monthly"
  )
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending_admin_approval" | "approved" | "rejected">(
    (searchParams.get("status") as "all" | "pending_admin_approval" | "approved" | "rejected") || "all"
  )
  const itemsPerPage = 5

  // Track if we've loaded initial data
  const [hasInitialData, setHasInitialData] = useState(false)

  // Detail dialog state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [commission, setCommission] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectionField, setShowRejectionField] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Debounced search value
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)

  // Mutations
  const approveRequest = useMutation(api.admin.rentals.approveRequest)
  const rejectRequest = useMutation(api.admin.rentals.rejectRequest)

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("search", searchQuery)
    if (statusFilter !== "all") params.set("status", statusFilter)
    if (timePeriod !== "monthly") params.set("period", timePeriod)
    if (currentPage > 1) params.set("page", String(currentPage))

    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(newUrl, { scroll: false })
  }, [searchQuery, statusFilter, timePeriod, currentPage, pathname, router])

  // Fetch stats data with time period
  const statsResult = useQuery(api.admin.rentals.getPendingApprovals, {
    searchQuery: "",
    page: 1,
    limit: 1,
    statusFilter: "all",
    timePeriod,
  })

  // Fetch rentals table data with debounced search
  const rentalsResult = useQuery(api.admin.rentals.getPendingApprovals, {
    searchQuery: debouncedSearchQuery,
    page: currentPage,
    limit: itemsPerPage,
    statusFilter,
  })

  const rentals = rentalsResult?.items || []

  // Check if search is in progress
  const isSearching = searchQuery !== debouncedSearchQuery

  // Track when we have initial data
  useEffect(() => {
    if (rentalsResult !== undefined && !hasInitialData) {
      setHasInitialData(true)
    }
  }, [rentalsResult, hasInitialData])

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending_admin_approval":
        return "secondary" // amber
      case "pending":
        return "default" // yellow
      case "rejected":
        return "destructive" // red
      default:
        return "outline"
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ${t("common.currency")}`
  }

  const totalPages = rentalsResult?.totalPages || 1

  const handleViewDetails = (rental: any) => {
    setSelectedRequest(rental)
    setCommission("")
    setRejectionReason("")
    setShowRejectionField(false)
    setDetailDialogOpen(true)
  }

  const handleApprove = async () => {
    if (!selectedRequest) return

    const commissionValue = parseFloat(commission)
    if (isNaN(commissionValue) || commissionValue < 0 || commissionValue > 50) {
      toast.error(t("rentals.commission_invalid"))
      return
    }

    setIsSubmitting(true)
    try {
      await approveRequest({
        requestId: selectedRequest.id as Id<"rentalRequests">,
        platformCommissionRate: commissionValue,
      })
      toast.success(t("rentals.approve_success"))
      setDetailDialogOpen(false)
      setSelectedRequest(null)
    } catch (error) {
      toast.error(t("rentals.approve_error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest) return

    if (!rejectionReason.trim()) {
      toast.error(t("rentals.reason_required"))
      return
    }

    setIsSubmitting(true)
    try {
      await rejectRequest({
        requestId: selectedRequest.id as Id<"rentalRequests">,
        reason: rejectionReason,
      })
      toast.success(t("rentals.reject_success"))
      setDetailDialogOpen(false)
      setSelectedRequest(null)
    } catch (error) {
      toast.error(t("rentals.reject_error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("rentals.title")}</h2>
          <p className="text-muted-foreground mt-1">{t("rentals.description")}</p>
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {statsResult === undefined ? (
          <>
            <Card className="bg-muted/50 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{t("rentals.total_pending")}</p>
                    <Skeleton className="h-[30px] w-24 mt-1" />
                    <Skeleton className="h-[16px] w-32 mt-1" />
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{t("rentals.total_approved")}</p>
                    <Skeleton className="h-[30px] w-24 mt-1" />
                    <Skeleton className="h-[16px] w-32 mt-1" />
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{t("rentals.total_rejected")}</p>
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
                    <p className="text-sm text-muted-foreground">{t("rentals.pending_revenue")}</p>
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
              title={t("rentals.total_pending")}
              value={statsResult.stats?.totalPending || 0}
              trend={{
                value: statsResult.stats?.pendingChange || 0,
                label: timePeriod === "daily" ? t("dashboard.from_yesterday") :
                       timePeriod === "weekly" ? t("dashboard.from_last_week") :
                       timePeriod === "yearly" ? t("dashboard.from_last_year") :
                       t("dashboard.from_last_month")
              }}
              icon={<Calendar className="h-6 w-6 text-primary" />}
            />

            <StatCard
              title={t("rentals.total_approved")}
              value={statsResult.stats?.totalApproved || 0}
              trend={{
                value: statsResult.stats?.approvedChange || 0,
                label: timePeriod === "daily" ? t("dashboard.from_yesterday") :
                       timePeriod === "weekly" ? t("dashboard.from_last_week") :
                       timePeriod === "yearly" ? t("dashboard.from_last_year") :
                       t("dashboard.from_last_month")
              }}
              icon={<TrendingUp className="h-6 w-6 text-primary" />}
            />

            <StatCard
              title={t("rentals.total_rejected")}
              value={statsResult.stats?.totalRejected || 0}
              trend={{
                value: statsResult.stats?.rejectedChange || 0,
                label: timePeriod === "daily" ? t("dashboard.from_yesterday") :
                       timePeriod === "weekly" ? t("dashboard.from_last_week") :
                       timePeriod === "yearly" ? t("dashboard.from_last_year") :
                       t("dashboard.from_last_month")
              }}
              icon={<Package className="h-6 w-6 text-primary" />}
            />

            <StatCard
              title={t("rentals.pending_revenue")}
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

      {/* Filter Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <ToggleGroup
          type="single"
          value={statusFilter}
          onValueChange={(value) => {
            if (value && (value === "all" || value === "pending_admin_approval" || value === "approved" || value === "rejected")) {
              setStatusFilter(value)
              setCurrentPage(1)
            }
          }}
          className="justify-start"
        >
          <ToggleGroupItem value="all" aria-label="Show all requests">
            {t("rentals.filter_all")}
          </ToggleGroupItem>
          <ToggleGroupItem value="pending_admin_approval" aria-label="Show pending approval">
            {t("rentals.filter_pending")}
          </ToggleGroupItem>
          <ToggleGroupItem value="pending" aria-label="Show approved">
            {t("rentals.filter_approved")}
          </ToggleGroupItem>
          <ToggleGroupItem value="rejected" aria-label="Show rejected">
            {t("rentals.filter_rejected")}
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="relative w-full sm:w-80">
          <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={t("rentals.search_placeholder")}
            className="pe-10"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
      </div>

      {/* Rentals Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="h-12 text-start font-medium">
                {t("rentals.table.brand")}
              </TableHead>
              <TableHead className="h-12 text-start font-medium">
                {t("rentals.table.store")}
              </TableHead>
              <TableHead className="h-12 text-start font-medium hidden md:table-cell">
                {t("rentals.table.shelf")}
              </TableHead>
              <TableHead className="h-12 text-start font-medium hidden lg:table-cell">
                {t("rentals.table.duration")}
              </TableHead>
              <TableHead className="h-12 text-start font-medium">
                {t("rentals.table.amount")}
              </TableHead>
              <TableHead className="h-12 text-start font-medium hidden lg:table-cell">
                {t("rentals.table.products")}
              </TableHead>
              <TableHead className="h-12 text-start font-medium">
                {t("rentals.table.status")}
              </TableHead>
              <TableHead className="h-12 text-start font-medium">
                {t("rentals.table.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!hasInitialData || rentalsResult === undefined || isSearching ? (
              // Loading state - show skeletons
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`loading-${index}`} className="h-[72px]">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </TableCell>
                  <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="py-3 hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="py-3 hidden lg:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="py-3"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="py-3 hidden lg:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell className="py-3"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="py-3"><Skeleton className="h-8 w-8 rounded" /></TableCell>
                </TableRow>
              ))
            ) : rentals.length > 0 ? (
              <>
                {rentals.map((rental, index) => (
                  <TableRow
                    key={rental.id}
                    className={`h-[72px] ${index < rentals.length - 1 ? 'border-b' : ''}`}
                  >
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={rental.brandProfileImage || undefined} alt={rental.brandName} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {rental.brandName?.charAt(0)?.toUpperCase() || "B"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{rental.brandName}</div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">{rental.storeName}</TableCell>
                    <TableCell className="py-3 text-muted-foreground hidden md:table-cell">{rental.shelfName}</TableCell>
                    <TableCell className="py-3 text-muted-foreground hidden lg:table-cell">
                      {rental.duration}
                    </TableCell>
                    <TableCell className="py-3 font-medium">{formatCurrency(rental.totalAmount)}</TableCell>
                    <TableCell className="py-3 text-muted-foreground hidden lg:table-cell">{rental.productsCount}</TableCell>
                    <TableCell className="py-3">
                      <Badge variant={getStatusVariant(rental.status)} className="font-normal">
                        {t(`dashboard.status.${rental.status}`) || t("common.unknown")}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleViewDetails(rental)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Fill remaining rows to always show 5 rows */}
                {rentals.length < 5 && Array.from({ length: 5 - rentals.length }).map((_, index) => (
                  <TableRow key={`filler-${index}`} className="h-[72px]">
                    <TableCell className="py-3" colSpan={8}></TableCell>
                  </TableRow>
                ))}
              </>
            ) : (
              // Empty state
              <TableRow>
                <TableCell colSpan={8} className="h-[360px] text-center">
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="flex flex-col items-center gap-1 py-10">
                      <Package className="h-10 w-10 text-muted-foreground/40 mb-2" />
                      <h3 className="font-medium">
                        {searchQuery ? t("rentals.no_results") : t("rentals.no_requests")}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {searchQuery ? t("rentals.try_different_filter") : t("rentals.no_requests_description")}
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
                          {t("rentals.clear_filters")}
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

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl" dir={direction}>
          <DialogHeader>
            <DialogTitle>{t("rentals.request_details")}</DialogTitle>
            <DialogDescription>
              {t("rentals.view_details")}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Brand Information */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">{t("rentals.brand_information")}</h4>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={selectedRequest.brandProfileImage || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {selectedRequest.brandName?.charAt(0)?.toUpperCase() || "B"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedRequest.brandName}</p>
                    <p className="text-sm text-muted-foreground">{selectedRequest.brandOwnerEmail}</p>
                  </div>
                </div>
              </div>

              {/* Store Information */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">{t("rentals.store_information")}</h4>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium">{selectedRequest.storeName}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.storeCity}</p>
                </div>
              </div>

              {/* Shelf Information */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">{t("rentals.shelf_information")}</h4>
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("common.name")}</p>
                    <p className="font-medium">{selectedRequest.shelfName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("common.location")}</p>
                    <p className="font-medium">{selectedRequest.shelfLocation}</p>
                  </div>
                </div>
              </div>

              {/* Rental Period */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">{t("rentals.rental_period")}</h4>
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("dashboard.duration")}</p>
                    <p className="font-medium">{selectedRequest.duration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("rentals.monthly_rent")}</p>
                    <p className="font-medium">{formatCurrency(selectedRequest.monthlyPrice)}</p>
                  </div>
                </div>
              </div>

              {/* Products Summary */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">{t("rentals.products_summary")}</h4>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm">{t("rentals.product_count", { count: selectedRequest.productsCount })}</p>
                  <p className="text-sm text-muted-foreground">{t("rentals.total_quantity", { qty: selectedRequest.totalQuantity })}</p>
                  <p className="text-sm text-muted-foreground">{t("rentals.categories")}: {selectedRequest.categories?.join(", ")}</p>
                </div>
              </div>

              {/* Total Amount */}
              <div className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="font-semibold">{t("rentals.total_amount")}</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(selectedRequest.totalAmount)}</span>
              </div>

              {/* Commission Input - Only show for pending_admin_approval */}
              {selectedRequest.status === "pending_admin_approval" && !showRejectionField && (
                <div className="space-y-2">
                  <Label htmlFor="commission">
                    {t("rentals.platform_commission")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="commission"
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    placeholder={t("rentals.commission_placeholder")}
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">{t("rentals.commission_description")}</p>
                </div>
              )}

              {/* Rejection Reason */}
              {showRejectionField && (
                <div className="space-y-2">
                  <Label htmlFor="rejectionReason">
                    {t("rentals.rejection_reason")} <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="rejectionReason"
                    placeholder={t("rentals.rejection_placeholder")}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDetailDialogOpen(false)
                setSelectedRequest(null)
                setShowRejectionField(false)
              }}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>

            {selectedRequest?.status === "pending_admin_approval" && (
              <>
                {!showRejectionField ? (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => setShowRejectionField(true)}
                      disabled={isSubmitting}
                    >
                      {t("rentals.reject_request")}
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={isSubmitting || !commission}
                    >
                      {isSubmitting ? t("rentals.approving") : t("rentals.approve_request")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setShowRejectionField(false)}
                      disabled={isSubmitting}
                    >
                      {t("common.back")}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={isSubmitting || !rejectionReason.trim()}
                    >
                      {isSubmitting ? t("rentals.rejecting") : t("rentals.reject_request")}
                    </Button>
                  </>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
