"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, MapPin, Info, CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"
import { useStoreData } from "@/contexts/store-data-context"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useToast } from "@/hooks/use-toast"
import { Id } from "@/convex/_generated/dataModel"

export default function AddShelfPage() {
  const { t, direction } = useLanguage()
  const { isLoading, isStoreDataComplete } = useStoreData()
  const router = useRouter()
  const { user } = useCurrentUser()
  const { toast } = useToast()
  
  // Convex mutations
  const addShelf = useMutation(api.shelves.addShelf)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  
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
    address: t("add_shelf.default_address"),
    latitude: 24.7136,
    longitude: 46.6753
  })
  
  // Update location address when city or branch changes
  useEffect(() => {
    if (city || branch) {
      const locationParts = [branch, city].filter(Boolean)
      if (locationParts.length > 0 && !selectedLocation.address) {
        setSelectedLocation(prev => ({
          ...prev,
          address: locationParts.join(", ")
        }))
      }
    }
  }, [city, branch])
  
  // File states
  const [exteriorImage, setExteriorImage] = useState<File | null>(null)
  const [interiorImage, setInteriorImage] = useState<File | null>(null)
  const [shelfImage, setShelfImage] = useState<File | null>(null)
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
    
    // Validate discount percentage (max 22%)
    const discount = parseFloat(discountPercentage)
    if (isNaN(discount) || discount > 22) {
      toast({
        title: t("common.error"),
        description: t("add_shelf.discount_max_error"),
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
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t("add_shelf.city_placeholder")}
                  className="text-start"
                  required
                />
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
            <Alert variant="default">
              <Info className="h-4 w-4" />
              <AlertDescription>
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
                  {t("add_shelf.address_label")} *
                </Label>
                <div className="space-y-2">
                  {/* Map Container */}
                  <div className="relative h-[250px] bg-gray-100 rounded-lg overflow-hidden border">
                    {/* Google Map embed - centered on Riyadh by default */}
                    <iframe
                      src={`https://maps.google.com/maps?q=${selectedLocation.latitude},${selectedLocation.longitude}&z=15&output=embed&hl=${direction === 'rtl' ? 'ar' : 'en'}`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                  
                  {/* Selected location display */}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="font-medium">
                      {selectedLocation.address}
                    </span>
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
                  <div className="border-2 border-dashed border-muted rounded-lg p-6">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      {exteriorImage ? (
                        <>
                          <p className="text-sm font-medium text-center text-green-600">{exteriorImage.name}</p>
                          <Button 
                            type="button"
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setExteriorImage(null)
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
                  <div className="border-2 border-dashed border-muted rounded-lg p-6">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      {interiorImage ? (
                        <>
                          <p className="text-sm font-medium text-center text-green-600">{interiorImage.name}</p>
                          <Button 
                            type="button"
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setInteriorImage(null)
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
                  <div className="border-2 border-dashed border-muted rounded-lg p-6">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      {shelfImage ? (
                        <>
                          <p className="text-sm font-medium text-center text-green-600">{shelfImage.name}</p>
                          <Button 
                            type="button"
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setShelfImage(null)
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