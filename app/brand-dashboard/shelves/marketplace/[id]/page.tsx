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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPin, CalendarDays, Ruler, Box, AlertCircle, MessageSquare, Package, Calendar as CalendarIcon, Store, Tag, Layers } from "lucide-react"
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
  const [productDescription, setProductDescription] = useState("")
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
      if (activeRequest.productDescription) {
        setProductDescription(activeRequest.productDescription)
      }
      if (activeRequest.selectedProductIds && activeRequest.selectedProductIds.length > 0) {
        // Restore selected products with their quantities
        const restoredProducts = activeRequest.selectedProductIds.map((productId: string) => ({
          id: productId,
          quantity: 1 // Default quantity, you may want to store this in the request
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
        productDescription: `${selectedProductDetails}${productDescription ? ` - ${productDescription}` : ""}`,
        productCount: totalQuantity,
        additionalNotes: "",
        conversationId: convId,
        selectedProductIds: selectedProducts.map(p => p.id) as Id<"products">[],
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
        setProductDescription("")
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
    <div className="flex flex-col gap-8">
          {/* Top Section: Store Details */}
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

          {/* Middle Section: Product Selection and Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="flex flex-col gap-4">
              {/* Product Selection Card */}
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">
                    {t("marketplace.details.select_products")}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {t("marketplace.details.select_products_description")}
                  </p>
                </CardHeader>
                <CardContent className="p-0">
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
                    <div className="px-4 pt-0 pb-4 overflow-y-auto max-h-[400px]">
                      <div className="grid gap-2">
                        {userProducts.map((product) => {
                          const selectedProduct = selectedProducts.find(p => p.id === product._id)
                          const isSelected = !!selectedProduct
                          
                          return (
                            <div 
                              key={product._id} 
                              className={`relative border rounded-lg transition-all ${
                                isSelected 
                                  ? 'border-primary bg-primary/5 shadow-sm' 
                                  : 'border-border hover:border-primary/50 hover:shadow-sm'
                              }`}
                            >
                              <div className="p-4">
                                <div className="flex items-center gap-3">
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
                                  />
                                  <div className="flex-1">
                                    <label 
                                      htmlFor={product._id} 
                                      className="cursor-pointer flex-1"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-sm">{product.name}</span>
                                          <span className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                                            <Layers className="h-3 w-3" />
                                            {t("products.stock")}: {product.quantity}
                                          </span>
                                        </div>
                                        <span className="text-sm font-medium ml-auto">
                                          {t("common.currency_symbol")} {product.price}
                                        </span>
                                      </div>
                                    </label>
                                  </div>
                                </div>
                                
                                {isSelected && (
                                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                      {t("marketplace.details.quantity")}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => {
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
                                        <span className="text-lg">−</span>
                                      </Button>
                                      <Input
                                        type="number"
                                        min="1"
                                        max={product.quantity}
                                        value={selectedProduct?.quantity || 1}
                                        onChange={(e) => {
                                          const newQuantity = parseInt(e.target.value) || 1
                                          setSelectedProducts(selectedProducts.map(p => 
                                            p.id === product._id 
                                              ? {...p, quantity: Math.min(newQuantity, product.quantity)}
                                              : p
                                          ))
                                        }}
                                        className="w-16 h-7 text-center"
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => {
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
                                        <span className="text-lg">+</span>
                                      </Button>
                                      <span className="text-xs text-muted-foreground ml-1">
                                        {language === "ar" ? "من" : "of"} {product.quantity}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Selected Products Summary - Separate Card at Bottom */}
              <Card className="bg-primary/5">
                <CardContent className="p-4">
                  <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4" />
                    {t("marketplace.details.selected_products_summary")}
                  </h4>
                  {selectedProducts.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{selectedProducts.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("marketplace.details.products_selected")}
                        </p>
                      </div>
                      <div className="text-center border-x">
                        <p className="text-2xl font-bold">
                          {selectedProducts.reduce((total, p) => total + p.quantity, 0)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("marketplace.details.total_items")}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {selectedProducts.reduce((total, selectedProduct) => {
                            const product = userProducts.find(p => p._id === selectedProduct.id)
                            return total + ((product?.price || 0) * selectedProduct.quantity)
                          }, 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("marketplace.details.total_value")} {t("common.currency_symbol")}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {language === "ar" 
                          ? "لم يتم اختيار أي منتجات بعد"
                          : "No products selected yet"}
                      </p>
                      <p className="text-xs text-destructive font-medium">
                        {language === "ar" 
                          ? "* يجب اختيار منتج واحد على الأقل لإرسال الطلب"
                          : "* At least one product must be selected to submit request"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Rental Form */}
            <Card>
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">
                    {t("marketplace.details.send_request_title")}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {t("marketplace.details.send_request_description")}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {activeRequest && (
                    <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
                      <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertDescription className="text-blue-800 dark:text-blue-200">
                        {language === "ar" 
                          ? "أنت تقوم بتحديث طلب الإيجار الحالي. التغييرات ستحل محل الطلب السابق."
                          : "You are updating your existing rental request. Changes will replace the previous request."}
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="booking-date">
                      {t("marketplace.details.booking_duration")}*
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="booking-date"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal ps-10 relative",
                            !dateRange && "text-muted-foreground",
                          )}
                          disabled={shelfAvailability && !shelfAvailability.available}
                        >
                          <CalendarIcon className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "PPP", { 
                                  locale: language === "ar" ? ar : enUS 
                                })} - {format(dateRange.to, "PPP", { 
                                  locale: language === "ar" ? ar : enUS 
                                })}
                              </>
                            ) : (
                              format(dateRange.from, "PPP", { 
                                locale: language === "ar" ? ar : enUS 
                              })
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
                          classNames={{
                            today: "bg-transparent text-foreground font-normal"
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product-type">
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

                  <div className="space-y-2">
                    <Label htmlFor="additional-details">
                      {t("marketplace.details.additional_product_details")}
                    </Label>
                    <Textarea 
                      id="additional-details" 
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      placeholder={language === "ar" 
                        ? "أضف أي تفاصيل إضافية حول المنتجات المختارة..."
                        : "Add any additional details about the selected products..."}
                      className="min-h-[80px]"
                      disabled={shelfAvailability && !shelfAvailability.available}
                    />
                  </div>

                  {shelfAvailability && !shelfAvailability.available && shelfAvailability.acceptedByOther ? (
                    <Alert className="border-destructive bg-destructive/10">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <AlertDescription className="text-destructive font-semibold">
                        {language === "ar" 
                          ? "هذا الرف لم يعد متاحاً. تم قبول طلب إيجار من علامة تجارية أخرى."
                          : "This shelf is no longer available. A rental request from another brand has been accepted."}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <AlertDescription className={` text-amber-800 dark:text-amber-200 font-medium`}>
                        {t("marketplace.details.approval_notice")}
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button 
                    type="submit" 
                    size="lg" 
                    className={`w-full text-base `}
                    disabled={selectedProducts.length === 0 || (shelfAvailability && !shelfAvailability.available)}
                  >
                    {shelfAvailability && !shelfAvailability.available ? 
                      (language === "ar" ? "الرف غير متاح" : "Shelf Unavailable") :
                      activeRequest ? 
                        (language === "ar" ? "تحديث طلب الإيجار" : "Update Rental Request") :
                        t("marketplace.details.submit_request")
                    }
                  </Button>
                </CardContent>
              </form>
            </Card>
          </div>

          {/* Bottom Section: Communication */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {t("marketplace.details.communication_title")}
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                {t("marketplace.details.communication_description")}
              </p>
            </CardHeader>
            <CardContent>
              {/* Chat - Only show after rental request submission */}
              {shelfAvailability && !shelfAvailability.available && shelfAvailability.acceptedByOther ? (
                <div className="h-[400px] flex items-center justify-center border rounded-lg bg-muted/10">
                  <div className="text-center p-6 space-y-3">
                    <div className="h-16 w-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                      <AlertCircle className="h-8 w-8 text-destructive" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">
                        {language === "ar" ? "المحادثة غير متاحة" : "Chat Unavailable"}
                      </p>
                      <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
                        {language === "ar" 
                          ? "لا يمكن بدء محادثة لأن هذا الرف تم حجزه لعلامة تجارية أخرى"
                          : "Cannot start a conversation because this shelf has been reserved for another brand"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : hasSubmittedRequest && conversationId && userId ? (
                <div className="h-[500px]">
                  <ChatInterface
                    conversationId={conversationId}
                    currentUserId={userId}
                    currentUserType="brand-owner"
                    otherUserName={storeDetails.ownerName || `${t("marketplace.owner")} ${storeDetails.shelfName}`}
                    shelfName={storeDetails.shelfName}
                  />
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center border rounded-lg bg-muted/10">
                  <div className="text-center p-6 space-y-3">
                    <div className="h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">
                        {t("form.chat_unavailable")}
                      </p>
                      <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
                        {!userId 
                          ? t("form.login_first")
                          : (language === "ar" 
                            ? "قم بإرسال طلب الإيجار أولاً للتواصل مع صاحب المتجر" 
                            : "Submit a rental request first to chat with the store owner")
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
    </div>
  )
}
