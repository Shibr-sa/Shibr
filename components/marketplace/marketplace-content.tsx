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
import { Search, MapPin, ChevronLeft, Store, ChevronRight, Clock, Map as MapIcon, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { StoreCard } from "./store-card"

// Lazy load the map component to improve initial page load
const StoreMap = lazy(() => import("./store-map"))

// Constants
const ITEMS_PER_PAGE = 12
const STORE_CARD_HEIGHT = "min-h-[240px]"
const DEFAULT_PRICE_RANGE = { min: 0, max: 9000 }

interface MarketplaceContentProps {
  linkPrefix?: string
}

interface StoreData {
  _id: string
  storeName: string
  businessCategory?: string
  logo?: string | null
  branchCount: number
  cities: string[]
  totalAvailableShelves: number
  priceRange: {
    min: number
    max: number
  }
  productTypes: string[]
  createdAt: number
}

export function MarketplaceContent({ linkPrefix = "/marketplace" }: MarketplaceContentProps) {
  const { t, direction } = useLanguage()

  // Search and filter states
  const [searchInput, setSearchInput] = useState("")
  const [selectedCity, setSelectedCity] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  // Map modal states (to be updated later for stores)
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [selectedStoreInMap, setSelectedStoreInMap] = useState<StoreData | null>(null)

  // Debounce search input to avoid too many queries
  const debouncedSearchQuery = useDebounce(searchInput, 500)

  // Get available cities
  const availableCities = useQuery(api.stores.getAvailableCitiesByStore)

  // Fetch stores from Convex with backend pagination
  const storesData = useQuery(api.stores.getAllStores, {
    city: selectedCity !== "all" ? selectedCity : undefined,
    searchQuery: debouncedSearchQuery || undefined,
    page: currentPage,
    pageSize: ITEMS_PER_PAGE,
  })

  // Fetch branches for map display
  const branchesForMap = useQuery(api.branches.getBranchesForMarketplace, {
    city: selectedCity !== "all" ? selectedCity : undefined,
  })

  // Loading states
  const isLoading = storesData === undefined

  // Extract data from backend response
  const stores = storesData?.stores || []
  const totalPages = storesData?.pagination.totalPages || 0
  const totalCount = storesData?.pagination.totalCount || 0

  // Filter change handlers - reset to page 1 when filters change
  const handleCityChange = useCallback((value: string) => {
    setSelectedCity(value)
    setCurrentPage(1)
  }, [])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
    setCurrentPage(1)
  }, [])

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

            {/* Filter: City Only for Stores */}
            <div className="grid grid-cols-1">
              <Select value={selectedCity} onValueChange={handleCityChange}>
                <SelectTrigger className="h-12" dir={direction}>
                  <SelectValue placeholder={t("marketplace.all_cities")} />
                </SelectTrigger>
                <SelectContent dir={direction}>
                  <SelectItem value="all">{t("marketplace.all_cities")}</SelectItem>
                  {availableCities?.map((city) => (
                    <SelectItem key={city} value={city}>
                      {t(`cities.${city.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_")}`) || city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            ) : stores.length === 0 ? (
              <div className="col-span-full flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <Store className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{t("marketplace.no_stores_found")}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores.map((store) => (
                  <StoreCard key={store._id} store={store} />
                ))}
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
                  >
                    {t("pagination.previous")}
                  </PaginationPrevious>
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
                  >
                    {t("pagination.next")}
                  </PaginationNext>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
      </div>

      {/* Fullscreen Map Modal */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="max-w-full h-screen p-0 rounded-none border-0 gap-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{t("marketplace.view_map") || "View Map"}</DialogTitle>
          </DialogHeader>
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
                    stores={branchesForMap || []}
                    selectedStoreId={selectedStoreInMap?._id}
                    onStoreSelect={(data) => {
                      if (typeof data === 'string') {
                        // Only ID is provided in non-fullscreen mode
                        const branch = branchesForMap?.find(b => b._id === data)
                        if (branch) setSelectedStoreInMap(branch as any)
                      } else {
                        // Full branch object in fullscreen mode
                        setSelectedStoreInMap(data as any)
                      }
                    }}
                    isFullscreen={true}
                  />
                )}
              </Suspense>
            </div>

            {/* Branch Details Panel - Bottom */}
            {selectedStoreInMap && (
              <div className="border-t bg-white p-4 shadow-lg">
                <div className="max-w-full">
                  <h3 className="text-lg font-semibold mb-2">{selectedStoreInMap.branchName}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{selectedStoreInMap.storeName}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">{t("marketplace.location")}</p>
                      <p className="font-medium flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {selectedStoreInMap.city}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">{t("marketplace.available_shelves")}</p>
                      <p className="font-semibold text-primary">
                        {selectedStoreInMap.availableShelvesCount || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">{t("marketplace.price_range")}</p>
                      <p className="font-medium">
                        {t("common.currency_symbol")} {selectedStoreInMap.priceRange?.min?.toLocaleString()} - {selectedStoreInMap.priceRange?.max?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">{t("marketplace.product_types")}</p>
                      <p className="font-medium">{selectedStoreInMap.productTypes?.length || 0} {t("common.types")}</p>
                    </div>
                  </div>
                  {selectedStoreInMap.address && (
                    <p className="text-xs text-muted-foreground mt-3">
                      {t("marketplace.address")}: {selectedStoreInMap.address}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}