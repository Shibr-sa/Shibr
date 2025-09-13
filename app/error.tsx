"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RefreshCw, Home, AlertCircle } from "lucide-react"
import { useLanguage } from "@/contexts/localization-context"
import { useSearchParams } from "next/navigation"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t, direction } = useLanguage()
  const searchParams = useSearchParams()
  const showDebug = searchParams.get("debug") === "true"

  useEffect(() => {
    console.error("Error boundary caught:", error)
    console.error("Error message:", error.message)
    console.error("Error stack:", error.stack)
    console.error("Error digest:", error.digest)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20" dir={direction}>
      <Card className="max-w-lg w-full border-0 shadow-2xl bg-card/95 backdrop-blur">
        <div className="p-8 space-y-6">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>

          {/* Error Title and Description */}
          <div className="text-center space-y-3">
            <h1 className={`text-3xl font-bold ${
              direction === "rtl" ? "font-cairo" : "font-inter"
            }`}>
              {t("error.title")}
            </h1>
            <p className={`text-muted-foreground leading-relaxed ${
              direction === "rtl" ? "font-cairo" : "font-inter"
            }`}>
              {t("error.description")}
            </p>

            {/* Show error name in production for better debugging */}
            {error.name && error.name !== "Error" && (
              <p className="text-sm text-muted-foreground font-mono">
                Error Type: {error.name}
              </p>
            )}

            {/* Show digest if available */}
            {error.digest && (
              <p className="text-xs text-muted-foreground font-mono">
                Error ID: {error.digest}
              </p>
            )}
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
              onClick={() => window.location.href = "/"} 
              variant="outline"
              className="w-full h-12 gap-2 shadow-sm hover:shadow-md transition-all"
              size="lg"
            >
              <Home className="h-4 w-4" />
              {t("error.go_home")}
            </Button>
          </div>

          {/* Error Details - Show in development or with debug query param */}
          {(process.env.NODE_ENV === "development" || showDebug) && error.message && (
            <details className="mt-4" open={showDebug}>
              <summary className="cursor-pointer text-sm text-muted-foreground">
                {t("error.details")}
              </summary>
              <pre className="mt-2 p-4 bg-muted/50 rounded-lg text-xs overflow-auto text-muted-foreground max-h-64">
                <strong>Message:</strong> {error.message}
                {error.stack && (
                  <>
                    {"\n\n"}
                    <strong>Stack Trace:</strong>
                    {"\n"}
                    {error.stack}
                  </>
                )}
                {error.digest && (
                  <>
                    {"\n\n"}
                    <strong>Digest:</strong> {error.digest}
                  </>
                )}
              </pre>
            </details>
          )}

          {/* Hint about debug mode in production */}
          {process.env.NODE_ENV === "production" && !showDebug && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              Add ?debug=true to URL for more details
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}