"use client"

import { useState, useEffect, Suspense, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useLanguage } from "@/contexts/localization-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Mail, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react"
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { Alert, AlertDescription } from "@/components/ui/alert"

/**
 * Log with consistent formatting for debugging
 */
function log(prefix: string, message: string, data?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${prefix} [verify-email] ${message}`, data ? JSON.stringify(data, null, 2) : '')
}

/**
 * Verification state machine states
 */
type VerificationState =
  | "loading"           // Initial loading
  | "unauthenticated"   // Not logged in
  | "already_verified"  // Email already verified
  | "awaiting_otp"      // Waiting for user to enter OTP
  | "verifying"         // Currently verifying OTP
  | "verified"          // Just verified successfully
  | "error"             // Error state

/**
 * Main verification component with proper state management
 */
function VerifyEmailContent() {
  const { t, language, direction } = useLanguage()
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const fontClass = direction === "rtl" ? "font-cairo" : "font-inter"

  // State Management
  const [verificationState, setVerificationState] = useState<VerificationState>("loading")
  const [otp, setOtp] = useState("")
  const [countdown, setCountdown] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Refs to prevent multiple redirects
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasRedirectedRef = useRef(false)

  // Queries
  const currentUser = useQuery(api.users.getCurrentUser)
  const userWithProfile = useQuery(api.users.getCurrentUserWithProfile)
  const checkVerificationStatus = useQuery(
    api.emailVerification.checkVerificationStatus,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  )

  // Mutations
  const verifyOTP = useMutation(api.emailVerification.verifyOTP)
  const resendOTP = useMutation(api.emailVerification.resendOTP)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  /**
   * Determine the correct dashboard path based on account type
   */
  const getDashboardPath = useCallback(() => {
    return userWithProfile?.accountType === "store_owner" ? "/store-dashboard" :
           userWithProfile?.accountType === "brand_owner" ? "/brand-dashboard" :
           userWithProfile?.accountType === "admin" ? "/admin-dashboard" :
           "/dashboard"
  }, [userWithProfile])

  /**
   * Handle redirect with debouncing and single execution
   */
  const handleRedirect = useCallback((path: string, delay: number = 0) => {
    if (hasRedirectedRef.current) {
      log('🚫', 'Redirect already in progress, skipping', { path })
      return
    }

    log('🔀', 'Scheduling redirect', { path, delay })
    hasRedirectedRef.current = true

    if (delay > 0) {
      redirectTimeoutRef.current = setTimeout(() => {
        log('🚀', 'Executing redirect', { path })
        window.location.href = path
      }, delay)
    } else {
      log('🚀', 'Executing immediate redirect', { path })
      window.location.href = path
    }
  }, [])

  /**
   * Main state determination logic
   * Single source of truth for verification state
   */
  useEffect(() => {
    log('📊', 'State determination effect running', {
      authLoading,
      isAuthenticated,
      hasCurrentUser: !!currentUser,
      currentUserId: currentUser?._id,
      verificationStatus: checkVerificationStatus,
      currentState: verificationState
    })

    // Still loading auth - wait longer to ensure auth is fully established
    if (authLoading) {
      setVerificationState("loading")
      return
    }

    // Waiting for user data to load (give it more time)
    if (currentUser === undefined) {
      setVerificationState("loading")
      // Set a timeout to check again after a delay
      const checkTimer = setTimeout(() => {
        if (!currentUser && !authLoading) {
          log('⏰', 'User data still not loaded after delay')
        }
      }, 2000)
      return () => clearTimeout(checkTimer)
    }

    // Only redirect to signin if we're sure user is not authenticated
    // AND we've given enough time for auth to establish
    if (!isAuthenticated && !authLoading && currentUser === null) {
      log('❌', 'User not authenticated after waiting')
      setVerificationState("unauthenticated")
      // Add delay before redirect to prevent loops
      setTimeout(() => {
        handleRedirect("/signin")
      }, 1000)
      return
    }

    // User not found after loading completed
    if (currentUser === null && !authLoading) {
      log('❌', 'Current user not found after loading')
      setVerificationState("unauthenticated")
      setTimeout(() => {
        handleRedirect("/signin")
      }, 1000)
      return
    }

    // If we have a user, continue with verification checks
    if (!currentUser) {
      return
    }

    // Waiting for verification status
    if (checkVerificationStatus === undefined) {
      setVerificationState("loading")
      return
    }

    // Check if already verified
    if (checkVerificationStatus?.verified) {
      log('✅', 'Email already verified', {
        verifiedAt: checkVerificationStatus.verifiedAt
      })

      // Only redirect if we have profile data
      if (userWithProfile !== undefined) {
        setVerificationState("already_verified")
        const dashboardPath = getDashboardPath()
        toast.success(t("verification.email_verified"))
        handleRedirect(dashboardPath, 2000)
      }
      return
    }

    // Email not verified, show OTP input
    log('📧', 'Email not verified, awaiting OTP')
    setVerificationState("awaiting_otp")

  }, [authLoading, isAuthenticated, currentUser, checkVerificationStatus, userWithProfile,
      verificationState, getDashboardPath, handleRedirect, t])

  /**
   * Countdown timer for resend cooldown
   */
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  /**
   * Handle OTP verification
   */
  const handleVerify = async () => {
    log('🔐', 'Starting verification', { otp, userId: currentUser?._id })

    if (otp.length !== 6) {
      setErrorMessage(t("verification.invalid_code"))
      return
    }

    if (!currentUser?._id) {
      setErrorMessage(t("verification.user_not_found"))
      return
    }

    setVerificationState("verifying")
    setErrorMessage(null)

    try {
      const result = await verifyOTP({
        userId: currentUser._id,
        otp
      })

      log('📊', 'Verification result', result)

      if (result.success) {
        log('✅', 'Verification successful')
        setVerificationState("verified")
        toast.success(t("verification.success"))

        // Get dashboard path and redirect
        const dashboardPath = getDashboardPath()
        log('🏠', 'Redirecting to dashboard', { path: dashboardPath })
        handleRedirect(dashboardPath, 2000)
      } else {
        log('❌', 'Verification failed', { error: result.error })
        setVerificationState("awaiting_otp")
        setErrorMessage(result.error || t("verification.invalid_code"))
        setOtp("")
      }
    } catch (error: any) {
      log('❌', 'Error during verification', error)
      setVerificationState("error")
      setErrorMessage(t("verification.error"))
    }
  }

  /**
   * Handle OTP resend
   */
  const handleResend = async () => {
    log('🔄', 'Resending OTP', { userId: currentUser?._id })

    if (!currentUser?._id) {
      setErrorMessage(t("verification.user_not_found"))
      return
    }

    setErrorMessage(null)

    try {
      const result = await resendOTP({
        userId: currentUser._id
      })

      log('📊', 'Resend result', result)

      if (result.success) {
        toast.success(t("verification.code_sent"))
        setCountdown(60) // 60 second cooldown
        setOtp("")
      } else {
        // Check if email is already verified
        if (result.error === "Email is already verified") {
          log('✅', 'Email already verified during resend')
          toast.success(t("verification.email_verified"))
          setVerificationState("already_verified")

          const dashboardPath = getDashboardPath()
          handleRedirect(dashboardPath, 1500)
        } else {
          setErrorMessage(result.error || t("verification.resend_error"))
        }
      }
    } catch (error: any) {
      log('❌', 'Error resending OTP', error)
      setErrorMessage(t("verification.resend_error"))
    }
  }

  // Render based on state
  switch (verificationState) {
    case "loading":
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )

    case "unauthenticated":
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{t("auth.please_sign_in")}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      )

    case "already_verified":
    case "verified":
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

    case "error":
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage || t("verification.error")}</AlertDescription>
              </Alert>
              <Button
                onClick={() => {
                  setVerificationState("awaiting_otp")
                  setErrorMessage(null)
                }}
                className="w-full mt-4"
              >
                {t("common.try_again")}
              </Button>
            </CardContent>
          </Card>
        </div>
      )

    case "verifying":
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className={`text-lg ${fontClass}`}>{t("verification.verifying")}</p>
            </CardContent>
          </Card>
        </div>
      )

    case "awaiting_otp":
    default:
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
              {currentUser?.email && (
                <p className={`text-sm text-muted-foreground mt-2 ${fontClass}`}>
                  {currentUser.email}
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
                  disabled={verificationState === "verifying"}
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

              {/* OTP Expiry Info */}
              {checkVerificationStatus?.otpExpiresAt && (
                <p className={`text-xs text-center text-muted-foreground ${fontClass}`}>
                  {t("verification.expires_in")} {Math.max(0, Math.floor((checkVerificationStatus.otpExpiresAt - Date.now()) / 60000))} {t("common.minutes")}
                </p>
              )}

              {/* Verify Button */}
              <Button
                onClick={handleVerify}
                disabled={verificationState === "verifying" || otp.length !== 6}
                className="w-full h-12 text-base font-medium"
                size="lg"
              >
                {verificationState === "verifying" ? (
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

            {/* Debug Info (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="px-8 pb-4">
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer">Debug Info</summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                    {JSON.stringify({
                      state: verificationState,
                      userId: currentUser?._id,
                      email: currentUser?.email,
                      verified: checkVerificationStatus?.verified,
                      hasPendingOTP: checkVerificationStatus?.hasPendingOTP,
                      countdown,
                      otpLength: otp.length
                    }, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </Card>
        </div>
      )
  }
}

/**
 * Main page component with Suspense boundary
 */
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