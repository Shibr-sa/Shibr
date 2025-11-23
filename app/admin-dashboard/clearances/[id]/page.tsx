"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useLanguage } from "@/contexts/localization-context"
import { formatCurrency } from "@/lib/formatters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ClearanceStatusBadge } from "@/components/clearances/ClearanceStatusBadge"
import { InventoryReconciliationTable } from "@/components/clearances/InventoryReconciliationTable"
import { SettlementSummaryCard } from "@/components/clearances/SettlementSummaryCard"
import { ReturnShippingDetails } from "@/components/clearances/ReturnShippingDetails"
import { ClearanceDocumentDownload } from "@/components/clearances/ClearanceDocumentDownload"
import { ClearanceApprovalInterface } from "@/components/admin/clearances/ClearanceApprovalInterface"
import { PaymentReceiptUploadForm } from "@/components/admin/clearances/PaymentReceiptUploadForm"
import { ClearanceStatusManagement } from "@/components/admin/clearances/ClearanceStatusManagement"
import { ChevronLeft, Building2, MapPin, Calendar, DollarSign, Package, TrendingUp } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { useRouter } from "next/navigation"

export default function AdminClearanceDetailPage({ params }: { params: { id: string } }) {
  const { t, language, direction } = useLanguage()
  const router = useRouter()
  const clearanceId = params.id as Id<"rentalClearances">

  const data = useQuery(api.admin.clearances.getAdminClearanceDetails, {
    clearanceId,
  })

  const locale = language === "ar" ? ar : undefined

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    )
  }

  const { clearance, rental, brand, store, shelf, settlementPayments } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-2"
          >
            <ChevronLeft className="h-4 w-4 me-1" />
            {t("common.back")}
          </Button>
          <h1 className="text-3xl font-bold">
            {t("clearances.admin.details.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("clearances.details.subtitle")} #{rental._id.slice(-8)}
          </p>
        </div>
        <ClearanceStatusBadge status={rental.clearanceStatus} />
      </div>

      {/* Rental Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t("clearances.details.rentalSummary")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Brand and Store Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {brand && (
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("clearances.admin.brand")}
                  </p>
                  <p className="font-medium">
                    {language === "ar" ? brand.nameAr : brand.name}
                  </p>
                </div>
              </div>
            )}

            {store && (
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("clearances.admin.store")}
                  </p>
                  <p className="font-medium">
                    {language === "ar" ? store.nameAr : store.name}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Shelf Info */}
          {shelf && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">
                  {language === "ar" ? shelf.titleAr : shelf.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {shelf.width} × {shelf.height} × {shelf.depth} {t("common.cm")}
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Rental Period and Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("clearances.details.rentalPeriod")}
                </p>
                <p className="font-medium">
                  {format(new Date(rental.startDate), "PP", { locale })}
                  {" - "}
                  {format(new Date(rental.endDate), "PP", { locale })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("clearances.details.rentalCost")}
                </p>
                <p className="font-medium">
                  {formatCurrency(rental.monthlyPrice)}{" "}
                  <span className="text-sm text-muted-foreground">
                    / {t("common.month")}
                  </span>
                </p>
                <p className="text-sm">
                  {t("clearances.details.totalPaid")}: {formatCurrency(rental.totalAmount)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Reconciliation */}
      {rental.finalProductSnapshot && rental.finalProductSnapshot.length > 0 && (
        <InventoryReconciliationTable items={rental.finalProductSnapshot} />
      )}

      {/* Financial Settlement - Full Breakdown */}
      <SettlementSummaryCard settlement={rental.settlementCalculation} />

      {/* Settlement Approval Interface */}
      <ClearanceApprovalInterface
        clearanceId={clearanceId}
        rentalId={rental._id}
        settlement={rental.settlementCalculation}
        onSuccess={() => router.refresh()}
      />

      {/* Initial Shipping (Brand → Store) */}
      {rental.initialShipment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t("clearances.admin.initialShipping")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("shipping.carrier")}:</span>
              <span>{t(`carriers.${rental.initialShipment.carrier}`)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("shipping.trackingNumber")}:</span>
              <span className="font-mono">{rental.initialShipment.trackingNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("shipping.shippedDate")}:</span>
              <span>{format(new Date(rental.initialShipment.shippedAt), "PP", { locale })}</span>
            </div>
            {rental.initialShipment.receivedAt && (
              <div className="flex justify-between text-green-600">
                <span>{t("shipping.receivedDate")}:</span>
                <span>{format(new Date(rental.initialShipment.receivedAt), "PP", { locale })}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Return Shipping (Store → Brand) */}
      <ReturnShippingDetails returnShipment={rental.returnShipment} />

      {/* Payment Receipt Upload */}
      {settlementPayments && settlementPayments.length > 0 && settlementPayments[0] && (
        <PaymentReceiptUploadForm
          paymentId={settlementPayments[0]._id}
          existingReceiptId={settlementPayments[0].receiptFileId}
          onSuccess={() => router.refresh()}
        />
      )}

      {/* Manual Status Management - Danger Zone */}
      <ClearanceStatusManagement
        clearanceId={clearanceId}
        rentalId={rental._id}
        currentStatus={rental.clearanceStatus}
        onSuccess={() => router.refresh()}
      />

      {/* Clearance Document */}
      <ClearanceDocumentDownload
        documentId={rental.clearanceDocumentId}
        rentalId={rental._id}
      />
    </div>
  )
}
