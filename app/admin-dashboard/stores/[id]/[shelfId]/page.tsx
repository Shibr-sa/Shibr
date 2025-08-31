"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useLanguage } from "@/contexts/localization-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ArrowLeft,
  Store,
  MapPin,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  Package,
  Building2,
  DollarSign,
  Hash,
  ZoomIn,
  ExternalLink,
  Download,
} from "lucide-react"

export default function ShelfDetailsPage() {
  const { t, language, direction } = useLanguage()
  const router = useRouter()
  const params = useParams()
  const storeId = params.id as string  // This matches [id] folder
  const shelfId = params.shelfId as string
  
  // State for image gallery
  const [selectedImage, setSelectedImage] = useState<number>(0)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  
  // The storeId from the URL is actually the profileId
  // Fetch store shelves using the profileId directly
  const shelvesResult = useQuery(api.admin.getStoreShelves, 
    storeId ? { 
      profileId: storeId as Id<"userProfiles">,
      searchQuery: "",
      status: "all",
      page: 1,
      limit: 100,
    } : "skip"
  )
  
  // Find the specific shelf by its ID
  const shelf = shelvesResult?.items?.find((s: any) => s._id === shelfId)
  
  // Get the store info from the stores list
  const storesResult = useQuery(api.admin.getStores, {
    searchQuery: "",
    page: 1,
    limit: 100,
  })
  
  const store = storesResult?.items?.find((s: any) => s.id === storeId)
  
  // Fetch active rental request for this shelf if it's not available
  const rentalRequest = useQuery(api.admin.getRentalRequest,
    shelf && !shelf.isAvailable ? { 
      shelfId: shelf._id as Id<"shelves">
    } : "skip"
  )
  
  if (!shelf) {
    return null
  }
  
  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ${t("common.currency")}`
  }
  
  const formatDate = (date: string) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="default">{t("posts.status.published")}</Badge>
      case "rented":
        return <Badge variant="secondary">{t("posts.status.rented")}</Badge>
      default:
        return <Badge variant="outline">{t("posts.status.draft")}</Badge>
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Shelf Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enhanced Shelf Information Card */}
          <Card className="overflow-hidden">
            <div className="bg-muted/50 px-6 py-3 border-b flex items-center justify-between">
              <h3 className="text-base font-semibold">
                {t("posts.shelf_information")}
              </h3>
              <Badge variant={shelf.isAvailable ? "secondary" : "default"}>
                {shelf.isAvailable ? t("posts.status.published") : t("posts.status.rented")}
              </Badge>
            </div>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* First Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground font-normal">
                        {t("posts.shelf_name")}
                      </Label>
                      <p className="text-sm font-medium">{shelf.shelfName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground font-normal">
                        {t("posts.branch")}
                      </Label>
                      <p className="text-sm font-medium">{shelf.storeBranch}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground font-normal">
                        {t("posts.monthly_price")}
                      </Label>
                      <p className="text-sm font-medium">{formatCurrency(shelf.monthlyPrice || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Second Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Hash className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground font-normal">
                        {t("posts.commission_percentage")}
                      </Label>
                      <p className="text-sm font-medium">{shelf.storeCommission || shelf.percentage || 10}%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground font-normal">
                        {t("posts.date_added")}
                      </Label>
                      <p className="text-sm font-medium">{formatDate(shelf.createdAt || shelf.addedDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground font-normal">
                        {t("posts.location")}
                      </Label>
                      <p className="text-sm font-medium">
                        {(() => {
                          const locationParts = []
                          // Show city and address if available
                          if (shelf.city) locationParts.push(shelf.city)
                          if (shelf.location?.address) locationParts.push(shelf.location.address)
                          
                          // If no location data, check store location
                          if (locationParts.length === 0 && shelf.location) {
                            if (typeof shelf.location === 'string') {
                              return shelf.location
                            } else if (shelf.location.city) {
                              locationParts.push(shelf.location.city)
                            }
                          }
                          
                          return locationParts.length > 0 ? locationParts.join(", ") : "-"
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dimensions Section */}
                <Separator className="my-6" />
                <div>
                  <h3 className="text-sm font-semibold mb-4">{t("posts.dimensions")}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ArrowLeft className="h-4 w-4 text-primary rotate-90" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground font-normal">
                          {t("posts.width")}
                        </Label>
                        <p className="text-sm font-medium">
                          {shelf.shelfSize?.width || shelf.width || 100} 
                          <span className="text-muted-foreground ms-1">{shelf.shelfSize?.unit || t("common.cm")}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ArrowLeft className="h-4 w-4 text-primary rotate-180" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground font-normal">
                          {t("posts.height")}
                        </Label>
                        <p className="text-sm font-medium">
                          {shelf.shelfSize?.height || shelf.height || 200} 
                          <span className="text-muted-foreground ms-1">{shelf.shelfSize?.unit || t("common.cm")}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground font-normal">
                          {t("posts.depth")}
                        </Label>
                        <p className="text-sm font-medium">
                          {shelf.shelfSize?.depth || shelf.depth || 50} 
                          <span className="text-muted-foreground ms-1">{shelf.shelfSize?.unit || t("common.cm")}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                {shelf.description && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h3 className="text-sm font-semibold mb-2">{t("posts.description")}</h3>
                      <p className="text-sm text-muted-foreground">{shelf.description}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Renter Details Table */}
          <h3 className="text-lg font-semibold mb-4">
            {t("posts.renter_details")}
          </h3>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="h-12 text-start font-medium">{t("posts.merchant_name")}</TableHead>
                    <TableHead className="h-12 text-start font-medium">{t("posts.rental_amount")}</TableHead>
                    <TableHead className="h-12 text-start font-medium">{t("posts.rental_date")}</TableHead>
                    <TableHead className="h-12 text-start font-medium">{t("posts.end_date")}</TableHead>
                    <TableHead className="h-12 text-start font-medium">{t("posts.contact_method")}</TableHead>
                    <TableHead className="h-12 text-start font-medium">{t("posts.commercial_registry")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!shelf.isAvailable && rentalRequest ? (
                    <TableRow>
                      <TableCell className="py-3 font-medium">{rentalRequest.renterName || "-"}</TableCell>
                      <TableCell className="py-3">{formatCurrency(rentalRequest.monthlyPrice || shelf.monthlyPrice || 0)}</TableCell>
                      <TableCell className="py-3">{formatDate(rentalRequest.startDate)}</TableCell>
                      <TableCell className="py-3">{formatDate(rentalRequest.endDate)}</TableCell>
                      <TableCell className="py-3">{rentalRequest.renterPhone || rentalRequest.renterEmail || "-"}</TableCell>
                      <TableCell className="py-3">
                        {rentalRequest.commercialRegistry ? (
                          <Button variant="link" size="sm" className="p-0 h-auto text-primary">
                            {t("posts.download_registry")}
                          </Button>
                        ) : "-"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        {shelf.isAvailable ? t("posts.shelf_not_rented") : t("posts.no_renter_details")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
        </div>
        
        {/* Right Column - Shelf Images */}
        <div className="space-y-6">
          {/* Enhanced Shelf Images Card */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t("posts.shelf_images")}</CardTitle>
                {(() => {
                  const images = []
                  if (shelf.shelfImageUrl) images.push(shelf.shelfImageUrl)
                  if (shelf.exteriorImageUrl) images.push(shelf.exteriorImageUrl)
                  if (shelf.interiorImageUrl) images.push(shelf.interiorImageUrl)
                  if (shelf.additionalImageUrls?.length > 0) {
                    images.push(...shelf.additionalImageUrls)
                  }
                  if (images.length === 0 && shelf.images?.length > 0) {
                    images.push(...shelf.images)
                  }
                  return images.length > 0 ? (
                    <Badge variant="secondary" className="text-xs">
                      {images.length} {language === "ar" ? "صور" : "Images"}
                    </Badge>
                  ) : null
                })()}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {(() => {
                // Collect all available image URLs with labels
                const images: { url: string; label: string }[] = []
                if (shelf.shelfImageUrl) {
                  images.push({ 
                    url: shelf.shelfImageUrl, 
                    label: language === "ar" ? "صورة الرف" : "Shelf Image" 
                  })
                }
                if (shelf.exteriorImageUrl) {
                  images.push({ 
                    url: shelf.exteriorImageUrl, 
                    label: language === "ar" ? "الواجهة الخارجية" : "Exterior View" 
                  })
                }
                if (shelf.interiorImageUrl) {
                  images.push({ 
                    url: shelf.interiorImageUrl, 
                    label: language === "ar" ? "المنظر الداخلي" : "Interior View" 
                  })
                }
                if (shelf.additionalImageUrls?.length > 0) {
                  shelf.additionalImageUrls.forEach((url: string, i: number) => {
                    images.push({ 
                      url, 
                      label: `${language === "ar" ? "صورة إضافية" : "Additional Image"} ${i + 1}` 
                    })
                  })
                }
                // Fallback to old images array if exists
                if (images.length === 0 && shelf.images?.length > 0) {
                  shelf.images.forEach((url: string, i: number) => {
                    images.push({ 
                      url, 
                      label: `${language === "ar" ? "صورة" : "Image"} ${i + 1}` 
                    })
                  })
                }
                
                if (images.length > 0) {
                  return (
                    <div className="space-y-3">
                      {/* Main image display */}
                      <div className="relative aspect-video bg-muted">
                        <img 
                          src={images[selectedImage].url} 
                          alt={images[selectedImage].label}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 end-2 flex gap-2">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white border-0"
                            onClick={() => window.open(images[selectedImage].url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="absolute bottom-0 start-0 end-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                          <p className="text-white text-sm font-medium">
                            {images[selectedImage].label}
                          </p>
                        </div>
                      </div>
                      
                      {/* Thumbnail gallery */}
                      {images.length > 1 && (
                        <div className="px-4 pb-4">
                          <div className="grid grid-cols-3 gap-2">
                            {images.map((image, index) => (
                              <button
                                key={index}
                                onClick={() => setSelectedImage(index)}
                                className={`relative aspect-video rounded-md overflow-hidden border-2 transition-all ${
                                  selectedImage === index 
                                    ? 'border-primary ring-2 ring-primary/20' 
                                    : 'border-transparent hover:border-muted-foreground/50'
                                }`}
                              >
                                <img 
                                  src={image.url} 
                                  alt={image.label}
                                  className="w-full h-full object-cover"
                                />
                                {selectedImage === index && (
                                  <div className="absolute inset-0 bg-primary/10" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                } else {
                  return (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <div className="text-center p-6">
                        <div className="w-16 h-16 rounded-full bg-muted-foreground/10 flex items-center justify-center mx-auto mb-3">
                          <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          {t("posts.no_images")}
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                          {language === "ar" ? "لم يتم رفع أي صور لهذا الرف" : "No images have been uploaded for this shelf"}
                        </p>
                      </div>
                    </div>
                  )
                }
              })()}
            </CardContent>
          </Card>
          
        </div>
      </div>
    </div>
  )
}