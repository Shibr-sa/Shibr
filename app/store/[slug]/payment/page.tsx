"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/localization-context"
import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/formatters"
import {
  CreditCard,
  Smartphone,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Phone,
  Store
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
  timestamp: number
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const cart = useCart()
  const slug = params.slug as string

  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"card" | "apple">("card")
  const [isProcessing, setIsProcessing] = useState(false)

  // Card details (for simulation)
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({})

  useEffect(() => {
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
      console.error("Invalid order data:", error)
      router.push(`/store/${slug}/cart`)
    }
  }, [slug, router, t, toast])

  const validateCardDetails = () => {
    const errors: Record<string, string> = {}

    if (!cardNumber || cardNumber.length !== 16) {
      errors.cardNumber = t("payment.invalid_card_number")
    }

    if (!cardName || cardName.trim().length < 3) {
      errors.cardName = t("payment.invalid_card_name")
    }

    if (!expiryDate || !expiryDate.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
      errors.expiryDate = t("payment.invalid_expiry")
    }

    if (!cvv || cvv.length !== 3) {
      errors.cvv = t("payment.invalid_cvv")
    }

    setCardErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handlePayment = async () => {
    if (paymentMethod === "card" && !validateCardDetails()) {
      return
    }

    setIsProcessing(true)

    // Store payment method in order data
    const updatedOrderData = {
      ...orderData!,
      paymentMethod
    }
    sessionStorage.setItem("pendingOrder", JSON.stringify(updatedOrderData))

    // Redirect to processing page
    router.push(`/store/${slug}/payment/processing`)
  }

  const formatCardNumber = (value: string) => {
    const cleanValue = value.replace(/\s/g, "")
    const groups = cleanValue.match(/.{1,4}/g) || []
    return groups.join(" ")
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").substring(0, 16)
    setCardNumber(value)
    setCardErrors(prev => ({ ...prev, cardNumber: "" }))
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")
    if (value.length >= 3) {
      value = value.substring(0, 2) + "/" + value.substring(2, 4)
    }
    setExpiryDate(value)
    setCardErrors(prev => ({ ...prev, expiryDate: "" }))
  }

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").substring(0, 3)
    setCvv(value)
    setCardErrors(prev => ({ ...prev, cvv: "" }))
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

            {/* Payment Method Selection */}
            <Card>
              <CardHeader>
                <CardTitle>{t("payment.payment_method")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "card" | "apple")}>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                      <CreditCard className="h-5 w-5" />
                      {t("payment.pay_with_card")}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="apple" id="apple" />
                    <Label htmlFor="apple" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Smartphone className="h-5 w-5" />
                      {t("payment.pay_with_apple")}
                    </Label>
                  </div>
                </RadioGroup>

                {/* Card Details Form */}
                {paymentMethod === "card" && (
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label htmlFor="cardNumber">{t("payment.card_number")}</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={formatCardNumber(cardNumber)}
                        onChange={handleCardNumberChange}
                        className={cardErrors.cardNumber ? "border-destructive" : ""}
                        dir="ltr"
                      />
                      {cardErrors.cardNumber && (
                        <p className="text-sm text-destructive mt-1">{cardErrors.cardNumber}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="cardName">{t("payment.cardholder_name")}</Label>
                      <Input
                        id="cardName"
                        placeholder="John Doe"
                        value={cardName}
                        onChange={(e) => {
                          setCardName(e.target.value)
                          setCardErrors(prev => ({ ...prev, cardName: "" }))
                        }}
                        className={cardErrors.cardName ? "border-destructive" : ""}
                      />
                      {cardErrors.cardName && (
                        <p className="text-sm text-destructive mt-1">{cardErrors.cardName}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiry">{t("payment.expiry_date")}</Label>
                        <Input
                          id="expiry"
                          placeholder="MM/YY"
                          value={expiryDate}
                          onChange={handleExpiryChange}
                          className={cardErrors.expiryDate ? "border-destructive" : ""}
                          dir="ltr"
                        />
                        {cardErrors.expiryDate && (
                          <p className="text-sm text-destructive mt-1">{cardErrors.expiryDate}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="cvv">{t("payment.cvv")}</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          value={cvv}
                          onChange={handleCvvChange}
                          className={cardErrors.cvv ? "border-destructive" : ""}
                          dir="ltr"
                        />
                        {cardErrors.cvv && (
                          <p className="text-sm text-destructive mt-1">{cardErrors.cvv}</p>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {t("payment.test_mode_notice")}
                      </p>
                    </div>
                  </div>
                )}

                {/* Apple Pay Notice */}
                {paymentMethod === "apple" && (
                  <div className="space-y-4 pt-4">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <div className="mb-3">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-xl">
                          <Smartphone className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <p className="text-sm mb-3">
                        {t("payment.apple_pay_notice")}
                      </p>
                      <Button
                        type="button"
                        className="bg-black hover:bg-gray-800 text-white"
                        onClick={() => {
                          // Apple Pay will be initiated when clicking main payment button
                          toast({
                            title: t("payment.apple_pay_ready"),
                            description: t("payment.click_pay_to_continue"),
                          })
                        }}
                      >
                        <Smartphone className="h-4 w-4 me-2" />
                        {t("payment.setup_apple_pay")}
                      </Button>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {t("payment.apple_pay_test_mode")}
                      </p>
                    </div>
                  </div>
                )}
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

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      {paymentMethod === "apple" ? t("payment.pay_with_apple_pay") : t("payment.pay_now")}
                      <ArrowRight className="h-4 w-4 ms-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}