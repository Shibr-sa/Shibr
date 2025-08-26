import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"

// Helper function to get date ranges based on time period
function getDateRange(endDate: Date, period: string): { startDate: Date; endDate: Date } {
  const startDate = new Date(endDate);
  
  switch (period) {
    case "daily":
      startDate.setDate(startDate.getDate() - 1);
      break;
    case "weekly":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "monthly":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "yearly":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
  }
  
  return { startDate, endDate: new Date(endDate) };
}

// Promote an existing user to admin
// This is safer as it works with existing authenticated users
export const promoteToAdmin = mutation({
  args: {
    email: v.string(),
    adminRole: v.optional(v.union(
      v.literal("super_admin"),
      v.literal("support"),
      v.literal("finance"),
      v.literal("operations")
    )),
  },
  handler: async (ctx, args) => {
    // Find the user by email in the users table
    const allUsers = await ctx.db.query("users").collect()
    const authUser = allUsers.find(user => user.email === args.email)
    
    if (!authUser) {
      throw new Error("User not found. User must sign up first.")
    }
    
    // Find the user profile using userId
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", authUser._id))
      .first()

    if (!userProfile) {
      throw new Error("User profile not found. User must sign up first.")
    }

    if (userProfile.accountType === "admin") {
      throw new Error("User is already an admin")
    }

    // Update the user profile to admin
    await ctx.db.patch(userProfile._id, {
      accountType: "admin",
      adminRole: args.adminRole || "super_admin",
      permissions: ["all"],
      isVerified: true,
      updatedAt: new Date().toISOString(),
    })

    return {
      success: true,
      message: `User ${args.email} has been promoted to admin with role: ${args.adminRole || "super_admin"}`,
      email: args.email,
      adminRole: args.adminRole || "super_admin",
    }
  },
})

// Create admin account - SIMPLIFIED APPROACH
// Step 1: Sign up normally at /signup (as store or brand owner)
// Step 2: Use promoteToAdmin mutation with the email
export const createAdminAccount = mutation({
  args: {
    email: v.string(),
    adminRole: v.optional(v.union(
      v.literal("super_admin"),
      v.literal("support"),
      v.literal("finance"),
      v.literal("operations")
    )),
  },
  handler: async (ctx, args) => {
    // This is just an alias for promoteToAdmin with clearer instructions
    // Find the user by email in the users table
    const allUsers = await ctx.db.query("users").collect()
    const authUser = allUsers.find(user => user.email === args.email)
    
    if (!authUser) {
      return {
        success: false,
        error: "User not found",
        instructions: [
          `No user found with email: ${args.email}`,
          `Please follow these steps:`,
          `1. Go to /signup and create an account with email: ${args.email}`,
          `2. Choose any account type (it will be converted to admin)`,
          `3. After signup, run this mutation again to promote to admin`,
        ]
      }
    }
    
    // Find the user profile using userId
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", authUser._id))
      .first()

    if (!userProfile) {
      return {
        success: false,
        error: "User profile not found",
        instructions: [
          `User found with email: ${args.email} but no profile exists`,
          `This is an unusual state. Please contact support.`,
        ]
      }
    }

    if (userProfile.accountType === "admin") {
      return {
        success: true,
        message: "User is already an admin",
        email: args.email,
        adminRole: userProfile.adminRole,
      }
    }

    // Update the user profile to admin
    await ctx.db.patch(userProfile._id, {
      accountType: "admin",
      adminRole: args.adminRole || "super_admin",
      permissions: ["all"],
      isVerified: true,
      updatedAt: new Date().toISOString(),
    })

    return {
      success: true,
      message: `User ${args.email} has been promoted to admin`,
      email: args.email,
      adminRole: args.adminRole || "super_admin",
      instructions: [
        `Admin account successfully created!`,
        `Email: ${args.email}`,
        `Role: ${args.adminRole || "super_admin"}`,
        `The user can now sign in at /signin and will be redirected to /admin-dashboard`,
      ]
    }
  },
})


// Get admin statistics (for admin dashboard)
// Get chart data for admin dashboard (independent of time period filter)
export const getAdminChartData = query({
  args: {},
  handler: async (ctx) => {
    // Verify admin access
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized: Authentication required")
    }
    
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()
    
    if (!userProfile || userProfile.accountType !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }
    
    const now = new Date()
    const currentYear = now.getFullYear()
    
    // Get all data for charts
    const storeOwners = await ctx.db
      .query("userProfiles")
      .filter((q) => q.eq(q.field("accountType"), "store_owner"))
      .collect()

    const brandOwners = await ctx.db
      .query("userProfiles")
      .filter((q) => q.eq(q.field("accountType"), "brand_owner"))
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
        const rentalDate = new Date(rental.createdAt)
        return rentalDate.getMonth() === monthIndex && 
               rentalDate.getFullYear() === currentYear
      })
      
      const monthRevenue = monthRentals.reduce((sum, r) => sum + (r.totalAmount || 0), 0)
      const monthOrders = monthRentals.length
      
      // Count new users for this month
      const monthUsers = [...storeOwners, ...brandOwners].filter(user => {
        if (!user.createdAt) return false
        const userDate = new Date(user.createdAt)
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
          .filter(q => q.eq(q.field("ownerId"), brand.userId))
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
          avatar: user?.image || "/api/placeholder/32/32"
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
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized: Authentication required")
    }
    
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()
    
    if (!userProfile || userProfile.accountType !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }
    
    const timePeriod = args.timePeriod || "monthly"
    // Get counts for different user types
    const storeOwners = await ctx.db
      .query("userProfiles")
      .filter((q) => q.eq(q.field("accountType"), "store_owner"))
      .collect()

    const brandOwners = await ctx.db
      .query("userProfiles")
      .filter((q) => q.eq(q.field("accountType"), "brand_owner"))
      .collect()

    // Get shelf statistics
    const allShelves = await ctx.db.query("shelves").collect()
    const availableShelves = allShelves.filter(s => s.isAvailable && s.status === "approved")
    const approvedShelves = allShelves.filter(s => s.status === "approved")
    const pendingShelves = allShelves.filter(s => s.status === "pending_approval")

    // Get rental request statistics
    const rentalRequests = await ctx.db.query("rentalRequests").collect()
    const activeRentals = rentalRequests.filter(r => r.status === "active")
    const pendingRequests = rentalRequests.filter(r => r.status === "pending")

    // Filter data based on time period
    const now = new Date()
    const { startDate } = getDateRange(now, timePeriod)
    const { startDate: previousStart } = getDateRange(startDate, timePeriod)
    
    // Filter users by time period
    const filteredStoreOwners = storeOwners.filter(u => u.createdAt && new Date(u.createdAt) >= startDate)
    const filteredBrandOwners = brandOwners.filter(u => u.createdAt && new Date(u.createdAt) >= startDate)
    
    // Get users from previous period for comparison
    const previousStoreOwners = storeOwners.filter(u => u.createdAt && new Date(u.createdAt) >= previousStart && new Date(u.createdAt) < startDate)
    const previousBrandOwners = brandOwners.filter(u => u.createdAt && new Date(u.createdAt) >= previousStart && new Date(u.createdAt) < startDate)
    
    // Filter shelves by time period
    const filteredShelves = allShelves.filter(s => new Date(s.createdAt) >= startDate)
    const filteredAvailableShelves = availableShelves.filter(s => new Date(s.createdAt) >= startDate)
    const filteredApprovedShelves = approvedShelves.filter(s => new Date(s.createdAt) >= startDate)
    const filteredPendingShelves = pendingShelves.filter(s => new Date(s.createdAt) >= startDate)
    
    // Filter rental requests by time period
    const filteredRentalRequests = rentalRequests.filter(r => new Date(r.createdAt) >= startDate)
    const filteredActiveRentals = activeRentals.filter(r => new Date(r.createdAt) >= startDate)
    const filteredPendingRequests = pendingRequests.filter(r => new Date(r.createdAt) >= startDate)
    
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
        const rentalDate = new Date(rental.createdAt)
        return rentalDate.getMonth() === monthIndex && 
               rentalDate.getFullYear() === currentYear
      })
      
      const monthRevenue = monthRentals.reduce((sum, r) => sum + (r.totalAmount || 0), 0)
      const monthOrders = monthRentals.length
      
      // Count new users for this month
      const monthUsers = [...storeOwners, ...brandOwners].filter(user => {
        if (!user.createdAt) return false
        const userDate = new Date(user.createdAt)
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
          .filter(q => q.eq(q.field("ownerId"), brand.userId))
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
          avatar: user?.image || "/api/placeholder/32/32"
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
        const rentalDate = new Date(rental.createdAt)
        return rentalDate.toDateString() === date.toDateString()
      })
      
      const dayRevenue = dayRentals.reduce((sum, r) => sum + (r.totalAmount || 0), 0)
      
      recentRevenue.push({
        day: dayName,
        value: dayRevenue // Use actual revenue only
      })
    }

    // Category distribution
    const categoryData = [
      { name: "Electronics", value: 35, color: "#8b5cf6" },
      { name: "Fashion", value: 25, color: "#3b82f6" },
      { name: "Beauty", value: 20, color: "#10b981" },
      { name: "Food", value: 12, color: "#f59e0b" },
      { name: "Others", value: 8, color: "#6b7280" },
    ]

    // Get recent activities
    const recentActivities = []
    
    // Add recent user registrations
    const recentUsers = [...storeOwners, ...brandOwners]
      .filter(u => u.createdAt)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, 2)
    
    for (const user of recentUsers) {
      if (!user.createdAt) continue
      const timeDiff = Date.now() - new Date(user.createdAt).getTime()
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
        type: user.accountType === "store_owner" ? "new_store" : "new_user",
        title: user.accountType === "store_owner" ? "New store registered" : "New brand registered",
        description: `${user.storeName || user.brandName || userName?.name} joined the platform`,
        time: timeString,
        icon: "Store",
        color: "text-blue-600"
      })
    }
    
    // Add recent rentals
    const recentRentals = activeRentals
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2)
    
    for (const rental of recentRentals) {
      const timeDiff = Date.now() - new Date(rental.createdAt).getTime()
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
        description: `Shelf rented for ${rental.productType || "products"}`,
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
      if (!u.createdAt) return false
      const date = new Date(u.createdAt)
      return date >= prevPeriodStart && date < startDate
    })
    const prevPeriodBrandOwners = brandOwners.filter(u => {
      if (!u.createdAt) return false
      const date = new Date(u.createdAt)
      return date >= prevPeriodStart && date < startDate
    })
    const prevPeriodTotalUsers = prevPeriodStoreOwners.length + prevPeriodBrandOwners.length
    
    const prevPeriodShelves = allShelves.filter(s => {
      const date = new Date(s.createdAt)
      return date >= prevPeriodStart && date < startDate
    })
    
    const prevPeriodRentals = rentalRequests.filter(r => {
      const date = new Date(r.createdAt)
      return date >= prevPeriodStart && date < startDate
    })
    
    const prevPeriodRevenue = activeRentals
      .filter(r => {
        const date = new Date(r.createdAt)
        return date >= prevPeriodStart && date < startDate
      })
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0)
    
    // Current period counts (already calculated above)
    const currentPeriodUsers = filteredStoreOwners.length + filteredBrandOwners.length
    const currentPeriodShelves = filteredShelves.length
    const currentPeriodRentals = filteredActiveRentals.length
    
    // Calculate percentage changes - comparing period to period
    const usersChange = prevPeriodTotalUsers > 0 ? 
      ((currentPeriodUsers - prevPeriodTotalUsers) / prevPeriodTotalUsers * 100) : 
      (currentPeriodUsers > 0 ? 100 : 0)
    
    const shelvesChange = prevPeriodShelves.length > 0 ? 
      ((currentPeriodShelves - prevPeriodShelves.length) / prevPeriodShelves.length * 100) : 
      (currentPeriodShelves > 0 ? 100 : 0)
    
    const rentalsChange = prevPeriodRentals.length > 0 ? 
      ((currentPeriodRentals - prevPeriodRentals.length) / prevPeriodRentals.length * 100) : 
      (currentPeriodRentals > 0 ? 100 : 0)
    
    // For revenue, compare period revenues
    const revenueChange = prevPeriodRevenue > 0 ? 
      ((periodRevenue - prevPeriodRevenue) / prevPeriodRevenue * 100) : 
      (periodRevenue > 0 ? 100 : 0)
    
    return {
      users: {
        totalUsers: currentPeriodUsers, // Show period-specific count
        storeOwners: filteredStoreOwners.length, // Period-specific
        brandOwners: filteredBrandOwners.length, // Period-specific
        activeUsers: [...filteredStoreOwners, ...filteredBrandOwners].filter(u => u.isActive).length,
        verifiedUsers: [...filteredStoreOwners, ...filteredBrandOwners].filter(u => u.isVerified).length,
        change: parseFloat(usersChange.toFixed(1)),
        newInPeriod: currentPeriodUsers, // Same as totalUsers now
      },
      shelves: {
        total: currentPeriodShelves, // Show period-specific count
        available: filteredAvailableShelves.length, // Period-specific
        approved: filteredApprovedShelves.length, // Period-specific
        pending: filteredPendingShelves.length,
        change: parseFloat(shelvesChange.toFixed(1)),
        newInPeriod: currentPeriodShelves, // Same as total now
      },
      rentals: {
        active: filteredActiveRentals.length, // Period-specific
        pending: filteredPendingRequests.length, // Period-specific
        total: filteredRentalRequests.length, // Period-specific
        change: parseFloat(rentalsChange.toFixed(1)),
        newInPeriod: filteredRentalRequests.length, // Same as total now
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

// Verify admin access (middleware-like function)
export const verifyAdminAccess = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    
    if (!userId) {
      return { isAdmin: false, error: "Not authenticated" }
    }
    
    const user = await ctx.db.get(userId)
    if (!user) {
      return { isAdmin: false, error: "User not found" }
    }
    
    // Get the user profile to check account type
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()
    
    if (!userProfile) {
      return { isAdmin: false, error: "User profile not found" }
    }
    
    if (userProfile.accountType !== "admin") {
      return { isAdmin: false, error: "Access denied: Admin privileges required" }
    }
    
    if (!userProfile.isActive) {
      return { isAdmin: false, error: "Account is not active" }
    }
    
    // Get the user from users table for name
    const authUser = await ctx.db.get(userId)
    return { 
      isAdmin: true, 
      user: {
        id: user._id,
        email: user.email || "",
        fullName: authUser?.name,
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
    
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()
    
    if (!userProfile || userProfile.accountType !== "admin") {
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
          updatedBy: userId,
          updatedAt: new Date().toISOString(),
        })
      } else {
        await ctx.db.insert("platformSettings", {
          key: feeKey,
          value: settings.platformFeePercentage,
          description: "Platform fee percentage",
          updatedBy: userId,
          updatedAt: new Date().toISOString(),
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
          updatedBy: userId,
          updatedAt: new Date().toISOString(),
        })
      } else {
        await ctx.db.insert("platformSettings", {
          key: priceKey,
          value: settings.minimumShelfPrice,
          description: "Minimum shelf price",
          updatedBy: userId,
          updatedAt: new Date().toISOString(),
        })
      }
    }

    return { success: true, message: "Platform settings updated" }
  },
})

// Approve or reject shelf listing (admin only)
export const reviewShelfListing = mutation({
  args: {
    shelfId: v.id("shelves"),
    action: v.union(v.literal("approve"), v.literal("reject")),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Not authenticated")
    }
    
    const adminProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()
    
    if (!adminProfile || adminProfile.accountType !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    const shelf = await ctx.db.get(args.shelfId)
    if (!shelf) {
      throw new Error("Shelf not found")
    }

    // Update shelf status
    const updateData: any = {
      status: args.action === "approve" ? "approved" : "rejected",
      reviewedBy: userId,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (args.action === "reject" && args.rejectionReason) {
      updateData.rejectionReason = args.rejectionReason
    }

    await ctx.db.patch(args.shelfId, updateData)

    // Get the owner's userId from profile
    const ownerProfile = await ctx.db.get(shelf.profileId)
    if (!ownerProfile) {
      throw new Error("Owner profile not found")
    }
    
    // Create notification for the shelf owner
    await ctx.db.insert("notifications", {
      userId: ownerProfile.userId,
      title: args.action === "approve" ? "تم قبول رفك" : "تم رفض رفك",
      message: args.action === "approve" 
        ? `تم قبول رفك "${shelf.shelfName}" وهو الآن متاح للإيجار`
        : `تم رفض رفك "${shelf.shelfName}". ${args.rejectionReason || "يرجى مراجعة المتطلبات وإعادة المحاولة"}`,
      type: "system",
      isRead: false,
      createdAt: new Date().toISOString(),
    })

    return { 
      success: true, 
      message: `Shelf ${args.action === "approve" ? "approved" : "rejected"} successfully` 
    }
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
    
    const adminProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()
    
    if (!adminProfile || adminProfile.accountType !== "admin") {
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
    
    const targetProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .first()
    
    if (!targetProfile) {
      throw new Error("User profile not found")
    }

    // Toggle active status
    const newStatus = !targetProfile.isActive
    await ctx.db.patch(targetProfile._id, {
      isActive: newStatus,
      updatedAt: new Date().toISOString(),
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
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized: Authentication required")
    }
    
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()
    
    if (!userProfile || userProfile.accountType !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }
    
    const { searchQuery = "", page, limit, timePeriod = "monthly" } = args;

    // Get all store owners with limit
    const allStoreProfiles = await ctx.db
      .query("userProfiles")
      .withIndex("by_account_type", (q) => q.eq("accountType", "store_owner"))
      .take(500); // Reasonable limit

    // Get emails from users table for search
    const allStoreOwners = await Promise.all(
      allStoreProfiles.map(async (profile) => {
        const authUser = await ctx.db.get(profile.userId)
        return {
          ...profile,
          email: authUser?.email || ""
        }
      })
    )

    // Filter by search query
    const filteredStoreOwners = searchQuery
      ? allStoreOwners.filter(store =>
          store.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          store.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          // Get user name from users table
          false // Note: User name search removed to simplify
        )
      : allStoreOwners;

    // Get shelves for each store owner
    const storesWithStats = await Promise.all(
      filteredStoreOwners.map(async (store) => {
        // Use the store directly as it's already the profile
        const shelves = await ctx.db
          .query("shelves")
          .filter(q => q.eq(q.field("profileId"), store._id))
          .collect();

        const approvedShelves = shelves.filter(s => s.status === "approved").length;
        const totalShelves = shelves.length;

        // Get rental requests for this store
        const rentals = await ctx.db
          .query("rentalRequests")
          .filter(q => q.eq(q.field("ownerId"), store.userId))
          .collect();

        const activeRentals = rentals.filter(r => r.status === "active").length;
        const totalRevenue = rentals
          .filter(r => r.status === "active")
          .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

        // Get user from users table for name, phone, and image
        const user = await ctx.db.get(store.userId)
        
        // Profile image is now stored in users.image field as URL string
        const profileImageUrl = user?.image || null;
        
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
          joinDate: store.createdAt,
          businessRegistration: store.commercialRegisterNumber,
          businessRegistrationUrl: store.commercialRegisterDocument,
          profileImageUrl, // Include the profile image URL
          fullName: user?.name,
          storeName: store.storeName,
          storeType: store.storeType,
          location: store.storeLocation,
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
      const createdDate = new Date(s.createdAt);
      return createdDate >= periodStart;
    });
    
    const shelvesUpToPreviousPeriod = allShelves.filter(s => {
      const createdDate = new Date(s.createdAt);
      return createdDate < periodStart;
    });
    
    // Calculate rentals and revenue for current and previous periods
    const allRentals = await ctx.db
      .query("rentalRequests")
      .filter(q => q.eq(q.field("status"), "active"))
      .collect();
    
    const rentalsInPeriod = allRentals.filter(r => {
      const createdDate = new Date(r.createdAt);
      return createdDate >= periodStart;
    });
    
    const rentalsUpToPreviousPeriod = allRentals.filter(r => {
      const createdDate = new Date(r.createdAt);
      return createdDate < periodStart;
    });
    
    // Calculate revenue from shelf rentals
    const revenueInPeriod = rentalsInPeriod.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const revenueInPreviousPeriod = allRentals.filter(r => {
      const createdDate = new Date(r.createdAt);
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
      const createdDate = new Date(s.createdAt);
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
      throw new Error("Unauthorized: Authentication required")
    }
    
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()
    
    if (!userProfile || userProfile.accountType !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }
    
    const { searchQuery = "", page, limit, timePeriod = "monthly" } = args;

    // Get all brand owners with limit
    const allBrandProfiles = await ctx.db
      .query("userProfiles")
      .withIndex("by_account_type", (q) => q.eq("accountType", "brand_owner"))
      .take(500); // Reasonable limit

    // Get emails from users table for search
    const allBrandOwners = await Promise.all(
      allBrandProfiles.map(async (profile) => {
        const authUser = await ctx.db.get(profile.userId)
        return {
          ...profile,
          email: authUser?.email || ""
        }
      })
    )

    // Filter by search query
    const filteredBrandOwners = searchQuery
      ? allBrandOwners.filter(brand =>
          brand.brandName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          brand.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          // Get user name from users table
          false // Note: User name search removed to simplify
        )
      : allBrandOwners;

    // Get stats for each brand owner
    const brandsWithStats = await Promise.all(
      filteredBrandOwners.map(async (brand) => {
        // Get products for this brand
        const products = await ctx.db
          .query("products")
          .filter(q => q.eq(q.field("ownerId"), brand.userId))
          .collect();

        const totalProducts = products.length;
        // Calculate product sales revenue (this would come from actual sales data)
        // For now, using totalRevenue field from products or a calculated value
        const totalProductRevenue = products.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);

        // Get rental requests for this brand (for counting active rentals, not for revenue)
        const rentals = await ctx.db
          .query("rentalRequests")
          .filter(q => q.eq(q.field("requesterId"), brand.userId))
          .collect();

        const activeRentals = rentals.filter(r => r.status === "active").length;

        // Get unique stores this brand is working with
        const uniqueStoreIds = new Set(rentals.map(r => r.ownerId));
        const storesCount = uniqueStoreIds.size;

        // Get user from users table for name and phone
        const user = await ctx.db.get(brand.userId)
        
        // Profile image is now stored in users.image field as URL string
        const profileImageUrl = user?.image || null;
        
        return {
          id: brand._id,
          name: brand.brandName || user?.name,
          email: brand.email,
          phoneNumber: user?.phone,
          products: totalProducts,
          stores: storesCount,
          rentals: activeRentals,
          revenue: totalProductRevenue, // Only product sales revenue, not rental costs
          status: brand.isActive ? "active" : "suspended",
          category: brand.brandType || "general",
          joinDate: brand.createdAt,
          businessRegistration: brand.brandCommercialRegisterNumber || brand.freelanceLicenseNumber,
          businessRegistrationUrl: brand.brandCommercialRegisterDocument || brand.freelanceLicenseDocument,
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
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized: Authentication required")
    }
    
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()
    
    if (!userProfile || userProfile.accountType !== "admin") {
      throw new Error("Unauthorized: Admin access required")
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
          if (status === "published") return shelf.status === "approved" || shelf.status === "pending_approval";
          if (status === "approved") return shelf.status === "approved";
          return false;
        });

    // Get owner details for each shelf
    const shelvesWithOwners = await Promise.all(
      filteredByStatus.map(async (shelf) => {
        const ownerProfile = await ctx.db.get(shelf.profileId);
        if (!ownerProfile) return null;
        
        // Get the owner's email from users table
        const authUser = await ctx.db.get(ownerProfile.userId)

        // Get user from users table for name and phone
        const ownerUser = await ctx.db.get(ownerProfile.userId)
        
        return {
          id: shelf._id,
          storeId: shelf.profileId, // Add storeId which is the profileId
          storeName: ownerProfile.storeName || ownerUser?.name,
          storeOwnerName: ownerUser?.name,
          storeOwnerEmail: authUser?.email || "",
          storeOwnerPhone: ownerUser?.phone,
          businessRegistration: ownerProfile.commercialRegisterNumber,
          branch: shelf.branch || shelf.city,
          shelfName: shelf.shelfName,
          percentage: shelf.storeCommission || 8, // Use store commission or default platform fee
          price: shelf.monthlyPrice,
          addedDate: shelf.createdAt,
          status: shelf.status === "approved" ? "published" : shelf.status,
          city: shelf.city,
          address: shelf.address,
          dimensions: `${shelf.shelfSize.width} × ${shelf.shelfSize.height} × ${shelf.shelfSize.depth} ${shelf.shelfSize.unit}`,
          productType: shelf.productType,
          description: shelf.description,
          availableFrom: shelf.availableFrom,
          images: [shelf.exteriorImage, shelf.interiorImage, shelf.shelfImage].filter(Boolean),
        };
      })
    );

    // Filter out null entries and apply search
    const validShelves = shelvesWithOwners.filter(Boolean) as NonNullable<typeof shelvesWithOwners[0]>[];
    
    const filteredShelves = searchQuery
      ? validShelves.filter(post =>
          post.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.shelfName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.branch?.toLowerCase().includes(searchQuery.toLowerCase())
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
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized: Authentication required")
    }
    
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()
    
    if (!userProfile || userProfile.accountType !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }
    
    const { searchQuery = "", status = "all", page, limit } = args;

    // Get all rental requests that have payment information
    const rentalRequests = await ctx.db
      .query("rentalRequests")
      .take(500); // Reasonable limit

    // Filter by payment status
    const filteredByStatus = status === "all" 
      ? rentalRequests
      : status === "paid"
      ? rentalRequests.filter(r => r.status === "active")
      : rentalRequests.filter(r => r.status === "payment_pending" || r.status === "accepted");

    // Get payment details with user information
    const paymentsWithDetails = await Promise.all(
      filteredByStatus.map(async (rental, index) => {
        if (!rental.requesterId || !rental.ownerId) return null;
        
        const brandOwner = await ctx.db.get(rental.requesterId);
        const storeOwner = await ctx.db.get(rental.ownerId);
        const shelf = await ctx.db.get(rental.shelfId);

        if (!brandOwner || !storeOwner || !shelf) return null;
        
        // Get user profiles and emails
        const brandProfile = await ctx.db.query("userProfiles").withIndex("by_user", q => q.eq("userId", rental.requesterId!)).first();
        const storeProfile = await ctx.db.query("userProfiles").withIndex("by_user", q => q.eq("userId", rental.ownerId!)).first();
        
        // Get emails from users table
        const brandAuthUser = await ctx.db.get(rental.requesterId!)
        const storeAuthUser = await ctx.db.get(rental.ownerId!)

        // Calculate platform fee (8%)
        const platformFeePercentage = 8;
        const platformFeeAmount = ((rental.totalAmount || 0) * platformFeePercentage) / 100;

        // Return payment record based on rental status
        // For active/completed rentals, show as brand payment
        // Later we can add store settlement records
        // Get users from users table for names
        const brandUser = brandProfile ? await ctx.db.get(brandProfile.userId) : null
        const storeUser = storeProfile ? await ctx.db.get(storeProfile.userId) : null
        
        return {
          id: rental._id,
          invoiceNumber: `INV-2024-${String(index + 1).padStart(3, '0')}`,
          type: "brand_payment" as const, // Payment from brand to platform
          merchant: brandUser?.name || brandProfile?.brandName || "Unknown",
          merchantEmail: brandAuthUser?.email || "",
          store: storeProfile?.storeName || storeUser?.name || "Unknown",
          storeEmail: storeAuthUser?.email || "",
          shelfName: shelf.shelfName,
          date: rental.createdAt,
          amount: rental.totalAmount || 0,
          platformFee: platformFeeAmount,
          method: "bank_transfer", // Default for now
          status: (rental.status === "active" || rental.status === "completed") ? "paid" : "unpaid",
          startDate: rental.startDate,
          endDate: rental.endDate,
          description: `Shelf rental payment from ${brandProfile?.brandName || "Brand"} to Shibr Platform`,
        };
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
export const getStoreShelves = query({
  args: {
    profileId: v.id("userProfiles"),
    searchQuery: v.optional(v.string()),
    status: v.optional(v.string()),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized: Authentication required")
    }
    
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()
    
    if (!userProfile || userProfile.accountType !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }
    
    const page = args.page || 1
    const limit = args.limit || 5
    const searchQuery = args.searchQuery?.toLowerCase() || ""
    const statusFilter = args.status || "all"
    
    let shelves = await ctx.db
      .query("shelves")
      .filter(q => q.eq(q.field("profileId"), args.profileId))
      .collect()
    
    // Apply search filter
    if (searchQuery) {
      shelves = shelves.filter(shelf => 
        shelf.shelfName?.toLowerCase().includes(searchQuery) ||
        shelf.branch?.toLowerCase().includes(searchQuery)
      )
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      shelves = shelves.filter(shelf => {
        const isAvailable = shelf.isAvailable ? "available" : "rented"
        return isAvailable === statusFilter
      })
    }
    
    // Pagination
    const totalItems = shelves.length
    const totalPages = Math.ceil(totalItems / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedShelves = shelves.slice(startIndex, endIndex)
    
    return {
      items: paginatedShelves,
      totalItems,
      totalPages,
      currentPage: page,
    }
  },
})

// Get rental requests for a specific store (admin store details page)
export const getStoreRentals = query({
  args: {
    profileId: v.id("userProfiles"),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized: Authentication required")
    }
    
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()
    
    if (!userProfile || userProfile.accountType !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }
    
    // Get the userId from the profile
    const profile = await ctx.db.get(args.profileId)
    if (!profile) return []
    
    const rentals = await ctx.db
      .query("rentalRequests")
      .filter(q => q.eq(q.field("ownerId"), profile.userId))
      .collect()
    
    // Get additional details for each rental
    const rentalsWithDetails = await Promise.all(
      rentals.map(async (rental) => {
        const shelf = rental.shelfId ? await ctx.db.get(rental.shelfId) : null
        const renterProfile = rental.requesterId ? 
          await ctx.db
            .query("userProfiles")
            .withIndex("by_user", q => q.eq("userId", rental.requesterId))
            .first() : null
        const renter = rental.requesterId ? await ctx.db.get(rental.requesterId as Id<"users">) : null
        
        return {
          ...rental,
          shelfName: shelf?.shelfName || "Unknown Shelf",
          renterName: renterProfile?.brandName || renterProfile?.storeName || "Unknown",
          duration: rental.rentalPeriod || 1,
        }
      })
    )
    
    return rentalsWithDetails
  },
})

// Get monthly payment summary for a store (admin store details page)
export const getStorePayments = query({
  args: {
    profileId: v.id("userProfiles"),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Unauthorized: Authentication required")
    }
    
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()
    
    if (!userProfile || userProfile.accountType !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }
    
    // Get the userId from the profile
    const profile = await ctx.db.get(args.profileId)
    if (!profile) return []
    
    const rentals = await ctx.db
      .query("rentalRequests")
      .filter(q => q.eq(q.field("ownerId"), profile.userId))
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
      const date = new Date(rental.createdAt)
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
