"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/localization-context"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, Upload, FileText, CheckCircle2 } from "lucide-react"

interface PaymentReceiptUploadFormProps {
  paymentId: Id<"payments">
  existingReceiptId?: string
  onSuccess?: () => void
}

export function PaymentReceiptUploadForm({
  paymentId,
  existingReceiptId,
  onSuccess,
}: PaymentReceiptUploadFormProps) {
  const { t, direction } = useLanguage()
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  const uploadReceipt = useMutation(api.admin.clearances.uploadPaymentReceipt)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error(t("clearances.receiptUpload.invalidFileType"))
        return
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error(t("clearances.receiptUpload.fileTooLarge"))
        return
      }

      setFile(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast.error(t("clearances.receiptUpload.fileRequired"))
      return
    }

    setIsUploading(true)

    try {
      // 1. Generate upload URL
      const uploadUrl = await generateUploadUrl({
        fileType: file.type.startsWith("image/") ? "image" : "document",
        mimeType: file.type,
      })

      // 2. Upload file to Convex storage
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })

      if (!uploadResult.ok) {
        throw new Error("Failed to upload file")
      }

      const { storageId } = await uploadResult.json()

      // 3. Save receipt reference to payment
      await uploadReceipt({
        paymentId,
        receiptFileId: storageId,
        notes: notes || undefined,
      })

      toast.success(t("clearances.receiptUpload.success"))

      // Reset form
      setFile(null)
      setNotes("")

      onSuccess?.()
    } catch (error) {
      console.error("Error uploading receipt:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : t("clearances.receiptUpload.error")
      )
    } finally {
      setIsUploading(false)
    }
  }

  if (existingReceiptId) {
    return (
      <Card className="border-green-200 dark:border-green-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t("clearances.receiptUpload.title")}
            </CardTitle>
            <Badge variant="default" className="gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t("clearances.receiptUpload.uploaded")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" asChild>
            <a
              href={`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${existingReceiptId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileText className="h-4 w-4 me-2" />
              {t("clearances.receiptUpload.view")}
            </a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {t("clearances.receiptUpload.title")}
        </CardTitle>
        <CardDescription>
          {t("clearances.receiptUpload.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="receipt">
              {t("clearances.receiptUpload.file")}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="receipt"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              {t("clearances.receiptUpload.notes")}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("clearances.receiptUpload.notesPlaceholder")}
              rows={3}
              disabled={isUploading}
              className={direction === "rtl" ? "text-right" : ""}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 justify-end">
            <Button type="submit" disabled={isUploading || !file}>
              {isUploading && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              <Upload className="h-4 w-4 me-2" />
              {t("clearances.receiptUpload.upload")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
