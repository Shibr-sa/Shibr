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
    id: number
    storeName: string
    branch: string
    shelfName: string
    percentage: number
    addedDate: string
    status: string
  }
}

// Mock data for post details - same as what store owner posted
const getPostDetailsData = (language: string, post: any) => ({
  storeName: language === "ar" ? "متجر الأزياء" : "Fashion Store",
  storeOwnerName: language === "ar" ? "عناية بالبشرة" : "Skin Care",
  storeBranch: language === "ar" ? "الفرع" : "Branch",
  storeReview: language === "ar" ? "1 يونيو" : "June 1",
  storeType: language === "ar" ? "طريقة التأجير" : "Rental Method",
  rentalMethod: language === "ar" ? "إيجار شهري" : "Monthly Rental",
  contactMethod: language === "ar" ? "وسيلة التواصل" : "Contact Method",
  contactDetails: "glow@example.com — 05XXXXXXXX",
  commercialRegistry: language === "ar" ? "السجل التجاري" : "Commercial Registry",
  branch: language === "ar" ? "الرياض - حي النخيل" : "Riyadh - Al Nakheel",
  shelfName: language === "ar" ? "رف العرض الأمامي" : "Front Display Shelf",
  shelfSize: language === "ar" ? "كبير" : "Large",
  rentalPrice: 2500,
  percentage: post.percentage,
  rentalPeriod: language === "ar" ? "3 أشهر" : "3 months",
  address: language === "ar" ? "شارع الملك فهد، مبنى 23، الطابق الأرضي" : "King Fahd Street, Building 23, Ground Floor",
  addedDate: language === "ar" ? "15 ديسمبر 2024" : "December 15, 2024",
  shelfDimensions: language === "ar" ? "180سم × 90سم × 45سم" : "180cm × 90cm × 45cm",
  suitableProducts: language === "ar" ? "ملابس، إكسسوارات، أحذية، حقائب" : "Clothing, Accessories, Shoes, Bags",
  description: language === "ar" ? 
    "رف عرض أمامي في موقع استراتيجي عند مدخل المحل، مناسب لعرض المنتجات الترويجية والعروض الخاصة. يتمتع بإضاءة ممتازة ومساحة واسعة لعرض مجموعة متنوعة من المنتجات." :
    "Front display shelf in a strategic location at the store entrance, suitable for displaying promotional products and special offers. Features excellent lighting and ample space for displaying a variety of products.",
  images: [
    "/shelf-image-1.jpg",
    "/shelf-image-2.jpg",
    "/shelf-image-3.jpg",
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

          {/* Combined Shelf Information Card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {/* Shelf Name */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t("posts.shelf_name")}</span>
                  </div>
                  <p className="font-medium ps-6">{postDetails.shelfName}</p>
                </div>
                
                {/* Price with Percentage */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t("posts.price_with_percentage")}</span>
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
                    <span className="text-sm text-muted-foreground">{t("posts.address")}</span>
                  </div>
                  <p className="font-medium ps-6">{postDetails.address}</p>
                </div>
                
                {/* Added Date */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t("posts.added_date")}</span>
                  </div>
                  <p className="font-medium ps-6">{postDetails.addedDate}</p>
                </div>
                
                {/* Shelf Dimensions */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t("posts.shelf_dimensions")}</span>
                  </div>
                  <p className="font-medium ps-6">{postDetails.shelfDimensions}</p>
                </div>
                
                {/* Suitable Product Types */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t("posts.suitable_products")}</span>
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
                      <td className="px-4 py-3 text-sm">{postDetails.contactDetails}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                          <Download className="h-4 w-4 me-1" />
                          {t("posts.download_registry")}
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