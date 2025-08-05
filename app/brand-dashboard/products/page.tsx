"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Download, Edit, Trash2, ShoppingBag, Package, TrendingUp } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import Image from "next/image"

export default function BrandProductsPage() {
  const { t, direction } = useLanguage()

  const products = [
    {
      id: 1,
      name: "تيشرت أبيض M",
      code: "#14821",
      price: "89 ريال",
      quantity: 50,
      sales: 34,
      stores: 3,
      image: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 2,
      name: "تيشرت أسود L",
      code: "#14821",
      price: "95 ريال",
      quantity: 20,
      sales: 35,
      stores: 2,
      image: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 3,
      name: "تيشرت أزرق XL",
      code: "#14821",
      price: "120 ريال",
      quantity: 30,
      sales: 36,
      stores: 1,
      image: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 4,
      name: "تيشرت أحمر S",
      code: "#14821",
      price: "75 ريال",
      quantity: 40,
      sales: 37,
      stores: 2,
      image: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 5,
      name: "تيشرت أخضر M",
      code: "#14821",
      price: "110 ريال",
      quantity: 80,
      sales: 38,
      stores: 1,
      image: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 6,
      name: "تيشرت رمادي L",
      code: "#14821",
      price: "85 ريال",
      quantity: 120,
      sales: 39,
      stores: 1,
      image: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 7,
      name: "تيشرت أصفر S",
      code: "#14821",
      price: "100 ريال",
      quantity: 200,
      sales: 40,
      stores: 1,
      image: "/placeholder.svg?height=40&width=40",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Combined Header and Statistics Card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#131313] text-start">منتجاتك المعروضة على رفوف المتاجر</h1>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="gap-2 text-[#725cad] border-[#725cad] hover:bg-[#725cad] hover:text-white bg-transparent"
              >
                <Download className="h-4 w-4" />
                استيراد المنتجات من Excel
              </Button>
              <Button className="gap-2 bg-[#725cad] hover:bg-[#283455] text-white">
                <Plus className="h-4 w-4" />
                إضافة منتج جديد
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-start">
                    <p className="text-sm font-medium text-[#71717a]">إجمالي المبيعات</p>
                    <p className="text-2xl font-bold text-[#131313]">45,231.89 ر.س</p>
                    <p className="text-xs text-[#71717a] mt-1">من 20 يناير</p>
                  </div>
                  <div className="w-12 h-12 bg-[#725cad]/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-[#725cad]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-start">
                    <p className="text-sm font-medium text-[#71717a]">عدد المنتجات الباعة</p>
                    <p className="text-2xl font-bold text-[#131313]">1,890</p>
                    <p className="text-xs text-[#71717a] mt-1">من 20 يناير</p>
                  </div>
                  <div className="w-12 h-12 bg-[#34c759]/10 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-[#34c759]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-start">
                    <p className="text-sm font-medium text-[#71717a]">إجمالي عدد المنتجات</p>
                    <p className="text-2xl font-bold text-[#131313]">50</p>
                    <p className="text-xs text-[#71717a] mt-1">من 20 يناير</p>
                  </div>
                  <div className="w-12 h-12 bg-[#ff9500]/10 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-[#ff9500]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Products Management Section */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Select>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="عدد الطلبات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الطلبات</SelectItem>
                  <SelectItem value="high">طلبات عالية</SelectItem>
                  <SelectItem value="medium">طلبات متوسطة</SelectItem>
                  <SelectItem value="low">طلبات قليلة</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="كل المدن" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المدن</SelectItem>
                  <SelectItem value="riyadh">الرياض</SelectItem>
                  <SelectItem value="jeddah">جدة</SelectItem>
                  <SelectItem value="dammam">الدمام</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative w-full sm:w-auto sm:min-w-[300px]">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#71717a]" />
              <Input placeholder="ابحث باسم المنتج أو مدينة أو..." className="pr-10 text-start" dir={direction} />
            </div>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#eef1f0]">
                  <TableHead className="text-start text-[#71717a] font-medium">الصورة</TableHead>
                  <TableHead className="text-start text-[#71717a] font-medium">اسم المنتج</TableHead>
                  <TableHead className="text-start text-[#71717a] font-medium">الكود</TableHead>
                  <TableHead className="text-start text-[#71717a] font-medium">السعر</TableHead>
                  <TableHead className="text-start text-[#71717a] font-medium">الكمية</TableHead>
                  <TableHead className="text-start text-[#71717a] font-medium">عدد المبيعات</TableHead>
                  <TableHead className="text-start text-[#71717a] font-medium">عدد المحلات</TableHead>
                  <TableHead className="text-start text-[#71717a] font-medium">خيارات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} className="border-[#eef1f0] hover:bg-[#eef1f0]/50">
                    <TableCell>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#eef1f0]">
                        <Image
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-[#131313] text-start">{product.name}</TableCell>
                    <TableCell className="text-[#71717a] text-start">{product.code}</TableCell>
                    <TableCell className="text-[#131313] font-medium text-start">{product.price}</TableCell>
                    <TableCell className="text-start">
                      <Badge variant="secondary" className="bg-[#eef1f0] text-[#131313] hover:bg-[#eef1f0]">
                        {product.quantity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#131313] text-start">{product.sales}</TableCell>
                    <TableCell className="text-[#131313] text-start">{product.stores}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-[#f6001e] hover:text-[#f6001e] hover:bg-[#f6001e]/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-[#71717a] hover:text-[#131313] hover:bg-[#eef1f0]"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent">
              <span className="sr-only">الصفحة السابقة</span>
              <span>‹‹</span>
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-[#725cad] text-white border-[#725cad]">
              1
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent">
              2
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent">
              <span>...</span>
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-transparent">
              <span className="sr-only">الصفحة التالية</span>
              <span>››</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
