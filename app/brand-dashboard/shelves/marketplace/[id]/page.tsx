"use client"

import type React from "react"
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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
import { MapPin, CalendarDays, Ruler, Box, AlertCircle, MessageSquare, Package, Calendar as CalendarIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format, addDays } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import Image from "next/image"
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
  shelfImage?: string
}

export default function MarketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { t, language, direction } = useLanguage()
  const { user } = useCurrentUser()
  
  // Unwrap params Promise
  const resolvedParams = use(params)
  
  // Get user ID from current user
  const userId = user?.id ? (user.id as Id<"users">) : null
  
  // Fetch store details from backend
  const storeDetails = useQuery(api.stores.getStoreById, { 
    storeId: resolvedParams.id as Id<"stores"> 
  }) as StoreDetails | undefined
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [productType, setProductType] = useState("")
  const [productDescription, setProductDescription] = useState("")
  const [productCount, setProductCount] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [conversationId, setConversationId] = useState<Id<"conversations"> | null>(null)
  const [hasSubmittedRequest, setHasSubmittedRequest] = useState(false)
  
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
  
  // Set conversation and submission state if there's an existing request
  useEffect(() => {
    if (activeRequest?.conversationId) {
      setConversationId(activeRequest.conversationId)
      setHasSubmittedRequest(true)
    }
  }, [activeRequest])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!dateRange?.from || !dateRange?.to || !productType || !productDescription || !productCount) {
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
      
      // Create or update rental request
      const result = await createRentalRequest({
        shelfId: resolvedParams.id as Id<"shelves">,
        brandOwnerId: userId,
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        productType,
        productDescription,
        productCount: parseInt(productCount),
        additionalNotes,
        conversationId: convId,
      })
      
      // Show success message based on whether it was created or updated
      if (result.isUpdate) {
        alert(t("form.request_updated_success"))
      } else {
        alert(t("form.request_submitted_success"))
      }
      
      // Mark that request has been submitted
      setHasSubmittedRequest(true)
      
      // Reset form fields
      setDateRange(undefined)
      setProductType("")
      setProductDescription("")
      setProductCount("")
      setAdditionalNotes("")
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
                <Image
                  src={storeDetails.shelfImage || "/placeholder.svg"}
                  alt={storeDetails.shelfName}
                  width={500}
                  height={300}
                  className="w-full md:w-1/3 h-64 object-cover rounded-lg"
                />
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
                      <Badge variant="default" className="animate-pulse">
                        {t("marketplace.save")} {storeDetails.discountPercentage}%
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

          {/* Bottom Section: Form and Chat */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Rental Form */}
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
                    <Select value={productType} onValueChange={setProductType} required>
                      <SelectTrigger 
                        id="product-type"
                      >
                        <SelectValue placeholder={t("marketplace.details.select_product_type")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beauty" >
                          {t("marketplace.category_beauty")}
                        </SelectItem>
                        <SelectItem value="fashion" >
                          {t("marketplace.category_fashion")}
                        </SelectItem>
                        <SelectItem value="electronics" >
                          {t("marketplace.category_electronics")}
                        </SelectItem>
                        <SelectItem value="grocery" >
                          {t("marketplace.category_grocery")}
                        </SelectItem>
                        <SelectItem value="general" >
                          {t("marketplace.category_general")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-desc" >
                      {t("marketplace.details.product_description")}*
                    </Label>
                    <Textarea
                      id="product-desc"
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      placeholder={t("marketplace.details.product_description_placeholder")}
                      className={` min-h-[60px] h-[60px]`}
                      rows={2}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-count" >
                      {t("marketplace.details.product_count")}*
                    </Label>
                    <Input
                      id="product-count"
                      type="number"
                      min="1"
                      value={productCount}
                      onChange={(e) => setProductCount(e.target.value)}
                      placeholder="50"
                                            required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes" >
                      {t("marketplace.details.additional_notes")}
                    </Label>
                    <Textarea 
                      id="notes" 
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      placeholder={t("marketplace.details.additional_notes_placeholder")}
                      className={` min-h-[60px] h-[60px]`}
                      rows={2}
                    />
                  </div>
                  <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertDescription className={` text-amber-800 dark:text-amber-200 font-medium`}>
                      {t("marketplace.details.approval_notice")}
                    </AlertDescription>
                  </Alert>
                  <Button type="submit" size="lg" className={`w-full text-base `}>
                    {t("marketplace.details.submit_request")}
                  </Button>
                </CardContent>
              </form>
            </Card>

            {/* Chat - Only show after rental request submission */}
            {hasSubmittedRequest && conversationId && userId ? (
              <div className="h-[600px]">
                <ChatInterface
                  conversationId={conversationId}
                  currentUserId={userId}
                  currentUserType="brand-owner"
                  otherUserName={storeDetails.ownerName || `${t("marketplace.owner")} ${storeDetails.shelfName}`}
                  shelfName={storeDetails.shelfName}
                />
              </div>
            ) : (
              <Card className="h-[600px] flex items-center justify-center">
                <div className="text-center p-6 space-y-3">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <div>
                    <p className={`font-semibold text-lg `}>
                      {t("form.chat_unavailable")}
                    </p>
                    <p className={`text-muted-foreground text-sm mt-2 `}>
                      {!userId 
                        ? t("form.login_first")
                        : (language === "ar" 
                          ? "قم بإرسال طلب الإيجار أولاً للتواصل مع صاحب المتجر" 
                          : "Submit a rental request first to chat with the store owner")
                      }
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
    </div>
  )
}
