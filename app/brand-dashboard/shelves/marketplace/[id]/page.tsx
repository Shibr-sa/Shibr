"use client"

import type React from "react"
import { useState, useEffect, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPin, CalendarDays, Ruler, Box, AlertCircle, MessageSquare, Package, Calendar as CalendarIcon, Store, Tag, Layers, Send, RefreshCw, X, Building, Navigation, DollarSign, Star, FileText, Check, Clock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format, addDays } from "date-fns"
import { formatCurrency } from "@/lib/formatters"
import { ar, enUS } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import { useLanguage } from "@/contexts/localization-context"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { ChatInterface } from "@/components/chat/chat-interface"
import { QRStoreCard } from "@/components/qr-store-card"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useBrandData } from "@/contexts/brand-data-context"

interface ShelfDetails {
  _id: string
  shelfName: string
  city: string
  branch: string
  address?: string
  coordinates?: {
    lat: number
    lng: number
  }
  location?: {
    lat: number
    lng: number
    address: string
  }
  monthlyPrice: number
  storeCommission: number
  availableFrom: string
  productType?: string
  productTypes?: string[]
  description?: string
  storeBranch?: string
  shelfSize: {
    width: number
    height: number
    depth: number
    unit: string
  }
  ownerName?: string
  shelfImage?: string | null
  exteriorImage?: string | null
  interiorImage?: string | null
  storeProfileId?: string
  ownerProfileId?: string
  images?: Array<{
    url: string
    type: string
  }>
}

export default function MarketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, language, direction } = useLanguage()
  const { user } = useCurrentUser()
  const { userData } = useBrandData()
  
  // Unwrap params Promise
  const resolvedParams = use(params)
  
  // Get conversation ID from URL if present
  const urlConversationId = searchParams.get('conversation') as Id<"conversations"> | null
  
  // Get user ID and profile ID from current user
  const userId = user?.id ? (user.id as Id<"users">) : null
  const userProfileId = userData?.profile?._id as Id<"userProfiles"> | undefined
  
  // State for selected image
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  
  // Fetch shelf details from backend
  const shelfDetails = useQuery(api.shelves.getShelfById, { 
    shelfId: resolvedParams.id as Id<"shelves"> 
  }) as ShelfDetails | undefined
  
  // Fetch platform settings for dynamic fee percentage
  const platformSettings = useQuery(api.platformSettings.getPlatformSettings)
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [selectedProducts, setSelectedProducts] = useState<{id: string, quantity: number}[]>([])
  // Product type is now derived from selected products
  const [conversationId, setConversationId] = useState<Id<"conversations"> | null>(urlConversationId)
  const [hasSubmittedRequest, setHasSubmittedRequest] = useState(!!urlConversationId)

  // Helper function to calculate rental months
  const calculateRentalMonths = (from: Date | undefined, to: Date | undefined) => {
    if (!from || !to) return 0
    const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(1, Math.ceil(daysDiff / 30))
  }
  
  // Check if user has an existing rental request for this shelf
  const existingRequest = useQuery(api.rentalRequests.getUserRequestForShelf,
    userId && shelfDetails ? {
      userId: userId,
      shelfId: resolvedParams.id as Id<"shelves">
    } : "skip"
  )
  
  // Set conversation ID from existing request if available
  useEffect(() => {
    if (existingRequest?.conversationId && !conversationId) {
      setConversationId(existingRequest.conversationId)
      setHasSubmittedRequest(true)
    }
  }, [existingRequest, conversationId])
  
  // Fetch user's products
  const userProducts = useQuery(api.products.getUserProducts, 
    userId ? {} : "skip"
  )
  
  // Mutations
  const getOrCreateConversation = useMutation(api.chats.getOrCreateConversation)
  const createRentalRequest = useMutation(api.rentalRequests.createRentalRequest)
  
  // Check for existing rental request (any status)
  const activeRequest = existingRequest
  
  // Check if shelf is still available for rental
  const shelfAvailability = useQuery(api.rentalRequests.isShelfAvailable,
    shelfDetails && userId ? {
      shelfId: resolvedParams.id as Id<"shelves">,
      currentUserId: userId
    } : "skip"
  )
  
  // Determine if form should be disabled based on request status
  const isFormDisabled = activeRequest?.status === 'accepted' || 
                         activeRequest?.status === 'rejected' || 
                         activeRequest?.status === 'active' ||
                         activeRequest?.status === 'payment_pending' ||
                         activeRequest?.status === 'completed' ||
                         (shelfAvailability && !shelfAvailability.available)
  
  // Check shelf availability periodically and show alert if it becomes unavailable
  useEffect(() => {
    if (shelfAvailability && !shelfAvailability.available && shelfAvailability.acceptedByOther) {
      // Only show alert once when shelf becomes unavailable
      const hasAlerted = sessionStorage.getItem(`shelf-unavailable-${resolvedParams.id}`)
      if (!hasAlerted) {
        alert(language === "ar" 
          ? "تنبيه: هذا الرف لم يعد متاحاً. تم قبول طلب إيجار من علامة تجارية أخرى."
          : "Notice: This shelf is no longer available. A rental request from another brand has been accepted.")
        sessionStorage.setItem(`shelf-unavailable-${resolvedParams.id}`, "true")
      }
    }
  }, [shelfAvailability, resolvedParams.id, language])
  
  // Set conversation and submission state if there's an existing request
  // Also restore the form data from the existing request
  useEffect(() => {
    if (activeRequest) {
      setConversationId(activeRequest.conversationId || null)
      setHasSubmittedRequest(true)
      
      // Restore form data from existing request
      if (activeRequest.startDate && activeRequest.endDate) {
        setDateRange({
          from: new Date(activeRequest.startDate),
          to: new Date(activeRequest.endDate)
        })
      }
      // Restore selected products from existing request
      if (activeRequest.selectedProducts && activeRequest.selectedProducts.length > 0) {
        // Handle new format with selectedProducts array
        const restoredProducts = activeRequest.selectedProducts.map((product: any) => ({
          id: product.productId,
          quantity: product.quantity || 1
        }))
        setSelectedProducts(restoredProducts)
      }
    }
  }, [activeRequest])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if shelf is still available
    if (shelfAvailability && !shelfAvailability.available) {
      alert(language === "ar" 
        ? "عذراً، هذا الرف لم يعد متاحاً. تم قبول طلب إيجار آخر."
        : "Sorry, this shelf is no longer available. Another rental request has been accepted.")
      return
    }
    
    if (!dateRange?.from || !dateRange?.to || selectedProducts.length === 0) {
      alert(t("form.fill_required_fields"))
      return
    }
    
    if (!userId || !userProfileId || !shelfDetails?.storeProfileId) {
      // Auth check failed - missing required data
      alert(t("form.login_first"))
      return
    }
    
    try {
      // First, create or get conversation
      let convId = conversationId
      if (!convId) {
        convId = await getOrCreateConversation({
          brandProfileId: userProfileId,
          storeProfileId: shelfDetails.storeProfileId as Id<"userProfiles">,
          shelfId: resolvedParams.id as Id<"shelves">,
        })
        setConversationId(convId)
      }
      
      // Create or update rental request with new schema
      const result = await createRentalRequest({
        shelfId: resolvedParams.id as Id<"shelves">,
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        conversationId: convId,
        selectedProductIds: selectedProducts.map(p => p.id) as Id<"products">[],
        selectedProductQuantities: selectedProducts.map(p => p.quantity),
      })
      
      // Show success message based on whether it was created or updated
      if (result.isUpdate) {
        alert(t("form.request_updated_success"))
        // Don't reset form fields when updating - preserve user's data
      } else {
        alert(t("form.request_submitted_success"))
        // Only reset form fields for new requests
        setDateRange(undefined)
        setSelectedProducts([])
        // Product type is derived from selected products
      }
      
      // Mark that request has been submitted
      setHasSubmittedRequest(true)
    } catch (error) {
      console.error("Failed to submit rental request:", error)
      alert(t("form.submit_error"))
    }
  }
  
  // Loading state
  if (!shelfDetails) {
    return (
      <div className="flex flex-col gap-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-6">
              <Skeleton className="w-full md:w-1/3 h-64 rounded-lg" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Separator />
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <div className="space-y-6">
        {/* Shelf Details Card with Images - Combined Design */}
        <div>
          <Card className="overflow-hidden">
            <div className="bg-muted/50 px-6 py-3 border-b">
              <h3 className="text-base font-semibold">
                {t("marketplace.shelf_details")}
              </h3>
            </div>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left side - Shelf Information */}
                <div className="lg:col-span-2 space-y-4">
                  {/* First Row - Shelf Name, Branch, Address */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Tag className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <Label className="text-xs text-muted-foreground font-normal">
                        {t("marketplace.shelf_name")}
                      </Label>
                      <p className="text-sm font-medium truncate" title={shelfDetails.shelfName}>
                        {shelfDetails.shelfName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Store className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <Label className="text-xs text-muted-foreground font-normal">
                        {t("marketplace.branch")}
                      </Label>
                      <p className="text-sm font-medium truncate" title={shelfDetails.storeBranch}>
                        {shelfDetails.storeBranch}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <Label className="text-xs text-muted-foreground font-normal">
                        {t("common.address")}
                      </Label>
                      {shelfDetails.location ? (
                        <a 
                          href={`https://www.google.com/maps?q=${shelfDetails.location.lat},${shelfDetails.location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary hover:underline block truncate"
                          title={shelfDetails.location.address || shelfDetails.city}
                        >
                          {shelfDetails.location.address || shelfDetails.city || t("marketplace.view_on_map")}
                        </a>
                      ) : shelfDetails.coordinates ? (
                        <a 
                          href={`https://www.google.com/maps?q=${shelfDetails.coordinates.lat},${shelfDetails.coordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary hover:underline block truncate"
                          title={shelfDetails.address || shelfDetails.city}
                        >
                          {shelfDetails.address || shelfDetails.city || t("marketplace.view_on_map")}
                        </a>
                      ) : (
                        <p className="text-sm font-medium">-</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Second Row - Price & Commission, Dimensions, Available From */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <Label className="text-xs text-muted-foreground font-normal">
                        {t("marketplace.price_and_commission")}
                      </Label>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate" title={formatCurrency(shelfDetails.monthlyPrice, language)}>
                          {formatCurrency(shelfDetails.monthlyPrice, language)}
                        </p>
                        <Badge variant="secondary" className="text-xs px-2 py-0">
                          {`${(shelfDetails.storeCommission || 0) + (platformSettings?.brandSalesCommission || 8)}%`}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Ruler className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <Label className="text-xs text-muted-foreground font-normal">
                        {t("marketplace.dimensions")}
                      </Label>
                      <p className="text-sm font-medium truncate" title={`${shelfDetails.shelfSize.width}×${shelfDetails.shelfSize.height}×${shelfDetails.shelfSize.depth}${shelfDetails.shelfSize.unit}`}>
                        {shelfDetails.shelfSize.width}×{shelfDetails.shelfSize.height}×{shelfDetails.shelfSize.depth}{shelfDetails.shelfSize.unit}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CalendarDays className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <Label className="text-xs text-muted-foreground font-normal">
                        {t("marketplace.available_from")}
                      </Label>
                      <p className="text-sm font-medium truncate">
                        {new Date(shelfDetails.availableFrom).toLocaleDateString(
                          "en-US",
                          { month: 'short', day: 'numeric', year: 'numeric' }
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Store Description Section */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground font-normal">
                      {t("common.description")}
                    </Label>
                    <p className="text-sm leading-relaxed">
                      {shelfDetails.description || "-"}
                    </p>
                  </div>
                </div>

                {/* Product Types Section */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground font-normal">
                      {t("marketplace.shelf_type")}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {shelfDetails.productTypes && shelfDetails.productTypes.length > 0 ? (
                        shelfDetails.productTypes.map((type, index) => {
                          // Try product_categories translation first
                          let translationKey = `product_categories.${type}`;
                          let translation = t(translationKey as any);
                          
                          // If not found, format the type name
                          const displayText = translation === translationKey
                            ? type.split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')
                            : translation;
                          
                          return (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {displayText}
                            </Badge>
                          );
                        })
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {t("product_categories.other")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                </div>

                {/* Right side - Shelf Images */}
                <div className="lg:col-span-1">
                  {shelfDetails.images && shelfDetails.images.length > 0 ? (
                    <div className="space-y-4">
                  {/* Main Image */}
                  <div className="relative">
                    <img
                      src={selectedImage || (shelfDetails.images[0]?.url) || "/placeholder.svg?height=400&width=600"}
                      alt={shelfDetails.shelfName}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    {shelfDetails.images.length > 1 && (
                      <Badge className="absolute top-3 start-3 bg-background/90 backdrop-blur-sm">
                        {shelfDetails.images.findIndex(img => img.url === (selectedImage || shelfDetails.images[0]?.url)) + 1} / {shelfDetails.images.length}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Thumbnail Images - Only show if multiple images exist */}
                  {shelfDetails.images.length > 1 && (
                    <div className="grid grid-cols-3 gap-2">
                      {shelfDetails.images.slice(0, 3).map((image, index) => (
                        <div 
                          key={index}
                          className="relative group cursor-pointer"
                          onClick={() => setSelectedImage(image.url)}
                        >
                          <img
                            src={image.url}
                            alt={`${shelfDetails.shelfName} - ${image.type}`}
                            className={`w-full h-16 object-cover rounded-md border-2 transition-colors ${
                              (selectedImage === image.url || (!selectedImage && index === 0))
                                ? 'border-primary' : 'border-transparent hover:border-primary/50'
                            }`}
                          />
                          <div className="absolute inset-0 bg-primary/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  )}
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                      <Store className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Note about approval - Between Shelf Details and Send your rental request */}
        {(!shelfAvailability || shelfAvailability.available) && (
          <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              {t("marketplace.details.approval_notice")}
            </p>
          </div>
        )}

        {/* QR Store Section - Only for active rentals */}
        {activeRequest?.status === 'active' && activeRequest._id && (
          <div className="mb-6">
            <QRStoreCard rentalRequestId={activeRequest._id as Id<"rentalRequests">} />
          </div>
        )}

        {/* Bottom Row - Rental Request and Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rental Request Form - Enhanced Design */}
          <Card className="overflow-hidden lg:col-span-2">
            <form onSubmit={handleSubmit}>
              <div className="bg-muted/50 px-6 py-3 border-b">
                <h3 className="text-base font-semibold">
                  {t("marketplace.details.send_request_title")}
                </h3>
              </div>
              <CardContent className="p-6 space-y-6">
                {/* Combined Product Selection and Summary in Single Card */}
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20 overflow-hidden">
                  {/* Products Summary Header */}
                  <div className="p-4 border-b border-primary/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {selectedProducts.length} {t("marketplace.details.products_selected")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {selectedProducts.reduce((total, p) => total + p.quantity, 0)} {language === "ar" ? "إجمالي القطع" : "total items"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{t("marketplace.details.total_value")}</p>
                        <p className="text-lg font-bold text-primary">
                          {t("common.currency_symbol")} {selectedProducts.reduce((total, selectedProduct) => {
                            const product = userProducts?.find(p => p._id === selectedProduct.id)
                            return total + ((product?.price || 0) * selectedProduct.quantity)
                          }, 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Product Selection List Inside Same Card */}
                  <div className="p-4 bg-background/30">
                    {!userProducts || userProducts.length === 0 ? (
                    <div className="min-h-[320px] flex items-center justify-center px-6">
                      <div className="text-center">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">
                          {language === "ar" 
                            ? "لم تقم بإضافة منتجات بعد" 
                            : "You haven't added any products yet"}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => router.push("/brand-dashboard/products")}
                        >
                          {t("products.add_product")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className={`space-y-1.5 ${userProducts.length > 3 ? 'max-h-[200px] overflow-y-auto scrollbar-thin' : ''}`}>
                        {userProducts.map((product) => {
                          const selectedProduct = selectedProducts.find(p => p.id === product._id)
                          const isSelected = !!selectedProduct
                          
                          return (
                            <div 
                              key={product._id}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                isSelected 
                                  ? 'bg-primary/5 border-primary/20' 
                                  : 'border-transparent hover:bg-muted/30'
                              }`}
                            >
                              <Checkbox 
                                id={product._id}
                                checked={isSelected}
                                disabled={isFormDisabled}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedProducts([...selectedProducts, {id: product._id, quantity: 1}])
                                  } else {
                                    setSelectedProducts(selectedProducts.filter(p => p.id !== product._id))
                                  }
                                }}
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <label 
                                htmlFor={product._id}
                                className="flex-1 cursor-pointer flex items-center justify-between gap-3"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{product.name}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {t("common.currency_symbol")} {product.price.toLocaleString()} • {product.quantity} {language === "ar" ? "متاح" : "available"}
                                  </div>
                                </div>
                                {isSelected ? (
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center border rounded-md">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 hover:bg-muted"
                                        disabled={selectedProduct?.quantity === 1 || isFormDisabled}
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          const currentQty = selectedProduct?.quantity || 1
                                          if (currentQty > 1) {
                                            setSelectedProducts(selectedProducts.map(p => 
                                              p.id === product._id 
                                                ? {...p, quantity: currentQty - 1}
                                                : p
                                            ))
                                          }
                                        }}
                                      >
                                        <span className="text-sm">−</span>
                                      </Button>
                                      <span className="px-3 text-sm font-medium border-x">
                                        {selectedProduct?.quantity || 1}
                                      </span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 hover:bg-muted"
                                        disabled={selectedProduct?.quantity === (product.quantity || 0) || isFormDisabled}
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          const currentQty = selectedProduct?.quantity || 1
                                          if (currentQty < (product.quantity || 0)) {
                                            setSelectedProducts(selectedProducts.map(p => 
                                              p.id === product._id 
                                                ? {...p, quantity: currentQty + 1}
                                                : p
                                            ))
                                          }
                                        }}
                                      >
                                        <span className="text-sm">+</span>
                                      </Button>
                                    </div>
                                    <div className="text-right min-w-fit">
                                      <div className="text-sm font-semibold">
                                        {t("common.currency_symbol")} {((selectedProduct?.quantity || 1) * product.price).toLocaleString()}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    {language === "ar" ? "اختر" : "Select"}
                                  </span>
                                )}
                              </label>
                            </div>
                          )
                        })}
                    </div>
                  )}
                  </div>
                </div>
                  
                  {/* Booking Details */}
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="booking-date" className="text-sm">
                        {t("marketplace.details.booking_duration")}*
                      </Label>
                      <div className="flex items-start gap-3">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id="booking-date"
                              variant="outline"
                              className={cn(
                                "flex-1 justify-start text-left font-normal",
                                !dateRange && "text-muted-foreground"
                              )}
                              disabled={shelfAvailability && !shelfAvailability.available}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateRange?.from ? (
                                dateRange.to ? (
                                  <>
                                    {format(dateRange.from, "MMM d", { locale: language === "ar" ? ar : enUS })} -
                                    {format(dateRange.to, "MMM d, yyyy", { locale: language === "ar" ? ar : enUS })}
                                  </>
                                ) : (
                                  format(dateRange.from, "MMM d, yyyy", { locale: language === "ar" ? ar : enUS })
                                )
                              ) : (
                                <span>{t("marketplace.details.pick_dates")}</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="range"
                              defaultMonth={dateRange?.from || new Date()}
                              selected={dateRange}
                              onSelect={setDateRange}
                              numberOfMonths={1}
                              disabled={(date) => {
                                // Calculate minimum date (either availableFrom or tomorrow)
                                const tomorrow = new Date()
                                tomorrow.setDate(tomorrow.getDate() + 1)
                                tomorrow.setHours(0, 0, 0, 0)

                                const availableFrom = new Date(shelfDetails.availableFrom)
                                availableFrom.setHours(0, 0, 0, 0)

                                const minDate = availableFrom > tomorrow ? availableFrom : tomorrow

                                return date < minDate
                              }}
                            />
                          </PopoverContent>
                        </Popover>

                        {/* Rental Duration Display - Always Visible */}
                        <div
                          className="flex flex-col items-center justify-center min-w-[100px] h-10 px-4 rounded-md border border-input bg-background transition-colors hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-primary/5 data-[selected=true]:border-primary/20"
                          data-selected={!!(dateRange?.from && dateRange?.to)}
                        >
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-medium">
                              {dateRange?.from && dateRange?.to
                                ? calculateRentalMonths(dateRange.from, dateRange.to)
                                : "1"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {dateRange?.from && dateRange?.to ? (
                                language === "ar"
                                  ? calculateRentalMonths(dateRange.from, dateRange.to) === 1
                                    ? "شهر"
                                    : calculateRentalMonths(dateRange.from, dateRange.to) === 2
                                    ? "شهرين"
                                    : "أشهر"
                                  : calculateRentalMonths(dateRange.from, dateRange.to) === 1
                                    ? "month"
                                    : "months"
                              ) : (
                                language === "ar" ? "شهر كحد أدنى" : "month minimum"
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Price Display - Always Visible */}
                      <div
                        className="flex items-center justify-between min-h-[52px] p-3 rounded-md border border-input bg-background transition-colors hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-primary/5 data-[selected=true]:border-primary/20"
                        data-selected={!!(dateRange?.from && dateRange?.to)}
                      >
                        <span className="text-sm text-muted-foreground">
                          {dateRange?.from && dateRange?.to
                            ? t("rental.total_price")
                            : t("marketplace.price_per_month")}
                        </span>
                        <span className="text-lg font-semibold flex items-baseline gap-1">
                          {dateRange?.from && dateRange?.to ? (
                            formatCurrency(
                              shelfDetails.monthlyPrice * calculateRentalMonths(dateRange.from, dateRange.to),
                              language
                            )
                          ) : (
                            <>
                              {formatCurrency(shelfDetails.monthlyPrice, language)}
                              <span className="text-sm font-normal text-muted-foreground">/{language === "ar" ? "شهر" : "month"}</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full h-12 text-base font-medium shadow-md hover:shadow-lg transition-all duration-200"
                      disabled={selectedProducts.length === 0 || !dateRange || isFormDisabled}
                    >
                      {shelfAvailability && !shelfAvailability.available ? (
                        <span>
                          {language === "ar" ? "الرف غير متاح" : "Shelf Unavailable"}
                        </span>
                      ) : activeRequest?.status === 'accepted' ? (
                        <span className="flex items-center gap-2">
                          <Check className="h-5 w-5" />
                          {language === "ar" ? "الطلب مقبول" : "Request Accepted"}
                        </span>
                      ) : activeRequest?.status === 'rejected' ? (
                        <span className="flex items-center gap-2">
                          <X className="h-5 w-5" />
                          {language === "ar" ? "الطلب مرفوض" : "Request Rejected"}
                        </span>
                      ) : activeRequest?.status === 'active' ? (
                        <span className="flex items-center gap-2">
                          <Check className="h-5 w-5" />
                          {language === "ar" ? "الإيجار نشط" : "Rental Active"}
                        </span>
                      ) : activeRequest?.status === 'payment_pending' ? (
                        <span className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          {language === "ar" ? "في انتظار الدفع" : "Payment Pending"}
                        </span>
                      ) : activeRequest?.status === 'pending' ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="h-5 w-5" />
                          {language === "ar" ? "تحديث طلب الإيجار" : "Update Rental Request"}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send className="h-5 w-5" />
                          {t("marketplace.details.submit_request")}
                        </span>
                      )}
                    </Button>
                  </div>
              </CardContent>
            </form>
          </Card>

          {/* Communication Card - Enhanced Design */}
          <Card className="flex flex-col overflow-hidden h-[500px]">
            <div className="bg-muted/50 px-6 py-3 border-b flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  <Store className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold truncate">
                  {shelfDetails.ownerName || t("marketplace.store_owner")}
                </h3>
              </div>
            </div>
            <CardContent className="flex-1 flex flex-col p-0 h-[calc(100%-60px)]">
              {/* Messages Area */}
              <div className="flex-1 relative h-full">
                {shelfAvailability && !shelfAvailability.available && shelfAvailability.acceptedByOther ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center p-6 space-y-3">
                      <div className="h-12 w-12 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {language === "ar" ? "المحادثة غير متاحة" : "Chat Unavailable"}
                        </p>
                        <p className="text-sm mt-2 max-w-sm mx-auto">
                          {language === "ar" 
                            ? "لا يمكن بدء محادثة لأن هذا الرف تم حجزه لعلامة تجارية أخرى"
                            : "Cannot start a conversation because this shelf has been reserved for another brand"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : hasSubmittedRequest && conversationId && userId ? (
                  <ChatInterface
                    conversationId={conversationId}
                    currentUserId={userId}
                    currentUserType="brand-owner"
                    otherUserName={shelfDetails.ownerName || `${t("marketplace.owner")} ${shelfDetails.shelfName}`}
                    shelfName={shelfDetails.shelfName}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">
                        {!userId 
                          ? t("form.login_first")
                          : (language === "ar" 
                            ? "قم بإرسال طلب الإيجار أولاً للتواصل مع صاحب المتجر" 
                            : "Submit a rental request first to chat with the store owner")
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
