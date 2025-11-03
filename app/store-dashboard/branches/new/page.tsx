"use client"

import { BranchForm } from "@/components/branch-form"
import { useLanguage } from "@/contexts/localization-context"

export default function NewBranchPage() {
  const { t } = useLanguage()

  return (
    <div className="w-full px-12">
      <BranchForm mode="create" />
    </div>
  )
}
