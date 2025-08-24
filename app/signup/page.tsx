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
import { useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/localization-context"
import { useAuthActions } from "@convex-dev/auth/react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useToast } from "@/hooks/use-toast"
import { signUpSchema, formatSaudiPhoneNumber } from "@/lib/validations/auth"
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
  const { t, direction, language } = useLanguage()
  const { toast } = useToast()
  const { signIn } = useAuthActions()
  const currentUser = useQuery(api.users.getCurrentUser)
  const createUserProfile = useMutation(api.users.createOrUpdateUserProfile)

  const validateField = (fieldName: string, value: any) => {
    try {
      const fieldData = { ...formData, [fieldName]: value, accountType }
      signUpSchema.partial().parse({ [fieldName]: value })
      setErrors(prev => ({ ...prev, [fieldName]: "" }))
      return true
    } catch (error) {
      if (error instanceof z.ZodError && error.errors) {
        const fieldError = error.errors.find(err => err.path && err.path[0] === fieldName)
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
      
      // Sign up the user first
      await signIn("password", authFormData)
      
      // Prepare profile data
      const profileData = {
        accountType: accountType === "store-owner" ? "store_owner" as const : "brand_owner" as const,
        fullName: formData.fullName.trim(),
        phoneNumber: formatSaudiPhoneNumber(formData.phoneNumber),
        email: formData.email.toLowerCase().trim(),
        ...(accountType === "store-owner" ? {
          storeName: formData.storeName.trim(),
        } : {
          brandName: formData.brandName.trim(),
        })
      }
      
      // Wait a bit for auth to propagate
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Create the user profile and get the actual account type
      const profileResult = await createUserProfile(profileData)
      
      toast({
        title: t("auth.success"),
        description: t("auth.account_created"),
      })
      
      // Wait a bit for everything to settle
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Redirect based on the ACTUAL account type returned from the database
      if (profileResult.accountType === "admin") {
        router.push("/admin-dashboard")
      } else if (profileResult.accountType === "store_owner") {
        router.push("/store-dashboard")
      } else if (profileResult.accountType === "brand_owner") {
        router.push("/brand-dashboard")
      } else {
        // Fallback based on UI selection
        if (accountType === "store-owner") {
          router.push("/store-dashboard")
        } else {
          router.push("/brand-dashboard")
        }
      }
    } catch (error) {
      // Authentication errors are expected - just show user-friendly message
      toast({
        title: t("auth.error"),
        description: t("auth.signup_failed"),
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
              alt="Shibr Logo"
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
              {/* Account Type Selection */}
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