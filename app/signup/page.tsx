"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Eye, ArrowRight, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useLanguage } from "@/contexts/localization-context"
import { useAuthActions } from "@convex-dev/auth/react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useToast } from "@/hooks/use-toast"
import { createSignUpSchema, formatSaudiPhoneNumber } from "@/lib/validations/auth"
import { z } from "zod"

export default function SignUpPage() {

  const [accountType, setAccountType] = useState<"store-owner" | "brand-owner">("store-owner")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    storeName: "",
    brandName: "",
    agreeToTerms: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, direction, language } = useLanguage()
  const { toast } = useToast()
  const { signIn } = useAuthActions()
  const currentUser = useQuery(api.users.getCurrentUser)
  const createStoreProfile = useMutation(api.users.createStoreProfile)
  const createBrandProfile = useMutation(api.users.createBrandProfile)

  // Get account type from URL parameter
  useEffect(() => {
    const typeParam = searchParams.get('type')
    if (typeParam === 'store-owner' || typeParam === 'brand-owner') {
      setAccountType(typeParam)
    }
    // If no type provided, default to store-owner (don't redirect)
  }, [searchParams])

  const validateField = (fieldName: string, value: any) => {
    try {
      const fieldData = { ...formData, [fieldName]: value, accountType }
      const signUpSchema = createSignUpSchema(t)
      signUpSchema.partial().parse({ [fieldName]: value })
      setErrors(prev => ({ ...prev, [fieldName]: "" }))
      return true
    } catch (error) {
      if (error instanceof z.ZodError && error.issues) {
        const fieldError = error.issues.find((err: any) => err.path && err.path[0] === fieldName)
        if (fieldError) {
          setErrors(prev => ({ ...prev, [fieldName]: fieldError.message }))
        }
      }
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    try {
      const validationData = {
        ...formData,
        accountType,
        phoneNumber: formData.phoneNumber ? formatSaudiPhoneNumber(formData.phoneNumber) : '',
      }

      const signUpSchema = createSignUpSchema(t)
      signUpSchema.parse(validationData)
      // If validation passes, clear any existing errors
      setErrors({})
    } catch (error: any) {
      // Check if it's a Zod error by checking for the issues property
      if (error && error.issues && Array.isArray(error.issues)) {
        const newErrors: Record<string, string> = {}

        // Take only the first error for each field
        error.issues.forEach((err: any) => {
          if (err.path && err.path[0]) {
            const fieldName = err.path[0] as string
            // Only set error if we haven't already set one for this field
            if (!newErrors[fieldName]) {
              newErrors[fieldName] = err.message
            }
          }
        })

        setErrors(newErrors)
      }
      // Always return on validation error
      return
    }

    setIsLoading(true)

    try {
      // Create FormData for Convex Auth signup
      const authFormData = new FormData()
      authFormData.append("email", formData.email.toLowerCase().trim())
      authFormData.append("password", formData.password)
      authFormData.append("flow", "signUp")
      authFormData.append("name", formData.fullName.trim())
      authFormData.append("phone", formatSaudiPhoneNumber(formData.phoneNumber))
      
      // Sign up the user first (name and phone stored in users table)
      await signIn("password", authFormData)
      
      // Use exponential backoff for profile creation
      let profileResult = null
      let retryCount = 0
      const maxRetries = 8
      const baseDelay = 1000 // Start with 1 second
      
      while (!profileResult && retryCount < maxRetries) {
        try {
          // Calculate delay with exponential backoff (1s, 2s, 4s, 8s, etc.)
          const delay = Math.min(baseDelay * Math.pow(2, retryCount), 10000) // Cap at 10 seconds
          
          // Wait before attempting profile creation
          if (retryCount > 0) {
            console.log(`Retry attempt ${retryCount + 1} after ${delay}ms delay`)
          }
          await new Promise(resolve => setTimeout(resolve, delay))
          
          if (accountType === "store-owner") {
            profileResult = await createStoreProfile({
              storeName: formData.storeName.trim(),
              businessCategory: "", // Will be updated in settings
              commercialRegisterNumber: "", // Will be updated in settings
            })
          } else {
            profileResult = await createBrandProfile({
              brandName: formData.brandName.trim(),
            })
          }
          
          // If we get here, profile creation succeeded
          console.log("Profile created successfully")
          break
        } catch (error: any) {
          console.error(`Profile creation attempt ${retryCount + 1} failed:`, error?.message)
          
          // If profile already exists, that's actually fine - it means it was created
          if (error?.message?.includes("already exists")) {
            // Fetch the user profile since it exists
            const accountTypeName = accountType === "store-owner" ? "store_owner" : "brand_owner"
            profileResult = { accountType: accountTypeName }
            break
          }
          
          // If auth not ready, continue retrying with backoff
          if (error?.message?.includes("Not authenticated")) {
            retryCount++
            if (retryCount >= maxRetries) {
              throw new Error(t("auth.profile_creation_timeout"))
            }
          } else {
            // Other errors, throw immediately
            throw error
          }
        }
      }
      
      if (!profileResult) {
        throw new Error(t("auth.profile_creation_timeout"))
      }

      // Email verification is now handled in the profile creation functions
      toast({
        title: t("auth.success"),
        description: t("auth.account_created_verify_email") || "Account created! Please check your email to verify your account.",
      })

      // Add a small delay to ensure auth session is fully established
      await new Promise(resolve => setTimeout(resolve, 500))

      // Redirect to email verification page instead of dashboard
      router.push("/verify-email")
    } catch (error: any) {
      // More specific error handling
      let errorMessage = t("auth.signup_failed")
      
      if (error?.message?.includes("already exists")) {
        errorMessage = t("auth.account_already_exists")
      } else if (error?.message?.includes("Invalid email")) {
        errorMessage = t("auth.invalid_email")
      } else if (error?.message?.includes("password")) {
        errorMessage = t("auth.weak_password")
      } else if (error?.message?.includes("timeout")) {
        errorMessage = t("auth.signup_timeout")
      }
      
      toast({
        title: t("auth.error"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Validate field on change (with debounce for email)
    if (name !== "email" || value.includes("@")) {
      validateField(name, value)
    }
  }
  
  const handleEmailBlur = () => {
    validateField("email", formData.email)
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <Image
              src="/logo.svg"
              alt={t("common.logo_alt")}
              width={48}
              height={48}
              className="h-12 w-12"
            />
            <span className="text-3xl font-bold text-foreground">{t("common.shibr")}</span>
          </div>
        </div>

        {/* Sign Up Form */}
        <Card>
          <CardHeader className="text-center pb-6">
            <h1 className="text-2xl font-bold mb-3">{t("auth.create_account")}</h1>
            <p className="text-muted-foreground text-sm">{t("auth.signup_description")}</p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Show selected account type if coming from select-type page */}
              {searchParams.get('type') ? (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">{t("auth.registering_as")}</p>
                  <p className="font-medium">
                    {accountType === "store-owner" ? t("auth.store_owner") : t("auth.brand_owner")}
                  </p>
                  <Link
                    href="/signup/select-type"
                    className="text-xs text-primary hover:underline mt-2 inline-block"
                  >
                    {t("auth.change_account_type")}
                  </Link>
                </div>
              ) : (
                /* Show inline account type selection if accessed directly */
                <div className="space-y-3">
                  <Label>{t("auth.account_type")}</Label>
                  <ToggleGroup
                    type="single"
                    value={accountType}
                    onValueChange={(value: "store-owner" | "brand-owner") => {
                      if (value) setAccountType(value)
                    }}
                    className="grid grid-cols-2 gap-2"
                    variant="outline"
                  >
                    <ToggleGroupItem value="store-owner" variant="outline">
                      {t("auth.im_store_owner")}
                    </ToggleGroupItem>
                    <ToggleGroupItem value="brand-owner" variant="outline">
                      {t("auth.im_brand_owner")}
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              )}

              {/* Name Fields - Side by Side */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Full Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    {t("auth.full_name")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder={t("auth.full_name_placeholder")}
                    className={errors.fullName ? "border-destructive" : ""}
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    aria-invalid={!!errors.fullName}
                    aria-describedby={errors.fullName ? "fullName-error" : undefined}
                  />
                  {errors.fullName && (
                    <p id="fullName-error" className="text-xs text-destructive">{errors.fullName}</p>
                  )}
                </div>

                {/* Store/Brand Name Field */}
                {accountType === "store-owner" ? (
                  <div className="space-y-2">
                    <Label htmlFor="storeName">
                      {t("auth.store_name")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="storeName"
                      name="storeName"
                      type="text"
                      placeholder={t("auth.store_name_placeholder")}
                      className={errors.storeName ? "border-destructive" : ""}
                      value={formData.storeName}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      aria-invalid={!!errors.storeName}
                      aria-describedby={errors.storeName ? "storeName-error" : undefined}
                    />
                    {errors.storeName && (
                      <p id="storeName-error" className="text-xs text-destructive">{errors.storeName}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="brandName">
                      {t("auth.brand_name")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="brandName"
                      name="brandName"
                      type="text"
                      placeholder={t("auth.brand_name_placeholder")}
                      className={errors.brandName ? "border-destructive" : ""}
                      value={formData.brandName}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      aria-invalid={!!errors.brandName}
                      aria-describedby={errors.brandName ? "brandName-error" : undefined}
                    />
                    {errors.brandName && (
                      <p id="brandName-error" className="text-xs text-destructive">{errors.brandName}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Contact Fields - Side by Side */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Phone Number Field */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">
                    {t("auth.phone_number")} <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 bg-muted rounded-md">
                      <span className="text-sm">+966</span>
                    </div>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      placeholder="5XXXXXXXX"
                      className={`flex-1 ${errors.phoneNumber ? "border-destructive" : ""}`}
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      maxLength={9}
                      pattern="[5][0-9]{8}"
                      aria-invalid={!!errors.phoneNumber}
                      aria-describedby={errors.phoneNumber ? "phoneNumber-error" : undefined}
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p id="phoneNumber-error" className="text-xs text-destructive">{errors.phoneNumber}</p>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    {t("auth.email")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t("auth.email_placeholder")}
                    className={errors.email ? "border-destructive" : ""}
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleEmailBlur}
                    disabled={isLoading}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  {t("auth.password")} <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.password_placeholder")}
                    className={`ps-10 ${errors.password ? "border-destructive" : ""}`}
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    aria-invalid={!!errors.password}
                    aria-describedby="password-requirements"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute start-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
                
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
                
                <div id="password-requirements" className="text-xs text-muted-foreground space-y-1">
                  <p>{t("auth.password_requirements")}</p>
                  <ul className="ms-4 space-y-0.5">
                    <li className={formData.password.length >= 8 ? "text-primary" : ""}>• {t("auth.password_min_length")}</li>
                    <li className={/[A-Z]/.test(formData.password) ? "text-primary" : ""}>• {t("auth.password_uppercase")}</li>
                    <li className={/[a-z]/.test(formData.password) ? "text-primary" : ""}>• {t("auth.password_lowercase")}</li>
                    <li className={/[0-9]/.test(formData.password) ? "text-primary" : ""}>• {t("auth.password_number")}</li>
                  </ul>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start gap-2">
                <Checkbox 
                  id="terms" 
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreeToTerms: checked as boolean }))}
                  disabled={isLoading}
                />
                <Label htmlFor="terms" className="text-sm">
                  {t("auth.agree_to")}{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    {t("auth.terms_and_conditions")}
                  </Link>
                </Label>
              </div>

              {/* Sign Up Button */}
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading || !formData.agreeToTerms}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  t("auth.create_account")
                )}
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                {t("auth.already_have_account")}{" "}
                <Link href="/signin" className="text-primary hover:underline font-medium">
                  {t("auth.signin")}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t("auth.back_to_home")}
          </Link>
        </div>
      </div>
    </div>
  )
}