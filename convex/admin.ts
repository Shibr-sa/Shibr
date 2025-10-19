import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"
import { getUserProfile } from "./profileHelpers"
import { internal } from "./_generated/api"
import { getImageUrlsFromArray, getDateRange, requireAuthWithProfile } from "./helpers"

// Helper function to verify admin access without throwing errors
async function verifyAdminAccess(ctx: any) {
  const userId = await getAuthUserId(ctx)
  if (!userId) {
    return { isAuthenticated: false, isAdmin: false, userId: null }
  }

  const userProfile = await getUserProfile(ctx, userId)
  const isAdmin = userProfile?.type === "admin"

  return { isAuthenticated: true, isAdmin, userId }
}


// Get admin statistics (for admin dashboard)
// Get chart data for admin dashboard (independent of time period filter)
export const getAdminChartData = query({
  args: {},
  handler: async (ctx) => {
    // Verify admin access
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      // Return empty chart data when not authenticated
      return {
        usersData: [],
        rentalsData: [],
        revenueData: []
      }
    }

    const userProfile = await getUserProfile(ctx, userId)

    if (!userProfile || userProfile.type !== "admin") {
      // Return empty chart data for non-admin users
      return {
        usersData: [],
        rentalsData: [],
        revenueData: []
      }
    }

    const now = new Date()
    const currentYear = now.getFullYear()

    // Load data for the CURRENT YEAR ONLY for charts (Jan 1 to now)
    const startOfYear = new Date(currentYear, 0, 1).getTime()

    const rentalRequests = await ctx.db
      .query("rentalRequests")
      .filter(q => q.gte(q.field("_creationTime"), startOfYear))
      .collect()

    const activeRentals = rentalRequests.filter(r => r.status === "active")

    // Calculate monthly revenue data for chart (current year - Jan to Dec)
    const revenueByMonth = []
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthName = monthNames[monthIndex]

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

      revenueByMonth.push({
        month: monthName,
        revenue: monthRevenue,
        orders: monthOrders,
        users: monthUsers
      })
    }

    // Skip top brands calculation - requires loading profiles which exceed memory limit
    // Return empty array for now
    const topStores: any[] = []

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
        totalUsers: 0,
        totalShelves: 0,
        totalRentals: 0,
        totalRevenue: 0,
        changePercentages: {
          users: 0,
          shelves: 0,
          rentals: 0,
          revenue: 0
        },
        recentActivities: []
      }
    }

    const timePeriod = args.timePeriod || "monthly"
    const now = new Date()

    // Calculate period start dates based on timePeriod
    // "yearly" = from Jan 1 of current year
    // "monthly" = from 1st of current month
    // "weekly" = from start of current week
    // "daily" = from start of today
    const { startDate } = getDateRange(now, timePeriod)
    const { startDate: previousStart } = getDateRange(startDate, timePeriod)

    // Convex Best Practice: Filter by date at query level
    // Load ONLY data for the CURRENT selected period (this year/month/week/day)

    const allShelves = await ctx.db
      .query("shelves")
      .filter(q => q.gte(q.field("_creationTime"), startDate.getTime()))
      .collect()

    const rentalRequests = await ctx.db
      .query("rentalRequests")
      .filter(q => q.gte(q.field("_creationTime"), startDate.getTime()))
      .collect()

    const activeRentals = rentalRequests.filter(r => r.status === "active")
    const paymentPendingRentals = rentalRequests.filter(r => r.status === "payment_pending")
    const allActiveRentals = [...activeRentals, ...paymentPendingRentals]
    const rentedShelfIds = new Set(allActiveRentals.map(r => r.shelfId))
    const pendingRequests = rentalRequests.filter(r => r.status === "pending")

    const availableShelves = allShelves.filter(s => !rentedShelfIds.has(s._id) && s.status === "active")
    const approvedShelves = allShelves.filter(s => s.status === "active")

    // For all-time user counts, we need to query ALL shelves and rentals (not just period)
    // But filter by a reasonable timeframe to avoid 16MB limit (e.g., last 2 years)
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

    const allTimeShelves = await ctx.db
      .query("shelves")
      .filter(q => q.gte(q.field("_creationTime"), twoYearsAgo.getTime()))
      .collect()

    const allTimeRentals = await ctx.db
      .query("rentalRequests")
      .filter(q => q.gte(q.field("_creationTime"), twoYearsAgo.getTime()))
      .collect()

    // Infer all-time user counts from shelves and rentals (don't load profiles)
    const uniqueStoreIds = new Set(allTimeShelves.map(s => s.storeProfileId))
    const uniqueBrandIds = new Set(allTimeRentals.map(r => r.brandProfileId))
    const storeOwnersCount = uniqueStoreIds.size
    const brandOwnersCount = uniqueBrandIds.size

    // allShelves and rentalRequests are already filtered by current period (startDate)
    // So no need to filter again - they ARE the filtered data
    const filteredShelves = allShelves
    const filteredAvailableShelves = availableShelves
    const filteredApprovedShelves = approvedShelves
    const filteredRentalRequests = rentalRequests
    const filteredActiveRentals = activeRentals
    const filteredPendingRequests = pendingRequests

    // User counts for current period (from period-filtered data)
    const filteredStoreIds = new Set(allShelves.map(s => s.storeProfileId))
    const filteredBrandIds = new Set(rentalRequests.map(r => r.brandProfileId))
    const filteredStoreOwnersCount = filteredStoreIds.size
    const filteredBrandOwnersCount = filteredBrandIds.size

    // Get platform settings for commission
    const platformSettings = await ctx.db.query("platformSettings").take(100)
    const storeRentCommission = platformSettings.find(s => s.key === "storeRentCommission")?.value || 10
    const platformCommissionRate = storeRentCommission / 100

    // Calculate revenue for the selected period
    const periodRevenue = filteredActiveRentals.reduce((sum, rental) => sum + (rental.totalAmount || 0), 0)
    const periodPlatformFee = periodRevenue * platformCommissionRate

    // Calculate total revenue (all time) for comparison
    const totalRevenue = activeRentals.reduce((sum, rental) => sum + (rental.totalAmount || 0), 0)
    const platformFee = totalRevenue * platformCommissionRate

    // Calculate monthly revenue data for chart (current year - Jan to Dec)
    const revenueByMonth = []
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentYear = now.getFullYear()

    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthName = monthNames[monthIndex]

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

      revenueByMonth.push({
        month: monthName,
        revenue: monthRevenue,
        orders: monthOrders,
        users: monthUsers
      })
    }

    // Skip top brands calculation - requires loading profiles which exceed memory limit
    // Return empty array for now
    const topStores: any[] = []

    // Calculate recent revenue (last 7 days)
    const recentRevenue = []
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
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
        value: dayRevenue // Use actual revenue only
      })
    }

    // Category distribution from products created this year
    const allProducts = await ctx.db
      .query("products")
      .filter(q => q.gte(q.field("_creationTime"), new Date(now.getFullYear(), 0, 1).getTime()))
      .collect()
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

    // Get recent activities
    const recentActivities = []

    // Skip user registrations - can't load profiles due to binary data
    // Only show rental activities

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

    // Query PREVIOUS period data for calculating percentage changes
    const { startDate: prevPeriodStart } = getDateRange(startDate, timePeriod)

    const prevPeriodShelves = await ctx.db
      .query("shelves")
      .filter(q => q.and(
        q.gte(q.field("_creationTime"), prevPeriodStart.getTime()),
        q.lt(q.field("_creationTime"), startDate.getTime())
      ))
      .collect()

    const prevPeriodRentals = await ctx.db
      .query("rentalRequests")
      .filter(q => q.and(
        q.gte(q.field("_creationTime"), prevPeriodStart.getTime()),
        q.lt(q.field("_creationTime"), startDate.getTime())
      ))
      .collect()

    // Estimate user count from activity in previous period
    const prevPeriodStoreIds = new Set(prevPeriodShelves.map(s => s.storeProfileId))
    const prevPeriodBrandIds = new Set(prevPeriodRentals.map(r => r.brandProfileId))
    const prevPeriodTotalUsers = prevPeriodStoreIds.size + prevPeriodBrandIds.size

    // Calculate previous period revenue from queried rentals
    const prevPeriodActiveRentals = prevPeriodRentals.filter(r => r.status === "active")
    const prevPeriodRevenue = prevPeriodActiveRentals.reduce((sum, r) => sum + (r.totalAmount || 0), 0)

    // Current period NEW additions (for calculating changes)
    const currentPeriodNewUsers = filteredStoreOwnersCount + filteredBrandOwnersCount
    const currentPeriodNewShelves = filteredShelves.length
    const currentPeriodNewRentals = filteredRentalRequests.length

    // Total cumulative counts (from all-time data, not just period)
    const totalUsers = storeOwnersCount + brandOwnersCount
    const totalShelves = allTimeShelves.length
    const totalRentalsCount = allTimeRentals.length

    // Calculate percentage changes - comparing NEW additions period to period
    const usersChange = prevPeriodTotalUsers > 0 ?
      ((currentPeriodNewUsers - prevPeriodTotalUsers) / prevPeriodTotalUsers * 100) :
      (currentPeriodNewUsers > 0 ? 100 : 0)

    const shelvesChange = prevPeriodShelves.length > 0 ?
      ((currentPeriodNewShelves - prevPeriodShelves.length) / prevPeriodShelves.length * 100) :
      (currentPeriodNewShelves > 0 ? 100 : 0)

    const rentalsChange = prevPeriodRentals.length > 0 ?
      ((currentPeriodNewRentals - prevPeriodRentals.length) / prevPeriodRentals.length * 100) :
      (currentPeriodNewRentals > 0 ? 100 : 0)

    // For revenue, compare period revenues
    const revenueChange = prevPeriodRevenue > 0 ?
      ((periodRevenue - prevPeriodRevenue) / prevPeriodRevenue * 100) :
      (periodRevenue > 0 ? 100 : 0)

    return {
      users: {
        totalUsers: totalUsers, // Estimated from activity
        storeOwners: storeOwnersCount, // Estimated from shelves
        brandOwners: brandOwnersCount, // Estimated from rentals
        activeUsers: totalUsers, // Assume all active (can't check isActive without loading profiles)
        change: parseFloat(usersChange.toFixed(1)),
        newInPeriod: currentPeriodNewUsers, // New additions in current period
      },
      shelves: {
        total: totalShelves, // Show cumulative total
        available: availableShelves.length, // Cumulative
        approved: approvedShelves.length, // Cumulative
        change: parseFloat(shelvesChange.toFixed(1)),
        newInPeriod: currentPeriodNewShelves, // New additions in current period
      },
      rentals: {
        active: activeRentals.length, // Cumulative
        pending: pendingRequests.length, // Cumulative
        total: totalRentalsCount, // Show cumulative total
        change: parseFloat(rentalsChange.toFixed(1)),
        newInPeriod: currentPeriodNewRentals, // New additions in current period
      },
      revenue: {
        totalRevenue: periodRevenue, // Revenue for selected period
        platformFee: periodPlatformFee,
        netRevenue: periodRevenue - periodPlatformFee,
        change: parseFloat(revenueChange.toFixed(1)),
        allTimeTotal: totalRevenue,
      },
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


// Update platform settings (admin only)
export const updatePlatformSettings = mutation({
  args: {
    brandSalesCommission: v.optional(v.number()),
    storeRentCommission: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const { profileData: userProfile } = await requireAuthWithProfile(ctx)

    if (userProfile.type !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    // Validate commission percentages
    if (args.brandSalesCommission !== undefined && (args.brandSalesCommission < 0 || args.brandSalesCommission > 100)) {
      throw new Error("Brand sales commission must be between 0 and 100")
    }
    if (args.storeRentCommission !== undefined && (args.storeRentCommission < 0 || args.storeRentCommission > 100)) {
      throw new Error("Store rent commission must be between 0 and 100")
    }

    const settings = args

    // Update or create brand sales commission setting
    if (settings.brandSalesCommission !== undefined) {
      const key = "brandSalesCommission"
      const existingSetting = await ctx.db.query("platformSettings").withIndex("by_key", q => q.eq("key", key)).first()

      if (existingSetting) {
        await ctx.db.patch(existingSetting._id, {
          value: settings.brandSalesCommission,
          updatedByAdminId: userProfile.profile._id as Id<"adminProfiles">,
          updatedAt: Date.now(),
        })
      } else {
        await ctx.db.insert("platformSettings", {
          key: key,
          value: settings.brandSalesCommission,
          description: "Brand sales commission percentage",
          updatedByAdminId: userProfile.profile._id as Id<"adminProfiles">,
          updatedAt: Date.now(),
        })
      }
    }

    // Update or create store rent commission setting
    if (settings.storeRentCommission !== undefined) {
      const key = "storeRentCommission"
      const existingSetting = await ctx.db.query("platformSettings").withIndex("by_key", q => q.eq("key", key)).first()

      if (existingSetting) {
        await ctx.db.patch(existingSetting._id, {
          value: settings.storeRentCommission,
          updatedByAdminId: userProfile.profile._id as Id<"adminProfiles">,
          updatedAt: Date.now(),
        })
      } else {
        await ctx.db.insert("platformSettings", {
          key: key,
          value: settings.storeRentCommission,
          description: "Store rent commission percentage",
          updatedByAdminId: userProfile.profile._id as Id<"adminProfiles">,
          updatedAt: Date.now(),
        })
      }
    }

    return { success: true, message: "Platform settings updated" }
  },
})

// Toggle user active status (admin only)
export const toggleUserStatus = mutation({
  args: {
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const { userId, profileData: adminProfile } = await requireAuthWithProfile(ctx)

    if (adminProfile.type !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    // Prevent admin from deactivating themselves
    if (userId === args.targetUserId) {
      throw new Error("Cannot deactivate your own admin account")
    }

    const targetUser = await ctx.db.get(args.targetUserId)
    if (!targetUser) {
      throw new Error("User not found")
    }

    // Check for profile in different tables
    const targetProfile = await getUserProfile(ctx, args.targetUserId)

    if (!targetProfile) {
      throw new Error("User profile not found")
    }

    // Toggle active status based on profile type
    const newStatus = !targetProfile.profile.isActive
    await ctx.db.patch(targetProfile.profile._id, {
      isActive: newStatus,
    })

    return {
      success: true,
      message: `User ${newStatus ? "activated" : "deactivated"} successfully`,
      newStatus
    }
  },
})

// Get all stores (store owners) with their stats for admin dashboard
export const getStores = query({
  args: {
    searchQuery: v.optional(v.string()),
    page: v.number(),
    limit: v.number(),
    timePeriod: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("yearly"))),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const auth = await verifyAdminAccess(ctx)
    if (!auth.isAuthenticated || !auth.isAdmin) {
      // Return empty results when not authenticated or not admin
      return {
        items: [],
        total: 0,
        pages: 0,
        currentPage: args.page
      }
    }

    const { searchQuery = "", page, limit, timePeriod = "monthly" } = args;

    // Get all store owners with limit
    const allStoreProfiles = await ctx.db
      .query("storeProfiles")
      .take(500); // Reasonable limit

    // Get emails from users table for search
    const allStoreOwners = await Promise.all(
      allStoreProfiles.map(async (profile) => {
        const authUser = await ctx.db.get(profile.userId)
        return {
          ...profile,
          email: authUser?.email
        }
      })
    )

    // Filter by search query
    const filteredStoreOwners = searchQuery
      ? allStoreOwners.filter(store =>
        store.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : allStoreOwners;

    // Get shelves for each store owner
    const storesWithStats = await Promise.all(
      filteredStoreOwners.map(async (store) => {
        // Use the store directly as it's already the profile
        const shelves = await ctx.db
          .query("shelves")
          .filter(q => q.eq(q.field("storeProfileId"), store._id))
          .take(100); // Strict limit per Convex best practices

        const approvedShelves = shelves.filter(s => s.status === "active").length;
        const totalShelves = shelves.length;

        // Get rental requests for this store
        const rentals = await ctx.db
          .query("rentalRequests")
          .filter(q => q.eq(q.field("storeProfileId"), store._id))
          .take(100); // Strict limit per Convex best practices

        const activeRentals = rentals.filter(r => r.status === "active").length;
        const totalRevenue = rentals
          .filter(r => r.status === "active")
          .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

        // Get user from users table for name, phone, and image
        const user = await ctx.db.get(store.userId)

        // Profile image is now stored in users.image field as URL string
        const profileImageUrl = user?.image || null;

        // Convert commercial register document storage ID to URL if exists
        let businessRegistrationUrl = null;
        if (store.commercialRegisterDocument) {
          businessRegistrationUrl = await ctx.storage.getUrl(store.commercialRegisterDocument);
        }

        return {
          id: store._id,
          name: store.storeName || user?.name,
          email: store.email,
          phoneNumber: user?.phone,
          shelves: totalShelves,
          approvedShelves,
          rentedShelves: activeRentals, // Add this for consistency
          rentals: activeRentals,
          revenue: totalRevenue,
          status: store.isActive ? "active" : "suspended",
          joinDate: store._creationTime,
          businessRegistration: store.commercialRegisterNumber,
          businessRegistrationUrl, // Now returns actual URL
          profileImageUrl, // Include the profile image URL
          fullName: user?.name,
          storeName: store.storeName,
          businessCategory: store.businessCategory,
          // Location is now per shelf, not per store
        };
      })
    );

    // Sort by creation date (newest first)
    storesWithStats.sort((a, b) =>
      new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()
    );

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedStores = storesWithStats.slice(startIndex, endIndex);

    // Calculate percentage changes based on timePeriod
    const now = new Date();
    const { startDate: periodStart } = getDateRange(now, timePeriod);
    const { startDate: previousStart } = getDateRange(periodStart, timePeriod);

    // Filter stores created in current period
    const storesInPeriod = storesWithStats.filter(store => {
      const joinDate = new Date(store.joinDate);
      return joinDate >= periodStart;
    });

    // Filter stores created in previous period
    const storesInPreviousPeriod = storesWithStats.filter(store => {
      const joinDate = new Date(store.joinDate);
      return joinDate >= previousStart && joinDate < periodStart;
    });

    // Get total cumulative counts up to end of previous period
    const storesUpToPreviousPeriod = storesWithStats.filter(store => {
      const joinDate = new Date(store.joinDate);
      return joinDate < periodStart;
    });

    // Calculate shelves for current and previous periods
    const allShelves = await ctx.db.query("shelves").take(500); // Strict limit per Convex best practices

    const shelvesInPeriod = allShelves.filter(s => {
      const createdDate = new Date(s._creationTime);
      return createdDate >= periodStart;
    });

    const shelvesUpToPreviousPeriod = allShelves.filter(s => {
      const createdDate = new Date(s._creationTime);
      return createdDate < periodStart;
    });

    // Calculate rentals and revenue for current and previous periods
    const allRentals = await ctx.db
      .query("rentalRequests")
      .filter(q => q.eq(q.field("status"), "active"))
      .take(500); // Strict limit per Convex best practices

    const rentalsInPeriod = allRentals.filter(r => {
      const createdDate = new Date(r._creationTime);
      return createdDate >= periodStart;
    });

    const rentalsUpToPreviousPeriod = allRentals.filter(r => {
      const createdDate = new Date(r._creationTime);
      return createdDate < periodStart;
    });

    // Calculate revenue from shelf rentals
    const revenueInPeriod = rentalsInPeriod.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const revenueInPreviousPeriod = allRentals.filter(r => {
      const createdDate = new Date(r._creationTime);
      return createdDate >= previousStart && createdDate < periodStart;
    }).reduce((sum, r) => sum + (r.totalAmount || 0), 0);

    // When showing stats for a period, show counts specific to that period
    // For "monthly", show stores added this month, for "yearly" show stores added this year, etc.
    const displayStores = storesInPeriod.length;
    const displayShelves = shelvesInPeriod.length;
    const displayRevenue = revenueInPeriod;

    // Calculate percentage changes
    // Compare current period count to previous period count
    const totalChange = storesInPreviousPeriod.length > 0
      ? Math.round(((storesInPeriod.length - storesInPreviousPeriod.length) / storesInPreviousPeriod.length) * 100 * 10) / 10
      : storesInPeriod.length > 0 ? 100 : 0;

    // For shelves: get shelves from previous period to compare
    const shelvesInPreviousPeriod = allShelves.filter(s => {
      const createdDate = new Date(s._creationTime);
      return createdDate >= previousStart && createdDate < periodStart;
    });

    const shelvesChange = shelvesInPreviousPeriod.length > 0
      ? Math.round(((shelvesInPeriod.length - shelvesInPreviousPeriod.length) / shelvesInPreviousPeriod.length) * 100 * 10) / 10
      : shelvesInPeriod.length > 0 ? 100 : 0;

    // Calculate revenue change percentage
    const revenueChange = revenueInPreviousPeriod > 0
      ? Math.round(((revenueInPeriod - revenueInPreviousPeriod) / revenueInPreviousPeriod) * 100 * 10) / 10
      : revenueInPeriod > 0 ? 100 : 0;

    return {
      items: paginatedStores,
      totalPages: Math.ceil(storesWithStats.length / limit),
      stats: {
        totalStores: displayStores, // Show period-specific count
        totalChange,
        activeStores: storesInPeriod.filter(s => s.status === "active").length,
        activeChange: 0, // Would need historical data to calculate
        suspendedStores: storesInPeriod.filter(s => s.status === "suspended").length,
        suspendedChange: 0, // Would need historical data to calculate
        totalShelves: displayShelves, // Show period-specific count
        shelvesChange,
        totalRevenue: displayRevenue, // Show revenue from shelf rentals
        revenueChange,
      },
    };
  },
});

// Get all brands (brand owners) with their stats for admin dashboard
export const getBrands = query({
  args: {
    searchQuery: v.optional(v.string()),
    page: v.number(),
    limit: v.number(),
    timePeriod: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("yearly"))),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      // Return empty results when not authenticated
      return {
        items: [],
        total: 0,
        pages: 0,
        currentPage: args.page
      }
    }

    const userProfile = await getUserProfile(ctx, userId)

    if (!userProfile || userProfile.type !== "admin") {
      // Return empty results for non-admin users
      return {
        items: [],
        total: 0,
        pages: 0,
        currentPage: args.page
      }
    }

    const { searchQuery = "", page, limit, timePeriod = "monthly" } = args;

    // Get all brand owners with limit
    const allBrandProfiles = await ctx.db
      .query("brandProfiles")
      .take(500); // Reasonable limit

    // BATCH FETCH 1: Get all users upfront (avoid N+1 queries)
    const userIds = [...new Set(allBrandProfiles.map(p => p.userId))];
    const users = await Promise.all(userIds.map(id => ctx.db.get(id)));
    const userMap = new Map(users.filter(u => u !== null).map(u => [u!._id.toString(), u!]));

    // BATCH FETCH 2: Get all products upfront (avoid N+1 queries)
    const allProducts = await ctx.db
      .query("products")
      .take(5000); // Limit total products

    // Group products by brand
    const productsByBrand = new Map<string, typeof allProducts>();
    for (const product of allProducts) {
      const brandId = product.brandProfileId.toString();
      const existing = productsByBrand.get(brandId) || [];
      existing.push(product);
      productsByBrand.set(brandId, existing);
    }

    // BATCH FETCH 3: Get all rentals upfront (avoid N+1 queries)
    const allRentals = await ctx.db
      .query("rentalRequests")
      .take(5000); // Limit total rentals

    // Group rentals by brand
    const rentalsByBrand = new Map<string, typeof allRentals>();
    for (const rental of allRentals) {
      const brandId = rental.brandProfileId.toString();
      const existing = rentalsByBrand.get(brandId) || [];
      existing.push(rental);
      rentalsByBrand.set(brandId, existing);
    }

    // Build brand owners with user data
    const allBrandOwners = allBrandProfiles.map(profile => {
      const user = userMap.get(profile.userId.toString());
      return {
        ...profile,
        email: user?.email
      };
    });

    // Filter by search query
    const filteredBrandOwners = searchQuery
      ? allBrandOwners.filter(brand =>
        brand.brandName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : allBrandOwners;

    // Get stats for each brand owner (using batched data - NO queries in loop!)
    const brandsWithStats = await Promise.all(
      filteredBrandOwners.map(async (brand) => {
        // Use pre-fetched products (O(1) map lookup)
        const products = productsByBrand.get(brand._id.toString()) || [];
        const totalProducts = products.length;
        const totalProductRevenue = products.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);

        // Use pre-fetched rentals (O(1) map lookup)
        const rentals = rentalsByBrand.get(brand._id.toString()) || [];
        const activeRentals = rentals.filter(r => r.status === "active").length;

        // Get unique stores this brand is working with
        const uniqueStoreIds = new Set(rentals.map(r => r.storeProfileId));
        const storesCount = uniqueStoreIds.size;

        // Use pre-fetched user (O(1) map lookup)
        const user = userMap.get(brand.userId.toString());

        // Profile image is now stored in users.image field as URL string
        const profileImageUrl = user?.image || null;

        // Convert business registration document storage ID to URL
        let businessRegistrationUrl = null;
        const docId = brand.commercialRegisterDocument || brand.freelanceLicenseDocument;
        if (docId) {
          businessRegistrationUrl = await ctx.storage.getUrl(docId);
        }

        return {
          id: brand._id,
          name: brand.brandName,  // Use brand name only
          ownerName: user?.name,  // Add actual owner name from users table
          email: brand.email,
          phoneNumber: user?.phone,
          products: totalProducts,
          stores: storesCount,
          rentals: activeRentals,
          revenue: totalProductRevenue, // Only product sales revenue, not rental costs
          status: brand.isActive ? "active" : "suspended",
          category: brand.businessCategory,
          website: brand.website,  // Now available in schema
          joinDate: brand._creationTime,
          businessRegistration: brand.commercialRegisterNumber || brand.freelanceLicenseNumber,
          businessRegistrationUrl,  // Use converted URL
          profileImageUrl, // Include the profile image URL
        };
      })
    );

    // Sort by creation date (newest first)
    brandsWithStats.sort((a, b) => {
      if (!a.joinDate || !b.joinDate) return 0;
      return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
    });

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBrands = brandsWithStats.slice(startIndex, endIndex);

    // Calculate percentage changes based on timePeriod
    const now = new Date();
    const { startDate: periodStart } = getDateRange(now, timePeriod);
    const { startDate: previousStart } = getDateRange(periodStart, timePeriod);

    // Filter brands created in current period
    const brandsInPeriod = brandsWithStats.filter(brand => {
      const joinDate = new Date(brand.joinDate);
      return joinDate >= periodStart;
    });

    // Filter brands created in previous period
    const brandsInPreviousPeriod = brandsWithStats.filter(brand => {
      const joinDate = new Date(brand.joinDate);
      return joinDate >= previousStart && joinDate < periodStart;
    });

    // Calculate products and revenue for current period brands
    const productsInPeriod = brandsInPeriod.reduce((sum, b) => sum + b.products, 0);
    const revenueInPeriod = brandsInPeriod.reduce((sum, b) => sum + b.revenue, 0);

    // Calculate products and revenue for previous period brands
    const productsInPreviousPeriod = brandsInPreviousPeriod.reduce((sum, b) => sum + b.products, 0);
    const revenueInPreviousPeriod = brandsInPreviousPeriod.reduce((sum, b) => sum + b.revenue, 0);

    // Display period-specific counts
    const displayBrands = brandsInPeriod.length;
    const displayProducts = productsInPeriod;
    const displayRevenue = revenueInPeriod;

    // Calculate percentage changes
    const brandsChange = brandsInPreviousPeriod.length > 0
      ? Math.round(((brandsInPeriod.length - brandsInPreviousPeriod.length) / brandsInPreviousPeriod.length) * 100 * 10) / 10
      : brandsInPeriod.length > 0 ? 100 : 0;

    const productsChange = productsInPreviousPeriod > 0
      ? Math.round(((productsInPeriod - productsInPreviousPeriod) / productsInPreviousPeriod) * 100 * 10) / 10
      : productsInPeriod > 0 ? 100 : 0;

    const revenueChange = revenueInPreviousPeriod > 0
      ? Math.round(((revenueInPeriod - revenueInPreviousPeriod) / revenueInPreviousPeriod) * 100 * 10) / 10
      : revenueInPeriod > 0 ? 100 : 0;

    return {
      items: paginatedBrands,
      totalPages: Math.ceil(brandsWithStats.length / limit),
      stats: {
        totalBrands: displayBrands, // Show period-specific count
        brandsChange,
        totalProducts: displayProducts, // Show period-specific count
        productsChange,
        totalRevenue: displayRevenue, // Show period-specific revenue
        revenueChange,
      },
    };
  },
});

// Get all shelf posts with their details for admin dashboard
export const getPosts = query({
  args: {
    searchQuery: v.optional(v.string()),
    status: v.optional(v.string()),
    page: v.number(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const auth = await verifyAdminAccess(ctx)
    if (!auth.isAuthenticated || !auth.isAdmin) {
      // Return empty results when not authenticated or not admin
      return {
        items: [],
        total: 0,
        pages: 0,
        currentPage: args.page
      }
    }

    const { searchQuery = "", status = "all", page, limit } = args;

    // Get shelves with limit for performance
    let shelves = await ctx.db
      .query("shelves")
      .order("desc")
      .take(500); // Reasonable limit for admin

    // Filter by status
    const filteredByStatus = status === "all"
      ? shelves
      : shelves.filter(shelf => {
        if (status === "published") return shelf.status === "active";
        if (status === "approved") return shelf.status === "active";
        return false;
      });

    // Get owner details for each shelf
    const shelvesWithOwners = await Promise.all(
      filteredByStatus.map(async (shelf) => {
        const ownerProfile = await ctx.db.get(shelf.storeProfileId);
        if (!ownerProfile) return null;

        // Get branch data
        const branch = shelf.branchId ? await ctx.db.get(shelf.branchId) : null;
        if (!branch) return null;

        // Get the owner's email from users table
        const authUser = await ctx.db.get(ownerProfile.userId)

        // Get user from users table for name and phone
        const ownerUser = await ctx.db.get(ownerProfile.userId)

        return {
          id: shelf._id,
          storeId: shelf.storeProfileId, // Add storeId which is the profileId
          storeName: ownerProfile.storeName || ownerUser?.name,
          storeOwnerName: ownerUser?.name,
          storeOwnerEmail: authUser?.email || "",
          storeOwnerPhone: ownerUser?.phone,
          businessRegistration: ownerProfile.commercialRegisterNumber,
          storeBranch: branch.branchName,
          shelfName: shelf.shelfName,
          percentage: shelf.storeCommission ?? 0, // Store commission
          price: shelf.monthlyPrice,
          addedDate: shelf._creationTime,
          status: shelf.status === "active" ? "published" : shelf.status,
          city: branch.city,
          dimensions: `${shelf.shelfSize.width} × ${shelf.shelfSize.height} × ${shelf.shelfSize.depth} ${shelf.shelfSize.unit}`,
          productTypes: shelf.productTypes?.join(", "),
          description: shelf.description,
          availableFrom: shelf.availableFrom,
          images: shelf.images?.map(img => img.storageId) || [],
        };
      })
    );

    // Filter out null entries and apply search
    const validShelves = shelvesWithOwners.filter(Boolean) as NonNullable<typeof shelvesWithOwners[0]>[];

    const filteredShelves = searchQuery
      ? validShelves.filter(post =>
        post.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.shelfName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.storeBranch?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : validShelves;

    // Sort by date (newest first)
    filteredShelves.sort((a, b) =>
      new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
    );

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = filteredShelves.slice(startIndex, endIndex);

    return {
      items: paginatedPosts, // Changed from 'posts' to 'items' for consistency
      totalPages: Math.ceil(filteredShelves.length / limit),
    };
  },
});

// Get all payments/transactions for admin dashboard
export const getPayments = query({
  args: {
    searchQuery: v.optional(v.string()),
    status: v.optional(v.string()),
    page: v.number(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const auth = await verifyAdminAccess(ctx)
    if (!auth.isAuthenticated || !auth.isAdmin) {
      // Return empty results when not authenticated or not admin
      return {
        items: [],
        total: 0,
        pages: 0,
        currentPage: args.page
      }
    }

    const { searchQuery = "", status = "all", page, limit } = args;

    // Get payments from the payments table
    let payments = await ctx.db.query("payments").take(500) // Strict limit per Convex best practices

    // Filter by status if specified
    if (status !== "all") {
      payments = payments.filter(payment => {
        if (status === "paid") {
          return payment.status === "completed"
        } else if (status === "unpaid") {
          // "unpaid" filter no longer makes sense since payments are only created after success
          // Return payments that failed or were refunded
          return payment.status === "failed" || payment.status === "refunded"
        }
        return true
      })
    }

    // Get payment details with related information
    const paymentsWithDetails = await Promise.all(
      payments.map(async (payment) => {
        // Get rental request details
        const rental = await ctx.db.get(payment.rentalRequestId)
        if (!rental) return null

        // Get profiles
        const brandProfile = rental.brandProfileId ? await ctx.db.get(rental.brandProfileId) : null
        const storeProfile = rental.storeProfileId ? await ctx.db.get(rental.storeProfileId) : null

        if (!brandProfile || !storeProfile) return null

        // Get users
        const brandUser = await ctx.db.get(brandProfile.userId)
        const storeUser = await ctx.db.get(storeProfile.userId)

        // Get shelf
        const shelf = await ctx.db.get(rental.shelfId)
        if (!shelf) return null

        return {
          id: payment._id,
          transactionReference: payment.transactionReference,
          type: payment.type,
          merchant: brandUser?.name || brandProfile.brandName,
          merchantEmail: brandUser?.email,
          merchantProfileId: brandProfile._id,
          store: storeProfile.storeName || storeUser?.name || "",
          storeEmail: storeUser?.email || "",
          storeProfileId: storeProfile._id,
          shelfName: shelf.shelfName,
          date: payment.paymentDate,
          amount: payment.amount,
          platformFee: payment.platformFee || 0,
          netAmount: payment.netAmount || payment.amount,
          method: payment.paymentMethod || "card",
          status: payment.status === "completed" ? "paid" : "unpaid",
          paymentStatus: payment.status,
          transferStatus: payment.transferStatus || null,
          tapTransferId: payment.tapTransferId || null,
          startDate: rental.startDate,
          endDate: rental.endDate,
          description: payment.description || `Shelf rental payment from ${brandProfile.brandName} to شبر Platform`,
          toProfileId: payment.toProfileId,
        }
      })
    );

    // Filter out null entries
    const validPayments = paymentsWithDetails.filter(Boolean) as NonNullable<typeof paymentsWithDetails[0]>[];

    // Apply search filter
    const filteredPayments = searchQuery
      ? validPayments.filter(payment =>
        payment.store?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.transactionReference?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : validPayments;

    // Sort by date (newest first)
    filteredPayments.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

    // Calculate stats
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get all payments (not just filtered) for stats
    const allPaymentsWithDetails = paymentsWithDetails.filter(Boolean) as NonNullable<typeof paymentsWithDetails[0]>[];

    // Total received (all paid payments)
    const paidPayments = allPaymentsWithDetails.filter(p => p.status === "paid");
    const totalReceived = paidPayments.reduce((sum, p) => sum + p.amount, 0);

    // Current month payments
    const currentMonthPaymentsList = paidPayments.filter(p => {
      const paymentDate = new Date(p.date);
      return paymentDate >= currentMonth;
    });
    const currentMonthTotal = currentMonthPaymentsList.reduce((sum, p) => sum + p.amount, 0);

    // Previous month payments (for comparison)
    const previousMonthPaymentsList = paidPayments.filter(p => {
      const paymentDate = new Date(p.date);
      return paymentDate >= previousMonth && paymentDate <= previousMonthEnd;
    });
    const previousMonthTotal = previousMonthPaymentsList.reduce((sum, p) => sum + p.amount, 0);

    // Pending payments
    const pendingPaymentsList = allPaymentsWithDetails.filter(p => p.status === "unpaid");
    const pendingTotal = pendingPaymentsList.reduce((sum, p) => sum + p.amount, 0);

    // Previous month pending (for comparison)
    const previousPendingList = allPaymentsWithDetails.filter(p => {
      const paymentDate = new Date(p.date);
      return p.status === "unpaid" && paymentDate >= previousMonth && paymentDate <= previousMonthEnd;
    });
    const previousPendingTotal = previousPendingList.reduce((sum, p) => sum + p.amount, 0);

    // Total invoices issued
    const totalInvoices = allPaymentsWithDetails.length;
    const currentMonthInvoices = allPaymentsWithDetails.filter(p => {
      const paymentDate = new Date(p.date);
      return paymentDate >= currentMonth;
    }).length;
    const previousMonthInvoices = allPaymentsWithDetails.filter(p => {
      const paymentDate = new Date(p.date);
      return paymentDate >= previousMonth && paymentDate <= previousMonthEnd;
    }).length;

    // Calculate percentage changes
    const totalReceivedChange = previousMonthTotal > 0
      ? Math.round(((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 * 10) / 10
      : currentMonthTotal > 0 ? 100 : 0;

    const currentMonthChange = previousMonthTotal > 0
      ? Math.round(((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 * 10) / 10
      : currentMonthTotal > 0 ? 100 : 0;

    const pendingChange = previousPendingTotal > 0
      ? Math.round(((pendingTotal - previousPendingTotal) / previousPendingTotal) * 100 * 10) / 10
      : pendingTotal > 0 ? 100 : 0;

    const invoicesChange = previousMonthInvoices > 0
      ? Math.round(((currentMonthInvoices - previousMonthInvoices) / previousMonthInvoices) * 100 * 10) / 10
      : currentMonthInvoices > 0 ? 100 : 0;

    return {
      items: paginatedPayments,
      totalPages: Math.ceil(filteredPayments.length / limit),
      stats: {
        totalReceived,
        totalReceivedChange,
        currentMonthPayments: currentMonthTotal,
        currentMonthChange,
        pendingPayments: pendingTotal,
        pendingChange,
        invoicesIssued: totalInvoices,
        invoicesChange,
      },
    };
  },
});
// Get shelves for a specific store (admin store details page)
export const getRentalRequest = query({
  args: {
    shelfId: v.id("shelves"),
  },
  handler: async (ctx, args) => {
    // Find active rental request for this shelf
    const rentalRequest = await ctx.db
      .query("rentalRequests")
      .filter(q =>
        q.and(
          q.eq(q.field("shelfId"), args.shelfId),
          q.eq(q.field("status"), "active")
        )
      )
      .first()

    if (!rentalRequest) {
      return null
    }

    // Get the brand profile and user
    const requester = await ctx.db.get(rentalRequest.brandProfileId)
    const requesterUser = requester ? await ctx.db.get(requester.userId) : null

    return {
      ...rentalRequest,
      renterName: requester?.brandName || requesterUser?.name || "-",
      renterEmail: requesterUser?.email || "-",
      renterPhone: requesterUser?.phone || "-",
      commercialRegistry: requester?.commercialRegisterDocument || null,
    }
  }
})

export const getStoreShelves = query({
  args: {
    profileId: v.id("storeProfiles"),
    searchQuery: v.optional(v.string()),
    status: v.optional(v.string()),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const auth = await verifyAdminAccess(ctx)
    if (!auth.isAuthenticated || !auth.isAdmin) {
      // Return empty results when not authenticated or not admin
      return {
        items: [],
        total: 0,
        pages: 0,
        currentPage: args.page || 1
      }
    }

    const page = args.page || 1
    const limit = args.limit || 5
    const searchQuery = args.searchQuery?.toLowerCase() || ""
    const statusFilter = args.status || "all"

    let shelves = await ctx.db
      .query("shelves")
      .filter(q => q.eq(q.field("storeProfileId"), args.profileId))
      .take(100) // Strict limit per Convex best practices

    // Get branches for all shelves to enable search by branch name
    const shelvesWithBranches = await Promise.all(
      shelves.map(async (shelf) => {
        const branch = shelf.branchId ? await ctx.db.get(shelf.branchId) : null
        return { shelf, branch }
      })
    )

    // Apply search filter
    let filteredShelvesWithBranches = shelvesWithBranches
    if (searchQuery) {
      filteredShelvesWithBranches = shelvesWithBranches.filter(({ shelf, branch }) =>
        shelf.shelfName?.toLowerCase().includes(searchQuery) ||
        branch?.branchName?.toLowerCase().includes(searchQuery)
      )
    }

    // Extract shelves from filtered results
    shelves = filteredShelvesWithBranches.map(({ shelf }) => shelf)

    // Get active/payment_pending rentals to determine shelf availability
    const activeShelfRentals = await ctx.db
      .query("rentalRequests")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(500) // Strict limit per Convex best practices
    const paymentPendingShelfRentals = await ctx.db
      .query("rentalRequests")
      .withIndex("by_status", (q) => q.eq("status", "payment_pending"))
      .take(500) // Strict limit per Convex best practices
    const allActiveShelfRentals = [...activeShelfRentals, ...paymentPendingShelfRentals]
    const rentedShelfIds = new Set(allActiveShelfRentals.map(r => r.shelfId))

    // Apply status filter
    if (statusFilter !== "all") {
      shelves = shelves.filter(shelf => {
        const isRented = rentedShelfIds.has(shelf._id)
        const isAvailable = isRented ? "rented" : "available"
        return isAvailable === statusFilter
      })
    }

    // Convert storage IDs to URLs for images
    const shelvesWithUrls = await Promise.all(
      shelves.map(async (shelf) => {
        const imageUrls = await getImageUrlsFromArray(ctx, shelf.images)

        return {
          ...shelf,
          ...imageUrls
        }
      })
    )

    // Pagination
    const totalItems = shelvesWithUrls.length
    const totalPages = Math.ceil(totalItems / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedShelves = shelvesWithUrls.slice(startIndex, endIndex)

    return {
      items: paginatedShelves,
      totalItems,
      totalPages,
      currentPage: page,
    }
  },
})

// Get products for a specific brand (admin brand details page)
// Shows products that are currently being displayed on rented shelves
export const getBrandProducts = query({
  args: {
    profileId: v.id("brandProfiles"),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const auth = await verifyAdminAccess(ctx)
    if (!auth.isAuthenticated || !auth.isAdmin) {
      // Return empty array when not authenticated or not admin
      return []
    }

    // Get active rental requests for this brand
    const activeRentals = await ctx.db
      .query("rentalRequests")
      .filter(q => q.and(
        q.eq(q.field("brandProfileId"), args.profileId),
        q.eq(q.field("status"), "active")
      ))
      .take(100) // Strict limit per Convex best practices

    // Collect all products that are currently being displayed
    const productsWithRentalQuantities = []

    for (const rental of activeRentals) {
      if (rental.selectedProducts && rental.selectedProducts.length > 0) {
        for (const selectedProduct of rental.selectedProducts) {
          const productId = selectedProduct.productId
          const rentalQuantity = selectedProduct.quantity || 1

          const product = await ctx.db.get(productId)
          if (product) {
            // Get product image URL - check both mainImage (storage) and imageUrl (external)
            let imageUrl = null

            // Products use imageUrl directly (not storage ID)
            if (product && 'imageUrl' in product && product.imageUrl) {
              imageUrl = product.imageUrl
            }

            productsWithRentalQuantities.push({
              id: product._id,
              name: product && 'name' in product ? product.name : selectedProduct.name,
              category: product && 'category' in product ? product.category : selectedProduct.category,
              price: product && 'price' in product ? product.price : selectedProduct.price,
              quantity: rentalQuantity,  // Use rental request quantity, not total product quantity
              imageUrl,
              sku: product && 'sku' in product ? product.sku : '',
              salesCount: 0,  // Sales count not tracked yet
              createdAt: product._creationTime,
              rentalId: rental._id,  // Track which rental this product belongs to
              shelfId: rental.shelfId,  // Track which shelf this product is on
            })
          }
        }
      }
    }

    // Apply search filter if provided
    let filteredProducts = productsWithRentalQuantities
    if (args.searchQuery && args.searchQuery.trim()) {
      const search = args.searchQuery.toLowerCase()
      filteredProducts = productsWithRentalQuantities.filter(product =>
        product.name?.toLowerCase().includes(search) ||
        product.category?.toLowerCase().includes(search) ||
        product.sku?.toLowerCase().includes(search)
      )
    }

    return filteredProducts
  },
})

// Get rental requests for a specific brand (admin brand details page)
export const getBrandRentals = query({
  args: {
    profileId: v.id("brandProfiles"),
    searchQuery: v.optional(v.string()),
    statusFilter: v.optional(v.string()), // all, completed, needs_collection, upcoming
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const auth = await verifyAdminAccess(ctx)
    if (!auth.isAuthenticated || !auth.isAdmin) {
      // Return empty array when not authenticated or not admin
      return []
    }

    const rentals = await ctx.db
      .query("rentalRequests")
      .filter(q => q.eq(q.field("brandProfileId"), args.profileId))
      .take(100) // Strict limit per Convex best practices

    // Get additional details for each rental
    const rentalsWithDetails = await Promise.all(
      rentals.map(async (rental) => {
        const shelf = await ctx.db.get(rental.shelfId)
        const ownerProfile = await ctx.db.get(rental.storeProfileId)

        return {
          id: rental._id,
          shelfName: shelf?.shelfName || "-",
          storeName: ownerProfile?.storeName || "-",
          duration: `${Math.ceil((rental.endDate - rental.startDate) / (30 * 24 * 60 * 60 * 1000))} months`,
          payment: rental.totalAmount || 0,
          status: rental.status,
          createdAt: rental._creationTime,
          updatedAt: rental._creationTime,
        }
      })
    )

    // Apply search filter if provided
    let filteredRentals = rentalsWithDetails
    if (args.searchQuery && args.searchQuery.trim()) {
      const search = args.searchQuery.toLowerCase()
      filteredRentals = rentalsWithDetails.filter(rental =>
        rental.shelfName?.toLowerCase().includes(search) ||
        rental.storeName?.toLowerCase().includes(search)
      )
    }

    // Apply status filter if provided
    if (args.statusFilter && args.statusFilter !== "all") {
      const now = new Date()
      filteredRentals = filteredRentals.filter(rental => {
        if (args.statusFilter === "completed") {
          return rental.status === "completed"
        } else if (args.statusFilter === "needs_collection") {
          return rental.status === "active" || rental.status === "payment_pending"
        } else if (args.statusFilter === "upcoming") {
          // Parse createdAt date and check if it's in the future or recent
          const rentalDate = new Date(rental.createdAt)
          const daysDiff = Math.floor((rentalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          return rental.status === "pending" || rental.status === "payment_pending" || daysDiff > 0
        }
        return true
      })
    }

    return filteredRentals
  },
})

// Get rental requests for a specific store (admin store details page)
export const getStoreRentals = query({
  args: {
    profileId: v.id("storeProfiles"),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const auth = await verifyAdminAccess(ctx)
    if (!auth.isAuthenticated || !auth.isAdmin) {
      // Return empty array when not authenticated or not admin
      return []
    }

    const rentals = await ctx.db
      .query("rentalRequests")
      .filter(q => q.eq(q.field("storeProfileId"), args.profileId))
      .take(100) // Strict limit per Convex best practices

    // Get additional details for each rental
    const rentalsWithDetails = await Promise.all(
      rentals.map(async (rental) => {
        const shelf = rental.shelfId ? await ctx.db.get(rental.shelfId) : null
        const renterProfile = await ctx.db.get(rental.brandProfileId)
        const renter = renterProfile ? await ctx.db.get(renterProfile.userId) : null

        return {
          ...rental,
          shelfName: shelf?.shelfName || "",
          renterName: renterProfile?.brandName || "",
          duration: Math.ceil((rental.endDate - rental.startDate) / (30 * 24 * 60 * 60 * 1000)),
        }
      })
    )

    return rentalsWithDetails
  },
})

// Get monthly payment summary for a store (admin store details page)
export const getStorePayments = query({
  args: {
    profileId: v.id("storeProfiles"),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const auth = await verifyAdminAccess(ctx)
    if (!auth.isAuthenticated || !auth.isAdmin) {
      // Return empty array when not authenticated or not admin
      return []
    }

    const rentals = await ctx.db
      .query("rentalRequests")
      .filter(q => q.eq(q.field("storeProfileId"), args.profileId))
      .filter(q => q.eq(q.field("status"), "active"))
      .take(100) // Strict limit per Convex best practices

    // Group by month
    const paymentsByMonth: Record<string, {
      month: string,
      rentedShelves: number,
      totalIncome: number,
      paymentMethod: string,
      status: string
    }> = {}

    rentals.forEach(rental => {
      const date = new Date(rental._creationTime)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!paymentsByMonth[monthKey]) {
        paymentsByMonth[monthKey] = {
          month: monthKey,
          rentedShelves: 0,
          totalIncome: 0,
          paymentMethod: "Credit Card", // Default
          status: "completed"
        }
      }

      paymentsByMonth[monthKey].rentedShelves++
      paymentsByMonth[monthKey].totalIncome += rental.totalAmount || 0
    })

    // Convert to array and sort by month
    return Object.values(paymentsByMonth).sort((a, b) => a.month.localeCompare(b.month))
  },
});
