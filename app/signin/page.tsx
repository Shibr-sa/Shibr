"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, ArrowRight, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"

export default function SignInPage() {
  const router = useRouter()
  const { t, direction } = useLanguage()
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // For now, redirect to store dashboard as a demo
    // In production, this would authenticate and redirect based on user role
    router.push("/store-dashboard")
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

        {/* Sign In Form */}
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-6">
            <h1 className="text-2xl font-bold text-foreground mb-3">{t("auth.welcome_back")}</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">{t("auth.signin_description")}</p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
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

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    {t("auth.password")}
                  </Label>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    {t("auth.forgot_password")}
                  </Link>
                </div>
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

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                  {t("auth.remember_me")}
                </Label>
              </div>

              {/* Sign In Button */}
              <Button type="submit" className="w-full h-12 text-base font-medium">
                {t("auth.signin")}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                {t("auth.dont_have_account")}{" "}
                <Link href="/signup" className="text-primary hover:underline font-medium">
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