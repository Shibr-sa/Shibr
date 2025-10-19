"use client"

import { BranchForm } from "@/components/branch-form"
import { useLanguage } from "@/contexts/localization-context"

export default function NewBranchPage() {
  const { t } = useLanguage()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("branches.create_title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("branches.create_description")}
        </p>
      </div>

      <BranchForm mode="create" />
    </div>
  )
}
