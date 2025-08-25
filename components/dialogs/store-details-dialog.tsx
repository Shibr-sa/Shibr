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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Card, CardContent } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
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
  MapPin,
  Phone,
  Mail,
  Calendar,
  Package,
  DollarSign,
  ShoppingCart,
  Eye,
  Ban,
  CheckCircle,
  FileText,
  Trash2,
  Search,
} from "lucide-react"

interface StoreDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  store: {
    id: string
    name: string
    email?: string
    phoneNumber?: string
    shelves: number
    rentedShelves?: number
    rentals: number
    revenue?: number
    status: string
    joinDate?: string
    businessRegistration?: string
    businessRegistrationUrl?: string
  }
}

// Transform store data for display
const getStoreDetailsData = (language: string, store: any) => ({
  owner: store.name,
  ownerEmail: store.email || "-",
  ownerPhone: store.phoneNumber || "-",
  location: store.location?.city || (language === "ar" ? "غير محدد" : "Not specified"),
  joinDate: store.joinDate ? new Date(store.joinDate).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US") : "-",
  registrationDate: store.joinDate ? new Date(store.joinDate).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US") : "-",
  commercialRegistryNumber: store.businessRegistration || "-",
  commercialRegistry: store.businessRegistrationUrl ? "PDF" : "-",
  branchesCount: 1,
  totalRevenue: store.revenue || 0,
  monthlyRevenue: Math.round((store.revenue || 0) / 3), // Estimate based on 3 months
  shelfUtilization: store.shelves > 0 ? Math.round(((store.rentedShelves || store.rentals || 0) / store.shelves) * 100) : 0,
  branches: [
    { 
      name: language === "ar" ? "الفرع الرئيسي" : "Main Branch", 
      city: language === "ar" ? "الرياض" : "Riyadh", 
      shelves: 12, 
      rented: 8 
    },
    { 
      name: language === "ar" ? "فرع الشمال" : "North Branch", 
      city: language === "ar" ? "الرياض" : "Riyadh", 
      shelves: 8, 
      rented: 6 
    },
  ],
  shelves: [
    {
      id: 1,
      name: "A-01",
      branch: language === "ar" ? "الفرع الرئيسي" : "Main Branch",
      status: "rented",
      monthlyPrice: 2500,
      endDate: language === "ar" ? "15 مارس 2024" : "March 15, 2024"
    },
    {
      id: 2,
      name: "A-02",
      branch: language === "ar" ? "الفرع الرئيسي" : "Main Branch",
      status: "available",
      monthlyPrice: 2000,
      endDate: null
    },
    {
      id: 3,
      name: "B-01",
      branch: language === "ar" ? "فرع الشمال" : "North Branch",
      status: "rented",
      monthlyPrice: 1800,
      endDate: language === "ar" ? "30 أبريل 2024" : "April 30, 2024"
    },
    {
      id: 4,
      name: "B-02",
      branch: language === "ar" ? "فرع الشمال" : "North Branch",
      status: "available",
      monthlyPrice: 1800,
      endDate: null
    },
    {
      id: 5,
      name: "C-01",
      branch: language === "ar" ? "الفرع الرئيسي" : "Main Branch",
      status: "rented",
      monthlyPrice: 2200,
      endDate: language === "ar" ? "20 مايو 2024" : "May 20, 2024"
    },
    {
      id: 6,
      name: "C-02",
      branch: language === "ar" ? "الفرع الرئيسي" : "Main Branch",
      status: "available",
      monthlyPrice: 2200,
      endDate: null
    },
  ],
  recentRentals: [
    {
      id: 1,
      storeName: language === "ar" ? "متجر الأزياء" : "Fashion Store",
      shelf: "A-01",
      duration: language === "ar" ? "3 أشهر" : "3 months",
      payment: 7500,
      status: "active"
    },
    {
      id: 2,
      storeName: language === "ar" ? "محل الرياضة" : "Sports Shop",
      shelf: "B-01",
      duration: language === "ar" ? "6 أشهر" : "6 months",
      payment: 10800,
      status: "active"
    },
    {
      id: 3,
      storeName: language === "ar" ? "بوتيك الأناقة" : "Elegance Boutique",
      shelf: "C-01",
      duration: language === "ar" ? "3 أشهر" : "3 months",
      payment: 6600,
      status: "expired"
    },
    {
      id: 4,
      storeName: language === "ar" ? "معرض الإلكترونيات" : "Electronics Gallery",
      shelf: "A-02",
      duration: language === "ar" ? "12 شهر" : "12 months",
      payment: 24000,
      status: "active"
    },
    {
      id: 5,
      storeName: language === "ar" ? "محل الهدايا" : "Gift Shop",
      shelf: "B-02",
      duration: language === "ar" ? "1 شهر" : "1 month",
      payment: 1800,
      status: "active"
    },
    {
      id: 6,
      storeName: language === "ar" ? "متجر الأطفال" : "Kids Store",
      shelf: "C-02",
      duration: language === "ar" ? "3 أشهر" : "3 months",
      payment: 6600,
      status: "active"
    },
    {
      id: 7,
      storeName: language === "ar" ? "صيدلية الصحة" : "Health Pharmacy",
      shelf: "A-03",
      duration: language === "ar" ? "6 أشهر" : "6 months",
      payment: 15000,
      status: "expired"
    },
  ],
  paymentSummary: [
    { 
      month: language === "ar" ? "يناير 2024" : "January 2024", 
      rentedShelves: 8, 
      totalIncome: 45000,
      paymentMethod: language === "ar" ? "بطاقة ائتمان" : "Credit Card",
      status: "completed"
    },
    { 
      month: language === "ar" ? "فبراير 2024" : "February 2024", 
      rentedShelves: 10, 
      totalIncome: 52000,
      paymentMethod: language === "ar" ? "تحويل بنكي" : "Bank Transfer",
      status: "completed"
    },
    { 
      month: language === "ar" ? "مارس 2024" : "March 2024", 
      rentedShelves: 12, 
      totalIncome: 68500,
      paymentMethod: language === "ar" ? "بطاقة ائتمان" : "Credit Card",
      status: "completed"
    },
    { 
      month: language === "ar" ? "أبريل 2024" : "April 2024", 
      rentedShelves: 11, 
      totalIncome: 61000,
      paymentMethod: language === "ar" ? "نقدي" : "Cash",
      status: "pending"
    },
    { 
      month: language === "ar" ? "مايو 2024" : "May 2024", 
      rentedShelves: 14, 
      totalIncome: 72000,
      paymentMethod: language === "ar" ? "بطاقة ائتمان" : "Credit Card",
      status: "completed"
    },
    { 
      month: language === "ar" ? "يونيو 2024" : "June 2024", 
      rentedShelves: 13, 
      totalIncome: 69500,
      paymentMethod: language === "ar" ? "تحويل بنكي" : "Bank Transfer",
      status: "completed"
    },
    { 
      month: language === "ar" ? "يوليو 2024" : "July 2024", 
      rentedShelves: 15, 
      totalIncome: 78000,
      paymentMethod: language === "ar" ? "بطاقة ائتمان" : "Credit Card",
      status: "completed"
    },
  ]
})

export function StoreDetailsDialog({ open, onOpenChange, store }: StoreDetailsDialogProps) {
  const { t, language } = useLanguage()
  const [activeTab, setActiveTab] = useState("overview")
  const [currentPage, setCurrentPage] = useState(1)
  const [shelfFilter, setShelfFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [rentalPage, setRentalPage] = useState(1)
  const [paymentPage, setPaymentPage] = useState(1)
  const storeDetailsData = getStoreDetailsData(language, store)
  const itemsPerPage = 3
  const rentalItemsPerPage = 5
  const paymentItemsPerPage = 5

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "under_review":
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {store.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl font-semibold">{store.name}</DialogTitle>
                <Badge variant={getStatusVariant(store.status)} className="mt-1">
                  {t(`stores.status.${store.status}`)}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
              >
                <Ban className="h-4 w-4 me-2" />
                {t("stores.suspend_account")}
              </Button>
              <Button variant="destructive" size="sm">
                {t("stores.delete_store")}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">{t("stores.overview")}</TabsTrigger>
            <TabsTrigger value="rentals">{t("stores.rentals")}</TabsTrigger>
            <TabsTrigger value="performance">{t("stores.payment_summary")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard
                title={t("stores.total_revenue")}
                value={formatCurrency(storeDetailsData.totalRevenue)}
                icon={<DollarSign className="h-6 w-6 text-primary" />}
              />
              <StatCard
                title={t("stores.shelves_count")}
                value={store.shelves}
                icon={<Package className="h-6 w-6 text-primary" />}
              />
              <StatCard
                title={t("stores.renters_count")}
                value={store.rentals}
                icon={<ShoppingCart className="h-6 w-6 text-primary" />}
              />
            </div>

            <Separator className="my-4" />

            {/* Store Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm text-muted-foreground">{t("stores.store_name")}</Label>
                      <span className="text-sm font-medium">{store.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm text-muted-foreground">{t("stores.store_owner")}</Label>
                      <span className="text-sm font-medium">{storeDetailsData.owner}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm text-muted-foreground">{t("stores.branches_count")}</Label>
                      <span className="text-sm font-medium">{storeDetailsData.branchesCount}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm text-muted-foreground">{t("stores.registration_date")}</Label>
                      <span className="text-sm font-medium">{storeDetailsData.registrationDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm text-muted-foreground">{t("stores.commercial_registry_number")}</Label>
                      <span className="text-sm font-medium">{storeDetailsData.commercialRegistryNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm text-muted-foreground">{t("stores.commercial_registry")}</Label>
                      <span className="text-sm font-medium text-primary cursor-pointer hover:underline">{storeDetailsData.commercialRegistry}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shelves */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                {/* Header with Search and Filter in single row */}
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h3 className="font-semibold shrink-0">{t("stores.shelves")}</h3>
                  
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className="relative max-w-xs">
                      <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input 
                        placeholder={t("stores.search_shelves_placeholder")} 
                        className="pe-10"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value)
                          setCurrentPage(1)
                        }}
                      />
                    </div>
                    
                    <ToggleGroup 
                      type="single" 
                      value={shelfFilter}
                      onValueChange={(value) => {
                        if (value) {
                          setShelfFilter(value)
                          setCurrentPage(1)
                        }
                      }}
                    >
                      <ToggleGroupItem value="all" aria-label="Show all shelves">
                        {t("stores.filter.all")}
                      </ToggleGroupItem>
                      <ToggleGroupItem value="rented" aria-label="Show rented shelves">
                        {t("stores.shelf_status.rented")}
                      </ToggleGroupItem>
                      <ToggleGroupItem value="available" aria-label="Show available shelves">
                        {t("stores.shelf_status.available")}
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>
                <div className="rounded-md border">
                  <div className="min-h-[250px]"> {/* Fixed height for 3 rows */}
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="h-12 text-start font-medium">{t("stores.shelf_name")}</TableHead>
                          <TableHead className="h-12 text-start font-medium">{t("stores.branch")}</TableHead>
                          <TableHead className="h-12 text-start font-medium">{t("stores.status")}</TableHead>
                          <TableHead className="h-12 text-start font-medium">{t("stores.monthly_price")}</TableHead>
                          <TableHead className="h-12 text-start font-medium">{t("stores.rented_to")}</TableHead>
                          <TableHead className="h-12 text-start font-medium">{t("stores.options")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          let filteredShelves = shelfFilter === "all" 
                            ? storeDetailsData.shelves 
                            : storeDetailsData.shelves.filter(shelf => shelf.status === shelfFilter)
                          
                          // Apply search filter
                          if (searchQuery) {
                            filteredShelves = filteredShelves.filter(shelf => 
                              shelf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              shelf.branch.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                          }
                          
                          const totalPages = Math.ceil(filteredShelves.length / itemsPerPage)
                          const startIndex = (currentPage - 1) * itemsPerPage
                          const endIndex = startIndex + itemsPerPage
                          const paginatedShelves = filteredShelves.slice(startIndex, endIndex)
                          
                          return (
                            <>
                              {paginatedShelves.map((shelf, index) => (
                                <TableRow 
                                  key={shelf.id}
                                  className={`h-[72px] ${index < paginatedShelves.length - 1 ? 'border-b' : ''}`}
                                >
                                  <TableCell className="py-3 font-medium">{shelf.name}</TableCell>
                                  <TableCell className="py-3">{shelf.branch}</TableCell>
                                  <TableCell className="py-3">
                                    <Badge 
                                      variant={shelf.status === "rented" ? "default" : "secondary"}
                                      className="font-normal"
                                    >
                                      {t(`stores.shelf_status.${shelf.status}`)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-3">{formatCurrency(shelf.monthlyPrice)}</TableCell>
                                  <TableCell className="py-3">{shelf.endDate || "-"}</TableCell>
                                  <TableCell className="py-3">
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {/* Fill remaining rows if less than 3 items */}
                              {paginatedShelves.length < itemsPerPage && Array.from({ length: itemsPerPage - paginatedShelves.length }).map((_, index) => (
                                <TableRow key={`filler-${index}`} className={`h-[72px] ${index < itemsPerPage - paginatedShelves.length - 1 ? 'border-b' : ''}`}>
                                  <TableCell className="py-3">&nbsp;</TableCell>
                                  <TableCell className="py-3">&nbsp;</TableCell>
                                  <TableCell className="py-3">&nbsp;</TableCell>
                                  <TableCell className="py-3">&nbsp;</TableCell>
                                  <TableCell className="py-3">&nbsp;</TableCell>
                                  <TableCell className="py-3">&nbsp;</TableCell>
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
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className={cn(
                          "cursor-pointer",
                          currentPage === 1 && "pointer-events-none opacity-50"
                        )}
                        aria-disabled={currentPage === 1}
                      >
                        {t("common.previous")}
                      </PaginationPrevious>
                    </PaginationItem>
                    
                    {(() => {
                      let filteredShelves = shelfFilter === "all" 
                        ? storeDetailsData.shelves 
                        : storeDetailsData.shelves.filter(shelf => shelf.status === shelfFilter)
                      
                      if (searchQuery) {
                        filteredShelves = filteredShelves.filter(shelf => 
                          shelf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          shelf.branch.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                      }
                      
                      const totalPages = Math.ceil(filteredShelves.length / itemsPerPage)
                      return Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                    })()}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => {
                          let filteredShelves = shelfFilter === "all" 
                            ? storeDetailsData.shelves 
                            : storeDetailsData.shelves.filter(shelf => shelf.status === shelfFilter)
                          
                          if (searchQuery) {
                            filteredShelves = filteredShelves.filter(shelf => 
                              shelf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              shelf.branch.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                          }
                          
                          const totalPages = Math.ceil(filteredShelves.length / itemsPerPage)
                          setCurrentPage(prev => Math.min(totalPages, prev + 1))
                        }}
                        className={cn(
                          "cursor-pointer",
                          (() => {
                            let filteredShelves = shelfFilter === "all" 
                              ? storeDetailsData.shelves 
                              : storeDetailsData.shelves.filter(shelf => shelf.status === shelfFilter)
                            
                            if (searchQuery) {
                              filteredShelves = filteredShelves.filter(shelf => 
                                shelf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                shelf.branch.toLowerCase().includes(searchQuery.toLowerCase())
                              )
                            }
                            
                            const totalPages = Math.ceil(filteredShelves.length / itemsPerPage)
                            return currentPage === totalPages && "pointer-events-none opacity-50"
                          })()
                        )}
                        aria-disabled={(() => {
                          let filteredShelves = shelfFilter === "all" 
                            ? storeDetailsData.shelves 
                            : storeDetailsData.shelves.filter(shelf => shelf.status === shelfFilter)
                          
                          if (searchQuery) {
                            filteredShelves = filteredShelves.filter(shelf => 
                              shelf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              shelf.branch.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                          }
                          
                          const totalPages = Math.ceil(filteredShelves.length / itemsPerPage)
                          return currentPage === totalPages
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

          <TabsContent value="rentals" className="mt-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="rounded-md border">
                  <div className="min-h-[380px]"> {/* Fixed height for 5 rows */}
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="h-12 text-start font-medium">{t("stores.store_name_rental")}</TableHead>
                          <TableHead className="h-12 text-start font-medium">{t("stores.rented_shelf")}</TableHead>
                          <TableHead className="h-12 text-start font-medium">{t("stores.duration")}</TableHead>
                          <TableHead className="h-12 text-start font-medium">{t("stores.payment")}</TableHead>
                          <TableHead className="h-12 text-start font-medium">{t("stores.status")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const totalPages = Math.ceil(storeDetailsData.recentRentals.length / rentalItemsPerPage)
                          const startIndex = (rentalPage - 1) * rentalItemsPerPage
                          const endIndex = startIndex + rentalItemsPerPage
                          const paginatedRentals = storeDetailsData.recentRentals.slice(startIndex, endIndex)
                          
                          return (
                            <>
                              {paginatedRentals.map((rental, index) => (
                                <TableRow 
                                  key={rental.id}
                                  className={`h-[72px] ${index < paginatedRentals.length - 1 ? 'border-b' : ''}`}
                                >
                                  <TableCell className="py-3 font-medium">{rental.storeName}</TableCell>
                                  <TableCell className="py-3">{rental.shelf}</TableCell>
                                  <TableCell className="py-3">{rental.duration}</TableCell>
                                  <TableCell className="py-3">{formatCurrency(rental.payment)}</TableCell>
                                  <TableCell className="py-3">
                                    <Badge 
                                      variant={rental.status === "active" ? "default" : "secondary"}
                                      className="font-normal"
                                    >
                                      {t(`stores.rental_status.${rental.status}`)}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {/* Fill remaining rows if less than 5 items */}
                              {paginatedRentals.length < rentalItemsPerPage && Array.from({ length: rentalItemsPerPage - paginatedRentals.length }).map((_, index) => (
                                <TableRow key={`filler-${index}`} className={`h-[72px] ${index < rentalItemsPerPage - paginatedRentals.length - 1 ? 'border-b' : ''}`}>
                                  <TableCell className="py-3">&nbsp;</TableCell>
                                  <TableCell className="py-3">&nbsp;</TableCell>
                                  <TableCell className="py-3">&nbsp;</TableCell>
                                  <TableCell className="py-3">&nbsp;</TableCell>
                                  <TableCell className="py-3">&nbsp;</TableCell>
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
                        onClick={() => setRentalPage(prev => Math.max(1, prev - 1))}
                        className={cn(
                          "cursor-pointer",
                          rentalPage === 1 && "pointer-events-none opacity-50"
                        )}
                        aria-disabled={rentalPage === 1}
                      >
                        {t("common.previous")}
                      </PaginationPrevious>
                    </PaginationItem>
                    
                    {(() => {
                      const totalPages = Math.ceil(storeDetailsData.recentRentals.length / rentalItemsPerPage)
                      return Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let page;
                        if (totalPages <= 5) {
                          page = i + 1;
                        } else if (rentalPage <= 3) {
                          page = i + 1;
                        } else if (rentalPage >= totalPages - 2) {
                          page = totalPages - 4 + i;
                        } else {
                          page = rentalPage - 2 + i;
                        }
                        return page;
                      }).map(page => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setRentalPage(page)}
                            isActive={rentalPage === page}
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
                          const totalPages = Math.ceil(storeDetailsData.recentRentals.length / rentalItemsPerPage)
                          setRentalPage(prev => Math.min(totalPages, prev + 1))
                        }}
                        className={cn(
                          "cursor-pointer",
                          (() => {
                            const totalPages = Math.ceil(storeDetailsData.recentRentals.length / rentalItemsPerPage)
                            return rentalPage === totalPages && "pointer-events-none opacity-50"
                          })()
                        )}
                        aria-disabled={(() => {
                          const totalPages = Math.ceil(storeDetailsData.recentRentals.length / rentalItemsPerPage)
                          return rentalPage === totalPages
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

          <TabsContent value="performance" className="mt-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="rounded-md border">
                  <div className="min-h-[380px]"> {/* Fixed height for 5 rows */}
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="h-12 text-start font-medium">{t("stores.month_column")}</TableHead>
                          <TableHead className="h-12 text-start font-medium">{t("stores.rented_shelves_count")}</TableHead>
                          <TableHead className="h-12 text-start font-medium">{t("stores.total_income")}</TableHead>
                          <TableHead className="h-12 text-start font-medium">{t("stores.payment_method")}</TableHead>
                          <TableHead className="h-12 text-start font-medium">{t("stores.status")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const totalPages = Math.ceil(storeDetailsData.paymentSummary.length / paymentItemsPerPage)
                          const startIndex = (paymentPage - 1) * paymentItemsPerPage
                          const endIndex = startIndex + paymentItemsPerPage
                          const paginatedPayments = storeDetailsData.paymentSummary.slice(startIndex, endIndex)
                          
                          return (
                            <>
                              {paginatedPayments.map((payment, index) => (
                                <TableRow 
                                  key={index}
                                  className={`h-[72px] ${index < paginatedPayments.length - 1 ? 'border-b' : ''}`}
                                >
                                  <TableCell className="py-3 font-medium">{payment.month}</TableCell>
                                  <TableCell className="py-3">{payment.rentedShelves}</TableCell>
                                  <TableCell className="py-3">{formatCurrency(payment.totalIncome)}</TableCell>
                                  <TableCell className="py-3">{payment.paymentMethod}</TableCell>
                                  <TableCell className="py-3">
                                    <Badge 
                                      variant={payment.status === "completed" ? "default" : "secondary"}
                                      className="font-normal"
                                    >
                                      {payment.status === "completed" ? t("common.completed") : t("common.pending")}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {/* Fill remaining rows if less than 5 items */}
                              {paginatedPayments.length < paymentItemsPerPage && Array.from({ length: paymentItemsPerPage - paginatedPayments.length }).map((_, index) => (
                                <TableRow key={`filler-${index}`} className={`h-[72px] ${index < paymentItemsPerPage - paginatedPayments.length - 1 ? 'border-b' : ''}`}>
                                  <TableCell className="py-3">&nbsp;</TableCell>
                                  <TableCell className="py-3">&nbsp;</TableCell>
                                  <TableCell className="py-3">&nbsp;</TableCell>
                                  <TableCell className="py-3">&nbsp;</TableCell>
                                  <TableCell className="py-3">&nbsp;</TableCell>
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
                      const totalPages = Math.ceil(storeDetailsData.paymentSummary.length / paymentItemsPerPage)
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
                          const totalPages = Math.ceil(storeDetailsData.paymentSummary.length / paymentItemsPerPage)
                          setPaymentPage(prev => Math.min(totalPages, prev + 1))
                        }}
                        className={cn(
                          "cursor-pointer",
                          (() => {
                            const totalPages = Math.ceil(storeDetailsData.paymentSummary.length / paymentItemsPerPage)
                            return paymentPage === totalPages && "pointer-events-none opacity-50"
                          })()
                        )}
                        aria-disabled={(() => {
                          const totalPages = Math.ceil(storeDetailsData.paymentSummary.length / paymentItemsPerPage)
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
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}