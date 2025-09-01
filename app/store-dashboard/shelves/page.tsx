"use client"

import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Package, BarChart3, DollarSign, Eye, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Inbox } from "lucide-react"
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
import { useDebouncedValue } from "@/hooks/useDebouncedValue"

// Helper function to get badge variant based on shelf status
function getShelfBadgeVariant(shelf: any): "default" | "secondary" | "outline" {
  // Check if shelf has active rental
  if (shelf.isAvailable === false) {
    return "default"
  } else if (shelf.status === "active" && shelf.isAvailable) {
    return "secondary"
  } else if (shelf.status === "suspended") {
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
  const [hasInitialData, setHasInitialData] = useState(false)
  const router = useRouter()
  const { user } = useCurrentUser()
  
  const itemsPerPage = 5
  
  // Debounced search value for better performance
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)
  
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
      filtered = filtered.filter(shelf => shelf.status === "active" && shelf.isAvailable)
    }
    
    // Apply search filter with debounced value
    if (debouncedSearchQuery) {
      filtered = filtered.filter(shelf => 
        shelf.shelfName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        shelf.city.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        shelf.storeBranch.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      )
    }
    
    return filtered
  }, [shelves, filter, debouncedSearchQuery])
  
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
  }, [filter, debouncedSearchQuery])
  
  // Track when we have received initial data
  useEffect(() => {
    if (shelves !== undefined && shelfStats !== undefined && !hasInitialData) {
      setHasInitialData(true)
    }
  }, [shelves, shelfStats, hasInitialData])
  
  // Check if search is in progress (user typed but debounce hasn't fired yet)
  const isSearching = searchQuery !== debouncedSearchQuery
  
  // Loading state - only show skeleton on initial load
  const isLoading = !hasInitialData && (storeLoading || shelves === undefined || shelfStats === undefined)

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
      {/* Header with Time Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t("shelves.statistics_title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("shelves.statistics_description")}
          </p>
        </div>
            <Tabs value={statsPeriod} onValueChange={setStatsPeriod}>
              <TabsList>
                <TabsTrigger value="daily">
                  {periodLabels.daily}
                </TabsTrigger>
                <TabsTrigger value="weekly">
                  {periodLabels.weekly}
                </TabsTrigger>
                <TabsTrigger value="monthly">
                  {periodLabels.monthly}
                </TabsTrigger>
                <TabsTrigger value="yearly">
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

      {/* Shelves Section */}
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">{t("shelves.your_shelves")}</h2>
              <p className="text-sm text-muted-foreground mt-1">
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
        <div className="flex items-center justify-between mb-4">
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
        <div className="rounded-md border">
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
                  {isLoading || isSearching ? (
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
                  ) : paginatedShelves.length === 0 ? (
                    // Empty state
                    <TableRow>
                      <TableCell colSpan={7} className="h-[360px] text-center">
                        <div className="flex h-full w-full items-center justify-center">
                          <div className="flex flex-col items-center gap-1 py-10">
                            <Inbox className="h-10 w-10 text-muted-foreground/40 mb-2" />
                            <h3 className="font-medium">
                              {debouncedSearchQuery || filter !== "all" ? t("common.no_results") : t("shelves.no_shelves_found")}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {debouncedSearchQuery || filter !== "all" ? t("common.try_different_search") : t("shelves.shelves_will_appear_here")}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {paginatedShelves.map((shelf) => (
                        <TableRow 
                          key={shelf._id}
                          className="h-[72px]"
                        >
                          <TableCell className="font-medium">{shelf.shelfName}</TableCell>
                          <TableCell>{shelf.storeBranch}</TableCell>
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
                                : shelf.status === "active" && shelf.isAvailable
                                ? t("shelves.status.available")
                                : shelf.status === "suspended"
                                ? t("shelves.status.suspended")
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
                        <TableRow key={`empty-${index}`} className="h-[72px] border-0">
                          <TableCell colSpan={7}>&nbsp;</TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                </TableBody>
              </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-end">
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
      </div>
    </div>
  )
}