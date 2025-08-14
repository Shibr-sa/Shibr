import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Create an admin user
export const createAdminUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    fullName: v.string(),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if admin already exists with this email
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first()

    if (existingUser) {
      throw new Error("User with this email already exists")
    }

    // Check if any admin user exists (optional: limit to one admin)
    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_account_type", (q) => q.eq("accountType", "admin"))
      .first()

    if (existingAdmin) {
      console.warn("An admin user already exists. Creating additional admin.")
    }

    // Create the admin user
    const adminId = await ctx.db.insert("users", {
      email: args.email,
      password: args.password, // Note: In production, hash the password!
      fullName: args.fullName,
      phoneNumber: args.phoneNumber,
      accountType: "admin",
      isActive: true,
      isEmailVerified: true, // Admin accounts are pre-verified
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preferredLanguage: "ar", // Default to Arabic for Saudi market
    })

    return {
      id: adminId,
      email: args.email,
      fullName: args.fullName,
      accountType: "admin",
      message: "Admin user created successfully"
    }
  },
})

// Seed default admin user (for development)
export const seedDefaultAdmin = mutation({
  handler: async (ctx) => {
    // Check if admin already exists
    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_account_type", (q) => q.eq("accountType", "admin"))
      .first()

    if (existingAdmin) {
      return {
        message: "Admin user already exists",
        email: existingAdmin.email
      }
    }

    // Create default admin
    const adminId = await ctx.db.insert("users", {
      email: "admin@shibr.sa",
      password: "Admin@123", // CHANGE THIS IN PRODUCTION!
      fullName: "مدير النظام",
      phoneNumber: "0500000000",
      accountType: "admin",
      isActive: true,
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preferredLanguage: "ar",
    })

    return {
      id: adminId,
      message: "Default admin user created successfully",
      email: "admin@shibr.sa",
      warning: "IMPORTANT: Change the default password immediately!"
    }
  },
})

// Get admin statistics (for admin dashboard)
export const getAdminStats = query({
  handler: async (ctx) => {
    // Get counts for different user types
    const storeOwners = await ctx.db
      .query("users")
      .withIndex("by_account_type", (q) => q.eq("accountType", "store-owner"))
      .collect()

    const brandOwners = await ctx.db
      .query("users")
      .withIndex("by_account_type", (q) => q.eq("accountType", "brand-owner"))
      .collect()

    // Get shelf statistics
    const allShelves = await ctx.db.query("shelves").collect()
    const availableShelves = allShelves.filter(s => s.isAvailable && s.status === "approved")
    const rentedShelves = allShelves.filter(s => s.status === "rented")
    const pendingShelves = allShelves.filter(s => s.status === "pending")

    // Get rental request statistics
    const rentalRequests = await ctx.db.query("rentalRequests").collect()
    const activeRentals = rentalRequests.filter(r => r.status === "active")
    const pendingRequests = rentalRequests.filter(r => r.status === "pending")

    // Calculate revenue (simplified - in production, track actual transactions)
    const totalRevenue = activeRentals.reduce((sum, rental) => sum + (rental.totalPrice || 0), 0)
    const platformFee = totalRevenue * 0.08 // 8% platform fee

    return {
      users: {
        totalUsers: storeOwners.length + brandOwners.length,
        storeOwners: storeOwners.length,
        brandOwners: brandOwners.length,
        activeUsers: [...storeOwners, ...brandOwners].filter(u => u.isActive).length,
        verifiedUsers: [...storeOwners, ...brandOwners].filter(u => u.isEmailVerified).length,
      },
      shelves: {
        total: allShelves.length,
        available: availableShelves.length,
        rented: rentedShelves.length,
        pending: pendingShelves.length,
      },
      rentals: {
        active: activeRentals.length,
        pending: pendingRequests.length,
        total: rentalRequests.length,
      },
      revenue: {
        totalRevenue,
        platformFee,
        netRevenue: totalRevenue - platformFee,
      },
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
    
    if (user.accountType !== "admin") {
      return { isAdmin: false, error: "Access denied: Admin privileges required" }
    }
    
    if (!user.isActive) {
      return { isAdmin: false, error: "Account is not active" }
    }
    
    return { 
      isAdmin: true, 
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
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
    if (!user || user.accountType !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    const { adminUserId, ...settings } = args

    // Get existing settings or create new
    const existingSettings = await ctx.db.query("platformSettings").first()
    
    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, {
        ...settings,
        updatedAt: new Date().toISOString(),
      })
    } else {
      await ctx.db.insert("platformSettings", {
        platformFeePercentage: settings.platformFeePercentage || 8,
        minimumShelfPrice: settings.minimumShelfPrice || 500,
        maximumDiscountPercentage: settings.maximumDiscountPercentage || 50,
        updatedAt: new Date().toISOString(),
      })
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
    const user = await ctx.db.get(args.adminUserId)
    if (!user || user.accountType !== "admin") {
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

    // Create notification for the shelf owner
    await ctx.db.insert("notifications", {
      userId: shelf.ownerId,
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
    if (!admin || admin.accountType !== "admin") {
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

    // Toggle active status
    const newStatus = !targetUser.isActive
    await ctx.db.patch(args.targetUserId, {
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