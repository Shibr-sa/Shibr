"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/localization-context"
import { useToast } from "@/hooks/use-toast"
import { useAuthActions } from "@convex-dev/auth/react"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { z } from "zod"

// Password validation schema
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")

export default function ResetPasswordPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const { toast } = useToast()
  const { signIn } = useAuthActions()
  const { isAuthenticated } = useConvexAuth()
  const userWithProfile = useQuery(api.users.getCurrentUserWithProfile)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [email, setEmail] = useState("")
  const [isCheckingAuth, setIsCheckingAuth] = useState(false)

  // Get email from sessionStorage on mount
  useEffect(() => {
    // Don't check for email if we've already succeeded
    if (isSuccess) return

    const resetEmail = sessionStorage.getItem('resetEmail')
    if (!resetEmail) {
      toast({
        title: t("auth.error"),
        description: t("auth.invalid_reset_link"),
        variant: "destructive",
      })
      router.push("/forgot-password")
    } else {
      setEmail(resetEmail)
    }
  }, [router, toast, t, isSuccess])

  // Auto-redirect to dashboard when authenticated (after successful reset)
  useEffect(() => {
    // Start checking auth state
    setIsCheckingAuth(true)

    // Only redirect if we're checking auth AND have user profile data
    if (!isCheckingAuth || !userWithProfile) return

    // Small delay to ensure auth state is fully established
    const redirectTimer = setTimeout(() => {
      // Determine the correct dashboard based on account type
      const dashboardPath =
        userWithProfile.accountType === "store_owner" ? "/store-dashboard" :
        userWithProfile.accountType === "brand_owner" ? "/brand-dashboard" :
        userWithProfile.accountType === "admin" ? "/admin-dashboard" : "/dashboard"

      // Clear sessionStorage before redirecting
      sessionStorage.removeItem('resetEmail')

      // Redirecting to dashboard
      router.push(dashboardPath)
    }, 500) // 500ms delay to ensure auth is fully established

    return () => clearTimeout(redirectTimer)
  }, [isCheckingAuth, userWithProfile, router])

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

  const validatePassword = (password: string): string | null => {
    try {
      passwordSchema.parse(password)
      return null
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0].message
      }
      return "Invalid password"
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    const newErrors: Record<string, string> = {}

    if (!formData.code.trim()) {
      newErrors.code = t("auth.code_required")
    }

    const passwordError = validatePassword(formData.password)
    if (passwordError) {
      newErrors.password = passwordError
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("auth.passwords_dont_match")
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)

    try {
      // Use Convex Auth's reset-verification flow
      const resetFormData = new FormData()
      resetFormData.append("email", email)
      resetFormData.append("code", formData.code)
      resetFormData.append("newPassword", formData.password)
      resetFormData.append("flow", "reset-verification")

      await signIn("password", resetFormData)

      setIsSuccess(true)

      toast({
        title: t("auth.success"),
        description: t("auth.password_reset_success"),
      })

      // User is now authenticated, the auto-redirect useEffect will handle navigation
    } catch (error: any) {
      let errorMessage = t("auth.password_reset_failed")

      if (error?.message?.includes("Invalid code") || error?.message?.includes("Invalid verification")) {
        errorMessage = t("auth.invalid_verification_code")
      } else if (error?.message?.includes("expired")) {
        errorMessage = t("auth.code_expired")
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

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold">{t("auth.password_reset_success")}</h2>
              <p className="text-muted-foreground">{t("auth.redirecting_to_dashboard")}</p>
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
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
            <span className="text-3xl font-bold">{t("common.shibr")}</span>
          </div>
        </div>

        {/* Reset Password Form */}
        <Card>
          <CardHeader className="text-center pb-6">
            <h1 className="text-2xl font-bold mb-3">{t("auth.reset_password")}</h1>
            <p className="text-muted-foreground text-sm">
              {t("auth.enter_code_and_new_password")}
            </p>
            {email && (
              <p className="text-sm text-muted-foreground mt-2">
                {t("auth.code_sent_to")} <span className="font-medium">{email}</span>
              </p>
            )}
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Verification Code Field */}
              <div className="space-y-2">
                <Label htmlFor="code">
                  {t("auth.verification_code")}
                </Label>
                <Input
                  id="code"
                  name="code"
                  type="text"
                  placeholder={t("auth.enter_6_digit_code")}
                  value={formData.code}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  maxLength={6}
                  aria-invalid={!!errors.code}
                  aria-describedby={errors.code ? "code-error" : undefined}
                />
                {errors.code && (
                  <p id="code-error" className="text-xs text-destructive mt-1">{errors.code}</p>
                )}
              </div>

              {/* New Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  {t("auth.new_password")}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.password_placeholder")}
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>{t("auth.password_requirements.min_length")}</li>
                  <li>{t("auth.password_requirements.uppercase")}</li>
                  <li>{t("auth.password_requirements.lowercase")}</li>
                  <li>{t("auth.password_requirements.number")}</li>
                </ul>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {t("auth.confirm_password")}
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t("auth.confirm_password_placeholder")}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute end-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p id="confirmPassword-error" className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
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
                  t("auth.reset_password")
                )}
              </Button>
            </form>

            {/* Back to Sign In */}
            <div className="text-center pt-6">
              <Link
                href="/signin"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                {t("auth.back_to_signin")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}