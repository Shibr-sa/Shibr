"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Store, TrendingUp, TrendingDown, ShoppingBag, PlusCircle, AlertTriangle, ArrowRight, Package, Edit2, Inbox, Layout, Eye, Star } from "lucide-react"
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
import { formatDate, formatDuration } from "@/lib/formatters"

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

  // Format currency - always use Western numerals
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Data Completion Warning - Only show if loaded and data is incomplete */}
      {!isLoading && !isStoreDataComplete && (
        <Alert className="border-destructive/50 bg-destructive/10 [&>svg]:top-1/2 [&>svg]:-translate-y-1/2 [&>svg+div]:translate-y-0">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <AlertTitle className="text-destructive font-semibold mb-0">
                {t("dashboard.incomplete_profile_warning")}
              </AlertTitle>
              <AlertDescription className="mt-1">
                <span className="text-muted-foreground">
                  {t("dashboard.complete_data_description")}
                </span>
              </AlertDescription>
            </div>
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
            <Button 
              className="gap-1" 
              disabled={isLoading || !isStoreDataComplete}
              title={!isStoreDataComplete && !isLoading ? t("dashboard.complete_profile_first") : ""}
              onClick={() => router.push("/store-dashboard/shelves/new")}
            >
              <PlusCircle className="h-4 w-4" />
              {t("dashboard.display_shelf_now")}
            </Button>
          </div>

          {/* Statistics Cards Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Rented Shelves Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">
                      {t("dashboard.currently_rented_brands")}
                    </p>
                    <p className="text-2xl font-bold">{shelfStats?.rentedShelves || 0}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {shelfStats && typeof shelfStats.rentedChange === 'number' ? (
                        shelfStats.rentedChange !== 0 ? (
                          <>
                            {shelfStats.rentedChange > 0 ? (
                              <TrendingUp className="h-3 w-3 text-green-600" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-600" />
                            )}
                            <span className={`text-xs font-medium ${shelfStats.rentedChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {shelfStats.rentedChange > 0 ? '+' : ''}{shelfStats.rentedChange}% {t("time.from")} {t("time.last_month")}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            0.0% {t("time.from")} {t("time.last_month")}
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          0.0% {t("time.from")} {t("time.last_month")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">
                      {t("dashboard.total_sales")}
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(shelfStats?.totalRevenue || 0)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {shelfStats && typeof shelfStats.revenueChange === 'number' ? (
                        shelfStats.revenueChange !== 0 ? (
                          <>
                            {shelfStats.revenueChange > 0 ? (
                              <TrendingUp className="h-3 w-3 text-green-600" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-600" />
                            )}
                            <span className={`text-xs font-medium ${shelfStats.revenueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {shelfStats.revenueChange > 0 ? '+' : ''}{shelfStats.revenueChange}% {t("time.from")} {t("time.last_month")}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            0.0% {t("time.from")} {t("time.last_month")}
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          0.0% {t("time.from")} {t("time.last_month")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Incoming Orders Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">
                      {t("dashboard.incoming_orders")}
                    </p>
                    <p className="text-2xl font-bold">{rentalRequests?.filter(r => r.status === "pending").length || 0}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {rentalRequests?.filter(r => r.status === "pending").length > 0 ? (
                        <>
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <span className="text-xs font-medium text-green-600">
                            +100.0% {t("time.from")} {t("time.last_month")}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          0.0% {t("time.from")} {t("time.last_month")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Rental Requests and Shelves */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold">{t("dashboard.new_rental_requests")}</CardTitle>
            <Link 
              href="/store-dashboard/orders" 
              className={`text-sm ${!isLoading && isStoreDataComplete ? 'text-primary' : 'text-muted-foreground pointer-events-none'}`}
              onClick={isLoading || !isStoreDataComplete ? (e: React.MouseEvent) => e.preventDefault() : undefined}
            >
              {t("dashboard.see_more")}
            </Link>
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
                          <TableCell colSpan={7} className="text-center">
                            <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
                          </TableCell>
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
                              <Badge 
                                variant={
                                  request.status === "active" ? "default" :
                                  request.status === "accepted" || request.status === "payment_pending" ? "warning" :
                                  request.status === "payment_processing" ? "secondary" :
                                  request.status === "rejected" ? "destructive" :
                                  request.status === "pending" ? "outline" :
                                  "secondary"
                                }
                              >
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
                            <TableCell colSpan={7}>&nbsp;</TableCell>
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
            <Link 
              href="/store-dashboard/shelves" 
              className={`text-sm ${!isLoading && isStoreDataComplete ? 'text-primary' : 'text-muted-foreground pointer-events-none'}`}
              onClick={isLoading || !isStoreDataComplete ? (e: React.MouseEvent) => e.preventDefault() : undefined}
            >
              {t("dashboard.see_more")}
            </Link>
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
                          <TableCell colSpan={7} className="text-center">
                            <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
                          </TableCell>
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
                                <Button 
                                  variant="link" 
                                  size="sm"
                                  className="text-primary gap-1 h-auto p-0"
                                  disabled={isLoading || !isStoreDataComplete}
                                  title={!isStoreDataComplete && !isLoading ? t("dashboard.complete_profile_first") : ""}
                                  onClick={() => router.push("/store-dashboard/shelves/new")}
                                >
                                  <PlusCircle className="h-4 w-4" />
                                  <span className="text-sm">{t("dashboard.display_shelf_now")}</span>
                                </Button>
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
                              {formatCurrency(shelf.monthlyPrice || 0)}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  shelf.status === "rented" 
                                    ? "default"
                                    : shelf.status === "approved" && shelf.isAvailable
                                    ? "secondary"
                                    : shelf.status === "pending"
                                    ? "outline"
                                    : "secondary"
                                }
                              >
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
                            <TableCell colSpan={7}>&nbsp;</TableCell>
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
