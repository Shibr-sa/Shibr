"use client"

import { use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useLanguage } from "@/contexts/localization-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle, RefreshCw, ShoppingCart } from "lucide-react"

interface PageProps {
  params: Promise<{ branchId: string }>
}

export default function PaymentFailedPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  // Get error details from URL params - check multiple possible parameter names
  const status = searchParams.get("status") ||
                 searchParams.get("payment_status") ||
                 searchParams.get("result")

  const tapId = searchParams.get("tap_id") ||
                searchParams.get("charge_id") ||
                searchParams.get("id") ||
                searchParams.get("chargeId")

  const handleRetryPayment = () => {
    router.push(`/store/${resolvedParams.branchId}/cart`)
  }

  const handleBackToCart = () => {
    router.push(`/store/${resolvedParams.branchId}/cart`)
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-6 w-6" />
            {t("payment.payment_failed")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Message */}
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">
              {t("payment.transaction_declined")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("payment.payment_not_processed")}
            </p>
            {status && (
              <p className="text-xs text-muted-foreground">
                {t("payment.status")}: {status}
              </p>
            )}
          </div>

          {/* Common Reasons */}
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <p className="font-medium text-sm">{t("payment.common_reasons")}</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>{t("payment.insufficient_funds")}</li>
              <li>{t("payment.incorrect_card_details")}</li>
              <li>{t("payment.card_expired")}</li>
              <li>{t("payment.transaction_limit_exceeded")}</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleRetryPayment}
              className="flex-1"
              size="lg"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t("payment.try_again")}
            </Button>
            <Button
              onClick={handleBackToCart}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {t("store.back_to_cart")}
            </Button>
          </div>

          {/* Support Info */}
          <div className="text-center text-xs text-muted-foreground">
            <p>{t("payment.need_help")}</p>
            <p>{t("payment.contact_support")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}