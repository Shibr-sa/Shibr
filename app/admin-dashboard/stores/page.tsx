"use client"

import { useLanguage } from "@/contexts/localization-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Store, MapPin, Star } from "lucide-react"

const storesData = [
  {
    id: 1,
    name: "Store X",
    owner: "أحمد محمد",
    location: "الرياض، حي النخيل",
    category: "إلكترونيات",
    rating: 4.8,
    shelves: 12,
    status: "نشط",
    joinDate: "15 يناير 2023",
    revenue: "45,000",
  },
  {
    id: 2,
    name: "Glow Cosmetics",
    owner: "فاطمة أحمد",
    location: "جدة، حي الروضة",
    category: "تجميل",
    rating: 4.9,
    shelves: 8,
    status: "نشط",
    joinDate: "22 فبراير 2023",
    revenue: "38,500",
  },
  {
    id: 3,
    name: "Nova Perfumes",
    owner: "خالد العلي",
    location: "الدمام، الكورنيش",
    category: "عطور",
    rating: 4.7,
    shelves: 15,
    status: "معلق",
    joinDate: "10 مارس 2023",
    revenue: "52,200",
  },
  {
    id: 4,
    name: "FitZone",
    owner: "سارة محمود",
    location: "الرياض، حي العليا",
    category: "رياضة",
    rating: 4.6,
    shelves: 6,
    status: "نشط",
    joinDate: "5 أبريل 2023",
    revenue: "29,800",
  },
  {
    id: 5,
    name: "Coffee Box",
    owner: "محمد الشمري",
    location: "جدة، حي الزهراء",
    category: "مقاهي",
    rating: 4.5,
    shelves: 4,
    status: "قيد المراجعة",
    joinDate: "18 مايو 2023",
    revenue: "15,600",
  },
]

export default function StoresPage() {
  const { language } = useLanguage()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة المحلات</h1>
          <p className="text-gray-600">إدارة جميع المحلات المسجلة على المنصة</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 me-2" />
          إضافة محل
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي المحلات</p>
                <p className="text-2xl font-bold">248</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">محلات نشطة</p>
                <p className="text-2xl font-bold">189</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Store className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-gray-600">قيد المراجعة</p>
                <p className="text-2xl font-bold">35</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <Store className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-gray-600">معلقة</p>
                <p className="text-2xl font-bold">24</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="البحث في المحلات..." className="pe-10" />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 me-2" />
              تصفية
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stores Table */}
      <Card>
        <CardHeader>
          <CardTitle>جميع المحلات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-end">المحل</TableHead>
                <TableHead className="text-end">المالك</TableHead>
                <TableHead className="text-end">الموقع</TableHead>
                <TableHead className="text-end">الفئة</TableHead>
                <TableHead className="text-end">التقييم</TableHead>
                <TableHead className="text-end">الرفوف</TableHead>
                <TableHead className="text-end">الحالة</TableHead>
                <TableHead className="text-end">الإيرادات</TableHead>
                <TableHead className="text-end">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {storesData.map((store) => (
                <TableRow key={store.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${store.name.charAt(0)}`} />
                        <AvatarFallback>{store.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{store.name}</div>
                        <div className="text-sm text-gray-500">{store.joinDate}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{store.owner}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{store.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{store.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>{store.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell>{store.shelves}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        store.status === "نشط"
                          ? "default"
                          : store.status === "قيد المراجعة"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {store.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{store.revenue} ر.س</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 me-2" />
                          عرض التفاصيل
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 me-2" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 me-2" />
                          تعليق
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
