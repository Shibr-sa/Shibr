"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Search, Plus, Package, BarChart3, DollarSign, Edit2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useStoreData } from "@/contexts/store-data-context"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function StoreDashboardShelvesPage() {
  const { t, direction } = useLanguage()
  const { isLoading, isStoreDataComplete } = useStoreData()
  const [filter, setFilter] = useState("all")
  const router = useRouter()

  // Filter options - order them based on direction
  const filterOptions = [
    { value: "all", label: t("shelves.all_filter") },
    { value: "rented", label: t("shelves.rented_shelves_filter") },
    { value: "available", label: t("shelves.available_shelves_filter") }
  ]
  
  // Reverse for RTL to show "All" first from the right
  const orderedFilters = direction === "rtl" ? [...filterOptions].reverse() : filterOptions

  // Mock data for shelves
  const shelves = [
    {
      id: "1",
      shelfName: t("shelves.new_shelf"),
      shelf: t("shelves.riyadh_shelf"),
      productName: "Nova Perfumes",
      renter: "Glow Cosmetics",
      rentalType: "available",
      status: "rented",
      price: `500 ${t("common.currency")} / ${t("common.monthly")}`,
      date: "1 " + t("common.july") + " 2025",
      category: t("common.riyadh"),
      subcategory: t("common.dammam"),
      canEdit: true,
      hasOffer: false
    },
    {
      id: "2", 
      shelfName: t("shelves.new_shelf"),
      shelf: t("shelves.dammam_shelf"),
      productName: "Nova Perfumes",
      renter: "Glow Cosmetics",
      rentalType: "available",
      status: "rented",
      price: `650 ${t("common.currency")} / ${t("common.monthly")}`,
      date: "3 " + t("common.july") + " 2025",
      category: t("common.riyadh"),
      subcategory: t("common.dammam"),
      canEdit: true,
      hasOffer: false
    }
  ]

  return (
    <div className={`space-y-6 ${direction === "rtl" ? "font-cairo" : "font-inter"}`}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("dashboard.shelves")}</h1>
        <p className="text-muted-foreground">
          {t("shelves.header_description")}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t("shelves.total_rented_shelves")}</p>
                <p className="text-2xl font-bold">8</p>
                <p className="text-xs text-muted-foreground mt-1">{t("shelves.increase_from_last_month")}</p>
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
                <p className="text-sm text-muted-foreground mb-1">{t("shelves.total_sales")}</p>
                <p className="text-2xl font-bold text-primary">﷼ 45,231.89</p>
                <p className="text-xs text-muted-foreground mt-1">{t("shelves.increase_from_last_month")}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t("shelves.available_shelves")}</p>
                <p className="text-2xl font-bold">3</p>
                <p className="text-xs text-muted-foreground mt-1">{t("shelves.increase_from_last_month")}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardContent className="p-6">
          {/* Title and Description Section */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">{t("shelves.your_shelves")}</h2>
              <p className="text-muted-foreground">
                {t("shelves.manage_description")}
              </p>
            </div>
            <Button 
              className="gap-2 bg-primary hover:bg-primary/90 flex-shrink-0"
              disabled={isLoading || !isStoreDataComplete}
              title={!isStoreDataComplete && !isLoading ? t("dashboard.complete_profile_first") : ""}
              onClick={() => router.push("/store-dashboard/shelves/new")}
            >
              <Plus className="h-4 w-4" />
              {t("shelves.display_shelf_now")}
            </Button>
          </div>
          {/* Search and Filter */}
          <div className="flex items-center justify-between mb-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={t("shelves.search_placeholder")}
                className="ps-10 w-80"
              />
            </div>

            {/* Filter Pills */}
            <RadioGroup value={filter} onValueChange={setFilter} className="flex items-center gap-4">
              {orderedFilters.map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <RadioGroupItem 
                    value={option.value} 
                    id={option.value} 
                    className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                  />
                  <Label htmlFor={option.value} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-start">{t("shelves.table.shelf_name")}</TableHead>
                  <TableHead className="text-start">{t("shelves.table.branch_name")}</TableHead>
                  <TableHead className="text-start">{t("shelves.table.renter")}</TableHead>
                  <TableHead className="text-start">{t("shelves.table.price")}</TableHead>
                  <TableHead className="text-start">{t("shelves.table.status")}</TableHead>
                  <TableHead className="text-start">{t("shelves.table.next_collection")}</TableHead>
                  <TableHead className="text-start">{t("shelves.table.action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shelves.map((shelf) => (
                  <TableRow key={shelf.id}>
                    <TableCell className="font-medium">{shelf.shelfName}</TableCell>
                    <TableCell>{shelf.shelf}</TableCell>
                    <TableCell>{shelf.renter}</TableCell>
                    <TableCell>{shelf.price}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="default" 
                        className="bg-green-100 text-green-700 hover:bg-green-100"
                      >
                        {t("shelves.status.rented")}
                      </Badge>
                    </TableCell>
                    <TableCell>{shelf.date}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {shelf.canEdit && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            disabled={isLoading || !isStoreDataComplete}
                            title={!isStoreDataComplete && !isLoading ? t("dashboard.complete_profile_first") : ""}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {shelf.hasOffer && (
                          <span className="text-xs text-muted-foreground">{t("shelves.view_details")}</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Info */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              149 {t("common.currency")}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" disabled>
                {t("common.previous")}
              </Button>
              <Button variant="ghost" size="sm">
                {t("common.next")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}