"use client"

import { useLanguage } from "@/contexts/localization-context"
import { formatCurrency } from "@/lib/formatters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DollarSign, TrendingUp, Building2, CheckCircle2 } from "lucide-react"

interface SettlementCalculation {
  totalSales: number
  totalSalesWithTax: number
  totalSoldUnits?: number
  totalReturnedUnits?: number
  platformCommissionRate: number
  platformCommissionAmount: number
  storeCommissionRate: number
  storeCommissionAmount: number
  storePayoutAmount: number
  returnInventoryValue: number
  brandSalesRevenue?: number
  brandTotalAmount: number
}

interface SettlementPayoutCardProps {
  settlement: SettlementCalculation | undefined
}

export function SettlementPayoutCard({ settlement }: SettlementPayoutCardProps) {
  const { t, direction } = useLanguage()

  if (!settlement) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t("clearances.payout.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            {t("clearances.settlement.notCalculated")}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {t("clearances.payout.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Sales Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t("clearances.settlement.totalSales")}
            </span>
            <span className="font-medium">{formatCurrency(settlement.totalSales)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t("clearances.settlement.vat")} (15%)
            </span>
            <span className="font-medium">
              {formatCurrency(settlement.totalSalesWithTax - settlement.totalSales)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold">
              {t("clearances.settlement.totalWithTax")}
            </span>
            <span className="font-semibold text-lg">
              {formatCurrency(settlement.totalSalesWithTax)}
            </span>
          </div>
        </div>

        <Separator />

        {/* Store Commission Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <Building2 className="h-4 w-4" />
            {t("clearances.payout.storeCommission")}
          </div>
          <div className="flex items-center justify-between text-sm ps-6">
            <span className="text-muted-foreground">
              {t("clearances.payout.commissionRate")} ({settlement.storeCommissionRate}%)
            </span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              {formatCurrency(settlement.storeCommissionAmount)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs ps-6 text-muted-foreground">
            <span>
              {t("clearances.payout.platformCommission")} ({settlement.platformCommissionRate}%)
            </span>
            <span>
              {formatCurrency(settlement.platformCommissionAmount)}
            </span>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Store Payout Amount */}
        <div className="flex items-center justify-between rounded-lg bg-green-50 dark:bg-green-950/30 p-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              {t("clearances.payout.totalPayout")}
            </p>
            <p className="font-bold text-2xl text-green-700 dark:text-green-400">
              {formatCurrency(settlement.storePayoutAmount)}
            </p>
          </div>
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          {t("clearances.payout.note")}
        </p>
      </CardContent>
    </Card>
  )
}
