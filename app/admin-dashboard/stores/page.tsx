"use client"

import { useState, useEffect } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useLanguage } from "@/contexts/localization-context"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { Card, CardContent } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, Eye, Store, DollarSign, Package } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export default function StoresPage() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ${t("common.currency")}`
  }

  // Helper function to translate city names
  const translateCity = (cityName: string) => {
    if (!cityName) return "-"
    const cityKey = `city.${cityName.toLowerCase()}`
    return t(cityKey) !== cityKey ? t(cityKey) : cityName
  }

  // Helper function to translate shelf names
  const translateShelfName = (shelfName: string) => {
    if (!shelfName) return "-"
    // Convert "Front Display" to "front_display"
    const shelfKey = `shelf_name.${shelfName.toLowerCase().replace(/\s+/g, '_')}`
    return t(shelfKey) !== shelfKey ? t(shelfKey) : shelfName
  }

  // Initialize state from URL params for persistence
  const [timePeriod, setTimePeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">(
    (searchParams.get("period") as "daily" | "weekly" | "monthly" | "yearly") || "monthly"
  )
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "stores")
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  
  // Posts section state
  const [filterStatus, setFilterStatus] = useState(searchParams.get("postStatus") || "all")
  const [postsSearchQuery, setPostsSearchQuery] = useState(searchParams.get("postSearch") || "")
  const [postsCurrentPage, setPostsCurrentPage] = useState(Number(searchParams.get("postPage")) || 1)
  
  // Track if we've loaded initial data
  const [hasInitialStoresData, setHasInitialStoresData] = useState(false)
  const [hasInitialPostsData, setHasInitialPostsData] = useState(false)
  
  // Debounced search values for better performance
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)
  const debouncedPostsSearchQuery = useDebouncedValue(postsSearchQuery, 300)
  
  const itemsPerPage = 5
  
  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (activeTab !== "stores") params.set("tab", activeTab)
    if (searchQuery) params.set("search", searchQuery)
    if (timePeriod !== "monthly") params.set("period", timePeriod)
    if (currentPage > 1) params.set("page", String(currentPage))
    if (postsSearchQuery) params.set("postSearch", postsSearchQuery)
    if (filterStatus !== "all") params.set("postStatus", filterStatus)
    if (postsCurrentPage > 1) params.set("postPage", String(postsCurrentPage))
    
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(newUrl, { scroll: false })
  }, [activeTab, searchQuery, timePeriod, currentPage, postsSearchQuery, filterStatus, postsCurrentPage, pathname, router])
  
  // Fetch stats data with time period
  const statsResult = useQuery(api.admin.stores.getStores, {
    searchQuery: "",
    page: 1,
    limit: 1, // We only need stats, not items
    timePeriod,
  })
  
  // Fetch stores table data with debounced search
  const storesResult = useQuery(api.admin.stores.getStores, {
    searchQuery: debouncedSearchQuery, // Use debounced value for API call
    page: currentPage,
    limit: itemsPerPage,
    // Don't pass timePeriod for table data
  })
  
  const stores = storesResult?.items || []
  
  // Check if search is in progress (user typed but debounce hasn't fired yet)
  const isSearching = searchQuery !== debouncedSearchQuery
  
  // Track when we have initial data
  useEffect(() => {
    if (storesResult !== undefined && !hasInitialStoresData) {
      setHasInitialStoresData(true)
    }
  }, [storesResult, hasInitialStoresData])
  
  // Fetch posts data with debounced search
  const postsResult = useQuery(api.admin.platform.getPosts, {
    searchQuery: debouncedPostsSearchQuery, // Use debounced value for API call
    status: filterStatus,
    page: postsCurrentPage,
    limit: itemsPerPage,
  })
  
  // Check if posts search is in progress
  const isPostsSearching = postsSearchQuery !== debouncedPostsSearchQuery
  
  const postsData = postsResult?.items || []
  const postsTotalPages = postsResult?.totalPages || 1
  
  // Track when we have initial posts data
  useEffect(() => {
    if (postsResult !== undefined && !hasInitialPostsData) {
      setHasInitialPostsData(true)
    }
  }, [postsResult, hasInitialPostsData])

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "under_review":
        return "secondary"
      case "suspended":
        return "destructive"
      default:
        return "outline"
    }
  }

  const totalPages = storesResult?.totalPages || 1

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t("stores.title")}</h2>
          <p className="text-muted-foreground mt-1">{t("stores.description")}</p>
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {statsResult === undefined ? (
          <>
            <Card className="bg-muted/50 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{t("stores.total_stores")}</p>
                    <Skeleton className="h-[30px] w-24 mt-1" />
                    <Skeleton className="h-[16px] w-32 mt-1" />
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{t("stores.total_shelves")}</p>
                    <Skeleton className="h-[30px] w-24 mt-1" />
                    <Skeleton className="h-[16px] w-32 mt-1" />
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{t("dashboard.total_revenue")}</p>
                    <Skeleton className="h-[30px] w-24 mt-1" />
                    <Skeleton className="h-[16px] w-32 mt-1" />
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <StatCard
              title={t("stores.total_stores")}
              value={statsResult.stats?.totalStores || 0}
              trend={{
                value: statsResult.stats?.totalChange || 0,
                label: timePeriod === "daily" ? t("dashboard.from_yesterday") : 
                       timePeriod === "weekly" ? t("dashboard.from_last_week") :
                       timePeriod === "yearly" ? t("dashboard.from_last_year") :
                       t("dashboard.from_last_month")
              }}
              icon={<Store className="h-5 w-5 text-primary" />}
            />

            <StatCard
              title={t("stores.total_shelves")}
              value={statsResult.stats?.totalShelves || 0}
              trend={{
                value: statsResult.stats?.shelvesChange || 0,
                label: timePeriod === "daily" ? t("dashboard.from_yesterday") : 
                       timePeriod === "weekly" ? t("dashboard.from_last_week") :
                       timePeriod === "yearly" ? t("dashboard.from_last_year") :
                       t("dashboard.from_last_month")
              }}
              icon={<Package className="h-5 w-5 text-primary" />}
            />

            <StatCard
              title={t("dashboard.total_revenue")}
              value={formatCurrency(statsResult.stats?.totalRevenue || 0)}
              trend={{
                value: statsResult.stats?.revenueChange || 0,
                label: timePeriod === "daily" ? t("dashboard.from_yesterday") : 
                       timePeriod === "weekly" ? t("dashboard.from_last_week") :
                       timePeriod === "yearly" ? t("dashboard.from_last_year") :
                       t("dashboard.from_last_month")
              }}
              icon={<DollarSign className="h-5 w-5 text-primary" />}
            />
          </>
        )}
      </div>

      {/* Tables Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Tab Header with Search */}
        <div className="flex items-center justify-between">
          <TabsList className="grid w-auto grid-cols-2">
            <TabsTrigger value="stores">{t("stores.stores_tab")}</TabsTrigger>
            <TabsTrigger value="posts">{t("posts.shelves_tab")}</TabsTrigger>
          </TabsList>
          
          {/* Dynamic Search Bar based on active tab */}
          {activeTab === "stores" ? (
            <div className="relative w-full sm:w-80">
              <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t("stores.search_placeholder")}
                className="pe-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1) // Reset to first page on search
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {/* Filter Pills */}
              <ToggleGroup 
                type="single" 
                value={filterStatus}
                onValueChange={(value) => {
                  if (value) {
                    setFilterStatus(value)
                    setPostsCurrentPage(1)
                  }
                }}
                className="justify-start"
              >
                <ToggleGroupItem value="all" aria-label="Show all posts">
                  {t("posts.filter_all")}
                </ToggleGroupItem>
                <ToggleGroupItem value="rented" aria-label="Show rented posts">
                  {t("posts.status.rented")}
                </ToggleGroupItem>
                <ToggleGroupItem value="published" aria-label="Show published posts">
                  {t("posts.status.published")}
                </ToggleGroupItem>
              </ToggleGroup>
              
              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t("posts.search_placeholder")}
                  className="pe-10"
                  value={postsSearchQuery}
                  onChange={(e) => {
                    setPostsSearchQuery(e.target.value)
                    setPostsCurrentPage(1) // Reset to first page on search
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Stores Tab Content */}
        <TabsContent value="stores" className="space-y-6">

          {/* Stores Table */}
        <div className="rounded-md border overflow-x-auto">
        <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="h-12 text-start font-medium">
                      {t("stores.table.store")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium hidden lg:table-cell">
                      {t("stores.table.shelves")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium hidden md:table-cell">
                      {t("stores.table.rentals")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("stores.table.status")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("dashboard.options")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!hasInitialStoresData || storesResult === undefined || isSearching ? (
                    // Loading state - show skeletons
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`loading-${index}`} className="h-[72px]">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                        </TableCell>
                        <TableCell className="py-3 hidden lg:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
                        <TableCell className="py-3 hidden md:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-8 w-8 rounded" /></TableCell>
                      </TableRow>
                    ))
                  ) : stores.length > 0 ? (
                    // Data state - show actual stores with fillers
                    <>
                      {stores.map((store) => (
                        <TableRow
                          key={store.id}
                          className="h-[72px]"
                        >
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={store.profileImageUrl || undefined} alt={store.name} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {store.name ? store.name.charAt(0).toUpperCase() : "S"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="font-medium">{store.name}</div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 text-muted-foreground hidden lg:table-cell">{store.shelves}</TableCell>
                          <TableCell className="py-3 text-muted-foreground hidden md:table-cell">{store.rentals}</TableCell>
                          <TableCell className="py-3">
                            <Badge variant={getStatusVariant(store.status)} className="font-normal">
                              {t(`stores.status.${store.status}`) || t("common.unknown")}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => router.push(`/admin-dashboard/stores/${store.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Fill remaining rows to always show 5 rows */}
                      {stores.length < 5 && Array.from({ length: 5 - stores.length }).map((_, index) => (
                        <TableRow key={`filler-${index}`} className="h-[72px]">
                          <TableCell className="py-3" colSpan={5}></TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : (
                    // Empty state - centered view with fixed height
                    <TableRow>
                      <TableCell colSpan={5} className="h-[360px] text-center">
                        <div className="flex h-full w-full items-center justify-center">
                          <div className="flex flex-col items-center gap-1 py-10">
                            <Store className="h-10 w-10 text-muted-foreground/40 mb-2" />
                            <h3 className="font-medium">
                              {searchQuery ? t("stores.no_results") : t("stores.no_stores")}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {searchQuery ? t("stores.try_different_search") : t("stores.stores_will_appear_here")}
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
                                {t("common.clear_search")}
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
        </TabsContent>

        {/* Posts Tab Content */}
        <TabsContent value="posts" className="space-y-6">
          {/* Posts Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="h-12 text-start font-medium hidden md:table-cell">
                  {t("dashboard.store_name")}
                </TableHead>
                <TableHead className="h-12 text-start font-medium hidden md:table-cell">
                  {t("dashboard.branch")}
                </TableHead>
                <TableHead className="h-12 text-start font-medium">
                  {t("dashboard.shelf_name")}
                </TableHead>
                <TableHead className="h-12 text-start font-medium hidden lg:table-cell">
                  {t("posts.table.percentage")}
                </TableHead>
                <TableHead className="h-12 text-start font-medium hidden lg:table-cell">
                  {t("dashboard.date_added")}
                </TableHead>
                <TableHead className="h-12 text-start font-medium">
                  {t("dashboard.status")}
                </TableHead>
                <TableHead className="h-12 text-start font-medium">
                  {t("dashboard.options")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!hasInitialPostsData || postsResult === undefined || isPostsSearching ? (
                // Loading state - show skeletons
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`loading-${index}`} className="h-[72px]">
                    <TableCell className="py-3 hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="py-3 hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="py-3 hidden lg:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell className="py-3 hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="py-3"><Skeleton className="h-8 w-8 rounded" /></TableCell>
                  </TableRow>
                ))
              ) : postsData.length > 0 ? (
                // Data state - show actual posts with fillers
                <>
                  {postsData.map((post) => (
                    <TableRow 
                      key={post.id} 
                      className="h-[72px]"
                    >
                      <TableCell className="py-3 font-medium hidden md:table-cell">
                        {post.storeName}
                      </TableCell>
                      <TableCell className="py-3 text-muted-foreground hidden md:table-cell">
                        {translateCity(post.branch)}
                      </TableCell>
                      <TableCell className="py-3 font-medium">
                        {translateShelfName(post.shelfName)}
                      </TableCell>
                      <TableCell className="py-3 hidden lg:table-cell">
                        <span className="font-medium">{post.percentage}%</span>
                      </TableCell>
                      <TableCell className="py-3 text-muted-foreground hidden lg:table-cell">
                        {post.addedDate ? new Date(post.addedDate).toLocaleDateString("en-US") : "-"}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant={post.status === "published" ? "default" : "secondary"} className="font-normal">
                          {t(`posts.status.${post.status}`) || t("common.unknown")}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => {
                            // Navigate to shelf details page under the store
                            router.push(`/admin-dashboard/stores/${post.storeId}/${post.id}`)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Fill remaining rows to always show 5 rows */}
                  {postsData.length < 5 && Array.from({ length: 5 - postsData.length }).map((_, index) => (
                    <TableRow key={`filler-${index}`} className="h-[72px]">
                      <TableCell className="py-3" colSpan={7}></TableCell>
                    </TableRow>
                  ))}
                </>
              ) : (
                // Empty state - centered view with fixed height
                <TableRow>
                  <TableCell colSpan={7} className="h-[360px] text-center">
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="flex flex-col items-center gap-1 py-10">
                        <Package className="h-10 w-10 text-muted-foreground/40 mb-2" />
                        <h3 className="font-medium">
                          {postsSearchQuery || filterStatus !== "all" 
                            ? t("posts.no_results")
                            : t("posts.no_posts")}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {postsSearchQuery || filterStatus !== "all"
                            ? t("posts.try_different_filter")
                            : t("posts.posts_will_appear_here")}
                        </p>
                        {(postsSearchQuery || filterStatus !== "all") && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="mt-4"
                            onClick={() => {
                              setPostsSearchQuery("")
                              setFilterStatus("all")
                            }}
                          >
                            {t("posts.clear_filters")}
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

        {/* Posts Pagination Controls */}
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setPostsCurrentPage(prev => Math.max(1, prev - 1))}
                className={cn(
                  "cursor-pointer",
                  (postsCurrentPage === 1 || postsTotalPages === 0) && "pointer-events-none opacity-50"
                )}
                aria-disabled={postsCurrentPage === 1 || postsTotalPages === 0}
              >
                {t("common.previous")}
              </PaginationPrevious>
            </PaginationItem>
            
            {postsTotalPages > 0 ? (
              Array.from({ length: Math.min(5, postsTotalPages) }, (_, i) => {
                let page;
                if (postsTotalPages <= 5) {
                  page = i + 1;
                } else if (postsCurrentPage <= 3) {
                  page = i + 1;
                } else if (postsCurrentPage >= postsTotalPages - 2) {
                  page = postsTotalPages - 4 + i;
                } else {
                  page = postsCurrentPage - 2 + i;
                }
                return page;
              }).map(page => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setPostsCurrentPage(page)}
                    isActive={postsCurrentPage === page}
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
                onClick={() => setPostsCurrentPage(prev => Math.min(postsTotalPages, prev + 1))}
                className={cn(
                  "cursor-pointer",
                  (postsCurrentPage === postsTotalPages || postsTotalPages <= 1) && "pointer-events-none opacity-50"
                )}
                aria-disabled={postsCurrentPage === postsTotalPages || postsTotalPages <= 1}
              >
                {t("common.next")}
              </PaginationNext>
            </PaginationItem>
          </PaginationContent>
          </Pagination>
        </TabsContent>
      </Tabs>

    </div>
  )
}