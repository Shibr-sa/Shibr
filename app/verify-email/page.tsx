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

  const verifyOTP = useMutation(api.emailVerification.verifyOTP)
  const resendOTP = useMutation(api.emailVerification.resendOTP)
  const checkVerificationStatus = useQuery(api.emailVerification.checkVerificationStatus,
    isAuthenticated ? { userId: searchParams.get("userId") as any } : "skip"
  )

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (checkVerificationStatus?.verified) {
      setVerified(true)
      setTimeout(() => {
        router.push("/dashboard")
      }, 3000)
    }
  }, [checkVerificationStatus, router])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error(t("verification.invalid_code"))
      return
    }

    setIsVerifying(true)
    try {
      const result = await verifyOTP({
        userId: searchParams.get("userId") as any,
        otp
      })

      if (result.success) {
        setVerified(true)
        toast.success(t("verification.success"))
        setTimeout(() => {
          router.push("/dashboard")
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
    setIsResending(true)
    try {
      const result = await resendOTP({
        userId: searchParams.get("userId") as any
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