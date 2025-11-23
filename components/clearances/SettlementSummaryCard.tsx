"use client"

import { useLanguage } from "@/contexts/localization-context"
import { formatCurrency } from "@/lib/formatters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DollarSign, TrendingUp, Building2, Package } from "lucide-react"

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

interface SettlementSummaryCardProps {
  settlement: SettlementCalculation | undefined
}

export function SettlementSummaryCard({ settlement }: SettlementSummaryCardProps) {
  const { t, direction } = useLanguage()

  if (!settlement) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t("clearances.settlement.title")}
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
          {t("clearances.settlement.title")}
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

        {/* Commissions Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <Building2 className="h-4 w-4" />
            {t("clearances.settlement.commissions")}
          </div>
          <div className="flex items-center justify-between text-sm ps-6">
            <span className="text-muted-foreground">
              {t("clearances.settlement.platformCommission")} ({settlement.platformCommissionRate}%)
            </span>
            <span className="text-red-600 dark:text-red-400">
              - {formatCurrency(settlement.platformCommissionAmount)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm ps-6">
            <span className="text-muted-foreground">
              {t("clearances.settlement.storeCommission")} ({settlement.storeCommissionRate}%)
            </span>
            <span className="text-red-600 dark:text-red-400">
              - {formatCurrency(settlement.storeCommissionAmount)}
            </span>
          </div>
        </div>

        <Separator />

        {/* Brand Revenue Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <TrendingUp className="h-4 w-4" />
            {t("clearances.settlement.brandRevenue")}
          </div>
          <div className="flex items-center justify-between text-sm ps-6">
            <span className="text-muted-foreground">
              {t("clearances.settlement.salesRevenue")}
            </span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              {formatCurrency(settlement.brandSalesRevenue || settlement.totalSales - settlement.platformCommissionAmount - settlement.storeCommissionAmount)}
            </span>
          </div>
        </div>

        <Separator />

        {/* Return Inventory Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <Package className="h-4 w-4" />
            {t("clearances.settlement.returnInventory")}
          </div>
          {settlement.totalReturnedUnits !== undefined && (
            <div className="flex items-center justify-between text-sm ps-6">
              <span className="text-muted-foreground">
                {t("clearances.settlement.returnedUnits")}
              </span>
              <span>{settlement.totalReturnedUnits} {t("clearances.settlement.units")}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm ps-6">
            <span className="text-muted-foreground">
              {t("clearances.settlement.returnValue")}
            </span>
            <span className="font-medium">
              {formatCurrency(settlement.returnInventoryValue)}
            </span>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Total Brand Amount */}
        <div className="flex items-center justify-between rounded-lg bg-primary/10 p-4">
          <span className="font-bold text-lg">
            {t("clearances.settlement.totalBrandAmount")}
          </span>
          <span className="font-bold text-2xl text-primary">
            {formatCurrency(settlement.brandTotalAmount)}
          </span>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          {t("clearances.settlement.note")}
        </p>
      </CardContent>
    </Card>
  )
}
