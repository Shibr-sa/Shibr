import { v } from "convex/values"
import { query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

// Get rental analytics for a user
export const getUserRentalAnalytics = query({
  args: {
    userId: v.id("users"),
    userType: v.union(v.literal("brand"), v.literal("store"))
  },
  handler: async (ctx, args) => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    
    // Get all rentals for the user
    const field = args.userType === "brand" ? "brandOwnerId" : "storeOwnerId"
    const allRentals = await ctx.db
      .query("rentalRequests")
      .filter((q) => q.eq(q.field(field as any), args.userId))
      .collect()
    
    // Calculate metrics
    const totalRentals = allRentals.length
    const activeRentals = allRentals.filter(r => r.status === "active").length
    const completedRentals = allRentals.filter(r => r.status === "completed").length
    const pendingRentals = allRentals.filter(r => r.status === "pending").length
    
    // Calculate revenue
    const totalRevenue = allRentals
      .filter(r => r.status === "active" || r.status === "completed")
      .reduce((sum, r) => sum + r.totalPrice, 0)
    
    const monthlyRevenue = allRentals
      .filter(r => 
        (r.status === "active" || r.status === "completed") &&
        new Date(r.createdAt) >= thirtyDaysAgo
      )
      .reduce((sum, r) => sum + r.totalPrice, 0)
    
    // Calculate completion rate
    const completionRate = totalRentals > 0 
      ? (completedRentals / totalRentals) * 100 
      : 0
    
    // Get recent rentals
    const recentRentals = allRentals
      .filter(r => new Date(r.createdAt) >= thirtyDaysAgo)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
    
    // Calculate growth rate (compare last 30 days to previous 30 days)
    const lastMonthRentals = allRentals.filter(r => {
      const createdAt = new Date(r.createdAt)
      return createdAt >= thirtyDaysAgo
    }).length
    
    const previousMonthRentals = allRentals.filter(r => {
      const createdAt = new Date(r.createdAt)
      return createdAt < thirtyDaysAgo && createdAt >= new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    }).length
    
    const growthRate = previousMonthRentals > 0 
      ? ((lastMonthRentals - previousMonthRentals) / previousMonthRentals) * 100
      : 0
    
    // Get average rating if user has reviews
    const reviews = await ctx.db
      .query("rentalReviews")
      .withIndex("by_reviewee")
      .filter((q) => q.eq(q.field("revieweeId"), args.userId))
      .collect()
    
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0
    
    // Get rental duration stats
    const activeDurations = allRentals
      .filter(r => r.status === "active" || r.status === "completed")
      .map(r => {
        const start = new Date(r.startDate)
        const end = new Date(r.endDate)
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)) // months
      })
    
    const averageDuration = activeDurations.length > 0
      ? activeDurations.reduce((sum, d) => sum + d, 0) / activeDurations.length
      : 0
    
    return {
      overview: {
        totalRentals,
        activeRentals,
        completedRentals,
        pendingRentals,
        completionRate: Math.round(completionRate),
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length,
      },
      revenue: {
        total: totalRevenue,
        monthly: monthlyRevenue,
        average: totalRentals > 0 ? totalRevenue / totalRentals : 0,
      },
      growth: {
        rate: Math.round(growthRate),
        lastMonth: lastMonthRentals,
        previousMonth: previousMonthRentals,
      },
      duration: {
        average: Math.round(averageDuration),
        shortest: activeDurations.length > 0 ? Math.min(...activeDurations) : 0,
        longest: activeDurations.length > 0 ? Math.max(...activeDurations) : 0,
      },
      recentRentals,
    }
  },
})

// Get platform-wide analytics (for admin)
export const getPlatformAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    // Get all data
    const allRentals = await ctx.db.query("rentalRequests").collect()
    const allUsers = await ctx.db.query("users").collect()
    const allShelves = await ctx.db.query("shelves").collect()
    const allReviews = await ctx.db.query("rentalReviews").collect()
    
    // User metrics
    const totalUsers = allUsers.length
    const storeOwners = allUsers.filter(u => u.accountType === "store-owner").length
    const brandOwners = allUsers.filter(u => u.accountType === "brand-owner").length
    const activeUsers = allUsers.filter(u => u.isActive).length
    
    // Rental metrics
    const totalRentals = allRentals.length
    const activeRentals = allRentals.filter(r => r.status === "active").length
    const completedRentals = allRentals.filter(r => r.status === "completed").length
    
    // Shelf metrics
    const totalShelves = allShelves.length
    const availableShelves = allShelves.filter(s => s.isAvailable).length
    const rentedShelves = allShelves.filter(s => s.status === "rented").length
    
    // Revenue metrics
    const totalRevenue = allRentals
      .filter(r => r.status === "active" || r.status === "completed")
      .reduce((sum, r) => sum + r.totalPrice, 0)
    
    const monthlyRevenue = allRentals
      .filter(r => 
        (r.status === "active" || r.status === "completed") &&
        new Date(r.createdAt) >= thirtyDaysAgo
      )
      .reduce((sum, r) => sum + r.totalPrice, 0)
    
    // Platform fee (assuming 8% as per schema comment)
    const platformFee = totalRevenue * 0.08
    const monthlyPlatformFee = monthlyRevenue * 0.08
    
    // Review metrics
    const totalReviews = allReviews.length
    const averageRating = totalReviews > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0
    
    // Growth metrics
    const newUsersThisMonth = allUsers.filter(u => 
      new Date(u.createdAt) >= thirtyDaysAgo
    ).length
    
    const newRentalsThisMonth = allRentals.filter(r => 
      new Date(r.createdAt) >= thirtyDaysAgo
    ).length
    
    return {
      users: {
        total: totalUsers,
        storeOwners,
        brandOwners,
        active: activeUsers,
        newThisMonth: newUsersThisMonth,
      },
      rentals: {
        total: totalRentals,
        active: activeRentals,
        completed: completedRentals,
        newThisMonth: newRentalsThisMonth,
        completionRate: totalRentals > 0 ? Math.round((completedRentals / totalRentals) * 100) : 0,
      },
      shelves: {
        total: totalShelves,
        available: availableShelves,
        rented: rentedShelves,
        utilizationRate: totalShelves > 0 ? Math.round((rentedShelves / totalShelves) * 100) : 0,
      },
      revenue: {
        total: totalRevenue,
        monthly: monthlyRevenue,
        platformFeeTotal: platformFee,
        platformFeeMonthly: monthlyPlatformFee,
        averagePerRental: totalRentals > 0 ? totalRevenue / totalRentals : 0,
      },
      reviews: {
        total: totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        fiveStarPercentage: totalReviews > 0 
          ? Math.round((allReviews.filter(r => r.rating === 5).length / totalReviews) * 100)
          : 0,
      },
    }
  },
})