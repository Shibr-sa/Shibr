"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/localization-context"
import { useToast } from "@/hooks/use-toast"
import { useAuthActions } from "@convex-dev/auth/react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export default function SignInPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const { toast } = useToast()
  const { signIn } = useAuthActions()
  const currentUserWithProfile = useQuery(api.users.getCurrentUserWithProfile)
  
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [justSignedIn, setJustSignedIn] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Handle redirect after successful signin
  useEffect(() => {
    if (justSignedIn && currentUserWithProfile?.accountType) {
      const accountType = currentUserWithProfile.accountType
      if (accountType === "store_owner") {
        router.push("/store-dashboard")
      } else if (accountType === "brand_owner") {
        router.push("/brand-dashboard")
      } else if (accountType === "admin") {
        router.push("/admin-dashboard")
      }
      setJustSignedIn(false)
    }
  }, [justSignedIn, currentUserWithProfile, router])
  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    const newErrors: Record<string, string> = {}
    if (!formData.email.trim()) {
      newErrors.email = t("auth.email_required")
    }
    if (!formData.password) {
      newErrors.password = t("auth.password_required")
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setIsLoading(true)

    try {
      // Create FormData for Convex Auth
      const authFormData = new FormData()
      authFormData.append("email", formData.email)
      authFormData.append("password", formData.password)
      authFormData.append("flow", "signIn")
      
      await signIn("password", authFormData)

      toast({
        title: t("auth.success"),
        description: t("auth.signin_success"),
      })
      
      // Set flag to trigger redirect in useEffect once profile loads
      setJustSignedIn(true)
    } catch (error) {
      // Authentication errors are expected - just show user-friendly message
      toast({
        title: t("auth.error"),
        description: t("auth.invalid_credentials"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
            <span className="text-3xl font-bold">{t("common.shibr")}</span>
          </div>
        </div>

        {/* Sign In Form */}
        <Card>
          <CardHeader className="text-center pb-6">
            <h1 className="text-2xl font-bold mb-3">{t("auth.welcome_back")}</h1>
            <p className="text-muted-foreground text-sm">{t("auth.signin_description")}</p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  {t("auth.email")}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("auth.email_placeholder")}
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-xs text-destructive mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">
                    {t("auth.password")}
                  </Label>
                  <div className="text-sm text-muted-foreground">
                    {t("auth.forgot_password")}{" "}
                    <Link href="/forgot-password" className="text-primary hover:underline">
                      {t("auth.recover_here")}
                    </Link>
                  </div>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.password_placeholder")}
                    className="ps-10"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute start-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-xs text-destructive mt-1">{errors.password}</p>
                )}
              </div>

              {/* Sign In Button */}
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  t("auth.signin")
                )}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                {t("auth.dont_have_account")}{" "}
                <Link href="/signup" className="text-primary hover:underline">
                  {t("auth.signup")}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t("auth.back_to_home")}
          </Link>
        </div>
      </div>
    </div>
  )
}