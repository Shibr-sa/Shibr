"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/localization-context"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Package, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface StoreReturnShippingFormProps {
  clearanceId: Id<"rentalClearances">
  rentalId: Id<"rentalRequests">
  onSuccess?: () => void
}

export function StoreReturnShippingForm({
  clearanceId,
  rentalId,
  onSuccess,
}: StoreReturnShippingFormProps) {
  const { t, direction, language } = useLanguage()
  const [carrier, setCarrier] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<Date>()
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitShipment = useMutation(api.rentalClearance.submitReturnShipment)

  const carriers = [
    "smsa", "aramex", "zajil", "fedex", "dhl", "ups", "spl", "naqel"
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!carrier || !trackingNumber) {
      toast.error(t("shipping.validation.required"))
      return
    }

    setIsSubmitting(true)

    try {
      await submitShipment({
        clearanceId,
        rentalRequestId: rentalId,
        carrier,
        trackingNumber,
        expectedDeliveryDate: expectedDeliveryDate?.toISOString(),
        notes: notes || undefined,
      })

      toast.success(t("clearances.storeReturnShipping.success"))

      // Reset form
      setCarrier("")
      setTrackingNumber("")
      setExpectedDeliveryDate(undefined)
      setNotes("")

      onSuccess?.()
    } catch (error) {
      console.error("Error submitting return shipment:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : t("clearances.storeReturnShipping.error")
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const locale = language === "ar" ? ar : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {t("clearances.storeReturnShipping.title")}
        </CardTitle>
        <CardDescription>
          {t("clearances.storeReturnShipping.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Carrier Select */}
          <div className="space-y-2">
            <Label htmlFor="carrier">
              {t("shipping.carrier")}
              <span className="text-red-500">*</span>
            </Label>
            <Select
              dir={direction}
              value={carrier}
              onValueChange={setCarrier}
              disabled={isSubmitting}
            >
              <SelectTrigger id="carrier">
                <SelectValue placeholder={t("shipping.selectCarrier")} />
              </SelectTrigger>
              <SelectContent dir={direction}>
                {carriers.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`carriers.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tracking Number */}
          <div className="space-y-2">
            <Label htmlFor="trackingNumber">
              {t("shipping.trackingNumber")}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="trackingNumber"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder={t("shipping.trackingNumberPlaceholder")}
              disabled={isSubmitting}
              className={direction === "rtl" ? "text-right" : ""}
            />
          </div>

          {/* Expected Delivery Date */}
          <div className="space-y-2">
            <Label htmlFor="expectedDeliveryDate">
              {t("shipping.expectedDeliveryDate")}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="expectedDeliveryDate"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expectedDeliveryDate && "text-muted-foreground",
                    direction === "rtl" && "flex-row-reverse"
                  )}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className={direction === "rtl" ? "ms-2 h-4 w-4" : "me-2 h-4 w-4"} />
                  {expectedDeliveryDate ? (
                    format(expectedDeliveryDate, "PPP", { locale })
                  ) : (
                    <span>{t("shipping.selectDate")}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expectedDeliveryDate}
                  onSelect={setExpectedDeliveryDate}
                  initialFocus
                  locale={locale}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              {t("shipping.notes")}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("clearances.storeReturnShipping.notesPlaceholder")}
              rows={4}
              disabled={isSubmitting}
              className={direction === "rtl" ? "text-right" : ""}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 justify-end">
            <Button type="submit" disabled={isSubmitting || !carrier || !trackingNumber}>
              {isSubmitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {t("clearances.storeReturnShipping.submit")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
