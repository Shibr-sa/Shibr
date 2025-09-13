"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useLanguage } from "@/contexts/localization-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Mail, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

export default function VerifyEmailPage() {
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
  const checkVerificationStatus = useQuery(api.emailVerification.checkVerificationStatus,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  )

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    console.log('📊 [useEffect-verification] Check status:', checkVerificationStatus)
    console.log('📊 [useEffect-verification] User profile:', userWithProfile)

    // Only check verification status if all data is loaded
    if (checkVerificationStatus !== undefined && checkVerificationStatus?.verified) {
      console.log('📊 [useEffect-verification] Email is already verified!')
      setVerified(true)

      // Wait for userWithProfile to load before determining dashboard
      if (userWithProfile !== undefined) {
        const dashboardPath =
          userWithProfile?.accountType === "store_owner" ? "/store-dashboard" :
          userWithProfile?.accountType === "brand_owner" ? "/brand-dashboard" :
          userWithProfile?.accountType === "admin" ? "/admin-dashboard" :
          "/dashboard" // fallback

        console.log('📊 [useEffect-verification] Already verified, redirecting to:', dashboardPath)
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

  const handleVerify = async () => {
    console.log('🔐 [handleVerify] Starting verification process')
    console.log('🔐 [handleVerify] Current user ID:', currentUser?._id)
    console.log('🔐 [handleVerify] OTP entered:', otp)

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
      console.log('🔐 [handleVerify] Calling verifyOTP mutation...')
      const result = await verifyOTP({
        userId: currentUser._id,
        otp
      })

      console.log('🔐 [handleVerify] Verification result:', result)

      if (result.success) {
        setVerified(true)
        toast.success(t("verification.success"))

        // Determine the correct dashboard based on account type
        const dashboardPath =
          userWithProfile?.accountType === "store_owner" ? "/store-dashboard" :
          userWithProfile?.accountType === "brand_owner" ? "/brand-dashboard" :
          userWithProfile?.accountType === "admin" ? "/admin-dashboard" :
          "/dashboard" // fallback

        console.log('🔐 [handleVerify] Redirecting to:', dashboardPath)
        console.log('🔐 [handleVerify] Using window.location for hard redirect to avoid cache issues')

        setTimeout(() => {
          // Use window.location for a hard redirect to clear any cached queries
          window.location.href = dashboardPath
        }, 2000)
      } else {
        console.log('🔐 [handleVerify] Verification failed:', result.error)
        toast.error(result.error || t("verification.invalid_code"))
        setOtp("")
      }
    } catch (error) {
      console.error('🔐 [handleVerify] Error during verification:', error)
      toast.error(t("verification.error"))
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
        toast.error(result.error || t("verification.resend_error"))
      }
    } catch (error) {
      toast.error(t("verification.resend_error"))
      console.error(error)
    } finally {
      setIsResending(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className={`text-2xl ${fontClass}`}>
              {t("verification.email_verified")}
            </CardTitle>
            <CardDescription className={fontClass}>
              {t("verification.redirecting")}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className={`text-2xl ${fontClass}`}>
            {t("verification.verify_email")}
          </CardTitle>
          <CardDescription className={fontClass}>
            {t("verification.enter_code")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center" dir="ltr">
            <InputOTP
              value={otp}
              onChange={setOtp}
              maxLength={6}
              render={({ slots }) => (
                <InputOTPGroup>
                  {slots.map((slot, index) => (
                    <InputOTPSlot key={index} {...slot} />
                  ))}
                </InputOTPGroup>
              )}
            />
          </div>

          <Button
            onClick={handleVerify}
            disabled={isVerifying || otp.length !== 6}
            className="w-full h-12"
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

          <div className="text-center space-y-2">
            <p className={`text-sm text-muted-foreground ${fontClass}`}>
              {t("verification.didnt_receive")}
            </p>
            <Button
              variant="link"
              onClick={handleResend}
              disabled={isResending || countdown > 0}
              className={fontClass}
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

          <div className="text-center">
            <Link href="/dashboard">
              <Button variant="ghost" className={fontClass}>
                {t("verification.skip_for_now")}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}