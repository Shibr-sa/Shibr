"use client"

import { useState, useEffect, Suspense, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useLanguage } from "@/contexts/localization-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, CheckCircle2, ShieldCheck, AlertCircle, Mail, MessageCircle } from "lucide-react"
import { useAuthActions } from "@convex-dev/auth/react"
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { Alert, AlertDescription } from "@/components/ui/alert"

/**
 * Signup verification page - handles both email and phone verification
 */
export default function VerifyEmailPage() {
  const { t, language, direction } = useLanguage()
  const router = useRouter()
  const fontClass = direction === "rtl" ? "font-cairo" : "font-inter"
  const { signIn } = useAuthActions()

  // State
  const [signupData, setSignupData] = useState<any>(null)
  const [emailOtp, setEmailOtp] = useState("")
  const [phoneOtp, setPhoneOtp] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [emailCountdown, setEmailCountdown] = useState(0)
  const [phoneCountdown, setPhoneCountdown] = useState(0)
  const [emailErrorMessage, setEmailErrorMessage] = useState<string | null>(null)
  const [phoneErrorMessage, setPhoneErrorMessage] = useState<string | null>(null)

  // Mutations
  const verifySignupAndCreateAccount = useMutation(api.emailVerification.verifySignupAndCreateAccount)
  const resendSignupOTP = useMutation(api.emailVerification.resendSignupOTP)
  const verifyPhoneOTP = useMutation(api.phoneVerification.verifyPhoneOTP)
  const resendPhoneOTP = useMutation(api.phoneVerification.resendPhoneOTP)
  const cleanupPhoneVerification = useMutation(api.phoneVerification.cleanupPhoneVerification)
  const createStoreProfile = useMutation(api.users.createStoreProfile)
  const createBrandProfile = useMutation(api.users.createBrandProfile)

  // Load signup data from sessionStorage
  useEffect(() => {
    const data = sessionStorage.getItem('signupData')
    if (!data) {
      // No signup data, redirect to signup
      toast.error(t("verification.session_expired"))
      router.push('/signup')
      return
    }

    try {
      const parsedData = JSON.parse(data)
      setSignupData(parsedData)
    } catch {
      toast.error(t("verification.invalid_session"))
      router.push('/signup')
    }
  }, [router, t])

  // Countdown timers for resend
  useEffect(() => {
    if (emailCountdown > 0) {
      const timer = setTimeout(() => setEmailCountdown(emailCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [emailCountdown])
  
  useEffect(() => {
    if (phoneCountdown > 0) {
      const timer = setTimeout(() => setPhoneCountdown(phoneCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [phoneCountdown])

  // Handle OTP verification and account creation
  const handleVerify = async () => {
    if (!signupData) {
      toast.error(t("verification.session_expired"))
      router.push('/signup')
      return
    }

    if (emailOtp.length !== 6 || phoneOtp.length !== 6) {
      if (emailOtp.length !== 6) {
        setEmailErrorMessage(t("verification.invalid_code"))
      }
      if (phoneOtp.length !== 6) {
        setPhoneErrorMessage(t("verification.invalid_code"))
      }
      return
    }

    setIsVerifying(true)
    setEmailErrorMessage(null)
    setPhoneErrorMessage(null)

    try {
      // Verify email OTP first
      const emailResult = await verifySignupAndCreateAccount({
        email: signupData.email,
        otp: emailOtp,
        fullName: signupData.fullName,
        password: signupData.password,
        phoneNumber: signupData.phoneNumber,
        accountType: signupData.accountType,
        storeName: signupData.storeName,
        brandName: signupData.brandName,
      })

      if (!emailResult.success) {
        setEmailErrorMessage(emailResult.error || t("verification.invalid_code"))
        setEmailOtp("")
        setIsVerifying(false)
        return
      }

      // Verify phone OTP
      const phoneResult = await verifyPhoneOTP({
        phoneNumber: signupData.phoneNumber,
        email: signupData.email,
        otp: phoneOtp,
      })

      if (!phoneResult.success) {
        setPhoneErrorMessage(phoneResult.error || t("verification.invalid_code"))
        setPhoneOtp("")
        setIsVerifying(false)
        return
      }

      // Both OTPs verified! Now create the account
      setIsCreatingAccount(true)
      toast.success(t("verification.both_verified"))

      // Create FormData for Convex Auth signup
      const authFormData = new FormData()
      authFormData.append("email", signupData.email)
      authFormData.append("password", signupData.password)
      authFormData.append("flow", "signUp")
      authFormData.append("name", signupData.fullName)
      authFormData.append("phone", signupData.phoneNumber)

      // Sign up the user
      await signIn("password", authFormData)

      // Create profile with retry logic
      let profileCreated = false
      let retryCount = 0
      const maxRetries = 8

      while (!profileCreated && retryCount < maxRetries) {
        try {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000)
          await new Promise(resolve => setTimeout(resolve, delay))

          if (signupData.accountType === "store-owner") {
            await createStoreProfile({
              storeName: signupData.storeName,
              businessCategory: "",
              commercialRegisterNumber: "",
            })
          } else {
            await createBrandProfile({
              brandName: signupData.brandName,
            })
          }

          profileCreated = true
        } catch (error: any) {
          if (error?.message?.includes("already exists")) {
            profileCreated = true
            break
          }

          if (error?.message?.includes("Not authenticated")) {
            retryCount++
            if (retryCount >= maxRetries) {
              throw new Error(t("auth.profile_creation_timeout"))
            }
          } else {
            throw error
          }
        }
      }

      // Cleanup verification records
      await cleanupPhoneVerification({
        phoneNumber: signupData.phoneNumber,
        email: signupData.email,
      })

      // Clear signup data
      sessionStorage.removeItem('signupData')
      sessionStorage.removeItem('emailVerified')

      // Success! Redirect to dashboard
      toast.success(t("auth.account_created"))

      const dashboardPath =
        signupData.accountType === "store-owner" ? "/store-dashboard" :
        signupData.accountType === "brand-owner" ? "/brand-dashboard" :
        "/dashboard"

      // Force redirect with window.location for clean navigation
      window.location.href = dashboardPath
    } catch (error: any) {
      console.error('Verification error:', error)
      setEmailErrorMessage(t("verification.error"))
    } finally {
      setIsVerifying(false)
      setIsCreatingAccount(false)
    }
  }

  // Handle email OTP resend
  const handleEmailResend = async () => {
    if (!signupData) {
      toast.error(t("verification.session_expired"))
      router.push('/signup')
      return
    }

    setEmailErrorMessage(null)

    try {
      const result = await resendSignupOTP({
        email: signupData.email,
        name: signupData.fullName,
      })

      if (result.success) {
        toast.success(t("verification.email_code_sent"))
        setEmailCountdown(60)
        setEmailOtp("")
      } else {
        setEmailErrorMessage(result.error || t("verification.resend_error"))
      }
    } catch (error: any) {
      setEmailErrorMessage(t("verification.resend_error"))
    }
  }

  // Handle phone OTP resend
  const handlePhoneResend = async () => {
    if (!signupData) {
      toast.error(t("verification.session_expired"))
      router.push('/signup')
      return
    }

    setPhoneErrorMessage(null)

    try {
      const result = await resendPhoneOTP({
        phoneNumber: signupData.phoneNumber,
        email: signupData.email,
        name: signupData.fullName,
      })

      if (result.success) {
        toast.success(t("verification.whatsapp_code_sent"))
        setPhoneCountdown(60)
        setPhoneOtp("")
      } else {
        setPhoneErrorMessage(result.error || t("verification.resend_error"))
      }
    } catch (error: any) {
      setPhoneErrorMessage(t("verification.resend_error"))
    }
  }

  // Loading state while checking for signup data
  if (!signupData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }



  // Creating account state
  if (isCreatingAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-card/95 backdrop-blur">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                  <CheckCircle2 className="h-10 w-10 text-primary animate-bounce" />
                </div>
              </div>
              <div className={`space-y-2 ${fontClass}`}>
                <h3 className="text-2xl font-bold">
                  {t("auth.creating_account")}
                </h3>
                <p className="text-muted-foreground">
                  {t("auth.setting_up_profile")}
                </p>
              </div>
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main OTP verification UI
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20" dir={direction}>
      <Card className="w-full max-w-2xl border-0 shadow-2xl bg-card/95 backdrop-blur">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className={`text-3xl font-bold ${fontClass}`}>
            {t("verification.verify_account")}
          </CardTitle>
          <CardDescription className={`text-base mt-2 ${fontClass}`}>
            {t("verification.enter_both_codes")}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 px-8">
          {/* Email Verification Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div className={`flex-1 ${fontClass}`}>
                <p className="font-medium">{t("verification.email_code")}</p>
                <p className="text-sm text-muted-foreground">{signupData?.email}</p>
              </div>
            </div>
            
            {emailErrorMessage && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className={`text-sm ${fontClass}`}>{emailErrorMessage}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-center" dir="ltr">
              <InputOTP
                value={emailOtp}
                onChange={setEmailOtp}
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                className="gap-2"
                disabled={isVerifying}
              >
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot index={0} className="h-11 w-11 text-lg" />
                  <InputOTPSlot index={1} className="h-11 w-11 text-lg" />
                  <InputOTPSlot index={2} className="h-11 w-11 text-lg" />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot index={3} className="h-11 w-11 text-lg" />
                  <InputOTPSlot index={4} className="h-11 w-11 text-lg" />
                  <InputOTPSlot index={5} className="h-11 w-11 text-lg" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            
            <Button
              variant="outline"
              onClick={handleEmailResend}
              disabled={emailCountdown > 0}
              className={`w-full h-9 text-sm ${fontClass}`}
              size="sm"
            >
              {emailCountdown > 0 ? (
                `${t("verification.resend_in")} ${emailCountdown}s`
              ) : (
                t("verification.resend_email_code")
              )}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t("auth.and")}</span>
            </div>
          </div>

          {/* Phone Verification Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className={`flex-1 ${fontClass}`}>
                <p className="font-medium">{t("verification.whatsapp_code")}</p>
                <p className="text-sm text-muted-foreground" dir="ltr">{signupData?.phoneNumber}</p>
              </div>
            </div>
            
            {phoneErrorMessage && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className={`text-sm ${fontClass}`}>{phoneErrorMessage}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-center" dir="ltr">
              <InputOTP
                value={phoneOtp}
                onChange={setPhoneOtp}
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                className="gap-2"
                disabled={isVerifying}
              >
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot index={0} className="h-11 w-11 text-lg" />
                  <InputOTPSlot index={1} className="h-11 w-11 text-lg" />
                  <InputOTPSlot index={2} className="h-11 w-11 text-lg" />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot index={3} className="h-11 w-11 text-lg" />
                  <InputOTPSlot index={4} className="h-11 w-11 text-lg" />
                  <InputOTPSlot index={5} className="h-11 w-11 text-lg" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            
            <Button
              variant="outline"
              onClick={handlePhoneResend}
              disabled={phoneCountdown > 0}
              className={`w-full h-9 text-sm ${fontClass}`}
              size="sm"
            >
              {phoneCountdown > 0 ? (
                `${t("verification.resend_in")} ${phoneCountdown}s`
              ) : (
                t("verification.resend_whatsapp_code")
              )}
            </Button>
          </div>

          {/* Verify Button */}
          <Button
            onClick={handleVerify}
            disabled={isVerifying || emailOtp.length !== 6 || phoneOtp.length !== 6}
            className="w-full h-12 text-base font-medium"
            size="lg"
          >
            {isVerifying ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t("verification.verifying")}
              </>
            ) : (
              t("verification.verify_and_continue")
            )}
          </Button>
        </CardContent>

        <CardFooter className="px-8 pb-6">
          <p className={`text-xs text-center text-muted-foreground w-full ${fontClass}`}>
            {t("verification.secure_message")}
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}