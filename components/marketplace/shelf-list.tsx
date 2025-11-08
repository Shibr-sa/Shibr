"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, Store, ArrowLeft, Ruler, Package } from "lucide-react"
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

interface ShelfListProps {
  branchId: string
  initialPage?: number
}

export function ShelfList({ branchId, initialPage = 1 }: ShelfListProps) {
  const { t, direction } = useLanguage()
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalImages, setModalImages] = useState<{ url: string; alt?: string }[]>([])
  const [modalInitialIndex, setModalInitialIndex] = useState(0)

  // Fetch shelves for this branch
  const shelvesData = useQuery(api.shelves.getByBranch, {
    branchId: branchId as Id<"branches">,
    page: currentPage,
    pageSize: 12,
  })

  // Fetch branch details
  const branch = useQuery(api.branches.getById, {
    branchId: branchId as Id<"branches">
  })

  // Fetch platform settings for Shibr commission
  const platformSettings = useQuery(api.platformSettings.getPlatformSettings)

  const isLoading = shelvesData === undefined || branch === undefined
  const shelves = shelvesData?.shelves || []
  const totalPages = shelvesData?.pagination.totalPages || 0

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

  if (!isLoading && !branch) {
    return (
      <div className="text-center py-8">
        <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">{t("marketplace.branch_not_found")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Branch Header */}
      {branch && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{branch.branchName}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{t(`cities.${branch.city.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_")}`) || branch.city}</span>
                </div>
              </div>
              <Link href={`/marketplace/store/${branch.storeProfileId}`}>
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 me-2" />
                  {t("marketplace.back_to_branches")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shelves Grid */}
      <div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[320px]" />
            ))}
          </div>
        ) : shelves.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">{t("marketplace.no_shelves_available")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {shelves.map((shelf) => (
              <Link key={shelf._id} href={`/brand-dashboard/shelves/marketplace/${shelf._id}`}>
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full group border-2 hover:border-primary/20">
                  <div
                    className="relative h-48 bg-muted cursor-pointer overflow-hidden"
                    onClick={(e) => {
                      if (shelf.images && shelf.images.length > 0) {
                        e.preventDefault()
                        const images = shelf.images.map(img => ({
                          url: img || "/placeholder.svg",
                          alt: shelf.name
                        }))
                        openImageModal(images, 0)
                      }
                    }}
                  >
                    {shelf.images && shelf.images.length > 0 ? (
                      <Image
                        src={shelf.images[0] || "/placeholder.svg"}
                        alt={shelf.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                        <Package className="h-16 w-16 text-muted-foreground/30" />
                      </div>
                    )}
                    {shelf.images && shelf.images.length > 1 && (
                      <div className="absolute top-3 start-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-medium pointer-events-none">
                        1 / {shelf.images.length}
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4 space-y-3">
                    {/* Shelf Name */}
                    <h3 className="text-lg font-bold line-clamp-1 group-hover:text-primary transition-colors">
                      {shelf.name}
                    </h3>

                    {/* Info Grid - 2x2 */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Monthly Rent */}
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">{t("marketplace.monthly_rent")}</p>
                        <p className="text-sm font-semibold">
                          {t("common.currency_symbol")} {shelf.pricePerMonth.toLocaleString()}
                        </p>
                      </div>

                      {/* Sales Commission */}
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">{t("marketplace.sales_commission")}</p>
                        <p className="text-sm font-semibold">
                          {(shelf.storeCommission || 0) + (platformSettings?.brandSalesCommission || 0)}%
                        </p>
                      </div>

                      {/* Shelf Size */}
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">{t("marketplace.shelf_size")}</p>
                        <p className="text-sm font-semibold">
                          {shelf.dimensions.width}×{shelf.dimensions.height}×{shelf.dimensions.depth} cm
                        </p>
                      </div>

                      {/* Location */}
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">{t("marketplace.location")}</p>
                        <p className="text-sm font-semibold line-clamp-1" title={branch?.city || ''}>
                          {branch?.city ? t(`cities.${branch.city.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_")}`) || branch.city : '-'}
                        </p>
                      </div>
                    </div>

                    {/* Product Types */}
                    {shelf.productTypes && shelf.productTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-3 border-t">
                        {shelf.productTypes.slice(0, 2).map((type, i) => (
                          <Badge key={i} variant="secondary" className="text-xs font-medium">
                            {t(`product_categories.${type}`) !== `product_categories.${type}`
                              ? t(`product_categories.${type}`)
                              : type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </Badge>
                        ))}
                        {shelf.productTypes.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{shelf.productTypes.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
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