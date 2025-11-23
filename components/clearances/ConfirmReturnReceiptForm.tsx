"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/localization-context"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Package } from "lucide-react"

interface ConfirmReturnReceiptFormProps {
  clearanceId: Id<"rentalClearances">
  rentalId: Id<"rentalRequests">
  onSuccess?: () => void
}

export function ConfirmReturnReceiptForm({
  clearanceId,
  rentalId,
  onSuccess,
}: ConfirmReturnReceiptFormProps) {
  const { t, direction } = useLanguage()
  const [condition, setCondition] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const confirmReceipt = useMutation(api.rentalClearance.confirmReturnReceipt)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!condition) {
      toast.error(t("clearances.returnReceipt.conditionRequired"))
      return
    }

    setIsSubmitting(true)

    try {
      await confirmReceipt({
        clearanceId,
        rentalRequestId: rentalId,
        condition,
        notes: notes || undefined,
        receiptPhotos: [], // TODO: Add photo upload functionality
      })

      toast.success(t("clearances.returnReceipt.success"))

      // Reset form
      setCondition("")
      setNotes("")

      onSuccess?.()
    } catch (error) {
      console.error("Error confirming return receipt:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : t("clearances.returnReceipt.error")
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {t("clearances.returnReceipt.title")}
        </CardTitle>
        <CardDescription>
          {t("clearances.returnReceipt.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Condition Select */}
          <div className="space-y-2">
            <Label htmlFor="condition">
              {t("clearances.returnReceipt.condition")}
              <span className="text-red-500">*</span>
            </Label>
            <Select
              dir={direction}
              value={condition}
              onValueChange={setCondition}
              disabled={isSubmitting}
            >
              <SelectTrigger id="condition">
                <SelectValue placeholder={t("clearances.returnReceipt.selectCondition")} />
              </SelectTrigger>
              <SelectContent dir={direction}>
                <SelectItem value="good">
                  {t("clearances.returnReceipt.conditionGood")}
                </SelectItem>
                <SelectItem value="damaged">
                  {t("clearances.returnReceipt.conditionDamaged")}
                </SelectItem>
                <SelectItem value="partial">
                  {t("clearances.returnReceipt.conditionPartial")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes Textarea */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              {t("clearances.returnReceipt.notes")}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("clearances.returnReceipt.notesPlaceholder")}
              rows={4}
              disabled={isSubmitting}
              className={direction === "rtl" ? "text-right" : ""}
            />
          </div>

          {/* Photo Upload - TODO */}
          {/* <div className="space-y-2">
            <Label htmlFor="photos">
              {t("clearances.returnReceipt.photos")}
            </Label>
            <Input
              id="photos"
              type="file"
              multiple
              accept="image/*"
              disabled={isSubmitting}
            />
          </div> */}

          {/* Submit Button */}
          <div className="flex gap-2 justify-end">
            <Button type="submit" disabled={isSubmitting || !condition}>
              {isSubmitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {t("clearances.returnReceipt.confirm")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
