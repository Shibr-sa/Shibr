"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, Store, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/localization-context"
import { ImageModal } from "@/components/ui/image-modal"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface BranchListProps {
  storeId: string
  initialCity?: string
  initialPage?: number
}

export function BranchList({ storeId, initialCity, initialPage = 1 }: BranchListProps) {
  const { t, direction } = useLanguage()
  const [selectedCity, setSelectedCity] = useState(initialCity || "all")
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [modalImages, setModalImages] = useState<{ url: string; alt?: string }[]>([])
  const [modalInitialIndex, setModalInitialIndex] = useState(0)

  // Fetch store with branches
  const storeData = useQuery(api.stores.getStoreWithBranches, {
    storeProfileId: storeId as Id<"storeProfiles">,
    city: selectedCity !== "all" ? selectedCity : undefined,
    page: currentPage,
    pageSize: 12,
  })

  // Get available cities for this store
  const availableCities = useQuery(api.stores.getAvailableCitiesByStore, {
    storeProfileId: storeId as Id<"storeProfiles">
  })

  const isLoading = storeData === undefined
  const store = storeData?.store
  const branches = storeData?.branches || []
  const totalPages = storeData?.pagination.totalPages || 0

  const handleCityChange = (value: string) => {
    setSelectedCity(value)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const openImageModal = (images: { url: string; alt?: string }[], initialIndex: number = 0) => {
    setModalImages(images)
    setModalInitialIndex(initialIndex)
    setModalOpen(true)
  }

  if (!isLoading && !store) {
    return (
      <div className="text-center py-8">
        <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">{t("marketplace.store_not_found")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Store Header */}
      {store && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <Avatar className="h-16 w-16">
                {store.logo && <AvatarImage src={store.logo} />}
                <AvatarFallback>
                  <Store className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{store.storeName}</h1>
                {store.businessCategory && (
                  <Badge variant="secondary">
                    {t(`business_categories.${store.businessCategory}`) || store.businessCategory}
                  </Badge>
                )}
                <p className="text-muted-foreground mt-2">
                  {store.totalBranches} {t("marketplace.branches")}
                </p>
              </div>
              <Link href="/marketplace">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 me-2" />
                  {t("marketplace.back_to_stores")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* City Filter */}
      {availableCities && availableCities.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <Select value={selectedCity} onValueChange={handleCityChange}>
              <SelectTrigger className="h-12" dir={direction}>
                <SelectValue placeholder={t("marketplace.all_cities")} />
              </SelectTrigger>
              <SelectContent dir={direction}>
                <SelectItem value="all">{t("marketplace.all_cities")}</SelectItem>
                {availableCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {t(`cities.${city.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_")}`) || city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Branches Grid */}
      <div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[320px]" />
            ))}
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-16">
            <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">{t("marketplace.no_branches_found")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((branch) => {
              const allImages = branch.images || []
              const currentImageIndex = imageIndexes[branch._id] || 0
              const hasMultipleImages = allImages.length > 1

              const navigateImage = (delta: number) => {
                const newIndex = (currentImageIndex + delta + allImages.length) % allImages.length
                setImageIndexes(prev => ({ ...prev, [branch._id]: newIndex }))
              }

              return (
                <Card key={branch._id} className="overflow-hidden hover:shadow-lg transition-all">
                  <div className="relative h-64 bg-muted group">
                    {allImages.length > 0 ? (
                      <>
                        <Image
                          src={allImages[currentImageIndex]?.url || "/placeholder.svg"}
                          alt={branch.branchName}
                          fill
                          className="object-cover cursor-pointer z-0"
                          onClick={() => {
                            const images = allImages.map(img => ({
                              url: img.url || "/placeholder.svg",
                              alt: branch.branchName
                            }))
                            openImageModal(images, currentImageIndex)
                          }}
                        />

                        {hasMultipleImages && (
                          <>
                            <div className="absolute top-2 start-2 bg-black/70 text-white px-2 py-1 rounded text-xs pointer-events-none">
                              {currentImageIndex + 1} / {allImages.length}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                navigateImage(direction === "rtl" ? 1 : -1)
                              }}
                              className="absolute start-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 flex items-center justify-center opacity-75 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20 hover:bg-white shadow-lg"
                            >
                              {direction === "rtl" ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                navigateImage(direction === "rtl" ? -1 : 1)
                              }}
                              className="absolute end-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 flex items-center justify-center opacity-75 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20 hover:bg-white shadow-lg"
                            >
                              {direction === "rtl" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          </>
                        )}

                        <div className="absolute top-2 end-2 bg-primary text-primary-foreground px-3 py-1 rounded pointer-events-none">
                          <span className="text-xs font-medium">
                            {branch.availableShelvesCount} {t("marketplace.available_shelves")}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Store className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                        <div className="absolute top-2 end-2 bg-primary text-primary-foreground px-3 py-1 rounded">
                          <span className="text-xs font-medium">
                            {branch.availableShelvesCount} {t("marketplace.available_shelves")}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <Link href={`/marketplace/store/${storeId}/branch/${branch._id}`}>
                    <CardContent className="p-4">
                      <h3 className="text-xl font-bold mb-2">{branch.branchName}</h3>

                      <div className="flex items-center gap-1 mb-3">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          {t(`cities.${branch.city.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_")}`) || branch.city}
                        </span>
                      </div>

                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-0.5">{t("marketplace.price_from")}</p>
                        <p className="text-lg font-semibold">
                          {t("common.currency_symbol")} {branch.priceRange.min.toLocaleString()}
                        </p>
                      </div>

                      <div className="text-sm text-primary font-medium">
                        {t("marketplace.view_shelves")} →
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardContent>
        </Card>
      )}

      {/* Image Modal */}
      <ImageModal
        images={modalImages}
        initialIndex={modalInitialIndex}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}