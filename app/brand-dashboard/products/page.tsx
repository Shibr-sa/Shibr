"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/formatters"
import { ProductDialog } from "@/components/dialogs/product-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, Plus, Upload, Edit, Trash2, ShoppingCart, Package, ChartLine, TrendingUp, TrendingDown, Banknote, ImageIcon, AlertCircle } from "lucide-react"
import { useLanguage } from "@/contexts/localization-context"
import { useBrandData } from "@/contexts/brand-data-context"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useCurrentUser } from "@/hooks/use-current-user"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import BrandProductsLoading from "./loading"

export default function BrandProductsPage() {
  const { t, language } = useLanguage()
  const { user, isLoading: userLoading } = useCurrentUser()
  const { isBrandDataComplete, isLoading: brandLoading } = useBrandData()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)
  const [currentPage, setCurrentPage] = useState(1)
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const itemsPerPage = 5

  // Get user ID from current user
  const userId = user?.id ? (user.id as Id<"users">) : null

  // Fetch products for the brand owner
  const products = useQuery(
    api.products.getUserProducts,
    userId ? {} : "skip"
  )

  // Fetch product statistics (using monthly period as default)
  const productStats = useQuery(
    api.products.getUserProductStats,
    userId ? { period: "monthly" as const } : "skip"
  )

  // Delete product mutation
  const deleteProduct = useMutation(api.products.deleteProduct)

  // Filter products based on debounced search
  const filteredProducts = products?.filter(product => {
    const matchesSearch = !debouncedSearchQuery || 
      product.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    return matchesSearch
  }) || []

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  // Loading state - true if we're waiting for products after userId is available
  const isLoading = !products && userId !== null
  
  // Check if search is in progress (user typed but debounce hasn't fired yet)
  const isSearching = searchQuery !== debouncedSearchQuery

  // Show full page skeleton while user is loading or products haven't been fetched yet
  if (userLoading || !products) {
    return <BrandProductsLoading />
  }

  return (
    <div className="w-full space-y-6">
      {/* Profile Completion Warning */}
      {!brandLoading && !isBrandDataComplete && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("dashboard.incomplete_profile_warning")}</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{t("dashboard.complete_profile_first")}</span>
            <Button
              variant="outline"
              size="sm"
              className="ms-4"
              onClick={() => router.push("/brand-dashboard/settings")}
            >
              {t("dashboard.complete_profile_now")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Section */}
      <div>
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{t("brand.dashboard.your_products_on_shelves")}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("brand.dashboard.manage_products_description")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 me-2" />
                {t("brand.dashboard.import_products_excel")}
              </Button>
              <Button 
                size="sm"
                onClick={() => {
                  setSelectedProduct(null)
                  setProductDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4 me-2" />
                {t("brand.dashboard.add_new_product")}
              </Button>
            </div>
          </div>
        </div>
        <div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Total Products Card */}
            <StatCard
              title={t("brand.dashboard.total_products_count")}
              value={productStats?.totalProducts ?? 0}
              icon={<Package className="h-5 w-5 text-primary" />}
            />

            {/* Sold Products Card */}
            <StatCard
              title={t("brand.dashboard.sold_products_count")}
              value={productStats?.totalSales ?? 0}
              icon={<ShoppingCart className="h-5 w-5 text-primary" />}
            />

            {/* Total Revenue Card */}
            <StatCard
              title={t("brand.dashboard.total_sales")}
              value={formatCurrency(productStats?.totalRevenue ?? 0, language)}
              icon={<Banknote className="h-5 w-5 text-primary" />}
            />
          </div>
        </div>
      </div>

      {/* Products Table Section */}
      <div className="w-full">
        <div className="mb-4">
          {/* Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 overflow-visible">
            <div className="relative flex-1 sm:flex-initial sm:w-80 max-w-full overflow-visible">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("brand.dashboard.search_products")}
                className="ps-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        {/* Table */}
        <div className="rounded-md border">
            <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 border-b">
                        <TableHead className="text-start h-12 font-medium w-[10%]">
                          {t("brand.dashboard.product_image")}
                        </TableHead>
                        <TableHead className="text-start h-12 font-medium w-[20%]">
                          {t("brand.dashboard.product_name")}
                        </TableHead>
                        <TableHead className="text-start h-12 font-medium w-[10%]">
                          {t("brand.products.product_sku")}
                        </TableHead>
                        <TableHead className="text-start h-12 font-medium w-[15%]">
                          {t("brand.products.category")}
                        </TableHead>
                        <TableHead className="text-start h-12 font-medium w-[8%]">
                          {t("brand.dashboard.price")}
                        </TableHead>
                        <TableHead className="text-start h-12 font-medium w-[8%]">
                          {t("brand.dashboard.quantity")}
                        </TableHead>
                        <TableHead className="text-start h-12 font-medium w-[10%]">
                          {t("brand.dashboard.sales_count")}
                        </TableHead>
                        <TableHead className="text-start h-12 font-medium w-[10%]">
                          {t("brand.dashboard.stores_count")}
                        </TableHead>
                        <TableHead className="text-start h-12 font-medium w-[9%]">
                          {t("brand.dashboard.actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading || isSearching ? (
                        // Loading state - show 5 skeleton rows
                        Array.from({ length: itemsPerPage }).map((_, index) => (
                          <TableRow key={`skeleton-${index}`} className="h-[72px]">
                            <TableCell className="py-3 w-[10%]"><Skeleton className="h-10 w-10 rounded-lg" /></TableCell>
                            <TableCell className="py-3 w-[20%]"><Skeleton className="h-4 w-[120px]" /></TableCell>
                            <TableCell className="py-3 w-[10%]"><Skeleton className="h-4 w-[60px]" /></TableCell>
                            <TableCell className="py-3 w-[15%]"><Skeleton className="h-4 w-[100px]" /></TableCell>
                            <TableCell className="py-3 w-[8%]"><Skeleton className="h-4 w-[50px]" /></TableCell>
                            <TableCell className="py-3 w-[8%]"><Skeleton className="h-4 w-[50px]" /></TableCell>
                            <TableCell className="py-3 w-[10%]"><Skeleton className="h-4 w-[60px]" /></TableCell>
                            <TableCell className="py-3 w-[10%]"><Skeleton className="h-4 w-[60px]" /></TableCell>
                            <TableCell className="py-3 w-[9%]">
                              <div className="flex gap-2">
                                <Skeleton className="h-8 w-8 rounded" />
                                <Skeleton className="h-8 w-8 rounded" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : paginatedProducts.length > 0 ? (
                        // Show paginated products
                        <>
                          {paginatedProducts.map((product, index) => (
                            <TableRow key={product._id} className={`h-[72px] ${index < paginatedProducts.length - 1 ? 'border-b' : ''}`}>
                              <TableCell className="py-3 w-[10%]">
                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                                  {product.imageUrl ? (
                                    <img 
                                      src={product.imageUrl} 
                                      alt={product.name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium py-3 w-[20%]">
                                {product.name}
                              </TableCell>
                              <TableCell className="text-muted-foreground py-3 w-[10%]">
                                {product.sku || '-'}
                              </TableCell>
                              <TableCell className="text-muted-foreground py-3 w-[15%]">
                                {product.category || '-'}
                              </TableCell>
                              <TableCell className="py-3 w-[8%]">
                                <span className="font-medium">{formatCurrency(product.price, language)}</span>
                              </TableCell>
                              <TableCell className="py-3 w-[8%]">{product.quantity}</TableCell>
                              <TableCell className="py-3 w-[10%]">{product.totalSales || 0}</TableCell>
                              <TableCell className="py-3 w-[10%]">{product.shelfCount || 0}</TableCell>
                              <TableCell className="py-3 w-[9%]">
                                <div className="flex gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => {
                                      setSelectedProduct(product)
                                      setProductDialogOpen(true)
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => {
                                      if (confirm(t("brand.dashboard.confirm_delete_product"))) {
                                        deleteProduct({ productId: product._id })
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {/* Fill remaining rows to always show 5 rows */}
                          {paginatedProducts.length < 5 && Array.from({ length: 5 - paginatedProducts.length }).map((_, index) => (
                            <TableRow key={`filler-${index}`} className="h-[72px]">
                              <TableCell className="py-3" colSpan={9}></TableCell>
                            </TableRow>
                          ))}
                        </>
                      ) : (
                        // Empty state - centered view with fixed height
                        <TableRow>
                          <TableCell colSpan={9} className="h-[360px] text-center">
                            <div className="flex h-full w-full items-center justify-center">
                              <div className="flex flex-col items-center gap-1 py-10">
                                <Package className="h-10 w-10 text-muted-foreground/40 mb-2" />
                                <h3 className="font-medium">
                                  {debouncedSearchQuery ? t("brand.no_matching_products") : t("brand.no_products_yet")}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {debouncedSearchQuery 
                                    ? t("brand.try_different_search")
                                    : t("brand.start_adding_products_description")}
                                </p>
                                {debouncedSearchQuery ? (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="mt-4"
                                    onClick={() => {
                                      setSearchQuery("")
                                      setCurrentPage(1)
                                    }}
                                  >
                                    {t("common.clear_search")}
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    className="mt-4"
                                    onClick={() => {
                                      setSelectedProduct(null)
                                      setProductDialogOpen(true)
                                    }}
                                  >
                                    <Plus className="h-4 w-4 me-2" />
                                    {t("brand.dashboard.add_new_product")}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
          </div>
            
            {/* Pagination Controls - Always visible */}
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={cn(
                        "cursor-pointer",
                        (currentPage === 1 || totalPages === 0) && "pointer-events-none opacity-50"
                      )}
                      aria-disabled={currentPage === 1 || totalPages === 0}
                    >
                      {t("common.previous")}
                    </PaginationPrevious>
                  </PaginationItem>
                  
                  {totalPages > 0 ? (
                    Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let page;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }
                      return page;
                    }).map(page => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))
                  ) : (
                    <PaginationItem>
                      <PaginationLink isActive className="pointer-events-none">
                        1
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={cn(
                        "cursor-pointer",
                        (currentPage === totalPages || totalPages <= 1) && "pointer-events-none opacity-50"
                      )}
                      aria-disabled={currentPage === totalPages || totalPages <= 1}
                    >
                      {t("common.next")}
                    </PaginationNext>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
      </div>
      
      {/* Product Dialog */}
      {userId && (
        <ProductDialog
          open={productDialogOpen}
          onOpenChange={setProductDialogOpen}
          ownerId={userId}
          product={selectedProduct}
          mode={selectedProduct ? "edit" : "create"}
        />
      )}
    </div>
  )
}