"use client"

import { useState, useEffect } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useLanguage } from "@/contexts/localization-context"
import { formatDate } from "@/lib/formatters"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { Card, CardContent } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Search,
  Eye,
  CreditCard,
  DollarSign,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function PaymentsPage() {
  const { t, language } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Initialize state from URL params for persistence
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [filterStatus, setFilterStatus] = useState(searchParams.get("status") || "all")
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1)
  const itemsPerPage = 5
  
  // Track if we've loaded initial data
  const [hasInitialData, setHasInitialData] = useState(false)
  
  // Debounced search value
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)
  
  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("search", searchQuery)
    if (filterStatus !== "all") params.set("status", filterStatus)
    if (currentPage > 1) params.set("page", String(currentPage))
    
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(newUrl, { scroll: false })
  }, [searchQuery, filterStatus, currentPage, pathname, router])
  
  // Fetch stats data without filters (for stat cards)
  const statsResult = useQuery(api.admin.getPayments, {
    searchQuery: "",
    status: "all",
    page: 1,
    limit: 1, // We only need stats, not items
  })
  
  // Fetch table data with debounced search
  const paymentsResult = useQuery(api.admin.getPayments, {
    searchQuery: debouncedSearchQuery,
    status: filterStatus,
    page: currentPage,
    limit: itemsPerPage,
  })
  
  const payments = paymentsResult?.items || []
  
  // Check if search is in progress (user typed but debounce hasn't fired yet)
  const isSearching = searchQuery !== debouncedSearchQuery
  
  // Track when we have initial data
  useEffect(() => {
    if (paymentsResult !== undefined && !hasInitialData) {
      setHasInitialData(true)
    }
  }, [paymentsResult, hasInitialData])

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default"
      case "unpaid":
        return "destructive"
      default:
        return "outline"
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ${t("common.currency")}`
  }

  const totalPages = paymentsResult?.totalPages || 1

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h2 className="text-2xl font-bold">{t("payments.title")}</h2>
        <p className="text-muted-foreground mt-1">{t("payments.description")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
            {statsResult === undefined ? (
              <>
                <Card className="bg-muted/50 border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">{t("payments.total_received")}</p>
                        <Skeleton className="h-[30px] w-24 mt-1" />
                        <Skeleton className="h-[16px] w-32 mt-1" />
                      </div>
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50 border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">{t("payments.current_month")}</p>
                        <Skeleton className="h-[30px] w-24 mt-1" />
                        <Skeleton className="h-[16px] w-32 mt-1" />
                      </div>
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50 border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">{t("payments.pending_payments")}</p>
                        <Skeleton className="h-[30px] w-24 mt-1" />
                        <Skeleton className="h-[16px] w-32 mt-1" />
                      </div>
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50 border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">{t("payments.invoices_issued")}</p>
                        <Skeleton className="h-[30px] w-24 mt-1" />
                        <Skeleton className="h-[16px] w-32 mt-1" />
                      </div>
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <StatCard
                  title={t("payments.total_received")}
                  value={formatCurrency(statsResult.stats?.totalReceived || 0)}
                  trend={{
                    value: statsResult.stats?.totalReceivedChange || 0,
                    label: t("dashboard.from_last_month")
                  }}
                  icon={<DollarSign className="h-6 w-6 text-primary" />}
                />

                <StatCard
                  title={t("payments.current_month")}
                  value={formatCurrency(statsResult.stats?.currentMonthPayments || 0)}
                  trend={{
                    value: statsResult.stats?.currentMonthChange || 0,
                    label: t("dashboard.from_last_month")
                  }}
                  icon={<CreditCard className="h-6 w-6 text-primary" />}
                />

                <StatCard
                  title={t("payments.pending_payments")}
                  value={formatCurrency(statsResult.stats?.pendingPayments || 0)}
                  trend={{
                    value: statsResult.stats?.pendingChange || 0,
                    label: t("dashboard.from_last_month")
                  }}
                  icon={<CreditCard className="h-6 w-6 text-primary" />}
                />

                <StatCard
                  title={t("payments.invoices_issued")}
                  value={statsResult.stats?.invoicesIssued || 0}
                  trend={{
                    value: statsResult.stats?.invoicesChange || 0,
                    label: t("dashboard.from_last_month")
                  }}
                  icon={<CreditCard className="h-6 w-6 text-primary" />}
                />
              </>
            )}
      </div>

      {/* Payments Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{t("payments.all_transactions")}</h3>
        <div className="flex items-center gap-4">
              {/* Filter Pills */}
              <ToggleGroup 
                type="single" 
                value={filterStatus}
                onValueChange={(value) => {
                  if (value) {
                    setFilterStatus(value)
                    setCurrentPage(1)
                  }
                }}
              >
                <ToggleGroupItem value="all">{t("payments.filter_all")}</ToggleGroupItem>
                <ToggleGroupItem value="paid">{t("payments.filter_paid")}</ToggleGroupItem>
                <ToggleGroupItem value="unpaid">{t("payments.filter_unpaid")}</ToggleGroupItem>
              </ToggleGroup>
              
              <div className="relative w-80">
                <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder={t("payments.search_placeholder")} 
                  className="pe-10"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="h-12 text-start font-medium w-[16%]">
                {t("payments.table.invoice_number")}
              </TableHead>
              <TableHead className="h-12 text-start font-medium w-[20%]">
                {t("payments.table.store")}
              </TableHead>
              <TableHead className="h-12 text-start font-medium w-[16%]">
                {t("payments.table.date")}
              </TableHead>
              <TableHead className="h-12 text-start font-medium w-[15%]">
                {t("payments.table.amount")}
              </TableHead>
              <TableHead className="h-12 text-start font-medium w-[13%]">
                {t("payments.table.method")}
              </TableHead>
              <TableHead className="h-12 text-start font-medium w-[12%]">
                {t("payments.table.status")}
              </TableHead>
              <TableHead className="h-12 text-start font-medium w-[8%]">
                {t("payments.table.options")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!hasInitialData || paymentsResult === undefined || isSearching ? (
              // Loading state - show skeletons
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`loading-${index}`} className="h-[72px]">
                  <TableCell className="py-3 w-[16%]"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="py-3 w-[20%]"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="py-3 w-[16%]"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="py-3 w-[15%]"><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="py-3 w-[13%]"><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell className="py-3 w-[12%]"><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell className="py-3 w-[8%]"><Skeleton className="h-8 w-8 rounded" /></TableCell>
                </TableRow>
              ))
            ) : payments.length > 0 ? (
              <>
                {payments.map((payment, index) => (
                  <TableRow 
                    key={payment.invoiceNumber}
                    className={`h-[72px] ${index < payments.length - 1 ? 'border-b' : ''}`}
                  >
                    <TableCell className="py-3 font-medium w-[16%]">{payment.invoiceNumber}</TableCell>
                    <TableCell className="py-3 w-[20%]">{payment.store}</TableCell>
                          <TableCell className="py-3 text-muted-foreground w-[16%]">
                            {formatDate(payment.date, language, 'long')}
                    </TableCell>
                    <TableCell className="py-3 font-medium w-[15%]">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell className="py-3 w-[13%]">
                            <Badge variant="outline" className="font-normal">
                              {t(`payments.method.${payment.method}`)}
                            </Badge>
                    </TableCell>
                    <TableCell className="py-3 w-[12%]">
                            <Badge
                              variant={getStatusVariant(payment.status)}
                              className="font-normal"
                            >
                              {t(`payments.status.${payment.status}`)}
                            </Badge>
                    </TableCell>
                    <TableCell className="py-3 w-[8%]">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t("common.view_details")}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Fill remaining rows to always show 5 rows */}
                {payments.length < 5 && Array.from({ length: 5 - payments.length }).map((_, index) => (
                  <TableRow key={`filler-${index}`} className="h-[72px]">
                    <TableCell className="py-3" colSpan={7}></TableCell>
                  </TableRow>
                ))}
              </>
            ) : (
              // Empty state - centered view with fixed height
              <TableRow>
                <TableCell colSpan={7} className="h-[360px] text-center">
                        <div className="flex h-full w-full items-center justify-center">
                          <div className="flex flex-col items-center gap-1 py-10">
                            <CreditCard className="h-10 w-10 text-muted-foreground/40 mb-2" />
                            <h3 className="font-medium">
                              {searchQuery || filterStatus !== "all" 
                                ? t("payments.no_results")
                                : t("payments.no_payments")}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {searchQuery || filterStatus !== "all"
                                ? t("payments.try_different_filter")
                                : t("payments.payments_will_appear_here")}
                            </p>
                            {(searchQuery || filterStatus !== "all") && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="mt-4"
                                onClick={() => {
                                  setSearchQuery("")
                                  setFilterStatus("all")
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
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
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
    </div>
  )
}