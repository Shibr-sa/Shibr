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
import { Camera, Save, Plus, Trash2, Edit2, Calendar, Eye } from "lucide-react"
import { useLanguage } from "@/contexts/localization-context"
import { useState, useEffect, useRef } from "react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useToast } from "@/hooks/use-toast"
import { useStoreData } from "@/contexts/store-data-context"
import { ImageCropper } from "@/components/image-cropper"

export default function StoreDashboardSettingsPage() {
  const { t, direction } = useLanguage()
  const { user } = useCurrentUser()
  const { toast } = useToast()
  const { userData: storeUserData } = useStoreData() // Get userData from context
  const [activeTab, setActiveTab] = useState("general")
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isVirtual, setIsVirtual] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [selectedDocumentFile, setSelectedDocumentFile] = useState<File | null>(null)
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  const [pendingDocumentFile, setPendingDocumentFile] = useState<File | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)
  const documentInputRef = useRef<HTMLInputElement>(null)
  
  // Form states for General tab
  const [ownerName, setOwnerName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  // Form states for Store Data tab
  const [storeName, setStoreName] = useState("")
  const [storeType, setStoreType] = useState("")
  const [website, setWebsite] = useState("")
  const [businessReg, setBusinessReg] = useState("")
  const [city, setCity] = useState("")
  const [area, setArea] = useState("")
  const [address, setAddress] = useState("")
  
  // Form states for Payment dialog
  const [bankName, setBankName] = useState("")
  const [accountName, setAccountName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [iban, setIban] = useState("")
  
  // Convex mutations
  const updateGeneralSettings = useMutation(api.users.updateGeneralSettings)
  const updateStoreData = useMutation(api.users.updateStoreData)
  const addPaymentMethod = useMutation(api.paymentMethods.addPaymentMethod)
  const deletePaymentMethod = useMutation(api.paymentMethods.deletePaymentMethod)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const getFileUrl = useMutation(api.files.getFileUrl)
  const updateProfileImage = useMutation(api.users.updateProfileImage)
  const updateBusinessRegistrationDocument = useMutation(api.users.updateBusinessRegistrationDocument)
  
  // Convex queries - only payment methods since userData comes from context
  const paymentMethods = useQuery(api.paymentMethods.getPaymentMethods, user ? {} : "skip")
  
  // Load user data when available from context - only initialize once
  useEffect(() => {
    if (storeUserData && !hasInitialized) {
      // Profile data is nested under the profile property
      const profile = storeUserData.profile
      setOwnerName(profile?.fullName || storeUserData.name || "")
      setPhoneNumber(profile?.phoneNumber || storeUserData.phone || "")
      setEmail(profile?.email || storeUserData.email || "")
      setStoreName(profile?.storeName || "")
      setStoreType(profile?.storeType || "")
      setWebsite(profile?.website || "")
      setBusinessReg(profile?.commercialRegisterNumber || "")
      setCity(profile?.storeLocation?.city || "")
      setArea(profile?.storeLocation?.area || "")
      setAddress(profile?.storeLocation?.address || "")
      setProfileImageUrl(storeUserData.image || null)
      
      // Handle initial document URL loading
      const backendDocumentUrl = profile?.commercialRegisterDocumentUrl || null
      if (backendDocumentUrl) {
        setDocumentUrl(backendDocumentUrl)
        sessionStorage.removeItem('temp_store_document_url')
      } else {
        const tempUrl = sessionStorage.getItem('temp_store_document_url')
        if (tempUrl) {
          setDocumentUrl(tempUrl)
        }
      }
      
      setHasInitialized(true)
    }
  }, [storeUserData, hasInitialized])
  
  // Separate effect for handling document URL updates after initialization
  useEffect(() => {
    if (storeUserData && hasInitialized) {
      const profile = storeUserData.profile
      const backendDocumentUrl = profile?.commercialRegisterDocumentUrl || null
      
      if (backendDocumentUrl && !pendingDocumentFile) {
        // Update document URL if backend has a new one and we're not in the middle of selecting a new file
        setDocumentUrl(backendDocumentUrl)
        sessionStorage.removeItem('temp_store_document_url')
      }
    }
  }, [storeUserData, hasInitialized, pendingDocumentFile])

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
      const uploadUrl = await generateUploadUrl()
      
      // Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": croppedBlob.type },
        body: croppedBlob,
      })
      
      const { storageId } = await result.json()
      
      // Get the URL for the uploaded file
      const imageUrl = await updateProfileImage({
        profileImageId: storageId,
      })
      
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

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" >
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
                  <AvatarImage src={profileImageUrl || "/placeholder.svg?height=96&width=96"} alt="Store Logo" />
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
                    disabled={isLoading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                    {isLoading ? t("settings.general.uploading") : t("settings.general.change_photo")}
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
                    <Input 
                      id="ownerName" 
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="text-start" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-start block">{t("settings.general.phone_number")}</Label>
                    <Input 
                      id="phoneNumber" 
                      type="tel" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+966 5X XXX XXXX" 
                      className="text-start" 
                       
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-start block">{t("settings.general.email")}</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="text-start" 
                       
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-start block">{t("settings.general.password")}</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="text-start" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  className="gap-2"
                  disabled={isLoading || !user?.id}
                  onClick={async () => {
                    if (!user?.id) return
                    
                    setIsLoading(true)
                    try {
                      const updateData: any = {}
                      if (ownerName) updateData.ownerName = ownerName
                      if (phoneNumber) updateData.phoneNumber = phoneNumber
                      if (email) updateData.email = email
                      if (password) updateData.password = password
                      
                      await updateGeneralSettings(updateData)
                      
                      toast({
                        title: t("settings.general.success"),
                        description: t("settings.general.success_message"),
                      })
                    } catch (error) {
                      toast({
                        title: t("settings.general.error"),
                        description: t("settings.general.error_message"),
                        variant: "destructive",
                      })
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? t("settings.general.saving") : t("settings.general.save_changes")}
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
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
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
                      value={storeType}
                      onChange={(e) => setStoreType(e.target.value)}
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
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder={t("settings.store_data.website_placeholder")}
                    className="text-start" 
                                     />
                </div>

                {/* Commercial Registration Number */}
                <div className="space-y-2">
                  <Label htmlFor="businessReg" className="text-start block">
                    {t("settings.store_data.commercial_reg")} *
                  </Label>
                  <Input 
                    id="businessReg" 
                    value={businessReg}
                    onChange={(e) => setBusinessReg(e.target.value)}
                    placeholder={t("settings.store_data.commercial_reg_placeholder")}
                    className="text-start" 
                    required
                  />
                </div>

                {/* Commercial Register Document Upload Section */}
                <div className="space-y-2">
                  <Label className="text-start block">
                    {t("settings.store_data.commercial_register_document")} *
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
                            <p className="text-sm font-medium">{t("settings.store_data.document_uploaded")}</p>
                            <p className="text-xs text-muted-foreground">{t("settings.store_data.document_ready")}</p>
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
                            {t("settings.store_data.preview_document")}
                          </Button>
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
                            {t("settings.store_data.remove_document")}
                          </Button>
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
                                description: t("settings.store_data.file_too_large"),
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
                              description: t("settings.store_data.document_ready_to_save"),
                            })
                          }}
                        />
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-muted-foreground">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">{t("settings.store_data.upload_commercial_register")}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t("settings.store_data.accepted_formats")}
                          </p>
                        </div>
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm"
                          onClick={() => documentInputRef.current?.click()}
                          disabled={isLoading}
                        >
                          {isLoading ? t("settings.general.uploading") : t("settings.store_data.choose_file")}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button 
                  className="gap-2"
                  disabled={isLoading || !user?.id}
                  onClick={async () => {
                    if (!user?.id) return
                    
                    // Validate required fields
                    if (!ownerName || !email || !phoneNumber) {
                      toast({
                        title: t("settings.store_data.validation_error"),
                        description: t("settings.store_data.basic_info_required"),
                        variant: "destructive",
                      })
                      return
                    }
                    
                    if (!storeName || !storeType || !businessReg) {
                      toast({
                        title: t("settings.store_data.validation_error"),
                        description: t("settings.store_data.fill_required_fields"),
                        variant: "destructive",
                      })
                      return
                    }
                    
                    // Validate document upload
                    if (!documentUrl) {
                      toast({
                        title: t("settings.store_data.validation_error"),
                        description: t("settings.store_data.document_required"),
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
                        const uploadUrl = await generateUploadUrl()
                        
                        // Upload file to Convex storage
                        const result = await fetch(uploadUrl, {
                          method: "POST",
                          headers: { "Content-Type": pendingDocumentFile.type },
                          body: pendingDocumentFile,
                        })
                        
                        const { storageId } = await result.json()
                        documentStorageId = storageId
                        
                        // Update the document in the database
                        await updateBusinessRegistrationDocument({
                          documentId: storageId,
                        })
                        
                        // Get the actual URL for the uploaded file
                        const fileUrl = await getFileUrl({ storageId })
                        setDocumentUrl(fileUrl)
                        setPendingDocumentFile(null) // Clear pending file after successful upload
                        
                        // Store the URL temporarily to prevent it from being cleared
                        sessionStorage.setItem('temp_store_document_url', fileUrl || '')
                      }
                      
                      // First update general settings with basic info
                      await updateGeneralSettings({
                        ownerName,
                        email,
                        phoneNumber,
                      })
                      
                      // Then update store-specific data
                      await updateStoreData({
                        storeName,
                        storeType,
                        businessRegistration: businessReg,
                        isFreelance: false,
                        website: website || undefined,
                        phoneNumber,
                      })
                      
                      toast({
                        title: t("settings.store_data.success"),
                        description: t("settings.store_data.success_message"),
                      })
                      
                      // Update session storage for dashboard
                      const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}')
                      sessionStorage.setItem('currentUser', JSON.stringify({
                        ...currentUser,
                        storeName,
                        storeType,
                        businessReg: businessReg,
                        phoneNumber,
                      }))
                    } catch (error) {
                      toast({
                        title: t("settings.store_data.error"),
                        description: t("settings.store_data.error_message"),
                        variant: "destructive",
                      })
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? t("settings.store_data.saving") : t("settings.store_data.save_changes")}
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
                    {paymentMethods?.map((method) => (
                      <TableRow key={method._id}>
                        <TableCell className="font-medium">{method.bankName}</TableCell>
                        <TableCell>
                          {method.accountNumber || 'N/A'} - {method.accountNumber?.slice(-4).padStart(method.accountNumber.length, '*') || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={method.isActive ? "default" : "secondary"}>
                            {method.isActive ? t("settings.payment.active") : t("settings.payment.inactive")}
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
                                  await deletePaymentMethod({ paymentMethodId: method._id })
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
                    {(!paymentMethods || paymentMethods.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          {t("settings.payment.no_payment_methods")}
                        </TableCell>
                      </TableRow>
                    )}
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
                      <TableCell className="font-medium">1 {t("common.june")}</TableCell>
                      <TableCell>{t("settings.payment.bank_transfer")}</TableCell>
                      <TableCell>{t("settings.payment.payment_from_riyadh_shelf")}</TableCell>
                      <TableCell>{t("settings.payment.completed")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            {t("settings.payment.download_invoice")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">1 {t("common.june")} ({t("common.new")})</TableCell>
                      <TableCell>{t("settings.payment.bank_transfer")}</TableCell>
                      <TableCell>{t("settings.payment.shelf_renewal_fees")}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {t("settings.payment.pending_confirmation")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs">
                            <Calendar className="w-4 h-4" />
                            {t("settings.payment.pay_invoice")}
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
                {t("settings.payment.dialog.select_bank")}
              </Label>
              <Select value={bankName} onValueChange={setBankName}>
                <SelectTrigger id="bank" className="w-full">
                  <SelectValue placeholder={t("settings.payment.dialog.bank_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Al-Rajhi Bank">{t("settings.payment.banks.alrajhi")}</SelectItem>
                  <SelectItem value="National Commercial Bank">{t("settings.payment.banks.ncb")}</SelectItem>
                  <SelectItem value="SABB">{t("settings.payment.banks.sabb")}</SelectItem>
                  <SelectItem value="Riyad Bank">{t("settings.payment.banks.riyad")}</SelectItem>
                  <SelectItem value="Alinma Bank">{t("settings.payment.banks.alinma")}</SelectItem>
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
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
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
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={t("settings.payment.dialog.account_number_placeholder")}
                className="w-full"
                             />
            </div>

            {/* IBAN */}
            <div className="space-y-2">
              <Label htmlFor="iban" className="text-start block">
                {t("settings.payment.dialog.iban")}
              </Label>
              <Input
                id="iban"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder={t("settings.payment.dialog.iban_placeholder")}
                className="w-full"
                             />
            </div>

            {/* Virtual Checkbox */}
            <div className="flex items-center gap-2">
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
            <Button 
              disabled={isLoading || !user?.id}
              onClick={async () => {
                if (!user?.id) return
                
                // Validate required fields
                if (!bankName || !accountName || !accountNumber || !iban) {
                  toast({
                    title: t("settings.payment.validation_error"),
                    description: t("settings.payment.fill_all_fields"),
                    variant: "destructive",
                  })
                  return
                }
                
                setIsLoading(true)
                try {
                  await addPaymentMethod({
                    bankName,
                    accountName,
                    accountNumber,
                    iban,
                    isVirtual,
                  })
                  
                  toast({
                    title: t("settings.payment.success"),
                    description: t("settings.payment.added_message"),
                  })
                  
                  // Reset form
                  setBankName("")
                  setAccountName("")
                  setAccountNumber("")
                  setIban("")
                  setIsVirtual(false)
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

    </div>
  )
}