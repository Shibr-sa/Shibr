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
    commercialRegister: v.optional(v.string()),
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
      commercialRegister: args.commercialRegister,
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