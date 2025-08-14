"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/localization-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, FileText, Check } from "lucide-react"

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
]

export default function PostsPage() {
  const { t, language } = useLanguage()
  const [filterStatus, setFilterStatus] = useState("all")

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

  const filteredPosts = filterStatus === "all" 
    ? postsData 
    : postsData.filter(post => post.status === filterStatus)

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
            <Input placeholder={t("posts.search_placeholder")} className="pe-10" />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus("all")}
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
              onClick={() => setFilterStatus("rented")}
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
              onClick={() => setFilterStatus("published")}
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
              onClick={() => setFilterStatus("under_review")}
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
              onClick={() => setFilterStatus("rejected")}
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
              {filteredPosts.map((post, index) => (
                <TableRow 
                  key={post.id} 
                  className={`h-[72px] ${index < filteredPosts.length - 1 ? 'border-b' : ''}`}
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
                       "20 يونيو 2023")
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
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}