"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/localization-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Search, Eye, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const postsData = [
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
  const itemsPerPage = 5

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "published":
        return "default"
      case "rented":
        return "default"
      case "under_review":
        return "secondary"
      case "rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Filter posts based on status and search query
  const filteredPosts = postsData.filter(post => {
    const matchesStatus = filterStatus === "all" || post.status === filterStatus
    const matchesSearch = !searchQuery || 
      post.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.shelfName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.branch.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPosts = filteredPosts.slice(startIndex, endIndex)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{t("posts.title")}</CardTitle>
        <p className="text-muted-foreground">{t("posts.description")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar and Filter Pills */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative w-80">
            <Search className="absolute end-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFilterStatus("all")
                setCurrentPage(1)
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-colors ${
                filterStatus === "all" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {filterStatus === "all" && <Check className="h-3 w-3" />}
              {t("posts.filter_all")}
            </button>
            <button
              onClick={() => {
                setFilterStatus("rented")
                setCurrentPage(1)
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-colors ${
                filterStatus === "rented" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {filterStatus === "rented" && <Check className="h-3 w-3" />}
              {t("posts.status.rented")}
            </button>
            <button
              onClick={() => {
                setFilterStatus("published")
                setCurrentPage(1)
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-colors ${
                filterStatus === "published" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {filterStatus === "published" && <Check className="h-3 w-3" />}
              {t("posts.status.published")}
            </button>
            <button
              onClick={() => {
                setFilterStatus("under_review")
                setCurrentPage(1)
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-colors ${
                filterStatus === "under_review" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {filterStatus === "under_review" && <Check className="h-3 w-3" />}
              {t("posts.status.under_review")}
            </button>
            <button
              onClick={() => {
                setFilterStatus("rejected")
                setCurrentPage(1)
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-colors ${
                filterStatus === "rejected" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {filterStatus === "rejected" && <Check className="h-3 w-3" />}
              {t("posts.status.rejected")}
            </button>
          </div>
        </div>

        {/* Posts Table */}
        <div className="space-y-4">
          <div className="rounded-md border">
            <div className="min-h-[420px]"> {/* Fixed height for 5 rows */}
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
                            {language === "ar" ? 
                              (post.id === 1 ? "24 يونيو 2023" :
                               post.id === 2 ? "23 يونيو 2023" :
                               post.id === 3 ? "22 يونيو 2023" :
                               post.id === 4 ? "21 يونيو 2023" :
                               post.id === 5 ? "20 يونيو 2023" :
                               post.id === 6 ? "19 يونيو 2023" :
                               post.id === 7 ? "18 يونيو 2023" :
                               "17 يونيو 2023")
                              : post.addedDate
                            }
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge variant={getStatusVariant(post.status)} className="font-normal">
                              {t(`posts.status.${post.status}`)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Fill remaining rows if less than 5 items */}
                      {paginatedPosts.length < itemsPerPage && Array.from({ length: itemsPerPage - paginatedPosts.length }).map((_, index) => (
                        <TableRow key={`filler-${index}`} className={`h-[72px] ${index < itemsPerPage - paginatedPosts.length - 1 ? 'border-b' : ''}`}>
                          <TableCell className="py-3">&nbsp;</TableCell>
                          <TableCell className="py-3">&nbsp;</TableCell>
                          <TableCell className="py-3">&nbsp;</TableCell>
                          <TableCell className="py-3">&nbsp;</TableCell>
                          <TableCell className="py-3">&nbsp;</TableCell>
                          <TableCell className="py-3">&nbsp;</TableCell>
                          <TableCell className="py-3">&nbsp;</TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : (
                    // Empty state - show 5 empty rows
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`empty-${index}`} className="h-[72px]">
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          {index === 2 && t("posts.no_results")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
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
        </div>
      </CardContent>
    </Card>
  )
}