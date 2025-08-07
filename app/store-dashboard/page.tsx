"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Users, BarChart, Send, PlusCircle, AlertTriangle, ArrowRight, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/contexts/language-context"
import { useRouter } from "next/navigation"
import { useStoreData } from "@/contexts/store-data-context"

export default function StoreDashboardPage() {
  const { t, direction } = useLanguage()
  const router = useRouter()
  
  // Use the global store data context
  const { isLoading, isStoreDataComplete } = useStoreData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("dashboard.home")}</h1>
        <p className="text-muted-foreground">{t("dashboard.welcome")}</p>
      </div>

      {/* Data Completion Warning - Only show if loaded and data is incomplete */}
      {!isLoading && !isStoreDataComplete && (
        <Alert className="border-destructive/50 bg-destructive/10 [&>svg]:top-1/2 [&>svg]:-translate-y-1/2 [&>svg+div]:translate-y-0">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <AlertTitle className="text-destructive font-semibold mb-0">
                {t("dashboard.incomplete_profile_warning")}
              </AlertTitle>
              <AlertDescription className="mt-1">
                <span className="text-muted-foreground">
                  {t("dashboard.complete_data_description")}
                </span>
              </AlertDescription>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => router.push("/store-dashboard/settings")}
              className="gap-2 ms-4 flex-shrink-0"
            >
              {t("dashboard.complete_profile_now")}
              {direction === "rtl" ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </Alert>
      )}

      {/* Stats Section - Unified Card Design */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">{t("dashboard.manage_store_starts_here")}</h2>
              <p className="text-muted-foreground">{t("dashboard.monitor_performance_description")}</p>
            </div>
            <Button 
              className="gap-1" 
              disabled={isLoading || !isStoreDataComplete}
              title={!isStoreDataComplete && !isLoading ? t("dashboard.complete_profile_first") : ""}
            >
              <PlusCircle className="h-4 w-4" />
              {t("dashboard.display_shelf_now")}
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium">{t("dashboard.currently_rented_brands")}</h3>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">{t("dashboard.increase_from_last_month")}</p>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium">{t("dashboard.total_sales")}</h3>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">{t("dashboard.increase_from_last_month")}</p>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium">{t("dashboard.incoming_orders")}</h3>
                <Send className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">{t("dashboard.increase_from_last_month")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty States */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("dashboard.new_rental_requests")}</CardTitle>
            <Link 
              href="#" 
              className={`text-sm ${!isLoading && isStoreDataComplete ? 'text-primary' : 'text-muted-foreground pointer-events-none'}`}
              onClick={isLoading || !isStoreDataComplete ? (e: React.MouseEvent) => e.preventDefault() : undefined}
            >
              {t("dashboard.see_more")}
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center h-64">
            <Image
              src="/empty_orders.svg"
              alt="Empty orders"
              width={100}
              height={100}
              className="mb-4"
            />
            <p className="text-muted-foreground">{t("dashboard.no_rental_requests")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("dashboard.your_shelves")}</CardTitle>
            <Link 
              href="#" 
              className={`text-sm ${!isLoading && isStoreDataComplete ? 'text-primary' : 'text-muted-foreground pointer-events-none'}`}
              onClick={isLoading || !isStoreDataComplete ? (e: React.MouseEvent) => e.preventDefault() : undefined}
            >
              {t("dashboard.see_more")}
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center h-64">
            <Image
              src="/empty_shelves.svg"
              alt="Empty shelves"
              width={100}
              height={100}
              className="mb-4"
            />
            <p className="text-muted-foreground mb-2">{t("dashboard.no_shelves_displayed")}</p>
            <Button 
              variant="link" 
              className="text-primary gap-1"
              disabled={isLoading || !isStoreDataComplete}
              title={!isStoreDataComplete && !isLoading ? t("dashboard.complete_profile_first") : ""}
            >
              <PlusCircle className="h-4 w-4" />
              {t("dashboard.display_shelf_now")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
