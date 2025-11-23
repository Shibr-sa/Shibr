"use client"

import { useLanguage } from "@/contexts/localization-context"
import { formatCurrency } from "@/lib/formatters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClearanceStatusBadge } from "@/components/clearances/ClearanceStatusBadge"
import { FileCheck, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Id } from "@/convex/_generated/dataModel"

type ClearanceStatus =
  | "not_started"
  | "pending_inventory_check"
  | "pending_return_shipment"
  | "return_shipped"
  | "return_received"
  | "pending_settlement"
  | "settlement_approved"
  | "payment_completed"
  | "closed"

interface ClearanceQuickInfoProps {
  rentalId: Id<"rentalRequests">
  clearanceId?: Id<"rentalClearances">
  clearanceStatus?: ClearanceStatus
  settlementAmount?: number
  payoutAmount?: number
  viewerRole: "brand" | "store" | "admin"
}

export function ClearanceQuickInfo({
  rentalId,
  clearanceId,
  clearanceStatus,
  settlementAmount,
  payoutAmount,
  viewerRole,
}: ClearanceQuickInfoProps) {
  const { t, direction } = useLanguage()

  // Don't render if no clearance data
  if (!clearanceStatus || !clearanceId) {
    return null
  }

  // Determine the clearance detail URL based on role
  const clearanceUrl = `/${viewerRole}-dashboard/clearances/${clearanceId}`

  // Determine what amount to show based on role
  const displayAmount = viewerRole === "store" ? payoutAmount : settlementAmount

  return (
    <Card className="border-blue-200 dark:border-blue-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileCheck className="h-5 w-5" />
          {t("clearances.quickInfo.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t("common.status")}:
          </span>
          <ClearanceStatusBadge status={clearanceStatus} />
        </div>

        {/* Amount */}
        {displayAmount !== undefined && displayAmount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {viewerRole === "store"
                ? t("clearances.quickInfo.payout")
                : t("clearances.quickInfo.settlement")}:
            </span>
            <span className="font-semibold text-lg">
              {formatCurrency(displayAmount)}
            </span>
          </div>
        )}

        {/* View Details Link */}
        <Button variant="outline" className="w-full" asChild>
          <Link href={clearanceUrl}>
            {t("clearances.quickInfo.viewDetails")}
            <ArrowRight className={direction === "rtl" ? "me-2 h-4 w-4" : "ms-2 h-4 w-4"} />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
