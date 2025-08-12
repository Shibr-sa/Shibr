"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Package, TrendingUp, Lock, QrCode, Search, Eye, MessageSquare } from "lucide-react"
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

export default function BrandShelvesPage() {
  const { t, direction, language } = useLanguage()
  const { isBrandDataComplete } = useBrandData()
  const router = useRouter()
  const { user } = useCurrentUser()
  const [searchQuery, setSearchQuery] = useState("")

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

  // Filter rental requests based on search
  const filteredRequests = rentalRequests?.filter(request => {
    const matchesSearch = !searchQuery || 
      request.otherUserName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.shelfName?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  }) || []

  // Calculate statistics from all requests (not filtered)
  const allRequests = rentalRequests || []
  const activeRentals = allRequests.filter(r => r.status === "active").length
  const pendingRentals = allRequests.filter(r => r.status === "pending").length
  const totalRentals = allRequests.length
  
  // Loading state
  const isLoading = userId && !rentalRequests

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            {language === "ar" ? "نشط" : "Active"}
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            {language === "ar" ? "قيد المراجعة" : "Pending"}
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            {language === "ar" ? "مرفوض" : "Rejected"}
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

  return (
    <div className="w-full space-y-6 overflow-hidden">
      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1 truncate">{language === "ar" ? "عدد الرفوف الحالية" : "Current Shelves Count"}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mb-1" />
                ) : (
                  <p className="text-xl sm:text-2xl font-bold">{activeRentals}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {language === "ar" ? "رفوف نشطة" : "Active shelves"}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1 truncate">
                  {language === "ar" ? "طلبات قيد المراجعة" : "Pending Requests"}
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mb-1" />
                ) : (
                  <p className="text-xl sm:text-2xl font-bold">{pendingRentals}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {language === "ar" ? "بانتظار الموافقة" : "Awaiting approval"}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                <QrCode className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1 truncate">
                  {language === "ar" ? "إجمالي الطلبات" : "Total Requests"}
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mb-1" />
                ) : (
                  <p className="text-xl sm:text-2xl font-bold">{totalRentals}</p>
                )}
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1 truncate">
                  <TrendingUp className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{language === "ar" ? "كل الطلبات" : "All requests"}</span>
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Shelves Section */}
      <Card className="w-full overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          {/* Title and Search Section */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              {language === "ar" ? "الرفوف الحالية" : "Current Shelves"}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {language === "ar" 
                ? "عرض وإدارة جميع الرفوف المستأجرة حالياً"
                : "View and manage all your currently rented shelves"
              }
            </p>
          </div>

          {/* Search and Add Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4 sm:mb-6">
            <div className="relative flex-1 sm:flex-initial sm:w-80 max-w-full">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === "ar" ? "بحث..." : "Search..."}
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
                      <span className="hidden sm:inline">{language === "ar" ? "إضافة رف" : "Add Shelf"}</span>
                      <span className="sm:hidden">{language === "ar" ? "إضافة" : "Add"}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {!isBrandDataComplete && (
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        <span>{language === "ar" ? "يرجى إكمال بياناتك أولاً" : "Please complete your data first"}</span>
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="h-[300px] sm:h-[420px] overflow-auto">
            <Table className="min-w-[700px]">
              <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className={cn("min-w-[120px]", direction === "rtl" ? "text-right" : "text-left")}>
                  {language === "ar" ? "المتجر" : "Store"}
                </TableHead>
                <TableHead className={cn("min-w-[100px]", direction === "rtl" ? "text-right" : "text-left")}>
                  {language === "ar" ? "الموقع" : "Location"}
                </TableHead>
                <TableHead className={cn("min-w-[80px]", direction === "rtl" ? "text-right" : "text-left")}>
                  {language === "ar" ? "العدد" : "Count"}
                </TableHead>
                <TableHead className={cn("min-w-[100px]", direction === "rtl" ? "text-right" : "text-left")}>
                  {language === "ar" ? "البداية" : "Start"}
                </TableHead>
                <TableHead className={cn("min-w-[100px]", direction === "rtl" ? "text-right" : "text-left")}>
                  {language === "ar" ? "النهاية" : "End"}
                </TableHead>
                <TableHead className={cn("min-w-[90px]", direction === "rtl" ? "text-right" : "text-left")}>
                  {language === "ar" ? "الحالة" : "Status"}
                </TableHead>
                <TableHead className={cn("min-w-[100px]", direction === "rtl" ? "text-right" : "text-left")}>
                  {language === "ar" ? "إجراءات" : "Actions"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading state
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell className="text-end">
                      <Skeleton className="h-8 w-20 ms-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {request.otherUserName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {request.shelfName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {request.productCount || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {format(new Date(request.startDate), "d MMM", {
                          locale: language === "ar" ? ar : enUS
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {format(new Date(request.endDate), "d MMM", {
                          locale: language === "ar" ? ar : enUS
                        })}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {request.conversationId && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-primary hover:text-primary/80 hover:bg-primary/10"
                            onClick={() => router.push(`/brand-dashboard/shelves/marketplace/${request.shelfId}?conversation=${request.conversationId}`)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                          onClick={() => router.push(`/brand-dashboard/shelves/${request._id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : null}
            </TableBody>
          </Table>
          {filteredRequests.length === 0 && !isLoading && (
            <div className="flex items-center justify-center h-[360px]">
              <div className="text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? (language === "ar" ? "لا توجد رفوف مطابقة" : "No matching shelves")
                    : (language === "ar" ? "لا توجد رفوف حالياً" : "No shelves yet")
                  }
                </p>
                {!searchQuery && isBrandDataComplete && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push("/brand-dashboard/shelves/marketplace")}
                  >
                    <Plus className="h-4 w-4 me-2" />
                    {language === "ar" ? "استأجر رفك الأول" : "Rent your first shelf"}
                  </Button>
                )}
              </div>
            </div>
          )}
          </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}