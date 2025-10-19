"use client"

import { BranchForm } from "@/components/branch-form"
import { Skeleton } from "@/components/ui/skeleton"
import { useLanguage } from "@/contexts/localization-context"
import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

export default function EditBranchPage() {
  const { t } = useLanguage()
  const params = useParams()

  const branchId = params.id as Id<"branches">
  const branch = useQuery(api.branches.getBranchById, { branchId })

  if (!branch) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("branches.edit_title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("branches.edit_description")}
        </p>
      </div>

      <BranchForm mode="edit" branchId={branchId} initialData={branch} />
    </div>
  )
}
