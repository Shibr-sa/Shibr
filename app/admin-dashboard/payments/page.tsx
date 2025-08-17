"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useLanguage } from "@/contexts/localization-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  
  // Fetch real data from Convex
  const paymentsResult = useQuery(api.admin.getPayments, {
    searchQuery,
    status: filterStatus,
    page: currentPage,
    limit: itemsPerPage,
  })
  
  const paymentsData = paymentsResult?.payments || []

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

  const formatDate = (date: string) => {
    // Use the date as-is from the backend, properly formatted
    return date
  }

  // Use data from Convex query
  const filteredPayments = paymentsData
  const totalPages = paymentsResult?.totalPages || 1
  const paginatedPayments = paymentsData

  return (
    <div className="space-y-6">
      {/* Header Card with Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{t("payments.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              title={t("payments.total_received")}
              value={formatCurrency(paymentsResult?.stats?.totalReceived || 0)}
              trend={{
                value: paymentsResult?.stats?.totalReceivedChange || 0,
                label: t("dashboard.from_last_month")
              }}
              icon={<DollarSign className="h-6 w-6 text-primary" />}
            />

            <StatCard
              title={t("payments.current_month")}
              value={formatCurrency(paymentsResult?.stats?.currentMonthPayments || 0)}
              trend={{
                value: paymentsResult?.stats?.currentMonthChange || 0,
                label: t("dashboard.from_last_month")
              }}
              icon={<CreditCard className="h-6 w-6 text-primary" />}
            />

            <StatCard
              title={t("payments.pending_payments")}
              value={formatCurrency(paymentsResult?.stats?.pendingPayments || 0)}
              trend={{
                value: paymentsResult?.stats?.pendingChange || 0,
                label: t("dashboard.from_last_month")
              }}
              icon={<CreditCard className="h-6 w-6 text-primary" />}
            />

            <StatCard
              title={t("payments.invoices_issued")}
              value={paymentsResult?.stats?.invoicesIssued || 0}
              trend={{
                value: paymentsResult?.stats?.invoicesChange || 0,
                label: t("dashboard.from_last_month")
              }}
              icon={<CreditCard className="h-6 w-6 text-primary" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle className="text-xl font-semibold">{t("payments.all_transactions")}</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <div className="min-h-[420px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="h-12 text-start font-medium">
                      {t("payments.table.invoice_number")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("payments.table.merchant")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("payments.table.store")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("payments.table.date")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("payments.table.amount")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("payments.table.percentage")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("payments.table.method")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("payments.table.status")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("payments.table.options")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPayments.length > 0 ? (
                    <>
                      {paginatedPayments.map((payment, index) => (
                        <TableRow 
                          key={payment.invoiceNumber}
                          className={`h-[72px] ${index < paginatedPayments.length - 1 ? 'border-b' : ''}`}
                        >
                          <TableCell className="py-3 font-medium">{payment.invoiceNumber}</TableCell>
                          <TableCell className="py-3 text-muted-foreground">
                            {payment.merchant}
                          </TableCell>
                          <TableCell className="py-3">{payment.store}</TableCell>
                          <TableCell className="py-3 text-muted-foreground">
                            {formatDate(payment.date)}
                          </TableCell>
                          <TableCell className="py-3 font-medium">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell className="py-3 text-muted-foreground">{payment.percentage}%</TableCell>
                          <TableCell className="py-3">
                            <Badge variant="outline" className="font-normal">
                              {t(`payments.method.${payment.method}`)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge
                              variant={getStatusVariant(payment.status)}
                              className="font-normal"
                            >
                              {t(`payments.status.${payment.status}`)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3">
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
                      {/* Fill remaining rows if less than 5 items */}
                      {paginatedPayments.length < itemsPerPage && Array.from({ length: itemsPerPage - paginatedPayments.length }).map((_, index) => (
                        <TableRow key={`filler-${index}`} className={`h-[72px] ${index < itemsPerPage - paginatedPayments.length - 1 ? 'border-b' : ''}`}>
                          <TableCell className="py-3"><Skeleton className="h-4 w-[80px]" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-[120px]" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-[100px]" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-[100px]" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-[80px]" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-[60px]" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-8 w-8 rounded" /></TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : (
                    // Empty state with skeleton loading
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`empty-${index}`} className="h-[72px]">
                        <TableCell className="py-3"><Skeleton className="h-4 w-[80px]" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-[120px]" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-[100px]" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-[100px]" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-[80px]" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-[60px]" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-8 w-8 rounded" /></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
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
        </CardContent>
      </Card>
    </div>
  )
}