"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, MapPin, Info, Calendar } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useStoreData } from "@/contexts/store-data-context"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AddShelfPage() {
  const { t, direction } = useLanguage()
  const { isLoading, isStoreDataComplete } = useStoreData()
  const router = useRouter()
  
  // Form states
  const [shelfName, setShelfName] = useState("")
  const [city, setCity] = useState("")
  const [branch, setBranch] = useState("")
  const [discountPercentage, setDiscountPercentage] = useState("")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [availableFrom, setAvailableFrom] = useState("")
  const [length, setLength] = useState("")
  const [width, setWidth] = useState("")
  const [depth, setDepth] = useState("")
  const [productType, setProductType] = useState("")
  const [description, setDescription] = useState("")

  // Redirect if store data is not complete
  if (!isLoading && !isStoreDataComplete) {
    router.push("/store-dashboard/settings")
    return null
  }

  return (
    <div className={`max-w-6xl mx-auto space-y-6 ${direction === "rtl" ? "font-cairo" : "font-inter"}`}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">{t("add_shelf.title")}</h1>
        <p className="text-muted-foreground">
          {t("add_shelf.description")}
        </p>
      </div>

      {/* Main Form Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-6">
            {/* First Row - Shelf Name, City, Branch */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="shelfName" className="text-start block">
                  {t("add_shelf.shelf_name")} *
                </Label>
                <Input
                  id="shelfName"
                  value={shelfName}
                  onChange={(e) => setShelfName(e.target.value)}
                  placeholder={t("add_shelf.shelf_name_placeholder")}
                  className="text-start"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city" className="text-start block">
                  {t("add_shelf.city")} *
                </Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger id="city">
                    <SelectValue placeholder={t("add_shelf.city_placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jeddah">{t("common.jeddah")}</SelectItem>
                    <SelectItem value="riyadh">{t("common.riyadh")}</SelectItem>
                    <SelectItem value="dammam">{t("common.dammam")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch" className="text-start block">
                  {t("add_shelf.branch")} *
                </Label>
                <Select value={branch} onValueChange={setBranch}>
                  <SelectTrigger id="branch">
                    <SelectValue placeholder={t("add_shelf.branch_placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="branch1">{t("add_shelf.branch_placeholder")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Second Row - Discount and Price Range */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="discount" className="text-start block">
                  {t("add_shelf.discount_percentage")} *
                </Label>
                <Input
                  id="discount"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  placeholder={t("add_shelf.discount_placeholder")}
                  className="text-start"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-start block">
                  {t("add_shelf.monthly_price")} *
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder={t("add_shelf.price_placeholder_min")}
                    className="text-start"
                    required
                  />
                  <Input
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder={t("add_shelf.price_placeholder_max")}
                    className="text-start"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="availableFrom" className="text-start block">
                  {t("add_shelf.available_from")} *
                </Label>
                <div className="relative">
                  <Input
                    id="availableFrom"
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    placeholder={t("add_shelf.available_date")}
                    className="text-start pe-10"
                    required
                  />
                  <Calendar className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Price Notice */}
            <Alert className="border-orange-200 bg-orange-50">
              <Info className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-600">
                {t("add_shelf.price_increase_notice")}
              </AlertDescription>
            </Alert>

            {/* Third Row - Shelf Dimensions */}
            <div className="space-y-2">
              <Label className="text-start block">
                {t("add_shelf.rental_duration")} *
              </Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Input
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder={t("add_shelf.length")}
                    className="text-start"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder={t("add_shelf.width")}
                    className="text-start"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    value={depth}
                    onChange={(e) => setDepth(e.target.value)}
                    placeholder={t("add_shelf.depth")}
                    className="text-start"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Product Type */}
            <div className="space-y-2">
              <Label htmlFor="productType" className="text-start block">
                {t("add_shelf.product_type")}
              </Label>
              <Input
                id="productType"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                placeholder={t("add_shelf.product_type_placeholder")}
                className="text-start"
              />
            </div>

            {/* Location Section */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-start block">
                  {t("add_shelf.description_label")}
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("add_shelf.description_placeholder")}
                  className="min-h-[200px] text-start resize-none"
                />
              </div>

              {/* Map */}
              <div className="space-y-2">
                <Label className="text-start block">
                  {t("add_shelf.title_label")} *
                </Label>
                <div className="relative h-[200px] bg-muted rounded-lg overflow-hidden">
                  {/* Placeholder for map */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{t("add_shelf.location_on_map")}</p>
                    </div>
                  </div>
                  {/* Mock map image placeholder */}
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3622.5399361608!2d46.6753!3d24.7136!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjTCsDQyJzQ5LjAiTiA0NsKwNDAnMzEuMSJF!5e0!3m2!1sen!2ssa!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    className="opacity-50"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{t("add_shelf.address")}</span>
                </div>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="space-y-4">
              <Label className="text-start block font-semibold">
                {t("add_shelf.shelf_images")} *
              </Label>
              
              <div className="grid gap-4 md:grid-cols-3">
                {/* Shelf Image Upload */}
                <div className="space-y-2">
                  <div className="border-2 border-dashed border-muted rounded-lg p-6">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-medium text-center">{t("add_shelf.upload_shelf_image")}</p>
                      <p className="text-xs text-muted-foreground text-center">
                        {t("add_shelf.upload_shelf_image_desc")}
                      </p>
                      <Button variant="outline" size="sm">
                        {t("settings.store_data.choose_file")}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Interior Image Upload */}
                <div className="space-y-2">
                  <div className="border-2 border-dashed border-muted rounded-lg p-6">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-medium text-center">{t("add_shelf.upload_interior_image")}</p>
                      <p className="text-xs text-muted-foreground text-center">
                        {t("add_shelf.upload_interior_image_desc")}
                      </p>
                      <Button variant="outline" size="sm">
                        {t("settings.store_data.choose_file")}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Exterior Image Upload */}
                <div className="space-y-2">
                  <div className="border-2 border-dashed border-muted rounded-lg p-6">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-medium text-center">{t("add_shelf.upload_exterior_image")}</p>
                      <p className="text-xs text-muted-foreground text-center">
                        {t("add_shelf.upload_exterior_image_desc")}
                      </p>
                      <Button variant="outline" size="sm">
                        {t("settings.store_data.choose_file")}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <Button 
                className="px-8 py-6 text-base bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {t("add_shelf.submit_button")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}