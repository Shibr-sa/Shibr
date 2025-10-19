"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, Edit, Trash2, Package, Building2, Image as ImageIcon } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useLanguage } from "@/contexts/localization-context"
import { useRouter, useParams } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useToast } from "@/hooks/use-toast"

export default function BranchDetailsPage() {
  const { t, direction } = useLanguage()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  const branchId = params.id as Id<"branches">

  const branch = useQuery(api.branches.getBranchById, { branchId })
  const deleteBranch = useMutation(api.branches.deleteBranch)

  // Helper function to get city name in current language
  const getCityName = (cityKey: string) => {
    const normalizedKey = cityKey.toLowerCase().replace(/-/g, '_').replace(/ /g, '_')
    const translationKey = `cities.${normalizedKey}`
    return t(translationKey as any)
  }

  const handleDelete = async () => {
    try {
      await deleteBranch({ branchId })
      toast({
        title: t("common.success"),
        description: t("branches.deleted_success")
      })
      router.push("/store-dashboard/branches")
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || t("common.something_went_wrong"),
        variant: "destructive"
      })
    }
  }

  if (!branch) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  const exteriorImage = branch.images?.find(img => img.type === "exterior")
  const interiorImage = branch.images?.find(img => img.type === "interior")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{branch.branchName}</h1>
            <Badge variant={branch.status === "active" ? "default" : "secondary"}>
              {branch.status === "active" ? t("common.active") : t("common.inactive")}
            </Badge>
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {getCityName(branch.city)}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/store-dashboard/branches/${branch._id}/edit`)}
          >
            <Edit className="w-4 h-4 me-2" />
            {t("common.edit")}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 me-2" />
                {t("common.delete")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("branches.delete_confirm_title")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("branches.delete_confirm_description", { name: branch.branchName })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t("common.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Branch Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {t("branches.details")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("branches.branch_name")}</p>
              <p className="text-lg">{branch.branchName}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("shelves.city")}</p>
              <p className="text-lg">{getCityName(branch.city)}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("shelves.address")}</p>
              <p className="text-lg">{branch.location.address}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("shelves.coordinates")}</p>
              <p className="text-lg">
                {branch.location.lat.toFixed(6)}, {branch.location.lng.toFixed(6)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("branches.shelves_count")}</p>
              <p className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5" />
                {branch.shelfCount}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Branch Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              {t("branches.images")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {exteriorImage && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {t("branches.exterior_image_label")}
                </p>
                <img
                  src={exteriorImage.url || ""}
                  alt="Store Exterior"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}

            {interiorImage && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {t("branches.interior_image_label")}
                </p>
                <img
                  src={interiorImage.url || ""}
                  alt="Store Interior"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}

            {!exteriorImage && !interiorImage && (
              <p className="text-muted-foreground text-center py-8">
                {t("branches.no_images")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shelves using this branch */}
      {branch.shelves && branch.shelves.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {t("branches.shelves_in_branch")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {branch.shelves.map(shelf => (
                <div
                  key={shelf._id}
                  className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => router.push(`/store-dashboard/shelves/${shelf._id}`)}
                >
                  <div>
                    <p className="font-medium">{shelf.shelfName}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("shelves.monthly_price")}: {shelf.monthlyPrice} {t("common.sar")}
                    </p>
                  </div>
                  <Badge variant={shelf.status === "active" ? "default" : "secondary"}>
                    {shelf.status === "active" ? t("common.active") : t("common.suspended")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
