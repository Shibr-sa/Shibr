"use client"

import { useEffect, use, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAction, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useLanguage } from "@/contexts/localization-context"
import { useCart } from "@/contexts/cart-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default function PaymentSuccessPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const { toast } = useToast()
  const cart = useCart()

  const getChargeDetails = useAction(api.tapPayments.getChargeDetails)
  const createOrderFromPayment = useMutation(api.customerOrders.createOrderFromPayment)
  const processOrderAfterPayment = useAction(api.customerOrders.processOrderAfterPayment)

  // Get charge ID and status from URL params - check multiple possible parameter names
  const chargeId = searchParams.get("tap_id") ||
                   searchParams.get("charge_id") ||
                   searchParams.get("id") ||
                   searchParams.get("chargeId")

  const status = searchParams.get("status") ||
                 searchParams.get("payment_status") ||
                 searchParams.get("result")

  // State for order creation
  const [isProcessing, setIsProcessing] = useState(true)

  // CRITICAL: Use ref to prevent duplicate order creation
  const hasProcessed = useRef(false)

  useEffect(() => {
    // GUARD: Prevent duplicate execution
    if (hasProcessed.current) {
      console.log('[Payment Success] Already processed, skipping...')
      return
    }

    const verifyPaymentAndCreateOrder = async () => {
      // Mark as processing to prevent duplicate execution
      hasProcessed.current = true

      // Check if status indicates failure first
      if (status === "FAILED" || status === "DECLINED" || status === "CANCELLED") {
        router.push(`/store/${resolvedParams.slug}/payment/failed?status=${status}&tap_id=${chargeId}`)
        return
      }

      if (!chargeId) {
        toast({
          title: t("payment.error_title"),
          description: t("payment.missing_payment_info"),
          variant: "destructive",
        })
        router.push(`/store/${resolvedParams.slug}/cart`)
        return
      }

      try {
        // Verify the charge with Tap
        const chargeDetails = await getChargeDetails({
          chargeId: chargeId,
        })

        if (chargeDetails.status === "CAPTURED" || chargeDetails.status === "AUTHORIZED") {
          // Payment successful - follow standard flow
          console.log('[Payment Success] Payment verified, starting order flow...')

          // Get order data from sessionStorage
          const pendingOrderData = sessionStorage.getItem("pendingOrderData")
          if (!pendingOrderData) {
            throw new Error("Order data not found")
          }

          const orderData = JSON.parse(pendingOrderData)

          // STEP 1: Create order record with payment reference
          // This will automatically check for duplicates and return existing order if found
          console.log('[Payment Success] Step 1: Creating order record...')
          const orderResult = await createOrderFromPayment({
            shelfStoreId: orderData.shelfStoreId as any,
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
            paymentReference: chargeId, // This prevents duplicates
            items: orderData.items.map((item: any) => ({
              productId: item.productId as any,
              quantity: item.quantity
            }))
          })

          console.log('[Payment Success] Step 1 complete: Order record created:', orderResult.orderId)

          // STEPS 2-4: Process Wafeq and send invoice (runs in background)
          console.log('[Payment Success] Steps 2-4: Processing Wafeq and invoice...')
          processOrderAfterPayment({
            orderId: orderResult.orderId
          }).catch(error => {
            console.error('[Payment Success] Error processing Wafeq/invoice:', error)
            // Don't fail the order - it already exists
          })

          // Clear cart and session
          cart.clearCart()
          sessionStorage.removeItem("pendingOrder")
          sessionStorage.removeItem("pendingOrderData")

          console.log('[Payment Success] Redirecting to order confirmation...')

          // Redirect to order confirmation page
          router.push(`/store/${resolvedParams.slug}/order/${orderResult.orderId}`)
        } else {
          // Payment failed or pending
          toast({
            title: t("payment.error_title"),
            description: t("payment.payment_not_completed"),
            variant: "destructive",
          })
          router.push(`/store/${resolvedParams.slug}/payment`)
        }
      } catch (error) {
        console.error('[Payment Success] Error:', error)
        toast({
          title: t("payment.error_title"),
          description: error instanceof Error ? error.message : t("payment.verification_failed"),
          variant: "destructive",
        })
        router.push(`/store/${resolvedParams.slug}/payment`)
      } finally {
        setIsProcessing(false)
      }
    }

    verifyPaymentAndCreateOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chargeId, status]) // Only run when chargeId or status changes

  // Show success or failure based on initial status
  if (status === "failed") {
    return (
      <div className="container max-w-lg mx-auto py-24 px-4">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-12 text-center">
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">
              {t("payment.failed_title")}
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-6">
              {t("payment.failed_message")}
            </p>
            <Button
              onClick={() => router.push(`/store/${resolvedParams.slug}/payment`)}
              variant="destructive"
            >
              {t("payment.try_again")}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-lg mx-auto py-24 px-4">
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent className="p-12 text-center">
          <div className="mb-4">
            <Loader2 className="h-16 w-16 text-green-600 mx-auto animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
            {t("payment.verifying_payment")}
          </h2>
          <p className="text-green-700 dark:text-green-300">
            {t("payment.please_wait_verification")}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}