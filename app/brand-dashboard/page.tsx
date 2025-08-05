"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Package, BarChart, Store, Plus, Info } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/contexts/language-context"

export default function BrandDashboardPage() {
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("brand.dashboard.home")}</h1>
        <p className="text-muted-foreground">{t("brand.dashboard.welcome")}</p>
      </div>

      {/* Onboarding Card */}
      <Card>
        <CardContent className="p-6 flex items-center gap-8">
          <Image
            src="/placeholder.svg?height=150&width=200"
            alt="Onboarding illustration"
            width={200}
            height={150}
            className="hidden md:block"
          />
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 text-primary">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  ✓
                </div>
                <span>{t("brand.dashboard.signin")}</span>
              </div>
              <Separator className="flex-1 bg-border" />
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center">
                  <Info className="h-3 w-3" />
                </div>
                <span>{t("brand.dashboard.complete_data")}</span>
              </div>
              <Separator className="flex-1 bg-border" />
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center text-sm font-bold">
                  !
                </div>
                <span>{t("brand.dashboard.start_renting")}</span>
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">{t("brand.dashboard.thanks_for_registering")}</h2>
            <p className="text-muted-foreground mb-4">
              {t("brand.dashboard.complete_data_description")}
            </p>
            <Button>{t("brand.dashboard.complete_data")}</Button>
          </div>
        </CardContent>
      </Card>

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
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t("brand.dashboard.rent_new_shelf")}
            </Button>
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
            <Link href="#" className="text-sm text-primary">
              {t("brand.dashboard.see_more")}
            </Link>
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
            <Link href="#" className="text-sm text-primary">
              {t("brand.dashboard.see_more")}
            </Link>
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
            <Button variant="link" className="text-primary gap-1">
              <Plus className="h-4 w-4" />
              {t("brand.dashboard.add_new_shelf")}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Latest Sales Operations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("brand.dashboard.latest_sales_operations")}</CardTitle>
          <Link href="#" className="text-sm text-primary">
            {t("brand.dashboard.see_more")}
          </Link>
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
