"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useLanguage } from "@/contexts/localization-context"
import { useCart } from "@/contexts/cart-context"
import { useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/formatters"
import {
  ArrowLeft,
  ShoppingBag,
  Phone,
  Store,
  Loader2
} from "lucide-react"

interface OrderData {
  shelfStoreId: string
  storeName: string
  customerName: string
  customerPhone: string
  items: Array<{
    productId: string
    name: string
    price: number
    quantity: number
  }>
  subtotal: number
  tax: number
  total: number
  timestamp: number
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const cart = useCart()
  const slug = params.slug as string

  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Check if this is a redirect from Tap payment
  const tapId = searchParams.get("tap_id") ||
                searchParams.get("charge_id") ||
                searchParams.get("id") ||
                searchParams.get("chargeId")

  const paymentStatus = searchParams.get("status") ||
                        searchParams.get("payment_status") ||
                        searchParams.get("result")

  // Actions
  const createCheckoutSession = useAction(api.tapPayments.createCheckoutSession)
  const createOrder = useAction(api.customerOrders.createOrder)

  useEffect(() => {
    // If we have Tap redirect parameters, redirect to success page for verification
    if (tapId) {
      // Build URL with all parameters
      const params = new URLSearchParams(searchParams.toString())
      router.push(`/store/${slug}/payment/success?${params.toString()}`)
      return
    }

    // Load order data from sessionStorage
    const pendingOrder = sessionStorage.getItem("pendingOrder")
    if (!pendingOrder) {
      // No order data, redirect back to cart
      toast({
        title: t("payment.no_order_data"),
        description: t("payment.redirecting_cart"),
        variant: "destructive",
      })
      router.push(`/store/${slug}/cart`)
      return
    }

    try {
      const data = JSON.parse(pendingOrder)
      setOrderData(data)
    } catch (error) {
      router.push(`/store/${slug}/cart`)
    }
  }, [slug, router, t, toast, tapId, paymentStatus, searchParams])

  const handlePayNow = async () => {
    if (!orderData) return

    setIsProcessing(true)

    try {
      // Create order in database first
      const orderResult = await createOrder({
        shelfStoreId: orderData.shelfStoreId as any,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        items: orderData.items.map(item => ({
          productId: item.productId as any,
          quantity: item.quantity
        })),
        paymentMethod: "card"
      })

      // Create checkout session with Tap
      const session = await createCheckoutSession({
        amount: orderData.total,
        description: `Order from ${orderData.storeName}`,
        customerName: "Customer",
        customerEmail: `${orderData.customerPhone}@shibr.io`,
        customerPhone: orderData.customerPhone,
        orderId: orderResult.orderId,
        metadata: {
          type: "purchase",
          storeSlug: slug
        }
      })

      if (session.success && session.checkoutUrl) {
        // Store order ID for success page
        sessionStorage.setItem("orderId", orderResult.orderId as string)
        // Redirect to Tap checkout page
        window.location.href = session.checkoutUrl
      } else {
        throw new Error(t("payment.checkout_creation_failed"))
      }
    } catch (error) {
      toast({
        title: t("payment.error_title"),
        description: error instanceof Error ? error.message : t("payment.error_message"),
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }


  if (!orderData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push(`/store/${slug}/cart`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 me-2" />
            {t("common.back")}
          </Button>
          <h1 className="text-2xl font-bold">{t("payment.title")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("payment.secure_checkout")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Payment Methods */}
          <div className="md:col-span-2 space-y-6">
            {/* Store Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Store className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("payment.ordering_from")}</p>
                    <p className="font-semibold">{orderData.storeName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("payment.receipt_phone")}</p>
                    <p className="font-semibold" dir="ltr">{orderData.customerPhone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>{t("payment.payment_method")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>{t("payment.secure_checkout_description")}</p>
                  <p className="mt-2">{t("payment.accepted_methods")}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs">💳</span>
                    <span className="text-xs">Visa</span>
                    <span className="text-xs">Mastercard</span>
                    <span className="text-xs">MADA</span>
                    <span className="text-xs">Apple Pay</span>
                  </div>
                </div>

                <Button
                  onClick={handlePayNow}
                  disabled={isProcessing}
                  size="lg"
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {t("payment.redirecting")}
                    </>
                  ) : (
                    <>
                      💳 {t("payment.pay_now")} - {formatCurrency(orderData.total, language)} {t("common.currency_symbol")}
                    </>
                  )}
                </Button>

                <div className="text-xs text-muted-foreground text-center">
                  <p className="flex items-center justify-center gap-1">
                    <span>🔒</span>
                    <span>{t("payment.secure_payment")}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  {t("payment.order_summary")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-2">
                  {orderData.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.name} x{item.quantity}
                      </span>
                      <span>{formatCurrency(item.price * item.quantity, language)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("store.products")}</span>
                    <span>{formatCurrency(orderData.subtotal, language)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("store.tax")} (15%)</span>
                    <span>{formatCurrency(orderData.tax, language)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>{t("store.total")}</span>
                    <span>{formatCurrency(orderData.total, language)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}