"use client"

import { useState, useEffect } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/contexts/localization-context"
import { formatCurrency } from "@/lib/formatters"
import { StatCard } from "@/components/ui/stat-card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  QrCode,
  Download,
  Copy,
  ExternalLink,
  TrendingUp,
  ShoppingCart,
  ScanLine,
  Loader2
} from "lucide-react"
import QRCode from "qrcode"

interface QRStoreCardProps {
  rentalRequestId: Id<"rentalRequests">
  className?: string
}

export function QRStoreCard({ rentalRequestId, className }: QRStoreCardProps) {
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [showQRDialog, setShowQRDialog] = useState(false)

  // Fetch rental request to get branch information
  const rentalRequest = useQuery(
    api.rentalRequests.getRentalRequestById,
    { requestId: rentalRequestId }
  )

  // Branch store data (QR code and analytics are now at branch level)
  const branchStore = rentalRequest?.branchStore

  // Generate QR code when store is loaded
  useEffect(() => {
    const generateQR = async () => {
      if (branchStore?.qrCodeUrl && !qrCodeDataUrl) {
        try {
          const dataUrl = await QRCode.toDataURL(branchStore.qrCodeUrl, {
            width: 400,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
            errorCorrectionLevel: "H",
          })
          setQrCodeDataUrl(dataUrl)
        } catch (error) {
          console.error("Failed to generate QR code:", error)
        }
      }
    }
    generateQR()
  }, [branchStore?.qrCodeUrl, qrCodeDataUrl])

  const handleCopyLink = async () => {
    if (!branchStore?.qrCodeUrl) return

    try {
      await navigator.clipboard.writeText(branchStore.qrCodeUrl)
      toast({
        title: t("qr_stores.link_copied"),
        description: branchStore.qrCodeUrl,
      })
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("qr_stores.copy_failed"),
        variant: "destructive",
      })
    }
  }

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl || !branchStore) return

    const link = document.createElement("a")
    link.download = `qr-${branchStore._id}.png`
    link.href = qrCodeDataUrl
    link.click()
  }

  const handleViewStore = () => {
    if (!branchStore?.qrCodeUrl) return
    window.open(branchStore.qrCodeUrl, "_blank")
  }

  if (!branchStore) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              {t("qr_stores.qr_store")}
            </CardTitle>
            <CardDescription>
              {t("qr_stores.qr_store_description")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code Preview */}
          <div className="flex items-center gap-4">
            <div className="bg-white p-4 rounded-lg border">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code"
                  className="w-32 h-32 cursor-pointer"
                  onClick={() => setShowQRDialog(true)}
                />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              {/* Store URL */}
              <div className="flex items-center gap-2 p-2 bg-muted rounded text-sm overflow-hidden">
                <code className="flex-1 truncate overflow-hidden text-ellipsis whitespace-nowrap block">
                  {branchStore.qrCodeUrl}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={handleCopyLink}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleViewStore}
                >
                  <ExternalLink className="h-4 w-4 me-2" />
                  {t("qr_stores.view_store")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowQRDialog(true)}
                  disabled={!qrCodeDataUrl}
                >
                  <QrCode className="h-4 w-4 me-2" />
                  {t("qr_stores.view_qr")}
                </Button>
              </div>
            </div>
          </div>

          {/* Analytics */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              title={t("qr_stores.scans")}
              value={branchStore.totalScans || 0}
              icon={<ScanLine className="h-5 w-5 text-primary" />}
              className="bg-background border"
            />
            <StatCard
              title={t("qr_stores.orders")}
              value={branchStore.totalOrders || 0}
              icon={<ShoppingCart className="h-5 w-5 text-primary" />}
              className="bg-background border"
            />
            <StatCard
              title={t("qr_stores.revenue")}
              value={formatCurrency(branchStore.totalRevenue || 0, language)}
              icon={<TrendingUp className="h-5 w-5 text-primary" />}
              className="bg-background border"
            />
          </div>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>{t("qr_stores.qr_code_ready")}</DialogTitle>
            <DialogDescription>
              {t("qr_stores.qr_code_ready_description")}
            </DialogDescription>
          </DialogHeader>

          {qrCodeDataUrl && branchStore && (
            <div className="space-y-4 overflow-hidden">
              <div className="bg-white p-4 rounded-lg flex items-center justify-center">
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code"
                  className="w-48 h-48 sm:w-64 sm:h-64"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 p-2 bg-muted rounded min-w-0">
                  <code className="text-xs flex-1 truncate min-w-0 block">
                    {branchStore.qrCodeUrl}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0"
                    onClick={handleCopyLink}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowQRDialog(false)}
            >
              {t("common.close")}
            </Button>
            <Button onClick={handleDownloadQR}>
              {t("qr_stores.download_qr")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}