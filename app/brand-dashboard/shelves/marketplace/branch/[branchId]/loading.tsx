import { Skeleton } from "@/components/ui/skeleton"

export default function BrandMarketplaceBranchLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="relative h-64 md:h-80 lg:h-96 w-full mb-6">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Title and info */}
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-6 w-40 mb-6" />

        {/* Search bar */}
        <Skeleton className="h-12 w-full mb-6 rounded-lg" />

        {/* Back button */}
        <Skeleton className="h-9 w-20 mb-6 rounded-lg" />

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col">
              <Skeleton className="h-48 w-full rounded-lg mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
              <Skeleton className="h-10 w-full mt-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
