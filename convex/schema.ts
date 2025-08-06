import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const schema = defineSchema({
  users: defineTable({
    // Basic user information
    email: v.string(),
    password: v.string(), // In production, this should be hashed
    fullName: v.string(),
    phoneNumber: v.string(),
    
    // Account type and role
    accountType: v.union(v.literal("store-owner"), v.literal("brand-owner"), v.literal("admin")),
    
    // Profile information
    storeName: v.optional(v.string()), // For store owners
    brandName: v.optional(v.string()), // For brand owners
    commercialRegister: v.optional(v.string()),
    
    // Account status
    isActive: v.boolean(),
    isEmailVerified: v.boolean(),
    
    // Timestamps
    createdAt: v.string(),
    updatedAt: v.string(),
    lastLoginAt: v.optional(v.string()),
    
    // Preferences
    preferredLanguage: v.union(v.literal("ar"), v.literal("en")),
  })
    .index("by_email", ["email"])
    .index("by_account_type", ["accountType"])
    .index("by_created_at", ["createdAt"]),
})

export default schema