"use client"

import { useState, useMemo, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useLanguage } from "@/contexts/localization-context"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StatCard } from "@/components/ui/stat-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  User,
  Mail,
  Phone,
  Calendar,
  Package,
  DollarSign,
  ShoppingCart,
  Store,
  Globe,
  Hash,
  FileText,
  Ban,
  Trash2,
  Eye,
  Download,
  Search,
  CalendarDays,
} from "lucide-react"

export default function BrandDetailsPage() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const params = useParams()
  const brandId = params.id as string
  
  const itemsPerPage = 5
  
  const [activeTab, setActiveTab] = useState("payments")
  const [paymentPage, setPaymentPage] = useState(1)
  const [productPage, setProductPage] = useState(1)
  const [paymentSearch, setPaymentSearch] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("all") // all, completed, needs_collection, upcoming
  const [productSearch, setProductSearch] = useState("")
  const [hasInitialRentalsData, setHasInitialRentalsData] = useState(false)
  const [hasInitialProductsData, setHasInitialProductsData] = useState(false)
  
  // Debounced search values for server-side filtering
  const debouncedPaymentSearch = useDebouncedValue(paymentSearch, 300)
  const debouncedProductSearch = useDebouncedValue(productSearch, 300)
  
  // Check if search is in progress (user typed but debounce hasn't fired yet)
  const isPaymentSearching = paymentSearch !== debouncedPaymentSearch
  const isProductSearching = productSearch !== debouncedProductSearch
  
  // Fetch brand data from Convex
  const brandsResult = useQuery(api.admin.getBrands, {
    searchQuery: "",
    page: 1,
    limit: 100,
  })
  
  const brand = brandsResult?.items?.find((b: any) => b.id === brandId)
  
  // Fetch products currently displayed on shelves for this brand
  // Note: This shows products that are actively displayed on rented shelves,
  // not all products owned by the brand
  const products = useQuery(api.admin.getBrandProducts,
    brand?.id ? { 
      profileId: brand.id as Id<"userProfiles">,
      searchQuery: debouncedProductSearch,
    } : "skip"
  ) || []
  
  // Fetch rental requests for this brand
  const rentalsResult = useQuery(api.admin.getBrandRentals,
    brand?.id ? { 
      profileId: brand.id as Id<"userProfiles">,
      searchQuery: debouncedPaymentSearch,
      statusFilter: paymentFilter,
    } : "skip"
  )
  
  const rentals = rentalsResult || []
  
  // Track when we have initial rentals data
  useEffect(() => {
    if (rentalsResult !== undefined && !hasInitialRentalsData) {
      setHasInitialRentalsData(true)
    }
  }, [rentalsResult, hasInitialRentalsData])
  
  // Track when we have initial products data
  useEffect(() => {
    if (products !== undefined && !hasInitialProductsData) {
      setHasInitialProductsData(true)
    }
  }, [products, hasInitialProductsData])
  
  if (!brand) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ${t("common.currency")}`
  }

  const formatDate = (date: string) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("en-US")
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "suspended":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          title={t("brands.total_payments_due")}
          value={formatCurrency(brand.revenue || 0)}
          icon={<DollarSign className="h-6 w-6 text-primary" />}
        />
        <StatCard
          title={t("brands.rented_shelves_count")}
          value={brand.rentals || 0}
          icon={<Package className="h-6 w-6 text-primary" />}
        />
      </div>

      {/* Brand Info Card */}
      <Card className="overflow-hidden">
        <div className="bg-muted/50 px-6 py-3 border-b flex items-center justify-between">
          <h3 className="text-base font-semibold">
            {t("brands.brand_information")}
          </h3>
          <Badge variant={getStatusVariant(brand.status)}>
            {t(`brands.status.${brand.status}`)}
          </Badge>
        </div>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* First Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Store className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground font-normal">
                    {t("brands.brand_name")}
                  </Label>
                  <p className="text-sm font-medium">{brand.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground font-normal">
                    {t("brands.owner_name")}
                  </Label>
                  <p className="text-sm font-medium">{brand.ownerName || brand.email || "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground font-normal">
                    {t("brands.website")}
                  </Label>
                  <p className="text-sm font-medium">
                    {brand.website || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground font-normal">
                    {t("brands.join_date")}
                  </Label>
                  <p className="text-sm font-medium">{formatDate(brand.joinDate)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Hash className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground font-normal">
                    {t("brands.registration_number")}
                  </Label>
                  <p className="text-sm font-medium">
                    {brand.businessRegistration || "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground font-normal">
                    {t("brands.registration_document")}
                  </Label>
                  <div className="flex items-center gap-2">
                    {brand.businessRegistrationUrl ? (
                      <a 
                        href={brand.businessRegistrationUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary cursor-pointer hover:underline"
                      >
                        {t("common.download")}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info and Actions */}
          <Separator className="my-6" />
          <div className="flex items-center justify-between px-3">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                <span>{brand.email || "-"}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                <span>{brand.phoneNumber || "-"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Ban className="h-4 w-4 me-2" />
                {t("brands.suspend_account")}
              </Button>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 me-2" />
                {t("brands.delete_brand")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tables with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Top Row: Tabs, Search Bar, and Filters */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <TabsList className="grid w-fit grid-cols-2">
            <TabsTrigger value="payments">{t("brands.payment_collection_log")}</TabsTrigger>
            <TabsTrigger value="products">{t("brands.displayed_products")}</TabsTrigger>
          </TabsList>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 flex-1 justify-end">
            {/* Filter Toggles for Payment Tab */}
            {activeTab === "payments" && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={paymentFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPaymentFilter("all")}
                  className="h-9"
                >
                  {t("brands.filter_all")}
                </Button>
                <Button
                  variant={paymentFilter === "completed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPaymentFilter("completed")}
                  className="h-9"
                >
                  {t("brands.filter_completed")}
                </Button>
                <Button
                  variant={paymentFilter === "needs_collection" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPaymentFilter("needs_collection")}
                  className="h-9"
                >
                  {t("brands.filter_needs_collection")}
                </Button>
                <Button
                  variant={paymentFilter === "upcoming" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPaymentFilter("upcoming")}
                  className="h-9"
                >
                  {t("brands.filter_upcoming")}
                </Button>
              </div>
            )}
            
            {/* Search Bar - Changes based on active tab */}
            <div className="relative w-full md:w-96">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder={activeTab === "payments" ? t("brands.search_payments_placeholder") : t("brands.search_products_placeholder")}
                className="ps-9 h-10"
                value={activeTab === "payments" ? paymentSearch : productSearch}
                onChange={(e) => activeTab === "payments" ? setPaymentSearch(e.target.value) : setProductSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Payment Collection Log Tab */}
        <TabsContent value="payments" className="space-y-6">
          <div className="rounded-md border bg-card">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="h-12 text-start font-medium" style={{ width: '160px' }}>{t("common.date")}</TableHead>
                  <TableHead className="h-12 text-start font-medium" style={{ width: '140px' }}>{t("brands.store")}</TableHead>
                  <TableHead className="h-12 text-start font-medium" style={{ width: '120px' }}>{t("brands.amount")}</TableHead>
                  <TableHead className="h-12 text-start font-medium" style={{ width: '140px' }}>{t("brands.operation_type")}</TableHead>
                  <TableHead className="h-12 text-start font-medium" style={{ width: '100px' }}>{t("brands.status_column")}</TableHead>
                  <TableHead className="h-12 text-start font-medium" style={{ width: '60px' }}>{t("brands.options")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!hasInitialRentalsData || rentalsResult === undefined || isPaymentSearching ? (
                  // Loading state - show skeletons
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`loading-payment-${index}`} className="h-[72px]">
                      <TableCell className="py-3" style={{ width: '160px' }}>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="py-3" style={{ width: '140px' }}>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell className="py-3" style={{ width: '120px' }}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="py-3" style={{ width: '140px' }}>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell className="py-3" style={{ width: '100px' }}>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </TableCell>
                      <TableCell className="py-3" style={{ width: '60px' }}>
                        <Skeleton className="h-8 w-8 rounded" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rentals.length === 0 ? (
                  // Empty state - centered view with fixed height
                  <TableRow>
                    <TableCell colSpan={6} className="h-[360px] text-center">
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="flex flex-col items-center gap-1 py-10">
                          <DollarSign className="h-10 w-10 text-muted-foreground/40 mb-2" />
                          <h3 className="font-medium">
                            {paymentSearch ? t("brands.no_results") : t("brands.no_payments")}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {paymentSearch ? t("brands.try_different_search") : t("brands.payments_will_appear_here")}
                          </p>
                          {paymentSearch && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="mt-4"
                              onClick={() => setPaymentSearch("")}
                            >
                              {t("brands.clear_search")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  // Show data rows, padded to 5 rows minimum
                  [...rentals.slice((paymentPage - 1) * itemsPerPage, paymentPage * itemsPerPage), ...Array(Math.max(0, 5 - Math.min(rentals.slice((paymentPage - 1) * itemsPerPage, paymentPage * itemsPerPage).length, itemsPerPage)))].map((payment: any, index: number) => (
                    payment ? (
                      <TableRow key={payment.id} className="h-[72px]">
                        <TableCell className="py-3" style={{ width: '160px' }}>{formatDate(payment.createdAt)}</TableCell>
                        <TableCell className="py-3" style={{ width: '140px' }}>{payment.storeName || "-"}</TableCell>
                        <TableCell className="py-3" style={{ width: '120px' }}>{formatCurrency(payment.payment || 0)}</TableCell>
                        <TableCell className="py-3" style={{ width: '140px' }}>{t("brands.payment_transfer")}</TableCell>
                        <TableCell className="py-3" style={{ width: '100px' }}>
                          <Badge variant={payment.status === "payment_pending" ? "secondary" : payment.status === "active" ? "default" : "secondary"}>
                            {payment.status === "active" ? t("brands.payment_completed") : t("brands.payment_pending")}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3" style={{ width: '60px' }}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => {
                              // Generate and download receipt
                              const receiptContent = `
                                PAYMENT RECEIPT\n
                                ====================\n
                                Invoice #: INV-${String((paymentPage - 1) * itemsPerPage + index + 1).padStart(5, '0')}\n
                                Date: ${formatDate(payment.createdAt)}\n
                                Store: ${payment.storeName || "-"}\n
                                Amount: ${formatCurrency(payment.payment || 0)}\n
                                Payment Method: ${t("brands.payment_transfer")}\n
                                Status: ${payment.status === "active" ? t("brands.payment_completed") : t("brands.payment_pending")}\n
                                ====================\n
                              `;
                              const blob = new Blob([receiptContent], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `receipt-INV-${String((paymentPage - 1) * itemsPerPage + index + 1).padStart(5, '0')}.txt`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            title={t("brands.download_invoice")}
                          >
                            <Download className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={`empty-${index}`} className="h-[72px]">
                        <TableCell className="py-3">&nbsp;</TableCell>
                        <TableCell className="py-3">&nbsp;</TableCell>
                        <TableCell className="py-3">&nbsp;</TableCell>
                        <TableCell className="py-3">&nbsp;</TableCell>
                        <TableCell className="py-3">&nbsp;</TableCell>
                        <TableCell className="py-3">&nbsp;</TableCell>
                      </TableRow>
                    )
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination - Always visible */}
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPaymentPage(Math.max(1, paymentPage - 1))}
                  className={paymentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: Math.max(1, Math.ceil(rentals.length / itemsPerPage)) }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    onClick={() => setPaymentPage(i + 1)}
                    isActive={paymentPage === i + 1}
                    className="cursor-pointer"
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setPaymentPage(Math.min(Math.max(1, Math.ceil(rentals.length / itemsPerPage)), paymentPage + 1))}
                  className={paymentPage === Math.max(1, Math.ceil(rentals.length / itemsPerPage)) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </TabsContent>

        {/* Displayed Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="rounded-md border bg-card">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="h-12 text-start font-medium" style={{ width: '80px' }}>{t("brands.product_image")}</TableHead>
                  <TableHead className="h-12 text-start font-medium" style={{ width: '200px' }}>{t("brands.product_name")}</TableHead>
                  <TableHead className="h-12 text-start font-medium" style={{ width: '140px' }}>{t("brands.product_code")}</TableHead>
                  <TableHead className="h-12 text-start font-medium" style={{ width: '120px' }}>{t("brands.price")}</TableHead>
                  <TableHead className="h-12 text-start font-medium" style={{ width: '80px' }}>{t("brands.quantity")}</TableHead>
                  <TableHead className="h-12 text-start font-medium" style={{ width: '80px' }}>{t("brands.sales_count")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!hasInitialProductsData || products === undefined || isProductSearching ? (
                  // Loading state - show skeletons
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`loading-product-${index}`} className="h-[72px]">
                      <TableCell className="py-3" style={{ width: '80px' }}>
                        <Skeleton className="h-10 w-10 rounded-lg" />
                      </TableCell>
                      <TableCell className="py-3" style={{ width: '200px' }}>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell className="py-3" style={{ width: '140px' }}>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell className="py-3" style={{ width: '120px' }}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="py-3" style={{ width: '80px' }}>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell className="py-3" style={{ width: '80px' }}>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : products.length === 0 ? (
                  // Empty state - centered view with fixed height
                  <TableRow>
                    <TableCell colSpan={6} className="h-[360px] text-center">
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="flex flex-col items-center gap-1 py-10">
                          <Package className="h-10 w-10 text-muted-foreground/40 mb-2" />
                          <h3 className="font-medium">
                            {productSearch ? t("brands.no_results") : t("brands.no_products")}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {productSearch ? t("brands.try_different_search") : t("brands.products_will_appear_here")}
                          </p>
                          {productSearch && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="mt-4"
                              onClick={() => setProductSearch("")}
                            >
                              {t("brands.clear_search")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  // Show data rows, padded to 5 rows minimum
                  [...products.slice((productPage - 1) * itemsPerPage, productPage * itemsPerPage), ...Array(Math.max(0, 5 - Math.min(products.slice((productPage - 1) * itemsPerPage, productPage * itemsPerPage).length, itemsPerPage)))].map((product: any, index: number) => (
                    product ? (
                      <TableRow key={product.id} className="h-[72px]">
                        <TableCell className="py-3" style={{ width: '80px' }}>
                          <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden">
                            {product.imageUrl ? (
                              <img 
                                src={product.imageUrl} 
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 font-medium" style={{ width: '200px' }}>{product.name}</TableCell>
                        <TableCell className="py-3" style={{ width: '140px' }}>{product.sku || `PRD-${product.id?.slice(-6) || '000000'}`}</TableCell>
                        <TableCell className="py-3" style={{ width: '120px' }}>{formatCurrency(product.price || 0)}</TableCell>
                        <TableCell className="py-3" style={{ width: '80px' }}>{product.quantity || 0}</TableCell>
                        <TableCell className="py-3" style={{ width: '80px' }}>{product.salesCount || 0}</TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={`empty-prod-${index}`} className="h-[72px]">
                        <TableCell className="py-3">&nbsp;</TableCell>
                        <TableCell className="py-3">&nbsp;</TableCell>
                        <TableCell className="py-3">&nbsp;</TableCell>
                        <TableCell className="py-3">&nbsp;</TableCell>
                        <TableCell className="py-3">&nbsp;</TableCell>
                        <TableCell className="py-3">&nbsp;</TableCell>
                      </TableRow>
                    )
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination - Always visible */}
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setProductPage(Math.max(1, productPage - 1))}
                  className={productPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: Math.max(1, Math.ceil(products.length / itemsPerPage)) }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    onClick={() => setProductPage(i + 1)}
                    isActive={productPage === i + 1}
                    className="cursor-pointer"
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setProductPage(Math.min(Math.max(1, Math.ceil(products.length / itemsPerPage)), productPage + 1))}
                  className={productPage === Math.max(1, Math.ceil(products.length / itemsPerPage)) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </TabsContent>
      </Tabs>
    </div>
  )
}