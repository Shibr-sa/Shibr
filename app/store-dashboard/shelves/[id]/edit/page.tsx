"use client"

import { use } from "react"
import { ShelfForm } from "@/components/shelf-form"
import { useLanguage } from "@/contexts/localization-context"
import { useStoreData } from "@/contexts/store-data-context"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Loader2 } from "lucide-react"

interface EditShelfPageProps {
  params: Promise<{ id: string }>
}

export default function EditShelfPage({ params }: EditShelfPageProps) {
  const { id: shelfId } = use(params)
  const { t, direction, language } = useLanguage()
  const { isLoading, isStoreDataComplete } = useStoreData()
  const router = useRouter()
  
  // Fetch existing shelf data
  const existingShelf = useQuery(api.shelves.getShelfById, { shelfId: shelfId as Id<"shelves"> })

  // Redirect if store data is not complete
  if (!isLoading && !isStoreDataComplete) {
    router.push("/store-dashboard/settings")
    return null
  }

  // Loading state
  if (!existingShelf) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <ShelfForm 
        mode="edit" 
        shelfId={shelfId as Id<"shelves">}
        initialData={existingShelf}
      />
    </div>
  )
}