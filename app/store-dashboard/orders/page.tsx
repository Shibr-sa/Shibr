"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, MoreHorizontal, Eye, Check, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { useLanguage } from "@/contexts/language-context"

const orders = [
  {
    id: "ORD-001",
    customer: "أحمد محمد",
    shelf: "رف الإلكترونيات الرئيسي",
    duration: "3 أشهر",
    amount: "1,500",
    status: "pending",
    date: "2024-01-15",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: "ORD-002",
    customer: "فاطمة أحمد",
    shelf: "رف الأزياء النسائية",
    duration: "6 أشهر",
    amount: "2,100",
    status: "approved",
    date: "2024-01-14",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: "ORD-003",
    customer: "محمد علي",
    shelf: "رف الإكسسوارات",
    duration: "1 شهر",
    amount: "200",
    status: "rejected",
    date: "2024-01-13",
    avatar: "/placeholder.svg?height=32&width=32",
  },
]

export default function StoreDashboardOrdersPage() {
  const { t } = useLanguage()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">قيد المراجعة</Badge>
      case "approved":
        return <Badge className="bg-green-100 text-green-800">مقبول</Badge>
      case "rejected":
        return <Badge variant="destructive">مرفوض</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("dashboard.orders")}</h1>
          <p className="text-muted-foreground">إدارة طلبات استئجار الرفوف</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-yellow-600">8</div>
            <p className="text-xs text-muted-foreground">قيد المراجعة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">12</div>
            <p className="text-xs text-muted-foreground">مقبولة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-red-600">4</div>
            <p className="text-xs text-muted-foreground">مرفوضة</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>طلبات الاستئجار</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="البحث في الطلبات..." className="pr-10 w-64" />
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
              <TabsTrigger value="pending">قيد المراجعة</TabsTrigger>
              <TabsTrigger value="approved">مقبولة</TabsTrigger>
              <TabsTrigger value="rejected">مرفوضة</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>الرف</TableHead>
                    <TableHead>المدة</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Image
                            src={order.avatar || "/placeholder.svg"}
                            alt={order.customer}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                          <span>{order.customer}</span>
                        </div>
                      </TableCell>
                      <TableCell>{order.shelf}</TableCell>
                      <TableCell>{order.duration}</TableCell>
                      <TableCell>{order.amount} ريال</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{order.date}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {order.status === "pending" && (
                            <>
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 bg-transparent">
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 bg-transparent">
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
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
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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
