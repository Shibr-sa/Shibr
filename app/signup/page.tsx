"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Eye, ArrowRight, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"

export default function SignUpPage() {
  const [accountType, setAccountType] = useState("store-owner")
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect")
  const { t, direction } = useLanguage()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // All sign-ups now go to the success page for approval.
    const successRedirect = redirectUrl ? `/signup/success?redirect=${redirectUrl}` : "/signup/success"
    router.push(successRedirect)
  }

  return (
    <div
      className={`min-h-screen bg-muted/30 flex items-center justify-center p-6 ${direction === "rtl" ? "font-cairo" : "font-inter"}`}
      dir={direction}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center relative">
              <div className="w-8 h-8 border-2 border-primary-foreground rounded-md"></div>
              <div className="absolute -top-1 -end-1 w-6 h-6 border-2 border-primary-foreground rounded-md bg-primary"></div>
            </div>
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
                  onValueChange={setAccountType}
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
                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                  {t("auth.name")}
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t("auth.name_placeholder")}
                  className="h-12"
                  dir={direction}
                  required
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
                    type="email"
                    placeholder={t("auth.email_placeholder")}
                    className="h-12"
                    dir={direction}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile" className="text-sm font-medium text-foreground">
                    {t("auth.mobile")}
                  </Label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder={t("auth.mobile")}
                    className="h-12"
                    dir={direction}
                    required
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
                  type="text"
                  placeholder={
                    accountType === "store-owner" ? t("auth.store_name_placeholder") : t("auth.brand_name_placeholder")
                  }
                  className="h-12"
                  dir={direction}
                  required
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
                    type="password"
                    placeholder={t("auth.password_placeholder")}
                    className="ps-10 h-12"
                    dir={direction}
                    required
                  />
                  <Eye className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" />
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start gap-3">
                <Checkbox id="terms" className="mt-1" />
                <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                  {t("auth.terms_agreement")}{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    {t("auth.terms")}
                  </Link>{" "}
                  {direction === "ar" ? "و" : "and"}{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    {t("auth.privacy")}
                  </Link>{" "}
                  {t("auth.platform_terms")}
                </Label>
              </div>

              {/* Sign Up Button */}
              <Button type="submit" className="w-full h-12 text-base font-medium">
                {t("auth.signup")}
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
