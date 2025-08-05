"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Plus, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { useLanguage } from "@/contexts/language-context"

const shelves = [
  {
    id: "1",
    name: "رف الإلكترونيات الرئيسي",
    location: "الدور الأول - قسم الإلكترونيات",
    size: "كبير",
    price: "500",
    status: "متاح",
    renter: null,
    products: 0,
    image: "/placeholder.svg?height=60&width=60",
  },
  {
    id: "2",
    name: "رف الأزياء النسائية",
    location: "الدور الثاني - قسم الأزياء",
    size: "متوسط",
    price: "350",
    status: "مؤجر",
    renter: "متجر الأناقة",
    products: 24,
    image: "/placeholder.svg?height=60&width=60",
  },
  {
    id: "3",
    name: "رف الإكسسوارات",
    location: "الدور الأول - المدخل الرئيسي",
    size: "صغير",
    price: "200",
    status: "متاح",
    renter: null,
    products: 0,
    image: "/placeholder.svg?height=60&width=60",
  },
]

export default function StoreDashboardShelvesPage() {
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("dashboard.shelves")}</h1>
          <p className="text-muted-foreground">إدارة الرفوف المتاحة في متجرك</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة رف جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">إجمالي الرفوف</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">8</div>
            <p className="text-xs text-muted-foreground">رفوف مؤجرة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">4</div>
            <p className="text-xs text-muted-foreground">رفوف متاحة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">3,200</div>
            <p className="text-xs text-muted-foreground">إجمالي الإيرادات (ريال)</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>قائمة الرفوف</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="البحث في الرفوف..." className="pe-10 w-64" />
              </div>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                تصفية
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">الكل</TabsTrigger>
              <TabsTrigger value="available">متاح</TabsTrigger>
              <TabsTrigger value="rented">مؤجر</TabsTrigger>
              <TabsTrigger value="maintenance">صيانة</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الرف</TableHead>
                    <TableHead>الموقع</TableHead>
                    <TableHead>الحجم</TableHead>
                    <TableHead>السعر الشهري</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>المستأجر</TableHead>
                    <TableHead>المنتجات</TableHead>
                    <TableHead className="text-end">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shelves.map((shelf) => (
                    <TableRow key={shelf.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Image
                            src={shelf.image || "/placeholder.svg"}
                            alt={shelf.name}
                            width={40}
                            height={40}
                            className="rounded-md"
                          />
                          <span>{shelf.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{shelf.location}</TableCell>
                      <TableCell>{shelf.size}</TableCell>
                      <TableCell>{shelf.price} ريال</TableCell>
                      <TableCell>
                        <Badge variant={shelf.status === "متاح" ? "secondary" : "default"}>{shelf.status}</Badge>
                      </TableCell>
                      <TableCell>{shelf.renter || "-"}</TableCell>
                      <TableCell>{shelf.products}</TableCell>
                      <TableCell className="text-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 me-2" />
                              عرض التفاصيل
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 me-2" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 me-2" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
