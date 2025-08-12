"use client"

import { useLanguage } from "@/contexts/localization-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
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
    branch: "Riyadh",
    shelfName: "Front Shelf",
    dateAdded: "June 24, 2023",
    status: "under_review",
    statusColor: "orange",
  },
  {
    id: 2,
    storeName: "Perfume Store",
    branch: "Jeddah",
    shelfName: "Display Corner",
    dateAdded: "June 23, 2023",
    status: "accepted",
    statusColor: "green",
  },
  {
    id: 3,
    storeName: "Modern Style",
    branch: "Dammam",
    shelfName: "External Shelf",
    dateAdded: "June 22, 2023",
    status: "under_review",
    statusColor: "orange",
  },
  {
    id: 4,
    storeName: "Modern Style",
    branch: "Riyadh",
    shelfName: "External Shelf",
    dateAdded: "June 22, 2023",
    status: "under_review",
    statusColor: "orange",
  },
  {
    id: 5,
    storeName: "Modern Style",
    branch: "Jeddah",
    shelfName: "External Shelf",
    dateAdded: "June 22, 2023",
    status: "under_review",
    statusColor: "orange",
  },
]

export default function AdminDashboard() {
  const { language, t } = useLanguage()

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.total_users")}</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">555</div>
            <p className="text-xs text-muted-foreground">+20.1% {t("dashboard.from_last_month")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.shelves_count")}</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">890</div>
            <p className="text-xs text-muted-foreground">620 {t("dashboard.rented")} 270 {t("dashboard.available")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.total_revenue")}</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">320,000</div>
            <p className="text-xs text-muted-foreground">{t("dashboard.from_rentals")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.rental_requests")}</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">2,200</div>
            <p className="text-xs text-muted-foreground">+20.1% {t("dashboard.from_last_month")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("dashboard.revenue_rate")}</CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-purple-600">
                  {t("dashboard.yearly")}
                </Button>
                <Button variant="ghost" size="sm">
                  {t("dashboard.monthly")}
                </Button>
                <Button variant="ghost" size="sm">
                  {t("dashboard.weekly")}
                </Button>
                <Button variant="ghost" size="sm">
                  {t("dashboard.daily")}
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
              <CardTitle>{t("dashboard.top_selling_products")}</CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-purple-600">
                  {t("dashboard.yearly")}
                </Button>
                <Button variant="ghost" size="sm">
                  {t("dashboard.monthly")}
                </Button>
                <Button variant="ghost" size="sm">
                  {t("dashboard.weekly")}
                </Button>
                <Button variant="ghost" size="sm">
                  {t("dashboard.daily")}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium text-end">{product.name}</div>
                  <div className="flex-1 relative">
                    <Progress value={product.value} className="h-6" />
                    <span className="absolute end-2 top-1/2 -translate-y-1/2 text-xs font-medium text-primary-foreground">
                      {product.value}%
                    </span>
                  </div>
                </div>
              ))}
              <div className="mt-4 text-xs text-gray-500 text-center">
                ↗️ {t("dashboard.increase_by")} 4.5% {t("dashboard.this_month")}
                <br />
                {t("dashboard.show_total_turnover")}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stores Management Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("dashboard.stores_management")}</CardTitle>
            <Button variant="ghost" size="sm">
              {t("dashboard.see_more")} ←
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-end">{t("dashboard.store_name")}</TableHead>
                <TableHead className="text-end">{t("dashboard.branch")}</TableHead>
                <TableHead className="text-end">{t("dashboard.shelf_name")}</TableHead>
                <TableHead className="text-end">{t("dashboard.date_added")}</TableHead>
                <TableHead className="text-end">{t("dashboard.status")}</TableHead>
                <TableHead className="text-end">{t("dashboard.options")}</TableHead>
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
                    >
                      {t(`dashboard.status_${store.status}`)}
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
                          {t("dashboard.view")}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 me-2" />
                          {t("dashboard.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 me-2" />
                          {t("dashboard.reject")}
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
