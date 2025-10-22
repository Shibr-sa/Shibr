"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TrendingUp, ShoppingBag, PlusCircle, AlertTriangle, ArrowRight, Package, Inbox, Layout, Eye, Star, AlertCircle } from "lucide-react"
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
import { formatCurrency, formatDuration, formatDate } from "@/lib/formatters"

// Helper function to get badge variant based on request status
function getRequestStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default"
    case "payment_pending":
      return "default" // Changed from "warning" to "default"
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
  } else if (shelf.status === "active") {
    return "secondary"
  } else if (shelf.status === "suspended") {
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
  
  // Track if we've loaded initial data
  const [hasInitialData, setHasInitialData] = useState(false)
  
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
      userType: "store" as const
    } : "skip"
  )
  
  // Track when we have initial data
  useEffect(() => {
    if (shelves !== undefined && shelfStats !== undefined && rentalRequests !== undefined && !hasInitialData) {
      setHasInitialData(true)
    }
  }, [shelves, shelfStats, rentalRequests, hasInitialData])
  
  // Get recent shelves (max 3)
  const recentShelves = shelves?.slice(0, 3) || []
  
  // Get recent rental requests (max 3)
  const recentRequests = rentalRequests?.slice(0, 3) || []
  
  // Loading state - only true on initial load
  const isLoading = storeLoading || !hasInitialData

  return (
    <div className="space-y-6">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard.manage_store_starts_here")}</h1>
          <p className="text-muted-foreground mt-1">
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
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {!hasInitialData ? (
              // Loading state
              <>
                <Card className="bg-muted/50 border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Skeleton className="h-[14px] w-20" />
                        <Skeleton className="h-[30px] w-16 mt-1" />
                        <Skeleton className="h-[16px] w-24 mt-1" />
                      </div>
                      <Skeleton className="h-12 w-12 rounded-lg" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50 border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Skeleton className="h-[14px] w-20" />
                        <Skeleton className="h-[30px] w-24 mt-1" />
                        <Skeleton className="h-[16px] w-24 mt-1" />
                      </div>
                      <Skeleton className="h-12 w-12 rounded-lg" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50 border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Skeleton className="h-[14px] w-20" />
                        <Skeleton className="h-[30px] w-12 mt-1" />
                        <Skeleton className="h-[16px] w-24 mt-1" />
                      </div>
                      <Skeleton className="h-12 w-12 rounded-lg" />
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                {/* Rented Shelves Card */}
                <StatCard
                  title={t("dashboard.currently_rented_brands")}
                  value={shelfStats?.rentedShelves || 0}
                  trend={{
                    value: shelfStats?.rentedChange || 0,
                    label: `${t("time.from")} ${t("time.last_month")}`
                  }}
                  icon={<Package className="h-5 w-5 text-primary" />}
                />

                {/* Revenue Card */}
                <StatCard
                  title={t("dashboard.total_sales")}
                  value={formatCurrency(shelfStats?.totalRevenue || 0, language)}
                  trend={{
                    value: shelfStats?.revenueChange || 0,
                    label: `${t("time.from")} ${t("time.last_month")}`
                  }}
                  icon={<TrendingUp className="h-5 w-5 text-primary" />}
                />

                {/* Incoming Orders Card */}
                <StatCard
                  title={t("dashboard.incoming_orders")}
                  value={rentalRequests?.filter(r => r.status === "pending").length || 0}
                  trend={{
                    value: (rentalRequests?.filter(r => r.status === "pending").length || 0) > 0 ? 100.0 : 0,
                    label: `${t("time.from")} ${t("time.last_month")}`
                  }}
                  icon={<ShoppingBag className="h-5 w-5 text-primary" />}
                />
              </>
            )}
      </div>

      {/* Rental Requests Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-semibold">{t("dashboard.rental_requests")}</h2>
          <Button 
            variant="outline" 
            size="sm"
            disabled={isLoading || !isStoreDataComplete}
            asChild
          >
            <Link href="/store-dashboard/orders">
              {t("dashboard.see_more")}
            </Link>
          </Button>
        </div>
        
        <div className="rounded-md border overflow-x-auto">
            <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-start">{t("table.store")}</TableHead>
                      <TableHead className="text-start hidden md:table-cell">{t("table.branch")}</TableHead>
                      <TableHead className="text-start hidden md:table-cell">{t("table.rental_duration")}</TableHead>
                      <TableHead className="text-start">{t("table.status")}</TableHead>
                      <TableHead className="text-start hidden lg:table-cell">{t("table.request_date")}</TableHead>
                      <TableHead className="text-start hidden lg:table-cell">{t("table.rating")}</TableHead>
                      <TableHead className="text-start">{t("table.options")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!hasInitialData ? (
                      // Show 3 skeleton rows while loading
                      Array.from({ length: 3 }).map((_, index) => (
                        <TableRow key={`skeleton-request-${index}`} className="h-[72px]">
                          <TableCell className="py-3"><Skeleton className="h-4 w-[100px]" /></TableCell>
                          <TableCell className="py-3 hidden md:table-cell"><Skeleton className="h-4 w-[80px]" /></TableCell>
                          <TableCell className="py-3 hidden md:table-cell"><Skeleton className="h-4 w-[120px]" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                          <TableCell className="py-3 hidden lg:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
                          <TableCell className="py-3 hidden lg:table-cell"><Skeleton className="h-4 w-[60px]" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-8 w-8 rounded" /></TableCell>
                        </TableRow>
                      ))
                    ) : recentRequests.length === 0 ? (
                      // Empty state
                      <TableRow>
                        <TableCell colSpan={7} className="h-[216px] text-center">
                          <div className="flex h-full w-full items-center justify-center">
                            <div className="flex flex-col items-center gap-1 py-10">
                              <Inbox className="h-10 w-10 text-muted-foreground/40 mb-2" />
                              <h3 className="font-medium">
                                {t("dashboard.no_rental_requests")}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {t("dashboard.rental_requests_will_appear_here")}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {/* Show actual rental requests (max 3) */}
                        {recentRequests.map((request: any) => (
                          <TableRow key={request._id} className="h-[72px]">
                            <TableCell className="font-medium">
                              {request.otherUserName}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{request.shelfBranch || "-"}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              {request.startDate && request.endDate
                                ? formatDuration(request.startDate, request.endDate, language)
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getRequestStatusBadgeVariant(request.status)}>
                                {t(`status.${request.status}`)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground hidden lg:table-cell">
                              {request.createdAt
                                ? formatDate(request.createdAt, language)
                                : formatDate(new Date(request._creationTime), language)}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
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
                        {/* Fill remaining rows to maintain consistent height */}
                        {recentRequests.length < 3 && Array.from({ length: 3 - recentRequests.length }).map((_, index) => (
                          <TableRow key={`filler-request-${index}`} className="h-[72px]">
                            <TableCell className="py-3" colSpan={7}>&nbsp;</TableCell>
                          </TableRow>
                        ))}
                      </>
                    )}
                  </TableBody>
                </Table>
        </div>
      </div>

      {/* Shelves Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-semibold">{t("dashboard.your_shelves")}</h2>
          <Button 
            variant="outline" 
            size="sm"
            disabled={isLoading || !isStoreDataComplete}
            asChild
          >
            <Link href="/store-dashboard/shelves">
              {t("dashboard.see_more")}
            </Link>
          </Button>
        </div>
        
        <div className="rounded-md border overflow-x-auto">
            <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-start">{t("shelves.table.shelf_name")}</TableHead>
                      <TableHead className="text-start hidden md:table-cell">{t("shelves.table.branch_name")}</TableHead>
                      <TableHead className="text-start hidden md:table-cell">{t("shelves.table.renter")}</TableHead>
                      <TableHead className="text-start hidden lg:table-cell">{t("shelves.table.price")}</TableHead>
                      <TableHead className="text-start hidden lg:table-cell">{t("shelves.table.net_revenue")}</TableHead>
                      <TableHead className="text-start">{t("shelves.table.status")}</TableHead>
                      <TableHead className="text-start hidden lg:table-cell">{t("shelves.table.next_collection")}</TableHead>
                      <TableHead className="text-start">{t("shelves.table.action")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!hasInitialData ? (
                      // Show 3 skeleton rows while loading
                      Array.from({ length: 3 }).map((_, index) => (
                        <TableRow key={`skeleton-${index}`} className="h-[72px]">
                          <TableCell className="py-3"><Skeleton className="h-4 w-[120px]" /></TableCell>
                          <TableCell className="py-3 hidden md:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
                          <TableCell className="py-3 hidden md:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
                          <TableCell className="py-3 hidden lg:table-cell"><Skeleton className="h-4 w-[80px]" /></TableCell>
                          <TableCell className="py-3 hidden lg:table-cell"><Skeleton className="h-4 w-[80px]" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                          <TableCell className="py-3 hidden lg:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-8 w-8 rounded" /></TableCell>
                        </TableRow>
                      ))
                    ) : recentShelves.length === 0 ? (
                      // Empty state
                      <TableRow>
                        <TableCell colSpan={8} className="h-[216px] text-center">
                          <div className="flex h-full w-full items-center justify-center">
                            <div className="flex flex-col items-center gap-1 py-10">
                              <Layout className="h-10 w-10 text-muted-foreground/40 mb-2" />
                              <h3 className="font-medium">
                                {t("dashboard.no_shelves_displayed")}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {t("dashboard.shelves_will_appear_here")}
                              </p>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-4"
                                disabled={isLoading || !isStoreDataComplete}
                                onClick={() => router.push("/store-dashboard/shelves/new")}
                              >
                                <PlusCircle className="h-4 w-4 me-2" />
                                {t("dashboard.display_shelf_now")}
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {/* Show actual shelves (max 3) */}
                        {recentShelves.map((shelf: any) => (
                          <TableRow key={shelf._id} className="h-[72px]">
                            <TableCell className="font-medium">{shelf.shelfName}</TableCell>
                            <TableCell className="hidden md:table-cell">{shelf.branch?.branchName || '-'}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              {shelf.renterName || "-"}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {formatCurrency(shelf.monthlyPrice || 0, language)}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {shelf.netRevenue ?
                                formatCurrency(shelf.netRevenue, language) :
                                "-"
                              }
                            </TableCell>
                            <TableCell>
                              <Badge variant={getShelfStatusBadgeVariant(shelf)}>
                                {shelf.status === "rented"
                                  ? t("shelves.status.rented")
                                  : shelf.status === "active"
                                  ? t("shelves.status.available")
                                  : shelf.status === "suspended"
                                  ? t("shelves.status.suspended")
                                  : t("shelves.status.unavailable")
                                }
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {shelf.nextCollectionDate ?
                                new Date(shelf.nextCollectionDate).toLocaleDateString("en-US") :
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
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Fill remaining rows to maintain consistent height */}
                        {recentShelves.length < 3 && Array.from({ length: 3 - recentShelves.length }).map((_, index) => (
                          <TableRow key={`filler-shelf-${index}`} className="h-[72px]">
                            <TableCell className="py-3" colSpan={8}>&nbsp;</TableCell>
                          </TableRow>
                        ))}
                      </>
                    )}
                  </TableBody>
                </Table>
        </div>
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
