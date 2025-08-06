"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, ArrowRight, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useToast } from "@/hooks/use-toast"

export default function SignInPage() {
  const router = useRouter()
  const { t, direction, language } = useLanguage()
  const { toast } = useToast()
  const verifyUser = useMutation(api.users.verifyUser)
  
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // Check for remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("userEmail")
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }))
      setRememberMe(true)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const user = await verifyUser({
        email: formData.email,
        password: formData.password,
      })

      // Store user info in localStorage (in production, use proper session management)
      if (rememberMe) {
        localStorage.setItem("userEmail", user.email)
      }
      
      // Store current user session
      sessionStorage.setItem("currentUser", JSON.stringify(user))

      toast({
        title: t("auth.success"),
        description: t("auth.signin_success"),
      })

      // Redirect based on user role
      switch (user.accountType) {
        case "admin":
          router.push("/admin-dashboard")
          break
        case "brand-owner":
          router.push("/brand-dashboard")
          break
        case "store-owner":
          router.push("/store-dashboard")
          break
        default:
          router.push("/")
      }
    } catch (error) {
      toast({
        title: t("auth.error"),
        description: error instanceof Error ? error.message : t("auth.invalid_credentials"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
                  name="email"
                  type="email"
                  placeholder={t("auth.email_placeholder")}
                  className="h-12"
                  dir={direction}
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
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
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.password_placeholder")}
                    className="ps-10 h-12"
                    dir={direction}
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
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
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading}
                />
                <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                  {t("auth.remember_me")}
                </Label>
              </div>

              {/* Sign In Button */}
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
                  t("auth.signin")
                )}
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
            {direction === "rtl" ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            {t("auth.back_to_home")}
          </Link>
        </div>
      </div>
    </div>
  )
}