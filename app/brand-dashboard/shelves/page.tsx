"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Plus, Package, TrendingUp, Lock, QrCode, Search } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useBrandData } from "@/contexts/brand-data-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useRouter } from "next/navigation"

export default function BrandShelvesPage() {
  const { t, direction } = useLanguage()
  const { isBrandDataComplete } = useBrandData()
  const router = useRouter()

  const shelvesData = [
    {
      id: 1,
      storeName: "مركز الرفاق",
      city: "الرياض",
      operationsCount: 42,
      rentalDate: "1 يونيو",
      endDate: "30 يونيو",
      status: "نشط",
      statusType: "active",
    },
    {
      id: 2,
      storeName: "سلة عطر",
      city: "جدة",
      operationsCount: 27,
      rentalDate: "10 يونيو",
      endDate: "10 يوليو",
      status: "نشط",
      statusType: "active",
    },
    {
      id: 3,
      storeName: "ستايل بوكس",
      city: "الدمام",
      operationsCount: 15,
      rentalDate: "1 مايو",
      endDate: "1 يونيو",
      status: "بانتظار تفعيل",
      statusType: "pending",
    },
    {
      id: 4,
      storeName: "تجميل وإبداع",
      city: "المدينة المنورة",
      operationsCount: 50,
      rentalDate: "20 مايو",
      endDate: "2 يونيو",
      status: "نشط",
      statusType: "active",
    },
    {
      id: 5,
      storeName: "تجميل وإبداع",
      city: "المدينة المنورة",
      operationsCount: 50,
      rentalDate: "20 مايو",
      endDate: "3 يونيو",
      status: "منتهي",
      statusType: "expired",
    },
  ]

  return (
    <div className="space-y-6" dir={direction}>
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t("brand.shelves.current_shelves_count")}</p>
                <p className="text-2xl font-bold">15</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("brand.shelves.increase_from_last_month")}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t("brand.shelves.total_qr_scans")}</p>
                <p className="text-2xl font-bold">1,890</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("brand.shelves.increase_from_last_month")}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <QrCode className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t("brand.shelves.total_sales")}</p>
                <p className="text-2xl font-bold text-primary">
                  {t("common.currency_symbol")} 45,231.89
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("brand.shelves.increase_from_last_month")}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shelves Management Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col space-y-1.5">
            <CardTitle className="text-xl font-semibold">
              {t("brand.shelves.manage_shelves_inside_stores")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("brand.shelves.shelves_management_description")}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Shelf Button and Search */}
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button 
                      variant="default"
                      size="default"
                      className="w-full sm:w-auto"
                      disabled={!isBrandDataComplete}
                      onClick={() => router.push("/brand-dashboard/shelves/marketplace")}
                    >
                      {!isBrandDataComplete ? (
                        <Lock className="h-4 w-4 me-2" />
                      ) : (
                        <Plus className="h-4 w-4 me-2" />
                      )}
                      {t("brand.shelves.add_new_shelf")}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!isBrandDataComplete && (
                  <TooltipContent>
                    <p>{t("brand.dashboard.complete_profile_to_enable")}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            
            <div className="relative w-full sm:w-80 md:w-96">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("brand.shelves.search_placeholder")}
                className="ps-9 h-10"
                dir={direction}
              />
            </div>
          </div>

          {/* Shelves Table */}
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-muted/50">
                  <TableHead className="h-12 px-4 text-start font-medium text-foreground">
                    {t("brand.shelves.store_name")}
                  </TableHead>
                  <TableHead className="h-12 px-4 text-center font-medium text-foreground">
                    {t("brand.shelves.city")}
                  </TableHead>
                  <TableHead className="h-12 px-4 text-center font-medium text-foreground">
                    {t("brand.shelves.operations_count")}
                  </TableHead>
                  <TableHead className="h-12 px-4 text-center font-medium text-foreground">
                    {t("brand.shelves.rental_date")}
                  </TableHead>
                  <TableHead className="h-12 px-4 text-center font-medium text-foreground">
                    {t("brand.shelves.end_date")}
                  </TableHead>
                  <TableHead className="h-12 px-4 text-center font-medium text-foreground">
                    {t("brand.shelves.rental_status")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shelvesData.map((shelf, index) => (
                  <TableRow 
                    key={shelf.id} 
                    className={index === shelvesData.length - 1 ? "" : "border-b"}
                  >
                    <TableCell className="h-12 px-4 font-medium text-foreground">
                      {shelf.storeName}
                    </TableCell>
                    <TableCell className="h-12 px-4 text-center text-foreground">
                      {shelf.city}
                    </TableCell>
                    <TableCell className="h-12 px-4 text-center text-foreground">
                      <span className="font-medium">{shelf.operationsCount}</span>
                      <span className="ms-1 text-muted-foreground">
                        {t("brand.shelves.operation")}
                      </span>
                    </TableCell>
                    <TableCell className="h-12 px-4 text-center text-muted-foreground">
                      {shelf.rentalDate}
                    </TableCell>
                    <TableCell className="h-12 px-4 text-center text-muted-foreground">
                      {shelf.endDate}
                    </TableCell>
                    <TableCell className="h-12 px-4 text-center">
                      <Badge 
                        variant={shelf.statusType === "active" 
                          ? "default" 
                          : shelf.statusType === "pending"
                          ? "secondary"
                          : "destructive"}
                      >
                        {shelf.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
