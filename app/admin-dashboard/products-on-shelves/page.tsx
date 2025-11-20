"use client"

import { useState, useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useLanguage } from "@/contexts/localization-context"
import { formatDate } from "@/lib/formatters"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Package,
  Download,
  Filter,
  X,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Id } from "@/convex/_generated/dataModel"

export default function ProductsOnShelvesPage() {
  const { t, language, direction } = useLanguage()

  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStoreId, setSelectedStoreId] = useState<Id<"storeProfiles"> | undefined>()
  const [selectedBrandId, setSelectedBrandId] = useState<Id<"brandProfiles"> | undefined>()
  const [selectedBranchId, setSelectedBranchId] = useState<Id<"branches"> | undefined>()
  const [expiringDays, setExpiringDays] = useState<string>("all")

  // Debounced search
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)

  // Calculate expiry timestamp filter
  const expiringBefore = useMemo(() => {
    if (expiringDays === "all") return undefined
    const days = parseInt(expiringDays)
    return Date.now() + (days * 24 * 60 * 60 * 1000)
  }, [expiringDays])

  // Fetch all products (no backend filters for now - we'll filter client-side)
  const productsData = useQuery(api.admin.products.getActiveProductsOnShelves, {})

  // Extract unique filter options from products data
  const filterOptions = useMemo(() => {
    if (!productsData?.products) return { stores: [], brands: [], branches: [] }

    const stores = new Map()
    const brands = new Map()
    const branches = new Map()

    productsData.products.forEach(p => {
      if (p.storeId && p.storeName) {
        stores.set(p.storeId, { id: p.storeId, name: p.storeName, nameAr: p.storeNameAr })
      }
      if (p.brandId && p.brandName) {
        brands.set(p.brandId, { id: p.brandId, name: p.brandName, nameAr: p.brandNameAr })
      }
      if (p.branchId && p.branchName) {
        branches.set(p.branchId, { id: p.branchId, name: p.branchName, nameAr: p.branchNameAr })
      }
    })

    return {
      stores: Array.from(stores.values()),
      brands: Array.from(brands.values()),
      branches: Array.from(branches.values()),
    }
  }, [productsData])

  // Client-side filtering
  const filteredProducts = useMemo(() => {
    if (!productsData?.products) return []

    return productsData.products.filter(product => {
      // Search filter
      const searchLower = debouncedSearchQuery.toLowerCase()
      const matchesSearch = !searchLower ||
        product.productName?.toLowerCase().includes(searchLower) ||
        product.productNameAr?.includes(searchLower) ||
        product.brandName?.toLowerCase().includes(searchLower) ||
        product.storeName?.toLowerCase().includes(searchLower)

      // Store filter
      const matchesStore = !selectedStoreId || product.storeId === selectedStoreId

      // Brand filter
      const matchesBrand = !selectedBrandId || product.brandId === selectedBrandId

      // Branch filter
      const matchesBranch = !selectedBranchId || product.branchId === selectedBranchId

      // Expiry filter
      const matchesExpiry = expiringDays === "all" ||
        (expiringBefore && product.rentalEndDate <= expiringBefore)

      return matchesSearch && matchesStore && matchesBrand && matchesBranch && matchesExpiry
    })
  }, [productsData, debouncedSearchQuery, selectedStoreId, selectedBrandId, selectedBranchId, expiringDays, expiringBefore])

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("")
    setSelectedStoreId(undefined)
    setSelectedBrandId(undefined)
    setSelectedBranchId(undefined)
    setExpiringDays("all")
  }

  const hasActiveFilters = searchQuery || selectedStoreId || selectedBrandId || selectedBranchId || expiringDays !== "all"

  // Export to CSV
  const exportToCSV = () => {
    if (!filteredProducts.length) return

    const headers = [
      "Product Name",
      "Brand",
      "Store",
      "Branch",
      "Initial Qty",
      "Sold Qty",
      "Remaining Qty",
      "Rental End Date",
      "Days Until Expiry"
    ]

    const rows = filteredProducts.map(p => [
      language === "ar" ? p.productNameAr : p.productName,
      language === "ar" ? p.brandNameAr : p.brandName,
      language === "ar" ? p.storeNameAr : p.storeName,
      language === "ar" ? p.branchNameAr : p.branchName,
      p.initialQuantity,
      p.soldQuantity,
      p.remainingQuantity,
      formatDate(p.rentalEndDate),
      p.daysUntilExpiry
    ])

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `products-on-shelves-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Get expiry badge color
  const getExpiryBadgeVariant = (days: number): "default" | "secondary" | "destructive" => {
    if (days < 3) return "destructive"
    if (days < 7) return "secondary"
    return "default"
  }

  if (productsData === undefined) {
    return <LoadingSkeleton />
  }

  return (
    <div className={cn("space-y-6", direction === "rtl" ? "font-cairo" : "font-inter")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("admin.productsOnShelves.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("admin.productsOnShelves.description")}
          </p>
        </div>
        <Button onClick={exportToCSV} disabled={!filteredProducts.length}>
          <Download className="h-4 w-4 me-2" />
          {t("admin.productsOnShelves.exportCSV")}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t("admin.productsOnShelves.filters")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <Label>{t("admin.productsOnShelves.search")}</Label>
              <div className="relative">
                <Search className={cn(
                  "absolute top-3 h-4 w-4 text-muted-foreground",
                  direction === "rtl" ? "right-3" : "left-3"
                )} />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("admin.productsOnShelves.searchPlaceholder")}
                  className={direction === "rtl" ? "pr-9" : "pl-9"}
                />
              </div>
            </div>

            {/* Store Filter */}
            <div>
              <Label>{t("admin.productsOnShelves.filterByStore")}</Label>
              <Select
                value={selectedStoreId || "all"}
                onValueChange={(v) => setSelectedStoreId(v === "all" ? undefined : v as Id<"storeProfiles">)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  {filterOptions.stores.map(store => (
                    <SelectItem key={store.id} value={store.id}>
                      {language === "ar" ? store.nameAr : store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Brand Filter */}
            <div>
              <Label>{t("admin.productsOnShelves.filterByBrand")}</Label>
              <Select
                value={selectedBrandId || "all"}
                onValueChange={(v) => setSelectedBrandId(v === "all" ? undefined : v as Id<"brandProfiles">)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  {filterOptions.brands.map(brand => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {language === "ar" ? brand.nameAr : brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Expiry Filter */}
            <div>
              <Label>{t("admin.productsOnShelves.filterByExpiry")}</Label>
              <Select value={expiringDays} onValueChange={setExpiringDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="3">{t("admin.productsOnShelves.expiring3Days")}</SelectItem>
                  <SelectItem value="7">{t("admin.productsOnShelves.expiring7Days")}</SelectItem>
                  <SelectItem value="30">{t("admin.productsOnShelves.expiring30Days")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 me-2" />
              {t("common.clearFilters")}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("admin.productsOnShelves.showing")} <strong>{filteredProducts.length}</strong> {t("admin.productsOnShelves.products")}
        </p>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">{t("admin.productsOnShelves.noProducts")}</h3>
              <p className="text-muted-foreground">{t("admin.productsOnShelves.noProductsDescription")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.productsOnShelves.productName")}</TableHead>
                    <TableHead>{t("admin.productsOnShelves.brand")}</TableHead>
                    <TableHead>{t("admin.productsOnShelves.store")}</TableHead>
                    <TableHead>{t("admin.productsOnShelves.branch")}</TableHead>
                    <TableHead className="text-center">{t("admin.productsOnShelves.initialQty")}</TableHead>
                    <TableHead className="text-center">{t("admin.productsOnShelves.soldQty")}</TableHead>
                    <TableHead className="text-center">{t("admin.productsOnShelves.remainingQty")}</TableHead>
                    <TableHead>{t("admin.productsOnShelves.rentalEndDate")}</TableHead>
                    <TableHead className="text-center">{t("admin.productsOnShelves.daysUntilExpiry")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={`${product.rentalId}-${product.productId}`}>
                      <TableCell className="font-medium">
                        {language === "ar" ? product.productNameAr : product.productName}
                      </TableCell>
                      <TableCell>
                        {language === "ar" ? product.brandNameAr : product.brandName}
                      </TableCell>
                      <TableCell>
                        {language === "ar" ? product.storeNameAr : product.storeName}
                      </TableCell>
                      <TableCell>
                        {language === "ar" ? product.branchNameAr : product.branchName}
                      </TableCell>
                      <TableCell className="text-center">{product.initialQuantity}</TableCell>
                      <TableCell className="text-center">{product.soldQuantity}</TableCell>
                      <TableCell className="text-center">{product.remainingQuantity}</TableCell>
                      <TableCell>{formatDate(product.rentalEndDate)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getExpiryBadgeVariant(product.daysUntilExpiry)}>
                          {product.daysUntilExpiry < 0 ? (
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {t("admin.productsOnShelves.expired")}
                            </span>
                          ) : (
                            `${product.daysUntilExpiry} ${t("common.days")}`
                          )}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
