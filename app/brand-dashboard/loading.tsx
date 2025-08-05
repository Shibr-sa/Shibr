import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function BrandDashboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Onboarding Card Skeleton */}
      <Card>
        <CardContent className="p-6 flex items-center gap-8">
          <Skeleton className="h-32 w-48 hidden md:block" />
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-1 flex-1" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-1 flex-1" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>

      {/* Welcome Section Skeleton */}
      <div className="text-center py-4 space-y-4">
        <Skeleton className="h-6 w-48 mx-auto" />
        <Skeleton className="h-4 w-96 mx-auto" />
        <Skeleton className="h-10 w-32 mx-auto" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-8 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty States Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-16" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center h-64">
              <Skeleton className="h-24 w-24 rounded-full mb-4" />
              <Skeleton className="h-4 w-48" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Latest Sales Operations Skeleton */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center h-64">
          <Skeleton className="h-24 w-24 rounded-full mb-4" />
          <Skeleton className="h-4 w-48" />
        </CardContent>
      </Card>
    </div>
  )
}
