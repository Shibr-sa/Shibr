"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useLanguage } from "@/contexts/localization-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Mail, CheckCircle2, ShieldCheck } from "lucide-react"
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp"
import { REGEXP_ONLY_DIGITS } from "input-otp"

function VerifyEmailContent() {
  const { t, language, direction } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const fontClass = direction === "rtl" ? "font-cairo" : "font-inter"

  const [otp, setOtp] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [verified, setVerified] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const currentUser = useQuery(api.users.getCurrentUser)
  const userWithProfile = useQuery(api.users.getCurrentUserWithProfile)
  const verifyOTP = useMutation(api.emailVerification.verifyOTP)
  const resendOTP = useMutation(api.emailVerification.resendOTP)

  // Only query verification status when we have a user ID
  const checkVerificationStatus = useQuery(
    api.emailVerification.checkVerificationStatus,
    currentUser === undefined ? "skip" : currentUser?._id ? { userId: currentUser._id } : "skip"
  )

  useEffect(() => {
    // Only redirect to signin if we're sure the user is not authenticated
    if (!authLoading && !isAuthenticated) {
      router.push("/signin")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    // Only check verification status if all data is loaded
    if (checkVerificationStatus !== undefined && checkVerificationStatus?.verified) {
      setVerified(true)

      // Wait for userWithProfile to load before determining dashboard
      if (userWithProfile !== undefined) {
        const dashboardPath =
          userWithProfile?.accountType === "store_owner" ? "/store-dashboard" :
          userWithProfile?.accountType === "brand_owner" ? "/brand-dashboard" :
          userWithProfile?.accountType === "admin" ? "/admin-dashboard" :
          "/dashboard" // fallback

        // Immediately redirect if already verified
        toast.success(t("verification.email_verified"))
        router.push(dashboardPath)
      }
    }
  }, [checkVerificationStatus, userWithProfile, router, t])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Redirect to signin if user not found
  useEffect(() => {
    if (!authLoading && !currentUser && currentUser !== undefined) {
      router.push("/signin")
    }
  }, [authLoading, currentUser, router])

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error(t("verification.invalid_code"))
      return
    }

    if (!currentUser?._id) {
      toast.error(t("verification.user_not_found"))
      return
    }

    setIsVerifying(true)
    try {
      const result = await verifyOTP({
        userId: currentUser._id,
        otp
      })

      if (result.success) {
        setVerified(true)
        toast.success(t("verification.success"))

        // Determine the correct dashboard based on account type
        const dashboardPath =
          userWithProfile?.accountType === "store_owner" ? "/store-dashboard" :
          userWithProfile?.accountType === "brand_owner" ? "/brand-dashboard" :
          userWithProfile?.accountType === "admin" ? "/admin-dashboard" :
          "/dashboard" // fallback

        setTimeout(() => {
          router.push(dashboardPath)
        }, 2000)
      } else {
        toast.error(result.error || t("verification.invalid_code"))
        setOtp("")
      }
    } catch (error) {
      toast.error(t("verification.error"))
      console.error(error)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    if (!currentUser?._id) {
      toast.error(t("verification.user_not_found"))
      return
    }

    setIsResending(true)
    try {
      const result = await resendOTP({
        userId: currentUser._id
      })

      if (result.success) {
        toast.success(t("verification.code_sent"))
        setCountdown(60) // 60 second cooldown
        setOtp("")
      } else {
        // Check if email is already verified
        if (result.error === "Email is already verified") {
          toast.success(t("verification.email_verified"))
          setVerified(true)

          // Redirect to appropriate dashboard
          const dashboardPath =
            userWithProfile?.accountType === "store_owner" ? "/store-dashboard" :
            userWithProfile?.accountType === "brand_owner" ? "/brand-dashboard" :
            userWithProfile?.accountType === "admin" ? "/admin-dashboard" :
            "/dashboard"

          setTimeout(() => {
            router.push(dashboardPath)
          }, 1500)
        } else {
          toast.error(result.error || t("verification.resend_error"))
        }
      }
    } catch (error) {
      toast.error(t("verification.resend_error"))
      console.error(error)
    } finally {
      setIsResending(false)
    }
  }

  // Show loading state while auth or user data is loading
  if (authLoading || currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If user is not found after loading, show nothing while redirecting
  if (!currentUser) {
    return null
  }

  // If email is already verified and we have user profile, show redirect message
  if (checkVerificationStatus?.verified && userWithProfile) {
    // Use effect will handle the redirect
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <p className="text-lg font-medium">{t("verification.email_verified")}</p>
          <p className="text-sm text-muted-foreground mt-2">{t("verification.redirecting")}</p>
        </div>
      </div>
    )
  }

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-card/95 backdrop-blur">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-green-100 flex items-center justify-center animate-in fade-in zoom-in duration-500">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className={`text-3xl font-bold ${fontClass}`}>
              {t("verification.email_verified")}
            </CardTitle>
            <CardDescription className={`text-base mt-2 ${fontClass}`}>
              {t("verification.redirecting")}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

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
        </CardHeader>

        <CardContent className="space-y-6 px-8">
          {/* OTP Input - Always LTR for numbers */}
          <div className="flex justify-center" dir="ltr">
            <InputOTP
              value={otp}
              onChange={setOtp}
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              className="gap-2"
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
              disabled={isResending || countdown > 0}
              className={`w-full h-10 ${fontClass}`}
            >
              {isResending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t("verification.sending")}
                </>
              ) : countdown > 0 ? (
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}