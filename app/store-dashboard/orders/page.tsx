"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Edit2, X, Check, AlertCircle, Star } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useStoreData } from "@/contexts/store-data-context"
import { useState } from "react"

export default function StoreDashboardOrdersPage() {
  const { t, direction } = useLanguage()
  const { isLoading, isStoreDataComplete } = useStoreData()
  const [filter, setFilter] = useState("all")

  // Filter options for orders section
  const ordersFilterOptions = [
    { value: "all", label: t("orders.all") },
    { value: "new", label: t("orders.new") },
    { value: "under_review", label: t("orders.under_review") },
    { value: "rejected", label: t("orders.rejected") },
    { value: "accepted", label: t("orders.accepted") }
  ]
  
  // Reverse for RTL to show "All" first from the right
  const orderedOrdersFilters = direction === "rtl" ? [...ordersFilterOptions].reverse() : ordersFilterOptions

  // Mock data for incoming orders
  const incomingOrders = [
    {
      id: "1",
      storeName: "خطوة ستور",
      city: "جدة",
      requestDate: "24 " + t("common.june"),
      status: "under_review",
      rentalDuration: "1 " + t("orders.month"),
      rating: 4,
      totalRating: 5
    },
    {
      id: "2",
      storeName: "Nova Perfumes",
      city: t("common.riyadh"),
      requestDate: "23 " + t("common.june"),
      status: "under_review",
      rentalDuration: "3 " + t("orders.months"),
      rating: 4,
      totalRating: 5
    },
    {
      id: "3",
      storeName: "FitZone",
      city: t("common.dammam"),
      requestDate: "20 " + t("common.june"),
      status: "rejected",
      rentalDuration: "1 " + t("orders.month"),
      rating: 3,
      totalRating: 5
    }
  ]

  return (
    <div className={`space-y-6 ${direction === "rtl" ? "font-cairo" : "font-inter"}`}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("dashboard.orders")}</h1>
        <p className="text-muted-foreground">
          {t("orders.incoming_description")}
        </p>
      </div>

      {/* Incoming Orders Section */}
      <Card>
        <CardContent className="p-6">
          {/* Title and Description Section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{t("orders.incoming_title")}</h2>
            <p className="text-muted-foreground">
              {t("orders.incoming_description")}
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center justify-between mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={t("orders.search_placeholder")}
                className="ps-10 w-80"
              />
            </div>

            {/* Filter Pills */}
            <RadioGroup value={filter} onValueChange={setFilter} className="flex items-center gap-4">
              {orderedOrdersFilters.map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <RadioGroupItem 
                    value={option.value} 
                    id={`orders-${option.value}`} 
                    className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                  />
                  <Label htmlFor={`orders-${option.value}`} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Warning Alert */}
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600">
              {t("orders.cancel_warning")}
            </AlertDescription>
          </Alert>

          {/* Orders Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-start">{t("orders.store")}</TableHead>
                  <TableHead className="text-start">{t("orders.branch")}</TableHead>
                  <TableHead className="text-start">{t("orders.request_date")}</TableHead>
                  <TableHead className="text-start">{t("orders.status")}</TableHead>
                  <TableHead className="text-start">{t("orders.rental_duration")}</TableHead>
                  <TableHead className="text-start">{t("orders.rating")}</TableHead>
                  <TableHead className="text-start">{t("orders.options")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomingOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.storeName}</TableCell>
                    <TableCell>{order.city}</TableCell>
                    <TableCell>{order.requestDate}</TableCell>
                    <TableCell>
                      {order.status === "under_review" ? (
                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                          {t("orders.under_review_badge")}
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                          {t("orders.rejected_badge")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{order.rentalDuration}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm me-1">{order.rating}/{order.totalRating}</span>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < order.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {order.status === "rejected" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            disabled={isLoading || !isStoreDataComplete}
                          >
                            <Edit2 className="h-3 w-3 me-1" />
                            {t("orders.offer_details")}
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={isLoading || !isStoreDataComplete}
                              title={!isStoreDataComplete && !isLoading ? t("dashboard.complete_profile_first") : ""}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              disabled={isLoading || !isStoreDataComplete}
                              title={!isStoreDataComplete && !isLoading ? t("dashboard.complete_profile_first") : ""}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <span className="text-xs text-muted-foreground px-2">{t("orders.view_offer")}</span>
                          </>
                        )}
                      </div>
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