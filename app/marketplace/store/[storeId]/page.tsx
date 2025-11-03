import { notFound } from "next/navigation"
import { BranchList } from "@/components/marketplace/branch-list"
import { MarketplaceBreadcrumbs } from "@/components/marketplace/marketplace-breadcrumbs"

interface StoreDetailsPageProps {
  params: Promise<{
    storeId: string
  }>
  searchParams: Promise<{
    city?: string
    page?: string
  }>
}

export default async function StoreDetailsPage({ params, searchParams }: StoreDetailsPageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  if (!resolvedParams.storeId) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Breadcrumbs */}
      <MarketplaceBreadcrumbs
        currentLevel="branches"
        storeId={resolvedParams.storeId}
      />

      {/* Branch Listing */}
      <BranchList
        storeId={resolvedParams.storeId}
        initialCity={resolvedSearchParams.city}
        initialPage={resolvedSearchParams.page ? parseInt(resolvedSearchParams.page, 10) : 1}
      />
    </div>
  )
}