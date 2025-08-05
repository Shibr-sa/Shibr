"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Star, TrendingUp } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

const shelves = [
  {
    id: 1,
    name: "رف جدة",
    branch: "جدة",
    status: "متاح للإيجار",
    indicator: "🟡",
    price: "149 ريس",
    nextCollection: "-",
    rating: null,
    action: "أضف تقييم",
  },
  {
    id: 2,
    name: "رف الرياض",
    branch: "الرياض",
    status: "مؤجر",
    indicator: "🟢",
    price: "500 ريس / شهريا",
    nextCollection: "1 يوليو 2025",
    rating: null,
    action: "أضف تقييم",
    brand: "Glow Cosmetics",
  },
  {
    id: 3,
    name: "رف الدمام",
    branch: "الدمام",
    status: "مؤجر",
    indicator: "🟢",
    price: "650 ريس / شهريا",
    nextCollection: "3 يوليو 2025",
    rating: 4.5,
    action: "أضف تقييم",
    brand: "Nova Perfumes",
  },
]

const statsData = [
  {
    title: "الرفوف المتاحة",
    value: "3",
    change: "+20.1% من الشهر الماضي",
    icon: "📊",
  },
  {
    title: "إجمالي المبيعات",
    value: "45,231.89 ريال",
    change: "+20.1% من الشهر الماضي",
    icon: "💰",
  },
  {
    title: "إجمالي الرفوف المؤجرة",
    value: "8",
    change: "+20.1% من الشهر الماضي",
    icon: "📈",
  },
]

export default function ShelvesPage() {
  const { t, direction } = useLanguage()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "متاح للإيجار":
        return "bg-yellow-100 text-yellow-800"
      case "مؤجر":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ))
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">إدارة الرفوف - تأكد للمساحات المعروضة في فروعك</h1>
        <p className="text-muted-foreground">
          تابع حالة كل رف في فروعك، وتابع تأجير المساحات المتاحة لزيادة دخلك بسهولة
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsData.map((stat, index) => (
          <Card key={index} className="relative">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground mb-2">{stat.value}</p>
                  <div className="flex items-center text-sm text-green-600">
                    <TrendingUp className="h-4 w-4 me-1" />
                    {stat.change}
                  </div>
                </div>
                <div className="text-2xl opacity-20">{stat.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl mb-2">رفوفك</CardTitle>
              <p className="text-muted-foreground text-sm">
                قم بإدارة رفوفك بسهولة عبر جميع الفروع تابع حالتها، المؤجرين، ومواعيد التحصيل في مكان واحد
              </p>
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
              <Plus className="h-4 w-4" />
              اعرض رف الآن
            </Button>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2">
              <Button variant="default" size="sm" className="bg-purple-600 hover:bg-purple-700">
                الكل
              </Button>
              <Button variant="outline" size="sm">
                الرفوف المتاحة
              </Button>
              <Button variant="outline" size="sm">
                الرفوف المؤجرة
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="ابحث بإسم المؤجر أو مدينة الفرع ..." className="pe-10 text-end w-80" dir="rtl" />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-end font-semibold">اسم الرف</TableHead>
                  <TableHead className="text-end font-semibold">اسم الفرع</TableHead>
                  <TableHead className="text-end font-semibold">الحالة</TableHead>
                  <TableHead className="text-end font-semibold">المؤشر</TableHead>
                  <TableHead className="text-end font-semibold">السعر</TableHead>
                  <TableHead className="text-end font-semibold">التحصيل القادم</TableHead>
                  <TableHead className="text-end font-semibold">إجراء</TableHead>
                  <TableHead className="text-end font-semibold">التقييم</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shelves.map((shelf) => (
                  <TableRow key={shelf.id}>
                    <TableCell className="font-medium text-end">{shelf.name}</TableCell>
                    <TableCell className="text-end">{shelf.branch}</TableCell>
                    <TableCell className="text-end">
                      <Badge className={getStatusColor(shelf.status)} variant="secondary">
                        {shelf.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">{shelf.indicator}</TableCell>
                    <TableCell className="text-end font-medium">{shelf.price}</TableCell>
                    <TableCell className="text-end">{shelf.nextCollection}</TableCell>
                    <TableCell className="text-end">
                      <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
                        {shelf.action}
                      </Button>
                    </TableCell>
                    <TableCell className="text-end">
                      {shelf.rating ? (
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-sm font-medium">{shelf.rating}/5</span>
                          <div className="flex">{renderStars(shelf.rating)}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
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
