"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Home, ArrowLeft } from "lucide-react"
import { useLanguage } from "@/contexts/localization-context"
import { useRouter } from "next/navigation"

export default function NotFound() {
  const { t, direction } = useLanguage()
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20" dir={direction}>
      <Card className="max-w-lg w-full border-0 shadow-2xl bg-card/95 backdrop-blur">
        <div className="p-8 space-y-6">
          {/* Animated 404 */}
          <div className="flex justify-center">
            <h1 className="text-8xl font-bold bg-gradient-to-br from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              {t("404.title")}
            </h1>
          </div>

          {/* Title and Description */}
          <div className="text-center space-y-3">
            <h2 className={`text-2xl font-bold ${
              direction === "rtl" ? "font-cairo" : "font-inter"
            }`}>
              {t("404.subtitle")}
            </h2>
            <p className={`text-muted-foreground leading-relaxed ${
              direction === "rtl" ? "font-cairo" : "font-inter"
            }`}>
              {t("404.description")}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={() => router.push("/")}
              className="w-full h-12 gap-2 shadow-sm hover:shadow-md transition-all"
              size="lg"
            >
              <Home className="h-4 w-4" />
              {t("404.go_home")}
            </Button>
            <Button 
              onClick={() => router.back()}
              variant="outline"
              className="w-full h-12 gap-2 shadow-sm hover:shadow-md transition-all"
              size="lg"
            >
              <ArrowLeft className={`h-4 w-4 ${direction === "rtl" ? "rotate-180" : ""}`} />
              {t("common.back")}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}