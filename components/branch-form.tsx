"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Upload, MapPin, X, Loader2 } from "lucide-react"
import { MapPicker } from "@/components/ui/map-picker"
import { useLanguage } from "@/contexts/localization-context"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useToast } from "@/hooks/use-toast"
import { Id } from "@/convex/_generated/dataModel"
import Image from "next/image"

interface BranchFormProps {
  mode: "create" | "edit"
  branchId?: Id<"branches">
  initialData?: any
}

export function BranchForm({ mode, branchId, initialData }: BranchFormProps) {
  const { t, direction, language } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()

  // Convex mutations
  const createBranch = useMutation(api.branches.createBranch)
  const updateBranch = useMutation(api.branches.updateBranch)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const getFileUrl = useMutation(api.files.getFileUrl)

  // Form states
  const [branchName, setBranchName] = useState(mode === "edit" ? (initialData?.branchName || "") : "")
  const [city, setCity] = useState(mode === "edit" ? (initialData?.city || "") : "")

  // Location states
  const [selectedLocation, setSelectedLocation] = useState({
    address: mode === "edit" ? (initialData?.location?.address ?? "") : "",
    latitude: mode === "edit" ? (initialData?.location?.lat ?? 24.7136) : 24.7136,
    longitude: mode === "edit" ? (initialData?.location?.lng ?? 46.6753) : 46.6753
  })

  // City coordinates in Saudi Arabia
  const cityCoordinates: Record<string, { lat: number; lng: number }> = {
    "Riyadh": { lat: 24.7136, lng: 46.6753 },
    "Jeddah": { lat: 21.5433, lng: 39.1728 },
    "Mecca": { lat: 21.4225, lng: 39.8262 },
    "Medina": { lat: 24.5247, lng: 39.5692 },
    "Dammam": { lat: 26.3927, lng: 49.9777 },
    "Khobar": { lat: 26.2172, lng: 50.1971 },
    "Dhahran": { lat: 26.2361, lng: 50.0393 },
    "Taif": { lat: 21.4373, lng: 40.5128 },
    "Buraidah": { lat: 26.3266, lng: 43.9750 },
    "Tabuk": { lat: 28.3835, lng: 36.5662 },
    "Hail": { lat: 27.5219, lng: 41.6907 },
    "Hafar Al-Batin": { lat: 28.4337, lng: 45.9601 },
    "Jubail": { lat: 27.0046, lng: 49.6460 },
    "Najran": { lat: 17.5656, lng: 44.2289 },
    "Abha": { lat: 18.2164, lng: 42.5053 },
    "Khamis Mushait": { lat: 18.3060, lng: 42.7297 },
    "Jazan": { lat: 16.8892, lng: 42.5511 },
    "Yanbu": { lat: 24.0893, lng: 38.0618 },
    "Al-Qatif": { lat: 26.5195, lng: 50.0240 },
    "Unaizah": { lat: 26.0844, lng: 43.9935 },
    "Arar": { lat: 30.9753, lng: 41.0381 },
    "Sakaka": { lat: 29.9697, lng: 40.2064 },
    "Al-Kharj": { lat: 24.1556, lng: 47.3120 },
    "Al-Ahsa": { lat: 25.3487, lng: 49.5856 }
  }

  // Load existing images when in edit mode
  useEffect(() => {
    if (mode === "edit" && initialData) {
      const loadImages = () => {
        const previews: any = {}
        const existing: any = {}

        if (initialData.images && Array.isArray(initialData.images)) {
          for (const img of initialData.images) {
            if (img.url && img.type) {
              previews[img.type] = img.url
              // Store the existing image data (without the URL)
              existing[img.type] = {
                storageId: img.storageId,
                type: img.type,
                order: img.order
              }
            }
          }
        }

        setImagePreviews(previews)
        setExistingImages(existing)
      }
      loadImages()
    }
  }, [mode, initialData])

  // Update location when city changes (only in create mode)
  useEffect(() => {
    if (mode === "create" && city && cityCoordinates[city]) {
      setSelectedLocation(prev => ({
        ...prev,
        latitude: cityCoordinates[city].lat,
        longitude: cityCoordinates[city].lng
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, mode])

  // Image states - only exterior and interior for branches
  const [images, setImages] = useState<{
    exterior?: File | null,
    interior?: File | null
  }>({})
  const [imagePreviews, setImagePreviews] = useState<{
    exterior?: string | null,
    interior?: string | null
  }>({})
  // Track existing images from the database
  const [existingImages, setExistingImages] = useState<{
    exterior?: { storageId: Id<"_storage">, type: "exterior" | "interior", order: number } | null,
    interior?: { storageId: Id<"_storage">, type: "exterior" | "interior", order: number } | null
  }>({})
  const [uploadingImages, setUploadingImages] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Helper function to get city name in current language
  const getCityName = (cityKey: string) => {
    const normalizedKey = cityKey.toLowerCase().replace(/-/g, '_').replace(/ /g, '_')
    const translationKey = `cities.${normalizedKey}`
    return t(translationKey as any)
  }

  // Image upload handler
  const handleImageChange = (type: "exterior" | "interior", file: File | null) => {
    if (file) {
      setImages(prev => ({ ...prev, [type]: file }))
      setImagePreviews(prev => ({ ...prev, [type]: URL.createObjectURL(file) }))
      // Remove existing image reference when a new file is selected
      setExistingImages(prev => ({ ...prev, [type]: null }))
    } else {
      setImages(prev => ({ ...prev, [type]: null }))
      setImagePreviews(prev => ({ ...prev, [type]: null }))
      // Also remove existing image reference when clearing
      setExistingImages(prev => ({ ...prev, [type]: null }))
    }
  }

  // Upload images to Convex storage and combine with existing
  const uploadImages = async () => {
    const finalImages: Array<{
      storageId: Id<"_storage">
      type: "exterior" | "interior"
      order: number
    }> = []

    let order = 0

    // First, add any existing images that weren't replaced
    for (const [type, existingImage] of Object.entries(existingImages)) {
      if (existingImage && !images[type as "exterior" | "interior"]) {
        // Keep the existing image if no new file was uploaded for this type
        finalImages.push({
          storageId: existingImage.storageId,
          type: existingImage.type,
          order: order++
        })
      }
    }

    // Then, upload and add new images
    for (const [type, file] of Object.entries(images)) {
      if (file) {
        const uploadUrl = await generateUploadUrl({})
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file
        })

        const { storageId } = await result.json()

        finalImages.push({
          storageId,
          type: type as "exterior" | "interior",
          order: order++
        })
      }
    }

    return finalImages
  }

  // Form validation
  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!branchName.trim()) {
      newErrors.branchName = t("branches.branch_name_required")
    }

    if (!city) {
      newErrors.city = t("branches.city_required")
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      toast({
        title: t("common.error"),
        description: t("common.please_fix_errors"),
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)

    try {
      // Upload images
      setUploadingImages(true)
      const uploadedImages = await uploadImages()
      setUploadingImages(false)

      if (mode === "create") {
        await createBranch({
          branchName,
          city,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          address: selectedLocation.address,
          images: uploadedImages.length > 0 ? uploadedImages : undefined
        })

        toast({
          title: t("common.success"),
          description: t("branches.created_success")
        })
      } else {
        // In edit mode, always include the complete image list
        const updatedData: any = {
          branchId: branchId!,
          branchName,
          city,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          address: selectedLocation.address,
        }

        // Always send the complete image list when we have any images
        // This ensures we don't lose existing images when updating other fields
        if (uploadedImages.length > 0) {
          updatedData.images = uploadedImages
        }

        await updateBranch(updatedData)

        toast({
          title: t("common.success"),
          description: t("branches.updated_success")
        })
      }

      router.push("/store-dashboard/branches")
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || t("common.something_went_wrong"),
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
      setUploadingImages(false)
    }
  }

  const isSubmitDisabled = submitting || uploadingImages

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-8">
      {/* Branch Name */}
      <div className="space-y-2">
        <Label htmlFor="branchName">{t("branches.branch_name_label")}</Label>
        <Input
          id="branchName"
          value={branchName}
          onChange={(e) => setBranchName(e.target.value)}
          placeholder={t("branches.branch_name_placeholder")}
          className={errors.branchName ? "border-red-500" : ""}
        />
        {errors.branchName && (
          <p className="text-sm text-red-500">{errors.branchName}</p>
        )}
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label htmlFor="city">{t("branches.city_label")}</Label>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className={errors.city ? "border-red-500" : ""}>
            <SelectValue placeholder={t("shelves.select_city")} />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(cityCoordinates).map((cityKey) => (
              <SelectItem key={cityKey} value={cityKey}>
                {getCityName(cityKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.city && (
          <p className="text-sm text-red-500">{errors.city}</p>
        )}
      </div>

      {/* Location Picker */}
      <div className="space-y-4">
        <Label>{t("branches.location_label")}</Label>

        <MapPicker
          defaultLocation={{
            lat: selectedLocation.latitude,
            lng: selectedLocation.longitude
          }}
          height="600px"
          onLocationSelect={(location) => {
            setSelectedLocation(prev => ({
              ...prev,
              latitude: location.lat,
              longitude: location.lng,
              address: location.address
            }))
          }}
        />

        <div className="flex gap-4 text-sm text-muted-foreground">
          <div>
            <MapPin className="inline w-4 h-4 me-1" />
            {t("shelves.coordinates")}: {Number(selectedLocation.latitude).toFixed(6)}, {Number(selectedLocation.longitude).toFixed(6)}
          </div>
        </div>
      </div>

      {/* Store Exterior Image */}
      <div className="space-y-2">
        <Label>{t("branches.exterior_image_label")}</Label>
        <div className="border-2 border-dashed rounded-lg p-6">
          {imagePreviews.exterior ? (
            <div className="relative">
              <Image
                src={imagePreviews.exterior}
                alt="Exterior"
                width={500}
                height={192}
                unoptimized
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 end-2"
                onClick={() => handleImageChange("exterior", null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center cursor-pointer">
              <Upload className="w-12 h-12 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">
                {t("branches.upload_exterior_image")}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageChange("exterior", file)
                }}
              />
            </label>
          )}
        </div>
      </div>

      {/* Store Interior Image */}
      <div className="space-y-2">
        <Label>{t("branches.interior_image_label")}</Label>
        <div className="border-2 border-dashed rounded-lg p-6">
          {imagePreviews.interior ? (
            <div className="relative">
              <Image
                src={imagePreviews.interior}
                alt="Interior"
                width={500}
                height={192}
                unoptimized
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 end-2"
                onClick={() => handleImageChange("interior", null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center cursor-pointer">
              <Upload className="w-12 h-12 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">
                {t("branches.upload_interior_image")}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageChange("interior", file)
                }}
              />
            </label>
          )}
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/store-dashboard/branches")}
          disabled={isSubmitDisabled}
        >
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitDisabled}>
          {uploadingImages && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
          {submitting && !uploadingImages && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
          {mode === "create" ? t("common.create") : t("common.save")}
        </Button>
      </div>
    </form>
    </div>
  )
}
