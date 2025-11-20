"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { Camera, Save, Plus, Trash2, Edit2, Calendar, Eye, Upload, CheckCircle, AlertCircle, Lock, Info } from "lucide-react"
import { useLanguage } from "@/contexts/localization-context"
import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { validateSaudiIBAN, SAUDI_BANKS } from "@/lib/saudi-iban-validator"
import { cn } from "@/lib/utils"
import { BRAND_BUSINESS_CATEGORIES_AR, BRAND_BUSINESS_CATEGORIES_EN } from "@/lib/constants"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useToast } from "@/hooks/use-toast"
import { ImageCropper } from "@/components/image-cropper"
import { useBrandData } from "@/contexts/brand-data-context"
import { BrandProfileCompletionProgress } from "@/components/brand-profile-completion-progress"
import { Combobox } from "@/components/ui/combobox"

export default function BrandDashboardSettingsPage() {
  const { t, direction, language } = useLanguage()
  const { user } = useCurrentUser()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const { userData: brandUserData } = useBrandData() // Get userData from context

  // Get initial tab from URL or default to "general"
  const initialTab = searchParams.get("tab") || "general"
  const [activeTab, setActiveTab] = useState(initialTab)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isDefault, setIsDefault] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null)
  const [showLogoCropper, setShowLogoCropper] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Form states for General tab
  const [ownerName, setOwnerName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Form states for Brand Data tab
  const [brandName, setBrandName] = useState("")
  const [businessCategory, setBusinessCategory] = useState("")
  const [website, setWebsite] = useState("")
  const [commercialRegisterNumber, setCommercialRegisterNumber] = useState("")
  const [freelanceLicenseNumber, setFreelanceLicenseNumber] = useState("")
  const [isFreelance, setIsFreelance] = useState(false)
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  const [pendingDocumentFile, setPendingDocumentFile] = useState<File | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const documentInputRef = useRef<HTMLInputElement>(null)

  // Validation states
  const [websiteError, setWebsiteError] = useState<string>("")
  const [crNumberError, setCrNumberError] = useState<string>("")

  // Form states for Payment dialog
  const [bankCode, setBankCode] = useState("")
  const [accountHolderName, setAccountHolderName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [iban, setIban] = useState("")
  const [ibanValidation, setIbanValidation] = useState<{ isValid: boolean; error?: string; bankName?: string; formattedIBAN?: string }>({ isValid: false })
  const [ibanCertificateFile, setIbanCertificateFile] = useState<File | null>(null)
  const [ibanCertificateUrl, setIbanCertificateUrl] = useState<string | null>(null)
  const certificateInputRef = useRef<HTMLInputElement>(null)

  // Convex mutations
  const updateGeneralSettings = useMutation(api.users.updateGeneralSettings)
  const updateBrandData = useMutation(api.users.updateBrandData)
  const addBankAccount = useMutation(api.bankAccounts.addBankAccount)
  const deleteBankAccount = useMutation(api.bankAccounts.deleteBankAccount)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const getFileUrl = useMutation(api.files.getFileUrl)
  const updateProfileImage = useMutation(api.users.updateProfileImage)
  const updateBusinessRegistrationDocument = useMutation(api.users.updateBusinessRegistrationDocument)
  const updateFreelanceDocument = useMutation(api.users.updateFreelanceDocument)

  // Convex queries - only bank accounts since userData comes from context
  const bankAccounts = useQuery(api.bankAccounts.getBankAccounts, user ? {} : "skip")

  // Update tab when URL parameter changes
  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (tabParam && ["general", "brand-data", "payment"].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Load user data when available from context - only initialize form fields once
  useEffect(() => {
    if (brandUserData && !hasInitialized) {
      // Profile data is nested under the profile property
      const profile = brandUserData.profile
      setOwnerName(profile?.fullName || brandUserData.name || "")
      setPhoneNumber(profile?.phoneNumber || brandUserData.phone || "")
      setEmail(profile?.email || brandUserData.email || "")
      setBrandName(profile?.brandName || "")
      setBusinessCategory(profile?.businessCategory || "")
      setWebsite(profile?.website || "")
      setCommercialRegisterNumber(profile?.commercialRegisterNumber || "")
      setFreelanceLicenseNumber(profile?.freelanceLicenseNumber || "")
      setIsFreelance(profile?.businessType === "freelancer" || false)
      setProfileImageUrl(brandUserData.image || null)

      // Handle initial document URL loading
      const backendDocumentUrl = profile?.commercialRegisterDocumentUrl || profile?.freelanceLicenseDocumentUrl || null
      if (backendDocumentUrl) {
        setDocumentUrl(backendDocumentUrl)
        sessionStorage.removeItem('temp_document_url')
      } else {
        const tempUrl = sessionStorage.getItem('temp_document_url')
        if (tempUrl) {
          setDocumentUrl(tempUrl)
        }
      }

      setHasInitialized(true)
    }
  }, [brandUserData, hasInitialized])

  // Separate effect for handling document URL updates after initialization
  useEffect(() => {
    if (brandUserData && hasInitialized) {
      const profile = brandUserData.profile
      const backendDocumentUrl = profile?.commercialRegisterDocumentUrl || profile?.freelanceLicenseDocumentUrl || null

      if (backendDocumentUrl && !pendingDocumentFile) {
        // Update document URL if backend has a new one and we're not in the middle of selecting a new file
        setDocumentUrl(backendDocumentUrl)
        sessionStorage.removeItem('temp_document_url')
      }
    }
  }, [brandUserData, hasInitialized, pendingDocumentFile])

  // Validation functions
  const validateWebsite = (url: string): boolean => {
    if (!url.trim()) {
      setWebsiteError("")
      return true // Optional field
    }

    try {
      const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
      if (!urlPattern.test(url)) {
        setWebsiteError(language === 'ar' ? 'يرجى إدخال رابط صحيح (مثال: https://example.com)' : 'Please enter a valid URL (e.g., https://example.com)')
        return false
      }
      setWebsiteError("")
      return true
    } catch (error) {
      setWebsiteError(language === 'ar' ? 'يرجى إدخال رابط صحيح' : 'Please enter a valid URL')
      return false
    }
  }

  const validateSaudiCRNumber = (crNumber: string): boolean => {
    if (!crNumber.trim()) {
      setCrNumberError("")
      return true // Will be validated as required in save function if not freelance
    }

    const cleanNumber = crNumber.replace(/[^0-9]/g, '')
    if (cleanNumber.length !== 10) {
      setCrNumberError(language === 'ar' ? 'يجب أن يتكون رقم السجل التجاري السعودي من 10 أرقام' : 'Saudi Commercial Registration number must be exactly 10 digits')
      return false
    }
    setCrNumberError("")
    return true
  }

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: t("settings.general.error"),
        description: t("settings.general.invalid_image_type"),
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t("settings.general.error"),
        description: t("settings.general.image_too_large"),
        variant: "destructive",
      })
      return
    }

    setSelectedImageFile(file)
    setShowCropper(true)
  }

  // Handle cropped image upload
  const handleCroppedImage = async (croppedBlob: Blob) => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl({})

      // Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": croppedBlob.type },
        body: croppedBlob,
      })

      const { storageId } = await result.json()

      // Get the URL for the uploaded file
      const imageUrl = await getFileUrl({ storageId })

      // Update the profile image
      if (imageUrl) {
        await updateProfileImage({
          imageUrl: imageUrl,
        })
      }

      setProfileImageUrl(typeof imageUrl === 'string' ? imageUrl : null)

      toast({
        title: t("settings.general.success"),
        description: t("settings.general.image_updated"),
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: t("settings.general.error"),
        description: t("settings.general.image_upload_error"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setSelectedImageFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Handle document upload (PDF or image)
  const handleDocumentUpload = async (file: File | Blob) => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl({})

      // Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || 'application/octet-stream' },
        body: file,
      })

      const { storageId } = await result.json()

      // Update the document URL in the user record
      await updateBusinessRegistrationDocument({
        storageId: storageId,
      })

      toast({
        title: t("settings.brand_data.success"),
        description: isFreelance
          ? t("settings.brand_data.freelance_document_uploaded")
          : t("settings.brand_data.commercial_registration_uploaded"),
      })
    } catch (error) {
      console.error("Error uploading document:", error)
      toast({
        title: t("settings.general.error"),
        description: t("settings.brand_data.document_upload_error"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setSelectedLogoFile(null)
      if (logoInputRef.current) {
        logoInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Completion Progress */}
      <BrandProfileCompletionProgress
        showDetails={true}
        onCompletionChange={(percentage) => setCompletionPercentage(percentage)}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-3xl">
          <TabsTrigger value="general">{t("settings.tabs.general")}</TabsTrigger>
          <TabsTrigger value="brand-data">{t("settings.tabs.brand_data")}</TabsTrigger>
          <TabsTrigger value="payment">{t("settings.tabs.payment")}</TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardContent className="space-y-6 pt-6">
              {/* Brand Logo Section */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 flex-shrink-0">
                  <AvatarImage src={profileImageUrl || "/placeholder.svg?height=96&width=96"} alt="Brand Logo" />
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
                  <h3 className="text-lg font-semibold">{t("settings.general.upload_brand_logo")}</h3>
                  <p className="text-sm text-muted-foreground">{t("settings.general.logo_hint")}</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    disabled={isLoading || !!brandUserData?.image}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                    {isLoading ? t("settings.general.uploading") : t("settings.general.change_photo")}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Basic Information - Read Only */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t("settings.general.basic_info")}</h3>
                <div className="space-y-2">
                  <Label htmlFor="ownerName" className="block">{t("settings.general.owner_name")}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="ownerName"
                      value={ownerName}
                      disabled
                      className="bg-muted"
                    />
                    <span className="text-xs text-muted-foreground">{t("settings.general.cannot_change")}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Brand Data Tab */}
        <TabsContent value="brand-data" className="space-y-6">
          {/* Lock Warning Alert */}
          {completionPercentage === 100 ? (
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertTitle>{t("settings.locked_at_100")}</AlertTitle>
              <AlertDescription>
                {t("settings.brand_data.profile_locked_description")}
              </AlertDescription>
            </Alert>
          ) : completionPercentage > 0 && (
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800 dark:text-blue-400">
                {t("settings.complete_remaining")}
              </AlertTitle>
            </Alert>
          )}

          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                {/* Brand Name and Type */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="brandName" className="text-start block">
                      {t("settings.brand_data.brand_name")} *
                    </Label>
                    <Input
                      id="brandName"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder={t("settings.brand_data.brand_name_placeholder")}
                      className="text-start"
                      required
                      disabled={!!brandUserData?.profile?.brandName}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessCategory" className="text-start block">
                      {t("settings.brand_data.business_category")} *
                    </Label>
                    <Combobox
                      value={businessCategory}
                      onChange={setBusinessCategory}
                      options={language === 'ar' ? [...BRAND_BUSINESS_CATEGORIES_AR] : [...BRAND_BUSINESS_CATEGORIES_EN]}
                      placeholder={t("settings.brand_data.business_category_placeholder")}
                      searchPlaceholder={language === 'ar' ? 'ابحث عن فئة الأعمال...' : 'Search business categories...'}
                      emptyMessage={language === 'ar' ? 'لا توجد فئات مطابقة' : 'No matching categories found'}
                      disabled={!!brandUserData?.profile?.businessCategory}
                    />
                  </div>
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-start block">
                    {t("settings.brand_data.website")}
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => {
                      setWebsite(e.target.value)
                      validateWebsite(e.target.value)
                    }}
                    placeholder={t("settings.brand_data.website_placeholder")}
                    className={cn(
                      "text-start",
                      websiteError ? "border-red-500 focus:border-red-500" : ""
                    )}
                    disabled={!!brandUserData?.profile?.website}
                  />
                  {websiteError && (
                    <p className="text-xs text-red-500">{websiteError}</p>
                  )}
                </div>

                {/* Commercial Registration Number / Freelance Document */}
                <div className="space-y-2">
                  <Label htmlFor="registration" className="text-start block">
                    {isFreelance ? t("settings.brand_data.freelance_document_number") : t("settings.brand_data.commercial_reg")} *
                  </Label>
                  <Input
                    id="registration"
                    value={isFreelance ? freelanceLicenseNumber : commercialRegisterNumber}
                    onChange={(e) => {
                      const value = e.target.value
                      if (isFreelance) {
                        setFreelanceLicenseNumber(value)
                      } else {
                        const numericValue = value.replace(/[^0-9]/g, '')
                        setCommercialRegisterNumber(numericValue)
                        validateSaudiCRNumber(numericValue)
                      }
                    }}
                    placeholder={isFreelance ? t("settings.brand_data.freelance_document_placeholder") : t("settings.brand_data.commercial_reg_placeholder")}
                    className={cn(
                      "text-start",
                      !isFreelance && crNumberError ? "border-red-500 focus:border-red-500" : ""
                    )}
                    pattern={isFreelance ? undefined : "[0-9]*"}
                    inputMode={isFreelance ? "text" : "numeric"}
                    required
                    disabled={!!(brandUserData?.profile?.commercialRegisterNumber || brandUserData?.profile?.freelanceLicenseNumber)}
                  />
                  {!isFreelance && crNumberError && (
                    <p className="text-xs text-red-500">{crNumberError}</p>
                  )}
                </div>

                {/* No Commercial Registration Checkbox */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="noCommercialReg"
                    checked={isFreelance}
                    onCheckedChange={(checked) => {
                      setIsFreelance(checked as boolean)
                    }}
                    disabled={!!brandUserData?.profile?.businessType}
                  />
                  <Label
                    htmlFor="noCommercialReg"
                    className="text-sm font-normal cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {t("settings.brand_data.no_commercial_reg")}
                  </Label>
                </div>

                {/* Business Registration Document Upload Section */}
                <div className="space-y-2">
                  <Label className="text-start block">
                    {isFreelance ? t("settings.brand_data.freelance_document") : t("settings.brand_data.commercial_register_document")} *
                  </Label>
                  <div className="border-2 border-dashed border-muted rounded-lg p-6">
                    {documentUrl ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                          </div>
                          <div className="text-start">
                            <p className="text-sm font-medium">{t("settings.brand_data.document_uploaded")}</p>
                            <p className="text-xs text-muted-foreground">{t("settings.brand_data.document_ready")}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (documentUrl) {
                                window.open(documentUrl, '_blank')
                              }
                            }}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            {t("settings.brand_data.preview_document")}
                          </Button>
                          {completionPercentage < 100 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setDocumentUrl(null)
                                setPendingDocumentFile(null)
                                if (documentInputRef.current) {
                                  documentInputRef.current.value = ''
                                }
                              }}
                            >
                              {t("settings.brand_data.remove_document")}
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <input
                          ref={documentInputRef}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return

                            if (file.size > 10 * 1024 * 1024) {
                              toast({
                                title: t("settings.general.error"),
                                description: t("settings.brand_data.file_too_large"),
                                variant: "destructive",
                              })
                              return
                            }

                            // Just store the file locally, don't upload yet
                            setPendingDocumentFile(file)
                            // Create a local URL for preview
                            const localUrl = URL.createObjectURL(file)
                            setDocumentUrl(localUrl)

                            toast({
                              title: t("settings.general.info"),
                              description: t("settings.brand_data.document_ready_to_save"),
                            })
                          }}
                        />
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-muted-foreground">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">
                            {isFreelance
                              ? t("settings.brand_data.upload_freelance_document")
                              : t("settings.brand_data.upload_commercial_registration")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t("settings.brand_data.accepted_formats")}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => documentInputRef.current?.click()}
                          disabled={isLoading || !!(brandUserData?.profile?.commercialRegisterDocument || brandUserData?.profile?.freelanceLicenseDocument)}
                        >
                          {isLoading ? t("settings.general.uploading") : t("settings.brand_data.choose_file")}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              {completionPercentage < 100 && (
                <div className="flex justify-end">
                  <Button
                    className="gap-2"
                    disabled={isLoading || !user?.id}
                    onClick={async () => {
                    if (!user?.id) return

                    // Validate required fields
                    const registrationNumber = isFreelance ? freelanceLicenseNumber : commercialRegisterNumber;
                    if (!brandName || !businessCategory || !registrationNumber || !phoneNumber) {
                      toast({
                        title: t("settings.brand_data.validation_error"),
                        description: t("settings.brand_data.fill_required_fields"),
                        variant: "destructive",
                      })
                      return
                    }

                    // Validate document upload
                    if (!documentUrl) {
                      toast({
                        title: t("settings.brand_data.validation_error"),
                        description: t("settings.brand_data.document_required"),
                        variant: "destructive",
                      })
                      return
                    }

                    // Validate website URL if provided
                    if (website && !validateWebsite(website)) {
                      toast({
                        title: t("settings.brand_data.validation_error"),
                        description: websiteError,
                        variant: "destructive",
                      })
                      return
                    }

                    // Validate CR number if not freelance
                    if (!isFreelance && !validateSaudiCRNumber(commercialRegisterNumber)) {
                      toast({
                        title: t("settings.brand_data.validation_error"),
                        description: crNumberError,
                        variant: "destructive",
                      })
                      return
                    }

                    setIsLoading(true)
                    try {
                      // First, upload the document if there's a pending one
                      let documentStorageId = null
                      if (pendingDocumentFile) {
                        // Get upload URL from Convex
                        const uploadUrl = await generateUploadUrl({})

                        // Upload file to Convex storage
                        const result = await fetch(uploadUrl, {
                          method: "POST",
                          headers: { "Content-Type": pendingDocumentFile.type },
                          body: pendingDocumentFile,
                        })

                        const { storageId } = await result.json()
                        documentStorageId = storageId

                        // Update brand with the document storage ID
                        if (isFreelance) {
                          await updateFreelanceDocument({
                            storageId: storageId,
                          })
                        } else {
                          await updateBusinessRegistrationDocument({
                            storageId: storageId,
                          })
                        }

                        // Get the actual URL for the uploaded file
                        const fileUrl = await getFileUrl({ storageId })
                        setDocumentUrl(fileUrl)
                        setPendingDocumentFile(null) // Clear pending file after successful upload

                        // Store the URL to prevent it from being cleared
                        sessionStorage.setItem('temp_document_url', fileUrl || '')
                      }

                      // Then update the brand data
                      await updateBrandData({
                        brandName,
                        businessCategory,
                        businessType: isFreelance ? "freelancer" : "registered_company",
                        commercialRegisterNumber: !isFreelance ? commercialRegisterNumber : undefined,
                        freelanceLicenseNumber: isFreelance ? freelanceLicenseNumber : undefined,
                        website: website || undefined,
                      })

                      toast({
                        title: t("settings.brand_data.success"),
                        description: t("settings.brand_data.success_message"),
                      })

                      // Update session storage for dashboard
                      const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}')
                      sessionStorage.setItem('currentUser', JSON.stringify({
                        ...currentUser,
                        brandName,
                        businessCategory,
                        commercialRegisterNumber: !isFreelance ? commercialRegisterNumber : '',
                        freelanceLicenseNumber: isFreelance ? freelanceLicenseNumber : '',
                        isFreelance,
                        phoneNumber,
                      }))
                    } catch (error) {
                      toast({
                        title: t("settings.brand_data.error"),
                        description: t("settings.brand_data.error_message"),
                        variant: "destructive",
                      })
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? t("settings.brand_data.saving") : t("settings.brand_data.save_changes")}
                </Button>
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings Tab */}
        <TabsContent value="payment" className="space-y-6">
          {/* Payment Methods Table */}
          <div className="space-y-4">
            <div className="flex flex-row items-center justify-between">
              <h3 className="text-xl font-semibold">{t("settings.payment.payment_methods_title")}</h3>
              <Button className="gap-2" onClick={() => setIsPaymentDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                {t("settings.payment.add_payment_method")}
              </Button>
            </div>
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
                  {bankAccounts?.map((account) => (
                    <TableRow key={account._id}>
                      <TableCell className="font-medium">{account.bankName}</TableCell>
                      <TableCell>
                        {account.accountNumber || ''} - {account.accountNumber?.slice(-4).padStart(account.accountNumber.length, '*') || ''}
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.isActive ? "default" : "secondary"}>
                          {account.isActive ? t("settings.payment.active") : t("settings.payment.inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell>{t("settings.payment.physical")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={async () => {
                              try {
                                await deleteBankAccount({ bankAccountId: account._id })
                                toast({
                                  title: t("settings.payment.deleted"),
                                  description: t("settings.payment.deleted_message"),
                                })
                              } catch (error) {
                                toast({
                                  title: t("settings.payment.error"),
                                  description: t("settings.payment.error_message"),
                                  variant: "destructive",
                                })
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!bankAccounts || bankAccounts.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        {t("settings.payment.no_payment_methods")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Payment Records Table */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">{t("settings.payment.payment_records_summary")}</h3>
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
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {t("settings.payment.no_payment_records")}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Payment Method Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {t("settings.payment.dialog.title")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Bank Selection */}
            <div className="space-y-2">
              <Label htmlFor="bank" className="text-start block">
                {t("settings.payment.dialog.select_bank")} *
              </Label>
              <Select value={bankCode} onValueChange={setBankCode}>
                <SelectTrigger id="bank" className="w-full">
                  <SelectValue placeholder={t("settings.payment.dialog.bank_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {SAUDI_BANKS.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {language === 'ar' ? bank.nameAr : bank.name}
                    </SelectItem>
                  ))}
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
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
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
                value={accountNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '')
                  setAccountNumber(value)
                }}
                placeholder={t("settings.payment.dialog.account_number_placeholder")}
                className="w-full"
                pattern="[0-9]*"
                inputMode="numeric"
              />
            </div>

            {/* IBAN */}
            <div className="space-y-2">
              <Label htmlFor="iban" className="text-start block">
                {t("settings.payment.dialog.iban")} *
              </Label>
              <div className="relative">
                <Input
                  id="iban"
                  value={iban}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase()
                    setIban(value)
                    // Validate IBAN as user types
                    if (value.length >= 2) {
                      const validation = validateSaudiIBAN(value)
                      setIbanValidation(validation)
                      // Auto-select bank if IBAN is valid
                      if (validation.isValid && validation.bankCode) {
                        setBankCode(validation.bankCode)
                      }
                    } else {
                      setIbanValidation({ isValid: false })
                    }
                  }}
                  placeholder="SA00 0000 0000 0000 0000 0000"
                  className={cn(
                    "w-full pe-10",
                    iban.length > 10 && (ibanValidation.isValid ? "border-green-500" : "border-red-500")
                  )}
                  maxLength={29} // SA + 22 digits + 6 spaces
                />
                {iban.length > 10 && (
                  <div className="absolute end-2 top-1/2 -translate-y-1/2">
                    {ibanValidation.isValid ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {iban.length > 2 && !ibanValidation.isValid && ibanValidation.error && (
                <p className="text-xs text-red-500">
                  {(() => {
                    switch (ibanValidation.error) {
                      case 'IBAN must start with SA for Saudi Arabia':
                        return language === 'ar' ? 'يجب أن يبدأ رقم الآيبان بـ SA للمملكة العربية السعودية' : 'IBAN must start with SA for Saudi Arabia'
                      case 'Saudi IBAN must be exactly 24 characters':
                        return language === 'ar' ? 'يجب أن يكون رقم الآيبان السعودي 24 حرفًا بالضبط' : 'Saudi IBAN must be exactly 24 characters'
                      case 'IBAN must contain only digits after SA':
                        return language === 'ar' ? 'يجب أن يحتوي رقم الآيبان على أرقام فقط بعد SA' : 'IBAN must contain only digits after SA'
                      case 'Invalid bank code in IBAN':
                        return language === 'ar' ? 'رمز البنك غير صحيح في رقم الآيبان' : 'Invalid bank code in IBAN'
                      case 'Invalid IBAN checksum':
                        return language === 'ar' ? 'رقم الآيبان غير صحيح' : 'Invalid IBAN checksum'
                      default:
                        return ibanValidation.error
                    }
                  })()}
                </p>
              )}
              {ibanValidation.isValid && ibanValidation.bankName && (
                <p className="text-xs text-green-600">
                  {t("settings.payment.dialog.detected_bank")}: {ibanValidation.bankName}
                </p>
              )}
            </div>

            {/* IBAN Certificate Upload */}
            <div className="space-y-2">
              <Label className="block">
                {t("settings.payment.dialog.iban_certificate")} *
              </Label>
              <div className="border-2 border-dashed rounded-lg p-4">
                {ibanCertificateUrl || ibanCertificateFile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {ibanCertificateFile?.name || t("settings.payment.dialog.certificate_uploaded")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ibanCertificateFile ?
                            `${(ibanCertificateFile.size / 1024).toFixed(1)} KB` :
                            t("settings.payment.dialog.certificate_ready")}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIbanCertificateFile(null)
                        setIbanCertificateUrl(null)
                        if (certificateInputRef.current) {
                          certificateInputRef.current.value = ''
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      {t("settings.payment.dialog.upload_certificate_hint")}
                    </p>
                    <input
                      ref={certificateInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setIbanCertificateFile(file)
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => certificateInputRef.current?.click()}
                    >
                      {t("settings.payment.dialog.choose_file")}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Default Checkbox */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="default"
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked as boolean)}
              />
              <Label
                htmlFor="default"
                className="text-sm font-normal cursor-pointer"
              >
                {t("settings.payment.dialog.set_as_default")}
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
            <Button
              disabled={isLoading || !user?.id}
              onClick={async () => {
                if (!user?.id) return

                // Validate required fields
                if (!bankCode || !accountHolderName || !iban) {
                  toast({
                    title: t("settings.payment.validation_error"),
                    description: t("settings.payment.fill_all_fields"),
                    variant: "destructive",
                  })
                  return
                }

                // Validate IBAN
                if (!ibanValidation.isValid) {
                  toast({
                    title: t("settings.payment.validation_error"),
                    description: t("settings.payment.invalid_iban"),
                    variant: "destructive",
                  })
                  return
                }

                // Check if certificate is uploaded
                if (!ibanCertificateFile && !ibanCertificateUrl) {
                  toast({
                    title: t("settings.payment.validation_error"),
                    description: t("settings.payment.certificate_required"),
                    variant: "destructive",
                  })
                  return
                }

                setIsLoading(true)
                try {
                  let certificateUrl = ibanCertificateUrl

                  // Upload certificate if new file selected
                  if (ibanCertificateFile) {
                    const uploadUrl = await generateUploadUrl({})
                    const uploadResult = await fetch(uploadUrl, {
                      method: "POST",
                      headers: { "Content-Type": ibanCertificateFile.type },
                      body: ibanCertificateFile,
                    })

                    if (!uploadResult.ok) {
                      throw new Error("Failed to upload certificate")
                    }

                    const { storageId } = await uploadResult.json()
                    certificateUrl = await getFileUrl({ storageId })
                  }

                  // Get bank name from code
                  const selectedBank = SAUDI_BANKS.find(b => b.code === bankCode)
                  const bankName = language === 'ar' ? selectedBank?.nameAr : selectedBank?.name

                  await addBankAccount({
                    bankName: bankName || bankCode,
                    accountHolderName,
                    accountNumber,
                    iban: ibanValidation.formattedIBAN || iban,
                    isDefault,
                  })

                  toast({
                    title: t("settings.payment.success"),
                    description: t("settings.payment.added_message"),
                  })

                  // Reset form
                  setBankCode("")
                  setAccountHolderName("")
                  setAccountNumber("")
                  setIban("")
                  setIbanValidation({ isValid: false })
                  setIbanCertificateFile(null)
                  setIbanCertificateUrl(null)
                  setIsDefault(false)
                  setIsPaymentDialogOpen(false)
                } catch (error) {
                  toast({
                    title: t("settings.payment.error"),
                    description: t("settings.payment.error_message"),
                    variant: "destructive",
                  })
                } finally {
                  setIsLoading(false)
                }
              }}
            >
              {t("settings.payment.dialog.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Image Cropper Dialog */}
      <ImageCropper
        open={showCropper}
        onClose={() => {
          setShowCropper(false)
          setSelectedImageFile(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }}
        imageFile={selectedImageFile}
        onCropComplete={handleCroppedImage}
        aspectRatio={1}
        cropShape="round"
      />

      {/* Business Registration Document Cropper Dialog */}
      <ImageCropper
        open={showLogoCropper}
        onClose={() => {
          setShowLogoCropper(false)
          setSelectedLogoFile(null)
          if (logoInputRef.current) {
            logoInputRef.current.value = ''
          }
        }}
        imageFile={selectedLogoFile}
        onCropComplete={async (croppedBlob) => {
          setShowLogoCropper(false)
          await handleDocumentUpload(croppedBlob)
        }}
        aspectRatio={16 / 9}
        cropShape="rect"
      />
    </div>
  )
}