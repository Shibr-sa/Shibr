import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Package, ShoppingCart, Banknote } from "lucide-react"

export default function BrandProductsLoading() {
  return (
    <div className="w-full space-y-6">
      {/* Statistics Section Skeleton */}
      <div>
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Skeleton className="h-6 w-64 mb-2" />
              <Skeleton className="h-4 w-80" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-9 w-36" />
            </div>
          </div>
        </div>
        
        {/* Stats Cards Skeleton */}
        <div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-muted/50 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-3.5 w-32 mb-2" />
                    <Skeleton className="h-7 w-16" />
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-muted/50 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-3.5 w-32 mb-2" />
                    <Skeleton className="h-7 w-16" />
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-muted/50 border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-3.5 w-32 mb-2" />
                    <Skeleton className="h-7 w-24" />
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Banknote className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Products Table Section Skeleton */}
      <div className="w-full">
        <div className="mb-4">
          {/* Search Skeleton */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Skeleton className="h-10 w-full sm:w-80" />
          </div>
        </div>
        
        {/* Table Skeleton */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border-b">
                <TableHead className="text-start h-12 font-medium w-[10%]">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead className="text-start h-12 font-medium w-[20%]">
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead className="text-start h-12 font-medium w-[15%]">
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead className="text-start h-12 font-medium w-[10%]">
                  <Skeleton className="h-4 w-12" />
                </TableHead>
                <TableHead className="text-start h-12 font-medium w-[10%]">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead className="text-start h-12 font-medium w-[12.5%]">
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead className="text-start h-12 font-medium w-[12.5%]">
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead className="text-start h-12 font-medium w-[10%]">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`} className="h-[72px]">
                  <TableCell className="py-3 w-[10%]"><Skeleton className="h-10 w-10 rounded-lg" /></TableCell>
                  <TableCell className="py-3 w-[20%]"><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell className="py-3 w-[15%]"><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell className="py-3 w-[10%]"><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell className="py-3 w-[10%]"><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell className="py-3 w-[12.5%]"><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell className="py-3 w-[12.5%]"><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell className="py-3 w-[10%]">
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Skeleton */}
        <div className="mt-4">
          <div className="flex items-center justify-center gap-2">
            <Skeleton className="h-9 w-20" />
            <div className="flex gap-1">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
            </div>
            <Skeleton className="h-9 w-16" />
          </div>
        </div>
      </div>
    </div>
  )
}
