"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, AlertCircle, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/contexts/language-context"

const incomingOrders = [
  {
    id: 1,
    store: "متجر الأزياء العصرية",
    branch: "الرياض - حي النخيل",
    duration: "3 أشهر",
    status: "new",
    date: "2024-01-15",
    value: "6,000 ريال",
  },
  {
    id: 2,
    store: "متجر الإلكترونيات الذكية",
    branch: "جدة - حي الروضة",
    duration: "6 أشهر",
    status: "under_review",
    date: "2024-01-14",
    value: "12,000 ريال",
  },
]

const shippingOrders = [
  {
    id: 1,
    store: "متجر الأزياء العصرية",
    branch: "الرياض - حي النخيل",
    method: "شحن سريع",
    status: "in_transit",
    date: "2024-01-10",
    quantity: "25 قطعة",
  },
  {
    id: 2,
    store: "متجر الإلكترونيات الذكية",
    branch: "جدة - حي الروضة",
    method: "شحن عادي",
    status: "received",
    date: "2024-01-08",
    quantity: "15 قطعة",
  },
]

const filterButtons = ["all", "new", "under_review", "rejected", "accepted"]
const shippingFilterButtons = ["all", "in_transit", "received"]

export default function OrdersPage() {
  const { t, direction } = useLanguage()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800"
      case "under_review":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "in_transit":
        return "bg-orange-100 text-orange-800"
      case "received":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("orders.title")}</h1>
        <p className="text-muted-foreground">{t("orders.description")}</p>
      </div>

      {/* Incoming Orders Section */}
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">{t("orders.incoming_title")}</CardTitle>
          <p className="text-muted-foreground text-sm leading-relaxed">{t("orders.incoming_description")}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t("orders.search_placeholder")} className="pl-10" dir={direction} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {filterButtons.map((filter) => (
                <Button key={filter} variant={filter === "all" ? "default" : "outline"} size="sm">
                  {t(`orders.${filter}`)}
                </Button>
              ))}
            </div>
          </div>

          {/* Warning Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t("orders.cancel_warning")}</AlertDescription>
          </Alert>

          {/* Orders Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.store")}</TableHead>
                  <TableHead>{t("table.branch")}</TableHead>
                  <TableHead>{t("table.rental_duration")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                  <TableHead>{t("table.order_date")}</TableHead>
                  <TableHead>{t("table.value")}</TableHead>
                  <TableHead>{t("table.options")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomingOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.store}</TableCell>
                    <TableCell>{order.branch}</TableCell>
                    <TableCell>{order.duration}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>{t(`orders.${order.status}`)}</Badge>
                    </TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell>{order.value}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>{t("common.view")}</DropdownMenuItem>
                          <DropdownMenuItem>{t("common.edit")}</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">{t("common.delete")}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Orders Section */}
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">{t("orders.shipping_title")}</CardTitle>
          <p className="text-muted-foreground text-sm leading-relaxed">{t("orders.shipping_description")}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t("orders.search_placeholder")} className="pl-10" dir={direction} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {shippingFilterButtons.map((filter) => (
                <Button key={filter} variant={filter === "all" ? "default" : "outline"} size="sm">
                  {t(`orders.${filter}`)}
                </Button>
              ))}
            </div>
          </div>

          {/* Shipping Orders Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.store")}</TableHead>
                  <TableHead>{t("table.branch")}</TableHead>
                  <TableHead>{t("table.shipping_method")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                  <TableHead>{t("table.order_date")}</TableHead>
                  <TableHead>{t("table.incoming_quantity")}</TableHead>
                  <TableHead>{t("table.options")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shippingOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.store}</TableCell>
                    <TableCell>{order.branch}</TableCell>
                    <TableCell>{order.method}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>{t(`orders.${order.status}`)}</Badge>
                    </TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>{t("common.view")}</DropdownMenuItem>
                          <DropdownMenuItem>{t("common.edit")}</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">{t("common.delete")}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
