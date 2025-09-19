"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useLanguage } from "@/contexts/localization-context"
import { useCart } from "@/contexts/cart-context"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react"

interface OrderData {
  shelfStoreId: string
  storeName: string
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
  paymentMethod: "card" | "apple"
  timestamp: number
}

export default function PaymentProcessingPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useLanguage()
  const { toast } = useToast()
  const cart = useCart()
  const slug = params.slug as string

  const [status, setStatus] = useState<"processing" | "success" | "failed">("processing")
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)

  // Use ref to prevent duplicate processing in React Strict Mode
  const isProcessingRef = useRef(false)

  const createOrder = useMutation(api.customerOrders.createOrder)

  useEffect(() => {
    // Prevent duplicate execution
    if (isProcessingRef.current) return
    isProcessingRef.current = true

    // Load order data from sessionStorage
    const pendingOrder = sessionStorage.getItem("pendingOrder")
    if (!pendingOrder) {
      router.push(`/store/${slug}/cart`)
      return
    }

    try {
      const data = JSON.parse(pendingOrder)
      setOrderData(data)

      // Simulate payment processing
      processPayment(data)
    } catch (error) {
      console.error("Invalid order data:", error)
      router.push(`/store/${slug}/cart`)
    }
  }, []) // Empty dependencies to run only once

  const processPayment = async (data: OrderData) => {
    // Simulate payment processing delay (3 seconds)
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Simulate 95% success rate for card payments, 98% for Apple Pay
    const isSuccess = data.paymentMethod === "apple" ? Math.random() > 0.02 : Math.random() > 0.05

    if (isSuccess) {
      try {
        // Create the actual order in the database
        const result = await createOrder({
          shelfStoreId: data.shelfStoreId,
          customerName: "Guest Customer",
          customerEmail: "guest@store.com",
          customerPhone: data.customerPhone,
          items: data.items.map(item => ({
            productId: item.productId as any,
            quantity: item.quantity
          })),
          paymentMethod: data.paymentMethod,
          notes: "",
        })

        setOrderId(result.orderId)
        setOrderNumber(result.orderNumber)
        setStatus("success")

        // Clear cart and order data
        cart.clearCart()
        sessionStorage.removeItem("pendingOrder")

        // Show success message
        toast({
          title: t("payment.payment_successful"),
          description: t("payment.order_confirmed"),
        })

        // Redirect to thank you page after a short delay
        setTimeout(() => {
          router.push(`/store/${slug}/order/${result.orderId}`)
        }, 2000)
      } catch (error: any) {
        console.error("Order creation error:", error)
        setStatus("failed")
        toast({
          title: t("payment.order_failed"),
          description: error.message,
          variant: "destructive",
        })
      }
    } else {
      // Payment failed
      setStatus("failed")
      toast({
        title: t("payment.payment_failed"),
        description: t("payment.payment_declined"),
        variant: "destructive",
      })

      // Redirect back to payment page after delay
      setTimeout(() => {
        router.push(`/store/${slug}/payment`)
      }, 3000)
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case "processing":
        return <Loader2 className="h-16 w-16 text-primary animate-spin" />
      case "success":
        return <CheckCircle2 className="h-16 w-16 text-green-500" />
      case "failed":
        return <XCircle className="h-16 w-16 text-destructive" />
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case "processing":
        return {
          title: t("payment.processing_payment"),
          description: orderData?.paymentMethod === "card"
            ? t("payment.verifying_card")
            : orderData?.paymentMethod === "apple"
            ? t("payment.verifying_apple_pay")
            : t("payment.confirming_order")
        }
      case "success":
        return {
          title: t("payment.payment_successful"),
          description: `${t("store.order_number")}: ${orderNumber}`
        }
      case "failed":
        return {
          title: t("payment.payment_failed"),
          description: t("payment.redirecting_back")
        }
    }
  }

  const message = getStatusMessage()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              {getStatusIcon()}
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{message.title}</h2>
              <p className="text-muted-foreground">
                {message.description}
              </p>
            </div>

            {status === "processing" && (orderData?.paymentMethod === "card" || orderData?.paymentMethod === "apple") && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <CreditCard className="h-5 w-5" />
                <span className="text-sm">
                  {t("payment.secure_payment")}
                </span>
              </div>
            )}

            {status === "processing" && (
              <div className="flex justify-center gap-1">
                <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}