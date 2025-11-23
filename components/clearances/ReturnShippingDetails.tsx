"use client"

import { useLanguage } from "@/contexts/localization-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Truck, Calendar, FileText, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

interface ReturnShipment {
  carrier: string
  trackingNumber: string
  shippedAt: number
  shippedBy?: string
  expectedDeliveryDate?: string
  notes?: string
  receivedAt?: number
  receivedBy?: string
  condition?: string
  receiptPhotos?: string[]
  confirmationNotes?: string
}

interface ReturnShippingDetailsProps {
  returnShipment: ReturnShipment | undefined
}

export function ReturnShippingDetails({ returnShipment }: ReturnShippingDetailsProps) {
  const { t, language } = useLanguage()

  if (!returnShipment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t("clearances.returnShipping.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            {t("clearances.returnShipping.notShipped")}
          </p>
        </CardContent>
      </Card>
    )
  }

  const locale = language === "ar" ? ar : undefined

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t("clearances.returnShipping.title")}
          </CardTitle>
          {returnShipment.receivedAt ? (
            <Badge variant="default" className="gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t("clearances.returnShipping.received")}
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1.5">
              <Truck className="h-3.5 w-3.5" />
              {t("clearances.returnShipping.inTransit")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Carrier and Tracking */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {t("clearances.returnShipping.carrier")}
            </p>
            <p className="font-medium">{t(`carriers.${returnShipment.carrier}`)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {t("clearances.returnShipping.trackingNumber")}
            </p>
            <p className="font-mono font-medium">{returnShipment.trackingNumber}</p>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {t("clearances.returnShipping.shippedDate")}
            </p>
            <p className="font-medium">
              {format(new Date(returnShipment.shippedAt), "PPP", { locale })}
            </p>
          </div>
          {returnShipment.expectedDeliveryDate && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {t("clearances.returnShipping.expectedDelivery")}
              </p>
              <p className="font-medium">
                {format(new Date(returnShipment.expectedDeliveryDate), "PPP", { locale })}
              </p>
            </div>
          )}
        </div>

        {/* Store Notes */}
        {returnShipment.notes && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              {t("clearances.returnShipping.storeNotes")}
            </p>
            <p className="text-sm bg-muted p-3 rounded-md">
              {returnShipment.notes}
            </p>
          </div>
        )}

        {/* Receipt Confirmation (if received) */}
        {returnShipment.receivedAt && (
          <>
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {t("clearances.returnShipping.receiptConfirmed")}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t("clearances.returnShipping.receivedDate")}
                  </p>
                  <p className="font-medium">
                    {format(new Date(returnShipment.receivedAt), "PPP", { locale })}
                  </p>
                </div>
                {returnShipment.condition && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {t("clearances.returnShipping.condition")}
                    </p>
                    <Badge variant="outline">
                      {t(`clearances.returnReceipt.condition${returnShipment.condition.charAt(0).toUpperCase() + returnShipment.condition.slice(1)}`)}
                    </Badge>
                  </div>
                )}
              </div>

              {returnShipment.confirmationNotes && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t("clearances.returnShipping.confirmationNotes")}
                  </p>
                  <p className="text-sm bg-muted p-3 rounded-md">
                    {returnShipment.confirmationNotes}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
