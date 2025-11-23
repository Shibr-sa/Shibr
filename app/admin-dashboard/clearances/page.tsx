"use client"

import { useState, useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useLanguage } from "@/contexts/localization-context"
import { formatCurrency } from "@/lib/formatters"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ClearanceStatusBadge } from "@/components/clearances/ClearanceStatusBadge"
import { Search, FileText, AlertCircle, CheckCircle2, DollarSign, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

type ClearanceStatus =
  | "not_started"
  | "pending_inventory_check"
  | "pending_return_shipment"
  | "return_shipped"
  | "return_received"
  | "pending_settlement"
  | "settlement_approved"
  | "payment_completed"
  | "closed"

export default function AdminClearancesPage() {
  const { t, language, direction } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<ClearanceStatus | "all">("all")
  const [pendingApprovalOnly, setPendingApprovalOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch clearances
  const data = useQuery(api.admin.clearances.getAdminClearances, {
    page: currentPage,
    limit: 10,
    statusFilter: statusFilter === "all" ? undefined : statusFilter,
    pendingApprovalOnly,
    searchQuery: searchQuery || undefined,
  })

  const locale = language === "ar" ? ar : undefined

  const allStatuses: ClearanceStatus[] = [
    "not_started",
    "pending_inventory_check",
    "pending_return_shipment",
    "return_shipped",
    "return_received",
    "pending_settlement",
    "settlement_approved",
    "payment_completed",
    "closed",
  ]

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
        <h1 className="text-3xl font-bold">{t("clearances.admin.title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("clearances.admin.description")}
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
                  {t("clearances.admin.stats.pendingApproval")}
                </p>
                <p className="text-2xl font-bold mt-1">{data.stats.pendingApproval}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("clearances.admin.stats.completed")}
                </p>
                <p className="text-2xl font-bold mt-1">{data.stats.completed}</p>
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
                  {t("clearances.admin.stats.salesVolume")}
                </p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(data.stats.totalSalesVolume)}
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
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Status Filter */}
              <div className="flex-1 max-w-xs">
                <Label htmlFor="statusFilter" className="mb-2 block">
                  {t("clearances.admin.filter.status")}
                </Label>
                <Select
                  dir={direction}
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as ClearanceStatus | "all")
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger id="statusFilter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir={direction}>
                    <SelectItem value="all">{t("clearances.filter.all")}</SelectItem>
                    {allStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`clearances.status.${status}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div className="flex-1">
                <Label htmlFor="search" className="mb-2 block">
                  {t("common.search")}
                </Label>
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder={t("clearances.admin.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    className={direction === "rtl" ? "pe-10 ps-4" : "ps-10 pe-4"}
                  />
                </div>
              </div>
            </div>

            {/* Pending Approval Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pendingApproval"
                checked={pendingApprovalOnly}
                onCheckedChange={(checked) => {
                  setPendingApprovalOnly(checked === true)
                  setCurrentPage(1)
                }}
              />
              <Label
                htmlFor="pendingApproval"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {t("clearances.admin.filter.pendingApprovalOnly")}
              </Label>
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
                    {t("clearances.admin.table.brandStore")}
                  </TableHead>
                  <TableHead className={direction === "rtl" ? "text-right" : ""}>
                    {t("clearances.table.period")}
                  </TableHead>
                  <TableHead className="text-center">
                    {t("clearances.table.status")}
                  </TableHead>
                  <TableHead className={direction === "rtl" ? "text-left" : "text-right"}>
                    {t("clearances.admin.table.settlement")}
                  </TableHead>
                  <TableHead className={direction === "rtl" ? "text-left" : "text-right"}>
                    {t("clearances.table.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {t("clearances.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-mono text-sm">
                        {item._id.slice(-8)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.brandName}</div>
                        <div className="text-sm text-muted-foreground">
                          → {item.storeName}
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
                        <div className="flex flex-col gap-1 items-center">
                          <ClearanceStatusBadge status={item.clearanceStatus} />
                          {!item.settlementApproved && item.clearanceStatus === "pending_settlement" && (
                            <span className="text-xs text-amber-600">
                              {t("clearances.admin.needsApproval")}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={direction === "rtl" ? "text-left" : "text-right"}>
                        <div className="text-xs space-y-0.5">
                          <div className="text-muted-foreground">
                            {t("clearances.admin.platform")}: {formatCurrency(item.platformCommission)}
                          </div>
                          <div className="text-muted-foreground">
                            {t("clearances.admin.store")}: {formatCurrency(item.storeCommission)}
                          </div>
                          <div className="text-muted-foreground">
                            {t("clearances.admin.brand")}: {formatCurrency(item.brandRevenue)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={direction === "rtl" ? "text-left" : "text-right"}>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <Link href={`/admin-dashboard/clearances/${item.clearanceId}`}>
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
