"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Camera, Save, Bell, Shield, Store } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export default function StoreDashboardSettingsPage() {
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("dashboard.settings")}</h1>
        <p className="text-muted-foreground">إدارة إعدادات متجرك وحسابك</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
          <TabsTrigger value="store">إعدادات المتجر</TabsTrigger>
          <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
          <TabsTrigger value="security">الأمان</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                معلومات الملف الشخصي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="/placeholder.svg?height=96&width=96" alt="Profile" />
                    <AvatarFallback>أم</AvatarFallback>
                  </Avatar>
                  <Button size="sm" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">أحمد محمد</h3>
                  <p className="text-muted-foreground">صاحب متجر</p>
                  <Badge variant="secondary">متجر مفعل</Badge>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">الاسم الأول</Label>
                  <Input id="firstName" defaultValue="أحمد" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">اسم العائلة</Label>
                  <Input id="lastName" defaultValue="محمد" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input id="email" type="email" defaultValue="ahmed@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input id="phone" defaultValue="+966 50 123 4567" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">نبذة عنك</Label>
                <Textarea id="bio" placeholder="اكتب نبذة مختصرة عنك..." />
              </div>

              <Button className="gap-2">
                <Save className="h-4 w-4" />
                حفظ التغييرات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="store" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                معلومات المتجر
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="storeName">اسم المتجر</Label>
                  <Input id="storeName" defaultValue="متجر الإلكترونيات الحديثة" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeCategory">فئة المتجر</Label>
                  <Input id="storeCategory" defaultValue="إلكترونيات" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeAddress">عنوان المتجر</Label>
                  <Input id="storeAddress" defaultValue="الرياض، حي العليا" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storePhone">هاتف المتجر</Label>
                  <Input id="storePhone" defaultValue="+966 11 123 4567" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeDescription">وصف المتجر</Label>
                <Textarea id="storeDescription" placeholder="اكتب وصفاً مفصلاً عن متجرك..." />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">ساعات العمل</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="openTime">وقت الفتح</Label>
                    <Input id="openTime" type="time" defaultValue="09:00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="closeTime">وقت الإغلاق</Label>
                    <Input id="closeTime" type="time" defaultValue="22:00" />
                  </div>
                </div>
              </div>

              <Button className="gap-2">
                <Save className="h-4 w-4" />
                حفظ إعدادات المتجر
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                إعدادات الإشعارات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>طلبات الاستئجار الجديدة</Label>
                    <p className="text-sm text-muted-foreground">احصل على إشعار عند وصول طلب استئجار جديد</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تحديثات المبيعات</Label>
                    <p className="text-sm text-muted-foreground">إشعارات عن المبيعات والإيرادات اليومية</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>رسائل العملاء</Label>
                    <p className="text-sm text-muted-foreground">إشعارات عند وصول رسائل من العملاء</p>
                  </div>
                  <Switch />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تقارير أسبوعية</Label>
                    <p className="text-sm text-muted-foreground">احصل على تقرير أسبوعي عن أداء متجرك</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Button className="gap-2">
                <Save className="h-4 w-4" />
                حفظ إعدادات الإشعارات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                الأمان وكلمة المرور
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">المصادقة الثنائية</h4>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تفعيل المصادقة الثنائية</Label>
                    <p className="text-sm text-muted-foreground">أضف طبقة حماية إضافية لحسابك</p>
                  </div>
                  <Switch />
                </div>
              </div>

              <Button className="gap-2">
                <Save className="h-4 w-4" />
                حفظ إعدادات الأمان
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
