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
      <div className="w-full px-12">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="w-full px-12">
      <BranchForm mode="edit" branchId={branchId} initialData={branch} />
    </div>
  )
}
