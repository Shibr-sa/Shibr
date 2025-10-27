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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
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
  Send,
  AlertCircle,
  Banknote,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAction, useMutation } from "convex/react"
import { useToast } from "@/hooks/use-toast"
import { Id } from "@/convex/_generated/dataModel"

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

  // Payout dialog state
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [selectedBankAccount, setSelectedBankAccount] = useState<any>(null)
  const [isProcessingPayout, setIsProcessingPayout] = useState(false)

  const { toast } = useToast()
  const createTransfer = useAction(api.tapTransfers.createTransfer)
  const getBankAccountsByProfile = useQuery(api.bankAccounts.getBankAccountsByProfile,
    selectedPayment?.toProfileId ? { profileId: selectedPayment.toProfileId } : "skip"
  )
  
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
  const statsResult = useQuery(api.admin.payments.getPayments, {
    searchQuery: "",
    status: "all",
    page: 1,
    limit: 1, // We only need stats, not items
  })
  
  // Fetch table data with debounced search
  const paymentsResult = useQuery(api.admin.payments.getPayments, {
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

  // Watch for selectedPayment changes to reset bank account selection
  useEffect(() => {
    setSelectedBankAccount(null)
  }, [selectedPayment])

  const totalPages = paymentsResult?.totalPages || 1

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h2 className="text-2xl font-bold">{t("payments.title")}</h2>
        <p className="text-muted-foreground mt-1">{t("payments.description")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {statsResult === undefined ? (
              <>
                {[
                  { key: 'total-received', label: t("payments.total_received"), icon: DollarSign },
                  { key: 'current-month', label: t("payments.current_month"), icon: CreditCard },
                  { key: 'pending-payments', label: t("payments.pending_payments"), icon: CreditCard },
                  { key: 'invoices-issued', label: t("payments.invoices_issued"), icon: CreditCard }
                ].map(({ key, label, icon: Icon }) => (
                  <Card key={key} className="bg-muted/50 border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">{label}</p>
                          <Skeleton className="h-[30px] w-24 mt-1" />
                          <Skeleton className="h-[16px] w-32 mt-1" />
                        </div>
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <>
                <StatCard
                  key="total-received"
                  title={t("payments.total_received")}
                  value={formatCurrency(statsResult.stats?.totalReceived || 0)}
                  trend={{
                    value: statsResult.stats?.totalReceivedChange || 0,
                    label: t("dashboard.from_last_month")
                  }}
                  icon={<DollarSign className="h-6 w-6 text-primary" />}
                />

                <StatCard
                  key="current-month"
                  title={t("payments.current_month")}
                  value={formatCurrency(statsResult.stats?.currentMonthPayments || 0)}
                  trend={{
                    value: statsResult.stats?.currentMonthChange || 0,
                    label: t("dashboard.from_last_month")
                  }}
                  icon={<CreditCard className="h-6 w-6 text-primary" />}
                />

                <StatCard
                  key="pending-payments"
                  title={t("payments.pending_payments")}
                  value={formatCurrency(statsResult.stats?.pendingPayments || 0)}
                  trend={{
                    value: statsResult.stats?.pendingChange || 0,
                    label: t("dashboard.from_last_month")
                  }}
                  icon={<CreditCard className="h-6 w-6 text-primary" />}
                />

                <StatCard
                  key="invoices-issued"
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
              
              <div className="relative w-full sm:w-80">
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
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="h-12 text-start font-medium">
                {t("payments.table.invoice_number")}
              </TableHead>
              <TableHead className="h-12 text-start font-medium hidden md:table-cell">
                {t("payments.table.store")}
              </TableHead>
              <TableHead className="h-12 text-start font-medium hidden lg:table-cell">
                {t("payments.table.date")}
              </TableHead>
              <TableHead className="h-12 text-start font-medium">
                {t("payments.table.amount")}
              </TableHead>
              <TableHead className="h-12 text-start font-medium hidden lg:table-cell">
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
            {!hasInitialData || paymentsResult === undefined || isSearching ? (
              // Loading state - show skeletons
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`loading-${index}`} className="h-[72px]">
                  <TableCell className="py-3"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="py-3 hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="py-3 hidden lg:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="py-3"><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="py-3 hidden lg:table-cell"><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell className="py-3"><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell className="py-3"><Skeleton className="h-8 w-8 rounded" /></TableCell>
                </TableRow>
              ))
            ) : payments.length > 0 ? (
              <>
                {payments.map((payment, index) => (
                  <TableRow
                    key={payment.id}
                    className={`h-[72px] ${index < payments.length - 1 ? 'border-b' : ''}`}
                  >
                    <TableCell className="py-3 font-medium">{payment.invoiceNumber}</TableCell>
                    <TableCell className="py-3 hidden md:table-cell">{payment.store}</TableCell>
                          <TableCell className="py-3 text-muted-foreground hidden lg:table-cell">
                            {formatDate(payment.date, language, 'long')}
                    </TableCell>
                    <TableCell className="py-3 font-medium">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell className="py-3 hidden lg:table-cell">
                            <Badge variant="outline" className="font-normal">
                              {t(`payments.method.${payment.method}`) || t("common.unknown")}
                            </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                            <Badge
                              variant={getStatusVariant(payment.status)}
                              className="font-normal"
                            >
                              {t(`payments.status.${payment.status}`) || t("common.unknown")}
                            </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                            <div className="flex items-center gap-1">
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

                              {/* Show payout button for completed payments without transfer */}
                              {payment.paymentStatus === "completed" &&
                               payment.type === "store_settlement" &&
                               !payment.transferStatus && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-green-600 hover:text-green-700"
                                        onClick={() => {
                                          setSelectedPayment(payment)
                                          setPayoutDialogOpen(true)
                                        }}
                                      >
                                        <Send className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{t("payments.initiate_payout")}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                    </TableCell>
                  </TableRow>
                ))}
                {Array.from({ length: Math.max(0, 5 - payments.length) }).map((_, index) => (
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

      {/* Payout Dialog */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("payments.payout.title")}</DialogTitle>
            <DialogDescription>
              {t("payments.payout.description")}
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4 py-4">
              {/* Payment Details */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("payments.payout.invoice")}:</span>
                  <span className="font-medium">{selectedPayment.invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("payments.payout.store")}:</span>
                  <span className="font-medium">{selectedPayment.store}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("payments.payout.amount")}:</span>
                  <span className="font-medium">{formatCurrency(selectedPayment.netAmount)}</span>
                </div>
              </div>

              <Separator />

              {/* Bank Account Selection */}
              <div className="space-y-2">
                <Label>{t("payments.payout.select_bank_account")}</Label>
                {getBankAccountsByProfile && getBankAccountsByProfile.length > 0 ? (
                  <div className="space-y-2">
                    {getBankAccountsByProfile.map((account) => {
                      return (
                        <div
                          key={account._id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                            selectedBankAccount?._id === account._id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                          onClick={() => setSelectedBankAccount(account)}
                        >
                        <div className="space-y-1">
                          <p className="font-medium">{account.bankName}</p>
                          <p className="text-sm text-muted-foreground">
                            {account.iban.slice(0, 4)}...{account.iban.slice(-4)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {account.accountHolderName}
                          </p>
                        </div>
                        {account.isDefault && (
                          <Badge variant="secondary">{t("payments.payout.default")}</Badge>
                        )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t("payments.payout.no_bank_account")}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPayoutDialogOpen(false)
                setSelectedPayment(null)
                setSelectedBankAccount(null)
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={async () => {
                if (!selectedPayment || !selectedBankAccount) return

                setIsProcessingPayout(true)
                try {
                  const result = await createTransfer({
                    paymentId: selectedPayment.id,
                    amount: selectedPayment.netAmount,
                    currency: "SAR",
                    description: `Payout for ${selectedPayment.invoiceNumber} to ${selectedPayment.store}`,
                    bankAccountId: selectedBankAccount._id,
                  })

                  toast({
                    title: t("payments.payout.success"),
                    description: t("payments.payout.success_message"),
                  })

                  setPayoutDialogOpen(false)
                  setSelectedPayment(null)
                  setSelectedBankAccount(null)
                } catch (error) {
                  toast({
                    title: t("payments.payout.error"),
                    description: error.message || t("payments.payout.error_message"),
                    variant: "destructive",
                  })
                } finally {
                  setIsProcessingPayout(false)
                }
              }}
              disabled={!selectedBankAccount || isProcessingPayout}
            >
              {isProcessingPayout ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("payments.payout.processing")}
                </>
              ) : (
                <>
                  <Banknote className="mr-2 h-4 w-4" />
                  {t("payments.payout.confirm")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}