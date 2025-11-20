"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useLanguage } from "@/contexts/localization-context"
import { formatDate } from "@/lib/formatters"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, Loader2, Package } from "lucide-react"
import Image from "next/image"

interface StoreReceiptConfirmationProps {
  requestId: Id<"rentalRequests">
  shipmentDetails: {
    carrier: string
    trackingNumber: string
    shippedAt: number
    expectedDeliveryDate?: string
    notes?: string
  }
  onSuccess?: () => void
}

type ConditionType = "good" | "damaged" | "missing"

export function StoreReceiptConfirmation({
  requestId,
  shipmentDetails,
  onSuccess
}: StoreReceiptConfirmationProps) {
  const { t, language, direction } = useLanguage()
  const { toast } = useToast()

  // Convex mutations
  const confirmReceipt = useMutation(api.rentalRequests.confirmInitialShipmentReceipt)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)

  // Form states
  const [condition, setCondition] = useState<ConditionType>("good")
  const [notes, setNotes] = useState("")
  const [receiptPhotos, setReceiptPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)

  // Handle photo upload
  const handlePhotoChange = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const newFiles = Array.from(files)
    const newPreviews = newFiles.map(file => URL.createObjectURL(file))

    setReceiptPhotos(prev => [...prev, ...newFiles])
    setPhotoPreviews(prev => [...prev, ...newPreviews])
  }

  // Remove photo
  const removePhoto = (index: number) => {
    setReceiptPhotos(prev => prev.filter((_, i) => i !== index))
    setPhotoPreviews(prev => {
      // Revoke object URL to prevent memory leak
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  // Upload photos to Convex storage
  const uploadPhotos = async (): Promise<Id<"_storage">[]> => {
    if (receiptPhotos.length === 0) return []

    const uploadedIds: Id<"_storage">[] = []

    for (const photo of receiptPhotos) {
      const uploadUrl = await generateUploadUrl({})
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": photo.type },
        body: photo
      })

      const { storageId } = await result.json()
      uploadedIds.push(storageId)
    }

    return uploadedIds
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setSubmitting(true)

    try {
      // Upload photos
      let photoStorageIds: Id<"_storage">[] = []
      if (receiptPhotos.length > 0) {
        setUploadingPhotos(true)
        photoStorageIds = await uploadPhotos()
        setUploadingPhotos(false)
      }

      // Confirm receipt
      await confirmReceipt({
        requestId,
        condition,
        receiptPhotos: photoStorageIds.length > 0 ? photoStorageIds : undefined,
        notes: notes.trim() || undefined
      })

      toast({
        title: t("common.success"),
        description: t("shipping.confirmed_success")
      })

      // Call success callback
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || t("shipping.confirmation_error"),
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
      setUploadingPhotos(false)
    }
  }

  const isSubmitDisabled = submitting || uploadingPhotos

  return (
    <div className="w-full space-y-6">
      {/* Shipment Details Section */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">{t("shipping.shipment_details")}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">{t("shipping.shipped_by")}</p>
            <p className="font-medium">{shipmentDetails.carrier}</p>
          </div>

          <div>
            <p className="text-muted-foreground">{t("shipping.tracking_number")}</p>
            <p className="font-medium font-mono">{shipmentDetails.trackingNumber}</p>
          </div>

          <div>
            <p className="text-muted-foreground">{t("shipping.shipped_on")}</p>
            <p className="font-medium">{formatDate(shipmentDetails.shippedAt, language, "long")}</p>
          </div>

          {shipmentDetails.expectedDeliveryDate && (
            <div>
              <p className="text-muted-foreground">{t("shipping.expected_delivery")}</p>
              <p className="font-medium">{shipmentDetails.expectedDeliveryDate}</p>
            </div>
          )}
        </div>

        {shipmentDetails.notes && (
          <div className="pt-2 border-t border-border">
            <p className="text-muted-foreground text-sm">{t("shipping.shipping_notes")}</p>
            <p className="text-sm mt-1">{shipmentDetails.notes}</p>
          </div>
        )}
      </div>

      {/* Confirmation Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Condition */}
        <div className="space-y-2">
          <Label htmlFor="condition">
            {t("shipping.condition")} <span className="text-red-500">*</span>
          </Label>
          <Select value={condition} onValueChange={(value) => setCondition(value as ConditionType)}>
            <SelectTrigger dir={direction} id="condition">
              <SelectValue placeholder={t("shipping.select_condition")} />
            </SelectTrigger>
            <SelectContent dir={direction}>
              <SelectItem value="good">{t("shipping.condition_good")}</SelectItem>
              <SelectItem value="damaged">{t("shipping.condition_damaged")}</SelectItem>
              <SelectItem value="missing">{t("shipping.condition_missing")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Receipt Photos */}
        <div className="space-y-2">
          <Label>{t("shipping.upload_photos")}</Label>
          <div className="space-y-3">
            {/* Photo Previews */}
            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {photoPreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={preview}
                      alt={`Receipt photo ${index + 1}`}
                      width={200}
                      height={200}
                      unoptimized
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 end-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <div className="border-2 border-dashed rounded-lg p-6">
              <label className="flex flex-col items-center justify-center cursor-pointer">
                <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground text-center">
                  {t("shipping.upload_photos")}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handlePhotoChange(e.target.files)}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Confirmation Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">
            {t("shipping.confirmation_notes")} <span className="text-muted-foreground">({t("common.optional")})</span>
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("shipping.confirmation_notes")}
            rows={4}
            dir={direction}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitDisabled}
            onClick={() => {
              if (onSuccess) {
                onSuccess()
              }
            }}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitDisabled}>
            {uploadingPhotos && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
            {submitting && !uploadingPhotos && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
            {t("shipping.confirm_receipt")}
          </Button>
        </div>
      </form>
    </div>
  )
}
