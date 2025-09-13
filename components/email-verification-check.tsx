"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, Mail } from "lucide-react"
import { useLanguage } from "@/contexts/localization-context"
import { useCurrentUser } from "@/hooks/use-current-user"

interface EmailVerificationCheckProps {
  showBanner?: boolean
  enforceVerification?: boolean
}

export function EmailVerificationCheck({
  showBanner = true,
  enforceVerification = true
}: EmailVerificationCheckProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useCurrentUser()

  const verificationStatus = useQuery(
    api.emailVerification.checkVerificationStatus,
    user?._id ? { userId: user._id } : "skip"
  )

  useEffect(() => {
    // Only enforce in production
    const isDevelopment = process.env.NODE_ENV === 'development'

    if (enforceVerification && !isDevelopment && user && verificationStatus) {
      if (!verificationStatus.verified) {
        // Redirect to verification page if email is not verified
        router.push("/verify-email")
      }
    }
  }, [enforceVerification, user, verificationStatus, router])

  // Don't show banner if not needed
  if (!showBanner || !user || !verificationStatus || verificationStatus.verified) {
    return null
  }

  return (
    <Alert className="mb-4 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800 dark:text-yellow-200">
        {t("verification.email_not_verified")}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
          {t("verification.please_verify_email")}
        </p>
        <Button
          size="sm"
          variant="outline"
          className="border-yellow-300 hover:bg-yellow-100"
          onClick={() => router.push("/verify-email")}
        >
          <Mail className="h-4 w-4 me-2" />
          {t("verification.verify_now")}
        </Button>
      </AlertDescription>
    </Alert>
  )
}