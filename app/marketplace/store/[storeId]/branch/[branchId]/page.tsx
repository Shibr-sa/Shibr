import { notFound } from "next/navigation"
import { ShelfList } from "@/components/marketplace/shelf-list"
import { MarketplaceBreadcrumbs } from "@/components/marketplace/marketplace-breadcrumbs"

interface BranchDetailsPageProps {
  params: Promise<{
    storeId: string
    branchId: string
  }>
  searchParams: Promise<{
    page?: string
  }>
}

export default async function BranchDetailsPage({ params, searchParams }: BranchDetailsPageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  if (!resolvedParams.storeId || !resolvedParams.branchId) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Breadcrumbs */}
      <MarketplaceBreadcrumbs
        currentLevel="shelves"
        storeId={resolvedParams.storeId}
        branchId={resolvedParams.branchId}
      />

      {/* Shelf Listing */}
      <ShelfList
        branchId={resolvedParams.branchId}
        initialPage={resolvedSearchParams.page ? parseInt(resolvedSearchParams.page, 10) : 1}
      />
    </div>
  )
}