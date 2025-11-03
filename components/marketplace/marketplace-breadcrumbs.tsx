"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useLanguage } from "@/contexts/localization-context"
import { Skeleton } from "@/components/ui/skeleton"

interface MarketplaceBreadcrumbsProps {
  currentLevel: "stores" | "branches" | "shelves"
  storeId?: string
  branchId?: string
}

export function MarketplaceBreadcrumbs({ currentLevel, storeId, branchId }: MarketplaceBreadcrumbsProps) {
  const { t, direction } = useLanguage()

  // Fetch store name if needed
  const store = useQuery(
    api.stores.getStoreWithBranches,
    storeId ? { storeProfileId: storeId as Id<"storeProfiles">, page: 1, pageSize: 1 } : "skip"
  )

  // Fetch branch name if needed (you'll need to add this query to branches.ts)
  // For now, we'll skip branch name fetching

  const Separator = () => (
    <ChevronRight className={`h-4 w-4 mx-2 text-muted-foreground ${direction === "rtl" ? "rotate-180" : ""}`} />
  )

  return (
    <nav className="flex items-center text-sm mb-6">
      {/* Home */}
      <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
        {t("common.home")}
      </Link>

      <Separator />

      {/* Marketplace (Stores) */}
      {currentLevel === "stores" ? (
        <span className="font-medium text-foreground">{t("marketplace.title")}</span>
      ) : (
        <Link href="/marketplace" className="text-muted-foreground hover:text-foreground transition-colors">
          {t("marketplace.title")}
        </Link>
      )}

      {/* Store Name */}
      {storeId && currentLevel !== "stores" && (
        <>
          <Separator />
          {currentLevel === "branches" ? (
            store?.store ? (
              <span className="font-medium text-foreground">{store.store.storeName}</span>
            ) : (
              <Skeleton className="h-4 w-20" />
            )
          ) : (
            <Link
              href={`/marketplace/store/${storeId}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {store?.store ? store.store.storeName : <Skeleton className="h-4 w-20 inline-block" />}
            </Link>
          )}
        </>
      )}

      {/* Branch Name */}
      {branchId && currentLevel === "shelves" && (
        <>
          <Separator />
          <span className="font-medium text-foreground">{t("marketplace.shelves")}</span>
        </>
      )}
    </nav>
  )
}