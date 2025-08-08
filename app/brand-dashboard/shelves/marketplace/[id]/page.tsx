"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import { MapPin, CalendarDays, Ruler, Box, AlertCircle, Paperclip, Send, Package, Calendar as CalendarIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format, addDays } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import Image from "next/image"
import { useLanguage } from "@/contexts/language-context"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

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

export default function MarketDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { t, language, direction } = useLanguage()
  
  // Fetch store details from backend
  const storeDetails = useQuery(api.stores.getStoreById, { 
    storeId: params.id as Id<"stores"> 
  }) as StoreDetails | undefined
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [productType, setProductType] = useState("")
  const [productDescription, setProductDescription] = useState("")
  const [productCount, setProductCount] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would normally handle form validation and API call
    // For now, we'll just navigate to the success page
    router.push(`/brand-dashboard/shelves/marketplace/${params.id}/success`)
  }
  
  // Loading state
  if (!storeDetails) {
    return (
      <div className="flex flex-col gap-8" dir={direction}>
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
    <div className="flex flex-col gap-8" dir={direction}>
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
                  <h1 className={`text-2xl font-bold mb-2 ${direction === "rtl" ? "font-cairo" : "font-inter"}`}>
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
                    <span className={direction === "rtl" ? "font-cairo" : "font-inter"}>
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
                  <CardTitle className={`text-xl ${direction === "rtl" ? "font-cairo" : "font-inter"}`}>
                    {t("marketplace.details.send_request_title")}
                  </CardTitle>
                  <p className={`text-muted-foreground text-sm ${direction === "rtl" ? "font-cairo" : "font-inter"}`}>
                    {t("marketplace.details.send_request_description")}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="booking-date" className={direction === "rtl" ? "font-cairo" : "font-inter"}>
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
                            direction === "rtl" ? "font-cairo" : "font-inter"
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
                          dir={direction}
                          className={direction === "rtl" ? "font-cairo" : "font-inter"}
                          classNames={{
                            today: "bg-transparent text-foreground font-normal"
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-type" className={direction === "rtl" ? "font-cairo" : "font-inter"}>
                      {t("marketplace.details.product_type")}*
                    </Label>
                    <Select value={productType} onValueChange={setProductType} required>
                      <SelectTrigger 
                        id="product-type"
                        className={direction === "rtl" ? "font-cairo" : "font-inter"}
                      >
                        <SelectValue placeholder={t("marketplace.details.select_product_type")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beauty" className={direction === "rtl" ? "font-cairo" : "font-inter"}>
                          {t("marketplace.category_beauty")}
                        </SelectItem>
                        <SelectItem value="fashion" className={direction === "rtl" ? "font-cairo" : "font-inter"}>
                          {t("marketplace.category_fashion")}
                        </SelectItem>
                        <SelectItem value="electronics" className={direction === "rtl" ? "font-cairo" : "font-inter"}>
                          {t("marketplace.category_electronics")}
                        </SelectItem>
                        <SelectItem value="grocery" className={direction === "rtl" ? "font-cairo" : "font-inter"}>
                          {t("marketplace.category_grocery")}
                        </SelectItem>
                        <SelectItem value="general" className={direction === "rtl" ? "font-cairo" : "font-inter"}>
                          {t("marketplace.category_general")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-desc" className={direction === "rtl" ? "font-cairo" : "font-inter"}>
                      {t("marketplace.details.product_description")}*
                    </Label>
                    <Textarea
                      id="product-desc"
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      placeholder={t("marketplace.details.product_description_placeholder")}
                      className={`${direction === "rtl" ? "font-cairo" : "font-inter"} min-h-[60px] h-[60px]`}
                      rows={2}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-count" className={direction === "rtl" ? "font-cairo" : "font-inter"}>
                      {t("marketplace.details.product_count")}*
                    </Label>
                    <Input
                      id="product-count"
                      type="number"
                      min="1"
                      value={productCount}
                      onChange={(e) => setProductCount(e.target.value)}
                      placeholder="50"
                      className={direction === "rtl" ? "font-cairo" : "font-inter"}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes" className={direction === "rtl" ? "font-cairo" : "font-inter"}>
                      {t("marketplace.details.additional_notes")}
                    </Label>
                    <Textarea 
                      id="notes" 
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      placeholder={t("marketplace.details.additional_notes_placeholder")}
                      className={`${direction === "rtl" ? "font-cairo" : "font-inter"} min-h-[60px] h-[60px]`}
                      rows={2}
                    />
                  </div>
                  <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertDescription className={`${direction === "rtl" ? "font-cairo" : "font-inter"} text-amber-800 dark:text-amber-200 font-medium`}>
                      {t("marketplace.details.approval_notice")}
                    </AlertDescription>
                  </Alert>
                  <Button type="submit" size="lg" className={`w-full text-base ${direction === "rtl" ? "font-cairo" : "font-inter"}`}>
                    {t("marketplace.details.submit_request")}
                  </Button>
                </CardContent>
              </form>
            </Card>

            {/* Chat */}
            <Card className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg" alt={storeDetails.ownerName || t("marketplace.owner")} />
                    <AvatarFallback className={direction === "rtl" ? "font-cairo" : "font-inter"}>
                      {language === "ar" ? "م" : (storeDetails.ownerName || "SO").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className={`font-semibold ${direction === "rtl" ? "font-cairo" : "font-inter"}`}>
                      {storeDetails.ownerName || `${t("marketplace.owner")} ${storeDetails.shelfName}`}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="default" className="h-2 w-2 rounded-full p-0 bg-green-500" />
                      <p className={`text-xs text-muted-foreground ${direction === "rtl" ? "font-cairo" : "font-inter"}`}>
                        {t("marketplace.details.online_status")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-4 p-4 bg-muted/30 overflow-y-auto min-h-[300px]">
                {/* Empty chat area - messages will be loaded from database or added dynamically */}
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p className={`text-sm ${direction === "rtl" ? "font-cairo" : "font-inter"}`}>
                    {language === "ar" ? "ابدأ محادثة مع صاحب المتجر" : "Start a conversation with the store owner"}
                  </p>
                </div>
              </CardContent>
              <div className="p-4 border-t mt-auto">
                <div className="relative">
                  <Input 
                    placeholder={t("marketplace.details.type_message")} 
                    className={`pe-20 ${direction === "rtl" ? "font-cairo" : "font-inter"}`}
                  />
                  <div className="absolute end-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
    </div>
  )
}
