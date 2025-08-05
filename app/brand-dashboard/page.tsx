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
        <p className="text-muted-foreground">مرحبا بك في لوحة التحكم الخاصة بك</p>
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
                <span>تسجيل الدخول</span>
              </div>
              <Separator className="flex-1 bg-border" />
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center">
                  <Info className="h-3 w-3" />
                </div>
                <span>استكمال البيانات</span>
              </div>
              <Separator className="flex-1 bg-border" />
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center text-sm font-bold">
                  !
                </div>
                <span>بدأ في الإيجار</span>
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">شكرا لتسجيلك معنا</h2>
            <p className="text-muted-foreground mb-4">
              يجب عليك أن تكمل إدخال بياناتك للتمكن من تأجير الرفوف من تاجر الرفوف
            </p>
            <Button>استكمال البيانات</Button>
          </div>
        </CardContent>
      </Card>

      {/* Welcome Section - Integrated with Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">مرحبا بك في شيلفي</h2>
              <p className="text-muted-foreground">
                راقب مبيعاتك، الرفوف المؤجرة، المنتجات، وأداء المنتجات بسهولة من مكان واحد
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              تأجير رف جديد
            </Button>
          </div>

          {/* Stats Section - Integrated within same card */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">عدد المنتجات المعروضة</span>
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">+20.1% من الشهر الماضي</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">إجمالي المبيعات</span>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">+20.1% من الشهر الماضي</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">عدد الرفوف المؤجرة حاليا</span>
                <Store className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">+20.1% من الشهر الماضي</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty States */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>المبيعات</CardTitle>
            <Link href="#" className="text-sm text-primary">
              رؤية المزيد
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
            <p className="text-muted-foreground">لا يوجد لديك مبيعات بعد</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>رفوفك المؤجرة</CardTitle>
            <Link href="#" className="text-sm text-primary">
              رؤية المزيد
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
            <p className="text-muted-foreground mb-2">ليس لديك رفوف في الوقت الحالي</p>
            <Button variant="link" className="text-primary gap-1">
              <Plus className="h-4 w-4" />
              إضافة رف جديد
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Latest Sales Operations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>آخر عملياتك البيع</CardTitle>
          <Link href="#" className="text-sm text-primary">
            رؤية المزيد
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
          <p className="text-muted-foreground">لا يوجد لديك عمليات بيع</p>
        </CardContent>
      </Card>
    </div>
  )
}
