"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/localization-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileDown, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ClearanceDocumentDownloadProps {
  documentId: string | undefined
  rentalId: string
}

export function ClearanceDocumentDownload({
  documentId,
  rentalId,
}: ClearanceDocumentDownloadProps) {
  const { t } = useLanguage()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (!documentId) {
      toast.error(t("clearances.document.notGenerated"))
      return
    }

    setIsDownloading(true)

    try {
      // Fetch document from Convex storage
      const url = `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${documentId}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Failed to download document")
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)

      // Create download link
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `clearance-${rentalId}-${Date.now()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Cleanup
      window.URL.revokeObjectURL(downloadUrl)

      toast.success(t("clearances.document.downloadSuccess"))
    } catch (error) {
      console.error("Error downloading document:", error)
      toast.error(t("clearances.document.downloadError"))
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileDown className="h-5 w-5" />
          {t("clearances.document.title")}
        </CardTitle>
        <CardDescription>
          {t("clearances.document.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {documentId ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("clearances.document.ready")}
            </p>
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full sm:w-auto"
            >
              {isDownloading && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              <FileDown className="h-4 w-4 me-2" />
              {t("clearances.document.download")}
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {t("clearances.document.notReady")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
