"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useLanguage } from "@/contexts/localization-context"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
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
  Phone,
  Mail,
  Calendar,
  Package,
  DollarSign,
  ShoppingCart,
  Eye,
  Ban,
  FileText,
  Trash2,
  Search,
  User,
  Building2,
  Hash,
  Download,
} from "lucide-react"

// Transform store data for display
const getStoreDetailsData = (language: string, store: any, shelves: any[], rentals: any[], payments: any[]) => ({
  owner: store?.fullName || store?.name || "-",
  ownerEmail: store?.email || "-",
  ownerPhone: store?.phoneNumber || "-",
  location: store?.location?.city || store?.storeLocation?.city || (language === "ar" ? "غير محدد" : "Not specified"),
  joinDate: store?.joinDate ? new Date(store.joinDate).toLocaleDateString("en-US") : "-",
  registrationDate: store?.joinDate ? new Date(store.joinDate).toLocaleDateString("en-US") : "-",
  commercialRegistryNumber: store?.businessRegistration || "-",
  commercialRegistryUrl: store?.businessRegistrationUrl || null,
  branchesCount: store?.branches || 1,
  totalRevenue: store?.revenue || 0,
  monthlyRevenue: Math.round((store?.revenue || 0) / 12),
  shelfUtilization: store?.shelves > 0 ? Math.round(((store?.rentedShelves || store?.rentals || 0) / store.shelves) * 100) : 0,
  shelves: (shelves || []).map((shelf: any) => ({
    id: shelf._id,
    name: shelf.shelfName,
    branch: shelf.branch,
    status: shelf.status === "rented" ? "rented" : "available",
    monthlyPrice: shelf.monthlyPrice,
    endDate: shelf.availableFrom ? new Date(shelf.availableFrom).toLocaleDateString("en-US") : null
  })),
  recentRentals: (rentals || []).map((rental: any) => ({
    id: rental._id,
    storeName: rental.renterName,
    shelf: rental.shelfName,
    duration: `${rental.duration} ${language === "ar" ? "شهر" : "month(s)"}`,
    payment: rental.totalAmount,
    status: (rental.status === "active" || rental.status === "expired") ? rental.status : "pending"
  })),
  paymentSummary: (payments || []).map((payment: any) => ({
    month: payment.month,
    rentedShelves: payment.rentedShelves,
    totalIncome: payment.totalIncome,
    paymentMethod: payment.paymentMethod,
    status: payment.status
  }))
})

export default function StoreDetailsPage() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const params = useParams()
  const storeId = params.id as string

  const itemsPerPage = 5

  const [activeTab, setActiveTab] = useState("shelves")
  const [currentPage, setCurrentPage] = useState(1)
  const [shelfFilter, setShelfFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [rentalPage, setRentalPage] = useState(1)
  const [paymentPage, setPaymentPage] = useState(1)

  // Debounced search value for shelves
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)

  // Check if search is in progress (user typed but debounce hasn't fired yet)
  const isSearching = searchQuery !== debouncedSearchQuery

  // Track if we've loaded initial data
  const [hasInitialShelvesData, setHasInitialShelvesData] = useState(false)
  const [hasInitialRentalsData, setHasInitialRentalsData] = useState(false)
  const [hasInitialPaymentsData, setHasInitialPaymentsData] = useState(false)

  // Fetch store data from Convex
  const storesResult = useQuery(api.admin.stores.getStores, {
    searchQuery: "",
    page: 1,
    limit: 100,
  })

  const store = storesResult?.items?.find((s: any) => s.id === storeId)

  // Fetch shelves for this store with server-side search - store.id is the profileId
  const shelvesResult = useQuery(api.admin.stores.getStoreShelves,
    store?.id ? {
      profileId: store.id as Id<"userProfiles">,
      searchQuery: debouncedSearchQuery,
      status: shelfFilter,
      page: currentPage,
      limit: itemsPerPage,
    } : "skip"
  )
  const shelves = shelvesResult?.items || []

  // Fetch rentals for this store
  const rentalsQuery = useQuery(api.admin.stores.getStoreRentals,
    store?.id ? { profileId: store.id as Id<"userProfiles"> } : "skip"
  )
  const rentals = useMemo(() => rentalsQuery || [], [rentalsQuery])

  // Fetch payment summary
  const paymentsQuery = useQuery(api.admin.stores.getStorePayments,
    store?.id ? { profileId: store.id as Id<"userProfiles"> } : "skip"
  )
  const payments = useMemo(() => paymentsQuery || [], [paymentsQuery])

  const storeDetailsData = getStoreDetailsData(language, store, shelves, rentals, payments)

  // Track when we have initial data
  useEffect(() => {
    if (shelvesResult !== undefined && !hasInitialShelvesData) {
      setHasInitialShelvesData(true)
    }
  }, [shelvesResult, hasInitialShelvesData])

  useEffect(() => {
    if (rentals !== undefined && !hasInitialRentalsData) {
      setHasInitialRentalsData(true)
    }
  }, [rentals, hasInitialRentalsData])

  useEffect(() => {
    if (payments !== undefined && !hasInitialPaymentsData) {
      setHasInitialPaymentsData(true)
    }
  }, [payments, hasInitialPaymentsData])

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

  if (!store) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Overview Section */}
      <div className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

        {/* Store Info - Enhanced */}
        <Card className="overflow-hidden">
          <div className="bg-muted/50 px-6 py-3 border-b flex items-center justify-between">
            <h3 className="text-base font-semibold">
              {t("stores.store_information")}
            </h3>
            <Badge variant={getStatusVariant(store.status)}>
              {t(`stores.status.${store.status}`)}
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
                      {t("stores.store_name")}
                    </Label>
                    <p className="text-sm font-medium">{store.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground font-normal">
                      {t("stores.store_owner")}
                    </Label>
                    <p className="text-sm font-medium">{storeDetailsData.owner}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground font-normal">
                      {t("stores.branches_count")}
                    </Label>
                    <p className="text-sm font-medium">
                      {storeDetailsData.branchesCount}
                      <span className="text-muted-foreground ms-1">
                        {storeDetailsData.branchesCount === 1 ? t("stores.branch") : t("stores.branches")}
                      </span>
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
                      {t("stores.registration_date")}
                    </Label>
                    <p className="text-sm font-medium">{storeDetailsData.registrationDate}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Hash className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground font-normal">
                      {t("stores.commercial_registry_number")}
                    </Label>
                    <p className="text-sm font-medium">
                      {storeDetailsData.commercialRegistryNumber}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground font-normal">
                      {t("stores.commercial_registry")}
                    </Label>
                    <div className="flex items-center gap-2">
                      {storeDetailsData.commercialRegistryUrl ? (
                        <a
                          href={storeDetailsData.commercialRegistryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary cursor-pointer hover:underline"
                          download
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

            {/* Additional Contact Info and Actions */}
            <Separator className="my-6" />
            <div className="flex items-center justify-between px-3">
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{storeDetailsData.ownerEmail}</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{storeDetailsData.ownerPhone}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Ban className="h-4 w-4 me-2" />
                  {t("stores.suspend_account")}
                </Button>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 me-2" />
                  {t("stores.delete_store")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tables with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Header with Search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="grid w-auto grid-cols-3">
              <TabsTrigger value="shelves">{t("stores.shelves")}</TabsTrigger>
              <TabsTrigger value="rentals">{t("stores.rentals")}</TabsTrigger>
              <TabsTrigger value="payments">{t("stores.payments")}</TabsTrigger>
            </TabsList>

            {activeTab === "shelves" && (
              <div className="flex items-center gap-2">
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

                <div className="relative w-full sm:w-80">
                  <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
              </div>
            )}
          </div>

          {/* Shelves Tab */}
          <TabsContent value="shelves" className="space-y-6">
            <div className="rounded-md border bg-card">
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
                  {shelvesResult === undefined || isSearching ? (
                    // Loading state
                    Array.from({ length: itemsPerPage }).map((_, index) => (
                      <TableRow key={`loading-${index}`} className="h-[72px]">
                        <TableCell className="py-3"><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-8 w-8 rounded" /></TableCell>
                      </TableRow>
                    ))
                  ) : (() => {
                    // Use server-filtered shelves data
                    const filteredShelves = shelves.map((shelf: any) => ({
                      id: shelf._id,
                      name: shelf.shelfName,
                      branch: shelf.branch,
                      status: shelf.status === "rented" ? "rented" : "available",
                      monthlyPrice: shelf.monthlyPrice,
                      endDate: shelf.availableFrom ? new Date(shelf.availableFrom).toLocaleDateString("en-US") : null
                    }))

                    // Check if there are no shelves
                    if (filteredShelves.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} className="h-[360px] text-center">
                            <div className="flex h-full w-full items-center justify-center">
                              <div className="flex flex-col items-center gap-1 py-10">
                                <Package className="h-10 w-10 text-muted-foreground/40 mb-2" />
                                <h3 className="font-medium">
                                  {debouncedSearchQuery || shelfFilter !== "all" ? t("stores.no_shelves_found") : t("stores.no_shelves")}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {debouncedSearchQuery || shelfFilter !== "all" ? t("stores.try_different_filter") : t("stores.shelves_will_appear_here")}
                                </p>
                                {(debouncedSearchQuery || shelfFilter !== "all") && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-4"
                                    onClick={() => {
                                      setSearchQuery("")
                                      setShelfFilter("all")
                                      setCurrentPage(1)
                                    }}
                                  >
                                    {t("common.clear_filters")}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }

                    // Server already paginated, just use the results
                    const pageItems = filteredShelves;
                    const emptyRows = itemsPerPage - pageItems.length;

                    return (
                      <>
                        {pageItems.map((shelf) => (
                          <TableRow key={shelf.id} className="h-[72px]">
                            <TableCell className="py-3 font-medium">{shelf.name}</TableCell>
                            <TableCell className="py-3">{shelf.branch?.branchName || '-'}</TableCell>
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
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => router.push(`/admin-dashboard/stores/${storeId}/${shelf.id}`)}
                              >
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {Array.from({ length: emptyRows }).map((_, index) => (
                          <TableRow key={`empty-${index}`} className="h-[72px]">
                            <TableCell className="py-3" colSpan={6}>&nbsp;</TableCell>
                          </TableRow>
                        ))}
                      </>
                    );
                  })()}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {(() => {
              // Use server pagination info
              const totalPages = shelvesResult?.totalPages || 1;

              return (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => setCurrentPage(i + 1)}
                          isActive={currentPage === i + 1}
                          className="cursor-pointer"
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              );
            })()}
          </TabsContent>

          {/* Rentals Tab */}
          <TabsContent value="rentals" className="space-y-6">
            <div className="rounded-md border bg-card">
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
                  {rentals === undefined ? (
                    // Loading state
                    Array.from({ length: itemsPerPage }).map((_, index) => (
                      <TableRow key={`loading-${index}`} className="h-[72px]">
                        <TableCell className="py-3"><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : storeDetailsData.recentRentals.length === 0 ? (
                    // Empty state
                    <TableRow>
                      <TableCell colSpan={5} className="h-[360px] text-center">
                        <div className="flex h-full w-full items-center justify-center">
                          <div className="flex flex-col items-center gap-1 py-10">
                            <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mb-2" />
                            <h3 className="font-medium">
                              {t("stores.no_rentals")}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {t("stores.rentals_will_appear_here")}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (() => {
                    const pageItems = storeDetailsData.recentRentals.slice((rentalPage - 1) * itemsPerPage, rentalPage * itemsPerPage);
                    const emptyRows = itemsPerPage - pageItems.length;

                    return (
                      <>
                        {pageItems.map((rental) => (
                          <TableRow key={rental.id} className="h-[72px]">
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
                        {Array.from({ length: emptyRows }).map((_, index) => (
                          <TableRow key={`empty-${index}`} className="h-[72px]">
                            <TableCell className="py-3" colSpan={5}>&nbsp;</TableCell>
                          </TableRow>
                        ))}
                      </>
                    );
                  })()}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setRentalPage(Math.max(1, rentalPage - 1))}
                    className={rentalPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: Math.ceil(storeDetailsData.recentRentals.length / itemsPerPage) || 1 }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      onClick={() => setRentalPage(i + 1)}
                      isActive={rentalPage === i + 1}
                      className="cursor-pointer"
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setRentalPage(Math.min(Math.ceil(storeDetailsData.recentRentals.length / itemsPerPage) || 1, rentalPage + 1))}
                    className={rentalPage === (Math.ceil(storeDetailsData.recentRentals.length / itemsPerPage) || 1) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </TabsContent>

          {/* Payment Summary Tab */}
          <TabsContent value="payments" className="space-y-6">
            <div className="rounded-md border bg-card">
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
                  {payments === undefined ? (
                    // Loading state
                    Array.from({ length: itemsPerPage }).map((_, index) => (
                      <TableRow key={`loading-${index}`} className="h-[72px]">
                        <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : storeDetailsData.paymentSummary.length === 0 ? (
                    // Empty state
                    <TableRow>
                      <TableCell colSpan={5} className="h-[360px] text-center">
                        <div className="flex h-full w-full items-center justify-center">
                          <div className="flex flex-col items-center gap-1 py-10">
                            <DollarSign className="h-10 w-10 text-muted-foreground/40 mb-2" />
                            <h3 className="font-medium">
                              {t("stores.no_payments")}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {t("stores.payments_will_appear_here")}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (() => {
                    const pageItems = storeDetailsData.paymentSummary.slice((paymentPage - 1) * itemsPerPage, paymentPage * itemsPerPage);
                    const emptyRows = itemsPerPage - pageItems.length;

                    return (
                      <>
                        {pageItems.map((payment, index) => (
                          <TableRow key={index} className="h-[72px]">
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
                        {Array.from({ length: emptyRows }).map((_, index) => (
                          <TableRow key={`empty-${index}`} className="h-[72px]">
                            <TableCell className="py-3" colSpan={5}>&nbsp;</TableCell>
                          </TableRow>
                        ))}
                      </>
                    );
                  })()}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPaymentPage(Math.max(1, paymentPage - 1))}
                    className={paymentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: Math.ceil(storeDetailsData.paymentSummary.length / itemsPerPage) || 1 }).map((_, i) => (
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
                    onClick={() => setPaymentPage(Math.min(Math.ceil(storeDetailsData.paymentSummary.length / itemsPerPage) || 1, paymentPage + 1))}
                    className={paymentPage === (Math.ceil(storeDetailsData.paymentSummary.length / itemsPerPage) || 1) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}