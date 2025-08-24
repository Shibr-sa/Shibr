"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  MapPin, 
  ChevronLeft,
  MoreHorizontal,
  Download,
  Edit2,
  Ruler,
  Building2,
  MapPinned,
  Package2,
  DollarSign,
  Percent,
  CalendarDays,
  Tag
} from "lucide-react"
import { useLanguage } from "@/contexts/localization-context"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

export default function ShelfDetailsPage() {
  const { t, direction } = useLanguage()
  const params = useParams()
  const router = useRouter()
  const shelfIdParam = params.id as string
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  // Fetch shelf data from Convex - only if we have a valid ID
  // Note: The ID comes from the URL as a string, but Convex expects an Id type
  const shelfData = useQuery(
    api.shelves.getShelfById, 
    shelfIdParam ? { shelfId: shelfIdParam as Id<"shelves"> } : "skip"
  )
  
  // Loading state - check if shelfData is undefined (still loading)
  if (shelfData === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    )
  }
  
  // Check if shelf was not found (null)
  if (shelfData === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold text-foreground">{t("shelf_details.not_found")}</p>
          <p className="text-muted-foreground">{t("shelf_details.not_found_description")}</p>
        </div>
      </div>
    )
  }
  
  // Shelf data loaded
  
  // Format the data for display
  const formattedData = {
    id: shelfData._id,
    name: shelfData.shelfName,
    price: shelfData.monthlyPrice,
    storeCommission: shelfData.storeCommission || 10,
    status: shelfData.status || "available",
    city: shelfData.city,
    branch: shelfData.branch,
    address: shelfData.address || shelfData.branch,
    addedDate: shelfData.availableFrom || new Date(shelfData._creationTime).toLocaleDateString(),
    dimensions: {
      length: shelfData.shelfSize?.width || 1.20,
      width: shelfData.shelfSize?.height || 1.20,
      depth: shelfData.shelfSize?.depth || 3
    },
    productTypes: shelfData.productTypes || [],
    renterName: shelfData.renterName,
    renterEmail: shelfData.renterEmail,
    renterDate: "—", // rentalStartDate not in shelf schema
    renterRating: shelfData.renterRating,
    images: [
      shelfData.shelfImage,
      shelfData.exteriorImage,
      shelfData.interiorImage
    ].filter(Boolean).length > 0 
      ? [shelfData.shelfImage, shelfData.exteriorImage, shelfData.interiorImage].filter(Boolean)
      : [
        "/placeholder.svg?height=400&width=600",
        "/placeholder.svg?height=400&width=600",
        "/placeholder.svg?height=400&width=600"
      ]
  }

  // Products sold data - TODO: Replace with actual data from Convex when available
  const soldProducts: Array<{id: string, name: string, quantity: number, sales: number, price: number}> = [
    { id: "#14821", name: t("shelf_details.sample_product"), quantity: 34, sales: 10, price: 89 },
  ]

  // Payment records - TODO: Replace with actual data from Convex when available
  const paymentRecords: Array<{date: string, status: string, amount: number, type: string}> = [
    { date: formattedData.renterDate, status: "pending", amount: formattedData.price, type: t("common.monthly") },
  ]

  // Previous renters - TODO: Replace with actual data from Convex when available
  const previousRenters: Array<{name: string, industry: string, ratingLabel: string, date: string}> = [
    { 
      name: formattedData.renterName || t("shelf_details.no_previous_renters"), 
      industry: t("shelf_details.activity_care"), 
      ratingLabel: t("shelf_details.excellent"), 
      date: formattedData.renterDate 
    }
  ]

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % formattedData.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + formattedData.images.length) % formattedData.images.length)
  }

  return (
    <div className="space-y-6">
      {/* Shelf Information and Images - Side by Side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Shelf Details Section */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package2 className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">{formattedData.name}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={shelfData.isAvailable === false ? "secondary" : "default"}
                >
                  {shelfData.isAvailable === false 
                    ? t("shelf_details.rented")
                    : t("shelf_details.available")
                  }
                </Badge>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  disabled={shelfData.isAvailable === false}
                  title={shelfData.isAvailable === false ? t("shelf_details.cannot_edit_rented") : t("shelf_details.edit_shelf")}
                  onClick={() => router.push(`/store-dashboard/shelves/${shelfIdParam}/edit`)}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Location Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("shelf_details.location_info")}
                </h3>
                
                <div className="space-y-3">
                  {/* City */}
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{t("shelf_details.city")}</p>
                      <p className="text-sm font-medium">{formattedData.city}</p>
                    </div>
                  </div>
                  
                  {/* Branch */}
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <MapPinned className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{t("shelf_details.branch")}</p>
                      <p className="text-sm font-medium">{formattedData.branch}</p>
                    </div>
                  </div>
                  
                  {/* Full Address */}
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{t("shelf_details.address")}</p>
                      <p className="text-sm font-medium">{formattedData.address}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Pricing & Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("shelf_details.pricing_details")}
                </h3>
                
                <div className="space-y-3">
                  {/* Monthly Price */}
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{t("shelf_details.monthly_price")}</p>
                      <p className="text-sm font-medium">
                        {formattedData.price} {t("common.currency")} / {t("common.monthly")}
                      </p>
                    </div>
                  </div>
                  
                  {/* Store Commission */}
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Percent className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{t("shelf_details.store_commission")}</p>
                      <p className="text-sm font-medium text-green-600">{formattedData.storeCommission}%</p>
                    </div>
                  </div>
                  
                  {/* Available From */}
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{t("shelf_details.available_from")}</p>
                      <p className="text-sm font-medium">{formattedData.addedDate}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Divider */}
            <div className="my-6 border-t" />
            
            {/* Bottom Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dimensions */}
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{t("shelf_details.dimensions")}</p>
                  <p className="text-sm font-medium">
                    {formattedData.dimensions.depth}m × {formattedData.dimensions.width}m × {formattedData.dimensions.length}m
                  </p>
                </div>
              </div>
              
              {/* Product Types */}
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-2">{t("shelf_details.product_types")}</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {formattedData.productTypes.map((type, index) => (
                      <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Gallery */}
        <Card>
            <CardContent className="p-0">
              <div className="relative aspect-[3/2] overflow-hidden rounded-t-lg">
                <img 
                  src={formattedData.images[currentImageIndex] || "/placeholder.svg?height=400&width=600"} 
                  alt={`Shelf image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute start-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute end-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={nextImage}
                >
                  <ChevronLeft className="h-4 w-4 rotate-180 rtl:rotate-0" />
                </Button>
              </div>
              <div className="flex gap-2 p-4">
                {formattedData.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative aspect-square w-20 overflow-hidden rounded-lg border-2 ${
                      currentImageIndex === index ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={image || "/placeholder.svg?height=80&width=80"} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Renter Details - Full Width */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-xl font-semibold">{t("shelf_details.seller_details")}</CardTitle>
            <Button 
              size="sm"
              className="gap-2"
              disabled={!formattedData.renterName}
              title={!formattedData.renterName ? t("shelf_details.no_renter") : ""}
            >
              {t("shelf_details.view_renter")}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-start">{t("shelf_details.renter_name")}</TableHead>
                  <TableHead className="text-start">{t("shelf_details.activity_type")}</TableHead>
                  <TableHead className="text-start">{t("shelf_details.renter_rating")}</TableHead>
                  <TableHead className="text-start">{t("shelf_details.rental_start_date")}</TableHead>
                  <TableHead className="text-start">{t("shelf_details.rental_end_date")}</TableHead>
                  <TableHead className="text-start">{t("shelf_details.activity")}</TableHead>
                  <TableHead className="text-start">{t("shelf_details.commercial_register")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">{formattedData.renterName || "—"}</TableCell>
                  <TableCell>{t("shelf_details.activity_care")}</TableCell>
                  <TableCell>{formattedData.renterDate}</TableCell>
                  <TableCell>{formattedData.renterDate}</TableCell>
                  <TableCell>{formattedData.renterDate}</TableCell>
                  <TableCell>{t("shelf_details.activity_care")}</TableCell>
                  <TableCell>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-primary text-sm"
                      onClick={() => {/* Download commercial register */}}
                    >
                      <Download className="h-3 w-3 me-1" />
                      {t("shelf_details.download_commercial")}
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Products Sold Table - Full Width */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold">{t("shelf_details.sold_products")}</CardTitle>
              <input
                type="search"
                placeholder={t("shelf_details.search_product")}
                className="px-3 py-1 text-sm border rounded-lg w-48"
              />
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-start">{t("shelf_details.image")}</TableHead>
                      <TableHead className="text-start">{t("shelf_details.product_name")}</TableHead>
                      <TableHead className="text-start">{t("shelf_details.code")}</TableHead>
                      <TableHead className="text-start">{t("shelf_details.price")}</TableHead>
                      <TableHead className="text-start">{t("shelf_details.quantity")}</TableHead>
                      <TableHead className="text-start">{t("shelf_details.sales_count")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {soldProducts.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="w-10 h-10 bg-gray-200 rounded" />
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-muted-foreground">{product.id}</TableCell>
                        <TableCell>{product.price} {t("common.currency")}</TableCell>
                        <TableCell>{product.quantity}</TableCell>
                        <TableCell>{product.sales}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-center gap-1 p-4 border-t">
                <Button variant="outline" size="icon" className="h-8 w-8">
                  {direction === "rtl" ? "»" : "«"}
                </Button>
                <Button variant="default" size="icon" className="h-8 w-8">1</Button>
                <Button variant="outline" size="icon" className="h-8 w-8">2</Button>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  {direction === "rtl" ? "«" : "»"}
                </Button>
              </div>
            </CardContent>
          </Card>

        {/* Payment Records and Previous Information - Side by Side */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Payment Records */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">{t("shelf_details.payment_records")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">{t("shelf_details.payment_date")}</TableHead>
                    <TableHead className="text-start">{t("shelf_details.status")}</TableHead>
                    <TableHead className="text-start">{t("shelf_details.amount")}</TableHead>
                    <TableHead className="text-start">{t("shelf_details.month")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentRecords.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={record.status === "completed" ? "default" : "secondary"}
                        >
                          {record.status === "completed" ? t("shelf_details.collected") : t("shelf_details.pending")}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.amount} {t("common.currency")}</TableCell>
                      <TableCell>{record.type}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Previous Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">{t("shelf_details.previous_information")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-start">{t("shelf_details.renter_name")}</TableHead>
                    <TableHead className="text-start">{t("shelf_details.industry_type")}</TableHead>
                    <TableHead className="text-start">{t("shelf_details.rating")}</TableHead>
                    <TableHead className="text-start">{t("shelf_details.rental_date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previousRenters.map((renter, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{renter.name}</TableCell>
                      <TableCell>{renter.industry}</TableCell>
                      <TableCell>{renter.ratingLabel}</TableCell>
                      <TableCell>{renter.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}