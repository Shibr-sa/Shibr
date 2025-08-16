"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/localization-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { Search, Eye, Store, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { StoreDetailsDialog } from "@/components/dialogs/store-details-dialog"

const storesData = [
  {
    id: 1,
    name: "Store X",
    shelves: 12,
    rentals: 45,
    status: "active",
  },
  {
    id: 2,
    name: "Glow Cosmetics",
    shelves: 8,
    rentals: 32,
    status: "active",
  },
  {
    id: 3,
    name: "Nova Perfumes",
    shelves: 15,
    rentals: 58,
    status: "suspended",
  },
  {
    id: 4,
    name: "FitZone",
    shelves: 6,
    rentals: 23,
    status: "active",
  },
  {
    id: 5,
    name: "Coffee Box",
    shelves: 4,
    rentals: 12,
    status: "under_review",
  },
  {
    id: 6,
    name: "Tech Hub",
    shelves: 10,
    rentals: 38,
    status: "active",
  },
  {
    id: 7,
    name: "Fashion Plus",
    shelves: 7,
    rentals: 28,
    status: "active",
  },
  {
    id: 8,
    name: "Home Essentials",
    shelves: 9,
    rentals: 35,
    status: "active",
  },
]

export default function StoresPage() {
  const { t, language } = useLanguage()
  const [timePeriod, setTimePeriod] = useState("monthly")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStore, setSelectedStore] = useState<typeof storesData[0] | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const itemsPerPage = 5

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

  // Filter stores based on search query
  const filteredStores = storesData.filter(store =>
    store.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Pagination logic
  const totalPages = Math.ceil(filteredStores.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedStores = filteredStores.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      {/* Header Card with Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">{t("stores.title")}</CardTitle>
              <p className="text-muted-foreground mt-1">{t("stores.description")}</p>
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
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("stores.total_stores")}</p>
                  <p className="text-2xl font-bold">248</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    +20.1% {t("dashboard.from_last_month")}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Store className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("stores.active_stores")}</p>
                  <p className="text-2xl font-bold">189</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    +15.3% {t("dashboard.from_last_month")}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("stores.suspended")}</p>
                  <p className="text-2xl font-bold">24</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    -5.2% {t("dashboard.from_last_month")}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stores Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">{t("stores.all_stores")}</CardTitle>
            <div className="relative w-80">
              <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder={t("stores.search_placeholder")} 
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
                      {t("stores.table.store")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("stores.table.shelves")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("stores.table.rentals")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("stores.table.status")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("dashboard.options")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStores.length > 0 ? (
                    <>
                      {paginatedStores.map((store, index) => (
                        <TableRow 
                          key={store.id}
                          className={`h-[72px] ${index < paginatedStores.length - 1 ? 'border-b' : ''}`}
                        >
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${store.name.charAt(0)}`} />
                                <AvatarFallback>{store.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="font-medium">{store.name}</div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 text-muted-foreground">{store.shelves}</TableCell>
                          <TableCell className="py-3 text-muted-foreground">{store.rentals}</TableCell>
                          <TableCell className="py-3">
                            <Badge variant={getStatusVariant(store.status)} className="font-normal">
                              {t(`stores.status.${store.status}`)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedStore(store)
                                setDialogOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Fill remaining rows if less than 5 items */}
                      {paginatedStores.length < itemsPerPage && Array.from({ length: itemsPerPage - paginatedStores.length }).map((_, index) => (
                        <TableRow key={`filler-${index}`} className={`h-[72px] ${index < itemsPerPage - paginatedStores.length - 1 ? 'border-b' : ''}`}>
                          <TableCell className="py-3">&nbsp;</TableCell>
                          <TableCell className="py-3">&nbsp;</TableCell>
                          <TableCell className="py-3">&nbsp;</TableCell>
                          <TableCell className="py-3">&nbsp;</TableCell>
                          <TableCell className="py-3">&nbsp;</TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : (
                    // Empty state - show 5 empty rows
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`empty-${index}`} className="h-[72px]">
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          {index === 2 && t("stores.no_results")}
                        </TableCell>
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

      {/* Store Details Dialog */}
      {selectedStore && (
        <StoreDetailsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          store={selectedStore}
        />
      )}
    </div>
  )
}