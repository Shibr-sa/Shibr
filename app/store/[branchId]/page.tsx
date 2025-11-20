"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useCart } from "@/contexts/cart-context"
import { useLanguage } from "@/contexts/localization-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import {
  ShoppingCart,
  Plus,
  Minus,
  Store,
  MapPin,
  Phone,
  Globe,
  Package,
  ArrowLeft,
  Building2,
  Search
} from "lucide-react"
import { formatCurrency } from "@/lib/formatters"
import { calculatePriceWithTax } from "@/lib/tax"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"

export default function StorePage() {
  const params = useParams()
  const router = useRouter()
  const { t, language, direction } = useLanguage()
  const { toast } = useToast()
  const cart = useCart()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
  const [sheetOpen, setSheetOpen] = useState(false)

  const branchId = params.branchId as string

  // Function to get initials from brand name
  const getInitials = (name: string) => {
    if (!name || name.trim().length === 0) {
      return "BR"
    }
    const parts = name.trim().split(" ")
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  // Fetch store data
  const store = useQuery(api.branches.getBranchStoreById, { branchId: branchId as any })
  const incrementStats = useMutation(api.branches.incrementBranchStoreStats)

  // Track page view and QR scan
  useEffect(() => {
    if (store?.branch?._id) {
      // Check if coming from QR scan (has referrer or specific query param)
      const isQrScan = document.referrer === "" || new URLSearchParams(window.location.search).has("qr")

      // Track appropriate event
      incrementStats({
        branchId: store.branch._id,
        statType: isQrScan ? "scan" : "view",
      }).catch(() => {
        // Silently ignore stats tracking errors
        // These are not critical to the user experience
      })

      // Set branch ID in cart
      cart.setBranchId(branchId)
    }
  }, [store?.branch?._id, branchId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddToCart = (product: any, customQuantity?: number) => {
    const quantityToAdd = customQuantity || 1
    // Calculate tax-inclusive price (product.price is base price from DB)
    const priceWithTax = calculatePriceWithTax(product.price)
    const result = cart.addItem({
      productId: product._id,
      name: product.name,
      price: priceWithTax, // Tax-inclusive price shown to customers
      maxQuantity: product.shelfQuantity,
      quantity: quantityToAdd,
    })

    if (result.success) {
      if (result.message && result.quantityAdded && result.quantityAdded < quantityToAdd) {
        // Partial add
        toast({
          title: t("store.added_to_cart"),
          description: result.message,
          variant: "default",
        })
      } else {
        // Full add
        toast({
          title: t("store.added_to_cart"),
          description: `${product.name} (${result.quantityAdded}x)`,
        })
      }
    } else {
      // Failed to add
      toast({
        title: t("store.cart_limit_reached"),
        description: result.message,
        variant: "destructive",
      })
    }
  }

  const handleProductClick = (product: any) => {
    const currentInCart = cart.getItemQuantity(product._id)
    const maxCanAdd = Math.max(0, product.shelfQuantity - currentInCart)

    setSelectedProduct({
      ...product,
      currentInCart,
      maxCanAdd
    })
    setQuantity(Math.min(1, maxCanAdd))
    setSheetOpen(true)
  }

  const handleAddFromSheet = () => {
    if (selectedProduct) {
      handleAddToCart(selectedProduct, quantity)
      setSheetOpen(false)
    }
  }

  const handleQuantityChange = (value: string) => {
    const num = parseInt(value)
    const maxCanAdd = selectedProduct?.maxCanAdd || 0
    if (!isNaN(num) && num >= 1 && num <= maxCanAdd) {
      setQuantity(num)
    }
  }

  const incrementQuantity = () => {
    const maxCanAdd = selectedProduct?.maxCanAdd || 0
    if (quantity < maxCanAdd) {
      setQuantity(quantity + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const handleViewCart = () => {
    router.push(`/store/${branchId}/cart`)
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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

  // Get unique brand names for header (use first brand if multiple)
  const brandName = store.storeName || "Store"
  // For brand logo, we could use the first product's brand, but for now just use initials
  const brandLogo = null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            {brandLogo ? (
              <Avatar className="h-10 w-10">
                <AvatarImage src={brandLogo} alt={brandName} />
                <AvatarFallback>{getInitials(brandName)}</AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-muted">
                  {getInitials(brandName)}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <h1 className="text-lg font-semibold">{brandName}</h1>
              {store.branchName && (
                <p className="text-xs text-muted-foreground">{store.branchName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleViewCart}
              className="relative"
            >
              <ShoppingCart className="h-4 w-4" />
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

      {/* Search Bar */}
      <div className="container py-6">
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="search"
            placeholder={t("brands.search_products_placeholder")}
            className="w-full ps-10 pe-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Products */}
      <div className="container pb-8 px-2 sm:px-4 md:px-6">
        <h2 className="text-2xl font-bold mb-6">{t("store.available_products")}</h2>

        {store.products && store.products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {store.products
              .filter((product: any) =>
                searchQuery === "" ||
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
              )
              .map((product: any) => (
                <Card
                  key={product._id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleProductClick(product)}
                >
                  {product.imageUrl && (
                    <div className="aspect-square relative bg-muted">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                        unoptimized
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
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-lg sm:text-xl font-bold">
                        {formatCurrency(calculatePriceWithTax(product.price), language)}
                      </p>
                      <Button
                        className="min-w-fit"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddToCart(product)
                        }}
                        disabled={!product.available || product.shelfQuantity === 0}
                      >
                        <ShoppingCart className="h-4 w-4 sm:me-2" />
                        <span className="hidden sm:inline">
                          {product.available && product.shelfQuantity > 0
                            ? t("store.add_to_cart")
                            : t("store.out_of_stock")}
                        </span>
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

      {/* Product Details Bottom Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-[75vh] sm:h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedProduct?.name}</SheetTitle>
          </SheetHeader>

          {selectedProduct && (
            <div className="space-y-4">
              {/* Product Image */}
              {selectedProduct.imageUrl && (
                <div className="aspect-square relative bg-muted rounded-lg overflow-hidden max-w-md mx-auto">
                  <Image
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              {/* Product Description */}
              {selectedProduct.description && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {selectedProduct.description}
                  </p>
                </div>
              )}

              {/* Price and Stock */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-2xl font-bold">
                    {formatCurrency(calculatePriceWithTax(selectedProduct.price), language)}
                  </p>
                  <Badge
                    variant={selectedProduct.shelfQuantity > 0 ? "secondary" : "destructive"}
                  >
                    {selectedProduct.shelfQuantity > 0
                      ? `${selectedProduct.shelfQuantity} ${t("store.available")}`
                      : t("store.out_of_stock")}
                  </Badge>
                </div>
                {selectedProduct.currentInCart > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {selectedProduct.currentInCart} {t("store.already_in_cart")}
                  </p>
                )}
              </div>

              {/* Quantity Selector */}
              {selectedProduct.maxCanAdd > 0 ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("store.quantity")}
                    <span className="text-muted-foreground">
                      ({t("store.max")} {selectedProduct.maxCanAdd})
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      className="w-20 text-center"
                      min="1"
                      max={selectedProduct.maxCanAdd}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={incrementQuantity}
                      disabled={quantity >= selectedProduct.maxCanAdd}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                selectedProduct.shelfQuantity > 0 && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-center text-muted-foreground">
                      {t("store.max_quantity_in_cart")}
                    </p>
                  </div>
                )
              )}

              {/* Actions - Sticky at bottom on mobile */}
              <div className="flex gap-2 pt-4 sticky bottom-0 bg-background pb-safe">
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={handleAddFromSheet}
                  disabled={!selectedProduct.available || selectedProduct.shelfQuantity === 0 || selectedProduct.maxCanAdd === 0}
                >
                  <ShoppingCart className="h-4 w-4 me-2" />
                  {t("store.add_to_cart")}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}