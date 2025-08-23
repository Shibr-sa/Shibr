"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/formatters"
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
        </CardHeader>
        <CardContent>
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
                            <TableCell><Skeleton className="h-10 w-10 rounded-lg" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                            <TableCell>
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
                                <span className="font-medium">{formatCurrency(product.price, language)}</span>
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
                          {/* Fill remaining rows with skeletons if less than 5 items */}
                          {paginatedProducts.length < itemsPerPage && Array.from({ length: itemsPerPage - paginatedProducts.length }).map((_, index) => (
                            <TableRow key={`filler-${index}`} className={`h-[72px] ${index < itemsPerPage - paginatedProducts.length - 1 ? 'border-b' : ''}`}>
                              <TableCell><Skeleton className="h-10 w-10 rounded-lg" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Skeleton className="h-8 w-8 rounded" />
                                  <Skeleton className="h-8 w-8 rounded" />
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </>
                      ) : (
                        // Empty state - show 5 empty rows with message in middle
                        Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={`empty-${index}`} className="h-[72px]">
                            {index === 2 ? (
                              <TableCell colSpan={8} className="text-center text-muted-foreground">
                                <div className="flex items-center justify-center gap-2 h-full">
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                  <span className="text-sm">
                                    {searchQuery 
                                      ? t("brand.no_matching_products")
                                      : t("brand.no_products_yet")
                                    }
                                  </span>
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