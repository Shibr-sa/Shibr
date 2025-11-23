"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/localization-context"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ClearanceStatusBadge } from "@/components/clearances/ClearanceStatusBadge"
import { toast } from "sonner"
import { Loader2, AlertTriangle, Settings } from "lucide-react"

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

interface ClearanceStatusManagementProps {
  clearanceId: Id<"rentalClearances">
  rentalId: Id<"rentalRequests">
  currentStatus: ClearanceStatus | undefined
  onSuccess?: () => void
}

export function ClearanceStatusManagement({
  clearanceId,
  rentalId,
  currentStatus,
  onSuccess,
}: ClearanceStatusManagementProps) {
  const { t, direction } = useLanguage()
  const [newStatus, setNewStatus] = useState<ClearanceStatus | "">("")
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const updateStatus = useMutation(api.admin.clearances.updateClearanceStatus)

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

  const handleSubmit = async () => {
    if (!newStatus || !reason.trim()) {
      toast.error(t("clearances.statusManagement.reasonRequired"))
      return
    }

    setIsUpdating(true)

    try {
      await updateStatus({
        clearanceId,
        rentalRequestId: rentalId,
        newStatus: newStatus as ClearanceStatus,
        reason,
        notes: notes || undefined,
      })

      toast.success(t("clearances.statusManagement.success"))

      // Reset form
      setNewStatus("")
      setReason("")
      setNotes("")
      setDialogOpen(false)

      onSuccess?.()
    } catch (error) {
      console.error("Error updating clearance status:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : t("clearances.statusManagement.error")
      )
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className="border-red-200 dark:border-red-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {t("clearances.statusManagement.title")}
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          {t("clearances.statusManagement.warning")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
          <span className="text-sm font-medium">
            {t("clearances.statusManagement.currentStatus")}:
          </span>
          <ClearanceStatusBadge status={currentStatus} />
        </div>

        {/* Status Change Form */}
        <div className="space-y-4 pt-2">
          {/* New Status Select */}
          <div className="space-y-2">
            <Label htmlFor="newStatus">
              {t("clearances.statusManagement.newStatus")}
              <span className="text-red-500">*</span>
            </Label>
            <Select
              dir={direction}
              value={newStatus}
              onValueChange={(value) => setNewStatus(value as ClearanceStatus)}
              disabled={isUpdating}
            >
              <SelectTrigger id="newStatus">
                <SelectValue placeholder={t("clearances.statusManagement.selectStatus")} />
              </SelectTrigger>
              <SelectContent dir={direction}>
                {allStatuses.map((status) => (
                  <SelectItem
                    key={status}
                    value={status}
                    disabled={status === currentStatus}
                  >
                    {t(`clearances.status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              {t("clearances.statusManagement.reason")}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("clearances.statusManagement.reasonPlaceholder")}
              disabled={isUpdating}
              className={direction === "rtl" ? "text-right" : ""}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              {t("clearances.statusManagement.notes")}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("clearances.statusManagement.notesPlaceholder")}
              rows={3}
              disabled={isUpdating}
              className={direction === "rtl" ? "text-right" : ""}
            />
          </div>

          {/* Submit with Confirmation */}
          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={!newStatus || !reason.trim()}
                className="w-full"
              >
                <AlertTriangle className="h-4 w-4 me-2" />
                {t("clearances.statusManagement.updateStatus")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir={direction}>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("clearances.statusManagement.confirmTitle")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("clearances.statusManagement.confirmDescription")}
                  <div className="mt-4 p-3 bg-muted rounded-md space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t("clearances.statusManagement.from")}:</span>
                      <ClearanceStatusBadge status={currentStatus} />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t("clearances.statusManagement.to")}:</span>
                      <ClearanceStatusBadge status={newStatus as ClearanceStatus} />
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit} disabled={isUpdating}>
                  {isUpdating && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                  {t("common.confirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}
