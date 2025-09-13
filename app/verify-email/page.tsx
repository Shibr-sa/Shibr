"use client"

import { useState, useEffect, Suspense, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useLanguage } from "@/contexts/localization-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react"
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuthActions } from "@convex-dev/auth/react"

/**
 * Signup verification page - only handles new user signup flow
 * Email verification happens BEFORE account creation
 */
export default function VerifyEmailPage() {
  const { t, language, direction } = useLanguage()
  const router = useRouter()
  const fontClass = direction === "rtl" ? "font-cairo" : "font-inter"
  const { signIn } = useAuthActions()

  // State
  const [signupData, setSignupData] = useState<any>(null)
  const [otp, setOtp] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Mutations
  const verifySignupAndCreateAccount = useMutation(api.emailVerification.verifySignupAndCreateAccount)
  const resendSignupOTP = useMutation(api.emailVerification.resendSignupOTP)
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

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Handle OTP verification and account creation
  const handleVerify = async () => {
    if (!signupData) {
      toast.error(t("verification.session_expired"))
      router.push('/signup')
      return
    }

    if (otp.length !== 6) {
      setErrorMessage(t("verification.invalid_code"))
      return
    }

    setIsVerifying(true)
    setErrorMessage(null)

    try {
      // Verify OTP
      const result = await verifySignupAndCreateAccount({
        email: signupData.email,
        otp,
        fullName: signupData.fullName,
        password: signupData.password,
        phoneNumber: signupData.phoneNumber,
        accountType: signupData.accountType,
        storeName: signupData.storeName,
        brandName: signupData.brandName,
      })

      if (result.success) {
        // OTP verified! Now create the account
        setIsCreatingAccount(true)
        toast.success(t("verification.email_verified"))

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

        // Clear signup data
        sessionStorage.removeItem('signupData')

        // Success! Redirect to dashboard
        toast.success(t("auth.account_created"))

        const dashboardPath =
          signupData.accountType === "store-owner" ? "/store-dashboard" :
          signupData.accountType === "brand-owner" ? "/brand-dashboard" :
          "/dashboard"

        // Force redirect with window.location for clean navigation
        window.location.href = dashboardPath
      } else {
        setErrorMessage(result.error || t("verification.invalid_code"))
        setOtp("")
      }
    } catch (error: any) {
      console.error('Verification error:', error)
      setErrorMessage(t("verification.error"))
    } finally {
      setIsVerifying(false)
      setIsCreatingAccount(false)
    }
  }

  // Handle OTP resend
  const handleResend = async () => {
    if (!signupData) {
      toast.error(t("verification.session_expired"))
      router.push('/signup')
      return
    }

    setErrorMessage(null)

    try {
      const result = await resendSignupOTP({
        email: signupData.email,
        name: signupData.fullName,
      })

      if (result.success) {
        toast.success(t("verification.code_sent"))
        setCountdown(60)
        setOtp("")
      } else {
        setErrorMessage(result.error || t("verification.resend_error"))
      }
    } catch (error: any) {
      setErrorMessage(t("verification.resend_error"))
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
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className={`text-3xl font-bold ${fontClass}`}>
              {t("auth.creating_account")}
            </CardTitle>
            <CardDescription className={`text-base mt-2 ${fontClass}`}>
              {t("auth.please_wait")}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main OTP verification UI
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20" dir={direction}>
      <Card className="w-full max-w-md border-0 shadow-2xl bg-card/95 backdrop-blur">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className={`text-3xl font-bold ${fontClass}`}>
            {t("verification.verify_email")}
          </CardTitle>
          <CardDescription className={`text-base mt-3 ${fontClass}`}>
            {t("verification.enter_code")}
          </CardDescription>
          {signupData?.email && (
            <p className={`text-sm text-muted-foreground mt-2 ${fontClass}`}>
              {signupData.email}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-6 px-8">
          {/* Error Alert */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* OTP Input - Always LTR for numbers */}
          <div className="flex justify-center" dir="ltr">
            <InputOTP
              value={otp}
              onChange={setOtp}
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              className="gap-2"
              disabled={isVerifying}
            >
              <InputOTPGroup className="gap-2">
                <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
                <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
                <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup className="gap-2">
                <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
                <InputOTPSlot index={4} className="h-12 w-12 text-lg" />
                <InputOTPSlot index={5} className="h-12 w-12 text-lg" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {/* Verify Button */}
          <Button
            onClick={handleVerify}
            disabled={isVerifying || otp.length !== 6}
            className="w-full h-12 text-base font-medium"
            size="lg"
          >
            {isVerifying ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t("verification.verifying")}
              </>
            ) : (
              t("verification.verify")
            )}
          </Button>
        </CardContent>

        <CardFooter className="px-8 pb-8">
          {/* Resend Code Section */}
          <div className="text-center w-full">
            <p className={`text-sm text-muted-foreground mb-2 ${fontClass}`}>
              {t("verification.didnt_receive")}
            </p>
            <Button
              variant="outline"
              onClick={handleResend}
              disabled={countdown > 0}
              className={`w-full h-10 ${fontClass}`}
            >
              {countdown > 0 ? (
                `${t("verification.resend_in")} ${countdown}s`
              ) : (
                t("verification.resend_code")
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}