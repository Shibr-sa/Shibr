"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ChatInterface } from "@/components/chat/chat-interface"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  AlertTriangle, 
  MessageSquare, 
  Download, 
  Check, 
  X, 
  Building2, 
  Globe,
  Clock,
  MapPin,
  Star,
  Package,
  User,
  FileText,
  Calendar,
  Store,
  DollarSign
} from "lucide-react"
import { useLanguage } from "@/contexts/localization-context"
import { useCurrentUser } from "@/hooks/use-current-user"
import { formatDate, formatDuration } from "@/lib/formatters"
import { cn } from "@/lib/utils"

export default function RequestDetailsPage() {
  const { t, language, direction } = useLanguage()
  const { user } = useCurrentUser()
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as Id<"rentalRequests">
  
  const [isProcessing, setIsProcessing] = useState(false)

  // Get the userId as a Convex Id
  const userId = user?.id ? (user.id as Id<"users">) : null

  // Fetch the specific rental request
  const rentalRequest = useQuery(
    api.rentalRequests.getRentalRequestById,
    requestId ? { requestId } : "skip"
  )

  // Chat mutations are now handled by ChatInterface component
  
  // Debug: Seed products mutation and query
  const allProducts = useQuery(api.products.getAllProducts)

  // Request mutations
  const acceptRequest = useMutation(api.rentalRequests.acceptRentalRequest)
  const rejectRequest = useMutation(api.rentalRequests.rejectRentalRequest)

  // Data is ready for rendering

  // Get conversation directly from rental request
  const currentConversation = useQuery(
    api.chats.getConversation,
    rentalRequest?.conversationId ? { conversationId: rentalRequest.conversationId } : "skip"
  )

  // Messages are now handled by ChatInterface component

  const handleAccept = async () => {
    if (!requestId || isProcessing) return
    setIsProcessing(true)
    try {
      await acceptRequest({ requestId })
      router.push("/store-dashboard/orders")
    } catch (error) {
      // Error accepting request
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!requestId || isProcessing) return
    setIsProcessing(true)
    try {
      await rejectRequest({ requestId })
      router.push("/store-dashboard/orders")
    } catch (error) {
      // Error rejecting request
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            {t("status.active")}
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            {t("status.pending")}
          </Badge>
        )
      case "payment_pending":
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
            {t("status.payment_pending")}
          </Badge>
        )
      case "completed":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            {t("status.completed")}
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            {t("status.rejected")}
          </Badge>
        )
      case "expired":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            {t("status.expired")}
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (!rentalRequest) {
    return (
      <div className="h-full">
        <Card className="h-full">
          <CardContent className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center justify-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full space-y-6">
      {/* Brand Information Card - Full Width */}
      <Card className="overflow-hidden">
            <div className="bg-muted/50 px-6 py-3 border-b flex items-center justify-between">
              <h3 className="text-base font-semibold">
                {t("orders.brand_details")}
              </h3>
              <div className="flex items-center gap-3">
                {rentalRequest.brandRating > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {rentalRequest.brandRating.toFixed(1)}/5
                    </span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={cn(
                            "h-4 w-4",
                            star <= Math.round(rentalRequest.brandRating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          )}
                        />
                      ))}
                    </div>
                    {rentalRequest.brandTotalRatings > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({rentalRequest.brandTotalRatings})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* First Row - 3 items */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <Label className="text-xs text-muted-foreground font-normal">
                        {t("orders.owner_name")}
                      </Label>
                      <p className="text-sm font-medium truncate" title={rentalRequest.ownerName || "-"}>
                        {rentalRequest.ownerName || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <Label className="text-xs text-muted-foreground font-normal">
                        {t("orders.city")}
                      </Label>
                      <p className="text-sm font-medium truncate" title={rentalRequest.city || rentalRequest.shelfCity || "-"}>
                        {rentalRequest.city || rentalRequest.shelfCity || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <Label className="text-xs text-muted-foreground font-normal">
                        {t("orders.business_category")}
                      </Label>
                      <p className="text-sm font-medium truncate" title={rentalRequest.businessCategory || "-"}>
                        {rentalRequest.businessCategory || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Second Row - 3 items */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <Label className="text-xs text-muted-foreground font-normal">
                        {t("orders.website")}
                      </Label>
                      {rentalRequest.website ? (
                        <a 
                          href={rentalRequest.website.startsWith('http') ? rentalRequest.website : `https://${rentalRequest.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary hover:underline truncate block"
                          title={rentalRequest.website}
                        >
                          {rentalRequest.website}
                        </a>
                      ) : (
                        <p className="text-sm font-medium">-</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <Label className="text-xs text-muted-foreground font-normal">
                        {t("orders.commercial_register_number")}
                      </Label>
                      <p className="text-sm font-medium truncate" title={rentalRequest.commercialRegisterNumber || "-"}>
                        {rentalRequest.commercialRegisterNumber || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <Label className="text-xs text-muted-foreground font-normal">
                        {t("orders.commercial_register")}
                      </Label>
                      {rentalRequest.commercialRegisterFile ? (
                        <button
                          className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                          onClick={() => {
                            if (rentalRequest.commercialRegisterFile) {
                              window.open(rentalRequest.commercialRegisterFile, '_blank')
                            }
                          }}
                        >
                          <Download className="h-3 w-3" />
                          {t("common.download")}
                        </button>
                      ) : (
                        <p className="text-sm font-medium">-</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Request Details Section - Inside the same card */}
              <div className="border-t pt-6 mt-6">
                <h3 className="font-semibold text-sm mb-4">{t("orders.request_details_title")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <Label className="text-xs text-muted-foreground font-normal">
                        {t("orders.branch")}
                      </Label>
                      <p className="text-sm font-medium truncate" title={rentalRequest.shelfBranch || "-"}>
                        {rentalRequest.shelfBranch || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <Label className="text-xs text-muted-foreground font-normal">
                        {t("orders.request_date")}
                      </Label>
                      <p className="text-sm font-medium truncate" title={rentalRequest._creationTime ? formatDate(rentalRequest._creationTime, language, 'long') : "-"}>
                        {rentalRequest._creationTime 
                          ? formatDate(rentalRequest._creationTime, language, 'long')
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <Label className="text-xs text-muted-foreground font-normal">
                        {t("orders.rental_duration")}
                      </Label>
                      <p className="text-sm font-medium truncate" title={rentalRequest.startDate && rentalRequest.endDate ? formatDuration(rentalRequest.startDate, rentalRequest.endDate, language) : "-"}>
                        {rentalRequest.startDate && rentalRequest.endDate 
                          ? formatDuration(rentalRequest.startDate, rentalRequest.endDate, language)
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <Label className="text-xs text-muted-foreground font-normal">
                        {t("marketplace.price_and_commission")}
                      </Label>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate" title={rentalRequest.monthlyPrice ? `${t("common.currency")} ${rentalRequest.monthlyPrice}` : "-"}>
                          {rentalRequest.monthlyPrice 
                            ? `${t("common.currency")} ${rentalRequest.monthlyPrice}`
                            : "-"}
                        </p>
                        {rentalRequest.storeCommission && (
                          <Badge variant="secondary" className="text-xs px-2 py-0">
                            {`${rentalRequest.storeCommission}%`}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
      </Card>
      
      {/* Alert Row */}
      {rentalRequest.status === "pending" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            {t("orders.cancel_warning")}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Side - Products Section */}
        <div className="lg:col-span-2">
          {/* Products Section - Enhanced Design like Brand Details */}
          {((rentalRequest.products && rentalRequest.products.length > 0) || 
            (rentalRequest.selectedProducts && rentalRequest.selectedProducts.length > 0)) && (
            <Card className="overflow-hidden">
              <div className="bg-muted/50 px-6 py-3 border-b">
                <h3 className="text-base font-semibold">
                  {t("orders.selected_products")}
                </h3>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {/* Handle old structure */}
                  {rentalRequest.products && rentalRequest.products.map((product: any, index: number) => (
                    <div key={product._id || `old-${index}`} className="flex items-center px-6 py-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="h-12 w-12 rounded-lg object-cover shadow-sm"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground/70" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-foreground truncate">
                            {product.name || "-"}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {product.category ? t(`product_categories.${product.category}` as any) || product.category : t("common.not_specified")}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {t("common.quantity")}: <span className="font-medium text-foreground">{product.requestedQuantity || 0}</span>
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {t("common.unit_price")}: <span className="font-medium text-foreground">{product.price ? `${t("common.currency")} ${product.price.toLocaleString()}` : "-"}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">
                          {product.price && product.requestedQuantity 
                            ? `${t("common.currency")} ${(product.price * product.requestedQuantity).toLocaleString()}`
                            : "-"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("common.subtotal")}</p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Handle new structure */}
                  {!rentalRequest.products && rentalRequest.selectedProducts && rentalRequest.selectedProducts.map((product: any, index: number) => (
                    <div key={product.productId || `new-${index}`} className="flex items-center px-6 py-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground/70" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-foreground truncate">
                            {product.name || "-"}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {product.category ? t(`product_categories.${product.category}` as any) || product.category : t("common.not_specified")}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {t("common.quantity")}: <span className="font-medium text-foreground">{product.quantity || 0}</span>
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {t("common.unit_price")}: <span className="font-medium text-foreground">{product.price ? `${t("common.currency")} ${product.price.toLocaleString()}` : "-"}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">
                          {product.price && product.quantity 
                            ? `${t("common.currency")} ${(product.price * product.quantity).toLocaleString()}`
                            : "-"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("common.subtotal")}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Professional Summary Footer */}
                <div className="bg-muted/30 px-6 py-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                        {t("common.order_summary")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {rentalRequest.products?.length || rentalRequest.selectedProducts?.length || 0} {t("common.products")} • {
                          rentalRequest.products?.reduce((sum: number, p: any) => sum + (p.requestedQuantity || 0), 0) ||
                          rentalRequest.selectedProducts?.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0) || 0
                        } {t("common.total_items")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
                        {t("common.total_amount")}
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {t("common.currency")} {
                          (rentalRequest.products?.reduce((sum: number, p: any) => 
                            sum + ((p.price || 0) * (p.requestedQuantity || 0)), 0) ||
                          rentalRequest.selectedProducts?.reduce((sum: number, p: any) => 
                            sum + ((p.price || 0) * (p.quantity || 0)), 0) || 0
                          ).toLocaleString()
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Accept/Reject Buttons - Below Selected Products */}
          {rentalRequest.status === "pending" && (
            <div className="flex items-center gap-3 mt-6">
              <Button
                size="lg"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleAccept}
                disabled={isProcessing}
              >
                {t("orders.accept")}
              </Button>
              <Button
                size="lg"
                variant="destructive"
                className="flex-1"
                onClick={handleReject}
                disabled={isProcessing}
              >
                {t("orders.reject")}
              </Button>
            </div>
          )}
        </div>

        {/* Right Side - Communication Card with Enhanced Design */}
        <Card className="flex flex-col overflow-hidden h-[500px]">
          <div className="bg-muted/50 px-6 py-3 border-b flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold truncate">
                {rentalRequest.ownerName || rentalRequest.brandName || t("common.brand_owner")}
              </h3>
            </div>
          </div>
          <CardContent className="flex-1 flex flex-col p-0 h-[calc(100%-60px)]">
            {/* Messages Area */}
            <div className="flex-1 relative h-full">
              {currentConversation ? (
                <ChatInterface
                  conversationId={currentConversation._id}
                  currentUserId={userId!}
                  currentUserType="store-owner"
                  otherUserName={rentalRequest.otherUserName || rentalRequest.brandName || t("common.brand_owner")}
                  shelfName={rentalRequest.shelfName || ""}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">
                      {t("orders.conversation_will_be_created")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}