"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/localization-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { StatCard } from "@/components/ui/stat-card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"
import {
  Store,
  Package,
  DollarSign,
  Ban,
  Calendar,
  FileText,
  Search,
  Phone,
  Globe,
  Download,
} from "lucide-react"

interface BrandDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brand: {
    id: string
    name: string
    email?: string
    phoneNumber?: string
    products: number
    stores: number
    rentals?: number
    revenue: number
    status: string
    category?: string
    joinDate?: string
    businessRegistration?: string
    businessRegistrationUrl?: string
  }
}

// Transform brand data for display
const getBrandDetailsData = (language: string, brand: any) => ({
  owner: brand.name,
  ownerEmail: brand.email || "email@brand.com",
  ownerPhone: brand.phoneNumber || "05XXXXXXXX",
  website: "www.brand-store.com",
  contactMethod: brand.phoneNumber || "05XXXXXXXX",
  registrationDate: brand.joinDate ? new Date(brand.joinDate).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US") : "-",
  commercialRegistryNumber: brand.businessRegistration || "9876543210",
  commercialRegistry: brand.businessRegistrationUrl ? "PDF" : "-",
  totalPaymentsDue: brand.revenue || 0,
  rentedShelvesCount: brand.rentals || 0,
  
  products: [
    {
      id: 1,
      name: language === "ar" ? "حذاء رياضي" : "Sports Shoe",
      code: "PRD-001",
      price: 350,
      quantity: 150,
      sales: 89,
      stores: 8,
    },
    {
      id: 2,
      name: language === "ar" ? "قميص قطني" : "Cotton Shirt",
      code: "PRD-002",
      price: 120,
      quantity: 200,
      sales: 156,
      stores: 10,
    },
    {
      id: 3,
      name: language === "ar" ? "بنطال جينز" : "Jeans",
      code: "PRD-003",
      price: 280,
      quantity: 100,
      sales: 67,
      stores: 6,
    },
    {
      id: 4,
      name: language === "ar" ? "حقيبة يد" : "Handbag",
      code: "PRD-004",
      price: 450,
      quantity: 50,
      sales: 34,
      stores: 5,
    },
    {
      id: 5,
      name: language === "ar" ? "نظارة شمسية" : "Sunglasses",
      code: "PRD-005",
      price: 180,
      quantity: 80,
      sales: 45,
      stores: 7,
    },
    {
      id: 6,
      name: language === "ar" ? "ساعة يد" : "Watch",
      code: "PRD-006",
      price: 850,
      quantity: 30,
      sales: 12,
      stores: 4,
    },
    {
      id: 7,
      name: language === "ar" ? "حزام جلد" : "Leather Belt",
      code: "PRD-007",
      price: 150,
      quantity: 120,
      sales: 78,
      stores: 9,
    },
  ],
  
  paymentOperations: [
    {
      id: 1,
      date: language === "ar" ? "1 يونيو" : "June 1",
      store: "NOVA",
      paymentType: language === "ar" ? "تحويل بنكي" : "Bank Transfer",
      amount: 20000,
      status: "completed"
    },
    {
      id: 2,
      date: language === "ar" ? "1 يوليو (جديد)" : "July 1 (New)",
      store: "BOUD",
      paymentType: language === "ar" ? "تحويل بنكي" : "Bank Transfer",
      amount: 20000,
      status: "pending"
    },
    {
      id: 3,
      date: language === "ar" ? "1 مايو" : "May 1",
      store: "ZARA",
      paymentType: language === "ar" ? "تحويل بنكي" : "Bank Transfer",
      amount: 15000,
      status: "completed"
    },
    {
      id: 4,
      date: language === "ar" ? "1 أبريل" : "April 1",
      store: "H&M",
      paymentType: language === "ar" ? "تحويل بنكي" : "Bank Transfer",
      amount: 18000,
      status: "completed"
    },
    {
      id: 5,
      date: language === "ar" ? "1 مارس" : "March 1",
      store: "GAP",
      paymentType: language === "ar" ? "تحويل بنكي" : "Bank Transfer",
      amount: 22000,
      status: "completed"
    },
  ],
})

export function BrandDetailsDialog({ open, onOpenChange, brand }: BrandDetailsDialogProps) {
  const { t, language } = useLanguage()
  const [activeTab, setActiveTab] = useState("overview")
  const [productPage, setProductPage] = useState(1)
  const [productSearch, setProductSearch] = useState("")
  const [paymentPage, setPaymentPage] = useState(1)
  
  const brandDetailsData = getBrandDetailsData(language, brand)
  const productItemsPerPage = 5
  const paymentItemsPerPage = 3

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "inactive":
        return "secondary"
      case "suspended":
        return "destructive"
      default:
        return "outline"
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ${t("common.currency")}`
  }

  // Filter products based on search
  const filteredProducts = brandDetailsData.products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.code.toLowerCase().includes(productSearch.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {brand.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl font-semibold">{brand.name}</DialogTitle>
                <Badge variant={getStatusVariant(brand.status)} className="mt-1">
                  {t(`brands.status.${brand.status}`)}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
              >
                <Ban className="h-4 w-4 me-2" />
                {t("brands.suspend_account")}
              </Button>
              <Button variant="destructive" size="sm">
                {t("brands.delete_brand")}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">{t("brands.overview")}</TabsTrigger>
            <TabsTrigger value="products">{t("brands.products")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                title={t("brands.total_payments_due")}
                value={formatCurrency(brandDetailsData.totalPaymentsDue)}
                icon={<DollarSign className="h-6 w-6 text-primary" />}
              />
              <StatCard
                title={t("brands.rented_shelves_count")}
                value={brandDetailsData.rentedShelvesCount}
                icon={<Package className="h-6 w-6 text-primary" />}
              />
            </div>

            <Separator className="my-4" />

            {/* Brand Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm text-muted-foreground">{t("brands.store_owner")}</Label>
                      <span className="text-sm font-medium">{brandDetailsData.owner}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm text-muted-foreground">{t("brands.website")}</Label>
                      <span className="text-sm font-medium text-primary cursor-pointer hover:underline">{brandDetailsData.website}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm text-muted-foreground">{t("brands.rented_shelves_count")}</Label>
                      <span className="text-sm font-medium">{brandDetailsData.rentedShelvesCount}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm text-muted-foreground">{t("brands.contact_method")}</Label>
                      <span className="text-sm font-medium">{brandDetailsData.contactMethod}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm text-muted-foreground">{t("brands.commercial_registry_number")}</Label>
                      <span className="text-sm font-medium">{brandDetailsData.commercialRegistryNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm text-muted-foreground">{t("brands.commercial_registry")}</Label>
                      <span className="text-sm font-medium text-primary cursor-pointer hover:underline">{t("brands.download")}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Separator className="my-4" />
            
            {/* Payment Operations Log */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <CardTitle className="text-lg mb-4">{t("brands.payment_operations_log")}</CardTitle>
                <div className="rounded-md border">
                  <div className="min-h-[250px]"> {/* Fixed height for 3 rows */}
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="h-12 text-start font-medium">{t("brands.history")}</TableHead>
                          <TableHead className="h-12 text-start font-medium">{t("brands.store")}</TableHead>
                          <TableHead className="h-12 text-start font-medium">{t("brands.status_column")}</TableHead>
                          <TableHead className="h-12 text-start font-medium">{t("brands.operation_type")}</TableHead>
                          <TableHead className="h-12 text-start font-medium">{t("brands.amount")}</TableHead>
                          <TableHead className="h-12 text-start font-medium">{t("brands.options")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const totalPages = Math.ceil(brandDetailsData.paymentOperations.length / paymentItemsPerPage)
                          const startIndex = (paymentPage - 1) * paymentItemsPerPage
                          const endIndex = startIndex + paymentItemsPerPage
                          const paginatedPayments = brandDetailsData.paymentOperations.slice(startIndex, endIndex)
                          
                          return (
                            <>
                              {paginatedPayments.map((operation, index) => (
                                <TableRow key={operation.id} className={`h-[72px] ${index < paginatedPayments.length - 1 ? 'border-b' : ''}`}>
                                  <TableCell className="py-3 font-medium">{operation.date}</TableCell>
                                  <TableCell className="py-3">{operation.store}</TableCell>
                                  <TableCell className="py-3">
                                    <Badge 
                                      variant={operation.status === "completed" ? "default" : "secondary"}
                                      className="font-normal"
                                    >
                                      {operation.status === "completed" ? 
                                        t("brands.payment_completed") : 
                                        t("brands.payment_pending")
                                      }
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-3">{operation.paymentType}</TableCell>
                                  <TableCell className="py-3 font-medium">
                                    {formatCurrency(operation.amount)}
                                  </TableCell>
                                  <TableCell className="py-3">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8"
                                      disabled={operation.status === "pending"}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {/* Fill remaining rows if less than 3 items */}
                              {paginatedPayments.length < paymentItemsPerPage && Array.from({ length: paymentItemsPerPage - paginatedPayments.length }).map((_, index) => (
                                <TableRow key={`filler-${index}`} className={`h-[72px] ${index < paymentItemsPerPage - paginatedPayments.length - 1 ? 'border-b' : ''}`}>
                                  <TableCell className="py-3"><Skeleton className="h-4 w-20" /></TableCell>
                                  <TableCell className="py-3"><Skeleton className="h-4 w-16" /></TableCell>
                                  <TableCell className="py-3"><Skeleton className="h-6 w-20" /></TableCell>
                                  <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                                  <TableCell className="py-3"><Skeleton className="h-4 w-20" /></TableCell>
                                  <TableCell className="py-3"><Skeleton className="h-8 w-8" /></TableCell>
                                </TableRow>
                              ))}
                            </>
                          )
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                {/* Pagination */}
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setPaymentPage(prev => Math.max(1, prev - 1))}
                        className={cn(
                          "cursor-pointer",
                          paymentPage === 1 && "pointer-events-none opacity-50"
                        )}
                        aria-disabled={paymentPage === 1}
                      >
                        {t("common.previous")}
                      </PaginationPrevious>
                    </PaginationItem>
                    
                    {(() => {
                      const totalPages = Math.ceil(brandDetailsData.paymentOperations.length / paymentItemsPerPage)
                      return Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let page;
                        if (totalPages <= 5) {
                          page = i + 1;
                        } else if (paymentPage <= 3) {
                          page = i + 1;
                        } else if (paymentPage >= totalPages - 2) {
                          page = totalPages - 4 + i;
                        } else {
                          page = paymentPage - 2 + i;
                        }
                        return page;
                      }).map(page => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setPaymentPage(page)}
                            isActive={paymentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))
                    })()}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => {
                          const totalPages = Math.ceil(brandDetailsData.paymentOperations.length / paymentItemsPerPage)
                          setPaymentPage(prev => Math.min(totalPages, prev + 1))
                        }}
                        className={cn(
                          "cursor-pointer",
                          (() => {
                            const totalPages = Math.ceil(brandDetailsData.paymentOperations.length / paymentItemsPerPage)
                            return paymentPage === totalPages && "pointer-events-none opacity-50"
                          })()
                        )}
                        aria-disabled={(() => {
                          const totalPages = Math.ceil(brandDetailsData.paymentOperations.length / paymentItemsPerPage)
                          return paymentPage === totalPages
                        })()}
                      >
                        {t("common.next")}
                      </PaginationNext>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="mt-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                {/* Header with Search in single row */}
                <div className="flex items-center justify-between gap-4 mb-4">
                  <CardTitle className="text-lg shrink-0">{t("brands.products_displayed")}</CardTitle>
                  
                  <div className="relative max-w-xs">
                    <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input 
                      placeholder={t("brands.search_products_placeholder")} 
                      className="pe-10"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value)
                        setProductPage(1)
                      }}
                    />
                  </div>
                </div>
                
                <div className="rounded-md border">
                  <div className="min-h-[380px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="h-12 text-start font-medium">{t("brands.product_name")}</TableHead>
                          <TableHead className="h-12 text-start font-medium">{t("brands.product_code")}</TableHead>
                          <TableHead className="h-12 text-start font-medium">{t("brands.price")}</TableHead>
                          <TableHead className="h-12 text-start font-medium">{t("brands.quantity")}</TableHead>
                          <TableHead className="h-12 text-start font-medium">{t("brands.sales")}</TableHead>
                          <TableHead className="h-12 text-start font-medium">{t("brands.stores_count")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const totalPages = Math.ceil(filteredProducts.length / productItemsPerPage)
                          const startIndex = (productPage - 1) * productItemsPerPage
                          const endIndex = startIndex + productItemsPerPage
                          const paginatedProducts = filteredProducts.slice(startIndex, endIndex)
                          
                          return (
                            <>
                              {paginatedProducts.map((product, index) => (
                                <TableRow 
                                  key={product.id}
                                  className={`h-[72px] ${index < paginatedProducts.length - 1 ? 'border-b' : ''}`}
                                >
                                  <TableCell className="py-3 font-medium">{product.name}</TableCell>
                                  <TableCell className="py-3">{product.code}</TableCell>
                                  <TableCell className="py-3">{formatCurrency(product.price)}</TableCell>
                                  <TableCell className="py-3">{product.quantity}</TableCell>
                                  <TableCell className="py-3">{product.sales}</TableCell>
                                  <TableCell className="py-3">{product.stores}</TableCell>
                                </TableRow>
                              ))}
                              {/* Fill remaining rows */}
                              {paginatedProducts.length < productItemsPerPage && Array.from({ length: productItemsPerPage - paginatedProducts.length }).map((_, index) => (
                                <TableRow key={`filler-${index}`} className={`h-[72px] ${index < productItemsPerPage - paginatedProducts.length - 1 ? 'border-b' : ''}`}>
                                  <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                                  <TableCell className="py-3"><Skeleton className="h-4 w-16" /></TableCell>
                                  <TableCell className="py-3"><Skeleton className="h-4 w-20" /></TableCell>
                                  <TableCell className="py-3"><Skeleton className="h-4 w-12" /></TableCell>
                                  <TableCell className="py-3"><Skeleton className="h-4 w-12" /></TableCell>
                                  <TableCell className="py-3"><Skeleton className="h-4 w-12" /></TableCell>
                                </TableRow>
                              ))}
                            </>
                          )
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                {/* Pagination */}
                {filteredProducts.length > 0 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setProductPage(prev => Math.max(1, prev - 1))}
                          className={cn(
                            "cursor-pointer",
                            productPage === 1 && "pointer-events-none opacity-50"
                          )}
                        >
                          {t("common.previous")}
                        </PaginationPrevious>
                      </PaginationItem>
                      
                      {(() => {
                        const totalPages = Math.ceil(filteredProducts.length / productItemsPerPage)
                        return Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setProductPage(page)}
                              isActive={productPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))
                      })()}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => {
                            const totalPages = Math.ceil(filteredProducts.length / productItemsPerPage)
                            setProductPage(prev => Math.min(totalPages, prev + 1))
                          }}
                          className={cn(
                            "cursor-pointer",
                            productPage === Math.ceil(filteredProducts.length / productItemsPerPage) && "pointer-events-none opacity-50"
                          )}
                        >
                          {t("common.next")}
                        </PaginationNext>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}