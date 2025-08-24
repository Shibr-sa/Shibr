"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useLanguage } from "@/contexts/localization-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Search, Eye, Package } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { PostDetailsDialog } from "@/components/dialogs/post-details-dialog"

// Hardcoded data removed - using real data from Convex
const _unusedPostsData = [
  {
    id: 1,
    storeName: "Store X",
    branch: "Riyadh",
    shelfName: "Front Display",
    percentage: 85,
    addedDate: "June 24, 2023",
    status: "published",
  },
  {
    id: 2,
    storeName: "Glow Cosmetics",
    branch: "Jeddah",
    shelfName: "Premium Shelf",
    percentage: 65,
    addedDate: "June 23, 2023",
    status: "under_review",
  },
  {
    id: 3,
    storeName: "Nova Perfumes",
    branch: "Dammam",
    shelfName: "Corner Unit",
    percentage: 90,
    addedDate: "June 22, 2023",
    status: "rented",
  },
  {
    id: 4,
    storeName: "Beauty Expert",
    branch: "Riyadh",
    shelfName: "Main Aisle",
    percentage: 45,
    addedDate: "June 21, 2023",
    status: "rejected",
  },
  {
    id: 5,
    storeName: "FitZone",
    branch: "Mecca",
    shelfName: "Sports Section",
    percentage: 75,
    addedDate: "June 20, 2023",
    status: "rented",
  },
  {
    id: 6,
    storeName: "Tech Hub",
    branch: "Riyadh",
    shelfName: "Electronics Corner",
    percentage: 55,
    addedDate: "June 19, 2023",
    status: "published",
  },
  {
    id: 7,
    storeName: "Fashion Plus",
    branch: "Jeddah",
    shelfName: "Entrance Display",
    percentage: 70,
    addedDate: "June 18, 2023",
    status: "under_review",
  },
  {
    id: 8,
    storeName: "Home Essentials",
    branch: "Dammam",
    shelfName: "Central Aisle",
    percentage: 80,
    addedDate: "June 17, 2023",
    status: "published",
  },
]

export default function PostsPage() {
  const { t, language } = useLanguage()
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedPost, setSelectedPost] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const itemsPerPage = 5
  
  // Fetch real data from Convex
  const postsResult = useQuery(api.admin.getPosts, {
    searchQuery,
    status: filterStatus,
    page: currentPage,
    limit: itemsPerPage,
  })
  
  const postsData = postsResult?.posts || []

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "published":
        return "default"
      case "rented":
        return "secondary"
      default:
        return "outline"
    }
  }

  // Use data from Convex query
  const filteredPosts = postsData
  const totalPages = postsResult?.totalPages || 1
  const paginatedPosts = postsData

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("posts.title")}</h2>
        <p className="text-muted-foreground">
          {t("posts.description")}
        </p>
      </div>

      {/* Toolbar: Search Bar and Filter Pills */}
      <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative w-80">
            <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder={t("posts.search_placeholder")} 
              className="pe-10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1) // Reset to first page on search
              }}
            />
          </div>

          {/* Filter Pills */}
          <ToggleGroup 
            type="single" 
            value={filterStatus}
            onValueChange={(value) => {
              if (value) {
                setFilterStatus(value)
                setCurrentPage(1)
              }
            }}
            className="justify-start"
          >
            <ToggleGroupItem value="all" aria-label="Show all posts">
              {t("posts.filter_all")}
            </ToggleGroupItem>
            <ToggleGroupItem value="rented" aria-label="Show rented posts">
              {t("posts.status.rented")}
            </ToggleGroupItem>
            <ToggleGroupItem value="published" aria-label="Show published posts">
              {t("posts.status.published")}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

      {/* Posts Table */}
      <div className="rounded-md border">
        <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="h-12 text-start font-medium">
                      {t("dashboard.store_name")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("dashboard.branch")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("dashboard.shelf_name")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("posts.table.percentage")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("dashboard.date_added")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("dashboard.status")}
                    </TableHead>
                    <TableHead className="h-12 text-start font-medium">
                      {t("dashboard.options")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPosts.length > 0 ? (
                    <>
                      {paginatedPosts.map((post, index) => (
                        <TableRow 
                          key={post.id} 
                          className={`h-[72px] ${index < paginatedPosts.length - 1 ? 'border-b' : ''}`}
                        >
                          <TableCell className="py-3 font-medium">
                            {post.storeName}
                          </TableCell>
                          <TableCell className="py-3 text-muted-foreground">
                            {language === "ar" ? 
                              (post.branch === "Riyadh" ? "الرياض" :
                               post.branch === "Jeddah" ? "جدة" :
                               post.branch === "Dammam" ? "الدمام" :
                               post.branch === "Mecca" ? "مكة" :
                               post.branch)
                              : post.branch
                            }
                          </TableCell>
                          <TableCell className="py-3 text-muted-foreground">
                            {language === "ar" ? 
                              (post.shelfName === "Front Display" ? "العرض الأمامي" :
                               post.shelfName === "Premium Shelf" ? "الرف المميز" :
                               post.shelfName === "Corner Unit" ? "وحدة الزاوية" :
                               post.shelfName === "Main Aisle" ? "الممر الرئيسي" :
                               post.shelfName === "Sports Section" ? "قسم الرياضة" :
                               post.shelfName === "Electronics Corner" ? "ركن الإلكترونيات" :
                               post.shelfName === "Entrance Display" ? "عرض المدخل" :
                               post.shelfName === "Central Aisle" ? "الممر المركزي" :
                               post.shelfName)
                              : post.shelfName
                            }
                          </TableCell>
                          <TableCell className="py-3">
                            <span className="font-medium">{post.percentage}%</span>
                          </TableCell>
                          <TableCell className="py-3 text-muted-foreground">
                            {post.addedDate}
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge variant={getStatusVariant(post.status)} className="font-normal">
                              {t(`posts.status.${post.status}`)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedPost(post)
                                setDialogOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Fill remaining rows with skeletons if less than 5 items */}
                      {paginatedPosts.length < itemsPerPage && Array.from({ length: itemsPerPage - paginatedPosts.length }).map((_, index) => (
                        <TableRow key={`filler-${index}`} className={`h-[72px] ${index < itemsPerPage - paginatedPosts.length - 1 ? 'border-b' : ''}`}>
                          <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-8 w-8 rounded" /></TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : (
                    // Empty state - proper shadcn/ui pattern
                    <TableRow>
                      <TableCell colSpan={7} className="h-[400px]">
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="rounded-full bg-muted p-4 mb-4">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-medium mb-1">
                            {searchQuery || filterStatus !== "all" 
                              ? t("posts.no_results")
                              : t("posts.no_posts")}
                          </h3>
                          <p className="text-sm text-muted-foreground text-center max-w-sm">
                            {searchQuery || filterStatus !== "all"
                              ? t("posts.try_different_filter")
                              : t("posts.posts_will_appear_here")}
                          </p>
                          {(searchQuery || filterStatus !== "all") && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="mt-4"
                              onClick={() => {
                                setSearchQuery("")
                                setFilterStatus("all")
                              }}
                            >
                              {t("posts.clear_filters")}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
      </div>

      {/* Pagination Controls - Always visible */}
      <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className={cn(
                    "cursor-pointer",
                    (currentPage === 1 || totalPages === 0) && "pointer-events-none opacity-50"
                  )}
                  aria-disabled={currentPage === 1 || totalPages === 0}
                >
                  {t("common.previous")}
                </PaginationPrevious>
              </PaginationItem>
              
              {totalPages > 0 ? (
                Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return page;
                }).map(page => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))
              ) : (
                <PaginationItem>
                  <PaginationLink isActive className="pointer-events-none">
                    1
                  </PaginationLink>
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className={cn(
                    "cursor-pointer",
                    (currentPage === totalPages || totalPages <= 1) && "pointer-events-none opacity-50"
                  )}
                  aria-disabled={currentPage === totalPages || totalPages <= 1}
                >
                  {t("common.next")}
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>

      {/* Post Details Dialog */}
      {selectedPost && (
        <PostDetailsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          post={selectedPost}
        />
      )}
    </div>
  )
}