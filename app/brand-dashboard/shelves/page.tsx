"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, QrCode, Package, TrendingUp, Filter } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export default function BrandShelvesPage() {
  const { t, direction } = useLanguage()

  const statsData = [
    {
      title: "إجمالي المبيعات",
      value: "45,231.89",
      unit: "ر.س",
      subtitle: "17% من الشهر الماضي",
      icon: TrendingUp,
      color: "#725cad",
    },
    {
      title: "عدد مسحات QR الإجمالية",
      value: "1,890",
      subtitle: "12% من الشهر الماضي",
      icon: QrCode,
      color: "#725cad",
    },
    {
      title: "عدد الرفوف الموجودة حالياً",
      value: "15",
      subtitle: "20% من الشهر الماضي",
      icon: Package,
      color: "#725cad",
    },
  ]

  const shelvesData = [
    {
      id: 1,
      storeName: "مركز الرفيق",
      city: "الرياض",
      shelfCount: "42 عملية",
      rentalDate: "1 يونيو",
      endDate: "30 يونيو",
      status: "نشط",
      statusColor: "#34c759",
    },
    {
      id: 2,
      storeName: "سلة عطر",
      city: "جدة",
      shelfCount: "27 عملية",
      rentalDate: "10 يونيو",
      endDate: "10 يوليو",
      status: "نشط",
      statusColor: "#34c759",
    },
    {
      id: 3,
      storeName: "ستايل بوكس",
      city: "الدمام",
      shelfCount: "15 عملية",
      rentalDate: "1 مايو",
      endDate: "1 يونيو",
      status: "بانتظار التفعيل",
      statusColor: "#ff9500",
    },
    {
      id: 4,
      storeName: "تجميل وإطلاق",
      city: "المدينة المنورة",
      shelfCount: "50 عملية",
      rentalDate: "20 مايو",
      endDate: "2 يونيو",
      status: "نشط",
      statusColor: "#34c759",
    },
    {
      id: 5,
      storeName: "",
      city: "المدينة المنورة",
      shelfCount: "50 عملية",
      rentalDate: "20 مايو",
      endDate: "3 يونيو",
      status: "منتهي",
      statusColor: "#f6001e",
    },
  ]

  const shippingData = [
    {
      id: 1,
      storeName: "خليفة سوبر",
      branch: "جدة",
      method: "تسليم ذاتي",
      date: "24 يونيو",
      quantity: "200",
      status: "جديد",
      statusColor: "#ff9500",
    },
    {
      id: 2,
      storeName: "Nova Perfumes",
      branch: "الرياض",
      method: "طيران",
      date: "23 يونيو",
      quantity: "50",
      status: "في الطريق",
      statusColor: "#34c759",
    },
    {
      id: 3,
      storeName: "FitZone",
      branch: "الدمام",
      method: "تسليم ذاتي",
      date: "20 يونيو",
      quantity: "60",
      status: "تم الاستلام",
      statusColor: "#71717a",
    },
  ]

  return (
    <div className="space-y-6" dir={direction}>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsData.map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#71717a]">{stat.title}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#131313]">{stat.value}</span>
                    {stat.unit && <span className="text-sm text-[#71717a]">{stat.unit}</span>}
                  </div>
                  <p className="text-xs text-[#71717a]">{stat.subtitle}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: `${stat.color}20` }}>
                  <stat.icon className="h-6 w-6" style={{ color: stat.color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Shelves Management Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-[#131313] text-start">إدارة رفوفك داخل المحلات</CardTitle>
              <p className="text-sm text-[#71717a] text-start mt-1">
                تتبع جميع المساحات التي حجزتها داخل المحلات الواقعية، أضف منتجاتك، حمّل أكواد QR، وتأكد أن عرضك على الرف
                بشكل بكفاءة
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar and Add Button */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#71717a]" />
              <Input
                placeholder="ابحث باسم المحل أو مدينة أو..."
                className="pe-10 border-[#eef1f0] text-start"
                dir={direction}
              />
            </div>
            <Button className="bg-[#725cad] hover:bg-[#725cad]/90 text-white gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              اضافة رف جديد
            </Button>
          </div>

          {/* Shelves Table */}
          <div className="rounded-lg border border-[#eef1f0] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#eef1f0]/50">
                  <TableHead className="text-start font-medium text-[#131313]">اسم المحل</TableHead>
                  <TableHead className="text-start font-medium text-[#131313]">المدينة</TableHead>
                  <TableHead className="text-start font-medium text-[#131313]">عدد العمليات</TableHead>
                  <TableHead className="text-start font-medium text-[#131313]">تاريخ الايجار</TableHead>
                  <TableHead className="text-start font-medium text-[#131313]">تاريخ الانتهاء</TableHead>
                  <TableHead className="text-start font-medium text-[#131313]">حالة الايجار</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shelvesData.map((shelf) => (
                  <TableRow key={shelf.id} className="hover:bg-[#eef1f0]/30">
                    <TableCell className="font-medium text-[#131313] text-start">{shelf.storeName || "—"}</TableCell>
                    <TableCell className="text-[#71717a] text-start">{shelf.city}</TableCell>
                    <TableCell className="text-[#71717a] text-start">{shelf.shelfCount}</TableCell>
                    <TableCell className="text-[#71717a] text-start">{shelf.rentalDate}</TableCell>
                    <TableCell className="text-[#71717a] text-start">{shelf.endDate}</TableCell>
                    <TableCell className="text-start">
                      <Badge
                        variant="secondary"
                        className="text-xs font-medium border-0"
                        style={{
                          backgroundColor: `${shelf.statusColor}20`,
                          color: shelf.statusColor,
                        }}
                      >
                        {shelf.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Requests Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-[#131313] text-start">طلبات الشحن</CardTitle>
              <p className="text-sm text-[#71717a] text-start mt-1">تتبع تفاصيل شحنتك للمحل</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Options */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-[#eef1f0] text-[#71717a] hover:bg-[#eef1f0]/50 bg-transparent"
            >
              تم التسليم
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#eef1f0] text-[#71717a] hover:bg-[#eef1f0]/50 bg-transparent"
            >
              في الطريق
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#eef1f0] text-[#71717a] hover:bg-[#eef1f0]/50 bg-transparent"
            >
              جديد
            </Button>
            <Button variant="default" size="sm" className="bg-[#725cad] hover:bg-[#725cad]/90 text-white">
              الكل
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#71717a]" />
            <Input
              placeholder="ابحث باسم المحل أو مدينة أو..."
              className="pe-10 border-[#eef1f0] text-start"
              dir={direction}
            />
          </div>

          {/* Shipping Table */}
          <div className="rounded-lg border border-[#eef1f0] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#eef1f0]/50">
                  <TableHead className="text-start font-medium text-[#131313]">المحل</TableHead>
                  <TableHead className="text-start font-medium text-[#131313]">الفرع</TableHead>
                  <TableHead className="text-start font-medium text-[#131313]">الخدمة المرسلة</TableHead>
                  <TableHead className="text-start font-medium text-[#131313]">تاريخ الطلب</TableHead>
                  <TableHead className="text-start font-medium text-[#131313]">طريقة الشحن</TableHead>
                  <TableHead className="text-start font-medium text-[#131313]">الحالة</TableHead>
                  <TableHead className="text-start font-medium text-[#131313]">خيارات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shippingData.map((shipping) => (
                  <TableRow key={shipping.id} className="hover:bg-[#eef1f0]/30">
                    <TableCell className="font-medium text-[#131313] text-start">{shipping.storeName}</TableCell>
                    <TableCell className="text-[#71717a] text-start">{shipping.branch}</TableCell>
                    <TableCell className="text-[#71717a] text-start">{shipping.quantity}</TableCell>
                    <TableCell className="text-[#71717a] text-start">{shipping.date}</TableCell>
                    <TableCell className="text-[#71717a] text-start">{shipping.method}</TableCell>
                    <TableCell className="text-start">
                      <Badge
                        variant="secondary"
                        className="text-xs font-medium border-0"
                        style={{
                          backgroundColor: `${shipping.statusColor}20`,
                          color: shipping.statusColor,
                        }}
                      >
                        {shipping.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-start">
                      <Button variant="ghost" size="sm" className="text-[#71717a] hover:text-[#131313] p-1">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
