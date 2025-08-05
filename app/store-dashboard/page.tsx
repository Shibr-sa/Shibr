"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Users, BarChart, Send, PlusCircle, Info } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/contexts/language-context"

export default function StoreDashboardPage() {
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("dashboard.home")}</h1>
        <p className="text-muted-foreground">{t("dashboard.welcome")}</p>
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
                <span>{t("auth.signin")}</span>
              </div>
              <Separator className="flex-1 bg-border" />
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center">
                  <Info className="h-3 w-3" />
                </div>
                <span>{t("dashboard.complete_data")}</span>
              </div>
              <Separator className="flex-1 bg-border" />
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center text-sm font-bold">
                  !
                </div>
                <span>{t("dashboard.start_displaying_shelves")}</span>
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">{t("dashboard.thanks_for_registering")}</h2>
            <p className="text-muted-foreground mb-4">{t("dashboard.complete_data_description")}</p>
            <Button>{t("dashboard.complete_data")}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Section - Unified Card Design */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">{t("dashboard.manage_store_starts_here")}</h2>
              <p className="text-muted-foreground">{t("dashboard.monitor_performance_description")}</p>
            </div>
            <Button className="gap-1">
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
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("dashboard.new_rental_requests")}</CardTitle>
            <Link href="#" className="text-sm text-primary">
              {t("dashboard.see_more")}
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
            <p className="text-muted-foreground">{t("dashboard.no_rental_requests")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("dashboard.your_shelves")}</CardTitle>
            <Link href="#" className="text-sm text-primary">
              {t("dashboard.see_more")}
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
            <p className="text-muted-foreground mb-2">{t("dashboard.no_shelves_displayed")}</p>
            <Button variant="link" className="text-primary gap-1">
              <PlusCircle className="h-4 w-4" />
              {t("dashboard.display_shelf_now")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
