"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Plus, Upload, Edit, Trash2, ShoppingCart, Package, ChartLine, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
import { useLanguage } from "@/contexts/localization-context"
import Image from "next/image"

export default function BrandProductsPage() {
  const { t, direction } = useLanguage()

  const products = [
    {
      id: 1,
      name: "تيشرت أبيض M",
      code: "#14821",
      price: 89,
      currency: "ريال",
      quantity: 50,
      sales: 34,
      stores: 3,
      image: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 2,
      name: "تيشرت أسود L",
      code: "#14821",
      price: 95,
      currency: "ريال",
      quantity: 20,
      sales: 35,
      stores: 2,
      image: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 3,
      name: "تيشرت أزرق XL",
      code: "#14821",
      price: 120,
      currency: "ريال",
      quantity: 30,
      sales: 36,
      stores: 1,
      image: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 4,
      name: "تيشرت أحمر S",
      code: "#14821",
      price: 75,
      currency: "ريال",
      quantity: 40,
      sales: 37,
      stores: 2,
      image: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 5,
      name: "تيشرت أخضر M",
      code: "#14821",
      price: 110,
      currency: "ريال",
      quantity: 80,
      sales: 38,
      stores: 1,
      image: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 6,
      name: "تيشرت رمادي L",
      code: "#14821",
      price: 85,
      currency: "ريال",
      quantity: 120,
      sales: 39,
      stores: 1,
      image: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 7,
      name: "تيشرت أصفر S",
      code: "#14821",
      price: 100,
      currency: "ريال",
      quantity: 200,
      sales: 40,
      stores: 1,
      image: "/placeholder.svg?height=40&width=40",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Main Content Card with Statistics */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Header with Title and Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold">{t("brand.dashboard.your_products_on_shelves")}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t("brand.dashboard.products_statistics_description")}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                className="gap-2 w-full sm:w-auto"
              >
                <Upload className="h-4 w-4" />
                {t("brand.dashboard.import_products_excel")}
              </Button>
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                {t("brand.dashboard.add_new_product")}
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t("brand.dashboard.total_sales")}</p>
                    <p className="text-2xl font-bold text-primary">
                      {t("common.currency_symbol")} 45,231.89
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{t("brand.dashboard.from_last_month")}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ChartLine className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t("brand.dashboard.sold_products_count")}</p>
                    <p className="text-2xl font-bold">1,890</p>
                    <p className="text-xs text-muted-foreground mt-1">{t("brand.dashboard.from_last_month")}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t("brand.dashboard.total_products_count")}</p>
                    <p className="text-2xl font-bold">50</p>
                    <p className="text-xs text-muted-foreground mt-1">{t("brand.dashboard.from_last_month")}</p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Products Table Card */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Title */}
          <div>
            <h3 className="text-xl font-semibold">{t("brand.dashboard.your_products")}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t("brand.dashboard.products_table_description")}</p>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("brand.dashboard.search_products")}
                className="ps-9 h-10"
              />
            </div>
          </div>

          {/* Products Table */}
          <div className="rounded-lg border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-muted/50">
                  <TableHead className="w-12 h-12 px-4">
                    <Checkbox />
                  </TableHead>
                  <TableHead className="h-12 px-4 text-start font-medium text-foreground">{t("brand.dashboard.product_image")}</TableHead>
                  <TableHead className="h-12 px-4 text-center font-medium text-foreground">{t("brand.dashboard.product_name")}</TableHead>
                  <TableHead className="h-12 px-4 text-center font-medium text-foreground">{t("brand.dashboard.product_code")}</TableHead>
                  <TableHead className="h-12 px-4 text-center font-medium text-foreground">{t("brand.dashboard.price")}</TableHead>
                  <TableHead className="h-12 px-4 text-center font-medium text-foreground">{t("brand.dashboard.quantity")}</TableHead>
                  <TableHead className="h-12 px-4 text-center font-medium text-foreground">{t("brand.dashboard.sales_count")}</TableHead>
                  <TableHead className="h-12 px-4 text-center font-medium text-foreground">{t("brand.dashboard.stores_count")}</TableHead>
                  <TableHead className="h-12 px-4 text-center font-medium text-foreground w-24">{t("brand.dashboard.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, index) => (
                  <TableRow 
                    key={product.id}
                    className={index === products.length - 1 ? "" : "border-b"}
                  >
                    <TableCell className="h-12 px-4">
                      <Checkbox />
                    </TableCell>
                    <TableCell className="h-12 px-4">
                      <div className="h-10 w-10 rounded-lg bg-muted" />
                    </TableCell>
                    <TableCell className="h-12 px-4 text-center font-medium text-foreground">{product.name}</TableCell>
                    <TableCell className="h-12 px-4 text-center text-muted-foreground">{product.code}</TableCell>
                    <TableCell className="h-12 px-4 text-center text-foreground">
                      <span className="font-medium">{product.price}</span>
                      <span className="ms-1 text-muted-foreground">{t("common.currency_symbol")}</span>
                    </TableCell>
                    <TableCell className="h-12 px-4 text-center text-foreground">{product.quantity}</TableCell>
                    <TableCell className="h-12 px-4 text-center text-foreground">{product.sales}</TableCell>
                    <TableCell className="h-12 px-4 text-center text-foreground">{product.stores}</TableCell>
                    <TableCell className="h-12 px-4 text-center">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t("common.showing")} 7 {t("common.of")} 7 {t("brand.dashboard.products")}
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8"
                disabled
              >
                {direction === "rtl" ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
              <div className="flex items-center gap-1">
                <Button 
                  variant="default" 
                  size="icon" 
                  className="h-8 w-8"
                >
                  1
                </Button>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8"
                disabled
              >
                {direction === "rtl" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
