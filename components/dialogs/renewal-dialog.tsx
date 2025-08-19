"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/contexts/localization-context"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { toast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/formatters"
import { CalendarDays } from "lucide-react"

interface RenewalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rentalRequestId: Id<"rentalRequests">
  currentEndDate: string
  monthlyPrice: number
  onSuccess?: () => void
}

export function RenewalDialog({
  open,
  onOpenChange,
  rentalRequestId,
  currentEndDate,
  monthlyPrice,
  onSuccess
}: RenewalDialogProps) {
  const { t, direction } = useLanguage()
  const [months, setMonths] = useState("1")
  const [isLoading, setIsLoading] = useState(false)
  const renewRental = useMutation(api.rentalManagement.renewRental)

  const calculateNewEndDate = (additionalMonths: number) => {
    const endDate = new Date(currentEndDate)
    endDate.setMonth(endDate.getMonth() + additionalMonths)
    return endDate.toISOString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(direction === "rtl" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  const handleRenew = async () => {
    setIsLoading(true)
    try {
      const additionalMonths = parseInt(months)
      await renewRental({
        rentalRequestId,
        newEndDate: calculateNewEndDate(additionalMonths),
        additionalMonths
      })
      
      toast({
        title: t("rental.renewal_requested"),
        description: t("rental.renewal_requested_desc"),
      })
      
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("rental.renewal_failed"),
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const totalPrice = monthlyPrice * parseInt(months)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            {t("rental.renew_rental")}
          </DialogTitle>
          <DialogDescription>
            {t("rental.renew_description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t("rental.current_end_date")}</Label>
            <div className="text-sm text-muted-foreground">
              {formatDate(currentEndDate)}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="months">{t("rental.additional_months")}</Label>
            <Select value={months} onValueChange={setMonths}>
              <SelectTrigger id="months">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 6, 12].map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {m} {t(m === 1 ? "common.month" : "common.months")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("rental.new_end_date")}</Label>
            <div className="text-sm text-muted-foreground">
              {formatDate(calculateNewEndDate(parseInt(months)))}
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t("rental.monthly_price")}</span>
              <span>{formatCurrency(monthlyPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>{t("rental.duration")}</span>
              <span>{months} {t(parseInt(months) === 1 ? "common.month" : "common.months")}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>{t("rental.total_price")}</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleRenew} disabled={isLoading}>
            {isLoading ? t("common.loading") : t("rental.request_renewal")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}