"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Upload, MapPin, Info, CalendarIcon, Loader2, X, Coffee, ShoppingBag, Heart, Home, Baby, Dumbbell, BookOpen, Gift, Package, Check, Ruler, Box, ArrowRight, ArrowUp, ArrowLeft, HelpCircle, Plus } from "lucide-react"
import { MapPicker } from "@/components/ui/map-picker"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/localization-context"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useToast } from "@/hooks/use-toast"
import { Id } from "@/convex/_generated/dataModel"
import { NUMERIC_LIMITS } from "@/lib/constants"

interface ShelfFormProps {
  mode: "create" | "edit"
  shelfId?: Id<"shelves">
  initialData?: any
}

// Simplified product category groups with icons
const PRODUCT_CATEGORY_GROUPS = [
  {
    icon: Coffee,
    titleKey: "product_categories.food_beverages",
    value: "food_beverages",
    color: "bg-orange-50 text-orange-600 border-orange-200"
  },
  {
    icon: Heart,
    titleKey: "product_categories.health_beauty",
    value: "health_beauty",
    color: "bg-pink-50 text-pink-600 border-pink-200"
  },
  {
    icon: ShoppingBag,
    titleKey: "product_categories.fashion",
    value: "fashion",
    color: "bg-purple-50 text-purple-600 border-purple-200"
  },
  {
    icon: Package,
    titleKey: "product_categories.electronics",
    value: "electronics",
    color: "bg-blue-50 text-blue-600 border-blue-200"
  },
  {
    icon: Home,
    titleKey: "product_categories.home_living",
    value: "home_living",
    color: "bg-green-50 text-green-600 border-green-200"
  },
  {
    icon: Baby,
    titleKey: "product_categories.kids_baby",
    value: "kids_baby",
    color: "bg-yellow-50 text-yellow-600 border-yellow-200"
  },
  {
    icon: Dumbbell,
    titleKey: "product_categories.sports_fitness",
    value: "sports_fitness",
    color: "bg-red-50 text-red-600 border-red-200"
  },
  {
    icon: BookOpen,
    titleKey: "product_categories.books_stationery",
    value: "books_stationery",
    color: "bg-indigo-50 text-indigo-600 border-indigo-200"
  },
  {
    icon: Gift,
    titleKey: "product_categories.other",
    value: "other",
    color: "bg-gray-50 text-gray-600 border-gray-200"
  }
]

export function ShelfForm({ mode, shelfId, initialData }: ShelfFormProps) {
  const { t, direction, language } = useLanguage()
  const router = useRouter()
  const { user } = useCurrentUser()
  const { toast } = useToast()
  
  // Helper function to get city name in current language only
  const getCityName = (cityKey: string) => {
    // Convert the city key to lowercase for translation lookup
    const normalizedKey = cityKey.toLowerCase().replace(/-/g, '_').replace(/ /g, '_')
    const translationKey = `cities.${normalizedKey}`
    return t(translationKey as any)
  }
  
  // Convex mutations and queries
  const addShelf = useMutation(api.shelves.addShelf)
  const updateShelf = useMutation(api.shelves.updateShelf)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const getFileUrl = useMutation(api.files.getFileUrl)
  const platformSettings = useQuery(api.platformSettings.getPlatformSettings)
  const branches = useQuery(api.branches.getBranches)
  
  
  // Form states - Initialize with data if in edit mode
  const [shelfName, setShelfName] = useState(mode === "edit" ? (initialData?.shelfName || "") : "")
  const [selectedBranch, setSelectedBranch] = useState<Id<"branches"> | "">(
    mode === "edit" ? (initialData?.branchId || "") : ""
  )
  const [storeCommission, setStoreCommission] = useState(
    mode === "edit" ? 
    (initialData?.storeCommission?.toString() || initialData?.discountPercentage?.toString() || "") : 
    ""
  )
  const [monthlyPrice, setMonthlyPrice] = useState(mode === "edit" ? (initialData?.monthlyPrice?.toString() || "") : "")
  const [availableFrom, setAvailableFrom] = useState<Date | undefined>(
    mode === "edit" && initialData?.availableFrom ? new Date(initialData.availableFrom) : undefined
  )
  const [length, setLength] = useState(mode === "edit" ? (initialData?.shelfSize?.height?.toString() || "") : "")
  const [width, setWidth] = useState(mode === "edit" ? (initialData?.shelfSize?.width?.toString() || "") : "")
  const [depth, setDepth] = useState(mode === "edit" ? (initialData?.shelfSize?.depth?.toString() || "") : "")
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    mode === "edit" && initialData?.productTypes ? 
    (Array.isArray(initialData.productTypes) ? initialData.productTypes : [initialData.productType || ""]) : 
    []
  )
  const [description, setDescription] = useState(mode === "edit" ? (initialData?.description || "") : "")

  // Load existing shelf image when in edit mode
  useEffect(() => {
    if (mode === "edit" && initialData?.images) {
      const shelfImage = initialData.images.find((img: any) => img.type === "shelf")
      if (shelfImage?.url) {
        setImagePreviews({ shelf: shelfImage.url })
      }
    }
  }, [mode, initialData])

  // File states - only shelf images now (branch has exterior/interior)
  const [images, setImages] = useState<{
    shelf?: File | null
  }>({})
  const [imagePreviews, setImagePreviews] = useState<{
    shelf?: string | null
  }>({})
  const [uploadingImages, setUploadingImages] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // File input refs
  const shelfInputRef = useRef<HTMLInputElement>(null)
  
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
    if (!shelfName || !selectedBranch || !monthlyPrice || !storeCommission || !availableFrom || !length || !width || !depth) {
      toast({
        title: t("common.error"),
        description: t("add_shelf.required_fields_error"),
        variant: "destructive",
      })
      return
    }

    // Validate monthly price must be greater than 0
    const price = parseFloat(monthlyPrice)
    if (isNaN(price) || price <= 0) {
      toast({
        title: t("common.error"),
        description: t("add_shelf.price_must_be_positive"),
        variant: "destructive",
      })
      return
    }

    // Validate shelf dimensions must be greater than 0
    const lengthNum = parseFloat(length)
    const widthNum = parseFloat(width)
    const depthNum = parseFloat(depth)

    if (isNaN(lengthNum) || lengthNum <= 0 || isNaN(widthNum) || widthNum <= 0 || isNaN(depthNum) || depthNum <= 0) {
      toast({
        title: t("common.error"),
        description: t("add_shelf.dimensions_must_be_positive"),
        variant: "destructive",
      })
      return
    }

    // Validate commission percentage max
    const discount = parseFloat(storeCommission)
    const maxDiscount = NUMERIC_LIMITS.DEFAULT_MAX_DISCOUNT
    if (isNaN(discount) || discount > maxDiscount) {
      toast({
        title: t("common.error"),
        description: `${t("add_shelf.discount_max_error_dynamic")} ${maxDiscount}%`,
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      // Upload images and create images array
      const uploadedImages: any[] = []

      // Keep existing shelf images if in edit mode (only shelf type, no exterior/interior)
      if (mode === "edit" && initialData?.images) {
        const validImages = initialData.images
          .filter((img: any) => img && img.type === "shelf" && img.storageId && img.order !== undefined)
          .map((img: any) => ({
            storageId: img.storageId,
            type: img.type,
            order: img.order
          }))
        uploadedImages.push(...validImages)
      }

      setUploadingImages(true)

      // Upload new shelf image
      if (images.shelf) {
        const shelfImageId = await uploadFile(images.shelf)
        if (shelfImageId) {
          // Remove existing shelf image if any
          const filtered = uploadedImages.filter(img => img.type !== "shelf")
          filtered.push({ storageId: shelfImageId, type: "shelf", order: 0 })
          uploadedImages.length = 0
          uploadedImages.push(...filtered)
        }
      }

      setUploadingImages(false)

      const shelfData: any = {
        branchId: selectedBranch as Id<"branches">,
        shelfName,
        monthlyPrice: parseFloat(monthlyPrice),
        storeCommission: parseFloat(storeCommission),
        availableFrom: format(availableFrom, "yyyy-MM-dd"),
        length,
        width,
        depth,
        productTypes: selectedCategories,
        description,
      }

      // Include images array if we have any images
      if (uploadedImages.length > 0) {
        shelfData.images = uploadedImages
      }

      if (mode === "create") {
        await addShelf({
          ...shelfData
        })

        toast({
          title: t("common.success"),
          description: t("add_shelf.success_message"),
        })

        router.push("/store-dashboard/shelves")
      } else {
        await updateShelf({
          shelfId: shelfId!,
          ...shelfData
        })

        toast({
          title: t("common.success"),
          description: t("add_shelf.update_success_message"),
        })

        // Redirect back to the shelf details page after updating
        router.push(`/store-dashboard/shelves/${shelfId}`)
      }
    } catch (error: any) {
      console.error("Error submitting shelf:", error)
      toast({
        title: t("common.error"),
        description: error.message || t("add_shelf.submit_error"),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
      setUploadingImages(false)
    }
  }
  
  // Handle file selection (only shelf images now)
  const handleFileSelect = (file: File | null) => {
    if (file && file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: t("common.error"),
        description: t("add_shelf.file_size_error"),
        variant: "destructive",
      })
      return
    }

    setImages({ shelf: file })

    // Create preview URL
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews({ shelf: reader.result as string })
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreviews({ shelf: null })
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="grid gap-6">
          {/* First Row - Shelf Name and Branch Selection */}
          <div className="grid gap-4 md:grid-cols-2">
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
              <Label htmlFor="branch" className="text-start block">
                {t("shelves.select_branch")} *
              </Label>
              {!branches || branches.length === 0 ? (
                <Alert>
                  <AlertDescription className="flex items-center justify-between">
                    <span>{t("shelves.no_branches_available")}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/store-dashboard/branches/new")}
                    >
                      <Plus className="w-4 h-4 me-2" />
                      {t("branches.add_branch")}
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <Select
                  value={selectedBranch as string}
                  onValueChange={(value) => setSelectedBranch(value as Id<"branches">)}
                  required
                >
                  <SelectTrigger id="branch" className={cn("text-start", !selectedBranch && "text-muted-foreground")}>
                    <SelectValue placeholder={t("shelves.select_branch_placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch._id} value={branch._id}>
                        {branch.branchName} - {getCityName(branch.city)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Branch Info Display - Show selected branch details */}
          {selectedBranch && branches && (() => {
            const branch = branches.find(b => b._id === selectedBranch)
            if (!branch) return null
            return (
              <Alert>
                <AlertTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t("branches.branch_details")}
                </AlertTitle>
                <AlertDescription>
                  <p className="text-sm">
                    <strong>{t("shelves.city")}:</strong> {getCityName(branch.city)}
                  </p>
                  <p className="text-sm">
                    <strong>{t("shelves.address")}:</strong> {branch.location.address}
                  </p>
                </AlertDescription>
              </Alert>
            )
          })()}

          {/* Second Row - Pricing */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="monthlyPrice" className="text-start">
                  {t("add_shelf.monthly_price")} *
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("add_shelf.monthly_price_tooltip").replace("{fee}", platformSettings?.storeRentCommission?.toString() || "0")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="relative">
                <Input
                  id="monthlyPrice"
                  type="number"
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(e.target.value)}
                  placeholder={t("add_shelf.monthly_price_placeholder")}
                  className="text-start pe-12"
                  min="0"
                  step="0.01"
                  required
                />
                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {t("common.sar")}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="storeCommission" className="text-start">
                  {t("add_shelf.discount_percentage")} *
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("add_shelf.discount_percentage_tooltip").replace("{fee}", platformSettings?.brandSalesCommission?.toString() || "0")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="relative">
                <Input
                  id="storeCommission"
                  type="number"
                  value={storeCommission}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value)
                    const maxDiscount = NUMERIC_LIMITS.DEFAULT_MAX_DISCOUNT

                    // Allow empty value for user to clear and re-type
                    if (e.target.value === '') {
                      setStoreCommission('')
                      return
                    }

                    // Enforce min and max limits
                    if (value < 0) {
                      setStoreCommission('0')
                    } else if (value > maxDiscount) {
                      setStoreCommission(maxDiscount.toString())
                    } else {
                      setStoreCommission(e.target.value)
                    }
                  }}
                  onBlur={(e) => {
                    // On blur, ensure the value is within range
                    const value = parseFloat(e.target.value)
                    const maxDiscount = NUMERIC_LIMITS.DEFAULT_MAX_DISCOUNT

                    if (isNaN(value) || value < 0) {
                      setStoreCommission('0')
                    } else if (value > maxDiscount) {
                      setStoreCommission(maxDiscount.toString())
                    }
                  }}
                  placeholder={t("add_shelf.discount_percentage_placeholder")}
                  className="text-start pe-8"
                  min="0"
                  max={NUMERIC_LIMITS.DEFAULT_MAX_DISCOUNT}
                  step="0.1"
                  required
                />
                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  %
                </span>
              </div>
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
                      "w-full justify-start text-start",
                      !availableFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className={cn("h-4 w-4", direction === "rtl" ? "ml-2" : "mr-2")} />
                    {availableFrom ? (
                      format(availableFrom, "PPP", { locale: direction === "rtl" ? ar : enUS })
                    ) : (
                      <span>{t("add_shelf.pick_date")}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={availableFrom}
                    onSelect={setAvailableFrom}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Shelf Dimensions - Visual */}
          <div className="space-y-4">
            <Label className="text-start block">
              {t("add_shelf.shelf_dimensions")} *
            </Label>
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* Visual Representation */}
              <div className="flex items-center justify-center p-6 bg-muted/30 rounded-lg">
                <div className="relative w-full max-w-[280px] h-[200px]">
                  {/* 3D Rectangular Box - Isometric View */}
                  <svg viewBox="0 0 240 180" className="w-full h-full">
                    {/* Define the 3D box paths for a rectangular shelf */}
                    
                    {/* Top face (the shelf surface) */}
                    <path 
                      d="M 60 60 L 140 60 L 180 40 L 100 40 Z" 
                      className="fill-primary/25 stroke-primary/50"
                      strokeWidth="1.5"
                    />
                    
                    {/* Front face */}
                    <path 
                      d="M 60 60 L 140 60 L 140 120 L 60 120 Z" 
                      className="fill-primary/20 stroke-primary/50"
                      strokeWidth="1.5"
                    />
                    
                    {/* Right side face */}
                    <path 
                      d="M 140 60 L 180 40 L 180 100 L 140 120 Z" 
                      className="fill-primary/15 stroke-primary/50"
                      strokeWidth="1.5"
                    />
                    
                    {/* Dimension lines and labels */}
                    
                    {/* Width (bottom) */}
                    <line x1="60" y1="130" x2="140" y2="130" className="stroke-primary/60" strokeWidth="1" />
                    <line x1="60" y1="127" x2="60" y2="133" className="stroke-primary/60" strokeWidth="1" />
                    <line x1="140" y1="127" x2="140" y2="133" className="stroke-primary/60" strokeWidth="1" />
                    <text x="100" y="145" textAnchor="middle" className="fill-primary text-[11px] font-medium">
                      {width || '?'} {t("add_shelf.cm")}
                    </text>
                    
                    {/* Height (left side) */}
                    <line x1="50" y1="60" x2="50" y2="120" className="stroke-primary/60" strokeWidth="1" />
                    <line x1="47" y1="60" x2="53" y2="60" className="stroke-primary/60" strokeWidth="1" />
                    <line x1="47" y1="120" x2="53" y2="120" className="stroke-primary/60" strokeWidth="1" />
                    <text x="35" y="93" textAnchor="middle" className="fill-primary text-[11px] font-medium">
                      {length || '?'}
                    </text>
                    
                    {/* Depth (diagonal) - moved above the box */}
                    <line x1="145" y1="55" x2="175" y2="40" className="stroke-primary/60" strokeWidth="1" strokeDasharray="2,2" />
                    <text x="140" y="25" textAnchor="middle" className="fill-primary text-[11px] font-medium">
                      {depth || '?'} {t("add_shelf.cm")}
                    </text>
                    
                    {/* Labels for dimensions */}
                    <text x="100" y="155" textAnchor="middle" className="fill-muted-foreground text-[9px]">
                      {t("add_shelf.width")}
                    </text>
                    <text x="35" y="105" textAnchor="middle" className="fill-muted-foreground text-[9px]">
                      {t("add_shelf.length")}  
                    </text>
                    <text x="140" y="15" textAnchor="middle" className="fill-muted-foreground text-[9px]">
                      {t("add_shelf.depth")}
                    </text>
                  </svg>
                </div>
              </div>
              
              {/* Input Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ArrowUp className="h-4 w-4 text-primary" />
                    </div>
                    <Label htmlFor="length" className="text-sm font-medium">
                      {t("add_shelf.length")}
                    </Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="length"
                      type="number"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      placeholder={t("add_shelf.dimension_placeholder")}
                      className="text-start pe-12 h-10"
                      min="0"
                      step="0.01"
                      required
                    />
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      {t("add_shelf.cm")}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                    <Label htmlFor="width" className="text-sm font-medium">
                      {t("add_shelf.width")}
                    </Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="width"
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder={t("add_shelf.dimension_placeholder")}
                      className="text-start pe-12 h-10"
                      min="0"
                      step="0.01"
                      required
                    />
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      {t("add_shelf.cm")}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ArrowLeft className="h-4 w-4 text-primary" />
                    </div>
                    <Label htmlFor="depth" className="text-sm font-medium">
                      {t("add_shelf.depth")}
                    </Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="depth"
                      type="number"
                      value={depth}
                      onChange={(e) => setDepth(e.target.value)}
                      placeholder={t("add_shelf.dimension_placeholder")}
                      className="text-start pe-12 h-10"
                      min="0"
                      step="0.01"
                      required
                    />
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      {t("add_shelf.cm")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Categories */}
          <div className="space-y-3">
            <Label className="text-start block">
              {t("add_shelf.suitable_product_types")}
            </Label>
            
            {/* Category selection cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PRODUCT_CATEGORY_GROUPS.map(category => {
                const Icon = category.icon
                const isSelected = selectedCategories.includes(category.value)
                
                return (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCategories(prev => prev.filter(c => c !== category.value))
                      } else {
                        setSelectedCategories(prev => [...prev, category.value])
                      }
                    }}
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all hover:scale-105",
                      isSelected
                        ? category.color
                        : "bg-background border-border hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs font-medium text-center">
                      {t(category.titleKey as any)}
                    </span>
                    {isSelected && (
                      <div className="absolute top-2 end-2">
                        <div className="h-5 w-5 rounded-full bg-current opacity-20" />
                        <Check className="h-3 w-3 absolute top-1 start-1" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>


          {/* Description Section - After Map */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-start block">
              {t("add_shelf.description_optional")}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("add_shelf.description_example")}
              className="min-h-[120px] text-start resize-none"
            />
          </div>

          {/* Shelf Image Upload Section */}
          <div className="space-y-4">
            <Label className="text-start block font-semibold">
              {t("add_shelf.shelf_image")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("shelves.store_images_from_branch")}
            </p>

            {/* Shelf Image Upload */}
            <div className="space-y-2">
              <input
                ref={shelfInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              />
              <div className="border-2 border-dashed border-muted rounded-lg p-4 h-[200px]">
                <div className="flex flex-col items-center justify-center space-y-2 h-full">
                  {images.shelf || imagePreviews.shelf ? (
                    <>
                      {imagePreviews.shelf ? (
                        <img
                          src={imagePreviews.shelf}
                          alt="Shelf preview"
                          className="w-full h-32 object-cover rounded-md mb-2"
                        />
                      ) : (
                        <p className="text-sm font-medium text-center text-green-600">{images.shelf?.name}</p>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setImages({ shelf: null })
                          setImagePreviews({ shelf: null })
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

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/store-dashboard/shelves")}
              disabled={submitting}
            >
              {t("common.cancel")}
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || uploadingImages}
            >
              {submitting ? (
                <>
                  <Loader2 className={cn("h-4 w-4 animate-spin", direction === "rtl" ? "ml-2" : "mr-2")} />
                  {uploadingImages 
                    ? t("add_shelf.uploading_images")
                    : t("common.please_wait")
                  }
                </>
              ) : (
                mode === "create" 
                  ? t("add_shelf.submit_button")
                  : t("add_shelf.update_button")
              )}
            </Button>
          </div>
      </form>
    </div>
  )
}