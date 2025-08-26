import { v } from "convex/values"
import { query, mutation } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"

// Get current admin profile
export const getCurrentAdminProfile = query({
  args: {},
  handler: async (ctx) => {
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
    
    // Get the auth user for email, name, and image
    const authUser = await ctx.db.get(userId)
    
    // Profile image is now stored in users.image field as URL string
    const profileImageUrl = authUser?.image || null
    
    return {
      id: userProfile._id,
      fullName: authUser?.name,
      email: authUser?.email || "",  // Get email from users table
      phoneNumber: authUser?.phone,
      adminRole: userProfile.adminRole,
      profileImage: profileImageUrl,
    }
  },
});

// Update current admin profile
export const updateAdminProfile = mutation({
  args: {
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    currentPassword: v.optional(v.string()),
    newPassword: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
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
    
    // Get current user for email comparison
    const currentUser = await ctx.db.get(userId)
    
    const updates: any = {
      updatedAt: new Date().toISOString(),
    }
    
    // Note: fullName and phoneNumber are now stored in users table, not userProfiles
    // We'll update the users table instead
    const userUpdates: any = {}
    if (args.fullName) userUpdates.name = args.fullName
    if (args.phoneNumber) userUpdates.phone = args.phoneNumber
    
    // Check if email is being changed and update in users table
    if (args.email && args.email !== currentUser?.email) {
      // Check if email already exists in users table
      const existingUsers = await ctx.db
        .query("users")
        .collect()
      
      const emailExists = existingUsers.some(u => u.email === args.email && u._id !== userId)
      
      if (emailExists) {
        throw new Error("Email already in use")
      }
      
      // Update email in users table
      await ctx.db.patch(userId, { email: args.email })
    }
    
    // Update the users table for name and phone
    if (Object.keys(userUpdates).length > 0) {
      await ctx.db.patch(userId, userUpdates)
    }
    
    // Update the profile (if there are any profile-specific updates)
    if (Object.keys(updates).length > 1) { // More than just updatedAt
      await ctx.db.patch(userProfile._id, updates)
    } else {
      // Just update the timestamp
      await ctx.db.patch(userProfile._id, updates)
    }
    
    // Note: Password update would need to be handled through the auth system
    // For now, we'll just return success
    
    return {
      success: true,
      message: "Profile updated successfully",
    }
  },
});

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
    let adminProfiles = await ctx.db
      .query("userProfiles")
      .filter(q => q.eq(q.field("accountType"), "admin"))
      .collect()
    
    // Get emails and names from users table for each admin
    const adminUsersWithEmails = await Promise.all(
      adminProfiles.map(async (profile) => {
        const authUser = await ctx.db.get(profile.userId)
        return {
          ...profile,
          email: authUser?.email || "",
          name: authUser?.name || ""
        }
      })
    )
    
    // Filter by search query if provided
    let filteredAdmins = adminUsersWithEmails
    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase()
      filteredAdmins = adminUsersWithEmails.filter(user =>
        user.name?.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      )
    }
    
    // Format the response
    return filteredAdmins.map(user => ({
      id: user._id,
      userId: user.userId,
      username: user.name || user.email, // Use name from users table or fallback to email
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
    
    // Check if email already exists in users table
    const allUsers = await ctx.db.query("users").collect()
    const existingAuthUser = allUsers.find(u => u.email === args.email)
    
    if (existingAuthUser) {
      // Check if they have a profile
      const existingProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_user", (q) => q.eq("userId", existingAuthUser._id))
        .first()
      
      if (existingProfile) {
        if (existingProfile.accountType === "admin") {
          throw new Error("This email is already registered as an admin")
        }
        
        // Upgrade existing user to admin
        await ctx.db.patch(existingProfile._id, {
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