"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/localization-context"
import { useStoreData } from "@/contexts/store-data-context"
import { AlertCircle, CheckCircle2, XCircle, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface ProfileField {
  key: string
  label: string
  value: any
  required: boolean
  section: "general" | "store-data" | "payment"
}

interface StoreProfileCompletionProgressProps {
  showDetails?: boolean
  onCompletionChange?: (percentage: number) => void
}

export function StoreProfileCompletionProgress({ showDetails = true, onCompletionChange }: StoreProfileCompletionProgressProps) {
  const { t } = useLanguage()
  const { userData } = useStoreData()
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [missingFields, setMissingFields] = useState<ProfileField[]>([])
  const [completedFields, setCompletedFields] = useState<ProfileField[]>([])

  useEffect(() => {
    if (!userData) return

    const profile = userData.profile || {}

    // Define all profile fields with their requirements
    const fields: ProfileField[] = [
      // General Information (30%)
      {
        key: "fullName",
        label: t("settings.general.owner_name"),
        value: profile.fullName || userData.name,
        required: true,
        section: "general"
      },
      {
        key: "phoneNumber",
        label: t("settings.general.phone_number"),
        value: profile.phoneNumber || userData.phone,
        required: true,
        section: "general"
      },
      {
        key: "email",
        label: t("settings.general.email"),
        value: profile.email || userData.email,
        required: true,
        section: "general"
      },

      // Store Data (50%)
      {
        key: "storeName",
        label: t("settings.store_data.store_name"),
        value: profile.storeName,
        required: true,
        section: "store-data"
      },
      {
        key: "businessCategory",
        label: t("settings.store_data.store_type"),
        value: profile.businessCategory,
        required: true,
        section: "store-data"
      },
      {
        key: "commercialRegisterNumber",
        label: t("settings.store_data.commercial_reg"),
        value: profile.commercialRegisterNumber,
        required: true,
        section: "store-data"
      },
      {
        key: "commercialRegisterDocument",
        label: t("settings.store_data.commercial_register_document"),
        value: profile.commercialRegisterDocumentUrl,
        required: true,
        section: "store-data"
      },

      // Optional but tracked
      {
        key: "website",
        label: t("settings.store_data.website"),
        value: profile.website,
        required: false,
        section: "store-data"
      },
      {
        key: "profileImage",
        label: t("settings.general.upload_logo"),
        value: userData.image,
        required: false,
        section: "general"
      }
    ]

    // Calculate completion
    const requiredFields = fields.filter(f => f.required)
    const completedRequiredFields = requiredFields.filter(f => f.value)
    const missing = requiredFields.filter(f => !f.value)
    const completed = fields.filter(f => f.value)

    const percentage = Math.round((completedRequiredFields.length / requiredFields.length) * 100)

    setCompletionPercentage(percentage)
    setMissingFields(missing)
    setCompletedFields(completed)

    // Notify parent component of completion change
    if (onCompletionChange) {
      onCompletionChange(percentage)
    }
  }, [userData, t, onCompletionChange])

  const getProgressColor = () => {
    if (completionPercentage === 100) return "bg-green-500"
    if (completionPercentage >= 70) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getSectionFromField = (field: ProfileField): string => {
    switch (field.section) {
      case "general":
        return "general"
      case "store-data":
        return "store-data"
      case "payment":
        return "payment"
      default:
        return "general"
    }
  }

  if (!showDetails) {
    // Simple progress bar for dashboard
    return (
      <Card className={cn(
        "border-2",
        completionPercentage === 100 ? "border-green-500/20 bg-green-50/50 dark:bg-green-950/20" : "border-red-500/20 bg-red-50/50 dark:bg-red-950/20"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {completionPercentage === 100 ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <h3 className="font-semibold text-sm">
                {completionPercentage === 100
                  ? t("dashboard.profile_complete")
                  : t("dashboard.complete_your_profile")}
              </h3>
            </div>
            <span className={cn(
              "text-sm font-bold",
              completionPercentage === 100 ? "text-green-600" : "text-red-600"
            )}>
              {completionPercentage}%
            </span>
          </div>

          <Progress
            value={completionPercentage}
            className="h-2 mb-3"
            indicatorClassName={getProgressColor()}
          />

          {completionPercentage < 100 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {t("dashboard.missing_fields", { count: missingFields.length })}
              </p>
              <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                <Link href="/store-dashboard/settings">
                  {t("dashboard.complete_now")}
                  <ChevronRight className="h-3 w-3 ms-1" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Detailed view for settings page
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {completionPercentage === 100 ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-500" />
              )}
              <div>
                <h2 className="text-lg font-semibold">
                  {t("settings.profile_completion_title")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {completionPercentage === 100
                    ? t("settings.profile_complete_description")
                    : t("settings.profile_incomplete_description")}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={cn(
                "text-2xl font-bold",
                completionPercentage === 100 ? "text-green-600" : "text-red-600"
              )}>
                {completionPercentage}%
              </div>
              <p className="text-xs text-muted-foreground">
                {completedFields.length} / {missingFields.length + completedFields.length} {t("settings.fields_completed")}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <Progress
            value={completionPercentage}
            className="h-3"
            indicatorClassName={getProgressColor()}
          />

          {/* Missing Fields List */}
          {missingFields.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-red-600 mb-2">
                {t("settings.missing_required_fields")}:
              </h3>
              <div className="flex flex-wrap gap-2">
                {missingFields.map((field) => (
                  <div
                    key={field.key}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900"
                  >
                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm font-medium">{field.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Fields Summary */}
          {completedFields.length > 0 && showDetails && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-green-600 mb-2">
                {t("settings.completed_fields")}:
              </h3>
              <div className="flex flex-wrap gap-2">
                {completedFields.map((field) => (
                  <div
                    key={field.key}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm font-medium">{field.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}