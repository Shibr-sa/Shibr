"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/localization-context"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { formatCurrency } from "@/lib/formatters"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

interface SettlementCalculation {
  totalSales: number
  totalSalesWithTax: number
  platformCommissionRate: number
  platformCommissionAmount: number
  storeCommissionRate: number
  storeCommissionAmount: number
  storePayoutAmount: number
  returnInventoryValue: number
  brandTotalAmount: number
  calculatedAt: number
  calculatedBy: Id<"users">
  approvedAt?: number
  approvedBy?: Id<"users">
}

interface ClearanceApprovalInterfaceProps {
  clearanceId: Id<"rentalClearances">
  rentalId: Id<"rentalRequests">
  settlement: SettlementCalculation | undefined
  onSuccess?: () => void
}

export function ClearanceApprovalInterface({
  clearanceId,
  rentalId,
  settlement,
  onSuccess,
}: ClearanceApprovalInterfaceProps) {
  const { t, language, direction } = useLanguage()
  const [isApproving, setIsApproving] = useState(false)

  const approveSettlement = useMutation(api.rentalClearance.approveSettlement)

  const locale = language === "ar" ? ar : undefined

  if (!settlement) {
    return null
  }

  // Already approved
  if (settlement.approvedAt) {
    return (
      <Card className="border-green-200 dark:border-green-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              {t("clearances.approval.title")}
            </CardTitle>
            <Badge variant="default" className="gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t("clearances.approval.approved")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t("clearances.approval.approvedOn")}{" "}
            {format(new Date(settlement.approvedAt), "PPP", { locale })}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Pending approval
  const handleApprove = async () => {
    setIsApproving(true)

    try {
      await approveSettlement({
        clearanceId,
        rentalRequestId: rentalId,
      })

      toast.success(t("clearances.approval.success"))
      onSuccess?.()
    } catch (error) {
      console.error("Error approving settlement:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : t("clearances.approval.error")
      )
    } finally {
      setIsApproving(false)
    }
  }

  return (
    <Card className="border-yellow-200 dark:border-yellow-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("clearances.approval.title")}</CardTitle>
          <Badge variant="outline" className="gap-1.5">
            <XCircle className="h-3.5 w-3.5" />
            {t("clearances.approval.pending")}
          </Badge>
        </div>
        <CardDescription>
          {t("clearances.approval.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Settlement Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">
              {t("clearances.approval.platformCommission")}
            </p>
            <p className="text-lg font-bold">
              {formatCurrency(settlement.platformCommissionAmount)}
            </p>
            <p className="text-xs text-muted-foreground">
              ({settlement.platformCommissionRate}%)
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">
              {t("clearances.approval.storePayout")}
            </p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(settlement.storePayoutAmount)}
            </p>
            <p className="text-xs text-muted-foreground">
              ({settlement.storeCommissionRate}%)
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">
              {t("clearances.approval.brandRevenue")}
            </p>
            <p className="text-lg font-bold">
              {formatCurrency(settlement.brandTotalAmount)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            {t("clearances.approval.totalSales")}: {formatCurrency(settlement.totalSalesWithTax)}
          </p>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={isApproving}>
                {isApproving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                <CheckCircle2 className="h-4 w-4 me-2" />
                {t("clearances.approval.approve")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir={direction}>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("clearances.approval.confirmTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("clearances.approval.confirmDescription")}
                  <div className="mt-4 p-3 bg-muted rounded-md space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t("clearances.approval.platformCommission")}:</span>
                      <span className="font-medium">
                        {formatCurrency(settlement.platformCommissionAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t("clearances.approval.storePayout")}:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(settlement.storePayoutAmount)}
                      </span>
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleApprove}>
                  {t("clearances.approval.approve")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}
