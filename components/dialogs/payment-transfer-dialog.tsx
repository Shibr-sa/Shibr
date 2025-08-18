"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertCircle,
  CheckCircle,
  Copy,
  CreditCard,
  Loader2,
  Building2,
  User,
  Hash,
} from "lucide-react"
import { useLanguage } from "@/contexts/localization-context"
import { cn } from "@/lib/utils"

interface PaymentTransferDialogProps {
  request: {
    _id: Id<"rental_requests">
    monthlyPrice?: number
    otherUserName?: string
    shelfName?: string
    startDate: string
    endDate: string
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPaymentConfirmed?: () => void
}

export function PaymentTransferDialog({
  request,
  open,
  onOpenChange,
  onPaymentConfirmed,
}: PaymentTransferDialogProps) {
  const { t, language, direction } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const [isConfirming, setIsConfirming] = useState(false)
  
  // Mutation to confirm payment
  const confirmPayment = useMutation(api.rentalRequests.confirmPayment)
  
  // Admin bank account details (in production, fetch from settings)
  const bankDetails = {
    bankName: language === "ar" ? "بنك الراجحي" : "Al Rajhi Bank",
    accountName: language === "ar" ? "منصة شبر المحدودة" : "Shibr Platform Ltd",
    iban: "SA1234567890123456789012",
    amount: request?.monthlyPrice || 0,
  }
  
  const handleCopyIban = async () => {
    try {
      await navigator.clipboard.writeText(bankDetails.iban)
      toast({
        title: t("payment.iban_copied"),
        description: bankDetails.iban,
      })
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("payment.copy_failed"),
        variant: "destructive",
      })
    }
  }
  
  const handleConfirmPayment = async () => {
    if (!request?._id) return
    
    setIsConfirming(true)
    try {
      // Update the request status to active
      await confirmPayment({
        requestId: request._id,
        paymentAmount: bankDetails.amount,
      })
      
      // Show success message
      toast({
        title: t("payment.confirmation_success_title"),
        description: t("payment.confirmation_success_description"),
      })
      
      // Call the callback if provided
      onPaymentConfirmed?.()
      
      // Close the dialog
      onOpenChange(false)
      
      // Refresh the page to update the table
      router.refresh()
    } catch (error) {
      console.error("Payment confirmation error:", error)
      toast({
        title: t("common.error"),
        description: t("payment.confirmation_failed"),
        variant: "destructive",
      })
    } finally {
      setIsConfirming(false)
    }
  }
  
  if (!request) return null
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {t("payment.bank_transfer_title")}
          </DialogTitle>
          <DialogDescription>
            {t("payment.transfer_instructions")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Rental Details */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("payment.store_name")}</span>
              <span className="font-medium">{request.otherUserName || "-"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("payment.shelf_name")}</span>
              <span className="font-medium">{request.shelfName || "-"}</span>
            </div>
          </div>
          
          {/* Amount to Pay */}
          <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
            <p className="text-sm text-muted-foreground mb-1">
              {t("payment.amount_due")}
            </p>
            <p className="text-2xl font-bold text-primary">
              {language === "ar" 
                ? `${bankDetails.amount} ${t("common.currency")}`
                : `${t("common.currency")} ${bankDetails.amount}`
              }
            </p>
          </div>
          
          {/* Bank Account Details */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              {t("payment.transfer_to")}
            </h4>
            
            <div className="border rounded-lg p-4 space-y-3 bg-background">
              {/* Bank Name */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t("payment.bank_name")}
                </span>
                <span className="font-medium">{bankDetails.bankName}</span>
              </div>
              
              {/* Account Name */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {t("payment.account_name")}
                </span>
                <span className="font-medium">{bankDetails.accountName}</span>
              </div>
              
              {/* IBAN */}
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {t("payment.iban")}
                </span>
                <div className="flex items-center gap-2">
                  <code className={cn(
                    "flex-1 font-mono text-sm bg-muted px-3 py-2 rounded",
                    direction === "rtl" ? "text-left" : "text-right",
                    "select-all"
                  )}>
                    {bankDetails.iban}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 flex-shrink-0"
                    onClick={handleCopyIban}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Important Notice */}
          <Alert className="border-warning bg-warning/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t("payment.transfer_notice")}
            </AlertDescription>
          </Alert>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConfirming}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleConfirmPayment}
            disabled={isConfirming}
            className="bg-green-600 hover:bg-green-700"
          >
            {isConfirming ? (
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 me-2" />
            )}
            {t("payment.confirm_transfer_completed")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}