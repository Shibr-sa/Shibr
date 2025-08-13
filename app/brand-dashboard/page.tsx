"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Package, BarChart, Store, Plus, AlertTriangle, ArrowRight, Lock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/contexts/localization-context"
import { useRouter } from "next/navigation"
import { useBrandData } from "@/contexts/brand-data-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function BrandDashboardPage() {
  const { t, direction } = useLanguage()
  const router = useRouter()
  
  // Use the brand data context for consistent state
  const { isBrandDataComplete, isLoading } = useBrandData()

  return (
    <div className="space-y-6">
      {/* Data Completion Warning - Only show if data is incomplete */}
      {isBrandDataComplete === false && (
        <Alert className="border-destructive/50 bg-destructive/10 [&>svg]:top-1/2 [&>svg]:-translate-y-1/2 [&>svg+div]:translate-y-0">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <AlertTitle className="text-destructive font-semibold mb-0">
                {t("dashboard.incomplete_profile_warning")}
              </AlertTitle>
              <AlertDescription className="mt-1">
                <span className="text-muted-foreground">
                  {t("brand.dashboard.complete_data_description")}
                </span>
              </AlertDescription>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => router.push("/brand-dashboard/settings")}
              className="gap-2 ms-4 flex-shrink-0"
            >
              {t("dashboard.complete_profile_now")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </div>
        </Alert>
      )}

      {/* Welcome Section - Integrated with Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">{t("brand.dashboard.welcome_to_shelfy")}</h2>
              <p className="text-muted-foreground">
                {t("brand.dashboard.monitor_description")}
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button 
                      className="gap-2"
                      disabled={!isBrandDataComplete}
                    >
                      {!isBrandDataComplete && <Lock className="h-4 w-4" />}
                      {isBrandDataComplete && <Plus className="h-4 w-4" />}
                      {t("brand.dashboard.rent_new_shelf")}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!isBrandDataComplete && (
                  <TooltipContent>
                    <p>{t("brand.dashboard.complete_profile_to_enable")}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Stats Section - Integrated within same card */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">{t("brand.dashboard.displayed_products_count")}</span>
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">{t("brand.dashboard.increase_from_last_month")}</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">{t("brand.dashboard.total_sales")}</span>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">{t("brand.dashboard.increase_from_last_month")}</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">{t("brand.dashboard.rented_shelves_count")}</span>
                <Store className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">{t("brand.dashboard.increase_from_last_month")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty States */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("brand.dashboard.sales")}</CardTitle>
            {isBrandDataComplete ? (
              <Link href="#" className="text-sm text-primary">
                {t("brand.dashboard.see_more")}
              </Link>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm text-muted-foreground cursor-not-allowed flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      {t("brand.dashboard.see_more")}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("brand.dashboard.complete_profile_to_enable")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center h-64">
            <Image
              src="/placeholder.svg?height=100&width=100"
              alt="Empty state"
              width={100}
              height={100}
              className="mb-4"
            />
            <p className="text-muted-foreground">{t("brand.dashboard.no_sales_yet")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("brand.dashboard.your_rented_shelves")}</CardTitle>
            {isBrandDataComplete ? (
              <Link href="#" className="text-sm text-primary">
                {t("brand.dashboard.see_more")}
              </Link>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm text-muted-foreground cursor-not-allowed flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      {t("brand.dashboard.see_more")}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("brand.dashboard.complete_profile_to_enable")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center h-64">
            <Image
              src="/placeholder.svg?height=100&width=100"
              alt="Empty state"
              width={100}
              height={100}
              className="mb-4"
            />
            <p className="text-muted-foreground mb-2">{t("brand.dashboard.no_shelves_currently")}</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button 
                      variant={!isBrandDataComplete ? "outline" : "link"} 
                      className={!isBrandDataComplete ? "gap-1" : "text-primary gap-1"}
                      disabled={!isBrandDataComplete}
                    >
                      {!isBrandDataComplete && <Lock className="h-4 w-4" />}
                      {isBrandDataComplete && <Plus className="h-4 w-4" />}
                      {t("brand.dashboard.add_new_shelf")}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!isBrandDataComplete && (
                  <TooltipContent>
                    <p>{t("brand.dashboard.complete_profile_to_enable")}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>
      </div>

      {/* Latest Sales Operations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("brand.dashboard.latest_sales_operations")}</CardTitle>
          {isBrandDataComplete ? (
            <Link href="#" className="text-sm text-primary">
              {t("brand.dashboard.see_more")}
            </Link>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-sm text-muted-foreground cursor-not-allowed flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    {t("brand.dashboard.see_more")}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("brand.dashboard.complete_profile_to_enable")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center h-64">
          <Image
            src="/placeholder.svg?height=100&width=100"
            alt="Empty state"
            width={100}
            height={100}
            className="mb-4"
          />
          <p className="text-muted-foreground">{t("brand.dashboard.no_sales_operations")}</p>
        </CardContent>
      </Card>
    </div>
  )
}
