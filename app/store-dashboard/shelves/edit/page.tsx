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
import { format } from "date-fns"
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
  
  // City coordinates in Saudi Arabia
  const cityCoordinates: Record<string, { lat: number; lng: number }> = {
    riyadh: { lat: 24.7136, lng: 46.6753 },
    jeddah: { lat: 21.5433, lng: 39.1728 },
    mecca: { lat: 21.4225, lng: 39.8262 },
    medina: { lat: 24.5247, lng: 39.5692 },
    dammam: { lat: 26.3927, lng: 49.9777 },
    khobar: { lat: 26.2172, lng: 50.1971 },
    dhahran: { lat: 26.2361, lng: 50.0393 },
    taif: { lat: 21.4373, lng: 40.5128 },
    buraidah: { lat: 26.3266, lng: 43.9750 },
    tabuk: { lat: 28.3835, lng: 36.5662 },
    hail: { lat: 27.5219, lng: 41.6907 },
    "hafar-al-batin": { lat: 28.4337, lng: 45.9601 },
    jubail: { lat: 27.0046, lng: 49.6460 },
    najran: { lat: 17.5656, lng: 44.2289 },
    abha: { lat: 18.2164, lng: 42.5053 },
    "khamis-mushait": { lat: 18.3060, lng: 42.7297 },
    jazan: { lat: 16.8892, lng: 42.5511 },
    yanbu: { lat: 24.0893, lng: 38.0618 },
    "al-qatif": { lat: 26.5195, lng: 50.0240 },
    unaizah: { lat: 26.0844, lng: 43.9935 },
    arar: { lat: 30.9753, lng: 41.0381 },
    sakaka: { lat: 29.9697, lng: 40.2064 },
    "al-kharj": { lat: 24.1556, lng: 47.3120 },
    "al-ahsa": { lat: 25.3487, lng: 49.5856 }
  }

  // Update location when city changes
  useEffect(() => {
    if (city && cityCoordinates[city]) {
      setSelectedLocation(prev => ({
        ...prev,
        latitude: cityCoordinates[city].lat,
        longitude: cityCoordinates[city].lng
      }))
    }
  }, [city])
  
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

  // Redirect if store data is not complete
  if (!isLoading && !isStoreDataComplete) {
    router.push("/store-dashboard/settings")
    return null
  }
  
  // Upload file to Convex storage
  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const uploadUrl = await generateUploadUrl()
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
    
    // Validate discount percentage (max from settings or 22%)
    const discount = parseFloat(discountPercentage)
    const maxDiscount = platformSettings?.maximumDiscountPercentage || 22
    if (isNaN(discount) || discount > maxDiscount) {
      toast({
        title: t("common.error"),
        description: language === "ar" 
          ? `الحد الأقصى للخصم هو ${maxDiscount}%`
          : `Maximum discount is ${maxDiscount}%`,
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
        userId: user.id as Id<"users">,
        shelfName,
        city,
        branch,
        monthlyPrice: parseFloat(monthlyPrice),
        discountPercentage: discount,
        availableFrom: availableFrom ? format(availableFrom, "yyyy-MM-dd") : new Date().toISOString().split('T')[0],
        length,
        width,
        depth,
        productType: productType || undefined,
        description: description || undefined,
        address: selectedLocation.address || undefined,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        exteriorImage: exteriorImageId || undefined,
        interiorImage: interiorImageId || undefined,
        shelfImage: shelfImageId || undefined,
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
    if (file && file.size > 10 * 1024 * 1024) { // 10MB limit
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
                <Select value={city} onValueChange={setCity} required>
                  <SelectTrigger id="city" className={cn("text-start", !city && "text-muted-foreground")}>
                    <SelectValue placeholder={t("add_shelf.city_placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="riyadh">الرياض - Riyadh</SelectItem>
                    <SelectItem value="jeddah">جدة - Jeddah</SelectItem>
                    <SelectItem value="mecca">مكة المكرمة - Mecca</SelectItem>
                    <SelectItem value="medina">المدينة المنورة - Medina</SelectItem>
                    <SelectItem value="dammam">الدمام - Dammam</SelectItem>
                    <SelectItem value="khobar">الخبر - Khobar</SelectItem>
                    <SelectItem value="dhahran">الظهران - Dhahran</SelectItem>
                    <SelectItem value="taif">الطائف - Taif</SelectItem>
                    <SelectItem value="buraidah">بريدة - Buraidah</SelectItem>
                    <SelectItem value="tabuk">تبوك - Tabuk</SelectItem>
                    <SelectItem value="hail">حائل - Hail</SelectItem>
                    <SelectItem value="hafar-al-batin">حفر الباطن - Hafar Al-Batin</SelectItem>
                    <SelectItem value="jubail">الجبيل - Jubail</SelectItem>
                    <SelectItem value="najran">نجران - Najran</SelectItem>
                    <SelectItem value="abha">أبها - Abha</SelectItem>
                    <SelectItem value="khamis-mushait">خميس مشيط - Khamis Mushait</SelectItem>
                    <SelectItem value="jazan">جازان - Jazan</SelectItem>
                    <SelectItem value="yanbu">ينبع - Yanbu</SelectItem>
                    <SelectItem value="al-qatif">القطيف - Al-Qatif</SelectItem>
                    <SelectItem value="unaizah">عنيزة - Unaizah</SelectItem>
                    <SelectItem value="arar">عرعر - Arar</SelectItem>
                    <SelectItem value="sakaka">سكاكا - Sakaka</SelectItem>
                    <SelectItem value="al-kharj">الخرج - Al-Kharj</SelectItem>
                    <SelectItem value="al-ahsa">الأحساء - Al-Ahsa</SelectItem>
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
            <div className="grid gap-4 md:grid-cols-3">
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
                        format(availableFrom, "PPP", { 
                          locale: direction === "rtl" ? ar : enUS 
                        })
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
                      locale={direction === "rtl" ? ar : enUS}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Price Notice */}
            <Alert className="border-yellow-500 bg-yellow-50">
              <Info className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-900">
                {language === "ar" 
                  ? `السعر سوف يضاف عليه نسبة شبر هي ${platformSettings?.platformFeePercentage || 8}%` 
                  : `A ${platformSettings?.platformFeePercentage || 8}% Shibr fee will be added to the price`}
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
                  {language === "ar" ? "الوصف (اختياري)" : "Description (Optional)"}
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={language === "ar" ? "مثال: يجانب الباب - يمين الداخل" : "Example: Next to the door - Right side when entering"}
                  className="min-h-[260px] text-start resize-none"
                />
              </div>

              {/* Map */}
              <div className="space-y-2">
                <Label className="text-start block">
                  {language === "ar" ? "العنوان" : "Address"} *
                </Label>
                <div className="space-y-3">
                  {/* Interactive Map Container */}
                  <MapPicker
                    defaultLocation={useMemo(() => ({
                      lat: selectedLocation.latitude,
                      lng: selectedLocation.longitude,
                      address: selectedLocation.address
                    }), [selectedLocation.latitude, selectedLocation.longitude])}
                    onLocationSelect={useCallback((location) => {
                      setSelectedLocation({
                        latitude: location.lat,
                        longitude: location.lng,
                        address: location.address
                      })
                    }, [])}
                    height="200px"
                    zoom={15}
                  />
                  
                  {/* Selected location display */}
                  <div className="border rounded-lg p-3 bg-muted/30">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          {selectedLocation.address || (language === "ar" ? "انقر على الخريطة لتحديد الموقع" : "Click on the map to select location")}
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
              
              <div className="grid gap-4 md:grid-cols-3">
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
                            <img 
                              src={exteriorPreview} 
                              alt="Exterior preview" 
                              className="w-full h-32 object-cover rounded-md mb-2"
                            />
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
                            <img 
                              src={interiorPreview} 
                              alt="Interior preview" 
                              className="w-full h-32 object-cover rounded-md mb-2"
                            />
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
                            <img 
                              src={shelfPreview} 
                              alt="Shelf preview" 
                              className="w-full h-32 object-cover rounded-md mb-2"
                            />
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