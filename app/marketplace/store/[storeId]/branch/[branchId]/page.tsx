import { notFound } from "next/navigation"
import { ShelfList } from "@/components/marketplace/shelf-list"
import { MarketplaceBreadcrumbs } from "@/components/marketplace/marketplace-breadcrumbs"

interface BranchDetailsPageProps {
  params: {
    storeId: string
    branchId: string
  }
  searchParams: {
    page?: string
  }
}

export default function BranchDetailsPage({ params, searchParams }: BranchDetailsPageProps) {
  if (!params.storeId || !params.branchId) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Breadcrumbs */}
      <MarketplaceBreadcrumbs
        currentLevel="shelves"
        storeId={params.storeId}
        branchId={params.branchId}
      />

      {/* Shelf Listing */}
      <ShelfList
        branchId={params.branchId}
        initialPage={searchParams.page ? parseInt(searchParams.page, 10) : 1}
      />
    </div>
  )
}