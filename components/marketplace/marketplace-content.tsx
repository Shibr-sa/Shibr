"use client"

import { useState, useCallback, lazy, Suspense, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, ChevronLeft, Store, ChevronRight, Clock, Map as MapIcon, X, Navigation } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLanguage } from "@/contexts/localization-context"
import { useDebounce } from "@/hooks/use-debounce"

// Lazy load the map component to improve initial page load
const StoreMap = lazy(() => import("./store-map"))

// Constants
const ITEMS_PER_PAGE = 9
const STORE_CARD_HEIGHT = "min-h-[240px]"
const DEFAULT_PRICE_RANGE = { min: 0, max: 9000 }

interface MarketplaceContentProps {
  linkPrefix?: string
}

interface Branch {
  _id: string
  branchName: string
  city: string
  address?: string
  latitude?: number
  longitude?: number
  location?: {
    lat: number
    lng: number
    address: string
  }
  ownerName?: string
  ownerImage?: string
  availableShelvesCount: number
  priceRange: {
    min: number
    max: number
  }
  productTypes: string[]
  earliestAvailable: number
  images?: Array<{
    url: string | null
    type: string
    storageId?: string
    order?: number
  }>
  status?: string
  qrCodeUrl?: string
  totalScans?: number
  totalOrders?: number
  totalRevenue?: number
  shelves?: unknown[]
}

export function MarketplaceContent({ linkPrefix = "/marketplace" }: MarketplaceContentProps) {
  const { t, direction } = useLanguage()
  const [locationPermissionAsked, setLocationPermissionAsked] = useState(false)

  // Search and filter states
  const [searchInput, setSearchInput] = useState("")
  const [selectedCity, setSelectedCity] = useState("all")
  const [selectedStoreType, setSelectedStoreType] = useState("all")
  const [priceRange, setPriceRange] = useState(DEFAULT_PRICE_RANGE)
  const [selectedMonth, setSelectedMonth] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [sliderValue, setSliderValue] = useState(100)
  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({})

  // Map modal states
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [selectedBranchInMap, setSelectedBranchInMap] = useState<Branch | null>(null)

  // Debounce search input to avoid too many queries
  const debouncedSearchQuery = useDebounce(searchInput, 500)

  // Get available cities and product types
  const availableCities = useQuery(api.stores.getAvailableCities)
  const availableProductTypes = useQuery(api.stores.getAvailableProductTypes)

  // Fetch branches from Convex with backend pagination
  const branchesData = useQuery(api.branches.getMarketplaceBranches, {
    city: selectedCity !== "all" ? selectedCity : undefined,
    searchQuery: debouncedSearchQuery || undefined,
    minPrice: priceRange.min > 0 ? priceRange.min : undefined,
    maxPrice: priceRange.max < DEFAULT_PRICE_RANGE.max ? priceRange.max : undefined,
    productType: selectedStoreType !== "all" ? selectedStoreType : undefined,
    page: currentPage,
    pageSize: ITEMS_PER_PAGE,
  })

  // Loading states
  const isLoading = branchesData === undefined

  // Calculate price range from branches when data loads
  useEffect(() => {
    if (branchesData && branchesData.branches.length > 0) {
      // Find min and max prices across all branches
      const allPrices = branchesData.branches.flatMap(b => [b.priceRange.min, b.priceRange.max])
      const overallMin = Math.min(...allPrices)
      const overallMax = Math.max(...allPrices)
      setPriceRange({ min: 0, max: overallMax })
      setSliderValue(100)
    }
  }, [branchesData?.branches.length])

  // Extract data from backend response
  const branches = branchesData?.branches || []
  const totalPages = branchesData?.pagination.totalPages || 0
  const totalCount = branchesData?.pagination.totalCount || 0

  // Get price range values
  const minPrice = 0
  const maxPrice = DEFAULT_PRICE_RANGE.max

  // Filter change handlers - reset to page 1 when filters change
  const handleCityChange = useCallback((value: string) => {
    setSelectedCity(value)
    setCurrentPage(1)
  }, [])

  const handleStoreTypeChange = useCallback((value: string) => {
    setSelectedStoreType(value)
    setCurrentPage(1)
  }, [])

  const handleMonthChange = useCallback((value: string) => {
    setSelectedMonth(value)
    setCurrentPage(1)
  }, [])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
    setCurrentPage(1)
  }, [])

  const handleSliderChange = useCallback((value: number) => {
    // Only update visual slider value during drag
    setSliderValue(value)
  }, [])

  const handleSliderCommit = useCallback((value: number) => {
    // Get current price range from branches data
    const currentMaxPrice = branchesData && branchesData.branches.length > 0
      ? Math.max(...branchesData.branches.flatMap(b => [b.priceRange.max]))
      : DEFAULT_PRICE_RANGE.max

    const selectedMax = value === 0
      ? 0
      : Math.round((value / 100) * currentMaxPrice)

    setPriceRange({ min: 0, max: selectedMax })
    setCurrentPage(1)
  }, [branchesData])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    // Scroll to top of store list
    const element = document.querySelector('.store-listings')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  // Request location permission on mount
  useEffect(() => {
    if (!locationPermissionAsked && navigator.geolocation) {
      setLocationPermissionAsked(true)
      // Just trigger the permission request, the map component will handle the result
      navigator.geolocation.getCurrentPosition(
        () => {}, // Success callback - handled in map
        () => {}, // Error callback - handled in map
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    }
  }, [locationPermissionAsked])

  return (
    <div className="space-y-6 pb-8">
      {/* Location Permission Alert */}
      {!locationPermissionAsked && (
        <Alert className="bg-blue-50 border-blue-200">
          <MapPin className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            {t("marketplace.location_prompt") || "Allow location access to see stores near you and get directions"}
          </AlertDescription>
        </Alert>
      )}

      {/* Search Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar - Full Width */}
            <div className="relative">
              <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="search"
                placeholder={t("marketplace.search_placeholder")}
                className="ps-10 h-12"
                value={searchInput}
                onChange={handleSearchChange}
              />
            </div>

            {/* Filters Row: City, Store Type, Month */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* City Filter */}
              <Select value={selectedCity} onValueChange={handleCityChange}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder={t("marketplace.all_cities")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("marketplace.all_cities")}</SelectItem>
                  {availableCities?.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Store Type Filter */}
              <Select value={selectedStoreType} onValueChange={handleStoreTypeChange}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder={t("marketplace.store_type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("marketplace.all_types")}</SelectItem>
                  {availableProductTypes?.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`product_categories.${type}`) || t("common.unknown")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Month/Date Filter */}
              <Select value={selectedMonth} onValueChange={handleMonthChange}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder={t("marketplace.select_month")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("marketplace.all_months")}</SelectItem>
                  <SelectItem value="january">{t("marketplace.january")}</SelectItem>
                  <SelectItem value="february">{t("marketplace.february")}</SelectItem>
                  <SelectItem value="march">{t("marketplace.march")}</SelectItem>
                  <SelectItem value="april">{t("marketplace.april")}</SelectItem>
                  <SelectItem value="may">{t("marketplace.may")}</SelectItem>
                  <SelectItem value="june">{t("marketplace.june")}</SelectItem>
                  <SelectItem value="july">{t("marketplace.july")}</SelectItem>
                  <SelectItem value="august">{t("marketplace.august")}</SelectItem>
                  <SelectItem value="september">{t("marketplace.september")}</SelectItem>
                  <SelectItem value="october">{t("marketplace.october")}</SelectItem>
                  <SelectItem value="november">{t("marketplace.november")}</SelectItem>
                  <SelectItem value="december">{t("marketplace.december")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range Slider - Full Width */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground whitespace-nowrap">{minPrice} {t("common.currency_symbol")}</span>
              <Slider
                value={[sliderValue]}
                onValueChange={(value) => handleSliderChange(value[0])}
                onValueCommit={(value) => handleSliderCommit(value[0])}
                max={100}
                step={1}
                className="flex-1"
                disabled={!branchesData || totalCount === 0}
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">{sliderValue === 0 ? minPrice : minPrice + Math.round((sliderValue / 100) * (maxPrice - minPrice))} {t("common.currency_symbol")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Map Button */}
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMapOpen(true)}
          className="gap-2"
        >
          <MapIcon className="h-4 w-4" />
          {t("marketplace.view_map") || "View Map"}
        </Button>
      </div>

      {/* Store Listings - Full Width */}
      <div className="flex flex-col">
          {/* Stores Container */}
          <div className="flex-1 flex flex-col justify-start store-listings">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="min-h-[240px] rounded-lg" />
                ))}
              </div>
            ) : branches.length === 0 ? (
              <div className="col-span-full flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <Store className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{t("marketplace.no_stores_found")}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {branches.map((branch) => {
                  const allImages = branch.images || []
                  const currentImageIndex = imageIndexes[branch._id] || 0
                  const hasMultipleImages = allImages.length > 1

                  const navigateImage = (delta: number) => {
                    const newIndex = (currentImageIndex + delta + allImages.length) % allImages.length
                    setImageIndexes(prev => ({ ...prev, [branch._id]: newIndex }))
                  }

                  return (
                    <Card
                      key={branch._id}
                      id={`branch-${branch._id}`}
                      className="overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border shadow-lg min-h-[240px]"
                    >
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row min-h-[240px]">
                          {/* Branch Image Gallery */}
                          <div className="w-full sm:w-1/3 h-48 sm:h-auto relative bg-gradient-to-br from-muted/50 to-muted group">
                            {allImages.length > 0 ? (
                              <>
                                <Image
                                  src={allImages[currentImageIndex]?.url || "/placeholder.svg"}
                                  alt={`${branch.branchName} - ${allImages[currentImageIndex]?.type}`}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />

                                {/* Image counter */}
                                {hasMultipleImages && (
                                  <div className="absolute top-2 start-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                                    {currentImageIndex + 1} / {allImages.length}
                                  </div>
                                )}

                                {/* Navigation arrows */}
                                {hasMultipleImages && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        navigateImage(direction === "rtl" ? 1 : -1)
                                      }}
                                      className="absolute start-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                                      aria-label={direction === "rtl" ? "Next image" : "Previous image"}
                                    >
                                      {direction === "rtl" ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        navigateImage(direction === "rtl" ? -1 : 1)
                                      }}
                                      className="absolute end-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                                      aria-label={direction === "rtl" ? "Previous image" : "Next image"}
                                    >
                                      {direction === "rtl" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </button>
                                  </>
                                )}
                              </>
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Store className="h-12 w-12 text-muted-foreground/50" />
                              </div>
                            )}
                          </div>

                          {/* Branch Info */}
                          <Link
                            href={`${linkPrefix}/branch/${branch._id}`}
                            className="flex-1 p-4 flex flex-col hover:bg-muted/30 transition-colors"
                            aria-label={`View shelves for ${branch.branchName}`}
                          >
                            {/* Header with Name and Location */}
                            <div className="mb-3">
                              <h3 className="text-base font-semibold text-foreground mb-1">
                                {branch.branchName}
                              </h3>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" />
                                <span>{branch.city}</span>
                              </div>
                            </div>

                            {/* Key Information Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              {/* Available Shelves */}
                              <div>
                                <p className="text-xs text-muted-foreground mb-0.5">{t("marketplace.available_shelves")}</p>
                                <p className="text-lg font-bold text-primary">
                                  {branch.availableShelvesCount}
                                </p>
                              </div>

                              {/* Price Range */}
                              <div>
                                <p className="text-xs text-muted-foreground mb-0.5">{t("marketplace.price_from")}</p>
                                <p className="text-lg font-bold">
                                  {t("common.currency_symbol")} {branch.priceRange.min.toLocaleString()}
                                </p>
                              </div>

                              {/* Product Types */}
                              <div className="col-span-2">
                                <p className="text-xs text-muted-foreground mb-1">{t("marketplace.product_type")}</p>
                                <div className="flex flex-wrap gap-1">
                                  {branch.productTypes.slice(0, 3).map((type: string) => (
                                    <Badge key={type} variant="secondary" className="text-xs">
                                      {t(`product_categories.${type}`) || type}
                                    </Badge>
                                  ))}
                                  {branch.productTypes.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{branch.productTypes.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Footer with Store Owner */}
                            <div className="flex items-center pt-3 border-t mt-auto">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7">
                                  {branch.ownerImage && <AvatarImage src={branch.ownerImage} alt={branch.ownerName} />}
                                  <AvatarFallback className="text-xs">
                                    {branch.ownerName?.slice(0, 2).toUpperCase() || "SO"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-xs font-medium">{branch.ownerName || "-"}</p>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pagination - Always visible at bottom */}
          <div className="pt-4 mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 || totalPages === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    aria-disabled={currentPage === 1 || totalPages === 0}
                  />
                </PaginationItem>

                {totalPages === 0 ? (
                  // Show single disabled page when no results
                  <PaginationItem>
                    <PaginationLink
                      isActive
                      className="pointer-events-none"
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                ) : (
                  Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })
                )}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <PaginationItem>
                    <span className="px-2">...</span>
                  </PaginationItem>
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages || totalPages === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    aria-disabled={currentPage === totalPages || totalPages === 0}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
      </div>

      {/* Fullscreen Map Modal */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="max-w-full h-screen p-0 rounded-none border-0 gap-0">
          <div className="flex flex-col h-full w-full bg-white">
            {/* Map Header with Close Button */}
            <div className="flex items-center justify-between p-4 border-b bg-white z-10">
              <h2 className="text-lg font-semibold">{t("marketplace.view_map") || "View Map"}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMapOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative">
              <Suspense
                fallback={
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <div className="text-center">
                      <MapIcon className="h-12 w-12 text-primary mx-auto mb-2 animate-pulse" />
                      <p className="text-muted-foreground">{t("common.loading")}...</p>
                    </div>
                  </div>
                }
              >
                {isLoading ? (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Skeleton className="w-full h-full" />
                  </div>
                ) : (
                  <StoreMap
                    key="marketplace-fullscreen-map"
                    stores={branches}
                    selectedStoreId={selectedBranchInMap?._id}
                    onStoreSelect={(data) => {
                      if (typeof data === 'string') {
                        // Only ID is provided in non-fullscreen mode
                        const branch = branches.find(b => b._id === data)
                        if (branch) setSelectedBranchInMap(branch as Branch)
                      } else {
                        // Full branch object in fullscreen mode
                        setSelectedBranchInMap(data as Branch)
                      }
                    }}
                    isFullscreen={true}
                  />
                )}
              </Suspense>

              {/* Current Location Button - Floating */}
              <Button
                variant="default"
                size="icon"
                className="absolute bottom-20 end-4 rounded-full shadow-lg z-20 h-10 w-10"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        // Location obtained - map will handle it
                      },
                      () => {
                        // Error handling
                      }
                    )
                  }
                }}
                title={t("marketplace.use_current_location") || "Use current location"}
              >
                <Navigation className="h-4 w-4" />
              </Button>
            </div>

            {/* Branch Details Panel - Bottom */}
            {selectedBranchInMap && (
              <div className="border-t bg-white p-4 shadow-lg">
                <div className="max-w-full">
                  <h3 className="text-lg font-semibold mb-2">{selectedBranchInMap.branchName}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">{t("marketplace.location")}</p>
                      <p className="font-medium flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {selectedBranchInMap.city}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">{t("marketplace.available_shelves")}</p>
                      <p className="font-semibold text-primary">
                        {selectedBranchInMap.availableShelvesCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">{t("marketplace.price_from")}</p>
                      <p className="font-medium">{t("common.currency_symbol")} {selectedBranchInMap.priceRange.min.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">{t("marketplace.store_owner")}</p>
                      <p className="font-medium">{selectedBranchInMap.ownerName || "-"}</p>
                    </div>
                  </div>
                  <Link
                    href={`${linkPrefix}/branch/${selectedBranchInMap._id}`}
                    className="mt-4 block"
                  >
                    <Button className="w-full">{t("marketplace.view_shelves")}</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}