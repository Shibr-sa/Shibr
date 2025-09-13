import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"
import { getUserProfile } from "./profileHelpers"
import { getImageUrlsFromArray, getDateRange } from "./helpers"

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
    
    // Get all data for charts
    const storeOwners = await ctx.db
      .query("storeProfiles")
      .collect()

    const brandOwners = await ctx.db
      .query("brandProfiles")
      .collect()
    
    const rentalRequests = await ctx.db.query("rentalRequests").collect()
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
      
      // Count new users for this month
      const monthUsers = [...storeOwners, ...brandOwners].filter(user => {
        if (!user._creationTime) return false
        const userDate = new Date(user._creationTime)
        return userDate.getMonth() === monthIndex && 
               userDate.getFullYear() === currentYear
      }).length
      
      revenueByMonth.push({
        month: monthName,
        revenue: monthRevenue,
        orders: monthOrders,
        users: monthUsers
      })
    }

    // Get top performing brands (not stores)
    const topBrands = await Promise.all(
      brandOwners.slice(0, 10).map(async (brand) => {
        // Get products for this brand
        const products = await ctx.db
          .query("products")
          .filter(q => q.eq(q.field("brandProfileId"), brand._id))
          .collect();
        
        // Calculate total revenue from product sales
        const brandRevenue = products.reduce((sum, p) => sum + (p.totalRevenue || 0), 0)
        
        // Calculate growth (return 0 for now as we don't have historical data tracking)
        const growth = 0
        
        // Get the user from users table for name and image
        const user = await ctx.db.get(brand.userId)
        
        return {
          id: brand._id,
          name: brand.brandName || user?.name,
          revenue: brandRevenue, // Product sales revenue
          growth: parseFloat(growth.toFixed(1)),
          avatar: user?.image
        }
      })
    )

    // Sort by revenue and take top 5
    topBrands.sort((a, b) => b.revenue - a.revenue)
    const topStores = topBrands.slice(0, 5) // Keep variable name for now to avoid breaking frontend
    
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
    // Get counts for different user types
    const storeOwners = await ctx.db
      .query("storeProfiles")
      .collect()

    const brandOwners = await ctx.db
      .query("brandProfiles")
      .collect()

    // Get shelf statistics
    const allShelves = await ctx.db.query("shelves").collect()
    const availableShelves = allShelves.filter(s => s.isAvailable && s.status === "active")
    const approvedShelves = allShelves.filter(s => s.status === "active")

    // Get rental request statistics
    const rentalRequests = await ctx.db.query("rentalRequests").collect()
    const activeRentals = rentalRequests.filter(r => r.status === "active")
    const pendingRequests = rentalRequests.filter(r => r.status === "pending")

    // Filter data based on time period
    const now = new Date()
    const { startDate } = getDateRange(now, timePeriod)
    const { startDate: previousStart } = getDateRange(startDate, timePeriod)
    
    // Filter users by time period
    const filteredStoreOwners = storeOwners.filter(u => new Date(u._creationTime) >= startDate)
    const filteredBrandOwners = brandOwners.filter(u => new Date(u._creationTime) >= startDate)
    
    // Get users from previous period for comparison
    const previousStoreOwners = storeOwners.filter(u => new Date(u._creationTime) >= previousStart && new Date(u._creationTime) < startDate)
    const previousBrandOwners = brandOwners.filter(u => new Date(u._creationTime) >= previousStart && new Date(u._creationTime) < startDate)
    
    // Filter shelves by time period
    const filteredShelves = allShelves.filter(s => new Date(s._creationTime) >= startDate)
    const filteredAvailableShelves = availableShelves.filter(s => new Date(s._creationTime) >= startDate)
    const filteredApprovedShelves = approvedShelves.filter(s => new Date(s._creationTime) >= startDate)
    
    // Filter rental requests by time period
    const filteredRentalRequests = rentalRequests.filter(r => new Date(r._creationTime) >= startDate)
    const filteredActiveRentals = activeRentals.filter(r => new Date(r._creationTime) >= startDate)
    const filteredPendingRequests = pendingRequests.filter(r => new Date(r._creationTime) >= startDate)
    
    // Calculate revenue for the selected period
    const periodRevenue = filteredActiveRentals.reduce((sum, rental) => sum + (rental.totalAmount || 0), 0)
    const periodPlatformFee = periodRevenue * 0.08 // 8% platform fee
    
    // Calculate total revenue (all time) for comparison
    const totalRevenue = activeRentals.reduce((sum, rental) => sum + (rental.totalAmount || 0), 0)
    const platformFee = totalRevenue * 0.08 // 8% platform fee

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
      
      // Count new users for this month
      const monthUsers = [...storeOwners, ...brandOwners].filter(user => {
        if (!user._creationTime) return false
        const userDate = new Date(user._creationTime)
        return userDate.getMonth() === monthIndex && 
               userDate.getFullYear() === currentYear
      }).length
      
      revenueByMonth.push({
        month: monthName,
        revenue: monthRevenue,
        orders: monthOrders,
        users: monthUsers
      })
    }

    // Get top performing brands (not stores)
    const topBrands = await Promise.all(
      brandOwners.slice(0, 10).map(async (brand) => {
        // Get products for this brand
        const products = await ctx.db
          .query("products")
          .filter(q => q.eq(q.field("brandProfileId"), brand._id))
          .collect();
        
        // Calculate total revenue from product sales
        const brandRevenue = products.reduce((sum, p) => sum + (p.totalRevenue || 0), 0)
        
        // Calculate growth (return 0 for now as we don't have historical data tracking)
        const growth = 0
        
        // Get the user from users table for name and image
        const user = await ctx.db.get(brand.userId)
        
        return {
          id: brand._id,
          name: brand.brandName || user?.name,
          revenue: brandRevenue, // Product sales revenue
          growth: parseFloat(growth.toFixed(1)),
          avatar: user?.image
        }
      })
    )

    // Sort by revenue and take top 5
    topBrands.sort((a, b) => b.revenue - a.revenue)
    const topStores = topBrands.slice(0, 5) // Keep variable name for now to avoid breaking frontend

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

    // Category distribution from real products
    const allProducts = await ctx.db.query("products").collect()
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
    
    // Add recent user registrations
    const recentUsers = [...storeOwners, ...brandOwners]
      .filter(u => u._creationTime)
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 2)
    
    for (const user of recentUsers) {
      if (!user._creationTime) continue
      const timeDiff = Date.now() - new Date(user._creationTime).getTime()
      const minutesAgo = Math.floor(timeDiff / (1000 * 60))
      const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60))
      const daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
      
      let timeString = "just now"
      if (daysAgo > 0) timeString = `${daysAgo} days ago`
      else if (hoursAgo > 0) timeString = `${hoursAgo} hours ago`
      else if (minutesAgo > 0) timeString = `${minutesAgo} minutes ago`
      
      // Get the user from users table for name
      const userName = await ctx.db.get(user.userId)
      
      recentActivities.push({
        id: user._id,
        type: "storeName" in user ? "new_store" : "new_user",
        title: "storeName" in user ? "New store registered" : "New brand registered",
        description: `${"storeName" in user ? user.storeName : "brandName" in user ? user.brandName : userName?.name} joined the platform`,
        time: timeString,
        icon: "Store",
        color: "text-blue-600"
      })
    }
    
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

    // Calculate percentage changes based on previous period
    const { startDate: prevPeriodStart } = getDateRange(startDate, timePeriod)
    
    // Get counts for PREVIOUS period
    const prevPeriodStoreOwners = storeOwners.filter(u => {
      if (!u._creationTime) return false
      const date = new Date(u._creationTime)
      return date >= prevPeriodStart && date < startDate
    })
    const prevPeriodBrandOwners = brandOwners.filter(u => {
      if (!u._creationTime) return false
      const date = new Date(u._creationTime)
      return date >= prevPeriodStart && date < startDate
    })
    const prevPeriodTotalUsers = prevPeriodStoreOwners.length + prevPeriodBrandOwners.length
    
    const prevPeriodShelves = allShelves.filter(s => {
      const date = new Date(s._creationTime)
      return date >= prevPeriodStart && date < startDate
    })
    
    const prevPeriodRentals = rentalRequests.filter(r => {
      const date = new Date(r._creationTime)
      return date >= prevPeriodStart && date < startDate
    })
    
    const prevPeriodRevenue = activeRentals
      .filter(r => {
        const date = new Date(r._creationTime)
        return date >= prevPeriodStart && date < startDate
      })
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0)
    
    // Current period NEW additions (for calculating changes)
    const currentPeriodNewUsers = filteredStoreOwners.length + filteredBrandOwners.length
    const currentPeriodNewShelves = filteredShelves.length  
    const currentPeriodNewRentals = filteredRentalRequests.length
    
    // Total cumulative counts (all-time, not filtered by period)
    const totalUsers = storeOwners.length + brandOwners.length
    const totalShelves = allShelves.length
    const totalRentalsCount = rentalRequests.length
    
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
        totalUsers: totalUsers, // Show cumulative total
        storeOwners: storeOwners.length, // Cumulative
        brandOwners: brandOwners.length, // Cumulative
        activeUsers: [...storeOwners, ...brandOwners].filter(u => u.isActive).length,
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
    platformFeePercentage: v.optional(v.number()),
    minimumShelfPrice: v.optional(v.number()),
    maximumDiscountPercentage: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Not authenticated")
    }
    
    const userProfile = await getUserProfile(ctx, userId)
    
    if (!userProfile || userProfile.type !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    const settings = args

    // Update or create platform fee setting
    if (settings.platformFeePercentage !== undefined) {
      const feeKey = "platformFeePercentage"
      const existingFee = await ctx.db.query("platformSettings").withIndex("by_key", q => q.eq("key", feeKey)).first()
      
      if (existingFee) {
        await ctx.db.patch(existingFee._id, {
          value: settings.platformFeePercentage,
          updatedByAdminId: userProfile.profile._id as Id<"adminProfiles">,
          updatedAt: Date.now(),
        })
      } else {
        await ctx.db.insert("platformSettings", {
          key: feeKey,
          value: settings.platformFeePercentage,
          description: "Platform fee percentage",
          updatedByAdminId: userProfile.profile._id as Id<"adminProfiles">,
          updatedAt: Date.now(),
        })
      }
    }
    
    // Update or create minimum shelf price setting
    if (settings.minimumShelfPrice !== undefined) {
      const priceKey = "minimumShelfPrice"
      const existingPrice = await ctx.db.query("platformSettings").withIndex("by_key", q => q.eq("key", priceKey)).first()
      
      if (existingPrice) {
        await ctx.db.patch(existingPrice._id, {
          value: settings.minimumShelfPrice,
          updatedByAdminId: userProfile.profile._id as Id<"adminProfiles">,
          updatedAt: Date.now(),
        })
      } else {
        await ctx.db.insert("platformSettings", {
          key: priceKey,
          value: settings.minimumShelfPrice,
          description: "Minimum shelf price",
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
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Not authenticated")
    }
    
    const adminProfile = await getUserProfile(ctx, userId)
    
    if (!adminProfile || adminProfile.type !== "admin") {
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
          .collect();

        const approvedShelves = shelves.filter(s => s.status === "active").length;
        const totalShelves = shelves.length;

        // Get rental requests for this store
        const rentals = await ctx.db
          .query("rentalRequests")
          .filter(q => q.eq(q.field("storeProfileId"), store._id))
          .collect();

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
    const allShelves = await ctx.db.query("shelves").collect();
    
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
      .collect();
    
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

    // Get emails from users table for search
    const allBrandOwners = await Promise.all(
      allBrandProfiles.map(async (profile) => {
        const authUser = await ctx.db.get(profile.userId)
        return {
          ...profile,
          email: authUser?.email
        }
      })
    )

    // Filter by search query
    const filteredBrandOwners = searchQuery
      ? allBrandOwners.filter(brand =>
          brand.brandName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          brand.email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : allBrandOwners;

    // Get stats for each brand owner
    const brandsWithStats = await Promise.all(
      filteredBrandOwners.map(async (brand) => {
        // Get products for this brand
        const products = await ctx.db
          .query("products")
          .filter(q => q.eq(q.field("brandProfileId"), brand._id))
          .collect();

        const totalProducts = products.length;
        // Calculate product sales revenue (this would come from actual sales data)
        // For now, using totalRevenue field from products or a calculated value
        const totalProductRevenue = products.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);

        // Get rental requests for this brand (for counting active rentals, not for revenue)
        const rentals = await ctx.db
          .query("rentalRequests")
          .filter(q => q.eq(q.field("brandProfileId"), brand._id))
          .collect();

        const activeRentals = rentals.filter(r => r.status === "active").length;

        // Get unique stores this brand is working with
        const uniqueStoreIds = new Set(rentals.map(r => r.storeProfileId));
        const storesCount = uniqueStoreIds.size;

        // Get user from users table for name and phone
        const user = await ctx.db.get(brand.userId)
        
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
          storeBranch: shelf.storeBranch || shelf.city,
          shelfName: shelf.shelfName,
          percentage: shelf.storeCommission || 8, // Use store commission or default platform fee
          price: shelf.monthlyPrice,
          addedDate: shelf._creationTime,
          status: shelf.status === "active" ? "published" : shelf.status,
          city: shelf.city,
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
    let payments = await ctx.db.query("payments").collect()
    
    // Filter by status if specified
    if (status !== "all") {
      payments = payments.filter(payment => {
        if (status === "paid") {
          return payment.status === "completed"
        } else if (status === "unpaid") {
          return payment.status === "pending"
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
          invoiceNumber: payment.invoiceNumber,
          type: payment.type,
          merchant: brandUser?.name || brandProfile.brandName,
          merchantEmail: brandUser?.email,
          store: storeProfile.storeName || storeUser?.name || "",
          storeEmail: storeUser?.email || "",
          shelfName: shelf.shelfName,
          date: payment.paymentDate,
          amount: payment.amount,
          platformFee: payment.platformFee || 0,
          method: payment.paymentMethod || "bank_transfer",
          status: payment.status === "completed" ? "paid" : "unpaid",
          startDate: rental.startDate,
          endDate: rental.endDate,
          description: payment.description || `Shelf rental payment from ${brandProfile.brandName} to شبر Platform`,
          transactionReference: payment.transactionReference,
          dueDate: payment.dueDate,
        }
      })
    );

    // Filter out null entries
    const validPayments = paymentsWithDetails.filter(Boolean) as NonNullable<typeof paymentsWithDetails[0]>[];

    // Apply search filter
    const filteredPayments = searchQuery
      ? validPayments.filter(payment =>
          payment.store?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
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
      .collect()
    
    // Apply search filter
    if (searchQuery) {
      shelves = shelves.filter(shelf => 
        shelf.shelfName?.toLowerCase().includes(searchQuery) ||
        shelf.storeBranch?.toLowerCase().includes(searchQuery)
      )
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      shelves = shelves.filter(shelf => {
        const isAvailable = shelf.isAvailable ? "available" : "rented"
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
      .collect()
    
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
      .collect()
    
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
      .collect()
    
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
      .collect()
    
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
