"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/localization-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Store, MapPin, Star, Users, CheckCircle, Clock, XCircle } from "lucide-react"

const storesData = [
  {
    id: 1,
    name: "Store X",
    owner: "Ahmed Mohammed",
    location: "Riyadh, Al Nakheel",
    category: "electronics",
    rating: 4.8,
    shelves: 12,
    status: "active",
    joinDate: "January 15, 2023",
    revenue: 45000,
  },
  {
    id: 2,
    name: "Glow Cosmetics",
    owner: "Fatima Ahmed",
    location: "Jeddah, Al Rawdah",
    category: "beauty",
    rating: 4.9,
    shelves: 8,
    status: "active",
    joinDate: "February 22, 2023",
    revenue: 38500,
  },
  {
    id: 3,
    name: "Nova Perfumes",
    owner: "Khalid Al Ali",
    location: "Dammam, Corniche",
    category: "perfumes",
    rating: 4.7,
    shelves: 15,
    status: "suspended",
    joinDate: "March 10, 2023",
    revenue: 52200,
  },
  {
    id: 4,
    name: "FitZone",
    owner: "Sara Mahmoud",
    location: "Riyadh, Al Olaya",
    category: "sports",
    rating: 4.6,
    shelves: 6,
    status: "active",
    joinDate: "April 5, 2023",
    revenue: 29800,
  },
  {
    id: 5,
    name: "Coffee Box",
    owner: "Mohammed Al Shamri",
    location: "Jeddah, Al Zahra",
    category: "cafes",
    rating: 4.5,
    shelves: 4,
    status: "under_review",
    joinDate: "May 18, 2023",
    revenue: 15600,
  },
]

export default function StoresPage() {
  const { t, language } = useLanguage()
  const [timePeriod, setTimePeriod] = useState("monthly")

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "under_review":
        return "secondary"
      case "suspended":
        return "destructive"
      default:
        return "outline"
    }
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ${t("common.currency")}`
  }

  const getTranslatedData = (store: any) => {
    if (language === "ar") {
      return {
        owner: store.id === 1 ? "أحمد محمد" :
               store.id === 2 ? "فاطمة أحمد" :
               store.id === 3 ? "خالد العلي" :
               store.id === 4 ? "سارة محمود" :
               "محمد الشمري",
        location: store.id === 1 ? "الرياض، حي النخيل" :
                  store.id === 2 ? "جدة، حي الروضة" :
                  store.id === 3 ? "الدمام، الكورنيش" :
                  store.id === 4 ? "الرياض، حي العليا" :
                  "جدة، حي الزهراء",
        joinDate: store.id === 1 ? "15 يناير 2023" :
                  store.id === 2 ? "22 فبراير 2023" :
                  store.id === 3 ? "10 مارس 2023" :
                  store.id === 4 ? "5 أبريل 2023" :
                  "18 مايو 2023",
      }
    }
    return {
      owner: store.owner,
      location: store.location,
      joinDate: store.joinDate,
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Card with Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">{t("stores.title")}</CardTitle>
              <p className="text-muted-foreground mt-1">{t("stores.description")}</p>
            </div>
            <Tabs value={timePeriod} onValueChange={setTimePeriod} className="w-auto">
              <TabsList className="grid grid-cols-4 w-auto bg-muted">
                <TabsTrigger value="daily" className="px-4">
                  {t("dashboard.daily")}
                </TabsTrigger>
                <TabsTrigger value="weekly" className="px-4">
                  {t("dashboard.weekly")}
                </TabsTrigger>
                <TabsTrigger value="monthly" className="px-4">
                  {t("dashboard.monthly")}
                </TabsTrigger>
                <TabsTrigger value="yearly" className="px-4">
                  {t("dashboard.yearly")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("stores.total_stores")}</p>
                  <p className="text-2xl font-bold text-primary">248</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    +20.1% {t("dashboard.from_last_month")}
                  </p>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Store className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("stores.active_stores")}</p>
                  <p className="text-2xl font-bold text-primary">189</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    +15.3% {t("dashboard.from_last_month")}
                  </p>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("stores.suspended")}</p>
                  <p className="text-2xl font-bold text-primary">24</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    -5.2% {t("dashboard.from_last_month")}
                  </p>
                </div>
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder={t("stores.search_placeholder")} className="pe-10" />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 me-2" />
              {t("stores.filter")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stores Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{t("stores.all_stores")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={language === "ar" ? "text-end" : "text-start"}>
                  {t("stores.table.store")}
                </TableHead>
                <TableHead className={language === "ar" ? "text-end" : "text-start"}>
                  {t("stores.table.owner")}
                </TableHead>
                <TableHead className={language === "ar" ? "text-end" : "text-start"}>
                  {t("stores.table.location")}
                </TableHead>
                <TableHead className={language === "ar" ? "text-end" : "text-start"}>
                  {t("stores.table.category")}
                </TableHead>
                <TableHead className={language === "ar" ? "text-end" : "text-start"}>
                  {t("stores.table.rating")}
                </TableHead>
                <TableHead className={language === "ar" ? "text-end" : "text-start"}>
                  {t("stores.table.shelves")}
                </TableHead>
                <TableHead className={language === "ar" ? "text-end" : "text-start"}>
                  {t("stores.table.status")}
                </TableHead>
                <TableHead className={language === "ar" ? "text-end" : "text-start"}>
                  {t("stores.table.revenue")}
                </TableHead>
                <TableHead className={language === "ar" ? "text-end" : "text-start"}>
                  {t("stores.table.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {storesData.map((store) => {
                const translatedData = getTranslatedData(store)
                return (
                  <TableRow key={store.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${store.name.charAt(0)}`} />
                          <AvatarFallback>{store.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{store.name}</div>
                          <div className="text-sm text-muted-foreground">{translatedData.joinDate}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{translatedData.owner}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{translatedData.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{t(`stores.category.${store.category}`)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span>{store.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell>{store.shelves}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(store.status)}>
                        {t(`stores.status.${store.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(store.revenue)}</TableCell>
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
                            {t("stores.actions.view_details")}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 me-2" />
                            {t("stores.actions.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 me-2" />
                            {t("stores.actions.suspend")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}