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
  Phone,
  Mail,
  Star,
  Package
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
  const seedProducts = useMutation(api.products.seedSampleProducts)
  const allProducts = useQuery(api.products.getAllProducts)

  // Request mutations
  const acceptRequest = useMutation(api.rentalRequests.acceptRentalRequest)
  const rejectRequest = useMutation(api.rentalRequests.rejectRentalRequest)

  // Debug: Log the rental request data
  useEffect(() => {
    if (rentalRequest) {
      console.log("Rental request data:", rentalRequest)
      console.log("Products in request:", rentalRequest.products)
      console.log("Selected product IDs:", rentalRequest.selectedProductIds)
    }
    if (allProducts) {
      console.log("All products in database:", allProducts)
    }
  }, [rentalRequest, allProducts])
  
  // Debug: Seed products for testing
  const handleSeedProducts = async () => {
    if (rentalRequest?.brandOwnerId) {
      try {
        const result = await seedProducts({ ownerId: rentalRequest.brandOwnerId })
        console.log("Seeded products:", result)
        alert(`Created ${result.count} sample products`)
      } catch (error) {
        console.error("Failed to seed products:", error)
      }
    }
  }

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
       c.otherUserId === rentalRequest.brandOwnerId)
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
      console.error("Failed to accept request:", error)
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
      console.error("Failed to reject request:", error)
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
          {/* Brand Information Card */}
          <Card>
            <CardContent className="space-y-6 pt-6">
              {/* Brand Details Header with Rating */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{t("orders.brand_details")}</h3>
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
              
              {/* Brand Info Grid - First Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="border rounded-lg p-4 bg-background">
                  <p className="text-xs text-muted-foreground mb-1">{t("orders.owner_name")}</p>
                  <p className="font-medium text-sm">{rentalRequest.ownerName || "-"}</p>
                </div>
                <div className="border rounded-lg p-4 bg-background">
                  <p className="text-xs text-muted-foreground mb-1">{t("orders.city")}</p>
                  <p className="font-medium text-sm">{rentalRequest.city || rentalRequest.shelfCity || "-"}</p>
                </div>
                <div className="border rounded-lg p-4 bg-background">
                  <p className="text-xs text-muted-foreground mb-1">{t("orders.activity_type")}</p>
                  <p className="font-medium text-sm">{rentalRequest.activityType || "-"}</p>
                </div>
                <div className="border rounded-lg p-4 bg-background">
                  <p className="text-xs text-muted-foreground mb-1">{t("orders.mobile_number")}</p>
                  <p className="font-medium text-sm dir-ltr text-start">{rentalRequest.phoneNumber || "-"}</p>
                </div>
              </div>

              {/* Brand Info Grid - Second Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="border rounded-lg p-4 bg-background">
                  <p className="text-xs text-muted-foreground mb-1">{t("orders.commercial_register")}</p>
                  {rentalRequest.commercialRegisterFile ? (
                    <button
                      className="font-medium text-sm text-primary hover:underline flex items-center gap-1"
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
                    <p className="font-medium text-sm">-</p>
                  )}
                </div>
                <div className="border rounded-lg p-4 bg-background">
                  <p className="text-xs text-muted-foreground mb-1">{t("orders.commercial_register_number")}</p>
                  <p className="font-medium text-sm">{rentalRequest.commercialRegisterNumber || "-"}</p>
                </div>
                <div className="border rounded-lg p-4 bg-background">
                  <p className="text-xs text-muted-foreground mb-1">{t("orders.website")}</p>
                  {rentalRequest.website ? (
                    <a 
                      href={rentalRequest.website.startsWith('http') ? rentalRequest.website : `https://${rentalRequest.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sm text-primary hover:underline"
                    >
                      {rentalRequest.website}
                    </a>
                  ) : (
                    <p className="font-medium text-sm">-</p>
                  )}
                </div>
                <div className="border rounded-lg p-4 bg-background">
                  <p className="text-xs text-muted-foreground mb-1">{t("orders.email")}</p>
                  <p className="font-medium text-sm break-all">{rentalRequest.otherUserEmail || "-"}</p>
                </div>
              </div>

              {/* Alert Row */}
              {rentalRequest.status === "pending" && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="font-medium">
                    {t("orders.cancel_warning")}
                  </AlertDescription>
                </Alert>
              )}

              {/* Request Details Section */}
              <div className="pt-6 border-t">
                <h3 className="font-semibold text-sm mb-4">{t("orders.request_details_title")}</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-start">{t("orders.branch")}</TableHead>
                        <TableHead className="text-start">{t("orders.activity")}</TableHead>
                        <TableHead className="text-start">{t("orders.rental_duration")}</TableHead>
                        <TableHead className="text-start">{t("orders.rental_date")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {rentalRequest.shelfBranch || "-"}
                          </div>
                        </TableCell>
                        <TableCell>{rentalRequest.shelfName || "-"}</TableCell>
                        <TableCell>
                          {rentalRequest.startDate && rentalRequest.endDate 
                            ? formatDuration(rentalRequest.startDate, rentalRequest.endDate, language)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {rentalRequest.createdAt 
                            ? formatDate(rentalRequest.createdAt, language, 'long')
                            : "-"}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                
                {rentalRequest.additionalNotes && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-1">{t("orders.notes")}</p>
                    <p className="text-sm text-muted-foreground">{rentalRequest.additionalNotes}</p>
                  </div>
                )}
              </div>

              {/* Products Section */}
              {rentalRequest.products && rentalRequest.products.length > 0 && (
                <div className="pt-6 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm">{t("orders.selected_products")}</h3>
                    {/* Temporary debug button */}
                    {process.env.NODE_ENV === 'development' && (!allProducts || allProducts.length === 0) && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleSeedProducts}
                      >
                        Create Sample Products (Debug)
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {rentalRequest.products.map((product: any, index: number) => (
                      <div key={product._id || index} className="border rounded-lg p-3 bg-background">
                        <div className="flex items-start gap-3">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name}
                              className="h-16 w-16 rounded object-cover border"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded bg-muted flex items-center justify-center border">
                              <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{product.name}</p>
                            {product.sku && (
                              <p className="text-xs text-muted-foreground mt-1">SKU: {product.sku}</p>
                            )}
                            {product.requestedQuantity && (
                              <p className="text-xs text-muted-foreground">
                                {t("brand.products.quantity")}: {product.requestedQuantity}
                              </p>
                            )}
                            {product.price && (
                              <p className="text-sm font-medium mt-2">
                                {language === "ar" ? `${t("common.currency")} ${product.price}` : `${t("common.currency")} ${product.price}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Show product info from description if no individual products */}
              {(!rentalRequest.products || rentalRequest.products.length === 0) && rentalRequest.productDescription && (
                <div className="pt-6 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm">{t("orders.selected_products")}</h3>
                    {/* Temporary debug button */}
                    {process.env.NODE_ENV === 'development' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleSeedProducts}
                      >
                        Create Sample Products (Debug)
                      </Button>
                    )}
                  </div>
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
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Right Side */}
        <div className="flex flex-col gap-6 h-full overflow-hidden">
          {/* Communication Card */}
          {currentConversation ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <ChatInterface
                conversationId={currentConversation._id}
                currentUserId={userId}
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

          {/* Action Buttons */}
          {rentalRequest.status === "pending" && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Button
                    className="w-full"
                    onClick={handleAccept}
                    disabled={isProcessing}
                  >
                    <Check className="h-4 w-4 me-2" />
                    {t("orders.accept_request")}
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleReject}
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4 me-2" />
                    {t("orders.reject_request")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}