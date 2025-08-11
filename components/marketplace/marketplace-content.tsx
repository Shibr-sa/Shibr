"use client"

import { useState, useMemo, useCallback, lazy, Suspense, useEffect } from "react"
import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, ChevronLeft, ChevronRight, Store, Loader2, Package, Ruler, Calendar, Check } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLanguage } from "@/contexts/language-context"
import { useDebounce } from "@/hooks/use-debounce"

// Lazy load the map component to improve initial page load
const StoreMap = lazy(() => import("./store-map"))

// Constants
const ITEMS_PER_PAGE = 3
const STORE_CARD_HEIGHT = "h-[240px]"
const STORE_CARD_GAP = "mb-4"
const DEFAULT_PRICE_RANGE = { min: 0, max: 9000 }

interface MarketplaceContentProps {
  linkPrefix?: string
}

interface Store {
  _id: string
  shelfName: string
  city: string
  branch: string
  address?: string
  latitude?: number
  longitude?: number
  monthlyPrice: number
  discountPercentage: number
  availableFrom: string
  productType?: string
  width: string
  length: string
  depth: string
  ownerName?: string
  shelfImage?: string
}

export function MarketplaceContent({ linkPrefix = "/marketplace" }: MarketplaceContentProps) {
  const { t, direction } = useLanguage()

  // Search and filter states
  const [searchInput, setSearchInput] = useState("")
  const [selectedCity, setSelectedCity] = useState("all")
  const [selectedArea, setSelectedArea] = useState("all")
  const [selectedStoreType, setSelectedStoreType] = useState("all")
  const [priceRange, setPriceRange] = useState(DEFAULT_PRICE_RANGE)
  const [selectedMonth, setSelectedMonth] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [sliderValue, setSliderValue] = useState(100) // Visual slider position
  const [committedSliderValue, setCommittedSliderValue] = useState(100) // Actual filter value
  const [previousStores, setPreviousStores] = useState<Store[] | undefined>(undefined) // Cache previous results

  // Get available cities and price range from stores first
  const availableCities = useQuery(api.stores.getAvailableCities)
  const availableProductTypes = useQuery(api.stores.getAvailableProductTypes)
  
  // Get price range based on current filters (excluding price itself)
  const priceRangeData = useQuery(api.stores.getPriceRange, {
    city: selectedCity !== "all" ? selectedCity : undefined,
    area: selectedArea !== "all" ? selectedArea : undefined,
    productType: selectedStoreType !== "all" ? selectedStoreType : undefined,
    searchQuery: searchInput || undefined,
    month: selectedMonth !== "all" ? selectedMonth : undefined,
  })

  // Debounce search input to avoid too many queries
  const debouncedSearchQuery = useDebounce(searchInput, 500)

  // Fetch stores from Convex (using committed price range, not debounced)
  const storesQuery = useQuery(api.stores.getMarketplaceStores, {
    city: selectedCity !== "all" ? selectedCity : undefined,
    area: selectedArea !== "all" ? selectedArea : undefined,
    searchQuery: debouncedSearchQuery || undefined,
    minPrice: priceRange.min > 0 ? priceRange.min : undefined,
    maxPrice: priceRange.max < (priceRangeData?.max || 9000) ? priceRange.max : undefined,
    productType: selectedStoreType !== "all" ? selectedStoreType : undefined,
    month: selectedMonth !== "all" ? selectedMonth : undefined,
  }) as Store[] | undefined

  // Use previous stores while loading new ones to prevent flickering
  const stores = storesQuery !== undefined ? storesQuery : previousStores

  // Update previous stores when we get new data
  useEffect(() => {
    if (storesQuery !== undefined) {
      setPreviousStores(storesQuery)
    }
  }, [storesQuery])

  // Separate loading state for initial load vs filter updates
  const isInitialLoading = stores === undefined && previousStores === undefined
  const isFilterLoading = storesQuery === undefined && previousStores !== undefined

  // Update price range when data loads or filters change
  useEffect(() => {
    if (priceRangeData) {
      // Reset to show full range when filters change
      setPriceRange({ min: 0, max: priceRangeData.max })
      setSliderValue(100) // Reset visual slider
      setCommittedSliderValue(100) // Reset committed value
    }
  }, [priceRangeData?.min, priceRangeData?.max])

  // Get actual min/max prices
  const minPrice = priceRangeData?.min || 0
  const maxPrice = priceRangeData?.max || 9000

  // Pagination calculation - moved before usage
  const { totalPages, currentStores } = useMemo(() => {
    if (!stores) return { totalPages: 0, currentStores: [] }
    
    const total = Math.ceil(stores.length / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    const current = stores.slice(startIndex, endIndex)
    
    return { totalPages: total, currentStores: current }
  }, [stores, currentPage])

  // Reset to first page when filters change
  const handleCityChange = useCallback((value: string) => {
    setSelectedCity(value)
    setCurrentPage(1)
  }, [])

  const handleAreaChange = useCallback((value: string) => {
    setSelectedArea(value)
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
    // Commit the actual filter value when user releases the slider
    const minPrice = priceRangeData?.min || 0
    const maxPrice = priceRangeData?.max || 9000
    
    // When slider is at 0%, we want to show only the minimum price
    // When slider is at 100%, we want to show the full range
    let selectedMax: number
    if (value === 0) {
      selectedMax = minPrice // Show only items at minimum price
    } else {
      const range = maxPrice - minPrice
      selectedMax = minPrice + Math.round((value / 100) * range)
    }
    
    setPriceRange({ min: 0, max: selectedMax })
    setCommittedSliderValue(value)
    setCurrentPage(1)
  }, [priceRangeData])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    // Scroll to top of store list
    const element = document.querySelector('.store-listings')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  return (
    <div className="space-y-6 pb-8">
      {/* Search Filters */}
      <Card className="relative">
        {isFilterLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Search Input */}
            <div className="lg:col-span-2">
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
            </div>

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

            {/* Area Filter */}
            <Select value={selectedArea} onValueChange={handleAreaChange}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder={t("marketplace.all_areas")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("marketplace.all_areas")}</SelectItem>
                <SelectItem value="north">{t("marketplace.north")}</SelectItem>
                <SelectItem value="south">{t("marketplace.south")}</SelectItem>
                <SelectItem value="east">{t("marketplace.east")}</SelectItem>
                <SelectItem value="west">{t("marketplace.west")}</SelectItem>
                <SelectItem value="center">{t("marketplace.center")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
            {/* Price Range */}
            <div className="lg:col-span-2 flex items-center h-12">
              <div className={`flex items-center gap-4 w-full ${(!priceRangeData || !stores || stores.length === 0) ? 'opacity-50 pointer-events-none' : ''}`}>
                <span className="text-sm text-muted-foreground">{minPrice} {t("common.currency_symbol")}</span>
                <Slider
                  value={[sliderValue]}
                  onValueChange={(value) => handleSliderChange(value[0])}
                  onValueCommit={(value) => handleSliderCommit(value[0])}
                  max={100}
                  step={1}
                  className="flex-1"
                  disabled={!priceRangeData || !stores || stores.length === 0}
                />
                <span className="text-sm text-muted-foreground ms-2">{sliderValue === 0 ? minPrice : minPrice + Math.round((sliderValue / 100) * (maxPrice - minPrice))} {t("common.currency_symbol")}</span>
              </div>
            </div>

            {/* Store Type Filter */}
            <Select value={selectedStoreType} onValueChange={handleStoreTypeChange}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder={t("marketplace.store_type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("marketplace.all_types")}</SelectItem>
                {availableProductTypes?.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
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
        </CardContent>
      </Card>

      {/* Content Grid - Fixed Height Layout */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6" style={{ height: 'calc(100vh - 280px)', minHeight: '760px' }}>
        {/* Map Section - Fixed on Left */}
        <div className="order-2 lg:order-1 h-full">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              <Suspense 
                fallback={
                  <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 text-primary mx-auto mb-2 animate-pulse" />
                      <p className="text-muted-foreground">{t("common.loading")}...</p>
                    </div>
                  </div>
                }
              >
                {isInitialLoading ? (
                  <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                    <Skeleton className="w-full h-full" />
                  </div>
                ) : (
                  <StoreMap 
                    key="marketplace-map"
                    stores={currentStores || []}
                    onStoreSelect={(storeId) => {
                      // Scroll to the selected store in the list
                      const element = document.getElementById(`store-${storeId}`)
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }
                    }}
                  />
                )}
              </Suspense>
            </CardContent>
          </Card>
        </div>

        {/* Store Listings - Fixed Height with Pagination at Bottom */}
        <div className="order-1 lg:order-2 h-full flex flex-col">
          {/* Stores Container */}
          <div className="flex-1 flex flex-col justify-start store-listings">
            {isInitialLoading ? (
              // Show skeleton only on initial load
              <>
                <Skeleton className={`${STORE_CARD_HEIGHT} ${STORE_CARD_GAP} rounded-lg`} />
                <Skeleton className={`${STORE_CARD_HEIGHT} ${STORE_CARD_GAP} rounded-lg`} />
                <Skeleton className={`${STORE_CARD_HEIGHT} rounded-lg`} />
              </>
            ) : (
              <div className={`${isFilterLoading ? 'opacity-70 transition-opacity duration-200' : ''}`}>
                {/* Show available stores with fade effect during filter loading */}
                {currentStores.map((store) => (
                    <Link 
                      href={`${linkPrefix}/${store._id}`} 
                      key={store._id} 
                      className={`block ${STORE_CARD_GAP} last:mb-0`}
                      aria-label={`View details for ${store.shelfName}`}
                    >
                      <Card 
                        id={`store-${store._id}`}
                        className={`overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border shadow-lg ${STORE_CARD_HEIGHT}`}
                      >
                        <CardContent className="p-0 h-full">
                          <div className="flex h-full">
                            {/* Store Image */}
                            <div className="w-2/5 relative bg-gradient-to-br from-primary/5 via-primary/10 to-primary/20">
                              {store.shelfImage ? (
                                <img 
                                  src={store.shelfImage} 
                                  alt={store.shelfName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="relative">
                                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                                    <Store className="h-16 w-16 text-primary/40 relative" />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Store Info */}
                            <div className="flex-1 p-3 flex flex-col">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between">
                                  <h3 className="text-sm font-semibold text-foreground line-clamp-1 flex-1">
                                    {store.shelfName}
                                  </h3>
                                  {store.isVerified && (
                                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                      <Check className="h-2.5 w-2.5 me-0.5" />
                                      {t("marketplace.verified")}
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                                    {t("common.currency_symbol")} {store.monthlyPrice.toLocaleString()}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">/ {t("marketplace.month")}</span>
                                  {store.discountPercentage > 0 && (
                                    <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 animate-pulse">
                                      {t("marketplace.save")} {store.discountPercentage}%
                                    </Badge>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                    <MapPin className="h-3 w-3 flex-shrink-0" />
                                    <span className="line-clamp-1">
                                      {store.address || `${store.city}, ${store.branch}`}
                                    </span>
                                  </div>

                                  <div className="flex flex-col gap-1.5 text-[11px]">
                                    <div className="flex items-center gap-1.5 p-1 rounded bg-muted/50">
                                      <Package className="h-3 w-3 text-primary flex-shrink-0" />
                                      <span className="text-muted-foreground">{t("marketplace.type")}:</span>
                                      <span className="font-medium text-foreground truncate">{store.productType || t("marketplace.general")}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <div className="flex items-center gap-1.5 p-1 rounded bg-muted/50 flex-1">
                                        <Ruler className="h-3 w-3 text-primary flex-shrink-0" />
                                        <span className="font-medium text-foreground">{store.width}×{store.length}cm</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 p-1 rounded bg-muted/50 flex-1">
                                        <Calendar className="h-3 w-3 text-primary flex-shrink-0" />
                                        <span className="text-muted-foreground">{t("marketplace.available")}:</span>
                                        <span className="font-medium text-foreground">
                                          {new Date(store.availableFrom).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-6 h-6 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center ring-1 ring-primary/10">
                                    <span className="text-[10px] font-semibold text-primary">
                                      {store.ownerName?.slice(0, 2).toUpperCase() || "UN"}
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-medium text-foreground">{store.ownerName || "Unknown"}</span>
                                </div>
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                ))}
              </div>
            )}
          </div>

          {/* Pagination - Always visible at bottom */}
          <div className="pt-4 mt-4">
            <div className="flex items-center justify-center gap-1">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || totalPages === 0}
              >
                {direction === "rtl" ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
              
              {totalPages === 0 ? (
                // Show single disabled page when no results
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9"
                  disabled
                >
                  1
                </Button>
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
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "ghost"}
                      size="sm"
                      className={`h-9 w-9 ${currentPage === pageNum ? 'bg-primary text-white hover:bg-primary/90' : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })
              )}

              {totalPages > 5 && currentPage < totalPages - 2 && (
                <span className="px-2 text-muted-foreground">...</span>
              )}
              
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9"
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                {direction === "rtl" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}