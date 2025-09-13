"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/localization-context"
import { useToast } from "@/hooks/use-toast"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const { toast } = useToast()
  const requestPasswordReset = useMutation(api.passwordReset.requestPasswordReset)

  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email
    if (!email.trim()) {
      setError(t("auth.email_required"))
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError(t("auth.invalid_email"))
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await requestPasswordReset({ email })

      if (result.success) {
        setIsSubmitted(true)
        toast({
          title: t("auth.email_sent"),
          description: t("auth.password_reset_email_sent"),
        })
      } else if (result.error) {
        toast({
          title: t("auth.error"),
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: t("auth.error"),
        description: t("auth.something_went_wrong"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
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
            <CardHeader className="text-center pb-6">
              <h1 className="text-2xl font-bold mb-3">{t("auth.check_your_email")}</h1>
              <p className="text-muted-foreground text-sm">
                {t("auth.password_reset_link_sent")}
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm">{email}</p>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                {t("auth.didnt_receive_email")}
              </p>

              <Button
                onClick={() => {
                  setIsSubmitted(false)
                  setEmail("")
                }}
                variant="outline"
                className="w-full"
              >
                {t("auth.try_another_email")}
              </Button>

              <div className="text-center">
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

        {/* Forgot Password Form */}
        <Card>
          <CardHeader className="text-center pb-6">
            <h1 className="text-2xl font-bold mb-3">{t("auth.forgot_password")}</h1>
            <p className="text-muted-foreground text-sm">
              {t("auth.forgot_password_description")}
            </p>
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
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError("")
                  }}
                  disabled={isLoading}
                  aria-invalid={!!error}
                  aria-describedby={error ? "email-error" : undefined}
                />
                {error && (
                  <p id="email-error" className="text-xs text-destructive mt-1">{error}</p>
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
                  t("auth.send_reset_link")
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