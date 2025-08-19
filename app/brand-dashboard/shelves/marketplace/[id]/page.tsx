"use client"

import type React from "react"
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPin, CalendarDays, Ruler, Box, AlertCircle, MessageSquare, Package, Calendar as CalendarIcon, Store, Tag, Layers, Send, RefreshCw, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format, addDays } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import { useLanguage } from "@/contexts/localization-context"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { ChatInterface } from "@/components/chat/chat-interface"
import { useCurrentUser } from "@/hooks/use-current-user"

interface StoreDetails {
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
  shelfImage?: string | null
  exteriorImage?: string | null
  interiorImage?: string | null
  ownerId?: string
}

export default function MarketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { t, language, direction } = useLanguage()
  const { user } = useCurrentUser()
  
  // Unwrap params Promise
  const resolvedParams = use(params)
  
  // Get user ID from current user
  const userId = user?.id ? (user.id as Id<"users">) : null
  
  // State for selected image
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  
  // Fetch store details from backend
  const storeDetails = useQuery(api.stores.getStoreById, { 
    storeId: resolvedParams.id as Id<"stores"> 
  }) as StoreDetails | undefined
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [selectedProducts, setSelectedProducts] = useState<{id: string, quantity: number}[]>([])
  const [productType, setProductType] = useState("")
  const [productCount, setProductCount] = useState("")
  const [conversationId, setConversationId] = useState<Id<"conversations"> | null>(null)
  const [hasSubmittedRequest, setHasSubmittedRequest] = useState(false)
  
  // Fetch user's products
  const userProducts = useQuery(api.products.getUserProducts, 
    userId ? { userId } : "skip"
  )
  
  // Mutations
  const getOrCreateConversation = useMutation(api.chats.getOrCreateConversation)
  const createRentalRequest = useMutation(api.rentalRequests.createRentalRequest)
  
  // Check for existing active rental request
  const activeRequest = useQuery(api.rentalRequests.getActiveRentalRequest, 
    userId && storeDetails ? {
      shelfId: resolvedParams.id as Id<"shelves">,
      brandOwnerId: userId
    } : "skip"
  )
  
  // Check if shelf is still available for rental
  const shelfAvailability = useQuery(api.rentalRequests.isShelfAvailable,
    storeDetails ? {
      shelfId: resolvedParams.id as Id<"shelves">
    } : "skip"
  )
  
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
      setConversationId(activeRequest.conversationId)
      setHasSubmittedRequest(true)
      
      // Restore form data from existing request
      if (activeRequest.startDate && activeRequest.endDate) {
        setDateRange({
          from: new Date(activeRequest.startDate),
          to: new Date(activeRequest.endDate)
        })
      }
      if (activeRequest.productType) {
        setProductType(activeRequest.productType)
      }
      if (activeRequest.selectedProductIds && activeRequest.selectedProductIds.length > 0) {
        // Restore selected products with their actual quantities from the request
        const restoredProducts = activeRequest.selectedProductIds.map((productId: string, index: number) => ({
          id: productId,
          quantity: activeRequest.selectedProductQuantities?.[index] || 1
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
    
    if (!dateRange?.from || !dateRange?.to || selectedProducts.length === 0 || !productType) {
      alert(t("form.fill_required_fields"))
      return
    }
    
    if (!userId || !storeDetails?.ownerId) {
      alert(t("form.login_first"))
      return
    }
    
    try {
      // First, create or get conversation
      let convId = conversationId
      if (!convId) {
        convId = await getOrCreateConversation({
          brandOwnerId: userId,
          storeOwnerId: storeDetails.ownerId as Id<"users">,
          shelfId: resolvedParams.id as Id<"shelves">,
        })
        setConversationId(convId)
      }
      
      // Get selected product details for the request
      const selectedProductDetails = selectedProducts.map(sp => {
        const product = userProducts?.find(p => p._id === sp.id)
        return product ? `${product.name} (${sp.quantity})` : ""
      }).filter(Boolean).join(", ")
      
      const totalQuantity = selectedProducts.reduce((total, p) => total + p.quantity, 0)
      
      // Create or update rental request
      const result = await createRentalRequest({
        shelfId: resolvedParams.id as Id<"shelves">,
        brandOwnerId: userId,
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        productType: productType,
        productDescription: selectedProductDetails,
        productCount: totalQuantity,
        additionalNotes: "",
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
        setProductType("")
      }
      
      // Mark that request has been submitted
      setHasSubmittedRequest(true)
    } catch (error) {
      console.error("Failed to submit rental request:", error)
      alert(t("form.submit_error"))
    }
  }
  
  // Loading state
  if (!storeDetails) {
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6 overflow-y-auto">
          {/* Store Details Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Image Gallery */}
                <div className="w-full md:w-1/3">
                  {(storeDetails.shelfImage || storeDetails.exteriorImage || storeDetails.interiorImage) ? (
                    <div className="space-y-2">
                      {/* Main Image */}
                      <div className="relative">
                        <img
                          src={selectedImage || storeDetails.shelfImage || storeDetails.exteriorImage || storeDetails.interiorImage || ""}
                          alt={storeDetails.shelfName}
                          className="w-full h-64 object-cover rounded-lg store-main-image"
                        />
                        <Badge className="absolute top-2 start-2 bg-background/90 backdrop-blur-sm">
                          {selectedImage === storeDetails.shelfImage || (!selectedImage && storeDetails.shelfImage === (storeDetails.shelfImage || storeDetails.exteriorImage || storeDetails.interiorImage)) ? t("marketplace.shelf_image") :
                           selectedImage === storeDetails.exteriorImage || (!selectedImage && !storeDetails.shelfImage && storeDetails.exteriorImage) ? t("marketplace.exterior_image") :
                           t("marketplace.interior_image")}
                        </Badge>
                      </div>
                      
                      {/* Thumbnail Images - Only show if multiple images exist */}
                      {[storeDetails.shelfImage, storeDetails.exteriorImage, storeDetails.interiorImage].filter(Boolean).length > 1 && (
                        <div className="grid grid-cols-3 gap-2">
                          {storeDetails.shelfImage && (
                            <div 
                              className="relative group cursor-pointer"
                              onClick={() => setSelectedImage(storeDetails.shelfImage)}
                            >
                              <img
                                src={storeDetails.shelfImage}
                                alt={`${storeDetails.shelfName} - Shelf`}
                                className={`w-full h-20 object-cover rounded-md border-2 transition-colors ${
                                  (selectedImage === storeDetails.shelfImage || (!selectedImage && storeDetails.shelfImage === (storeDetails.shelfImage || storeDetails.exteriorImage || storeDetails.interiorImage)))
                                    ? 'border-primary' : 'border-transparent hover:border-primary/50'
                                }`}
                              />
                              <div className="absolute inset-0 bg-primary/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                          {storeDetails.exteriorImage && (
                            <div 
                              className="relative group cursor-pointer"
                              onClick={() => setSelectedImage(storeDetails.exteriorImage)}
                            >
                              <img
                                src={storeDetails.exteriorImage}
                                alt={`${storeDetails.shelfName} - Exterior`}
                                className={`w-full h-20 object-cover rounded-md border-2 transition-colors ${
                                  selectedImage === storeDetails.exteriorImage 
                                    ? 'border-primary' : 'border-transparent hover:border-primary/50'
                                }`}
                              />
                              <div className="absolute inset-0 bg-primary/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                          {storeDetails.interiorImage && (
                            <div 
                              className="relative group cursor-pointer"
                              onClick={() => setSelectedImage(storeDetails.interiorImage)}
                            >
                              <img
                                src={storeDetails.interiorImage}
                                alt={`${storeDetails.shelfName} - Interior`}
                                className={`w-full h-20 object-cover rounded-md border-2 transition-colors ${
                                  selectedImage === storeDetails.interiorImage 
                                    ? 'border-primary' : 'border-transparent hover:border-primary/50'
                                }`}
                              />
                              <div className="absolute inset-0 bg-primary/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                      <Store className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-2">
                    {storeDetails.shelfName}
                  </h1>
                  <div className="flex items-baseline gap-2 mb-4">
                    <p className="text-primary text-xl font-semibold">
                      {t("common.currency_symbol")} {storeDetails.monthlyPrice.toLocaleString()}
                    </p>
                    <span className="text-sm text-muted-foreground">/ {t("marketplace.month")}</span>
                    {storeDetails.discountPercentage > 0 && (
                      <Badge variant="secondary">
                        {t("marketplace.sales_commission")}: {storeDetails.discountPercentage}%
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-start gap-2 text-muted-foreground mb-6">
                    <MapPin className="h-5 w-5 mt-1 flex-shrink-0" />
                    <span>
                      {storeDetails.address || `${storeDetails.city}, ${storeDetails.branch}`}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center">
                      <CalendarDays className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {t("marketplace.available_from")}
                      </p>
                      <p className="text-sm font-semibold">
                        {new Date(storeDetails.availableFrom).toLocaleDateString(
                          language === "ar" ? "ar-SA" : "en-US",
                          { month: 'long', day: 'numeric' }
                        )}
                      </p>
                    </div>
                    <div className="text-center">
                      <Ruler className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {t("marketplace.dimensions")}
                      </p>
                      <p className="text-sm font-semibold">
                        {storeDetails.width}×{storeDetails.length}×{storeDetails.depth}cm
                      </p>
                    </div>
                    <div className="text-center">
                      <Package className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {t("marketplace.shelf_type")}
                      </p>
                      <p className="text-sm font-semibold">
                        {storeDetails.productType || t("marketplace.general")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rental Request Form - Merged Section */}
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">
                  {t("marketplace.details.send_request_title")}
                </CardTitle>
                <p className="text-muted-foreground text-xs mt-1">
                  {t("marketplace.details.send_request_description")}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Product Selection Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {t("marketplace.details.select_products")}
                      <span className="text-destructive">*</span>
                    </Label>
                    {userProducts && userProducts.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {userProducts.length} {language === "ar" ? "منتج متاح" : "available"}
                      </span>
                    )}
                  </div>
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
                    <div className="border rounded-lg bg-background">
                      <div className={`p-2 space-y-1.5 ${userProducts.length > 3 ? 'max-h-[200px] overflow-y-auto scrollbar-thin' : ''}`}>
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
                                disabled={shelfAvailability && !shelfAvailability.available}
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
                                        disabled={selectedProduct?.quantity === 1}
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
                                        disabled={selectedProduct?.quantity === product.quantity}
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          const currentQty = selectedProduct?.quantity || 1
                                          if (currentQty < product.quantity) {
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
                    </div>
                  )}
                </div>

                {/* Selected Products Summary - Enhanced */}
                {selectedProducts.length > 0 && (
                  <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
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
                )}
                  {/* Booking Details */}
                  <Separator />
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="booking-date" className="text-sm">
                        {t("marketplace.details.booking_duration")}*
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="booking-date"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
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
                              const today = new Date()
                              today.setHours(0, 0, 0, 0)
                              return date < today
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="product-type" className="text-sm">
                        {t("marketplace.details.product_type")}*
                      </Label>
                      <Select 
                        value={productType} 
                        onValueChange={setProductType}
                        required
                        disabled={shelfAvailability && !shelfAvailability.available}
                      >
                        <SelectTrigger id="product-type">
                          <SelectValue placeholder={t("marketplace.details.select_product_type")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beauty">{t("marketplace.category_beauty")}</SelectItem>
                          <SelectItem value="fashion">{t("marketplace.category_fashion")}</SelectItem>
                          <SelectItem value="electronics">{t("marketplace.category_electronics")}</SelectItem>
                          <SelectItem value="grocery">{t("marketplace.category_grocery")}</SelectItem>
                          <SelectItem value="sports">{t("marketplace.category_sports")}</SelectItem>
                          <SelectItem value="home">{t("marketplace.category_home")}</SelectItem>
                          <SelectItem value="toys">{t("marketplace.category_toys")}</SelectItem>
                          <SelectItem value="books">{t("marketplace.category_books")}</SelectItem>
                          <SelectItem value="general">{t("marketplace.category_general")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Note about approval */}
                  {(!shelfAvailability || shelfAvailability.available) && (
                    <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                      <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                        {t("marketplace.details.approval_notice")}
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full h-12 text-base font-medium shadow-md hover:shadow-lg transition-all duration-200"
                      disabled={selectedProducts.length === 0 || !dateRange || !productType || (shelfAvailability && !shelfAvailability.available)}
                    >
                      {shelfAvailability && !shelfAvailability.available ? (
                        <span className="flex items-center gap-2">
                          <X className="h-5 w-5" />
                          {language === "ar" ? "الرف غير متاح" : "Shelf Unavailable"}
                        </span>
                      ) : activeRequest ? (
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
                    {selectedProducts.length === 0 && (
                      <p className="text-xs text-center text-muted-foreground">
                        {language === "ar" ? "يرجى اختيار منتج واحد على الأقل للمتابعة" : "Please select at least one product to continue"}
                      </p>
                    )}
                  </div>
              </CardContent>
            </form>
          </Card>
        </div>

        {/* Sidebar - Right Side */}
        <div className="flex flex-col gap-6 h-full overflow-hidden">
          {/* Communication Card */}
          <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages Area */}
              <div className="flex-1 relative">
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
                    otherUserName={storeDetails.ownerName || `${t("marketplace.owner")} ${storeDetails.shelfName}`}
                    shelfName={storeDetails.shelfName}
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
