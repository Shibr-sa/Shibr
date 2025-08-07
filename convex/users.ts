import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Create a new user during signup
export const createUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    fullName: v.string(),
    phoneNumber: v.string(),
    accountType: v.union(v.literal("store-owner"), v.literal("brand-owner")),
    storeName: v.optional(v.string()),
    brandName: v.optional(v.string()),
    businessRegistration: v.optional(v.string()),
    preferredLanguage: v.union(v.literal("ar"), v.literal("en")),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first()

    if (existingUser) {
      throw new Error("User with this email already exists")
    }

    // Create the new user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      password: args.password, // Note: In production, hash the password!
      fullName: args.fullName,
      phoneNumber: args.phoneNumber,
      accountType: args.accountType,
      storeName: args.storeName,
      brandName: args.brandName,
      businessRegistration: args.businessRegistration,
      isActive: true,
      isEmailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preferredLanguage: args.preferredLanguage,
    })

    return userId
  },
})

// Get user by email (for login)
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first()

    return user
  },
})

// Verify user credentials (for login)
export const verifyUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first()

    if (!user) {
      throw new Error("Invalid email or password")
    }

    // Note: In production, use proper password hashing comparison
    if (user.password !== args.password) {
      throw new Error("Invalid email or password")
    }

    if (!user.isActive) {
      throw new Error("Account is not active")
    }

    // Update last login time
    await ctx.db.patch(user._id, {
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      accountType: user.accountType,
      storeName: user.storeName,
      brandName: user.brandName,
      preferredLanguage: user.preferredLanguage,
    }
  },
})

// Get all users (for admin)
export const getAllUsers = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect()
    return users
  },
})

// Get users by account type
export const getUsersByType = query({
  args: {
    accountType: v.union(v.literal("store-owner"), v.literal("brand-owner"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_account_type", (q) => q.eq("accountType", args.accountType))
      .collect()
    return users
  },
})

// Update store data
export const updateStoreData = mutation({
  args: {
    userId: v.id("users"),
    storeName: v.optional(v.string()),
    storeType: v.optional(v.string()),
    businessRegistration: v.optional(v.string()),
    isFreelance: v.optional(v.boolean()),
    website: v.optional(v.string()),
    ownerName: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    storeLogo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updateData } = args;
    
    // Check if essential fields are complete
    const storeDataComplete = Boolean(
      updateData.storeName &&
      updateData.storeType &&
      (updateData.businessRegistration || updateData.isFreelance) &&
      updateData.phoneNumber
    );
    
    // Update the user record
    await ctx.db.patch(userId, {
      ...updateData,
      storeDataComplete,
      updatedAt: new Date().toISOString(),
    });
    
    return { success: true, storeDataComplete };
  },
})

// Get user by ID
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    if (!user) return null;
    
    // Don't send password to client
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
})

// Check store data completion status
export const checkStoreDataComplete = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    if (!user) return false;
    
    // Check if essential fields are complete
    const storeDataComplete = Boolean(
      user.storeName &&
      user.storeType &&
      (user.businessRegistration || user.isFreelance) &&
      user.phoneNumber
    );
    
    return storeDataComplete;
  },
})

// Check brand data completion status
export const checkBrandDataComplete = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    if (!user) return false;
    
    // Check if essential fields are complete
    const brandDataComplete = Boolean(
      user.brandName &&
      user.brandType &&
      user.businessRegistration &&
      user.phoneNumber
    );
    
    return brandDataComplete;
  },
})

// Update general settings
export const updateGeneralSettings = mutation({
  args: {
    userId: v.id("users"),
    ownerName: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    email: v.optional(v.string()),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updateData } = args;
    
    // Filter out undefined values
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );
    
    // Update the user record
    await ctx.db.patch(userId, {
      ...filteredData,
      updatedAt: new Date().toISOString(),
    });
    
    return { success: true };
  },
})

// Update brand data (for brand owners)
export const updateBrandData = mutation({
  args: {
    userId: v.id("users"),
    brandName: v.optional(v.string()),
    brandType: v.optional(v.string()),
    businessRegistration: v.optional(v.string()),
    isFreelance: v.optional(v.boolean()),
    website: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updateData } = args
    
    // Get the current user data
    const user = await ctx.db.get(userId)
    if (!user) throw new Error("User not found")
    
    // Merge update data with existing data
    const updatedUser = {
      ...user,
      ...updateData,
    }
    
    // Check if essential fields are complete
    const brandDataComplete = Boolean(
      updatedUser.brandName &&
      updatedUser.brandType &&
      updatedUser.businessRegistration &&
      updatedUser.phoneNumber
    )
    
    await ctx.db.patch(userId, {
      ...updateData,
      brandDataComplete,
      updatedAt: new Date().toISOString(),
    })
    
    return { success: true, brandDataComplete }
  },
})

// Update profile image
export const updateProfileImage = mutation({
  args: {
    userId: v.id("users"),
    profileImageId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, profileImageId } = args;
    
    // Get the URL for the uploaded image
    const imageUrl = await ctx.storage.getUrl(profileImageId);
    
    if (!imageUrl) {
      throw new Error("Failed to get image URL");
    }
    
    // Update the user record with the new image URL
    await ctx.db.patch(userId, {
      profileImageId,
      profileImageUrl: imageUrl,
      updatedAt: new Date().toISOString(),
    });
    
    return imageUrl;
  },
})

// Update business registration document
export const updateBusinessRegistrationDocument = mutation({
  args: {
    userId: v.id("users"),
    documentId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, documentId } = args;
    
    // Get the URL for the uploaded document
    const documentUrl = await ctx.storage.getUrl(documentId);
    
    if (!documentUrl) {
      throw new Error("Failed to get document URL");
    }
    
    // Update the user record with the new document URL
    await ctx.db.patch(userId, {
      businessRegistrationDocumentId: documentId,
      businessRegistrationDocumentUrl: documentUrl,
      updatedAt: new Date().toISOString(),
    });
    
    return documentUrl;
  },
})