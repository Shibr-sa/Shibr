import { v } from "convex/values"
import { query, QueryCtx } from "../_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { getUserProfile } from "../profileHelpers"
import { getDateRange } from "../helpers"
import { verifyAdminAccess } from "./helpers"
import { Doc, Id } from "../_generated/dataModel"

// TypeScript Interfaces
interface TopStore {
  id: Id<"storeProfiles">
  name: string
  avatar: string | null
  revenue: number
  growth: number
}

interface MonthlyRevenue {
  month: string
  revenue: number
  orders: number
  users: number
}

interface PeriodData {
  currentShelves: Doc<"shelves">[]
  currentRentals: Doc<"rentalRequests">[]
  prevShelves: Doc<"shelves">[]
  prevRentals: Doc<"rentalRequests">[]
  allTimeShelves: Doc<"shelves">[]
  allTimeRentals: Doc<"rentalRequests">[]
}

interface UserStats {
  totalUsers: number
  storeOwners: number
  brandOwners: number
  activeUsers: number
  change: number
  newInPeriod: number
}

interface ShelfStats {
  total: number
  available: number
  approved: number
  change: number
  newInPeriod: number
}

interface RentalStats {
  active: number
  pending: number
  total: number
  change: number
  newInPeriod: number
}

interface RevenueStats {
  totalRevenue: number
  platformFee: number
  netRevenue: number
  change: number
  allTimeTotal: number
}

interface DailyRevenue {
  day: string
  value: number
}

interface CategoryData {
  name: string
  value: number
  color: string
}

interface RecentActivity {
  id: Id<"rentalRequests">
  type: string
  title: string
  description: string
  time: string
  icon: string
  color: string
}

// Helper: Calculate monthly revenue for current year
function calculateMonthlyRevenue(activeRentals: Doc<"rentalRequests">[]): MonthlyRevenue[] {
  const now = new Date()
  const currentYear = now.getFullYear()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return monthNames.map((monthName, monthIndex) => {
    // Filter rentals for this month in the current year
    const monthRentals = activeRentals.filter(rental => {
      const rentalDate = new Date(rental._creationTime)
      return rentalDate.getMonth() === monthIndex &&
        rentalDate.getFullYear() === currentYear
    })

    const monthRevenue = monthRentals.reduce((sum, r) => sum + (r.totalAmount || 0), 0)
    const monthOrders = monthRentals.length

    // Count users from rentals for this month (approximate - based on activity)
    const monthRentalIds = monthRentals.map(r => r.brandProfileId)
    const monthUsers = new Set(monthRentalIds).size

    return {
      month: monthName,
      revenue: monthRevenue,
      orders: monthOrders,
      users: monthUsers
    }
  })
}

// Helper: Fetch all period data (current, previous, all-time)
async function fetchPeriodData(
  ctx: QueryCtx,
  startDate: Date,
  prevPeriodStart: Date
): Promise<PeriodData> {
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

  // Fetch current period data - Get ALL for accurate totals
  // Note: Using .collect() is correct for analytics (can't show wrong revenue!)
  // Convex limit: 16MB ≈ 50k-100k records. Scale: migrate to write-time aggregation.
  const currentShelves = await ctx.db
    .query("shelves")
    .filter(q => q.gte(q.field("_creationTime"), startDate.getTime()))
    .collect()

  const currentRentals = await ctx.db
    .query("rentalRequests")
    .filter(q => q.gte(q.field("_creationTime"), startDate.getTime()))
    .collect()

  // Fetch previous period data
  const prevShelves = await ctx.db
    .query("shelves")
    .filter(q => q.and(
      q.gte(q.field("_creationTime"), prevPeriodStart.getTime()),
      q.lt(q.field("_creationTime"), startDate.getTime())
    ))
    .collect()

  const prevRentals = await ctx.db
    .query("rentalRequests")
    .filter(q => q.and(
      q.gte(q.field("_creationTime"), prevPeriodStart.getTime()),
      q.lt(q.field("_creationTime"), startDate.getTime())
    ))
    .collect()

  // Fetch all-time data (last 2 years)
  const allTimeShelves = await ctx.db
    .query("shelves")
    .filter(q => q.gte(q.field("_creationTime"), twoYearsAgo.getTime()))
    .collect()

  const allTimeRentals = await ctx.db
    .query("rentalRequests")
    .filter(q => q.gte(q.field("_creationTime"), twoYearsAgo.getTime()))
    .collect()

  return {
    currentShelves,
    currentRentals,
    prevShelves,
    prevRentals,
    allTimeShelves,
    allTimeRentals
  }
}

// Helper: Calculate user statistics
function calculateUserStats(
  currentShelves: Doc<"shelves">[],
  currentRentals: Doc<"rentalRequests">[],
  allTimeShelves: Doc<"shelves">[],
  allTimeRentals: Doc<"rentalRequests">[],
  prevShelves: Doc<"shelves">[],
  prevRentals: Doc<"rentalRequests">[]
): UserStats {
  // All-time user counts from shelves and rentals
  const uniqueStoreIds = new Set(allTimeShelves.map(s => s.storeProfileId))
  const uniqueBrandIds = new Set(allTimeRentals.map(r => r.brandProfileId))
  const storeOwnersCount = uniqueStoreIds.size
  const brandOwnersCount = uniqueBrandIds.size

  // Current period user counts
  const currentStoreIds = new Set(currentShelves.map(s => s.storeProfileId))
  const currentBrandIds = new Set(currentRentals.map(r => r.brandProfileId))
  const currentPeriodNewUsers = currentStoreIds.size + currentBrandIds.size

  // Previous period user counts
  const prevPeriodStoreIds = new Set(prevShelves.map(s => s.storeProfileId))
  const prevPeriodBrandIds = new Set(prevRentals.map(r => r.brandProfileId))
  const prevPeriodTotalUsers = prevPeriodStoreIds.size + prevPeriodBrandIds.size

  // Calculate percentage change
  const usersChange = prevPeriodTotalUsers > 0
    ? ((currentPeriodNewUsers - prevPeriodTotalUsers) / prevPeriodTotalUsers * 100)
    : (currentPeriodNewUsers > 0 ? 100 : 0)

  return {
    totalUsers: storeOwnersCount + brandOwnersCount,
    storeOwners: storeOwnersCount,
    brandOwners: brandOwnersCount,
    activeUsers: storeOwnersCount + brandOwnersCount,
    change: parseFloat(usersChange.toFixed(1)),
    newInPeriod: currentPeriodNewUsers
  }
}

// Helper: Calculate shelf statistics
function calculateShelfStats(
  currentShelves: Doc<"shelves">[],
  currentRentals: Doc<"rentalRequests">[],
  allTimeShelves: Doc<"shelves">[],
  prevShelves: Doc<"shelves">[]
): ShelfStats {
  // Get active rentals to determine which shelves are rented
  const activeRentals = currentRentals.filter(r => r.status === "active")
  const paymentPendingRentals = currentRentals.filter(r => r.status === "payment_pending")
  const allActiveRentals = [...activeRentals, ...paymentPendingRentals]
  const rentedShelfIds = new Set(allActiveRentals.map(r => r.shelfId))

  const availableShelves = currentShelves.filter(s => !rentedShelfIds.has(s._id) && s.status === "active")
  const approvedShelves = currentShelves.filter(s => s.status === "active")

  // Calculate percentage change
  const shelvesChange = prevShelves.length > 0
    ? ((currentShelves.length - prevShelves.length) / prevShelves.length * 100)
    : (currentShelves.length > 0 ? 100 : 0)

  return {
    total: allTimeShelves.length,
    available: availableShelves.length,
    approved: approvedShelves.length,
    change: parseFloat(shelvesChange.toFixed(1)),
    newInPeriod: currentShelves.length
  }
}

// Helper: Calculate rental statistics
function calculateRentalStats(
  currentRentals: Doc<"rentalRequests">[],
  allTimeRentals: Doc<"rentalRequests">[],
  prevRentals: Doc<"rentalRequests">[]
): RentalStats {
  const activeRentals = currentRentals.filter(r => r.status === "active")
  const pendingRequests = currentRentals.filter(r => r.status === "pending")

  // Calculate percentage change
  const rentalsChange = prevRentals.length > 0
    ? ((currentRentals.length - prevRentals.length) / prevRentals.length * 100)
    : (currentRentals.length > 0 ? 100 : 0)

  return {
    active: activeRentals.length,
    pending: pendingRequests.length,
    total: allTimeRentals.length,
    change: parseFloat(rentalsChange.toFixed(1)),
    newInPeriod: currentRentals.length
  }
}

// Helper: Calculate revenue statistics
async function calculateRevenueStats(
  ctx: QueryCtx,
  currentRentals: Doc<"rentalRequests">[],
  prevRentals: Doc<"rentalRequests">[]
): Promise<RevenueStats> {
  // Get platform commission rate
  const platformSettings = await ctx.db.query("platformSettings").collect()
  const storeRentCommission = platformSettings.find(s => s.key === "storeRentCommission")?.value || 10
  const platformCommissionRate = storeRentCommission / 100

  // Current period revenue
  const activeRentals = currentRentals.filter(r => r.status === "active")
  const periodRevenue = activeRentals.reduce((sum, rental) => sum + (rental.totalAmount || 0), 0)
  const periodPlatformFee = periodRevenue * platformCommissionRate

  // Previous period revenue
  const prevPeriodActiveRentals = prevRentals.filter(r => r.status === "active")
  const prevPeriodRevenue = prevPeriodActiveRentals.reduce((sum, r) => sum + (r.totalAmount || 0), 0)

  // Calculate percentage change
  const revenueChange = prevPeriodRevenue > 0
    ? ((periodRevenue - prevPeriodRevenue) / prevPeriodRevenue * 100)
    : (periodRevenue > 0 ? 100 : 0)

  return {
    totalRevenue: periodRevenue,
    platformFee: periodPlatformFee,
    netRevenue: periodRevenue - periodPlatformFee,
    change: parseFloat(revenueChange.toFixed(1)),
    allTimeTotal: periodRevenue
  }
}

// Helper: Calculate recent revenue (last 7 days)
function calculateRecentRevenue(
  activeRentals: Doc<"rentalRequests">[],
  now: Date
): DailyRevenue[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const recentRevenue: DailyRevenue[] = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dayName = days[date.getDay()]

    // Filter rentals for this day
    const dayRentals = activeRentals.filter(rental => {
      const rentalDate = new Date(rental._creationTime)
      return rentalDate.toDateString() === date.toDateString()
    })

    const dayRevenue = dayRentals.reduce((sum, r) => sum + (r.totalAmount || 0), 0)

    recentRevenue.push({
      day: dayName,
      value: dayRevenue
    })
  }

  return recentRevenue
}

// Helper: Get category distribution from products
async function getCategoryDistribution(ctx: QueryCtx, now: Date): Promise<CategoryData[]> {
  const allProducts = await ctx.db
    .query("products")
    .filter(q => q.gte(q.field("_creationTime"), new Date(now.getFullYear(), 0, 1).getTime()))
    .collect() // Get ALL products for accurate category stats

  const categoryCount: Record<string, number> = {}

  for (const product of allProducts) {
    const category = product.category || "Others"
    categoryCount[category] = (categoryCount[category] || 0) + 1
  }

  const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#6b7280", "#ef4444", "#06b6d4"]
  const categoryData = Object.entries(categoryCount)
    .map(([name, count], index) => ({
      name,
      value: count,
      color: colors[index % colors.length]
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5) // Top 5 categories

  return categoryData
}

// Helper: Get recent activities from rentals
function getRecentActivities(activeRentals: Doc<"rentalRequests">[]): RecentActivity[] {
  const recentActivities: RecentActivity[] = []

  // Add recent rentals
  const recentRentals = activeRentals
    .sort((a, b) => b._creationTime - a._creationTime)
    .slice(0, 2)

  for (const rental of recentRentals) {
    const timeDiff = Date.now() - new Date(rental._creationTime).getTime()
    const minutesAgo = Math.floor(timeDiff / (1000 * 60))
    const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60))
    const daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24))

    let timeString = "just now"
    if (daysAgo > 0) timeString = `${daysAgo} days ago`
    else if (hoursAgo > 0) timeString = `${hoursAgo} hours ago`
    else if (minutesAgo > 0) timeString = `${minutesAgo} minutes ago`

    recentActivities.push({
      id: rental._id,
      type: "new_rental",
      title: "New shelf rental",
      description: rental.selectedProducts && rental.selectedProducts.length > 0
        ? `Shelf rented for ${rental.selectedProducts[0].category}`
        : "Shelf rented",
      time: timeString,
      icon: "Package",
      color: "text-green-600"
    })
  }

  // Sort by time and take top 4
  recentActivities.sort((a, b) => {
    const getMinutes = (timeStr: string) => {
      if (timeStr === "just now") return 0
      const num = parseInt(timeStr.split(" ")[0])
      if (timeStr.includes("minute")) return num
      if (timeStr.includes("hour")) return num * 60
      if (timeStr.includes("day")) return num * 60 * 24
      return 999999
    }
    return getMinutes(a.time) - getMinutes(b.time)
  })

  return recentActivities.slice(0, 4)
}

// Get chart data for admin dashboard (independent of time period filter)
export const getAdminChartData = query({
  args: {},
  handler: async (ctx) => {
    // Verify admin access
    const auth = await verifyAdminAccess(ctx)
    if (!auth.isAuthenticated || !auth.isAdmin) {
      // Return empty chart data when not authenticated or not admin
      return {
        revenueByMonth: [],
        topStores: []
      }
    }

    const now = new Date()
    const currentYear = now.getFullYear()

    // Load data for the CURRENT YEAR ONLY for charts (Jan 1 to now)
    const startOfYear = new Date(currentYear, 0, 1).getTime()

    const rentalRequests = await ctx.db
      .query("rentalRequests")
      .filter(q => q.gte(q.field("_creationTime"), startOfYear))
      .collect() // Get ALL for accurate chart data

    const activeRentals = rentalRequests.filter(r => r.status === "active")

    // Calculate monthly revenue data for chart (current year - Jan to Dec)
    const revenueByMonth = calculateMonthlyRevenue(activeRentals)

    // Skip top brands calculation - requires loading profiles which exceed memory limit
    // Return empty array for now
    const topStores: TopStore[] = []

    return {
      revenueByMonth,
      topStores
    }
  },
})

export const getAdminStats = query({
  args: {
    timePeriod: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("yearly"))),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const auth = await verifyAdminAccess(ctx)
    if (!auth.isAuthenticated || !auth.isAdmin) {
      // Return empty stats when not authenticated or not admin
      return {
        users: {
          totalUsers: 0,
          storeOwners: 0,
          brandOwners: 0,
          activeUsers: 0,
          change: 0,
          newInPeriod: 0
        },
        shelves: {
          total: 0,
          available: 0,
          approved: 0,
          change: 0,
          newInPeriod: 0
        },
        rentals: {
          active: 0,
          pending: 0,
          total: 0,
          change: 0,
          newInPeriod: 0
        },
        revenue: {
          totalRevenue: 0,
          platformFee: 0,
          netRevenue: 0,
          change: 0,
          allTimeTotal: 0
        },
        charts: {
          revenueByMonth: [],
          recentRevenue: [],
          categoryData: [],
          topStores: [],
          recentActivities: []
        }
      }
    }

    // Setup time period parameters
    const timePeriod = args.timePeriod || "monthly"
    const now = new Date()
    const { startDate } = getDateRange(now, timePeriod)
    const { startDate: prevPeriodStart } = getDateRange(startDate, timePeriod)

    // Fetch all period data (current, previous, all-time)
    const periodData = await fetchPeriodData(ctx, startDate, prevPeriodStart)

    // Calculate statistics using helper functions
    const users = calculateUserStats(
      periodData.currentShelves,
      periodData.currentRentals,
      periodData.allTimeShelves,
      periodData.allTimeRentals,
      periodData.prevShelves,
      periodData.prevRentals
    )

    const shelves = calculateShelfStats(
      periodData.currentShelves,
      periodData.currentRentals,
      periodData.allTimeShelves,
      periodData.prevShelves
    )

    const rentals = calculateRentalStats(
      periodData.currentRentals,
      periodData.allTimeRentals,
      periodData.prevRentals
    )

    const revenue = await calculateRevenueStats(
      ctx,
      periodData.currentRentals,
      periodData.prevRentals
    )

    // Generate chart data
    const activeRentals = periodData.currentRentals.filter(r => r.status === "active")
    const revenueByMonth = calculateMonthlyRevenue(activeRentals)
    const recentRevenue = calculateRecentRevenue(activeRentals, now)
    const categoryData = await getCategoryDistribution(ctx, now)
    const recentActivities = getRecentActivities(activeRentals)

    // Top stores placeholder (requires loading profiles which exceed memory limit)
    const topStores: TopStore[] = []

    return {
      users,
      shelves,
      rentals,
      revenue,
      charts: {
        revenueByMonth,
        recentRevenue,
        categoryData,
        topStores: topStores.slice(0, 5),
        recentActivities: recentActivities.slice(0, 4)
      }
    }
  },
})
