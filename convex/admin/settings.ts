import { v } from "convex/values"
import { query, mutation, internalAction, internalMutation } from "../_generated/server"
import { getAuthUserId, createAccount } from "@convex-dev/auth/server"
import { getUserProfile } from "../profileHelpers"
import { requireAuthWithProfile } from "../helpers"
import { internal } from "../_generated/api"

// Get current admin profile
export const getCurrentAdminProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      // Return null instead of throwing to avoid console errors on signout
      return null
    }

    const profileData = await getUserProfile(ctx, userId)

    if (!profileData || profileData.type !== "admin") {
      // Return null instead of throwing to avoid console errors
      return null
    }

    const adminProfile = profileData.profile
    
    // Get the auth user for email, name, and image
    const authUser = await ctx.db.get(userId)
    
    // Profile image is now stored in users.image field as URL string
    const profileImageUrl = authUser?.image
    
    return {
      id: adminProfile._id,
      fullName: authUser?.name,
      email: authUser?.email,  // Get email from users table
      phoneNumber: authUser?.phone,
      adminRole: adminProfile.adminRole,
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
    const { userId, profileData } = await requireAuthWithProfile(ctx)

    if (profileData.type !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    const adminProfile = profileData.profile
    
    // Get current user for email comparison
    const currentUser = await ctx.db.get(userId)
    
    const updates: any = {}
    
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
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(adminProfile._id, updates)
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
      // Return default settings when not authenticated
      return {
        brandSalesCommission: 8,
        storeRentCommission: 10,
        updatedAt: new Date().toISOString(),
      }
    }

    const profileData = await getUserProfile(ctx, userId)

    if (!profileData || profileData.type !== "admin") {
      // Return default settings when not admin
      return {
        brandSalesCommission: 8,
        storeRentCommission: 10,
        updatedAt: new Date().toISOString(),
      }
    }

    // Get all platform settings
    const allSettings = await ctx.db.query("platformSettings").collect()

    // Return default values if database is empty
    if (allSettings.length === 0) {
      return {
        brandSalesCommission: 8,
        storeRentCommission: 10,
        updatedAt: new Date().toISOString(),
      }
    }

    // Convert key-value pairs to object
    const settings: any = {
      brandSalesCommission: 8,
      storeRentCommission: 10,
      updatedAt: new Date().toISOString(),
    }

    for (const setting of allSettings) {
      if (setting.key === "brandSalesCommission" ||
          setting.key === "storeRentCommission") {
        settings[setting.key] = setting.value
      }
      if (setting.updatedAt > settings.updatedAt) {
        settings.updatedAt = setting.updatedAt
      }
    }

    return settings
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
      // Return empty array instead of throwing
      return []
    }
    
    const profileData = await getUserProfile(ctx, userId)
    
    if (!profileData || profileData.type !== "admin") {
      // Return empty array instead of throwing
      return []
    }
    
    // Get all admin users
    let adminProfiles = await ctx.db
      .query("adminProfiles")
      .collect()

    // BATCH FETCH: Get all unique user IDs upfront (avoid N+1 queries)
    const userIds = [...new Set(adminProfiles.map(p => p.userId))];
    const users = await Promise.all(userIds.map(id => ctx.db.get(id)));
    const userMap = new Map(users.filter(u => u !== null).map(u => [u!._id.toString(), u!]));

    // Build admin users with user data using pre-fetched map
    const adminUsersWithEmails = adminProfiles.map(profile => {
      const authUser = userMap.get(profile.userId.toString());
      return {
        ...profile,
        email: authUser?.email,
        name: authUser?.name
      };
    });
    
    // Filter by search query if provided
    let filteredAdmins = adminUsersWithEmails
    if (args.searchQuery) {
      // Note: emails are already stored lowercase, only normalize search input
      const query = args.searchQuery.toLowerCase()
      filteredAdmins = adminUsersWithEmails.filter(user =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.includes(query)  // email already lowercase in DB
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
      createdAt: user._creationTime,
    }))
  },
});

// Create admin profile for a newly registered user
export const createAdminProfile = mutation({
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
    // Verify that the current user is an admin (the one creating the new admin)
    const { userId: currentUserId, profileData: currentProfileData } = await requireAuthWithProfile(ctx)

    if (currentProfileData.type !== "admin") {
      throw new Error("Unauthorized: Only admins can create admin accounts")
    }

    // Find the newly created user by email
    const allUsers = await ctx.db.query("users").collect()
    const newUser = allUsers.find(u => u.email === args.email)
    
    if (!newUser) {
      throw new Error("User not found. Make sure the account was created successfully.")
    }
    
    // Check if user already has an admin profile
    const existingProfile = await ctx.db
      .query("adminProfiles")
      .withIndex("by_user", (q) => q.eq("userId", newUser._id))
      .first()
    
    if (existingProfile) {
      throw new Error("This user is already an admin")
    }
    
    // Create new admin profile
    const profileId = await ctx.db.insert("adminProfiles", {
      userId: newUser._id,
      adminRole: args.adminRole || "super_admin",
      permissions: args.adminRole === "super_admin" ? ["all"] : ["limited"],
      isActive: true,
      department: undefined,
    })
    
    return {
      success: true,
      message: "Admin profile created successfully",
      profileId,
    }
  },
})

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
    const { profileData } = await requireAuthWithProfile(ctx)

    if (profileData.type !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    // Check if email already exists in users table
    const allUsers = await ctx.db.query("users").collect()
    const existingAuthUser = allUsers.find(u => u.email === args.email)
    
    if (existingAuthUser) {
      // Check if they have an admin profile
      const existingProfile = await ctx.db
        .query("adminProfiles")
        .withIndex("by_user", (q) => q.eq("userId", existingAuthUser._id))
        .first()
      
      if (existingProfile) {
        throw new Error("This email is already registered as an admin")
      }
      
      // Create admin profile for existing user
      await ctx.db.insert("adminProfiles", {
        userId: existingAuthUser._id,
        adminRole: args.adminRole || "super_admin",
        permissions: ["all"],
        isActive: true,
        department: "",
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
    const { userId, profileData } = await requireAuthWithProfile(ctx)

    if (profileData.type !== "admin") {
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
    
    const targetProfileData = await getUserProfile(ctx, args.targetUserId)

    if (!targetProfileData) {
      throw new Error("User profile not found")
    }

    const targetProfile = targetProfileData.profile

    // Toggle active status
    const newStatus = !targetProfile.isActive
    await ctx.db.patch(targetProfile._id, {
      isActive: newStatus,
    })

    return { 
      success: true, 
      message: `User ${newStatus ? "activated" : "deactivated"} successfully`,
      newStatus 
    }
  },
});

// Helper mutation to create admin profile (internal only)
export const createAdminProfileInternal = internalMutation({
  args: {
    userId: v.id("users"),
    adminRole: v.union(
      v.literal("super_admin"),
      v.literal("support"),
      v.literal("finance"),
      v.literal("operations")
    ),
  },
  handler: async (ctx, { userId, adminRole }) => {
    const profileId = await ctx.db.insert("adminProfiles", {
      userId,
      adminRole,
      permissions: adminRole === "super_admin" ? ["all"] : [],
      isActive: true,
      department: undefined,
    })

    return profileId
  },
})

// Helper query to check existing admins (internal only)
export const checkExistingAdmins = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existingAdmins = await ctx.db
      .query("adminProfiles")
      .collect()

    return existingAdmins
  },
})

// Seed initial super admin (for initial setup only)
export const seedInitialSuperAdmin = internalAction({
  args: {},
  handler: async (ctx): Promise<any> => {
    // Check if any admin exists
    const existingAdmins: any = await ctx.runMutation(internal.admin.settings.checkExistingAdmins)

    // Return the count for debugging
    if (existingAdmins.length > 0) {
      return {
        success: false,
        message: `Found ${existingAdmins.length} admin users. IDs: ${existingAdmins.map((a: any) => a._id).join(', ')}`,
        count: existingAdmins.length,
        admins: existingAdmins
      }
    }

    // Hard-coded admin credentials for initial setup
    const adminEmail = "it@shibr.io"
    const adminPassword = "wwadnj0aw2nc@!!"
    const adminName = "Shibr Admin"

    try {
      // Create account using Convex Auth's official API
      // This automatically handles password hashing with the correct algorithm (Scrypt)
      const { user, account } = await createAccount(ctx, {
        provider: "password",
        account: {
          id: adminEmail.toLowerCase(),
          secret: adminPassword, // Plain password - will be hashed automatically
        },
        profile: {
          email: adminEmail.toLowerCase(),
          emailVerificationTime: Date.now(),
          name: adminName,
          isAnonymous: false,
        },
      })

      // Create admin profile
      const profileId = await ctx.runMutation(internal.admin.settings.createAdminProfileInternal, {
        userId: user._id,
        adminRole: "super_admin",
      })

      return {
        success: true,
        message: `Super admin created successfully with email: ${adminEmail}`,
        userId: user._id,
        profileId,
        email: adminEmail
      }
    } catch (error) {
      console.error("Error creating super admin:", error)
      return {
        success: false,
        message: `Failed to create super admin: ${error}`,
        error: String(error)
      }
    }
  },
})

// Delete admin user
export const deleteAdminUser = mutation({
  args: {
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const { userId, profileData } = await requireAuthWithProfile(ctx)

    if (profileData.type !== "admin") {
      throw new Error("Unauthorized: Super admin access required")
    }

    const adminProfile = profileData.profile
    if (adminProfile.adminRole !== "super_admin") {
      throw new Error("Unauthorized: Super admin access required")
    }

    // Prevent admin from deleting themselves
    if (userId === args.targetUserId) {
      throw new Error("Cannot delete your own admin account")
    }

    const targetProfileData = await getUserProfile(ctx, args.targetUserId)

    if (!targetProfileData) {
      throw new Error("User profile not found")
    }

    const targetProfile = targetProfileData.profile

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

