"use client"

import { useState, useCallback, lazy, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, ChevronLeft, Store, ChevronRight, Skeleton as SkeletonIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/localization-context"
import { useDebounce } from "@/hooks/use-debounce"

const StoreMap = lazy(() => import("@/components/marketplace/store-map"))

interface BranchDetailsPageProps {
  params: {
    branchId: string
  }
}

export default function BranchDetailsPage({ params }: BranchDetailsPageProps) {
  const { t, direction } = useLanguage()
  const [searchInput, setSearchInput] = useState("")
  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({})

  const debouncedSearchQuery = useDebounce(searchInput, 500)

  // Fetch branch and shelves data
  const branchData = useQuery(api.branches.getBranchShelves, {
    branchId: params.branchId as Id<"branches">,
  })

  const isLoading = branchData === undefined
  const branch = branchData?.branch
  const shelves = branchData?.shelves || []

  // Filter shelves by search
  const filteredShelves = shelves.filter((shelf) => {
    if (!debouncedSearchQuery) return true
    const query = debouncedSearchQuery.toLowerCase()
    return (
      shelf.shelfName.toLowerCase().includes(query) ||
      (shelf.description && shelf.description.toLowerCase().includes(query))
    )
  })

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <Skeleton className="h-80 w-full rounded-lg mb-6" />
        <Skeleton className="h-12 w-full rounded-lg mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!branch) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t("marketplace.branch_not_found") || "Branch not found"}</h1>
          <Link href="/marketplace">
            <Button variant="default">{t("common.back")}</Button>
          </Link>
        </div>
      </div>
    )
  }

  const branchImages = branch.images || []
  const currentBranchImageIndex = imageIndexes[`branch-header-${branch._id}`] || 0
  const hasMultipleBranchImages = branchImages.length > 1

  const navigateBranchImage = (delta: number) => {
    const newIndex = (currentBranchImageIndex + delta + branchImages.length) % branchImages.length
    setImageIndexes(prev => ({ ...prev, [`branch-header-${branch._id}`]: newIndex }))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Branch Header */}
      <div className="relative h-64 md:h-80 lg:h-96 w-full overflow-hidden rounded-lg mb-6">
        {branchImages.length > 0 ? (
          <>
            <Image
              src={branchImages[currentBranchImageIndex]?.url || "/placeholder.svg"}
              alt={`${branch.branchName} - ${branchImages[currentBranchImageIndex]?.type}`}
              fill
              className="object-cover"
              unoptimized
              priority
            />

            {/* Image counter */}
            {hasMultipleBranchImages && (
              <div className="absolute top-4 start-4 bg-black/70 text-white px-3 py-1 rounded text-sm font-medium">
                {currentBranchImageIndex + 1} / {branchImages.length}
              </div>
            )}

            {/* Navigation arrows */}
            {hasMultipleBranchImages && (
              <>
                <button
                  onClick={() => navigateBranchImage(direction === "rtl" ? 1 : -1)}
                  className="absolute start-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  aria-label={direction === "rtl" ? "Next image" : "Previous image"}
                >
                  {direction === "rtl" ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => navigateBranchImage(direction === "rtl" ? -1 : 1)}
                  className="absolute end-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  aria-label={direction === "rtl" ? "Previous image" : "Next image"}
                >
                  {direction === "rtl" ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </button>
              </>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Store className="h-16 w-16 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Branch Info Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mb-8">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{branch.branchName}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-5 w-5" />
              <span>{branch.city}</span>
            </div>
            <div>
              <span className="font-medium text-foreground">{shelves.length}</span> {t("marketplace.all_shelves")}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="search"
            placeholder={t("marketplace.search_placeholder")}
            className="ps-10 h-12"
            value={searchInput}
            onChange={handleSearchChange}
          />
        </div>

        {/* Back to Marketplace */}
        <div className="mb-6">
          <Link href="/marketplace">
            <Button variant="outline" size="sm" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              {t("common.back")}
            </Button>
          </Link>
        </div>

        {/* Shelves Grid */}
        {filteredShelves.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Store className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t("marketplace.no_stores_found")}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShelves.map((shelf) => {
              const allImages = shelf.images || []
              const currentImageIndex = imageIndexes[shelf._id] || 0
              const hasMultipleImages = allImages.length > 1

              const navigateImage = (delta: number) => {
                const newIndex = (currentImageIndex + delta + allImages.length) % allImages.length
                setImageIndexes(prev => ({ ...prev, [shelf._id]: newIndex }))
              }

              return (
                <Link
                  key={shelf._id}
                  href={`/marketplace/${shelf._id}`}
                  className="block"
                >
                  <Card className="overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border shadow-lg h-full">
                    <CardContent className="p-0 h-full flex flex-col">
                      {/* Shelf Image */}
                      <div className="relative w-full h-48 bg-gradient-to-br from-muted/50 to-muted group overflow-hidden">
                        {allImages.length > 0 ? (
                          <>
                            <Image
                              src={allImages[currentImageIndex]?.url || "/placeholder.svg"}
                              alt={`${shelf.shelfName} - ${allImages[currentImageIndex]?.type}`}
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

                      {/* Shelf Info */}
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="text-base font-semibold text-foreground mb-2">
                          {shelf.shelfName}
                        </h3>

                        {/* Price and Size */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">{t("marketplace.monthly_rent")}</p>
                            <p className="text-sm font-bold text-primary">
                              {t("common.currency_symbol")} {shelf.monthlyPrice.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">{t("marketplace.shelf_size")}</p>
                            <p className="text-sm font-medium">
                              {shelf.shelfSize?.width || 0}×{shelf.shelfSize?.height || 0}×{shelf.shelfSize?.depth || 0} cm
                            </p>
                          </div>
                        </div>

                        {/* Description */}
                        {shelf.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {shelf.description}
                          </p>
                        )}

                        {/* View Details Button */}
                        <Button className="w-full mt-auto">{t("marketplace.view_details")}</Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
