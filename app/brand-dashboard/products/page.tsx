"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ProductDialog } from "@/components/dialogs/product-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, Plus, Upload, Edit, Trash2, ShoppingCart, Package, ChartLine, TrendingUp, TrendingDown, Banknote, ImageIcon } from "lucide-react"
import { useLanguage } from "@/contexts/localization-context"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useCurrentUser } from "@/hooks/use-current-user"
import { cn } from "@/lib/utils"

export default function BrandProductsPage() {
  const { t, language } = useLanguage()
  const { user } = useCurrentUser()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly")
  const [currentPage, setCurrentPage] = useState(1)
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const itemsPerPage = 5

  // Get user ID from current user
  const userId = user?.id ? (user.id as Id<"users">) : null

  // Fetch products for the brand owner
  const products = useQuery(
    api.products.getOwnerProducts,
    userId ? { ownerId: userId } : "skip"
  )

  // Fetch product statistics
  const productStats = useQuery(
    api.products.getProductStats,
    userId ? { ownerId: userId, period: selectedPeriod } : "skip"
  )

  // Seed demo products mutation
  const seedDemoProducts = useMutation(api.products.seedDemoProducts)

  // Auto-seed demo products on first load if no products exist
  useEffect(() => {
    if (products && products.length === 0 && userId) {
      seedDemoProducts({ ownerId: userId })
    }
  }, [products, userId])

  // Filter products based on search
  const filteredProducts = products?.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  }) || []

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  // Loading state
  const isLoading = userId && !products

  return (
    <div className="w-full space-y-6 overflow-hidden">
      {/* Statistics Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-semibold">{t("brand.dashboard.your_products_on_shelves")}</CardTitle>
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
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Total Products Card */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t("brand.dashboard.total_products_count")}
                  </p>
                  <div className="text-3xl font-bold">
                    {productStats?.totalProducts ?? 0}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>

            {/* Sold Products Card */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t("brand.dashboard.sold_products_count")}
                  </p>
                  <div className="text-3xl font-bold">
                    {productStats?.totalSales ?? 0}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>

            {/* Total Revenue Card */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t("brand.dashboard.total_sales")}
                  </p>
                  <div className="text-3xl font-bold text-primary">
                    {language === "ar" 
                      ? `${productStats?.totalRevenue ?? 0} ${t("common.currency")}`
                      : `${t("common.currency")} ${productStats?.totalRevenue ?? 0}`
                    }
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Banknote className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table Section */}
      <Card className="w-full overflow-hidden">
        <CardHeader className="pb-4">
          {/* Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 sm:flex-initial sm:w-80 max-w-full">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("brand.dashboard.search_products")}
                className="ps-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-4 pb-4 sm:px-6 sm:pb-6">
          {/* Table */}
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-h-[420px]"> {/* Fixed height for 5 rows */}
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 border-b">
                        <TableHead className="text-start h-12">
                          {t("brand.dashboard.product_image")}
                        </TableHead>
                        <TableHead className="text-start h-12">
                          {t("brand.dashboard.product_name")}
                        </TableHead>
                        <TableHead className="text-start h-12">
                          {t("brand.dashboard.product_code")}
                        </TableHead>
                        <TableHead className="text-start h-12">
                          {t("brand.dashboard.price")}
                        </TableHead>
                        <TableHead className="text-start h-12">
                          {t("brand.dashboard.quantity")}
                        </TableHead>
                        <TableHead className="text-start h-12">
                          {t("brand.dashboard.sales_count")}
                        </TableHead>
                        <TableHead className="text-start h-12">
                          {t("brand.dashboard.stores_count")}
                        </TableHead>
                        <TableHead className="text-start h-12">
                          {t("brand.dashboard.actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        // Loading state - show 5 skeleton rows
                        Array.from({ length: itemsPerPage }).map((_, index) => (
                          <TableRow key={`skeleton-${index}`} className="h-[72px]">
                            <TableCell colSpan={8} className="text-center">
                              <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : paginatedProducts.length > 0 ? (
                        // Show paginated products
                        <>
                          {paginatedProducts.map((product, index) => (
                            <TableRow key={product._id} className={`h-[72px] ${index < paginatedProducts.length - 1 ? 'border-b' : ''}`}>
                              <TableCell className="py-3">
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
                              <TableCell className="font-medium py-3">
                                {product.name}
                              </TableCell>
                              <TableCell className="text-muted-foreground py-3">
                                {product.code}
                              </TableCell>
                              <TableCell className="py-3">
                                <span className="font-medium">{product.price}</span>
                                <span className="ms-1 text-muted-foreground">{t("common.currency")}</span>
                              </TableCell>
                              <TableCell className="py-3">{product.quantity}</TableCell>
                              <TableCell className="py-3">{product.totalSales}</TableCell>
                              <TableCell className="py-3">{product.shelfCount}</TableCell>
                              <TableCell className="py-3">
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
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {/* Fill remaining rows if less than 5 items */}
                          {paginatedProducts.length < itemsPerPage && Array.from({ length: itemsPerPage - paginatedProducts.length }).map((_, index) => (
                            <TableRow key={`filler-${index}`} className={`h-[72px] ${index < itemsPerPage - paginatedProducts.length - 1 ? 'border-b' : ''}`}>
                              <TableCell className="py-3">&nbsp;</TableCell>
                              <TableCell className="py-3">&nbsp;</TableCell>
                              <TableCell className="py-3">&nbsp;</TableCell>
                              <TableCell className="py-3">&nbsp;</TableCell>
                              <TableCell className="py-3">&nbsp;</TableCell>
                              <TableCell className="py-3">&nbsp;</TableCell>
                              <TableCell className="py-3">&nbsp;</TableCell>
                              <TableCell className="py-3">&nbsp;</TableCell>
                            </TableRow>
                          ))}
                        </>
                      ) : (
                        // Empty state - show 5 empty rows with message in middle
                        Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={`empty-${index}`} className="h-[72px]">
                            {index === 2 ? (
                              <TableCell colSpan={8} className="text-center text-muted-foreground">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <Package className="h-8 w-8 text-muted-foreground" />
                                  <span className="text-sm">
                                    {searchQuery 
                                      ? t("brand.no_matching_products")
                                      : t("brand.no_products_yet")
                                    }
                                  </span>
                                  {!searchQuery && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="mt-2"
                                    >
                                      <Plus className="h-4 w-4 me-2" />
                                      {t("brand.add_first_product")}
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            ) : (
                              <TableCell colSpan={8}>&nbsp;</TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
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
        </CardContent>
      </Card>
      
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