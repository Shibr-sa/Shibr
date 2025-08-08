"use client"

import { useLanguage } from "@/contexts/language-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Bell, Shield, CreditCard, Users } from "lucide-react"

export default function SettingsPage() {
  const { language } = useLanguage()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">إعدادات النظام</h1>
        <p className="text-gray-600">إدارة إعدادات المنصة والتحكم في الخصائص</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">عام</TabsTrigger>
          <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
          <TabsTrigger value="security">الأمان</TabsTrigger>
          <TabsTrigger value="payments">المدفوعات</TabsTrigger>
          <TabsTrigger value="users">المستخدمين</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                الإعدادات العامة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platform-name">اسم المنصة</Label>
                  <Input id="platform-name" defaultValue="شيلفي" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform-url">رابط المنصة</Label>
                  <Input id="platform-url" defaultValue="https://shibr.com" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform-description">وصف المنصة</Label>
                <Textarea
                  id="platform-description"
                  defaultValue="منصة شيلفي لتأجير الرفوف التجارية وعرض المنتجات"
                  rows={3}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">إعدادات اللغة والمنطقة</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="default-language">اللغة الافتراضية</Label>
                    <Input id="default-language" defaultValue="العربية" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">المنطقة الزمنية</Label>
                    <Input id="timezone" defaultValue="Asia/Riyadh" />
                  </div>
                </div>
              </div>

              <Button>حفظ التغييرات</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                إعدادات الإشعارات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">إشعارات البريد الإلكتروني</Label>
                    <p className="text-sm text-gray-500">إرسال إشعارات عبر البريد الإلكتروني</p>
                  </div>
                  <Switch id="email-notifications" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms-notifications">إشعارات الرسائل النصية</Label>
                    <p className="text-sm text-gray-500">إرسال إشعارات عبر الرسائل النصية</p>
                  </div>
                  <Switch id="sms-notifications" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications">الإشعارات الفورية</Label>
                    <p className="text-sm text-gray-500">إشعارات فورية في المتصفح</p>
                  </div>
                  <Switch id="push-notifications" defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">أنواع الإشعارات</h3>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>طلبات جديدة</Label>
                    <p className="text-sm text-gray-500">عند وصول طلبات إيجار جديدة</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>مدفوعات جديدة</Label>
                    <p className="text-sm text-gray-500">عند استلام مدفوعات جديدة</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>تسجيل محلات جديدة</Label>
                    <p className="text-sm text-gray-500">عند تسجيل محلات جديدة</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Button>حفظ الإعدادات</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                إعدادات الأمان
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>المصادقة الثنائية</Label>
                    <p className="text-sm text-gray-500">تفعيل المصادقة الثنائية للحسابات</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>تشفير البيانات</Label>
                    <p className="text-sm text-gray-500">تشفير جميع البيانات الحساسة</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>تسجيل العمليات</Label>
                    <p className="text-sm text-gray-500">تسجيل جميع العمليات الحساسة</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">كلمات المرور</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="min-password-length">الحد الأدنى لطول كلمة المرور</Label>
                    <Input id="min-password-length" type="number" defaultValue="8" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-expiry">انتهاء صلاحية كلمة المرور (أيام)</Label>
                    <Input id="password-expiry" type="number" defaultValue="90" />
                  </div>
                </div>
              </div>

              <Button>حفظ إعدادات الأمان</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                إعدادات المدفوعات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="commission-rate">نسبة العمولة (%)</Label>
                    <Input id="commission-rate" type="number" defaultValue="10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-payment">الحد الأدنى للدفع</Label>
                    <Input id="min-payment" type="number" defaultValue="100" />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">طرق الدفع المتاحة</h3>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>البطاقات الائتمانية</Label>
                    <p className="text-sm text-gray-500">فيزا، ماستركارد، أمريكان إكسبريس</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>التحويل البنكي</Label>
                    <p className="text-sm text-gray-500">التحويل المباشر من البنك</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>المحافظ الرقمية</Label>
                    <p className="text-sm text-gray-500">STC Pay، Apple Pay، Google Pay</p>
                  </div>
                  <Switch />
                </div>
              </div>

              <Button>حفظ إعدادات المدفوعات</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                إعدادات المستخدمين
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>السماح بالتسجيل الجديد</Label>
                    <p className="text-sm text-gray-500">السماح للمستخدمين الجدد بالتسجيل</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>تفعيل البريد الإلكتروني مطلوب</Label>
                    <p className="text-sm text-gray-500">يجب تفعيل البريد قبل استخدام الحساب</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>مراجعة المحلات الجديدة</Label>
                    <p className="text-sm text-gray-500">مراجعة المحلات قبل الموافقة عليها</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">حدود المستخدمين</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="max-stores-per-user">الحد الأقصى للمحلات لكل مستخدم</Label>
                    <Input id="max-stores-per-user" type="number" defaultValue="5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-shelves-per-store">الحد الأقصى للرفوف لكل محل</Label>
                    <Input id="max-shelves-per-store" type="number" defaultValue="20" />
                  </div>
                </div>
              </div>

              <Button>حفظ إعدادات المستخدمين</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
