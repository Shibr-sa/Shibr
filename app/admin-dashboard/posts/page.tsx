"use client"

import { useLanguage } from "@/contexts/localization-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, FileText } from "lucide-react"

const postsData = [
  {
    id: 1,
    title: "إعلان عن افتتاح فرع جديد",
    author: "Store X",
    category: "إعلانات",
    status: "منشور",
    date: "24 يونيو 2023",
    views: 1250,
  },
  {
    id: 2,
    title: "عروض خاصة على منتجات التجميل",
    author: "Glow Cosmetics",
    category: "عروض",
    status: "قيد المراجعة",
    date: "23 يونيو 2023",
    views: 890,
  },
  {
    id: 3,
    title: "مجموعة عطور جديدة",
    author: "Nova Perfumes",
    category: "منتجات",
    status: "منشور",
    date: "22 يونيو 2023",
    views: 2100,
  },
  {
    id: 4,
    title: "نصائح للعناية بالبشرة",
    author: "Beauty Expert",
    category: "نصائح",
    status: "مسودة",
    date: "21 يونيو 2023",
    views: 0,
  },
  {
    id: 5,
    title: "تخفيضات نهاية الموسم",
    author: "FitZone",
    category: "عروض",
    status: "منشور",
    date: "20 يونيو 2023",
    views: 1680,
  },
]

export default function PostsPage() {
  const { language } = useLanguage()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة المنشورات</h1>
          <p className="text-gray-600">إدارة جميع المنشورات والمحتوى على المنصة</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 me-2" />
          منشور جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي المنشورات</p>
                <p className="text-2xl font-bold">156</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">منشورات نشطة</p>
                <p className="text-2xl font-bold">89</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <FileText className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-gray-600">قيد المراجعة</p>
                <p className="text-2xl font-bold">23</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-gray-600">مسودات</p>
                <p className="text-2xl font-bold">44</p>
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
              <Input placeholder="البحث في المنشورات..." className="pe-10" />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 me-2" />
              تصفية
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>جميع المنشورات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-end">العنوان</TableHead>
                <TableHead className="text-end">الكاتب</TableHead>
                <TableHead className="text-end">الفئة</TableHead>
                <TableHead className="text-end">الحالة</TableHead>
                <TableHead className="text-end">التاريخ</TableHead>
                <TableHead className="text-end">المشاهدات</TableHead>
                <TableHead className="text-end">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {postsData.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>{post.author}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{post.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        post.status === "منشور" ? "default" : post.status === "قيد المراجعة" ? "secondary" : "outline"
                      }
                    >
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{post.date}</TableCell>
                  <TableCell>{post.views.toLocaleString()}</TableCell>
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
                          عرض
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 me-2" />
                          تعديل
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 me-2" />
                          حذف
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
