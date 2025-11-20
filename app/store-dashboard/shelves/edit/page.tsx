"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, MapPin, Info, CalendarIcon } from "lucide-react"
import { MapPicker } from "@/components/ui/map-picker"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatDate } from "@/lib/formatters"
import { validateData, shelfSchema, percentageSchema } from "@/lib/validations"
import { NUMERIC_LIMITS, SAUDI_CITIES } from "@/lib/constants"
import { ar, enUS } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/localization-context"
import { useStoreData } from "@/contexts/store-data-context"
import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useToast } from "@/hooks/use-toast"
import { Id } from "@/convex/_generated/dataModel"
import Image from "next/image"

export default function AddShelfPage() {
  const { t, direction, language } = useLanguage()
  const { isLoading, isStoreDataComplete } = useStoreData()
  const router = useRouter()
  const { user } = useCurrentUser()
  const { toast } = useToast()

  // Convex mutations and queries
  const addShelf = useMutation(api.shelves.addShelf)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const platformSettings = useQuery(api.platformSettings.getPlatformSettings)

  // Form states
  const [shelfName, setShelfName] = useState("")
  const [city, setCity] = useState("")
  const [branch, setBranch] = useState("")
  const [discountPercentage, setDiscountPercentage] = useState("")
  const [monthlyPrice, setMonthlyPrice] = useState("")
  const [availableFrom, setAvailableFrom] = useState<Date | undefined>(undefined)
  const [length, setLength] = useState("")
  const [width, setWidth] = useState("")
  const [depth, setDepth] = useState("")
  const [productType, setProductType] = useState("")
  const [description, setDescription] = useState("")

  // Location states - default to Riyadh
  const [selectedLocation, setSelectedLocation] = useState({
    address: "",
    latitude: 24.7136,
    longitude: 46.6753
  })

  // Get city coordinates from constants
  const cityCoordinates = SAUDI_CITIES.reduce((acc, city) => {
    acc[city.value] = { lat: city.lat, lng: city.lng }
    return acc
  }, {} as Record<string, { lat: number; lng: number }>)

  // Update location when city changes
  useEffect(() => {
    if (city && cityCoordinates[city]) {
      setSelectedLocation(prev => ({
        ...prev,
        latitude: cityCoordinates[city].lat,
        longitude: cityCoordinates[city].lng
      }))
    }
  }, [city, cityCoordinates])

  // File states
  const [exteriorImage, setExteriorImage] = useState<File | null>(null)
  const [interiorImage, setInteriorImage] = useState<File | null>(null)
  const [shelfImage, setShelfImage] = useState<File | null>(null)
  const [exteriorPreview, setExteriorPreview] = useState<string | null>(null)
  const [interiorPreview, setInteriorPreview] = useState<string | null>(null)
  const [shelfPreview, setShelfPreview] = useState<string | null>(null)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // File input refs
  const exteriorInputRef = useRef<HTMLInputElement>(null)
  const interiorInputRef = useRef<HTMLInputElement>(null)
  const shelfInputRef = useRef<HTMLInputElement>(null)

  // Memoized values for MapPicker
  const defaultLocation = useMemo(() => ({
    lat: selectedLocation.latitude,
    lng: selectedLocation.longitude,
    address: selectedLocation.address
  }), [selectedLocation.latitude, selectedLocation.longitude, selectedLocation.address])

  const handleLocationSelect = useCallback((location: { lat: number; lng: number; address: string }) => {
    setSelectedLocation({
      latitude: location.lat,
      longitude: location.lng,
      address: location.address
    })
  }, [])

  // Redirect if store data is not complete
  if (!isLoading && !isStoreDataComplete) {
    router.push("/store-dashboard/settings")
    return null
  }

  // Upload file to Convex storage
  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const uploadUrl = await generateUploadUrl({})
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })
      const { storageId } = await result.json()
      return storageId
    } catch (error) {
      console.error("Error uploading file:", error)
      return null
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: t("common.error"),
        description: t("common.user_not_found"),
        variant: "destructive",
      })
      return
    }

    // Validate required fields
    if (!shelfName || !city || !branch || !monthlyPrice || !discountPercentage || !availableFrom || !length || !width || !depth) {
      toast({
        title: t("common.error"),
        description: t("common.fill_required_fields"),
        variant: "destructive",
      })
      return
    }

    // Validate discount percentage
    const discountValidation = validateData(percentageSchema, discountPercentage)
    if (!discountValidation.success) {
      toast({
        title: t("common.error"),
        description: Object.values(discountValidation.errors)[0],
        variant: "destructive",
      })
      return
    }
    const discount = discountValidation.data
    const maxDiscount = platformSettings?.maximumDiscountPercentage || NUMERIC_LIMITS.DEFAULT_MAX_DISCOUNT
    if (discount > maxDiscount) {
      toast({
        title: t("common.error"),
        description: t("add_shelf.max_discount_error").replace("{max}", maxDiscount.toString()),
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      // Upload images if they exist
      let exteriorImageId: string | null = null
      let interiorImageId: string | null = null
      let shelfImageId: string | null = null

      if (exteriorImage || interiorImage || shelfImage) {
        setUploadingImages(true)

        if (exteriorImage) {
          exteriorImageId = await uploadFile(exteriorImage)
        }
        if (interiorImage) {
          interiorImageId = await uploadFile(interiorImage)
        }
        if (shelfImage) {
          shelfImageId = await uploadFile(shelfImage)
        }

        setUploadingImages(false)
      }

      // Create shelf in database
      await addShelf({
        shelfName,
        branchId: branch as Id<"branches">,
        monthlyPrice: parseFloat(monthlyPrice),
        storeCommission: discount,
        availableFrom: availableFrom ? formatDate(availableFrom, 'en', 'short').split('/').reverse().join('-') : new Date().toISOString().split('T')[0],
        length,
        width,
        depth,
        productTypes: productType ? [productType] : [],
        description: description || undefined,
      })

      toast({
        title: t("common.success"),
        description: t("add_shelf.success_message"),
      })

      // Redirect to shelves page
      router.push("/store-dashboard/shelves")
    } catch (error) {
      console.error("Error creating shelf:", error)
      toast({
        title: t("common.error"),
        description: t("add_shelf.error_message"),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
      setUploadingImages(false)
    }
  }

  // Handle file selection
  const handleFileSelect = (type: 'exterior' | 'interior' | 'shelf', file: File | null) => {
    if (file && file.size > NUMERIC_LIMITS.FILE_SIZE_MAX) {
      toast({
        title: t("common.error"),
        description: t("add_shelf.file_size_error"),
        variant: "destructive",
      })
      return
    }

    // Create preview URL for images
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const previewUrl = reader.result as string
        switch (type) {
          case 'exterior':
            setExteriorPreview(previewUrl)
            break
          case 'interior':
            setInteriorPreview(previewUrl)
            break
          case 'shelf':
            setShelfPreview(previewUrl)
            break
        }
      }
      reader.readAsDataURL(file)
    } else {
      // Clear preview if not an image
      switch (type) {
        case 'exterior':
          setExteriorPreview(null)
          break
        case 'interior':
          setInteriorPreview(null)
          break
        case 'shelf':
          setShelfPreview(null)
          break
      }
    }

    switch (type) {
      case 'exterior':
        setExteriorImage(file)
        break
      case 'interior':
        setInteriorImage(file)
        break
      case 'shelf':
        setShelfImage(file)
        break
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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
          <form onSubmit={handleSubmit} className="grid gap-6">
            {/* First Row - Shelf Name, City, Branch */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                <Select value={city} onValueChange={setCity} required>
                  <SelectTrigger id="city" className={cn("text-start", !city && "text-muted-foreground")}>
                    <SelectValue placeholder={t("add_shelf.city_placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {SAUDI_CITIES.map(city => (
                      <SelectItem key={city.value} value={city.value}>
                        {city.nameAr} - {city.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch" className="text-start block">
                  {t("add_shelf.branch")} *
                </Label>
                <Input
                  id="branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder={t("add_shelf.branch_placeholder")}
                  className="text-start"
                  required
                />
              </div>
            </div>

            {/* Second Row - Price, Discount and Available From */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="monthlyPrice" className="text-start block">
                  {t("add_shelf.monthly_price")} *
                </Label>
                <Input
                  id="monthlyPrice"
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(e.target.value)}
                  placeholder={t("add_shelf.price_placeholder_min")}
                  className="text-start"
                  required
                />
              </div>

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
                <Label htmlFor="availableFrom" className="text-start block">
                  {t("add_shelf.available_from")} *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-start font-normal",
                        !availableFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="me-2 h-4 w-4" />
                      {availableFrom ? (
                        formatDate(availableFrom, language, 'full')
                      ) : (
                        <span>{t("add_shelf.available_date")}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={availableFrom}
                      onSelect={setAvailableFrom}
                      disabled={(date) => date < new Date()}
                      locale={language === "ar" ? ar : enUS}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Price Notice */}
            <Alert className="border-yellow-500 bg-yellow-50">
              <Info className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-900">
                {t("add_shelf.platform_fee_notice").replace("{fee}", (platformSettings?.storeRentCommission ?? 0).toString())}
              </AlertDescription>
            </Alert>

            {/* Third Row - Shelf Dimensions */}
            <div className="space-y-2">
              <Label className="text-start block">
                {t("add_shelf.rental_duration")} *
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-start block">
                  {t("form.description_optional")}
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("form.description_example")}
                  className="min-h-[260px] text-start resize-none"
                />
              </div>

              {/* Map */}
              <div className="space-y-2">
                <Label className="text-start block">
                  {t("form.address")} *
                </Label>
                <div className="space-y-3">
                  {/* Interactive Map Container */}
                  <MapPicker
                    defaultLocation={defaultLocation}
                    onLocationSelect={handleLocationSelect}
                    height="200px"
                    zoom={15}
                  />

                  {/* Selected location display */}
                  <div className="border rounded-lg p-3 bg-muted/30">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          {selectedLocation.address || t("form.click_map_select_location")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="space-y-4">
              <Label className="text-start block font-semibold">
                {t("add_shelf.shelf_images")} *
              </Label>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Exterior Image Upload */}
                <div className="space-y-2">
                  <input
                    ref={exteriorInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect('exterior', e.target.files?.[0] || null)}
                  />
                  <div className="border-2 border-dashed border-muted rounded-lg p-4">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      {exteriorImage ? (
                        <>
                          {exteriorPreview ? (
                            <div className="relative w-full h-32 rounded-md mb-2 overflow-hidden">
                              <Image
                                src={exteriorPreview}
                                alt="Exterior preview"
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <p className="text-sm font-medium text-center text-green-600">{exteriorImage.name}</p>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setExteriorImage(null)
                              setExteriorPreview(null)
                              if (exteriorInputRef.current) exteriorInputRef.current.value = ''
                            }}
                          >
                            {t("common.remove")}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm font-medium text-center">{t("add_shelf.upload_exterior_image")}</p>
                          <p className="text-xs text-muted-foreground text-center">
                            {t("add_shelf.upload_exterior_image_desc")}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => exteriorInputRef.current?.click()}
                          >
                            {t("settings.store_data.choose_file")}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Interior Image Upload */}
                <div className="space-y-2">
                  <input
                    ref={interiorInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect('interior', e.target.files?.[0] || null)}
                  />
                  <div className="border-2 border-dashed border-muted rounded-lg p-4">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      {interiorImage ? (
                        <>
                          {interiorPreview ? (
                            <div className="relative w-full h-32 rounded-md mb-2 overflow-hidden">
                              <Image
                                src={interiorPreview}
                                alt="Interior preview"
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <p className="text-sm font-medium text-center text-green-600">{interiorImage.name}</p>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setInteriorImage(null)
                              setInteriorPreview(null)
                              if (interiorInputRef.current) interiorInputRef.current.value = ''
                            }}
                          >
                            {t("common.remove")}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm font-medium text-center">{t("add_shelf.upload_interior_image")}</p>
                          <p className="text-xs text-muted-foreground text-center">
                            {t("add_shelf.upload_interior_image_desc")}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => interiorInputRef.current?.click()}
                          >
                            {t("settings.store_data.choose_file")}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shelf Image Upload */}
                <div className="space-y-2">
                  <input
                    ref={shelfInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleFileSelect('shelf', e.target.files?.[0] || null)}
                  />
                  <div className="border-2 border-dashed border-muted rounded-lg p-4">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      {shelfImage ? (
                        <>
                          {shelfPreview ? (
                            <div className="relative w-full h-32 rounded-md mb-2 overflow-hidden">
                              <Image
                                src={shelfPreview}
                                alt="Shelf preview"
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <p className="text-sm font-medium text-center text-green-600">{shelfImage.name}</p>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShelfImage(null)
                              setShelfPreview(null)
                              if (shelfInputRef.current) shelfInputRef.current.value = ''
                            }}
                          >
                            {t("common.remove")}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm font-medium text-center">{t("add_shelf.upload_shelf_image")}</p>
                          <p className="text-xs text-muted-foreground text-center">
                            {t("add_shelf.upload_shelf_image_desc")}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => shelfInputRef.current?.click()}
                          >
                            {t("settings.store_data.choose_file")}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <Button
                type="submit"
                className="px-8 py-6 text-base bg-primary hover:bg-primary/90"
                disabled={isLoading || submitting || uploadingImages}
              >
                {submitting ? (
                  uploadingImages ? t("common.uploading_images") : t("common.submitting")
                ) : (
                  t("add_shelf.submit_button")
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}