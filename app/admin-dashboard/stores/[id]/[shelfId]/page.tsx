"use client"

import { useParams, useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useLanguage } from "@/contexts/localization-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Store,
  MapPin,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
} from "lucide-react"

export default function ShelfDetailsPage() {
  const { t, language, direction } = useLanguage()
  const router = useRouter()
  const params = useParams()
  const storeId = params.id as string  // This matches [id] folder
  const shelfId = params.shelfId as string
  
  // The storeId from the URL is actually the profileId
  // Fetch store shelves using the profileId directly
  const shelvesResult = useQuery(api.admin.getStoreShelves, 
    storeId ? { 
      profileId: storeId as Id<"userProfiles">,
      searchQuery: "",
      status: "all",
      page: 1,
      limit: 100,
    } : "skip"
  )
  
  // Find the specific shelf by its ID
  const shelf = shelvesResult?.items?.find((s: any) => s._id === shelfId)
  
  // Get the store info from the stores list
  const storesResult = useQuery(api.admin.getStores, {
    searchQuery: "",
    page: 1,
    limit: 100,
  })
  
  const store = storesResult?.items?.find((s: any) => s.id === storeId)
  
  if (!shelf) {
    return null
  }
  
  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ${t("common.currency")}`
  }
  
  const formatDate = (date: string) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="default">{t("posts.status.published")}</Badge>
      case "rented":
        return <Badge variant="secondary">{t("posts.status.rented")}</Badge>
      default:
        return <Badge variant="outline">{t("posts.status.draft")}</Badge>
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9"
          >
            <ArrowLeft className={`h-4 w-4 ${direction === "rtl" ? "rotate-180" : ""}`} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{shelf.shelfName || t("posts.shelf")}</h1>
            <p className="text-sm text-muted-foreground">{store?.name || "-"}</p>
          </div>
        </div>
        <Badge variant={shelf.isAvailable ? "default" : "secondary"}>
          {shelf.isAvailable ? t("posts.status.published") : t("posts.status.rented")}
        </Badge>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Shelf Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t("posts.shelf_information")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t("posts.shelf_name")}</Label>
                  <p className="font-medium">{shelf.shelfName}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t("posts.branch")}</Label>
                  <p className="font-medium">{shelf.branch}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t("posts.monthly_price")}</Label>
                  <p className="font-medium">{formatCurrency(shelf.monthlyPrice || 0)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t("posts.commission_percentage")}</Label>
                  <p className="font-medium">{shelf.percentage}%</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t("posts.date_added")}</Label>
                  <p className="font-medium">{formatDate(shelf.addedDate)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t("posts.availability")}</Label>
                  <div className="flex items-center gap-2">
                    {shelf.isAvailable ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">{t("posts.available")}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-red-600">{t("posts.rented")}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Dimensions Section */}
              <Separator />
              <div>
                <h3 className="font-medium mb-4">{t("posts.dimensions")}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">{t("posts.width")}</Label>
                    <p className="font-medium">{shelf.width || 100} {t("common.cm")}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">{t("posts.height")}</Label>
                    <p className="font-medium">{shelf.height || 200} {t("common.cm")}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">{t("posts.depth")}</Label>
                    <p className="font-medium">{shelf.depth || 50} {t("common.cm")}</p>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              {shelf.description && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2">{t("posts.description")}</h3>
                    <p className="text-muted-foreground">{shelf.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Shelf Images */}
          <Card>
            <CardHeader>
              <CardTitle>{t("posts.shelf_images")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {shelf.images && shelf.images.length > 0 ? (
                  shelf.images.map((image: string, index: number) => (
                    <div key={index} className="aspect-video bg-muted rounded-lg overflow-hidden">
                      <img 
                        src={image} 
                        alt={`${shelf.shelfName} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{t("posts.no_images")}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Store Information */}
        <div className="space-y-6">
          {/* Store Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t("posts.store_details")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={shelf.storeImage} alt={shelf.storeName} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {shelf.storeName?.charAt(0)?.toUpperCase() || "S"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{shelf.storeName}</p>
                  <p className="text-sm text-muted-foreground">{shelf.branch}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{t("posts.store_type")}</p>
                    <p className="text-sm font-medium">{shelf.storeType || t("posts.retail_store")}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{t("posts.location")}</p>
                    <p className="text-sm font-medium">{shelf.location || shelf.branch}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{t("posts.store_owner")}</p>
                    <p className="text-sm font-medium">{shelf.ownerName || "-"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{t("posts.member_since")}</p>
                    <p className="text-sm font-medium">{formatDate(shelf.storeJoinDate)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Rental Information (if rented) */}
          {shelf.status === "rented" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("posts.rental_information")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t("posts.renter_name")}</Label>
                  <p className="font-medium">{shelf.renterName || "-"}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t("posts.rental_start_date")}</Label>
                  <p className="font-medium">{formatDate(shelf.rentalStartDate)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t("posts.rental_end_date")}</Label>
                  <p className="font-medium">{formatDate(shelf.rentalEndDate)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t("posts.rental_duration")}</Label>
                  <p className="font-medium">{shelf.rentalDuration || "-"} {t("common.months")}</p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Button 
                  className="w-full"
                  onClick={() => router.push(`/admin-dashboard/stores/${storeId}`)}
                >
                  <Store className="h-4 w-4 me-2" />
                  {t("posts.view_store")}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push(`/admin-dashboard/stores/${storeId}`)}
                >
                  {t("posts.back_to_store_details")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}