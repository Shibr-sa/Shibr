import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Store, QrCode, Banknote } from "lucide-react"

export default function BrandShelvesLoading() {
  return (
    <div className="w-full space-y-6">
      {/* Statistics Section Skeleton */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
          {/* Tabs Skeleton */}
          <div className="flex gap-1 p-1 rounded-lg bg-muted">
            <Skeleton className="h-8 w-16 rounded" />
            <Skeleton className="h-8 w-16 rounded" />
            <Skeleton className="h-8 w-16 rounded" />
            <Skeleton className="h-8 w-16 rounded" />
          </div>
        </div>
        
        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-muted/50 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-8 w-20 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Store className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-muted/50 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-8 w-20 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <QrCode className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-muted/50 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-8 w-28 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Banknote className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Current Shelves Section Skeleton */}
      <div className="space-y-4 w-full">
        <div className="space-y-4">
          <div>
            <Skeleton className="h-7 w-64 mb-2" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          
          {/* Search and Add Button Skeleton */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Skeleton className="h-10 w-full sm:w-80" />
            <div className="sm:ms-auto">
              <Skeleton className="h-10 w-full sm:w-36" />
            </div>
          </div>
        </div>
        
        {/* Table Skeleton */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="h-12 text-start font-medium w-[20%]">
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead className="h-12 text-start font-medium w-[15%]">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead className="h-12 text-start font-medium w-[10%]">
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead className="h-12 text-start font-medium w-[15%]">
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead className="h-12 text-start font-medium w-[15%]">
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead className="h-12 text-start font-medium w-[15%]">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead className="h-12 text-start font-medium w-[10%]">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`loading-${index}`} className="h-[72px]">
                  <TableCell className="py-3 w-[20%]"><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell className="py-3 w-[15%]"><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell className="py-3 w-[10%]"><Skeleton className="h-4 w-[40px]" /></TableCell>
                  <TableCell className="py-3 w-[15%]"><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell className="py-3 w-[15%]"><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell className="py-3 w-[15%]"><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
                  <TableCell className="py-3 w-[10%]"><Skeleton className="h-8 w-8 rounded" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Skeleton */}
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
  )
}