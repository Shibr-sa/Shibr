import { v } from "convex/values"
import { query, mutation } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"

// Get platform settings for admin dashboard
export const getPlatformSettings = query({
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
    
    // Get all platform settings
    const settings = await ctx.db.query("platformSettings").collect()
    
    // Convert to object format for easier access
    const settingsObject: Record<string, any> = {}
    settings.forEach(setting => {
      settingsObject[setting.key] = setting.value
    })
    
    return {
      platformFeePercentage: settingsObject.platformFeePercentage || 8,
      minimumShelfPrice: settingsObject.minimumShelfPrice || 100,
      maximumDiscountPercentage: settingsObject.maximumDiscountPercentage || 50,
      ...settingsObject
    }
  },
});

// Get admin users list
export const getAdminUsers = query({
  args: {
    searchQuery: v.optional(v.string()),
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
    
    // Get all admin users
    let adminUsers = await ctx.db
      .query("userProfiles")
      .filter(q => q.eq(q.field("accountType"), "admin"))
      .collect()
    
    // Filter by search query if provided
    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase()
      adminUsers = adminUsers.filter(user =>
        user.fullName?.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      )
    }
    
    // Format the response
    return adminUsers.map(user => ({
      id: user._id,
      userId: user.userId,
      username: user.fullName,
      email: user.email,
      permission: user.adminRole || "support",
      status: user.isActive ? "active" : "inactive",
      createdAt: user.createdAt,
    }))
  },
});

// Add new admin user
export const addAdminUser = mutation({
  args: {
    email: v.string(),
    fullName: v.string(),
    adminRole: v.optional(v.union(
      v.literal("super_admin"),
      v.literal("support"),
      v.literal("finance"),
      v.literal("operations")
    )),
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
    
    // Check if email already exists
    const existingUser = await ctx.db
      .query("userProfiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first()
    
    if (existingUser) {
      if (existingUser.accountType === "admin") {
        throw new Error("This email is already registered as an admin")
      }
      
      // Upgrade existing user to admin
      await ctx.db.patch(existingUser._id, {
        accountType: "admin",
        adminRole: args.adminRole || "super_admin",
        permissions: ["all"],
        isVerified: true,
        updatedAt: new Date().toISOString(),
      })
      
      return {
        success: true,
        message: `User ${args.email} has been promoted to admin`,
      }
    }
    
    // For new users, they need to sign up first
    return {
      success: false,
      message: `User ${args.email} needs to sign up first, then can be promoted to admin`,
    }
  },
});

// Toggle admin user status
export const toggleAdminUserStatus = mutation({
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
});

// Delete admin user
export const deleteAdminUser = mutation({
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
    
    if (!adminProfile || adminProfile.accountType !== "admin" || adminProfile.adminRole !== "super_admin") {
      throw new Error("Unauthorized: Super admin access required")
    }

    // Prevent admin from deleting themselves
    if (userId === args.targetUserId) {
      throw new Error("Cannot delete your own admin account")
    }

    const targetProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .first()
    
    if (!targetProfile) {
      throw new Error("User profile not found")
    }

    // Delete the user profile
    await ctx.db.delete(targetProfile._id)
    
    // Delete the user account
    await ctx.db.delete(args.targetUserId)

    return { 
      success: true, 
      message: "Admin user deleted successfully"
    }
  },
});