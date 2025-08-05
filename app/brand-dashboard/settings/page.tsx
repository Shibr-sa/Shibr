"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export default function BrandSettingsPage() {
  const { t, direction } = useLanguage()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#131313] text-start">الإعدادات</h1>
      </div>

      {/* Settings Tabs */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Tabs defaultValue="general" className="w-full" dir={direction}>
            <div className="border-b border-[#eef1f0]">
              <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-0 rounded-none">
                <TabsTrigger
                  value="general"
                  className="text-start py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-[#725cad] data-[state=active]:bg-transparent data-[state=active]:text-[#725cad] bg-transparent text-[#71717a] hover:text-[#131313]"
                >
                  إعدادات عامة
                </TabsTrigger>
                <TabsTrigger
                  value="brand"
                  className="text-start py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-[#725cad] data-[state=active]:bg-transparent data-[state=active]:text-[#725cad] bg-transparent text-[#71717a] hover:text-[#131313]"
                >
                  بيانات العلامة التجارية
                </TabsTrigger>
                <TabsTrigger
                  value="payment"
                  className="text-start py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-[#725cad] data-[state=active]:bg-transparent data-[state=active]:text-[#725cad] bg-transparent text-[#71717a] hover:text-[#131313]"
                >
                  إعدادات الدفع
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="general" className="p-6 space-y-8">
              {/* Profile Image Section */}
              <div className="flex items-center justify-end gap-6">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent border-[#eef1f0] text-[#71717a] hover:bg-[#eef1f0] hover:text-[#131313]"
                  >
                    حذف
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent border-[#eef1f0] text-[#71717a] hover:bg-[#eef1f0] hover:text-[#131313]"
                  >
                    رفع
                  </Button>
                </div>
                <Avatar className="h-16 w-16">
                  <AvatarImage src="/placeholder.svg?height=64&width=64" alt="Profile" />
                  <AvatarFallback className="bg-[#eef1f0]">
                    <Camera className="h-6 w-6 text-[#71717a]" />
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#131313] text-start block">
                    الاسم
                  </Label>
                  <Input
                    id="name"
                    placeholder="ادخل اسمك بالكامل"
                    className="bg-[#ffffff] border-[#eef1f0] text-start"
                    dir={direction}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#131313] text-start block">
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ادخل بريدك الإلكتروني"
                    className="bg-[#ffffff] border-[#eef1f0] text-start"
                    dir={direction}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile" className="text-[#131313] text-start block">
                    رقم الجوال
                  </Label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="رقم الجوال"
                    className="bg-[#ffffff] border-[#eef1f0] text-start"
                    dir={direction}
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-center">
                <Button className="bg-[#725cad] hover:bg-[#5d4a8a] text-white px-8 py-2 rounded-full">
                  حفظ التغيير
                </Button>
              </div>

              {/* Separator */}
              <div className="border-t border-[#eef1f0] my-8"></div>

              {/* Change Password Section */}
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-[#131313] text-start mb-2">تغيير كلمة المرور</h3>
                  <p className="text-sm text-[#71717a] text-start leading-relaxed max-w-2xl mx-auto">
                    إذا تسببت كلمة المرور الخاصة بك أو كان حسابك منتهك أو اجتماعية، فيمكنك تغيير كلمة مرور باستخدام الزر
                    أدناه
                  </p>
                </div>

                <div className="flex justify-center">
                  <Button className="bg-[#725cad] hover:bg-[#5d4a8a] text-white px-8 py-2 rounded-full">
                    تغيير كلمة المرور
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="brand" className="p-6">
              <div className="text-center py-12">
                <p className="text-[#71717a]">بيانات العلامة التجارية</p>
                <p className="text-sm text-[#71717a] mt-2">سيتم إضافة محتوى هذا القسم قريباً</p>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="p-6">
              <div className="text-center py-12">
                <p className="text-[#71717a]">إعدادات الدفع</p>
                <p className="text-sm text-[#71717a] mt-2">سيتم إضافة محتوى هذا القسم قريباً</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
