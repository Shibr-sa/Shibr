"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Eye, ArrowRight, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/localization-context"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useToast } from "@/hooks/use-toast"

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
    businessRegistration: "",
    agreeToTerms: false,
  })
  
  const router = useRouter()
  const { t, direction, language } = useLanguage()
  const { toast } = useToast()
  const createUser = useMutation(api.users.createUser)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.agreeToTerms) {
      toast({
        title: t("auth.error"),
        description: t("auth.must_agree_terms"),
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    
    try {
      await createUser({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        accountType: accountType,
        storeName: accountType === "store-owner" ? formData.storeName : undefined,
        brandName: accountType === "brand-owner" ? formData.brandName : undefined,
        businessRegistration: formData.businessRegistration || undefined,
        preferredLanguage: language,
      })

      toast({
        title: t("auth.success"),
        description: t("auth.account_created_successfully"),
      })

      // Redirect based on account type after signup
      if (accountType === "brand-owner") {
        router.push("/brand-dashboard")
      } else {
        router.push("/store-dashboard")
      }
    } catch (error) {
      toast({
        title: t("auth.error"),
        description: error instanceof Error ? error.message : t("auth.signup_failed"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }))
  }

  return (
    <div
      className="min-h-screen bg-muted/30 flex items-center justify-center p-6"
         >
      <div className="w-full max-w-md">
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
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-6">
            <h1 className="text-2xl font-bold text-foreground mb-3">{t("auth.create_account")}</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">{t("auth.signup_description")}</p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Type Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">{t("auth.account_type")}</Label>
                <RadioGroup
                  defaultValue="store-owner"
                  value={accountType}
                  onValueChange={(value) => setAccountType(value as "store-owner" | "brand-owner")}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <Label
                    htmlFor="brand-owner"
                    className="flex items-center justify-between rounded-md border-2 border-muted bg-background p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                  >
                    <span className="font-medium">{t("auth.brand_owner")}</span>
                    <RadioGroupItem value="brand-owner" id="brand-owner" />
                  </Label>
                  <Label
                    htmlFor="store-owner"
                    className="flex items-center justify-between rounded-md border-2 border-muted bg-background p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                  >
                    <span className="font-medium">{t("auth.store_owner")}</span>
                    <RadioGroupItem value="store-owner" id="store-owner" />
                  </Label>
                </RadioGroup>
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                  {t("auth.name")}
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder={t("auth.name_placeholder")}
                  className="h-12"
                                   value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Email and Mobile Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    {t("auth.email")}
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t("auth.email_placeholder")}
                    className="h-12"
                                       value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile" className="text-sm font-medium text-foreground">
                    {t("auth.mobile")}
                  </Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder={t("auth.mobile")}
                    className="h-12"
                                       value={formData.phoneNumber}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Store/Brand Name Field */}
              <div className="space-y-2">
                <Label htmlFor="business-name" className="text-sm font-medium text-foreground">
                  {accountType === "store-owner" ? t("auth.store_name") : t("auth.brand_name")}
                </Label>
                <Input
                  id="business-name"
                  name={accountType === "store-owner" ? "storeName" : "brandName"}
                  type="text"
                  placeholder={
                    accountType === "store-owner" ? t("auth.store_name_placeholder") : t("auth.brand_name_placeholder")
                  }
                  className="h-12"
                                   value={accountType === "store-owner" ? formData.storeName : formData.brandName}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  {t("auth.password")}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.password_placeholder")}
                    className="ps-10 h-12"
                                       value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                  />
                  <Eye 
                    className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" 
                    onClick={() => setShowPassword(!showPassword)}
                  />
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start gap-3">
                <Checkbox 
                  id="terms" 
                  className="mt-1" 
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, agreeToTerms: !!checked }))}
                  disabled={isLoading}
                />
                <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                  {t("auth.terms_agreement")}{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    {t("auth.terms")}
                  </Link>{" "}
                  {t("auth.and")}{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    {t("auth.privacy")}
                  </Link>{" "}
                  {t("auth.platform_terms")}
                </Label>
              </div>

              {/* Sign Up Button */}
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  t("auth.signup")
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
            {direction === "rtl" ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            {t("auth.back_to_home")}
          </Link>
        </div>
      </div>
    </div>
  )
}
