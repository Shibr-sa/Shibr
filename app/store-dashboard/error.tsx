"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RefreshCw, LayoutDashboard } from "lucide-react"
import { useLanguage } from "@/contexts/localization-context"
import { useRouter } from "next/navigation"

export default function StoreDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t, direction } = useLanguage()
  const router = useRouter()

  useEffect(() => {
    console.error("Store Dashboard Error:", error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4" dir={direction}>
      <Card className="max-w-lg w-full border-0 shadow-2xl bg-card/95 backdrop-blur">
        <div className="p-8 space-y-6">
          {/* Error Title and Description */}
          <div className="text-center space-y-3">
            <h2 className={`text-2xl font-bold ${direction === "rtl" ? "font-cairo" : "font-inter"}`}>
              {t("error.store_dashboard_title")}
            </h2>
            <p className={`text-muted-foreground leading-relaxed ${direction === "rtl" ? "font-cairo" : "font-inter"}`}>
              {t("error.store_dashboard_description")}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={reset}
              className="w-full h-12 gap-2 shadow-sm hover:shadow-md transition-all"
              size="lg"
            >
              <RefreshCw className="h-4 w-4" />
              {t("error.try_again")}
            </Button>
            <Button 
              onClick={() => router.push("/store-dashboard")} 
              variant="outline"
              className="w-full h-12 gap-2 shadow-sm hover:shadow-md transition-all"
              size="lg"
            >
              <LayoutDashboard className="h-4 w-4" />
              {t("error.go_dashboard")}
            </Button>
          </div>

          {/* Error Details for Development */}
          {process.env.NODE_ENV === "development" && error.message && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                {t("error.details")}
              </summary>
              <pre className="mt-2 p-4 bg-muted/50 rounded-lg text-xs overflow-auto text-muted-foreground">
                {error.message}
                {error.stack && "\n\n" + error.stack}
              </pre>
            </details>
          )}
        </div>
      </Card>
    </div>
  )
}