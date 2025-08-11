"use client"

import { ShelfForm } from "@/components/shelf-form"
import { useLanguage } from "@/contexts/language-context"
import { useStoreData } from "@/contexts/store-data-context"
import { useRouter } from "next/navigation"

export default function AddShelfPage() {
  const { t, direction } = useLanguage()
  const { isLoading, isStoreDataComplete } = useStoreData()
  const router = useRouter()

  // Redirect if store data is not complete
  if (!isLoading && !isStoreDataComplete) {
    router.push("/store-dashboard/settings")
    return null
  }

  return (
    <div className={`max-w-6xl mx-auto ${direction === "rtl" ? "font-cairo" : "font-inter"}`}>
      <ShelfForm mode="create" />
    </div>
  )
}