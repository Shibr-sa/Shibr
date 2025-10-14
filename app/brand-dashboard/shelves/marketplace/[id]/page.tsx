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
import { MapPin, CalendarDays, Ruler, Box, AlertCircle, MessageSquare, Package, Calendar as CalendarIcon, Store, Tag, Layers, Send, RefreshCw, X, Building, Navigation, DollarSign, Star, FileText, Check, Clock, CreditCard, CheckCircle, XCircle } from "lucide-react"
import Image from "next/image"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format, addDays } from "date-fns"
import { formatCurrency } from "@/lib/formatters"
import { ar, enUS } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import { useLanguage } from "@/contexts/localization-context"
import { useQuery, useMutation, useAction } from "convex/react"
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

  // Get payment-related parameters from URL (for Tap redirect)
  const chargeId = searchParams.get("tap_id") ||
    searchParams.get("charge_id") ||
    searchParams.get("id") ||
    searchParams.get("chargeId")
  const rentalRequestIdFromUrl = searchParams.get("rentalRequestId") as Id<"rentalRequests"> | null

  // Get user ID and profile ID from current user
  const userId = user?.id ? (user.id as Id<"users">) : null
  const userProfileId = userData?.profile?._id as Id<"brandProfiles"> | undefined

  // State for selected image
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // Fetch shelf details from backend
  const shelfDetails = useQuery(api.shelves.getShelfById, {
    shelfId: resolvedParams.id as Id<"shelves">
  }) as ShelfDetails | undefined

  // Fetch platform settings for dynamic fee percentage
  const platformSettings = useQuery(api.platformSettings.getPlatformSettings)

  // Fetch rental schedule for this shelf to show booked dates
  const rentalSchedule = useQuery(api.rentalRequests.getShelfRentalSchedule, {
    shelfId: resolvedParams.id as Id<"shelves">
  })

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [selectedProducts, setSelectedProducts] = useState<{ id: string, quantity: number }[]>([])
  // Product type is now derived from selected products
  const [conversationId, setConversationId] = useState<Id<"conversations"> | null>(urlConversationId)
  const [hasSubmittedRequest, setHasSubmittedRequest] = useState(!!urlConversationId)

  // Payment-related state
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)

  // Helper function to calculate rental months
  const calculateRentalMonths = (from: Date | undefined, to: Date | undefined) => {
    if (!from || !to) return 0
    const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(1, Math.ceil(daysDiff / 30))
  }

  // Calculate the first available date for booking
  const getFirstAvailableDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const availableFrom = shelfDetails ? new Date(shelfDetails.availableFrom) : tomorrow
    availableFrom.setHours(0, 0, 0, 0)

    let firstAvailable = availableFrom > tomorrow ? availableFrom : tomorrow

    // If there are active rentals, find the first available date after all rentals
    if (rentalSchedule && rentalSchedule.length > 0) {
      const activeRentals = rentalSchedule
        .filter(r => r.status === "active" || r.status === "payment_pending")
        .sort((a, b) => b.endDate - a.endDate) // Sort by end date, latest first

      if (activeRentals.length > 0) {
        const lastRentalEnd = new Date(activeRentals[0].endDate)
        lastRentalEnd.setDate(lastRentalEnd.getDate() + 1) // Day after last rental ends
        lastRentalEnd.setHours(0, 0, 0, 0)

        if (lastRentalEnd > firstAvailable) {
          firstAvailable = lastRentalEnd
        }
      }
    }

    return firstAvailable
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

  // Actions
  const createCheckoutSession = useAction(api.tapPayments.createCheckoutSession)
  const verifyAndConfirmPayment = useAction(api.tapPayments.verifyAndConfirmPayment)
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
  const isFormDisabled = activeRequest?.status === 'payment_pending' ||
    activeRequest?.status === 'active' ||
    activeRequest?.status === 'completed'

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

  // Detect if user is returning from payment
  // In local dev: manually verify payment (webhooks can't reach localhost)
  // In production: webhook will handle it automatically
  useEffect(() => {
    if (chargeId && rentalRequestIdFromUrl) {
      // User returned from Tap payment gateway
      setIsVerifyingPayment(true)

      // Clean URL parameters immediately
      const newUrl = `/brand-dashboard/shelves/marketplace/${resolvedParams.id}`
      window.history.replaceState({}, "", newUrl)

      // Manual verification for local development (webhooks won't work on localhost)
      // In production with proper webhook URL, this provides a fallback if webhook is delayed
      const verifyPayment = async () => {
        try {
          console.log('Verifying payment...', { chargeId, rentalRequestIdFromUrl })
          const result = await verifyAndConfirmPayment({
            chargeId,
            rentalRequestId: rentalRequestIdFromUrl,
          })

          if (result.success) {
            console.log('Payment verified successfully')
            // Convex reactivity will update the UI automatically
          } else {
            console.error('Payment verification failed:', result.error)
            alert(result.error || 'Payment verification failed')
          }
        } catch (error) {
          console.error('Error verifying payment:', error)
          // Don't show error to user - might be already processed by webhook
        } finally {
          setIsVerifyingPayment(false)
        }
      }

      // Small delay to avoid race condition with webhook (if in production)
      setTimeout(verifyPayment, 2000)
    }
  }, [chargeId, rentalRequestIdFromUrl, resolvedParams.id, verifyAndConfirmPayment])

  // Handle payment for pending requests
  // Test Cards for Tap Payments:
  // Visa: 4508750015741019, 4440000009900010
  // MasterCard: 5123450000000008
  const handlePayment = async () => {
    if (!user || !activeRequest || !userData) {
      return
    }

    setProcessingPayment(true)

    try {
      const session = await createCheckoutSession({
        amount: activeRequest.totalAmount,
        description: `Shelf rental for ${shelfDetails?.shelfName || "Shelf"}`,
        customerName: userData.profile?.brandName || userData.profile?.fullName || userData.name || "",
        customerEmail: userData.email || "",
        customerPhone: userData.phone || "",
        rentalRequestId: activeRequest._id,
        metadata: {
          type: "rental"
        }
      })

      if (session.success && session.checkoutUrl) {
        window.location.href = session.checkoutUrl
      } else {
        alert(language === "ar" ? "فشل إنشاء جلسة الدفع" : "Failed to create payment session")
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : (language === "ar" ? "فشل الدفع" : "Payment failed"))
    } finally {
      setProcessingPayment(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Note: Removed shelf availability check - users can now book future dates

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
          storeProfileId: shelfDetails.storeProfileId as Id<"storeProfiles">,
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
                        <Image
                          src={selectedImage || (shelfDetails.images?.[0]?.url) || "/placeholder.svg?height=400&width=600"}
                          alt={shelfDetails.shelfName}
                          width={600}
                          height={400}
                          className="w-full h-64 object-cover rounded-lg"
                          unoptimized
                        />
                        {shelfDetails.images && shelfDetails.images.length > 1 && (
                          <Badge className="absolute top-3 start-3 bg-background/90 backdrop-blur-sm">
                            {shelfDetails.images.findIndex(img => img.url === (selectedImage || shelfDetails.images![0]?.url)) + 1} / {shelfDetails.images!.length}
                          </Badge>
                        )}
                      </div>

                      {/* Thumbnail Images - Only show if multiple images exist */}
                      {shelfDetails.images && shelfDetails.images.length > 1 && (
                        <div className="grid grid-cols-3 gap-2">
                          {shelfDetails.images.slice(0, 3).map((image, index) => (
                            <div
                              key={index}
                              className="relative group cursor-pointer"
                              onClick={() => setSelectedImage(image.url)}
                            >
                              <Image
                                src={image.url}
                                alt={`${shelfDetails.shelfName} - ${image.type}`}
                                width={80}
                                height={64}
                                className={`w-full h-16 object-cover rounded-md border-2 transition-colors ${(selectedImage === image.url || (!selectedImage && index === 0))
                                  ? 'border-primary' : 'border-transparent hover:border-primary/50'
                                  }`}
                                unoptimized
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

        {/* Note about approval - Always shown */}
        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
          <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
            {t("marketplace.details.approval_notice")}
          </p>
        </div>

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
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isSelected
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
                                    setSelectedProducts([...selectedProducts, { id: product._id, quantity: 1 }])
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
                                                ? { ...p, quantity: currentQty - 1 }
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
                                                ? { ...p, quantity: currentQty + 1 }
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
                            defaultMonth={dateRange?.from || getFirstAvailableDate()}
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

                              if (date < minDate) return true

                              // Check if date falls within any rental period
                              if (rentalSchedule) {
                                for (const rental of rentalSchedule) {
                                  // Only block dates for active or payment_pending rentals
                                  if (rental.status === "active" ||
                                    rental.status === "payment_pending") {
                                    const rentalStart = new Date(rental.startDate)
                                    const rentalEnd = new Date(rental.endDate)
                                    rentalStart.setHours(0, 0, 0, 0)
                                    rentalEnd.setHours(23, 59, 59, 999)

                                    if (date >= rentalStart && date <= rentalEnd) {
                                      return true // Date is within a rental period
                                    }
                                  }
                                }
                              }

                              return false
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

                    {/* Rental Schedule Display */}
                    {rentalSchedule && rentalSchedule.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          {language === "ar" ? "الحجوزات الحالية" : "Current Bookings"}
                        </Label>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {rentalSchedule
                            .filter(r => r.status === "active" || r.status === "payment_pending")
                            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                            .map((rental, index) => (
                              <div key={index} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                                <span className="font-medium">{rental.brandName}</span>
                                <span className="text-muted-foreground">
                                  {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

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
                  {activeRequest?.status === 'payment_pending' ? (
                    <Button
                      type="button"
                      size="lg"
                      className="w-full h-12 text-base font-medium shadow-md hover:shadow-lg transition-all duration-200"
                      onClick={handlePayment}
                      disabled={processingPayment}
                    >
                      {processingPayment ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      ) : (
                        <span className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5" />
                          {language === "ar" ? "ادفع الآن" : "Pay Now"}
                        </span>
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-12 text-base font-medium shadow-md hover:shadow-lg transition-all duration-200"
                      disabled={selectedProducts.length === 0 || !dateRange || isFormDisabled}
                    >
                      {activeRequest?.status === 'rejected' ? (
                        <span className="flex items-center gap-2">
                          <X className="h-5 w-5" />
                          {language === "ar" ? "الطلب مرفوض" : "Request Rejected"}
                        </span>
                      ) : activeRequest?.status === 'active' ? (
                        <span className="flex items-center gap-2">
                          <Check className="h-5 w-5" />
                          {language === "ar" ? "الإيجار نشط" : "Rental Active"}
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
                  )}
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
                {hasSubmittedRequest && conversationId && userId ? (
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

      {/* Payment Verification Banner */}
      {isVerifyingPayment && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 mt-6">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
              <p className="text-sm font-medium">
                {language === "ar" ? "جاري التحقق من الدفع..." : "Verifying payment..."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
