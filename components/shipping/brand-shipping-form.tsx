"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useLanguage } from "@/contexts/localization-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { toast } from "sonner"

interface BrandShippingFormProps {
  requestId: Id<"rentalRequests">
  onSuccess?: () => void
}

export function BrandShippingForm({ requestId, onSuccess }: BrandShippingFormProps) {
  const { t, language, direction } = useLanguage()

  // Form state
  const [carrier, setCarrier] = useState<string>("")
  const [trackingNumber, setTrackingNumber] = useState<string>("")
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<Date | undefined>(undefined)
  const [notes, setNotes] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  // Mutation
  const submitInitialShipment = useMutation(api.rentalRequests.submitInitialShipment)

  // Carriers list
  const carriers = [
    { value: "smsa", label: t("carriers.smsa") },
    { value: "aramex", label: t("carriers.aramex") },
    { value: "fedex", label: t("carriers.fedex") },
    { value: "dhl", label: t("carriers.dhl") },
    { value: "ups", label: t("carriers.ups") },
    { value: "naqel", label: t("carriers.naqel") },
    { value: "zajil", label: t("carriers.zajil") },
    { value: "other", label: t("carriers.other") }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!carrier.trim()) {
      toast.error(t("shipping.carrier_required"))
      return
    }

    if (!trackingNumber.trim()) {
      toast.error(t("shipping.tracking_required"))
      return
    }

    setSubmitting(true)

    try {
      await submitInitialShipment({
        requestId,
        carrier,
        trackingNumber,
        expectedDeliveryDate: expectedDeliveryDate?.toISOString(),
        notes: notes.trim() || undefined
      })

      toast.success(t("shipping.submitted_success"))

      // Reset form
      setCarrier("")
      setTrackingNumber("")
      setExpectedDeliveryDate(undefined)
      setNotes("")

      // Call success callback
      onSuccess?.()
    } catch (error) {
      toast.error(t("shipping.submission_error"))
    } finally {
      setSubmitting(false)
    }
  }

  const isSubmitDisabled = !carrier.trim() || !trackingNumber.trim() || submitting

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Carrier Selection */}
      <div className="space-y-2">
        <Label htmlFor="carrier">
          {t("shipping.carrier")} <span className="text-red-500">*</span>
        </Label>
        <Select value={carrier} onValueChange={setCarrier} dir={direction}>
          <SelectTrigger id="carrier">
            <SelectValue placeholder={t("shipping.select_carrier")} />
          </SelectTrigger>
          <SelectContent>
            {carriers.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tracking Number */}
      <div className="space-y-2">
        <Label htmlFor="trackingNumber">
          {t("shipping.tracking_number")} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="trackingNumber"
          type="text"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder={t("shipping.enter_tracking")}
        />
      </div>

      {/* Expected Delivery Date (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="expectedDeliveryDate">
          {t("shipping.expected_delivery")}
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="expectedDeliveryDate"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !expectedDeliveryDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {expectedDeliveryDate ? (
                format(expectedDeliveryDate, "PPP", {
                  locale: language === "ar" ? ar : enUS
                })
              ) : (
                <span>{t("shipping.expected_delivery")}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={expectedDeliveryDate}
              onSelect={setExpectedDeliveryDate}
              disabled={(date) => date < today}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Shipping Notes (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="notes">
          {t("shipping.shipping_notes")}
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder={t("shipping.shipping_notes")}
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitDisabled}
      >
        {submitting && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
        {submitting ? t("shipping.submitting") : t("shipping.submit_shipment")}
      </Button>
    </form>
  )
}
