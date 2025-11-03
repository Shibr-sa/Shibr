import { notFound } from "next/navigation"
import { BranchList } from "@/components/marketplace/branch-list"
import { MarketplaceBreadcrumbs } from "@/components/marketplace/marketplace-breadcrumbs"

interface StoreDetailsPageProps {
  params: {
    storeId: string
  }
  searchParams: {
    city?: string
    page?: string
  }
}

export default function StoreDetailsPage({ params, searchParams }: StoreDetailsPageProps) {
  if (!params.storeId) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Breadcrumbs */}
      <MarketplaceBreadcrumbs
        currentLevel="branches"
        storeId={params.storeId}
      />

      {/* Branch Listing */}
      <BranchList
        storeId={params.storeId}
        initialCity={searchParams.city}
        initialPage={searchParams.page ? parseInt(searchParams.page, 10) : 1}
      />
    </div>
  )
}