"use client"

import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Building2, MapPin, Package, Trash2, Edit, Eye } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useLanguage } from "@/contexts/localization-context"
import React, { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Id } from "@/convex/_generated/dataModel"
import { useToast } from "@/hooks/use-toast"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"

export default function BranchesPage() {
  const { t, language, direction } = useLanguage()
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const { user } = useCurrentUser()
  const { toast } = useToast()

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)

  // Fetch branches and stats
  const branches = useQuery(api.branches.getBranches)
  const branchStats = useQuery(api.branches.getBranchStats)

  const deleteBranch = useMutation(api.branches.deleteBranch)

  // Helper function to get city name in current language
  const getCityName = (cityKey: string) => {
    const normalizedKey = cityKey.toLowerCase().replace(/-/g, '_').replace(/ /g, '_')
    const translationKey = `cities.${normalizedKey}`
    return t(translationKey as any)
  }

  // Filter options
  const filterOptions = [
    { value: "all", label: t("branches.all_filter") },
    { value: "active", label: t("branches.active_filter") },
    { value: "inactive", label: t("branches.inactive_filter") }
  ]

  const orderedFilters = direction === "rtl" ? [...filterOptions].reverse() : filterOptions

  // Filter and search branches
  const filteredBranches = useMemo(() => {
    if (!branches) return []

    let filtered = [...branches]

    // Apply status filter
    if (filter === "active") {
      filtered = filtered.filter(branch => branch.status === "active")
    } else if (filter === "inactive") {
      filtered = filtered.filter(branch => branch.status === "inactive")
    }

    // Apply search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase()
      filtered = filtered.filter(branch =>
        branch.branchName.toLowerCase().includes(query) ||
        branch.city.toLowerCase().includes(query) ||
        getCityName(branch.city).toLowerCase().includes(query)
      )
    }

    return filtered
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches, filter, debouncedSearchQuery])

  // Handle delete branch
  const handleDelete = async (branchId: Id<"branches">, branchName: string) => {
    try {
      await deleteBranch({ branchId })
      toast({
        title: t("common.success"),
        description: t("branches.deleted_success")
      })
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || t("common.something_went_wrong"),
        variant: "destructive"
      })
    }
  }

  // Get badge variant for branch status
  const getBadgeVariant = (status: string): "default" | "secondary" => {
    return status === "active" ? "default" : "secondary"
  }

  return (
    <div className="w-full px-12">
      <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {branchStats ? (
          <>
            <StatCard
              title={t("branches.stats.total")}
              value={branchStats.totalBranches}
              icon={<Building2 className="h-6 w-6 text-primary" />}
            />
            <StatCard
              title={t("branches.stats.active")}
              value={branchStats.activeBranches}
              icon={<MapPin className="h-6 w-6 text-primary" />}
            />
            <StatCard
              title={t("branches.stats.total_shelves")}
              value={branchStats.totalShelves}
              icon={<Package className="h-6 w-6 text-primary" />}
            />
          </>
        ) : (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        )}
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Tabs value={filter} onValueChange={setFilter} className="w-full sm:w-auto">
          <TabsList>
            {orderedFilters.map(option => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className={`absolute ${direction === "rtl" ? "right-3" : "left-3"} top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4`} />
            <Input
              placeholder={t("branches.search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={direction === "rtl" ? "pr-10" : "pl-10"}
            />
          </div>
          <Button onClick={() => router.push("/store-dashboard/branches/new")}>
            <Plus className="w-4 h-4 me-2" />
            {t("branches.add_branch")}
          </Button>
        </div>
      </div>

      {/* Branches Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("branches.branch_name")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("shelves.city")}</TableHead>
              <TableHead className="hidden lg:table-cell">{t("branches.shelves_count")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead className="text-end">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!branches ? (
              // Loading state
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : filteredBranches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {t("branches.no_branches")}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {t("branches.no_branches_description")}
                  </p>
                  <Button onClick={() => router.push("/store-dashboard/branches/new")}>
                    <Plus className="w-4 h-4 me-2" />
                    {t("branches.add_branch")}
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              filteredBranches.map((branch) => (
                <TableRow key={branch._id}>
                  <TableCell className="font-medium">{branch.branchName}</TableCell>
                  <TableCell className="hidden md:table-cell">{getCityName(branch.city)}</TableCell>
                  <TableCell className="hidden lg:table-cell">{branch.shelfCount}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(branch.status)}>
                      {branch.status === "active" ? t("common.active") : t("common.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/store-dashboard/branches/${branch._id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/store-dashboard/branches/${branch._id}/edit`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("branches.delete_confirm_title")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("branches.delete_confirm_description", { name: String(branch.branchName) })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(branch._id, branch.branchName)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {t("common.delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      </div>
    </div>
  )
}
