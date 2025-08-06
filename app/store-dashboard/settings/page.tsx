"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, Save, Plus, Trash2, Edit2, Calendar } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useState } from "react"
import { useCurrentUser } from "@/hooks/use-current-user"

export default function StoreDashboardSettingsPage() {
  const { t, direction } = useLanguage()
  const { user } = useCurrentUser()
  const [activeTab, setActiveTab] = useState("general")
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isVirtual, setIsVirtual] = useState(false)

  return (
    <div className={`space-y-6 ${direction === "rtl" ? "font-cairo" : "font-inter"}`}>
      {/* Header */}
      <div className="text-start">
        <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>
        <p className="text-muted-foreground">{t("settings.description")}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir={direction}>
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="general">{t("settings.tabs.general")}</TabsTrigger>
          <TabsTrigger value="store-data">{t("settings.tabs.store_data")}</TabsTrigger>
          <TabsTrigger value="payment">{t("settings.tabs.payment")}</TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardContent className="space-y-6 pt-6">
              {/* Store Logo Section */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 flex-shrink-0">
                  <AvatarImage src="/placeholder.svg?height=96&width=96" alt="Store Logo" />
                  <AvatarFallback className="text-muted-foreground">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-12 w-12"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                      />
                    </svg>
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-3 text-start flex-1">
                  <h3 className="text-lg font-semibold">{t("settings.general.upload_logo")}</h3>
                  <p className="text-sm text-muted-foreground">{t("settings.general.logo_hint")}</p>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Camera className="h-4 w-4" />
                    {t("settings.general.change_photo")}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-start">{t("settings.general.contact_info")}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ownerName" className="text-start block">{t("settings.general.owner_name")}</Label>
                    <Input id="ownerName" defaultValue={user?.fullName} className="text-start" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-start block">{t("settings.general.phone_number")}</Label>
                    <Input id="phoneNumber" type="tel" placeholder="+966 5X XXX XXXX" className="text-start" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-start block">{t("settings.general.email")}</Label>
                    <Input id="email" type="email" defaultValue={user?.email} className="text-start" dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-start block">{t("settings.general.password")}</Label>
                    <Input id="password" type="password" placeholder="••••••••" className="text-start" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="gap-2">
                  <Save className="h-4 w-4" />
                  {t("settings.general.save_changes")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Store Data Tab */}
        <TabsContent value="store-data" className="space-y-6">
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                {/* Store Name and Type */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="storeName" className="text-start block">
                      {t("settings.store_data.store_name")} *
                    </Label>
                    <Input 
                      id="storeName" 
                      placeholder={t("settings.store_data.store_name_placeholder")}
                      className="text-start" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeType" className="text-start block">
                      {t("settings.store_data.store_type")} *
                    </Label>
                    <Input 
                      id="storeType" 
                      placeholder={t("settings.store_data.store_type_placeholder")}
                      className="text-start" 
                      required
                    />
                  </div>
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-start block">
                    {t("settings.store_data.website")}
                  </Label>
                  <Input 
                    id="website" 
                    type="url" 
                    placeholder={t("settings.store_data.website_placeholder")}
                    className="text-start" 
                    dir="ltr"
                  />
                </div>

                {/* Commercial Registration Number */}
                <div className="space-y-2">
                  <Label htmlFor="commercialReg" className="text-start block">
                    {t("settings.store_data.commercial_reg")} *
                  </Label>
                  <Input 
                    id="commercialReg" 
                    placeholder={t("settings.store_data.commercial_reg_placeholder")}
                    className="text-start" 
                    dir="ltr"
                    required
                  />
                </div>

                {/* No Commercial Registration Checkbox */}
                <div className="flex items-center gap-2">
                  <Checkbox id="noCommercialReg" />
                  <Label 
                    htmlFor="noCommercialReg" 
                    className="text-sm font-normal cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {t("settings.store_data.no_commercial_reg")}
                  </Label>
                </div>

                {/* Logo Upload Section */}
                <div className="border-2 border-dashed border-muted rounded-lg p-8">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        strokeWidth={1.5} 
                        stroke="currentColor" 
                        className="w-6 h-6 text-muted-foreground"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" 
                        />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{t("settings.store_data.upload_logo")}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("settings.store_data.upload_hint")}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      {t("settings.store_data.choose_file")}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button className="gap-2">
                  <Save className="h-4 w-4" />
                  {t("settings.store_data.save_changes")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings Tab */}
        <TabsContent value="payment" className="space-y-6">
          {/* Payment Methods Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-semibold">{t("settings.payment.payment_methods_title")}</CardTitle>
              <Button className="gap-2" onClick={() => setIsPaymentDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                {t("settings.payment.add_payment_method")}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-start font-medium">{t("settings.payment.table.method")}</TableHead>
                      <TableHead className="text-start font-medium">{t("settings.payment.table.details")}</TableHead>
                      <TableHead className="text-start font-medium">{t("settings.payment.table.status")}</TableHead>
                      <TableHead className="text-start font-medium">{t("settings.payment.table.type")}</TableHead>
                      <TableHead className="text-start font-medium">{t("settings.payment.table.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">تحويل بنكي</TableCell>
                      <TableCell>بنك الراجحي - SA...5453</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          مفعل
                        </Badge>
                      </TableCell>
                      <TableCell>مكتملة</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Payment Records Table */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">{t("settings.payment.payment_records_summary")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-start font-medium">{t("settings.payment.summary.date")}</TableHead>
                      <TableHead className="text-start font-medium">{t("settings.payment.summary.type")}</TableHead>
                      <TableHead className="text-start font-medium">{t("settings.payment.summary.payment_method")}</TableHead>
                      <TableHead className="text-start font-medium">{t("settings.payment.summary.status")}</TableHead>
                      <TableHead className="text-start font-medium">{t("settings.payment.summary.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">1 يونيو</TableCell>
                      <TableCell>تحويل بنكي</TableCell>
                      <TableCell>دفعة من رف الرياض</TableCell>
                      <TableCell>مكتملة</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            تحميل الفاتورة
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">1 يونيو (جديد)</TableCell>
                      <TableCell>تحويل بنكي</TableCell>
                      <TableCell>رسوم تجديد رف</TableCell>
                      <TableCell>
                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                          بانتظار التأكيد
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs">
                            <Calendar className="w-4 h-4" />
                            دفع الفاتورة
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Payment Method Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" dir={direction}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {t("settings.payment.dialog.title")}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Bank Selection */}
            <div className="space-y-2">
              <Label htmlFor="bank" className="text-start block">
                {t("settings.payment.dialog.select_bank")}
              </Label>
              <Select>
                <SelectTrigger id="bank" className="w-full">
                  <SelectValue placeholder={t("settings.payment.dialog.bank_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alrajhi">Al-Rajhi Bank</SelectItem>
                  <SelectItem value="ncb">National Commercial Bank</SelectItem>
                  <SelectItem value="sabb">SABB</SelectItem>
                  <SelectItem value="riyadbank">Riyad Bank</SelectItem>
                  <SelectItem value="alinma">Alinma Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Account Holder Name */}
            <div className="space-y-2">
              <Label htmlFor="accountName" className="text-start block">
                {t("settings.payment.dialog.account_name")}
              </Label>
              <Input
                id="accountName"
                placeholder={t("settings.payment.dialog.account_name_placeholder")}
                className="w-full"
              />
            </div>

            {/* Bank Card/Account Number */}
            <div className="space-y-2">
              <Label htmlFor="accountNumber" className="text-start block">
                {t("settings.payment.dialog.account_number")}
              </Label>
              <Input
                id="accountNumber"
                placeholder={t("settings.payment.dialog.account_number_placeholder")}
                className="w-full"
                dir="ltr"
              />
            </div>

            {/* IBAN */}
            <div className="space-y-2">
              <Label htmlFor="iban" className="text-start block">
                {t("settings.payment.dialog.iban")}
              </Label>
              <Input
                id="iban"
                placeholder="IBAN"
                className="w-full"
                dir="ltr"
              />
            </div>

            {/* Virtual Checkbox */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Checkbox 
                id="virtual" 
                checked={isVirtual}
                onCheckedChange={(checked) => setIsVirtual(checked as boolean)}
              />
              <Label 
                htmlFor="virtual" 
                className="text-sm font-normal cursor-pointer"
              >
                {t("settings.payment.dialog.virtual")}
              </Label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
            >
              {t("settings.payment.dialog.cancel")}
            </Button>
            <Button onClick={() => {
              // Handle save logic here
              setIsPaymentDialogOpen(false)
            }}>
              {t("settings.payment.dialog.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}