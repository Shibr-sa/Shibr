"use client"

import { useLanguage } from "@/contexts/localization-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { 
  Store,
  MapPin,
  Package,
  Ruler,
  DollarSign,
  Calendar,
  FileText,
  Image as ImageIcon,
  Check,
  X,
  Trash2,
  Download
} from "lucide-react"

interface PostDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  post: {
    id: string
    storeName: string
    storeOwnerName?: string
    storeOwnerEmail?: string
    storeOwnerPhone?: string
    businessRegistration?: string
    branch: string
    shelfName: string
    percentage: number
    price: number
    addedDate: string
    status: string
    city?: string
    address?: string
    dimensions?: string
    productType?: string
    description?: string
    availableFrom?: string
    images?: string[]
  }
}

// Transform post data for display
const getPostDetailsData = (language: string, post: any) => ({
  storeName: post.storeName,
  storeOwnerName: post.storeOwnerName || post.storeName,
  storeBranch: post.branch,
  storeReview: new Date(post.addedDate).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US"),
  storeType: language === "ar" ? "طريقة التأجير" : "Rental Method",
  rentalMethod: language === "ar" ? "إيجار شهري" : "Monthly Rental",
  contactMethod: language === "ar" ? "وسيلة التواصل" : "Contact Method",
  contactDetails: `${post.storeOwnerPhone || "05XXXXXXXX"}\n${post.storeOwnerEmail || "email@store.com"}`,
  commercialRegistry: post.businessRegistration || "1234567890",
  branch: post.branch || post.city,
  shelfName: post.shelfName,
  shelfSize: language === "ar" ? "كبير" : "Large",
  rentalPrice: post.price || 0,
  percentage: post.percentage || 0,
  rentalPeriod: language === "ar" ? "3 أشهر" : "3 months",
  address: post.address || (language === "ar" ? "العنوان غير متوفر" : "Address not available"),
  addedDate: new Date(post.addedDate).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US"),
  shelfDimensions: post.dimensions || (language === "ar" ? "الأبعاد غير متوفرة" : "Dimensions not available"),
  suitableProducts: post.productType || (language === "ar" ? "غير محدد" : "Not specified"),
  description: post.description || (language === "ar" ? 
    "لا يوجد وصف متاح" :
    "No description available"),
  images: post.images || [
  ]
})

export function PostDetailsDialog({ open, onOpenChange, post }: PostDetailsDialogProps) {
  const { t, language } = useLanguage()
  const postDetails = getPostDetailsData(language, post)

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "published":
        return "default"
      case "under_review":
        return "secondary"
      case "rented":
        return "success"
      case "rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ${t("common.currency")}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {t("posts.post_details")}
            </DialogTitle>
            <Badge variant={getStatusVariant(post.status)} className="text-xs">
              {t(`posts.status.${post.status}`)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Shelf Images - moved to top */}
          <div className="grid grid-cols-3 gap-4">
            {postDetails.images.map((image, index) => (
              <div key={index} className="aspect-square bg-muted rounded-lg border border-border/50 flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Combined Shelf Information Card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {/* Shelf Name */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm text-muted-foreground">{t("posts.shelf_name")}</Label>
                  </div>
                  <p className="font-medium ps-6">{postDetails.shelfName}</p>
                </div>
                
                {/* Price with Percentage */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm text-muted-foreground">{t("posts.price_with_percentage")}</Label>
                  </div>
                  <p className="font-medium ps-6">
                    {formatCurrency(postDetails.rentalPrice)}
                    <span className="text-sm text-muted-foreground ms-1">
                      ({postDetails.percentage}%)
                    </span>
                  </p>
                </div>
                
                {/* Address */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm text-muted-foreground">{t("posts.address")}</Label>
                  </div>
                  <p className="font-medium ps-6">{postDetails.address}</p>
                </div>
                
                {/* Added Date */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm text-muted-foreground">{t("posts.added_date")}</Label>
                  </div>
                  <p className="font-medium ps-6">{postDetails.addedDate}</p>
                </div>
                
                {/* Shelf Dimensions */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm text-muted-foreground">{t("posts.shelf_dimensions")}</Label>
                  </div>
                  <p className="font-medium ps-6">{postDetails.shelfDimensions}</p>
                </div>
                
                {/* Suitable Product Types */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm text-muted-foreground">{t("posts.suitable_products")}</Label>
                  </div>
                  <p className="font-medium ps-6">{postDetails.suitableProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Store Information Table */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-base mb-4">{t("posts.store_info")}</h3>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-start px-4 py-3 font-medium text-sm">{t("posts.store_field")}</th>
                      <th className="text-start px-4 py-3 font-medium text-sm">{t("posts.store_branch")}</th>
                      <th className="text-start px-4 py-3 font-medium text-sm">{t("posts.rental_method")}</th>
                      <th className="text-start px-4 py-3 font-medium text-sm">{t("posts.contact_method")}</th>
                      <th className="text-start px-4 py-3 font-medium text-sm">{t("posts.commercial_registry")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-4 py-3">
                        <div className="font-medium">{post.storeName}</div>
                        <div className="text-sm text-muted-foreground">{postDetails.storeOwnerName}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{postDetails.storeBranch}</td>
                      <td className="px-4 py-3 text-sm">{postDetails.rentalMethod}</td>
                      <td className="px-4 py-3 text-sm whitespace-pre-line">{postDetails.contactDetails}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 hover:text-primary">
                          <Download className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {post.status === "under_review" && (
            <div className="flex gap-3 pt-2">
              <Button className="flex-1" size="lg">
                <Check className="h-4 w-4 me-2" />
                {t("posts.approve_post")}
              </Button>
              <Button variant="destructive" className="flex-1" size="lg">
                <X className="h-4 w-4 me-2" />
                {t("posts.reject_post")}
              </Button>
            </div>
          )}

          {(post.status === "published" || post.status === "rejected") && (
            <div className="flex justify-center pt-2">
              <Button variant="destructive" size="lg" className="min-w-[200px]">
                <Trash2 className="h-4 w-4 me-2" />
                {t("posts.delete_post")}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}