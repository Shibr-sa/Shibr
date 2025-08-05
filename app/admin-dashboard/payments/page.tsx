"use client"

import { useLanguage } from "@/contexts/language-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Download,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react"

const paymentsData = [
  {
    id: "PAY-001",
    store: "Store X",
    amount: 2500,
    type: "إيجار رف",
    method: "بطاقة ائتمان",
    status: "مكتمل",
    date: "24 يونيو 2023",
    commission: 250,
  },
  {
    id: "PAY-002",
    store: "Glow Cosmetics",
    amount: 1800,
    type: "إيجار رف",
    method: "تحويل بنكي",
    status: "معلق",
    date: "23 يونيو 2023",
    commission: 180,
  },
  {
    id: "PAY-003",
    store: "Nova Perfumes",
    amount: 3200,
    type: "إيجار رف",
    method: "محفظة رقمية",
    status: "مكتمل",
    date: "22 يونيو 2023",
    commission: 320,
  },
  {
    id: "PAY-004",
    store: "FitZone",
    amount: 1500,
    type: "إيجار رف",
    method: "بطاقة ائتمان",
    status: "فاشل",
    date: "21 يونيو 2023",
    commission: 0,
  },
  {
    id: "PAY-005",
    store: "Coffee Box",
    amount: 900,
    type: "إيجار رف",
    method: "تحويل بنكي",
    status: "مكتمل",
    date: "20 يونيو 2023",
    commission: 90,
  },
]

export default function PaymentsPage() {
  const { language } = useLanguage()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المدفوعات والتحصيلات</h1>
          <p className="text-gray-600">إدارة جميع المعاملات المالية والعمولات</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Download className="w-4 h-4 me-2" />
          تصدير التقرير
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold">320,000 ر.س</p>
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <TrendingUp className="w-3 h-3" />
                  <span>+12.5%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">العمولات</p>
                <p className="text-2xl font-bold">32,000 ر.س</p>
                <div className="flex items-center gap-1 text-blue-600 text-sm">
                  <TrendingUp className="w-3 h-3" />
                  <span>+8.2%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">معاملات معلقة</p>
                <p className="text-2xl font-bold">15</p>
                <div className="flex items-center gap-1 text-orange-600 text-sm">
                  <TrendingDown className="w-3 h-3" />
                  <span>-2.1%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">معاملات فاشلة</p>
                <p className="text-2xl font-bold">8</p>
                <div className="flex items-center gap-1 text-red-600 text-sm">
                  <TrendingUp className="w-3 h-3" />
                  <span>+1.5%</span>
                </div>
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
              <Input placeholder="البحث في المعاملات..." className="pe-10" />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 me-2" />
              تصفية
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>جميع المعاملات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-end">رقم المعاملة</TableHead>
                <TableHead className="text-end">المحل</TableHead>
                <TableHead className="text-end">المبلغ</TableHead>
                <TableHead className="text-end">النوع</TableHead>
                <TableHead className="text-end">طريقة الدفع</TableHead>
                <TableHead className="text-end">الحالة</TableHead>
                <TableHead className="text-end">العمولة</TableHead>
                <TableHead className="text-end">التاريخ</TableHead>
                <TableHead className="text-end">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentsData.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.id}</TableCell>
                  <TableCell>{payment.store}</TableCell>
                  <TableCell className="font-medium">{payment.amount.toLocaleString()} ر.س</TableCell>
                  <TableCell>
                    <Badge variant="outline">{payment.type}</Badge>
                  </TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        payment.status === "مكتمل" ? "default" : payment.status === "معلق" ? "secondary" : "destructive"
                      }
                      className={
                        payment.status === "مكتمل"
                          ? "bg-green-100 text-green-800"
                          : payment.status === "معلق"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-red-100 text-red-800"
                      }
                    >
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {payment.commission > 0 ? `${payment.commission} ر.س` : "-"}
                  </TableCell>
                  <TableCell>{payment.date}</TableCell>
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
                          <Download className="w-4 h-4 me-2" />
                          تحميل الإيصال
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
