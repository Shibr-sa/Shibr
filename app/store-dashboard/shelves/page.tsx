"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Package, BarChart3, DollarSign, Eye, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatCurrency } from "@/lib/formatters"
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
import React, { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Id } from "@/convex/_generated/dataModel"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"

// Helper function to get badge variant based on shelf status
function getShelfBadgeVariant(shelf: any): "default" | "secondary" | "outline" {
  // Check if shelf has active rental (instead of checking status === "rented")
  if (shelf.isAvailable === false) {
    return "default"
  } else if (shelf.status === "approved" && shelf.isAvailable) {
    return "secondary"
  } else if (shelf.status === "pending") {
    return "outline"
  }
  return "secondary"
}

export default function StoreDashboardShelvesPage() {
  const { t, language, direction } = useLanguage()
  const { isLoading: storeLoading, isStoreDataComplete } = useStoreData()
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [statsPeriod, setStatsPeriod] = useState("monthly")
  const [currentPage, setCurrentPage] = useState(1)
  const router = useRouter()
  const { user } = useCurrentUser()
  
  const itemsPerPage = 5
  
  // Fetch real shelves data from Convex
  const shelves = useQuery(api.shelves.getOwnerShelves, 
    user?.id ? { ownerId: user.id as Id<"users"> } : "skip"
  )
  
  // Fetch shelf statistics with percentage changes
  const shelfStats = useQuery(api.shelves.getShelfStatsWithChanges,
    user?.id ? { ownerId: user.id as Id<"users">, period: statsPeriod as "daily" | "weekly" | "monthly" | "yearly" } : "skip"
  )

  // Filter options - order them based on direction
  const filterOptions = [
    { value: "all", label: t("shelves.all_filter") },
    { value: "rented", label: t("shelves.rented_shelves_filter") },
    { value: "available", label: t("shelves.available_shelves_filter") }
  ]
  
  // Reverse for RTL to show "All" first from the right
  const orderedFilters = direction === "rtl" ? [...filterOptions].reverse() : filterOptions
  
  // Filter and search shelves
  const filteredShelves = useMemo(() => {
    if (!shelves) return []
    
    let filtered = [...shelves]
    
    // Apply status filter
    if (filter === "rented") {
      // Check for shelves that are not available (meaning they're rented)
      filtered = filtered.filter(shelf => shelf.isAvailable === false)
    } else if (filter === "available") {
      filtered = filtered.filter(shelf => shelf.status === "approved" && shelf.isAvailable)
    }
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(shelf => 
        shelf.shelfName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shelf.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shelf.branch.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return filtered
  }, [shelves, filter, searchQuery])
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredShelves.length / itemsPerPage)
  const paginatedShelves = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredShelves.slice(startIndex, endIndex)
  }, [filteredShelves, currentPage])
  
  // Create empty rows for consistent table height
  const emptyRows = itemsPerPage - paginatedShelves.length
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, searchQuery])
  
  // Loading state
  const isLoading = storeLoading || !shelves || !shelfStats

  // Get percentage changes from real data
  const getPercentageChange = (metric: string) => {
    if (!shelfStats) return 0
    
    switch (metric) {
      case "rented":
        return shelfStats.rentedChange || 0
      case "revenue":
        return shelfStats.revenueChange || 0
      case "available":
        return shelfStats.availableChange || 0
      default:
        return 0
    }
  }

  // Format percentage display
  const formatPercentage = (value: number) => {
    const sign = value > 0 ? "+" : ""
    return `${sign}${Math.abs(value).toFixed(1)}%`
  }

  // Get trend icon and color
  const getTrendInfo = (value: number) => {
    if (value > 0) {
      return {
        icon: TrendingUp,
        className: "text-green-600",
        bgClassName: "bg-green-100"
      }
    } else if (value < 0) {
      return {
        icon: TrendingDown,
        className: "text-red-600",
        bgClassName: "bg-red-100"
      }
    }
    return {
      icon: null,
      className: "text-gray-600",
      bgClassName: "bg-gray-100"
    }
  }

  // Time period labels
  const periodLabels = {
    daily: t("period.daily"),
    weekly: t("period.weekly"),
    monthly: t("period.monthly"),
    yearly: t("period.yearly")
  }

  return (
    <div className="space-y-6">
      {/* Statistics Section with Time Period Selector */}
      <Card>
        <CardContent className="p-6">
          {/* Header with Time Period Selector */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">
                {t("store.your_statistics")}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("shelves.manage_description")}
              </p>
            </div>
            <Tabs value={statsPeriod} onValueChange={setStatsPeriod}>
              <TabsList className="flex w-[400px]">
                <TabsTrigger value="daily" className="flex-1">
                  {periodLabels.daily}
                </TabsTrigger>
                <TabsTrigger value="weekly" className="flex-1">
                  {periodLabels.weekly}
                </TabsTrigger>
                <TabsTrigger value="monthly" className="flex-1">
                  {periodLabels.monthly}
                </TabsTrigger>
                <TabsTrigger value="yearly" className="flex-1">
                  {periodLabels.yearly}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Statistics Cards Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Rented Shelves Card */}
            <StatCard
              title={t("shelves.total_rented_shelves")}
              value={shelfStats?.rentedShelves || 0}
              trend={{
                value: getPercentageChange("rented"),
                label: `${t("time.from")} ${
                  statsPeriod === "daily" ? t("time.yesterday") :
                  statsPeriod === "weekly" ? t("time.last_week") :
                  statsPeriod === "monthly" ? t("time.last_month") :
                  t("time.last_year")
                }`
              }}
              icon={<Package className="h-5 w-5 text-primary" />}
            />

            {/* Revenue Card */}
            <StatCard
              title={t("shelves.total_sales")}
              value={formatCurrency(shelfStats?.totalRevenue || 0, language)}
              trend={{
                value: getPercentageChange("revenue"),
                label: `${t("time.from")} ${
                  statsPeriod === "daily" ? t("time.yesterday") :
                  statsPeriod === "weekly" ? t("time.last_week") :
                  statsPeriod === "monthly" ? t("time.last_month") :
                  t("time.last_year")
                }`
              }}
              icon={<BarChart3 className="h-5 w-5 text-primary" />}
            />

            {/* Available Shelves Card */}
            <StatCard
              title={t("shelves.available_shelves")}
              value={shelfStats?.availableShelves || 0}
              trend={{
                value: getPercentageChange("available"),
                label: `${t("time.from")} ${
                  statsPeriod === "daily" ? t("time.yesterday") :
                  statsPeriod === "weekly" ? t("time.last_week") :
                  statsPeriod === "monthly" ? t("time.last_month") :
                  t("time.last_year")
                }`
              }}
              icon={<DollarSign className="h-5 w-5 text-primary" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Content Card */}
      <Card>
        <CardContent className="p-6">
          {/* Title and Description Section */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">{t("shelves.your_shelves")}</h2>
              <p className="text-muted-foreground">
                {t("shelves.manage_description")}
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button 
                      className="gap-2"
                      disabled={isLoading || !isStoreDataComplete}
                      onClick={() => router.push("/store-dashboard/shelves/new")}
                    >
                      <Plus className="h-4 w-4" />
                      {t("shelves.display_shelf_now")}
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
          {/* Search and Filter */}
          <div className="flex items-center justify-between mb-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={t("shelves.search_placeholder")}
                className="ps-10 w-80"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Pills */}
            <RadioGroup value={filter} onValueChange={setFilter} className="flex items-center gap-4">
              {orderedFilters.map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <RadioGroupItem 
                    value={option.value} 
                    id={option.value} 
                    className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                  />
                  <Label htmlFor={option.value} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Table */}
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
                    // Show 5 skeleton rows while loading
                    Array.from({ length: itemsPerPage }).map((_, index) => (
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
                  ) : paginatedShelves.length === 0 && currentPage === 1 ? (
                    // Show empty state only on first page with no data
                    Array.from({ length: itemsPerPage }).map((_, index) => (
                      <TableRow key={`empty-${index}`} className="h-[72px]">
                        {index === 2 ? (
                          <TableCell colSpan={7} className="text-center">
                            {t("shelves.no_shelves_found")}
                          </TableCell>
                        ) : (
                          <TableCell colSpan={7}>&nbsp;</TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <>
                      {paginatedShelves.map((shelf) => (
                        <TableRow 
                          key={shelf._id}
                          className="h-[72px]"
                        >
                          <TableCell className="font-medium">{shelf.shelfName}</TableCell>
                          <TableCell>{shelf.branch}</TableCell>
                          <TableCell>
                            {!shelf.isAvailable && shelf.renterName ? 
                              shelf.renterName : 
                              "-"
                            }
                          </TableCell>
                          <TableCell>
                            {formatCurrency(shelf.monthlyPrice || 0, language)} / {t("common.monthly")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getShelfBadgeVariant(shelf)}>
                              {!shelf.isAvailable 
                                ? t("shelves.status.rented")
                                : shelf.status === "approved" && shelf.isAvailable
                                ? t("shelves.status.available")
                                : shelf.status === "pending_approval"
                                ? t("shelves.status.pending")
                                : t("shelves.status.unavailable")
                              }
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {shelf.nextCollectionDate ? 
                              format(new Date(shelf.nextCollectionDate), "dd/MM/yyyy") : 
                              "-"
                            }
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    disabled={isLoading || !isStoreDataComplete}
                                    onClick={() => router.push(`/store-dashboard/shelves/${shelf._id}`)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{!isStoreDataComplete && !isLoading ? t("dashboard.complete_profile_first") : t("store.view_details")}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Add empty rows to maintain fixed height */}
                      {emptyRows > 0 && Array.from({ length: emptyRows }).map((_, index) => (
                        <TableRow key={`empty-${index}`} className="h-[72px]">
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
    </div>
  )
}