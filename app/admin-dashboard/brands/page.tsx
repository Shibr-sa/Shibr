"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useLanguage } from "@/contexts/localization-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, Eye, Package, TrendingUp, ShoppingBag, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import { BrandDetailsDialog } from "@/components/dialogs/brand-details-dialog"

const brandsData = [
  {
    id: 1,
    name: "Nike",
    logo: "N",
    category: "sports",
    products: 156,
    stores: 45,
    revenue: 125000,
    status: "active",
    joinDate: "January 15, 2023",
  },
  {
    id: 2,
    name: "Apple Store",
    logo: "A",
    category: "electronics",
    products: 89,
    stores: 32,
    revenue: 250000,
    status: "active",
    joinDate: "February 22, 2023",
  },
  {
    id: 3,
    name: "Zara",
    logo: "Z",
    category: "fashion",
    products: 234,
    stores: 67,
    revenue: 180000,
    status: "active",
    joinDate: "March 10, 2023",
  },
  {
    id: 4,
    name: "Samsung",
    logo: "S",
    category: "electronics",
    products: 112,
    stores: 28,
    revenue: 195000,
    status: "suspended",
    joinDate: "April 5, 2023",
  },
  {
    id: 5,
    name: "Adidas",
    logo: "A",
    category: "sports",
    products: 143,
    stores: 41,
    revenue: 115000,
    status: "active",
    joinDate: "May 18, 2023",
  },
  {
    id: 6,
    name: "L'Oreal",
    logo: "L",
    category: "beauty",
    products: 78,
    stores: 23,
    revenue: 95000,
    status: "active",
    joinDate: "June 12, 2023",
  },
  {
    id: 7,
    name: "H&M",
    logo: "H",
    category: "fashion",
    products: 198,
    stores: 54,
    revenue: 145000,
    status: "active",
    joinDate: "July 8, 2023",
  },
  {
    id: 8,
    name: "Sony",
    logo: "S",
    category: "electronics",
    products: 95,
    stores: 30,
    revenue: 175000,
    status: "active",
    joinDate: "August 3, 2023",
  },
]

export default function BrandsPage() {
  const { t, language } = useLanguage()
  const [timePeriod, setTimePeriod] = useState("monthly")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBrand, setSelectedBrand] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const itemsPerPage = 5
  
  // Fetch real data from Convex
  const brandsResult = useQuery(api.admin.getBrands, {
    searchQuery,
    page: currentPage,
    limit: itemsPerPage,
    timePeriod,
  })
  
  const brandsData = brandsResult?.brands || []

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

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ${t("common.currency")}`
  }

  // Use data from Convex query
  const filteredBrands = brandsData
  const totalPages = brandsResult?.totalPages || 1
  const paginatedBrands = brandsData

  const getTranslatedData = (brand: any) => {
    if (language === "ar") {
      return {
        joinDate: brand.id === 1 ? "15 يناير 2023" :
                  brand.id === 2 ? "22 فبراير 2023" :
                  brand.id === 3 ? "10 مارس 2023" :
                  brand.id === 4 ? "5 أبريل 2023" :
                  brand.id === 5 ? "18 مايو 2023" :
                  brand.id === 6 ? "12 يونيو 2023" :
                  brand.id === 7 ? "8 يوليو 2023" :
                  "3 أغسطس 2023",
      }
    }
    return {
      joinDate: brand.joinDate,
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Card with Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">{t("brands.title")}</CardTitle>
              <CardDescription className="mt-1">{t("brands.description")}</CardDescription>
            </div>
            <Tabs value={timePeriod} onValueChange={setTimePeriod} className="w-auto">
              <TabsList className="grid grid-cols-4 w-auto bg-muted">
                <TabsTrigger value="daily" className="px-4">
                  {t("dashboard.daily")}
                </TabsTrigger>
                <TabsTrigger value="weekly" className="px-4">
                  {t("dashboard.weekly")}
                </TabsTrigger>
                <TabsTrigger value="monthly" className="px-4">
                  {t("dashboard.monthly")}
                </TabsTrigger>
                <TabsTrigger value="yearly" className="px-4">
                  {t("dashboard.yearly")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title={t("brands.total_brands")}
              value={brandsResult?.stats?.totalBrands || 0}
              trend={{
                value: brandsResult?.stats?.brandsChange || 0,
                label: timePeriod === "daily" ? t("dashboard.from_yesterday") : 
                       timePeriod === "weekly" ? t("dashboard.from_last_week") :
                       timePeriod === "yearly" ? t("dashboard.from_last_year") :
                       t("dashboard.from_last_month")
              }}
              icon={<Package className="h-6 w-6 text-primary" />}
              className="bg-muted/50 border-0"
            />
            
            <StatCard
              title={t("brands.total_products")}
              value={brandsResult?.stats?.totalProducts || 0}
              trend={{
                value: brandsResult?.stats?.productsChange || 0,
                label: timePeriod === "daily" ? t("dashboard.from_yesterday") : 
                       timePeriod === "weekly" ? t("dashboard.from_last_week") :
                       timePeriod === "yearly" ? t("dashboard.from_last_year") :
                       t("dashboard.from_last_month")
              }}
              icon={<ShoppingBag className="h-6 w-6 text-primary" />}
              className="bg-muted/50 border-0"
            />
            
            <StatCard
              title={t("brands.total_revenue")}
              value={formatCurrency(brandsResult?.stats?.totalRevenue || 0)}
              trend={{
                value: brandsResult?.stats?.revenueChange || 0,
                label: timePeriod === "daily" ? t("dashboard.from_yesterday") : 
                       timePeriod === "weekly" ? t("dashboard.from_last_week") :
                       timePeriod === "yearly" ? t("dashboard.from_last_year") :
                       t("dashboard.from_last_month")
              }}
              icon={<DollarSign className="h-6 w-6 text-primary" />}
              className="bg-muted/50 border-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Brands Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">{t("brands.all_brands")}</CardTitle>
            <div className="relative w-80">
              <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder={t("brands.search_placeholder")} 
                className="pe-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1) // Reset to first page on search
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <div className="min-h-[420px]"> {/* Fixed height for 5 rows */}
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="h-12 text-start font-medium">
                      {t("brands.table.brand")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("brands.table.category")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("brands.table.products")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("brands.table.stores")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("brands.table.revenue")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("brands.table.status")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("dashboard.options")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBrands.length > 0 ? (
                    <>
                      {paginatedBrands.map((brand, index) => {
                        const translatedData = getTranslatedData(brand)
                        return (
                          <TableRow 
                            key={brand.id}
                            className={`h-[72px] ${index < paginatedBrands.length - 1 ? 'border-b' : ''}`}
                          >
                            <TableCell className="py-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${brand.logo}`} />
                                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                    {brand.logo}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{brand.name}</div>
                                  <div className="text-sm text-muted-foreground">{translatedData.joinDate}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <Badge variant="outline">{t(`brands.category.${brand.category}`)}</Badge>
                            </TableCell>
                            <TableCell className="py-3 text-muted-foreground">{brand.products}</TableCell>
                            <TableCell className="py-3 text-muted-foreground">{brand.stores}</TableCell>
                            <TableCell className="py-3 font-medium">{formatCurrency(brand.revenue)}</TableCell>
                            <TableCell className="py-3">
                              <Badge variant={getStatusVariant(brand.status)} className="font-normal">
                                {t(`brands.status.${brand.status}`)}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => {
                                  setSelectedBrand(brand)
                                  setDialogOpen(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {/* Fill remaining rows if less than 5 items */}
                      {paginatedBrands.length < itemsPerPage && Array.from({ length: itemsPerPage - paginatedBrands.length }).map((_, index) => (
                        <TableRow key={`filler-${index}`} className={`h-[72px] ${index < itemsPerPage - paginatedBrands.length - 1 ? 'border-b' : ''}`}>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-20" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3"><Skeleton className="h-6 w-16" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-6 w-16" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : (
                    // Empty state - show 5 skeleton rows when loading or no results
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`empty-${index}`} className="h-[72px]">
                        {brandsResult === undefined ? (
                          // Loading state - show skeletons
                          <>
                            <TableCell className="py-3">
                              <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                  <Skeleton className="h-4 w-24" />
                                  <Skeleton className="h-3 w-20" />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3"><Skeleton className="h-6 w-16" /></TableCell>
                            <TableCell className="py-3"><Skeleton className="h-4 w-12" /></TableCell>
                            <TableCell className="py-3"><Skeleton className="h-4 w-12" /></TableCell>
                            <TableCell className="py-3"><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell className="py-3"><Skeleton className="h-6 w-16" /></TableCell>
                            <TableCell className="py-3"><Skeleton className="h-8 w-8" /></TableCell>
                          </>
                        ) : (
                          // No results state - show message
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            {index === 2 && t("brands.no_results")}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination Controls - Always visible */}
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
        </CardContent>
      </Card>

      {/* Brand Details Dialog */}
      {selectedBrand && (
        <BrandDetailsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          brand={selectedBrand}
        />
      )}
    </div>
  )
}