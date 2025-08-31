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
  const markNotificationsAsRead = useMutation(api.notifications.markRentalRequestNotificationsAsRead)

  // Mark notifications as read when viewing the rental request
  useEffect(() => {
    if (requestId && rentalRequest) {
      markNotificationsAsRead({ rentalRequestId: requestId })
        .catch(() => {
          // Silently handle error - notification marking is not critical
        })
    }
  }, [requestId, rentalRequest])

  // Data is ready for rendering

  // Fetch conversations for the selected request
  const conversations = useQuery(
    api.chats.getUserConversations,
    userId ? { userId } : "skip"
  )

  // Find conversation for this specific shelf and rental request
  const currentConversation = conversations?.find(
    c => rentalRequest && (
      c.shelfId === rentalRequest.shelfId &&
      (c.otherUserId === rentalRequest.otherUserId || 
       c.otherUserId === rentalRequest.requesterId)
    )
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
      case "accepted":
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
    <div className="h-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6 overflow-y-auto">
          {/* Brand Information Card - Enhanced Design */}
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
                {rentalRequest.status === "pending" && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleReject}
                      disabled={isProcessing}
                    >
                      {t("orders.reject")}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleAccept}
                      disabled={isProcessing}
                    >
                      {t("orders.accept")}
                    </Button>
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
                        {t("orders.activity_type")}
                      </Label>
                      <p className="text-sm font-medium truncate" title={rentalRequest.activityType || "-"}>
                        {rentalRequest.activityType || "-"}
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
                      <p className="text-sm font-medium truncate" title={rentalRequest.createdAt ? formatDate(rentalRequest.createdAt, language, 'long') : "-"}>
                        {rentalRequest.createdAt 
                          ? formatDate(rentalRequest.createdAt, language, 'long')
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
                        {t("orders.price")}
                      </Label>
                      <p className="text-sm font-medium truncate" title={rentalRequest.monthlyPrice ? `${t("common.currency")} ${rentalRequest.monthlyPrice}` : "-"}>
                        {rentalRequest.monthlyPrice 
                          ? `${t("common.currency")} ${rentalRequest.monthlyPrice}`
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Store Notes - Full width single row */}
                <div className="mt-4">
                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground font-normal">
                        {t("orders.store_notes")}
                      </Label>
                      <p className="text-sm font-medium">
                        {rentalRequest.additionalNotes || t("common.no_notes")}
                      </p>
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
          
          {/* Products Section */}
          {rentalRequest.products && rentalRequest.products.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{t("orders.selected_products")}</h3>
                    {/* Temporary debug button */}
                    {process.env.NODE_ENV === 'development' && (!allProducts || allProducts.length === 0) && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          // Debug: Sample products needed
                        }}
                      >
                        Create Sample Products (Debug)
                      </Button>
                    )}
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-start">{t("table.image")}</TableHead>
                      <TableHead className="text-start">{t("table.product_name")}</TableHead>
                      <TableHead className="text-start">{t("table.sku")}</TableHead>
                      <TableHead className="text-start">{t("table.quantity")}</TableHead>
                      <TableHead className="text-start">{t("table.price")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rentalRequest.products.map((product: any, index: number) => (
                      <TableRow key={product._id || index}>
                        <TableCell>
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name}
                              className="h-10 w-10 rounded object-cover border"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center border">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{product.name || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{product.sku || "-"}</TableCell>
                        <TableCell>{product.requestedQuantity || "-"}</TableCell>
                        <TableCell className="font-medium">
                          {product.price ? `${t("common.currency")} ${product.price}` : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          
          {/* Show product info from description if no individual products */}
          {(!rentalRequest.products || rentalRequest.products.length === 0) && rentalRequest.productDescription && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">{t("orders.selected_products")}</h3>
              <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm">
                      <span className="font-medium">{t("common.product_type")}:</span> {rentalRequest.productType || "-"}
                    </p>
                    <p className="text-sm mt-2">
                      <span className="font-medium">{t("common.description")}:</span> {rentalRequest.productDescription}
                    </p>
                    {rentalRequest.productCount && (
                      <p className="text-sm mt-2">
                        <span className="font-medium">{t("common.total_quantity")}:</span> {rentalRequest.productCount}
                      </p>
                    )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Right Side */}
        <div className="flex flex-col gap-6 h-full overflow-hidden">
          {/* Communication Card */}
          {currentConversation ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <ChatInterface
                conversationId={currentConversation._id}
                currentUserId={userId!}
                currentUserType="store-owner"
                otherUserName={rentalRequest.otherUserName || rentalRequest.brandName || t("common.brand_owner")}
                shelfName={rentalRequest.shelfName || ""}
              />
            </div>
          ) : (
            <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm text-muted-foreground">{t("orders.conversation_will_be_created")}</p>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}