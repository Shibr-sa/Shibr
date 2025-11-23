"use client"

import { useState, useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useLanguage } from "@/contexts/localization-context"
import { formatCurrency } from "@/lib/formatters"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ClearanceStatusBadge } from "@/components/clearances/ClearanceStatusBadge"
import { Search, FileText, Clock, CheckCircle2, DollarSign, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

export default function BrandClearancesPage() {
  const { t, language, direction } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">("all")
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch clearances
  const data = useQuery(api.rentalClearance.getBrandClearances, {
    page: currentPage,
    limit: 10,
    statusFilter: statusFilter === "all" ? undefined : statusFilter,
  })

  // Client-side search filter
  const filteredItems = useMemo(() => {
    if (!data?.items) return []

    if (!searchQuery.trim()) return data.items

    const query = searchQuery.toLowerCase()
    return data.items.filter((item) => {
      const storeName = language === "ar" ? item.storeNameAr : item.storeName
      return storeName.toLowerCase().includes(query)
    })
  }, [data?.items, searchQuery, language])

  const locale = language === "ar" ? ar : undefined

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t("clearances.title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("clearances.description")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("clearances.stats.total")}
                </p>
                <p className="text-2xl font-bold mt-1">{data.stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("clearances.stats.active")}
                </p>
                <p className="text-2xl font-bold mt-1">{data.stats.active}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("clearances.stats.closed")}
                </p>
                <p className="text-2xl font-bold mt-1">{data.stats.closed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("clearances.stats.revenue")}
                </p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(data.stats.totalRevenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Filter */}
            <ToggleGroup
              type="single"
              value={statusFilter}
              onValueChange={(value) => {
                if (value) {
                  setStatusFilter(value as "all" | "active" | "closed")
                  setCurrentPage(1)
                }
              }}
              className="justify-start"
            >
              <ToggleGroupItem value="all" aria-label={t("clearances.filter.all")}>
                {t("clearances.filter.all")}
              </ToggleGroupItem>
              <ToggleGroupItem value="active" aria-label={t("clearances.filter.active")}>
                {t("clearances.filter.active")}
              </ToggleGroupItem>
              <ToggleGroupItem value="closed" aria-label={t("clearances.filter.closed")}>
                {t("clearances.filter.closed")}
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("clearances.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={direction === "rtl" ? "pe-10 ps-4" : "ps-10 pe-4"}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={direction === "rtl" ? "text-right" : ""}>
                    {t("clearances.table.rentalId")}
                  </TableHead>
                  <TableHead className={direction === "rtl" ? "text-right" : ""}>
                    {t("clearances.table.store")}
                  </TableHead>
                  <TableHead className={direction === "rtl" ? "text-right" : ""}>
                    {t("clearances.table.period")}
                  </TableHead>
                  <TableHead className="text-center">
                    {t("clearances.table.status")}
                  </TableHead>
                  <TableHead className={direction === "rtl" ? "text-left" : "text-right"}>
                    {t("clearances.table.settlement")}
                  </TableHead>
                  <TableHead className={direction === "rtl" ? "text-left" : "text-right"}>
                    {t("clearances.table.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? t("clearances.noResults") : t("clearances.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-mono text-sm">
                        {item._id.slice(-8)}
                      </TableCell>
                      <TableCell>
                        {language === "ar" ? item.storeNameAr : item.storeName}
                        <div className="text-sm text-muted-foreground">
                          {item.shelfLocation}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(item.startDate), "PP", { locale })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(item.endDate), "PP", { locale })}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <ClearanceStatusBadge status={item.clearanceStatus} />
                      </TableCell>
                      <TableCell className={direction === "rtl" ? "text-left" : "text-right"}>
                        {formatCurrency(item.settlementAmount)}
                      </TableCell>
                      <TableCell className={direction === "rtl" ? "text-left" : "text-right"}>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <Link href={`/brand-dashboard/clearances/${item.clearanceId}`}>
                            {t("clearances.viewDetails")}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-muted-foreground">
                {t("clearances.page")} {currentPage} {t("clearances.of")} {data.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t("common.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={currentPage === data.totalPages}
                >
                  {t("common.next")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
