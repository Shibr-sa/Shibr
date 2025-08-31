"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useLanguage } from "@/contexts/localization-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { 
  MapPin, 
  ChevronLeft,
  Download,
  Edit,
  Ruler,
  Building2,
  MapPinned,
  Package2,
  DollarSign,
  Percent,
  CalendarDays,
  Tag,
  Users,
  ShoppingBag,
  CreditCard,
  Eye,
  Trash2,
  Ban,
  Mail,
  User,
  Inbox,
  Search
} from "lucide-react"

export default function ShelfDetailsPage() {
  const { t, language, direction } = useLanguage()
  const params = useParams()
  const router = useRouter()
  const shelfIdParam = params.id as string
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [activeTab, setActiveTab] = useState("renter")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Pagination states
  const [productsPage, setProductsPage] = useState(1)
  const [paymentsPage, setPaymentsPage] = useState(1)
  const [previousPage, setPreviousPage] = useState(1)
  const [productsSearch, setProductsSearch] = useState("")
  const itemsPerPage = 5
  
  // Track if we've loaded initial data
  const [hasInitialData, setHasInitialData] = useState(false)
  
  // Fetch shelf data from Convex
  const shelfData = useQuery(
    api.shelves.getShelfById, 
    shelfIdParam ? { shelfId: shelfIdParam as Id<"shelves"> } : "skip"
  )
  
  // Fetch real data from Convex - MUST be before any conditional returns
  const rentalRequests = useQuery(api.shelves.getShelfRentalRequests, 
    shelfIdParam ? { shelfId: shelfIdParam as Id<"shelves"> } : "skip"
  )
  
  const shelfProducts = useQuery(api.shelves.getShelfProducts, 
    shelfIdParam ? { shelfId: shelfIdParam as Id<"shelves"> } : "skip"
  )
  
  const shelfPayments = useQuery(api.shelves.getShelfPayments, 
    shelfIdParam ? { shelfId: shelfIdParam as Id<"shelves"> } : "skip"
  )
  
  // Delete mutation
  const deleteShelf = useMutation(api.shelves.deleteShelf)

  // Track when we have initial data - MUST be before any conditional returns
  useEffect(() => {
    if (shelfData !== undefined && !hasInitialData) {
      setHasInitialData(true)
    }
  }, [shelfData, hasInitialData])

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % (shelfData ? getImages(shelfData).length : 3))
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + (shelfData ? getImages(shelfData).length : 3)) % (shelfData ? getImages(shelfData).length : 3))
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ${t("common.currency")}`
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "approved":
      case "available":
        return "default"
      case "pending_approval":
        return "secondary"
      case "suspended":
      case "rented":
        return "destructive"
      default:
        return "outline"
    }
  }
  
  // Handle shelf deletion
  const handleDeleteShelf = async () => {
    if (!shelfData?._id) return
    
    setIsDeleting(true)
    try {
      await deleteShelf({ shelfId: shelfData._id })
      router.push('/store-dashboard/shelves')
    } catch (error) {
      console.error('Failed to delete shelf:', error)
      // You could add a toast notification here
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  // Helper function to get images
  const getImages = (data: any) => {
    const images = [
      data.shelfImage,
      data.exteriorImage,
      data.interiorImage
    ].filter(Boolean)
    
    return images.length > 0 ? images : [
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600"
    ]
  }
  
  // Loading state - show page structure with skeletons
  if (shelfData === undefined) {
    return (
      <div className="space-y-6">
        {/* Shelf Info and Images Skeleton */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Shelf Info Skeleton */}
          <Card className="overflow-hidden lg:col-span-2">
            <div className="bg-muted/50 px-6 py-3 border-b flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-3 p-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Image Gallery Skeleton */}
          <Card>
            <CardContent className="p-0">
              <Skeleton className="aspect-[4/3] rounded-t-lg" />
              <div className="flex gap-2 p-4 justify-center">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-video w-24 rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs Skeleton */}
        <div className="space-y-6">
          {/* Tab buttons */}
          <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-fit">
            <Skeleton className="h-8 w-28 rounded" />
            <Skeleton className="h-8 w-28 rounded ms-1" />
            <Skeleton className="h-8 w-28 rounded ms-1" />
          </div>
          
          {/* Renter Details Table Skeleton */}
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TableHead key={i} className="h-12">
                      <Skeleton className="h-4 w-24" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="h-[72px]">
                  <TableCell className="py-3"><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="py-3"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="py-3"><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          
          {/* Displayed Products Section Skeleton */}
          <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-6 w-40" />
              <div className="relative w-80">
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <TableHead key={i} className="h-12">
                        <Skeleton className="h-4 w-20" />
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index} className="h-[72px]">
                      <TableCell className="py-3"><Skeleton className="h-10 w-10 rounded" /></TableCell>
                      <TableCell className="py-3"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="py-3"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="py-3"><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="py-3"><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell className="py-3"><Skeleton className="h-4 w-12" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Pagination skeleton */}
            <div className="flex items-center justify-center space-x-2">
              <Skeleton className="h-9 w-9 rounded" />
              <Skeleton className="h-9 w-9 rounded" />
              <Skeleton className="h-9 w-9 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Check if shelf was not found
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
  
  // Format the data for display
  const formattedData = {
    id: shelfData._id,
    name: shelfData.shelfName,
    price: shelfData.monthlyPrice,
    storeCommission: shelfData.storeCommission || 10,
    status: shelfData.status || "available",
    city: shelfData.city,
    branch: shelfData.storeBranch,
    address: shelfData.location?.address || shelfData.storeBranch,
    addedDate: shelfData.availableFrom || new Date(shelfData._creationTime).toLocaleDateString(),
    dimensions: {
      length: shelfData.shelfSize?.height || 0,
      width: shelfData.shelfSize?.width || 0,
      depth: shelfData.shelfSize?.depth || 0
    },
    productTypes: shelfData.productTypes && shelfData.productTypes.length > 0 
      ? shelfData.productTypes 
      : shelfData.productType 
        ? [shelfData.productType]
        : [],
    renterName: shelfData.renterName,
    renterEmail: shelfData.renterEmail,
    images: getImages(shelfData)
  }
  
  // Find active rental
  const activeRental = rentalRequests?.find(r => r.status === "active")
  
  // Format renter details from active rental
  const renterDetails = activeRental ? [{
    merchantName: activeRental.requesterProfile?.brandName || t("common.unknown"),
    activityType: activeRental.requesterProfile?.brandType || t("common.not_specified"),
    rentalDate: new Date(activeRental.startDate).toLocaleDateString(),
    endDate: activeRental.endDate ? new Date(activeRental.endDate).toLocaleDateString() : "-",
    rentalMethod: t("shelf_details.monthly_rental"),
    commercialRegister: activeRental.requesterProfile?.brandCommercialRegisterNumber || "-"
  }] : []

  // Format products data
  const allProducts: Array<{id: string, name: string, quantity: number, sales: number, price: number, imageUrl?: string, mainImage?: Id<"_storage">}> = shelfProducts?.map(product => ({
    id: product?._id || "",
    name: product?.name || "",
    quantity: product?.quantity || 0,
    sales: product?.totalSales || 0,
    price: product?.price || 0,
    imageUrl: product?.imageUrl,
    mainImage: product?.mainImage
  })) || []
  
  // Format payment records
  const allPaymentRecords = shelfPayments?.map(payment => ({
    month: new Date(payment.paymentDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' }),
    value: payment.amount,
    status: payment.status === "completed" ? "completed" : "pending",
    collectionDate: payment.processedDate ? new Date(payment.processedDate).toLocaleDateString() : "-"
  })) || []
  
  // Format previous rentals (completed or cancelled)
  const previousRentals = rentalRequests?.filter(r => 
    r.status === "completed" || r.status === "cancelled"
  ) || []
  
  const allPreviousInfo = previousRentals.map(rental => ({
    merchantName: rental.requesterProfile?.brandName || t("common.unknown"),
    activityType: rental.requesterProfile?.brandType || t("common.not_specified"),
    rentalMethod: t("shelf_details.monthly_rental"),
    revenue: rental.totalAmount || (rental.monthlyPrice * (rental.rentalPeriod || 1))
  }))
  
  // Filter products based on search
  const filteredProducts = allProducts.filter(product => 
    product.name.toLowerCase().includes(productsSearch.toLowerCase()) ||
    product.id.toLowerCase().includes(productsSearch.toLowerCase())
  )
  
  // Paginated data
  const displayedProducts = filteredProducts.slice((productsPage - 1) * itemsPerPage, productsPage * itemsPerPage)
  const paymentRecords = allPaymentRecords.slice((paymentsPage - 1) * itemsPerPage, paymentsPage * itemsPerPage)
  const previousInfo = allPreviousInfo.slice((previousPage - 1) * itemsPerPage, previousPage * itemsPerPage)
  
  // Total pages
  const totalProductPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const totalPaymentPages = Math.ceil(allPaymentRecords.length / itemsPerPage)
  const totalPreviousPages = Math.ceil(allPreviousInfo.length / itemsPerPage)

  return (
    <div className="space-y-6">
      {/* Shelf Info and Images Side by Side */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Shelf Info - Enhanced */}
        <Card className="overflow-hidden lg:col-span-2">
          <div className="bg-muted/50 px-6 py-3 border-b flex items-center justify-between">
            <h3 className="text-base font-semibold">
              {t("shelf_details.shelf_information")}
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusVariant(shelfData.isAvailable === false ? "rented" : "available")}>
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
                <Edit className="h-3.5 w-3.5" />
              </Button>
              {shelfData.isAvailable !== false && (
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                  title={t("shelf_details.delete_shelf")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* First Row - 3 items */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <Label className="text-xs text-muted-foreground font-normal">
                      {t("shelf_details.shelf_name")}
                    </Label>
                    <p className="text-sm font-medium truncate" title={formattedData.name}>
                      {formattedData.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPinned className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground font-normal">
                      {t("shelf_details.branch")}
                    </Label>
                    <p className="text-sm font-medium">{formattedData.branch}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <Label className="text-xs text-muted-foreground font-normal">
                      {t("shelf_details.address")}
                    </Label>
                    <p className="text-sm font-medium truncate" title={formattedData.address}>
                      {formattedData.address}
                    </p>
                  </div>
                </div>
              </div>

              {/* Second Row - 3 items */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground font-normal">
                      {t("shelf_details.pricing_and_commission")}
                    </Label>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold">
                        {formatCurrency(formattedData.price)}
                      </p>
                      <Badge variant="outline" className="h-6 px-2 border-primary/30 bg-primary/10 text-primary">
                        <Percent className="h-3 w-3 me-1" />
                        {formattedData.storeCommission}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CalendarDays className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground font-normal">
                      {t("shelf_details.available_from")}
                    </Label>
                    <p className="text-sm font-medium">{formattedData.addedDate}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Ruler className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground font-normal">
                      {t("shelf_details.dimensions")}
                    </Label>
                    <p className="text-sm font-medium">
                      {formattedData.dimensions.length} × {formattedData.dimensions.width} × {formattedData.dimensions.depth} {t("add_shelf.cm")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Product Types - Full Width */}
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Tag className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <Label className="text-xs text-muted-foreground font-normal">
                    {t("shelf_details.product_types")}
                  </Label>
                  <div className="flex gap-2 flex-wrap">
                    {formattedData.productTypes.length > 0 ? (
                      formattedData.productTypes.map((type, index) => (
                        <Badge key={index} variant="secondary" className="text-xs py-1 px-2">
                          {t(`product_categories.${type}` as any) || type}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">{t("common.not_specified")}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info and Actions */}
            {formattedData.renterName && (
              <>
                <Separator className="my-6" />
                <div className="flex items-center justify-between px-3">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      <span>{formattedData.renterName}</span>
                    </div>
                    {formattedData.renterEmail && (
                      <>
                        <Separator orientation="vertical" className="h-4" />
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          <span>{formattedData.renterEmail}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Ban className="h-4 w-4 me-2" />
                      {t("shelf_details.end_rental")}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Image Gallery */}
        <Card>
          <CardContent className="p-0">
            <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
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
            <div className="flex gap-2 p-4 justify-center">
              {formattedData.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative aspect-video w-24 overflow-hidden rounded-lg border-2 transition-all ${
                    currentImageIndex === index ? "border-primary ring-2 ring-primary/20" : "border-transparent"
                  }`}
                >
                  <img src={image || "/placeholder.svg?height=80&width=120"} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Tab Header */}
        <TabsList className="grid w-fit grid-cols-3">
          <TabsTrigger value="renter">{t("shelf_details.renter_details")}</TabsTrigger>
          <TabsTrigger value="payments">{t("shelf_details.payment_records")}</TabsTrigger>
          <TabsTrigger value="previous">{t("shelf_details.previous_information")}</TabsTrigger>
        </TabsList>

        {/* Renter Details Tab */}
        <TabsContent value="renter" className="space-y-6">
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="h-12 text-start font-medium">{t("shelf_details.merchant_name")}</TableHead>
                  <TableHead className="h-12 text-start font-medium">{t("shelf_details.activity_type")}</TableHead>
                  <TableHead className="h-12 text-start font-medium">{t("shelf_details.rental_date")}</TableHead>
                  <TableHead className="h-12 text-start font-medium">{t("shelf_details.end_date")}</TableHead>
                  <TableHead className="h-12 text-start font-medium">{t("shelf_details.rental_method")}</TableHead>
                  <TableHead className="h-12 text-start font-medium">{t("shelf_details.commercial_register")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renterDetails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      <div className="flex w-full items-center justify-center">
                        <div className="flex flex-col items-center gap-1 py-10">
                          <Users className="h-10 w-10 text-muted-foreground/40 mb-2" />
                          <h3 className="font-medium">
                            {t("shelf_details.no_renter")}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {t("shelf_details.renter_will_appear_here")}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  renterDetails.map((renter, index) => (
                    <TableRow key={index} className="h-[72px]">
                      <TableCell className="py-3 font-medium">{renter.merchantName}</TableCell>
                      <TableCell className="py-3">{renter.activityType}</TableCell>
                      <TableCell className="py-3">{renter.rentalDate}</TableCell>
                      <TableCell className="py-3">{renter.endDate}</TableCell>
                      <TableCell className="py-3">{renter.rentalMethod}</TableCell>
                      <TableCell className="py-3">
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-primary text-sm"
                          onClick={() => {/* Download commercial register */}}
                        >
                          <Download className="h-3 w-3 me-1" />
                          {t("shelf_details.download")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Displayed Products Section */}
          <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">{t("shelf_details.displayed_products")}</h3>
              <div className="relative w-80">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t("shelf_details.search_product")}
                  value={productsSearch}
                  onChange={(e) => {
                    setProductsSearch(e.target.value)
                    setProductsPage(1) // Reset to first page on search
                  }}
                  className="ps-10"
                />
              </div>
            </div>
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                  <TableHead className="h-12 text-start font-medium">{t("shelf_details.image")}</TableHead>
                  <TableHead className="h-12 text-start font-medium">{t("shelf_details.product_name")}</TableHead>
                  <TableHead className="h-12 text-start font-medium">{t("shelf_details.code")}</TableHead>
                  <TableHead className="h-12 text-start font-medium">{t("shelf_details.price")}</TableHead>
                  <TableHead className="h-12 text-start font-medium">{t("shelf_details.quantity")}</TableHead>
                  <TableHead className="h-12 text-start font-medium">{t("shelf_details.sales_count")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allProducts === undefined ? (
                  // Loading state
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <TableRow key={`loading-${index}`} className="h-[72px]">
                      <TableCell className="py-3"><Skeleton className="h-10 w-10 rounded" /></TableCell>
                      <TableCell className="py-3"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="py-3"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="py-3"><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="py-3"><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredProducts.length === 0 ? (
                  // Empty state
                  <TableRow>
                    <TableCell colSpan={6} className="h-[360px] text-center">
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="flex flex-col items-center gap-1 py-10">
                          <ShoppingBag className="h-10 w-10 text-muted-foreground/40 mb-2" />
                          <h3 className="font-medium">
                            {productsSearch ? t("common.no_results") : t("shelf_details.no_products_sold")}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {productsSearch ? t("common.try_different_search") : t("shelf_details.products_will_appear_here")}
                          </p>
                          {productsSearch && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-4"
                              onClick={() => {
                                setProductsSearch("")
                                setProductsPage(1)
                              }}
                            >
                              {t("common.clear_search")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (() => {
                  // Data state with pagination
                  const emptyRows = itemsPerPage - displayedProducts.length;
                  
                  return (
                    <>
                      {displayedProducts.map((product, index) => (
                        <TableRow key={index} className="h-[72px]">
                          <TableCell className="py-3">
                            {product.imageUrl ? (
                              <img 
                                src={product.imageUrl} 
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                <Package2 className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-3 font-medium">{product.name}</TableCell>
                          <TableCell className="py-3 text-muted-foreground">{product.id}</TableCell>
                          <TableCell className="py-3">{formatCurrency(product.price)}</TableCell>
                          <TableCell className="py-3">{product.quantity}</TableCell>
                          <TableCell className="py-3">{product.sales}</TableCell>
                        </TableRow>
                      ))}
                      {Array.from({ length: emptyRows }).map((_, index) => (
                        <TableRow key={`empty-${index}`} className="h-[72px]">
                          <TableCell className="py-3" colSpan={6}>&nbsp;</TableCell>
                        </TableRow>
                      ))}
                    </>
                  );
                })()}
              </TableBody>
            </Table>
            </div>
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setProductsPage(prev => Math.max(1, prev - 1))}
                    className={productsPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: Math.max(1, totalProductPages) }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setProductsPage(page)}
                      isActive={productsPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setProductsPage(prev => Math.min(Math.max(1, totalProductPages), prev + 1))}
                    className={productsPage === totalProductPages || totalProductPages === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="h-12 text-start font-medium">{t("shelf_details.month")}</TableHead>
                  <TableHead className="h-12 text-start font-medium">{t("shelf_details.value")}</TableHead>
                  <TableHead className="h-12 text-start font-medium">{t("shelf_details.status")}</TableHead>
                  <TableHead className="h-12 text-start font-medium">{t("shelf_details.collection_date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPaymentRecords === undefined ? (
                  // Loading state
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <TableRow key={`loading-${index}`} className="h-[72px]">
                      <TableCell className="py-3"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="py-3"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell className="py-3"><Skeleton className="h-4 w-32" /></TableCell>
                    </TableRow>
                  ))
                ) : allPaymentRecords.length === 0 ? (
                  // Empty state
                  <TableRow>
                    <TableCell colSpan={4} className="h-[360px] text-center">
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="flex flex-col items-center gap-1 py-10">
                          <CreditCard className="h-10 w-10 text-muted-foreground/40 mb-2" />
                          <h3 className="font-medium">
                            {t("shelf_details.no_payment_records")}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {t("shelf_details.payments_will_appear_here")}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (() => {
                  // Data state with pagination
                  const emptyRows = itemsPerPage - paymentRecords.length;
                  
                  return (
                    <>
                      {paymentRecords.map((record, index) => (
                        <TableRow key={index} className="h-[72px]">
                          <TableCell className="py-3">{record.month}</TableCell>
                          <TableCell className="py-3">{formatCurrency(record.value)}</TableCell>
                          <TableCell className="py-3">
                            <Badge 
                              variant={record.status === "completed" ? "default" : "secondary"}
                              className="font-normal"
                            >
                              {record.status === "completed" ? t("shelf_details.collected") : t("shelf_details.pending")}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3">{record.collectionDate}</TableCell>
                        </TableRow>
                      ))}
                      {Array.from({ length: emptyRows }).map((_, index) => (
                        <TableRow key={`empty-${index}`} className="h-[72px]">
                          <TableCell className="py-3" colSpan={4}>&nbsp;</TableCell>
                        </TableRow>
                      ))}
                    </>
                  );
                })()}
              </TableBody>
            </Table>
          </div>
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPaymentsPage(prev => Math.max(1, prev - 1))}
                  className={paymentsPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: Math.max(1, totalPaymentPages) }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setPaymentsPage(page)}
                    isActive={paymentsPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setPaymentsPage(prev => Math.min(Math.max(1, totalPaymentPages), prev + 1))}
                  className={paymentsPage === totalPaymentPages || totalPaymentPages === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </TabsContent>

        {/* Previous Information Tab */}
        <TabsContent value="previous" className="space-y-6">
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="h-12 text-start font-medium">{t("shelf_details.merchant_name")}</TableHead>
                  <TableHead className="h-12 text-start font-medium">{t("shelf_details.activity_type")}</TableHead>
                  <TableHead className="h-12 text-start font-medium">{t("shelf_details.rental_method")}</TableHead>
                  <TableHead className="h-12 text-start font-medium">{t("shelf_details.revenue")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPreviousInfo === undefined ? (
                  // Loading state
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <TableRow key={`loading-${index}`} className="h-[72px]">
                      <TableCell className="py-3"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="py-3"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : allPreviousInfo.length === 0 ? (
                  // Empty state
                  <TableRow>
                    <TableCell colSpan={4} className="h-[360px] text-center">
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="flex flex-col items-center gap-1 py-10">
                          <Users className="h-10 w-10 text-muted-foreground/40 mb-2" />
                          <h3 className="font-medium">
                            {t("shelf_details.no_previous_renters")}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {t("shelf_details.rental_history_will_appear_here")}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (() => {
                  // Data state with pagination
                  const emptyRows = itemsPerPage - previousInfo.length;
                  
                  return (
                    <>
                      {previousInfo.map((info, index) => (
                        <TableRow key={index} className="h-[72px]">
                          <TableCell className="py-3 font-medium">{info.merchantName}</TableCell>
                          <TableCell className="py-3">{info.activityType}</TableCell>
                          <TableCell className="py-3">{info.rentalMethod}</TableCell>
                          <TableCell className="py-3">{formatCurrency(info.revenue)}</TableCell>
                        </TableRow>
                      ))}
                      {Array.from({ length: emptyRows }).map((_, index) => (
                        <TableRow key={`empty-${index}`} className="h-[72px]">
                          <TableCell className="py-3" colSpan={4}>&nbsp;</TableCell>
                        </TableRow>
                      ))}
                    </>
                  );
                })()}
              </TableBody>
            </Table>
          </div>
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPreviousPage(prev => Math.max(1, prev - 1))}
                  className={previousPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: Math.max(1, totalPreviousPages) }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setPreviousPage(page)}
                    isActive={previousPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setPreviousPage(prev => Math.min(Math.max(1, totalPreviousPages), prev + 1))}
                  className={previousPage === totalPreviousPages || totalPreviousPages === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("shelf_details.delete_shelf_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("shelf_details.delete_shelf_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteShelf}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t("common.deleting") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}