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
import { useRouter, useSearchParams } from "next/navigation"
import { useLanguage } from "@/contexts/localization-context"
import { useToast } from "@/hooks/use-toast"
import { useMutation, useQuery } from "convex/react"
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
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const { toast } = useToast()

  const token = searchParams.get("token")
  const verifyToken = useQuery(api.passwordReset.verifyResetToken, token ? { token } : "skip")
  const resetPassword = useMutation(api.passwordReset.resetPassword)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Check token validity on mount
  useEffect(() => {
    if (!token) {
      toast({
        title: t("auth.error"),
        description: t("auth.invalid_reset_link"),
        variant: "destructive",
      })
      router.push("/forgot-password")
    } else if (verifyToken && !verifyToken.valid) {
      toast({
        title: t("auth.error"),
        description: verifyToken.error || t("auth.invalid_or_expired_token"),
        variant: "destructive",
      })
      router.push("/forgot-password")
    }
  }, [token, verifyToken, router, toast, t])

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
      return t("auth.invalid_password")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate passwords
    const newErrors: Record<string, string> = {}

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

    if (!token) {
      toast({
        title: t("auth.error"),
        description: t("auth.invalid_reset_link"),
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await resetPassword({
        token,
        newPassword: formData.password,
      })

      if (result.success) {
        setIsSuccess(true)
        toast({
          title: t("auth.success"),
          description: t("auth.password_reset_success"),
        })

        // Redirect to signin after 3 seconds
        setTimeout(() => {
          router.push("/signin")
        }, 3000)
      }
    } catch (error: any) {
      toast({
        title: t("auth.error"),
        description: error?.message || t("auth.password_reset_failed"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show success state
  if (isSuccess) {
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

          {/* Success Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                <h1 className="text-2xl font-bold">{t("auth.password_reset_success")}</h1>
                <p className="text-muted-foreground">
                  {t("auth.password_reset_success_description")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("auth.redirecting_to_signin")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show loading state while verifying token
  if (!verifyToken) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t("auth.verifying_token")}</p>
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
              {t("auth.reset_password_description")}
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    placeholder={t("auth.new_password_placeholder")}
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
                <div className="text-xs text-muted-foreground">
                  {t("auth.password_requirements")}
                </div>
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
                    className="ps-10"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute start-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
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