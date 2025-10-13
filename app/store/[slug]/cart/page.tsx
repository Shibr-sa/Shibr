"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useCart } from "@/contexts/cart-context"
import { useLanguage } from "@/contexts/localization-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/formatters"
import {
  ShoppingCart,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft
} from "lucide-react"

export default function CartPage() {
  const params = useParams()
  const router = useRouter()
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const cart = useCart()

  const slug = params.slug as string

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [nameError, setNameError] = useState("")
  const [phoneError, setPhoneError] = useState("")

  // Fetch store data to get current stock levels
  const store = useQuery(api.shelfStores.getShelfStoreBySlug, { slug })

  // Get product with current stock
  const getProductStock = (productId: string) => {
    if (!store?.products) return 0
    const product = store.products.find((p: any) => p._id === productId)
    return product?.shelfQuantity || 0
  }

  const handleQuantityChange = (productId: any, newQuantity: number) => {
    // Remove item if quantity is 0 or less
    if (newQuantity <= 0) {
      cart.removeItem(productId)
      return
    }

    const stock = getProductStock(productId)
    if (newQuantity > stock) {
      toast({
        title: t("store.stock_limit"),
        description: `${t("store.only")} ${stock} ${t("store.available")}`,
        variant: "destructive",
      })
      return
    }
    cart.updateQuantity(productId, newQuantity)
  }

  const validatePhoneNumber = (phone: string) => {
    const saudiPhoneRegex = /^05[0-9]{8}$/
    return saudiPhoneRegex.test(phone)
  }

  const handlePhoneSubmit = () => {
    let hasError = false

    if (!customerName.trim()) {
      setNameError(t("store.name_required"))
      hasError = true
    } else {
      setNameError("")
    }

    if (!customerPhone) {
      setPhoneError(t("store.phone_required"))
      hasError = true
    } else if (!validatePhoneNumber(customerPhone)) {
      setPhoneError(t("store.invalid_phone_format"))
      hasError = true
    } else {
      setPhoneError("")
    }

    if (hasError) return

    handleCheckoutWithPhone()
  }

  const handleCheckout = () => {
    setPhoneDialogOpen(true)
  }

  const handleCheckoutWithPhone = async () => {
    if (!store?._id) return

    setIsSubmitting(true)

    try {
      // Prepare order data for payment page
      const orderData = {
        shelfStoreId: store._id,
        storeName: store.storeName,
        customerName: customerName,
        customerPhone: customerPhone,
        items: cart.items.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        subtotal: cart.getTotalPrice(),
        tax: cart.getTotalPrice() * 0.15,
        total: cart.getTotalPrice() * 1.15,
        timestamp: Date.now()
      }

      // Store order data in sessionStorage for payment page
      sessionStorage.setItem("pendingOrder", JSON.stringify(orderData))

      // Close dialog and redirect to payment page
      setPhoneDialogOpen(false)
      router.push(`/store/${slug}/payment`)
    } catch (error: any) {
      toast({
        title: t("store.order_failed"),
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="py-16">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8 pb-24 lg:pb-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push(`/store/${slug}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 me-2" />
            {t("store.continue_shopping")}
          </Button>
        </div>

        {cart.items.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl text-muted-foreground">{t("store.empty_cart")}</p>
                <Button
                  className="mt-4"
                  onClick={() => router.push(`/store/${slug}`)}
                >
                  {t("store.continue_shopping")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
            <div className="w-full lg:col-span-2 space-y-4 order-1 lg:order-2">
              {/* Cart Items */}
              {cart.items.map(item => {
                const stock = getProductStock(item.productId)
                return (
                  <Card key={item.productId}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(item.price, language)} {t("store.each")}
                          </p>
                          {stock < item.quantity && (
                            <p className="text-sm text-destructive">
                              {t("store.only")} {stock} {t("store.available")}
                            </p>
                          )}
                        </div>

                        {/* Mobile: Controls and Price */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between sm:justify-start gap-2">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 sm:h-10 sm:w-10"
                                onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value) || 1)}
                                className="w-14 sm:w-16 text-center"
                                min="1"
                                max={stock}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 sm:h-10 sm:w-10"
                                onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                disabled={item.quantity >= stock}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Price on mobile */}
                            <div className="sm:hidden">
                              <p className="font-semibold">
                                {formatCurrency(item.price * item.quantity, language)}
                              </p>
                            </div>
                          </div>

                          {/* Price on desktop */}
                          <div className="hidden sm:block sm:ms-3">
                            <p className="font-semibold">
                              {formatCurrency(item.price * item.quantity, language)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Order Summary - Hidden on mobile, visible on desktop */}
            <div className="hidden lg:block order-2 lg:order-1">
              <Card className="lg:sticky lg:top-4">
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("store.products")}</span>
                      <span>{formatCurrency(cart.getTotalPrice(), language)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("store.tax")} (15%)</span>
                      <span>{formatCurrency(cart.getTotalPrice() * 0.15, language)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>{t("store.total")}</span>
                      <span>{formatCurrency(cart.getTotalPrice() * 1.15, language)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={isSubmitting || cart.items.length === 0}
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        {t("store.checkout")}
                        <ArrowRight className="h-4 w-4 ms-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Mobile Sticky Checkout Bar */}
        {cart.items.length > 0 && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-10 shadow-lg">
            <div className="container mx-auto space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("store.products")}</span>
                  <span>{formatCurrency(cart.getTotalPrice(), language)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("store.tax")} (15%)</span>
                  <span>{formatCurrency(cart.getTotalPrice() * 0.15, language)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">{t("store.total")}</span>
                  <span className="font-bold text-lg">{formatCurrency(cart.getTotalPrice() * 1.15, language)}</span>
                </div>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={isSubmitting || cart.items.length === 0}
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    {t("store.checkout")}
                    <ArrowRight className="h-4 w-4 ms-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Customer Information Dialog */}
        <Dialog open={phoneDialogOpen} onOpenChange={setPhoneDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("store.enter_phone_title")}</DialogTitle>
              <DialogDescription>
                {t("store.enter_phone_description")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("store.name_label")}</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t("store.name_placeholder")}
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value)
                    setNameError("")
                  }}
                  className={nameError ? "border-destructive" : ""}
                />
                {nameError && (
                  <p className="text-sm text-destructive">{nameError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("store.phone_label")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="05XXXXXXXX"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value)
                    setPhoneError("")
                  }}
                  className={phoneError ? "border-destructive" : ""}
                  dir="ltr"
                />
                {phoneError && (
                  <p className="text-sm text-destructive">{phoneError}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPhoneDialogOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handlePhoneSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  t("store.proceed_checkout")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}