"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useLanguage } from "@/contexts/localization-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/formatters"
import {
  CheckCircle2,
  Package,
  Phone,
  Building2,
  Calendar,
  CreditCard,
  Smartphone,
  ShoppingBag,
  Receipt
} from "lucide-react"

export default function OrderConfirmationPage() {
  const params = useParams()
  const router = useRouter()
  const { t, language } = useLanguage()

  const slug = params.slug as string
  const orderId = params.orderId as Id<"customerOrders">

  // Fetch order details
  const order = useQuery(api.customerOrders.getOrderById, { orderId })

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  // Get payment method icon
  const getPaymentIcon = () => {
    if (!order) return null
    if (order.paymentMethod === "card") return <CreditCard className="h-5 w-5" />
    if (order.paymentMethod === "apple") return <Smartphone className="h-5 w-5" />
    return <CreditCard className="h-5 w-5" />
  }

  // Get payment method label
  const getPaymentLabel = () => {
    if (!order) return ""
    if (order.paymentMethod === "card") return t("payment.card")
    if (order.paymentMethod === "apple") return t("payment.apple_pay")
    return t("payment.card")
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">{t("order.thank_you")}</h1>
        </div>

        {/* Order Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              {t("order.order_details")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Order Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("order.order_number")}</p>
                  <p className="font-semibold">{order.orderNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("order.order_date")}</p>
                  <p className="font-semibold text-sm">{formatDate(order.orderedAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("order.contact_phone")}</p>
                  <p className="font-semibold" dir="ltr">{order.customerPhone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {getPaymentIcon()}
                <div>
                  <p className="text-sm text-muted-foreground">{t("order.payment_method")}</p>
                  <p className="font-semibold">{getPaymentLabel()}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Brand Info */}
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t("order.brand")}</p>
                <p className="font-semibold">{order.brandName}</p>
              </div>
            </div>

            <Separator />

            {/* Items List */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                {t("order.items")}
              </h3>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between py-2">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.price, language)} x {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(item.subtotal, language)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Price Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("order.subtotal")}</span>
                <span>{formatCurrency(order.subtotal, language)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("order.tax")} (15%)</span>
                <span>{formatCurrency(order.subtotal * 0.15, language)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>{t("order.total")}</span>
                <span>{formatCurrency(order.total, language)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <Button
          variant="default"
          className="w-full sm:w-auto"
          onClick={() => router.push(`/store/${slug}`)}
        >
          <ShoppingBag className="h-4 w-4 me-2" />
          {t("order.continue_shopping")}
        </Button>
      </div>
    </div>
  )
}