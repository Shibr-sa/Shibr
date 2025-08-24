import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

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
    // Find the user profile by email
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
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
    // Find the user profile by email
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first()

    if (!userProfile) {
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
export const getAdminStats = query({
  args: {
    timePeriod: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("yearly"))),
  },
  handler: async (ctx, args) => {
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
    let startDate: Date
    
    switch (timePeriod) {
      case "daily":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case "weekly":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }
    
    // Filter users by time period
    const filteredStoreOwners = storeOwners.filter(u => u.createdAt && new Date(u.createdAt) >= startDate)
    const filteredBrandOwners = brandOwners.filter(u => u.createdAt && new Date(u.createdAt) >= startDate)
    
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

    // Calculate monthly revenue data for chart (last 6 months)
    const revenueByMonth = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = monthDate.toLocaleString('en', { month: 'short' })
      
      // Filter rentals for this month
      const monthRentals = activeRentals.filter(rental => {
        const rentalDate = new Date(rental.createdAt)
        return rentalDate.getMonth() === monthDate.getMonth() && 
               rentalDate.getFullYear() === monthDate.getFullYear()
      })
      
      const monthRevenue = monthRentals.reduce((sum, r) => sum + (r.totalAmount || 0), 0)
      const monthOrders = monthRentals.length
      
      // Count new users for this month
      const monthUsers = [...storeOwners, ...brandOwners].filter(user => {
        if (!user.createdAt) return false
        const userDate = new Date(user.createdAt)
        return userDate.getMonth() === monthDate.getMonth() && 
               userDate.getFullYear() === monthDate.getFullYear()
      }).length
      
      revenueByMonth.push({
        month: monthName,
        revenue: monthRevenue,
        orders: monthOrders,
        users: monthUsers
      })
    }

    // Get top performing stores
    const topStores = await Promise.all(
      storeOwners.slice(0, 5).map(async (store) => {
        // Get rentals for this store
        const storeRentals = rentalRequests.filter(r => 
          r.ownerId === store.userId && r.status === "active"
        )
        
        const storeRevenue = storeRentals.reduce((sum, r) => sum + (r.totalAmount || 0), 0)
        
        // Calculate growth (return 0 for now as we don't have historical data tracking)
        const growth = 0
        
        return {
          id: store._id,
          name: store.storeName || store.fullName,
          revenue: storeRevenue,
          growth: parseFloat(growth.toFixed(1)),
          avatar: "/api/placeholder/32/32" // Placeholder for now
        }
      })
    )

    // Sort by revenue and take top 5
    topStores.sort((a, b) => b.revenue - a.revenue)

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
    
    recentUsers.forEach(user => {
      if (!user.createdAt) return
      const timeDiff = Date.now() - new Date(user.createdAt).getTime()
      const minutesAgo = Math.floor(timeDiff / (1000 * 60))
      const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60))
      const daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
      
      let timeString = "just now"
      if (daysAgo > 0) timeString = `${daysAgo} days ago`
      else if (hoursAgo > 0) timeString = `${hoursAgo} hours ago`
      else if (minutesAgo > 0) timeString = `${minutesAgo} minutes ago`
      
      recentActivities.push({
        id: user._id,
        type: user.accountType === "store_owner" ? "new_store" : "new_user",
        title: user.accountType === "store_owner" ? "New store registered" : "New brand registered",
        description: `${user.storeName || user.brandName || user.fullName} joined the platform`,
        time: timeString,
        icon: "Store",
        color: "text-blue-600"
      })
    })
    
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
    let previousPeriodEnd: Date
    
    switch (timePeriod) {
      case "daily":
        previousPeriodEnd = new Date(startDate.getTime() - 24 * 60 * 60 * 1000)
        break
      case "weekly":
        previousPeriodEnd = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "monthly":
        previousPeriodEnd = new Date(startDate.getFullYear(), startDate.getMonth(), 0) // Last day of previous month
        break
      case "yearly":
        previousPeriodEnd = new Date(startDate.getFullYear() - 1, 11, 31) // Last day of previous year
        break
      default:
        previousPeriodEnd = new Date(startDate.getFullYear(), startDate.getMonth(), 0)
    }
    
    // Get totals up to the end of previous period
    const prevPeriodStoreOwners = storeOwners.filter(u => 
      u.createdAt && new Date(u.createdAt) <= previousPeriodEnd
    ).length
    const prevPeriodBrandOwners = brandOwners.filter(u => 
      u.createdAt && new Date(u.createdAt) <= previousPeriodEnd
    ).length
    const prevPeriodTotalUsers = prevPeriodStoreOwners + prevPeriodBrandOwners
    
    const prevPeriodShelves = allShelves.filter(s => 
      new Date(s.createdAt) <= previousPeriodEnd
    ).length
    
    const prevPeriodRentals = rentalRequests.filter(r => 
      new Date(r.createdAt) <= previousPeriodEnd
    ).length
    
    // For revenue, calculate what was earned in the previous period (not cumulative)
    let prevPeriodStart: Date
    switch (timePeriod) {
      case "daily":
        prevPeriodStart = new Date(previousPeriodEnd.getFullYear(), previousPeriodEnd.getMonth(), previousPeriodEnd.getDate())
        break
      case "weekly":
        prevPeriodStart = new Date(previousPeriodEnd.getTime() - 6 * 24 * 60 * 60 * 1000)
        break
      case "monthly":
        prevPeriodStart = new Date(previousPeriodEnd.getFullYear(), previousPeriodEnd.getMonth(), 1)
        break
      case "yearly":
        prevPeriodStart = new Date(previousPeriodEnd.getFullYear(), 0, 1)
        break
      default:
        prevPeriodStart = new Date(previousPeriodEnd.getFullYear(), previousPeriodEnd.getMonth(), 1)
    }
    
    const prevPeriodRevenue = activeRentals
      .filter(r => {
        const date = new Date(r.createdAt)
        return date > prevPeriodStart && date <= previousPeriodEnd
      })
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0)
    
    // Current totals (cumulative up to now)
    const currentTotalUsers = storeOwners.length + brandOwners.length
    const currentTotalShelves = allShelves.length
    const currentTotalRentals = rentalRequests.length
    
    // Calculate percentage changes
    // For cumulative metrics (users, shelves, rentals), compare total counts
    const usersChange = prevPeriodTotalUsers > 0 ? 
      ((currentTotalUsers - prevPeriodTotalUsers) / prevPeriodTotalUsers * 100) : 
      (currentTotalUsers > 0 ? 100 : 0)
    
    const shelvesChange = prevPeriodShelves > 0 ? 
      ((currentTotalShelves - prevPeriodShelves) / prevPeriodShelves * 100) : 
      (currentTotalShelves > 0 ? 100 : 0)
    
    const rentalsChange = prevPeriodRentals > 0 ? 
      ((currentTotalRentals - prevPeriodRentals) / prevPeriodRentals * 100) : 
      (currentTotalRentals > 0 ? 100 : 0)
    
    // For revenue, compare period revenues
    const revenueChange = prevPeriodRevenue > 0 ? 
      ((periodRevenue - prevPeriodRevenue) / prevPeriodRevenue * 100) : 
      (periodRevenue > 0 ? 100 : 0)
    
    return {
      users: {
        totalUsers: currentTotalUsers, // Show total cumulative users
        storeOwners: storeOwners.length,
        brandOwners: brandOwners.length,
        activeUsers: [...storeOwners, ...brandOwners].filter(u => u.isActive).length,
        verifiedUsers: [...storeOwners, ...brandOwners].filter(u => u.isVerified).length,
        change: parseFloat(usersChange.toFixed(1)),
        newInPeriod: filteredStoreOwners.length + filteredBrandOwners.length, // New users in selected period
      },
      shelves: {
        total: currentTotalShelves, // Show total cumulative shelves
        available: availableShelves.length, // Current available (not filtered by period)
        approved: approvedShelves.length, // Current approved (not filtered by period)
        pending: pendingShelves.length,
        change: parseFloat(shelvesChange.toFixed(1)),
        newInPeriod: filteredShelves.length, // New shelves in selected period
      },
      rentals: {
        active: activeRentals.length, // Current active rentals
        pending: pendingRequests.length, // Current pending
        total: currentTotalRentals, // Total cumulative rental requests
        change: parseFloat(rentalsChange.toFixed(1)),
        newInPeriod: filteredRentalRequests.length, // New requests in selected period
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
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    
    if (!user) {
      return { isAdmin: false, error: "User not found" }
    }
    
    // Get the user profile to check account type
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
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
    
    return { 
      isAdmin: true, 
      user: {
        id: user._id,
        email: userProfile.email,
        fullName: userProfile.fullName,
      }
    }
  },
})

// Update platform settings (admin only)
export const updatePlatformSettings = mutation({
  args: {
    adminUserId: v.id("users"),
    platformFeePercentage: v.optional(v.number()),
    minimumShelfPrice: v.optional(v.number()),
    maximumDiscountPercentage: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const user = await ctx.db.get(args.adminUserId)
    if (!user) {
      throw new Error("User not found")
    }
    
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.adminUserId))
      .first()
    
    if (!userProfile || userProfile.accountType !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    const { adminUserId, ...settings } = args

    // Update or create platform fee setting
    if (settings.platformFeePercentage !== undefined) {
      const feeKey = "platformFeePercentage"
      const existingFee = await ctx.db.query("platformSettings").filter(q => q.eq(q.field("key"), feeKey)).first()
      
      if (existingFee) {
        await ctx.db.patch(existingFee._id, {
          value: settings.platformFeePercentage,
          updatedBy: args.adminUserId,
          updatedAt: new Date().toISOString(),
        })
      } else {
        await ctx.db.insert("platformSettings", {
          key: feeKey,
          value: settings.platformFeePercentage,
          description: "Platform fee percentage",
          updatedBy: args.adminUserId,
          updatedAt: new Date().toISOString(),
        })
      }
    }
    
    // Update or create minimum shelf price setting
    if (settings.minimumShelfPrice !== undefined) {
      const priceKey = "minimumShelfPrice"
      const existingPrice = await ctx.db.query("platformSettings").filter(q => q.eq(q.field("key"), priceKey)).first()
      
      if (existingPrice) {
        await ctx.db.patch(existingPrice._id, {
          value: settings.minimumShelfPrice,
          updatedBy: args.adminUserId,
          updatedAt: new Date().toISOString(),
        })
      } else {
        await ctx.db.insert("platformSettings", {
          key: priceKey,
          value: settings.minimumShelfPrice,
          description: "Minimum shelf price",
          updatedBy: args.adminUserId,
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
    adminUserId: v.id("users"),
    shelfId: v.id("shelves"),
    action: v.union(v.literal("approve"), v.literal("reject")),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const adminUser = await ctx.db.get(args.adminUserId)
    if (!adminUser) {
      throw new Error("Admin user not found")
    }
    
    const adminProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.adminUserId))
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
      reviewedBy: args.adminUserId,
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
    adminUserId: v.id("users"),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const admin = await ctx.db.get(args.adminUserId)
    if (!admin) {
      throw new Error("Admin user not found")
    }
    
    const adminProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.adminUserId))
      .first()
    
    if (!adminProfile || adminProfile.accountType !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    // Prevent admin from deactivating themselves
    if (args.adminUserId === args.targetUserId) {
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
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    timePeriod: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("yearly"))),
  },
  handler: async (ctx, args) => {
    const { searchQuery = "", page = 1, limit = 10, timePeriod = "monthly" } = args;

    // Get all store owners
    let storeOwnersQuery = ctx.db
      .query("userProfiles")
      .filter(q => q.eq(q.field("accountType"), "store_owner"));

    const allStoreOwners = await storeOwnersQuery.collect();

    // Filter by search query
    const filteredStoreOwners = searchQuery
      ? allStoreOwners.filter(store =>
          store.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          store.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          store.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : allStoreOwners;

    // Get shelves for each store owner
    const storesWithStats = await Promise.all(
      filteredStoreOwners.map(async (store) => {
        // Get user profile first
        const storeProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", q => q.eq("userId", store.userId))
          .first();
        
        const shelves = storeProfile ? await ctx.db
          .query("shelves")
          .withIndex("by_profile")
          .filter(q => q.eq(q.field("profileId"), storeProfile._id))
          .collect() : [];

        const approvedShelves = shelves.filter(s => s.status === "approved").length;
        const totalShelves = shelves.length;

        // Get rental requests for this store
        const rentals = await ctx.db
          .query("rentalRequests")
          .withIndex("by_owner")
          .filter(q => q.eq(q.field("ownerId"), store.userId))
          .collect();

        const activeRentals = rentals.filter(r => r.status === "active").length;
        const totalRevenue = rentals
          .filter(r => r.status === "active")
          .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

        return {
          id: store._id,
          name: store.storeName || store.fullName,
          email: store.email,
          phoneNumber: store.phoneNumber,
          shelves: totalShelves,
          approvedShelves,
          rentals: activeRentals,
          revenue: totalRevenue,
          status: store.isActive ? "active" : "suspended",
          joinDate: store.createdAt,
          businessRegistration: store.commercialRegisterNumber,
          businessRegistrationUrl: store.commercialRegisterDocument,
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

    // Calculate time-based stats
    const now = new Date();
    const { startDate: periodStart, endDate: periodEnd } = getDateRange(now, timePeriod);
    const { startDate: previousStart, endDate: previousEnd } = getDateRange(periodStart, timePeriod);

    // Get stores by creation date (cumulative)
    const storesUntilNow = storesWithStats.filter(store => {
      const joinDate = new Date(store.joinDate);
      return joinDate <= periodEnd;
    }).length;

    const storesUntilPrevious = storesWithStats.filter(store => {
      const joinDate = new Date(store.joinDate);
      return joinDate <= previousEnd;
    }).length;

    // Calculate counts
    const totalStores = storesWithStats.length;
    const activeStores = storesWithStats.filter(s => s.status === "active").length;
    const suspendedStores = storesWithStats.filter(s => s.status === "suspended").length;

    // Calculate percentage changes (cumulative growth)
    const totalChange = storesUntilPrevious > 0
      ? Math.round(((storesUntilNow - storesUntilPrevious) / storesUntilPrevious) * 100 * 10) / 10
      : storesUntilNow > 0 ? 100 : 0;

    // Use actual calculated changes, return 0 if no change
    const activeChange = 0;
    const suspendedChange = 0;
    const finalTotalChange = totalChange;

    return {
      stores: paginatedStores,
      total: storesWithStats.length,
      page,
      totalPages: Math.ceil(storesWithStats.length / limit),
      stats: {
        totalStores,
        totalChange: finalTotalChange,
        activeStores,
        activeChange: activeChange,
        suspendedStores,
        suspendedChange: suspendedChange,
      },
    };
  },
});

// Get all brands (brand owners) with their stats for admin dashboard
export const getBrands = query({
  args: {
    searchQuery: v.optional(v.string()),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    timePeriod: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("yearly"))),
  },
  handler: async (ctx, args) => {
    const { searchQuery = "", page = 1, limit = 10, timePeriod = "monthly" } = args;

    // Get all brand owners
    let brandOwnersQuery = ctx.db
      .query("userProfiles")
      .filter(q => q.eq(q.field("accountType"), "brand_owner"));

    const allBrandOwners = await brandOwnersQuery.collect();

    // Filter by search query
    const filteredBrandOwners = searchQuery
      ? allBrandOwners.filter(brand =>
          brand.brandName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          brand.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          brand.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : allBrandOwners;

    // Get stats for each brand owner
    const brandsWithStats = await Promise.all(
      filteredBrandOwners.map(async (brand) => {
        // Get products for this brand
        const products = await ctx.db
          .query("products")
          .withIndex("by_owner")
          .filter(q => q.eq(q.field("ownerId"), brand.userId))
          .collect();

        const totalProducts = products.length;
        const totalProductRevenue = products.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);

        // Get rental requests for this brand
        const rentals = await ctx.db
          .query("rentalRequests")
          .withIndex("by_requester")
          .filter(q => q.eq(q.field("requesterId"), brand.userId))
          .collect();

        const activeRentals = rentals.filter(r => r.status === "active").length;
        const totalRentalRevenue = rentals
          .filter(r => r.status === "active")
          .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

        // Get unique stores this brand is working with
        const uniqueStoreIds = new Set(rentals.map(r => r.ownerId));
        const storesCount = uniqueStoreIds.size;

        return {
          id: brand._id,
          name: brand.brandName || brand.fullName,
          email: brand.email,
          phoneNumber: brand.phoneNumber,
          products: totalProducts,
          stores: storesCount,
          rentals: activeRentals,
          revenue: totalProductRevenue + totalRentalRevenue,
          status: brand.isActive ? "active" : "suspended",
          category: brand.businessType || "general",
          joinDate: brand.createdAt,
          businessRegistration: brand.brandCommercialRegisterNumber || brand.freelanceLicenseNumber,
          businessRegistrationUrl: brand.brandCommercialRegisterDocument || brand.freelanceLicenseDocument,
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

    // Calculate aggregated stats based on time period
    const now = new Date();
    let startDate: Date;
    
    switch (timePeriod) {
      case "daily":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "weekly":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    // Filter brands by time period for stats
    const periodBrands = brandsWithStats.filter(b => new Date(b.joinDate) >= startDate);
    
    // Calculate total stats
    const totalProducts = brandsWithStats.reduce((sum, b) => sum + b.products, 0);
    const totalRevenue = brandsWithStats.reduce((sum, b) => sum + b.revenue, 0);
    const periodRevenue = periodBrands.reduce((sum, b) => sum + b.revenue, 0);
    
    // Calculate percentage changes - return 0 as we don't have historical data tracking yet
    const brandsChange = 0;
    const productsChange = 0;
    const revenueChange = 0;
    
    return {
      brands: paginatedBrands,
      total: brandsWithStats.length,
      page,
      totalPages: Math.ceil(brandsWithStats.length / limit),
      stats: {
        totalBrands: brandsWithStats.length,
        brandsChange,
        totalProducts,
        productsChange,
        totalRevenue,
        periodRevenue,
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
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { searchQuery = "", status = "all", page = 1, limit = 10 } = args;

    // Get all shelves
    let shelvesQuery = ctx.db.query("shelves");
    
    const allShelves = await shelvesQuery.collect();

    // Filter by status
    const filteredByStatus = status === "all" 
      ? allShelves
      : allShelves.filter(shelf => {
          if (status === "published") return shelf.status === "approved" || shelf.status === "pending_approval";
          if (status === "approved") return shelf.status === "approved";
          return false;
        });

    // Get owner details for each shelf
    const shelvesWithOwners = await Promise.all(
      filteredByStatus.map(async (shelf) => {
        const ownerProfile = await ctx.db.get(shelf.profileId);
        if (!ownerProfile) return null;
        
        const owner = await ctx.db.get(ownerProfile.userId);
        if (!owner) return null;

        return {
          id: shelf._id,
          storeName: ownerProfile.storeName || ownerProfile.fullName,
          storeOwnerName: ownerProfile.fullName,
          storeOwnerEmail: ownerProfile.email,
          storeOwnerPhone: ownerProfile.phoneNumber,
          businessRegistration: ownerProfile.commercialRegisterNumber,
          branch: shelf.branch || shelf.city,
          shelfName: shelf.shelfName,
          percentage: 0, // Not defined in schema
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
      posts: paginatedPosts,
      total: filteredShelves.length,
      page,
      totalPages: Math.ceil(filteredShelves.length / limit),
    };
  },
});

// Get all payments/transactions for admin dashboard
export const getPayments = query({
  args: {
    searchQuery: v.optional(v.string()),
    status: v.optional(v.string()),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { searchQuery = "", status = "all", page = 1, limit = 10 } = args;

    // Get all rental requests that have payment information
    const rentalRequests = await ctx.db
      .query("rentalRequests")
      .collect();

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
        
        // Get user profiles for names
        const brandProfile = await ctx.db.query("userProfiles").withIndex("by_user", q => q.eq("userId", rental.requesterId!)).first();
        const storeProfile = await ctx.db.query("userProfiles").withIndex("by_user", q => q.eq("userId", rental.ownerId!)).first();

        // Calculate platform fee (8%)
        const platformFeePercentage = 8;
        const platformFeeAmount = ((rental.totalAmount || 0) * platformFeePercentage) / 100;

        return {
          id: rental._id,
          invoiceNumber: `INV-2024-${String(index + 1).padStart(3, '0')}`,
          merchant: brandProfile?.fullName || brandProfile?.brandName || "Unknown",
          merchantEmail: brandProfile?.email || "",
          store: storeProfile?.storeName || storeProfile?.fullName || "Unknown",
          storeEmail: storeProfile?.email || "",
          shelfName: shelf.shelfName,
          date: rental.createdAt,
          amount: rental.totalAmount || 0,
          percentage: platformFeePercentage,
          platformFee: platformFeeAmount,
          method: "bank_transfer", // Default for now
          status: rental.status === "active" ? "paid" : "unpaid",
          startDate: rental.startDate,
          endDate: rental.endDate,
        };
      })
    );

    // Filter out null entries
    const validPayments = paymentsWithDetails.filter(Boolean) as NonNullable<typeof paymentsWithDetails[0]>[];

    // Apply search filter
    const filteredPayments = searchQuery
      ? validPayments.filter(payment =>
          payment.merchant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

    // Calculate summary stats
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const totalReceived = validPayments
      .filter(p => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0);

    const currentMonthPayments = validPayments
      .filter(p => {
        const paymentDate = new Date(p.date);
        return paymentDate.getMonth() === currentMonth && 
               paymentDate.getFullYear() === currentYear &&
               p.status === "paid";
      })
      .reduce((sum, p) => sum + p.amount, 0);

    const lastMonthPayments = validPayments
      .filter(p => {
        const paymentDate = new Date(p.date);
        return paymentDate.getMonth() === lastMonth && 
               paymentDate.getFullYear() === lastMonthYear &&
               p.status === "paid";
      })
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingPayments = validPayments
      .filter(p => p.status === "unpaid")
      .reduce((sum, p) => sum + p.amount, 0);

    const lastMonthPending = validPayments
      .filter(p => {
        const paymentDate = new Date(p.date);
        return paymentDate.getMonth() === lastMonth && 
               paymentDate.getFullYear() === lastMonthYear &&
               p.status === "unpaid";
      })
      .reduce((sum, p) => sum + p.amount, 0);

    const invoicesIssued = validPayments.length;
    const lastMonthInvoices = validPayments.filter(p => {
      const paymentDate = new Date(p.date);
      return paymentDate.getMonth() === lastMonth && 
             paymentDate.getFullYear() === lastMonthYear;
    }).length;

    // Calculate percentage changes
    const totalReceivedChange = lastMonthPayments > 0 
      ? Math.round(((currentMonthPayments - lastMonthPayments) / lastMonthPayments) * 100 * 10) / 10
      : 0;

    const currentMonthChange = lastMonthPayments > 0
      ? Math.round(((currentMonthPayments - lastMonthPayments) / lastMonthPayments) * 100 * 10) / 10
      : 0;

    const pendingChange = lastMonthPending > 0
      ? Math.round(((pendingPayments - lastMonthPending) / lastMonthPending) * 100 * 10) / 10
      : 0;

    const invoicesChange = lastMonthInvoices > 0
      ? Math.round(((invoicesIssued - lastMonthInvoices) / lastMonthInvoices) * 100 * 10) / 10
      : 0;

    return {
      payments: paginatedPayments,
      total: filteredPayments.length,
      page,
      totalPages: Math.ceil(filteredPayments.length / limit),
      stats: {
        totalReceived,
        totalReceivedChange,
        currentMonthPayments,
        currentMonthChange,
        pendingPayments,
        pendingChange,
        invoicesIssued,
        invoicesChange,
      },
    };
  },
});