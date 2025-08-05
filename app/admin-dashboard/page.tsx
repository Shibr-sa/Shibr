"use client"

import { useLanguage } from "@/contexts/language-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Users, Package, DollarSign, FileText, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Sample data for charts
const revenueData = [
  { month: "Jan", value: 400000 },
  { month: "Feb", value: 350000 },
  { month: "Mar", value: 200000 },
  { month: "Apr", value: 280000 },
  { month: "May", value: 450000 },
  { month: "Jun", value: 320000 },
  { month: "Jul", value: 380000 },
  { month: "Aug", value: 180000 },
  { month: "Sep", value: 350000 },
  { month: "Oct", value: 180000 },
  { month: "Nov", value: 420000 },
  { month: "Dec", value: 480000 },
]

const topProducts = [
  { name: "Store X", value: 85, color: "#8b5cf6" },
  { name: "Glow Cosmetics", value: 70, color: "#f97316" },
  { name: "Nova Perfumes", value: 60, color: "#0f766e" },
  { name: "FitZone", value: 45, color: "#eab308" },
  { name: "coffe box", value: 30, color: "#fb923c" },
]

// Sample data for stores table
const storesData = [
  {
    id: 1,
    storeName: "Store X",
    branch: "الرياض",
    shelfName: "رف واجهة",
    dateAdded: "24 يونيو 2023",
    status: "قيد المراجعة",
    statusColor: "orange",
  },
  {
    id: 2,
    storeName: "محل العطور",
    branch: "جدة",
    shelfName: "زاوية عرض",
    dateAdded: "23 يونيو 2023",
    status: "مقبول",
    statusColor: "green",
  },
  {
    id: 3,
    storeName: "Modern Style",
    branch: "الدمام",
    shelfName: "رف خارجي",
    dateAdded: "22 يونيو 2023",
    status: "قيد المراجعة",
    statusColor: "orange",
  },
  {
    id: 4,
    storeName: "Modern Style",
    branch: "الرياض",
    shelfName: "رف خارجي",
    dateAdded: "22 يونيو 2023",
    status: "قيد المراجعة",
    statusColor: "orange",
  },
  {
    id: 5,
    storeName: "Modern Style",
    branch: "جدة",
    shelfName: "رف خارجي",
    dateAdded: "22 يونيو 2023",
    status: "قيد المراجعة",
    statusColor: "orange",
  },
]

export default function AdminDashboard() {
  const { language, t } = useLanguage()

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">لوحة التحكم</h1>
        <p className="text-gray-600">نظرة شاملة على أداء المنصة وإحصائياتها</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد المستخدمين الكلي</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">555</div>
            <p className="text-xs text-muted-foreground">+20.1% من الشهر الماضي</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد الرفوف</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">890</div>
            <p className="text-xs text-muted-foreground">منها 620 مؤجر 270 متاح</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">320,000</div>
            <p className="text-xs text-muted-foreground">من عمليات التأجير</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">طلبات الإيجار</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">2,200</div>
            <p className="text-xs text-muted-foreground">+20.1% من الشهر الماضي</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>معدل الإيرادات</CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-purple-600">
                  سنوي
                </Button>
                <Button variant="ghost" size="sm">
                  شهري
                </Button>
                <Button variant="ghost" size="sm">
                  أسبوعي
                </Button>
                <Button variant="ghost" size="sm">
                  يومي
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "الإيرادات",
                  color: "#8b5cf6",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>أكثر المنتجات مبيعاً</CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-purple-600">
                  سنوي
                </Button>
                <Button variant="ghost" size="sm">
                  شهري
                </Button>
                <Button variant="ghost" size="sm">
                  أسبوعي
                </Button>
                <Button variant="ghost" size="sm">
                  يومي
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium text-end">{product.name}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="h-6 rounded-full flex items-center justify-end px-2"
                      style={{
                        backgroundColor: product.color,
                        width: `${product.value}%`,
                      }}
                    >
                      <span className="text-white text-xs font-medium">{product.value}%</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-4 text-xs text-gray-500 text-center">
                ↗️ ارتفاع بنسبة 4.5% هذا الشهر
                <br />
                عرض إجمالي الدوران لفترة الشهر
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stores Management Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>إدارة المحلات</CardTitle>
            <Button variant="ghost" size="sm">
              رؤية المزيد ←
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-end">اسم المحل</TableHead>
                <TableHead className="text-end">الفرع</TableHead>
                <TableHead className="text-end">اسم الرف</TableHead>
                <TableHead className="text-end">تاريخ الإضافة</TableHead>
                <TableHead className="text-end">المحالة</TableHead>
                <TableHead className="text-end">خيارات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {storesData.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-medium">{store.storeName}</TableCell>
                  <TableCell>{store.branch}</TableCell>
                  <TableCell>{store.shelfName}</TableCell>
                  <TableCell>{store.dateAdded}</TableCell>
                  <TableCell>
                    <Badge
                      variant={store.statusColor === "green" ? "default" : "secondary"}
                      className={
                        store.statusColor === "green"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-orange-100 text-orange-800 hover:bg-orange-100"
                      }
                    >
                      {store.status}
                    </Badge>
                  </TableCell>
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
                          عرض
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 me-2" />
                          رفض
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
