"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { CartProvider, useCart } from "@/contexts/cart-context"
import { useLanguage } from "@/contexts/localization-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import {
  ShoppingCart,
  Plus,
  Minus,
  Store,
  MapPin,
  Phone,
  Globe,
  Package,
  ArrowLeft
} from "lucide-react"
import { formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"

function StoreContent() {
  const params = useParams()
  const router = useRouter()
  const { t, language, direction } = useLanguage()
  const { toast } = useToast()
  const cart = useCart()
  const [sessionId] = useState(() => {
    // Generate or retrieve session ID for analytics
    if (typeof window !== "undefined") {
      const existingId = sessionStorage.getItem("storeSessionId")
      if (existingId) return existingId
      const newId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`
      sessionStorage.setItem("storeSessionId", newId)
      return newId
    }
    return `session-${Date.now()}-${Math.random().toString(36).substring(7)}`
  })

  const slug = params.slug as string

  // Fetch store data
  const store = useQuery(api.shelfStores.getShelfStoreBySlug, { slug })
  const trackAnalytics = useMutation(api.shelfStores.trackAnalytics)

  // Track page view and QR scan
  useEffect(() => {
    if (store?._id) {
      // Check if coming from QR scan (has referrer or specific query param)
      const isQrScan = document.referrer === "" || new URLSearchParams(window.location.search).has("qr")

      // Track appropriate event
      trackAnalytics({
        shelfStoreId: store._id,
        eventType: isQrScan ? "qr_scan" : "page_view",
        sessionId,
        userAgent: navigator.userAgent,
        referrer: document.referrer || undefined,
      }).catch(console.error)

      // Set store slug in cart
      cart.setStoreSlug(slug)
    }
  }, [store?._id, sessionId, slug])

  const handleAddToCart = (product: any) => {
    cart.addItem({
      productId: product._id,
      name: product.name,
      price: product.price,
      maxQuantity: product.shelfQuantity,
    })

    // Track add to cart event
    if (store?._id) {
      trackAnalytics({
        shelfStoreId: store._id,
        eventType: "add_to_cart",
        sessionId,
        productId: product._id,
      }).catch(console.error)
    }

    toast({
      title: t("store.added_to_cart"),
      description: product.name,
    })
  }

  const handleViewCart = () => {
    router.push(`/store/${slug}/cart`)
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!store.isActive) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Store className="h-12 w-12 text-muted-foreground mx-auto" />
              <h2 className="text-2xl font-bold">{t("store.store_closed")}</h2>
              <p className="text-muted-foreground">
                {t("store.store_closed_description")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6" />
            <div>
              <h1 className="text-lg font-semibold">{store.storeName}</h1>
              <p className="text-xs text-muted-foreground">{store.brandName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewCart}
              className="relative"
            >
              <ShoppingCart className="h-4 w-4 me-2" />
              {t("store.cart")}
              {cart.getTotalItems() > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -end-2 h-5 w-5 p-0 flex items-center justify-center"
                >
                  {cart.getTotalItems()}
                </Badge>
              )}
            </Button>
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Store Info */}
      <div className="container py-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{store.shelf?.shelfName}</CardTitle>
                <CardDescription className="mt-2">
                  {store.shelf?.description || t("store.welcome_message")}
                </CardDescription>
              </div>
              <Badge variant="outline">
                <MapPin className="h-3 w-3 me-1" />
                {store.shelf?.city}
              </Badge>
            </div>
          </CardHeader>
          {store.shelf?.location?.address && (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 inline me-1" />
                {store.shelf.location.address}
              </p>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Products */}
      <div className="container pb-8">
        <h2 className="text-2xl font-bold mb-6">{t("store.available_products")}</h2>

        {store.products && store.products.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {store.products.map((product: any) => (
              <Card key={product._id} className="overflow-hidden">
                {product.imageUrl && (
                  <div className="aspect-square relative bg-muted">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">
                    {product.name}
                  </CardTitle>
                  <CardDescription className="text-sm mt-2 line-clamp-2 min-h-[2.5rem]">
                    {product.description || "\u00A0"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-2xl font-bold">
                        {formatCurrency(product.price, language)}
                      </p>
                      <Badge
                        variant={product.shelfQuantity > 0 ? "outline" : "destructive"}
                      >
                        {product.shelfQuantity > 0
                          ? `${product.shelfQuantity} ${t("store.available")}`
                          : t("store.out_of_stock")}
                      </Badge>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => handleAddToCart(product)}
                      disabled={!product.available || product.shelfQuantity === 0}
                    >
                      <ShoppingCart className="h-4 w-4 me-2" />
                      {product.available && product.shelfQuantity > 0
                        ? t("store.add_to_cart")
                        : t("store.out_of_stock")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground text-center">
                {t("store.no_products")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Floating Cart Button (Mobile) */}
      {cart.getTotalItems() > 0 && (
        <div className="fixed bottom-4 end-4 md:hidden">
          <Button
            size="lg"
            className="rounded-full shadow-lg"
            onClick={handleViewCart}
          >
            <ShoppingCart className="h-5 w-5 me-2" />
            {cart.getTotalItems()}
          </Button>
        </div>
      )}
    </div>
  )
}

export default function StorePage() {
  return (
    <CartProvider>
      <StoreContent />
    </CartProvider>
  )
}