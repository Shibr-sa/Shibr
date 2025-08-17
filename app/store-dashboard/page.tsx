"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Store, TrendingUp, TrendingDown, ShoppingBag, PlusCircle, AlertTriangle, ArrowRight, Package, Edit2, Inbox, Layout, Eye, Star } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RequestDetailsDialog, type RentalRequestDetails } from "@/components/dialogs/request-details-dialog"
import Link from "next/link"
import { useLanguage } from "@/contexts/localization-context"
import { useRouter } from "next/navigation"
import { useStoreData } from "@/contexts/store-data-context"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Id } from "@/convex/_generated/dataModel"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { formatDate, formatDuration, formatCurrency } from "@/lib/formatters"

// Helper function to get badge variant based on request status
function getRequestStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" | "warning" {
  switch (status) {
    case "active":
      return "default"
    case "accepted":
    case "payment_pending":
      return "warning"
    case "payment_processing":
      return "secondary"
    case "rejected":
      return "destructive"
    case "pending":
      return "outline"
    default:
      return "secondary"
  }
}

// Helper function to get badge variant based on shelf status
function getShelfStatusBadgeVariant(shelf: any): "default" | "secondary" | "outline" {
  if (shelf.status === "rented") {
    return "default"
  } else if (shelf.status === "approved" && shelf.isAvailable) {
    return "secondary"
  } else if (shelf.status === "pending") {
    return "outline"
  }
  return "secondary"
}

export default function StoreDashboardPage() {
  const { t, direction, language } = useLanguage()
  const router = useRouter()
  const { user } = useCurrentUser()
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<RentalRequestDetails | null>(null)
  
  // Use the global store data context
  const { isLoading: storeLoading, isStoreDataComplete } = useStoreData()
  
  // Fetch real shelves data from Convex
  const shelves = useQuery(api.shelves.getOwnerShelves, 
    user?.id ? { ownerId: user.id as Id<"users"> } : "skip"
  )
  
  // Fetch shelf statistics with percentage changes
  const shelfStats = useQuery(api.shelves.getShelfStatsWithChanges,
    user?.id ? { 
      ownerId: user.id as Id<"users">,
      period: "monthly" as const  // Compare with last month
    } : "skip"
  )
  
  // Fetch rental requests for the store owner
  const rentalRequests = useQuery(
    api.rentalRequests.getUserRentalRequests,
    user?.id ? {
      userId: user.id as Id<"users">,
      userType: "store" as const
    } : "skip"
  )
  
  
  // Get recent shelves (max 3)
  const recentShelves = shelves?.slice(0, 3) || []
  
  // Get recent rental requests (max 3)
  const recentRequests = rentalRequests?.slice(0, 3) || []
  
  // Loading state
  const isLoading = storeLoading || !shelves || !shelfStats

  return (
    <div className="space-y-6">
      {/* Data Completion Warning - Only show if loaded and data is incomplete */}
      {!isLoading && !isStoreDataComplete && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t("dashboard.incomplete_profile_warning")}</AlertTitle>
          <AlertDescription className="mt-2">
            <div className="flex items-center justify-between">
              <span>{t("dashboard.complete_data_description")}</span>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => router.push("/store-dashboard/settings")}
                className="gap-2 ms-4 flex-shrink-0"
              >
                {t("dashboard.complete_profile_now")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Section - Same as Shelves Page */}
      <Card>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">
                {t("dashboard.manage_store_starts_here")}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("dashboard.monitor_performance_description")}
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button 
                      className="gap-1" 
                      disabled={isLoading || !isStoreDataComplete}
                      onClick={() => router.push("/store-dashboard/shelves/new")}
                    >
                      <PlusCircle className="h-4 w-4" />
                      {t("dashboard.display_shelf_now")}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!isStoreDataComplete && !isLoading && (
                  <TooltipContent>
                    <p>{t("dashboard.complete_profile_first")}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Statistics Cards Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Rented Shelves Card */}
            <StatCard
              title={t("dashboard.currently_rented_brands")}
              value={shelfStats?.rentedShelves || 0}
              trend={
                shelfStats && typeof shelfStats.rentedChange === 'number' && shelfStats.rentedChange !== 0
                  ? {
                      value: shelfStats.rentedChange,
                      label: `${t("time.from")} ${t("time.last_month")}`
                    }
                  : undefined
              }
              icon={<Package className="h-5 w-5 text-primary" />}
            />

            {/* Revenue Card */}
            <StatCard
              title={t("dashboard.total_sales")}
              value={formatCurrency(shelfStats?.totalRevenue || 0, language)}
              trend={
                shelfStats && typeof shelfStats.revenueChange === 'number' && shelfStats.revenueChange !== 0
                  ? {
                      value: shelfStats.revenueChange,
                      label: `${t("time.from")} ${t("time.last_month")}`
                    }
                  : undefined
              }
              icon={<TrendingUp className="h-5 w-5 text-primary" />}
            />

            {/* Incoming Orders Card */}
            <StatCard
              title={t("dashboard.incoming_orders")}
              value={rentalRequests?.filter(r => r.status === "pending").length || 0}
              trend={
                rentalRequests?.filter(r => r.status === "pending").length > 0
                  ? {
                      value: 100.0,
                      label: `${t("time.from")} ${t("time.last_month")}`
                    }
                  : undefined
              }
              icon={<ShoppingBag className="h-5 w-5 text-primary" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Rental Requests and Shelves */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold">{t("dashboard.new_rental_requests")}</CardTitle>
            <Button 
              variant="link" 
              size="sm"
              className="h-auto p-0"
              disabled={isLoading || !isStoreDataComplete}
              asChild
            >
              <Link href="/store-dashboard/orders">
                {t("dashboard.see_more")}
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
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
                    {isLoading || !rentalRequests ? (
                      // Show 3 skeleton rows while loading
                      Array.from({ length: 3 }).map((_, index) => (
                        <TableRow key={`skeleton-request-${index}`} className="h-[72px]">
                          <TableCell className="py-3"><Skeleton className="h-4 w-[100px]" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-[80px]" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-[120px]" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-[100px]" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-[60px]" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-8 w-8 rounded" /></TableCell>
                        </TableRow>
                      ))
                    ) : recentRequests.length === 0 ? (
                      // Show empty state with 3 rows
                      Array.from({ length: 3 }).map((_, index) => (
                        <TableRow key={`empty-request-${index}`} className="h-[72px]">
                          {index === 1 ? (
                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                              <div className="flex items-center justify-center gap-2">
                                <Inbox className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm">{t("dashboard.no_rental_requests")}</span>
                              </div>
                            </TableCell>
                          ) : (
                            <TableCell colSpan={7}>&nbsp;</TableCell>
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <>
                        {/* Show actual rental requests (max 3) */}
                        {recentRequests.map((request: any) => (
                          <TableRow key={request._id} className="h-[72px]">
                            <TableCell className="font-medium">
                              {request.otherUserName}
                            </TableCell>
                            <TableCell>{request.shelfBranch || "-"}</TableCell>
                            <TableCell>
                              {request.startDate && request.endDate 
                                ? formatDuration(request.startDate, request.endDate, language)
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getRequestStatusBadgeVariant(request.status)}>
                                {request.status === "accepted" 
                                  ? t("status.payment_pending")
                                  : t(`status.${request.status}`)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {request.createdAt 
                                ? formatDate(request.createdAt, language)
                                : formatDate(new Date(request._creationTime), language)}
                            </TableCell>
                            <TableCell>
                              {request.status === "approved" && request.rating ? (
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm">{request.rating}/5</span>
                                </div>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
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
                        {/* Fill remaining rows to always show 3 total */}
                        {recentRequests.length < 3 && Array.from({ length: 3 - recentRequests.length }).map((_, index) => (
                          <TableRow key={`empty-row-request-${index}`} className="h-[72px]">
                            <TableCell className="py-3"><Skeleton className="h-4 w-[100px]" /></TableCell>
                            <TableCell className="py-3"><Skeleton className="h-4 w-[80px]" /></TableCell>
                            <TableCell className="py-3"><Skeleton className="h-4 w-[120px]" /></TableCell>
                            <TableCell className="py-3"><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                            <TableCell className="py-3"><Skeleton className="h-4 w-[100px]" /></TableCell>
                            <TableCell className="py-3"><Skeleton className="h-4 w-[60px]" /></TableCell>
                            <TableCell className="py-3"><Skeleton className="h-8 w-8 rounded" /></TableCell>
                          </TableRow>
                        ))}
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold">{t("dashboard.your_shelves")}</CardTitle>
            <Button 
              variant="link" 
              size="sm"
              className="h-auto p-0"
              disabled={isLoading || !isStoreDataComplete}
              asChild
            >
              <Link href="/store-dashboard/shelves">
                {t("dashboard.see_more")}
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-start">{t("shelves.table.shelf_name")}</TableHead>
                      <TableHead className="text-start">{t("shelves.table.branch_name")}</TableHead>
                      <TableHead className="text-start">{t("shelves.table.renter")}</TableHead>
                      <TableHead className="text-start">{t("shelves.table.price")}</TableHead>
                      <TableHead className="text-start">{t("shelves.table.status")}</TableHead>
                      <TableHead className="text-start">{t("shelves.table.next_collection")}</TableHead>
                      <TableHead className="text-start">{t("shelves.table.action")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      // Show 3 skeleton rows while loading
                      Array.from({ length: 3 }).map((_, index) => (
                        <TableRow key={`skeleton-${index}`} className="h-[72px]">
                          <TableCell className="py-3"><Skeleton className="h-4 w-[120px]" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-[100px]" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-[100px]" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-[80px]" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-[100px]" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-8 w-8 rounded" /></TableCell>
                        </TableRow>
                      ))
                    ) : recentShelves.length === 0 ? (
                      // Show empty state with 3 rows
                      Array.from({ length: 3 }).map((_, index) => (
                        <TableRow key={`empty-shelf-${index}`} className="h-[72px]">
                          {index === 1 ? (
                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                              <div className="flex items-center justify-center gap-3">
                                <Layout className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm">{t("dashboard.no_shelves_displayed")}</span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Button 
                                          variant="link" 
                                          size="sm"
                                          className="gap-1 h-auto p-0"
                                          disabled={isLoading || !isStoreDataComplete}
                                          onClick={() => router.push("/store-dashboard/shelves/new")}
                                        >
                                          <PlusCircle className="h-4 w-4" />
                                          <span>{t("dashboard.display_shelf_now")}</span>
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    {!isStoreDataComplete && !isLoading && (
                                      <TooltipContent>
                                        <p>{t("dashboard.complete_profile_first")}</p>
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                          ) : (
                            <TableCell colSpan={7}>&nbsp;</TableCell>
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <>
                        {/* Show actual shelves (max 3) */}
                        {recentShelves.slice(0, 3).map((shelf: any) => (
                          <TableRow key={shelf._id} className="h-[72px]">
                            <TableCell className="font-medium">{shelf.shelfName}</TableCell>
                            <TableCell>{shelf.branch}</TableCell>
                            <TableCell>
                              {shelf.status === "rented" && shelf.renterName ? 
                                shelf.renterName : 
                                "-"
                              }
                            </TableCell>
                            <TableCell>
                              {formatCurrency(shelf.monthlyPrice || 0, language)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getShelfStatusBadgeVariant(shelf)}>
                                {shelf.status === "rented" 
                                  ? t("shelves.status.rented")
                                  : shelf.status === "approved" && shelf.isAvailable
                                  ? t("shelves.status.available")
                                  : shelf.status === "pending"
                                  ? t("shelves.status.pending")
                                  : t("shelves.status.unavailable")
                                }
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {shelf.status === "rented" && shelf.nextCollectionDate ? 
                                format(new Date(shelf.nextCollectionDate), "dd/MM/yyyy", { locale: language === "ar" ? ar : enUS }) : 
                                "-"
                              }
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => router.push(`/store-dashboard/shelves/${shelf._id}`)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Fill remaining rows to always show 3 total */}
                        {recentShelves.length < 3 && Array.from({ length: 3 - recentShelves.length }).map((_, index) => (
                          <TableRow key={`empty-row-${index}`} className="h-[72px]">
                            <TableCell className="py-3"><Skeleton className="h-4 w-[120px]" /></TableCell>
                            <TableCell className="py-3"><Skeleton className="h-4 w-[100px]" /></TableCell>
                            <TableCell className="py-3"><Skeleton className="h-4 w-[100px]" /></TableCell>
                            <TableCell className="py-3"><Skeleton className="h-4 w-[80px]" /></TableCell>
                            <TableCell className="py-3"><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                            <TableCell className="py-3"><Skeleton className="h-4 w-[100px]" /></TableCell>
                            <TableCell className="py-3"><Skeleton className="h-8 w-8 rounded" /></TableCell>
                          </TableRow>
                        ))}
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request Details Dialog */}
      <RequestDetailsDialog 
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        request={selectedRequest}
      />
    </div>
  )
}
