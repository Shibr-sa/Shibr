"use client"

import { useLanguage } from "@/contexts/localization-context"
import { formatCurrency } from "@/lib/formatters"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface InventoryItem {
  productId: string
  productName: string
  productNameAr: string
  initialQuantity: number
  soldQuantity: number
  remainingQuantity: number
  unitPrice: number
  totalSalesValue: number
  totalSalesWithTax: number
}

interface InventoryReconciliationTableProps {
  items: InventoryItem[]
  readOnly?: boolean
}

export function InventoryReconciliationTable({
  items,
  readOnly = false,
}: InventoryReconciliationTableProps) {
  const { t, language, direction } = useLanguage()

  // Calculate totals
  const totals = items.reduce(
    (acc, item) => ({
      initialQuantity: acc.initialQuantity + item.initialQuantity,
      soldQuantity: acc.soldQuantity + item.soldQuantity,
      remainingQuantity: acc.remainingQuantity + item.remainingQuantity,
      totalSalesValue: acc.totalSalesValue + item.totalSalesValue,
      totalSalesWithTax: acc.totalSalesWithTax + item.totalSalesWithTax,
    }),
    {
      initialQuantity: 0,
      soldQuantity: 0,
      remainingQuantity: 0,
      totalSalesValue: 0,
      totalSalesWithTax: 0,
    }
  )

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("clearances.inventory.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            {t("clearances.inventory.empty")}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("clearances.inventory.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={direction === "rtl" ? "text-right" : ""}>
                  {t("clearances.inventory.product")}
                </TableHead>
                <TableHead className="text-center">
                  {t("clearances.inventory.initial")}
                </TableHead>
                <TableHead className="text-center">
                  {t("clearances.inventory.sold")}
                </TableHead>
                <TableHead className="text-center">
                  {t("clearances.inventory.remaining")}
                </TableHead>
                <TableHead className={direction === "rtl" ? "text-left" : "text-right"}>
                  {t("clearances.inventory.salesValue")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.productId}>
                  <TableCell className="font-medium">
                    {language === "ar" ? item.productNameAr : item.productName}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.initialQuantity}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.soldQuantity}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.remainingQuantity}
                  </TableCell>
                  <TableCell className={direction === "rtl" ? "text-left" : "text-right"}>
                    {formatCurrency(item.totalSalesWithTax)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-bold">
                  {t("clearances.inventory.totals")}
                </TableCell>
                <TableCell className="text-center font-bold">
                  {totals.initialQuantity}
                </TableCell>
                <TableCell className="text-center font-bold">
                  {totals.soldQuantity}
                </TableCell>
                <TableCell className="text-center font-bold">
                  {totals.remainingQuantity}
                </TableCell>
                <TableCell className={`${direction === "rtl" ? "text-left" : "text-right"} font-bold`}>
                  {formatCurrency(totals.totalSalesWithTax)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
