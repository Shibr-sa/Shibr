"use client"

import { useLanguage } from "@/contexts/localization-context"
import { formatCurrency } from "@/lib/formatters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, XCircle, AlertCircle, DollarSign } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

interface Payment {
  _id: string
  _creationTime: number
  amount: number
  status: "completed" | "failed" | "refunded"
  transferStatus?: "pending" | "processing" | "completed" | "failed"
  type: string
  settlementBreakdown?: {
    totalSalesAmount: number
    totalSalesWithTax: number
    platformCommissionRate: number
    platformCommissionAmount: number
    storeCommissionRate: number
    storeCommissionAmount: number
    netPayoutToStore: number
  }
}

interface PayoutStatusTrackerProps {
  payments: Payment[]
}

export function PayoutStatusTracker({ payments }: PayoutStatusTrackerProps) {
  const { t, language } = useLanguage()
  const locale = language === "ar" ? ar : undefined

  if (!payments || payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t("clearances.payoutTracker.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            {t("clearances.payoutTracker.noPayments")}
          </p>
        </CardContent>
      </Card>
    )
  }

  const getTransferStatusBadge = (status?: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("clearances.payoutTracker.completed")}
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="secondary" className="gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            {t("clearances.payoutTracker.processing")}
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive" className="gap-1.5">
            <XCircle className="h-3.5 w-3.5" />
            {t("clearances.payoutTracker.failed")}
          </Badge>
        )
      case "pending":
      default:
        return (
          <Badge variant="outline" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {t("clearances.payoutTracker.pending")}
          </Badge>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {t("clearances.payoutTracker.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {payments.map((payment) => (
          <div
            key={payment._id}
            className="border rounded-lg p-4 space-y-3"
          >
            {/* Status and Amount */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t("clearances.payoutTracker.payoutAmount")}
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(payment.amount)}
                </p>
              </div>
              {getTransferStatusBadge(payment.transferStatus)}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">
                  {t("clearances.payoutTracker.createdDate")}:
                </span>{" "}
                <span className="font-medium">
                  {format(new Date(payment._creationTime), "PPP", { locale })}
                </span>
              </div>
              {payment.transferStatus === "completed" && (
                <div>
                  <span className="text-muted-foreground">
                    {t("clearances.payoutTracker.completedDate")}:
                  </span>{" "}
                  <span className="font-medium text-green-600">
                    {format(new Date(payment._creationTime), "PPP", { locale })}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Details */}
            {payment.settlementBreakdown && (
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  {t("clearances.payoutTracker.viewDetails")}
                </summary>
                <div className="mt-2 space-y-1 ps-4 border-s-2 border-muted">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("clearances.settlement.totalSales")}:
                    </span>
                    <span>{formatCurrency(payment.settlementBreakdown.totalSalesAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("clearances.payout.commissionRate")}:
                    </span>
                    <span>{payment.settlementBreakdown.storeCommissionRate}%</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>{t("clearances.payoutTracker.netPayout")}:</span>
                    <span>{formatCurrency(payment.settlementBreakdown.netPayoutToStore)}</span>
                  </div>
                </div>
              </details>
            )}
          </div>
        ))}

        {payments.some(p => p.transferStatus === "pending") && (
          <p className="text-xs text-muted-foreground text-center">
            {t("clearances.payoutTracker.pendingNote")}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
