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
  Eye,
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

  // Fetch shelf store for this rental
  const shelfStore = useQuery(
    api.shelfStores.getShelfStoreByRental,
    { rentalRequestId }
  )

  // Analytics are now directly on the shelfStore object

  // Generate QR code when store is loaded
  useEffect(() => {
    const generateQR = async () => {
      if (shelfStore?.qrCodeUrl && !qrCodeDataUrl) {
        try {
          const dataUrl = await QRCode.toDataURL(shelfStore.qrCodeUrl, {
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
  }, [shelfStore?.qrCodeUrl])

  const handleCopyLink = async () => {
    if (!shelfStore?.qrCodeUrl) return

    try {
      await navigator.clipboard.writeText(shelfStore.qrCodeUrl)
      toast({
        title: t("qr_stores.link_copied"),
        description: shelfStore.qrCodeUrl,
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
    if (!qrCodeDataUrl || !shelfStore) return

    const link = document.createElement("a")
    link.download = `qr-${shelfStore.storeSlug}.png`
    link.href = qrCodeDataUrl
    link.click()
  }

  const handleViewStore = () => {
    if (!shelfStore?.qrCodeUrl) return
    window.open(shelfStore.qrCodeUrl, "_blank")
  }

  if (!shelfStore) {
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
              <div className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                <code className="flex-1 truncate">
                  {shelfStore.qrCodeUrl}
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
                  <Eye className="h-4 w-4 me-2" />
                  {t("qr_stores.view_qr")}
                </Button>
              </div>
            </div>
          </div>

          {/* Analytics */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <ScanLine className="h-4 w-4" />
                  <span className="text-xs">{t("qr_stores.scans")}</span>
                </div>
                <p className="text-2xl font-bold">
                  {shelfStore.totalScans || 0}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span className="text-xs">{t("qr_stores.views")}</span>
                </div>
                <p className="text-2xl font-bold">
                  {shelfStore.totalViews || 0}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="text-xs">{t("qr_stores.orders")}</span>
                </div>
                <p className="text-2xl font-bold">
                  {shelfStore.totalOrders || 0}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">{t("qr_stores.revenue")}</span>
                </div>
                <p className="text-xl font-bold">
                  {formatCurrency(shelfStore.totalRevenue || 0, language)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("qr_stores.qr_code_ready")}</DialogTitle>
            <DialogDescription>
              {t("qr_stores.qr_code_ready_description")}
            </DialogDescription>
          </DialogHeader>

          {qrCodeDataUrl && shelfStore && (
            <div className="space-y-4">
              <div className="bg-white p-8 rounded-lg flex items-center justify-center">
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  {t("qr_stores.store_url")}:
                </p>
                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <code className="text-xs flex-1 truncate">
                    {shelfStore.qrCodeUrl}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
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
              <Download className="h-4 w-4 me-2" />
              {t("qr_stores.download_qr")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}