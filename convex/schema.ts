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
    businessRegistration: v.optional(v.string()), // Commercial registration or freelance document number
    businessRegistrationDocumentId: v.optional(v.string()), // File ID for the document
    businessRegistrationDocumentUrl: v.optional(v.string()), // URL for the document
    
    // Store-specific data
    storeType: v.optional(v.string()),
    brandType: v.optional(v.string()), // For brand owners
    isFreelance: v.optional(v.boolean()),
    website: v.optional(v.string()),
    ownerName: v.optional(v.string()),
    storeLogo: v.optional(v.string()),
    
    // Profile image
    profileImageId: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    
    // Store data completion status
    storeDataComplete: v.optional(v.boolean()),
    
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
  
  paymentMethods: defineTable({
    userId: v.id("users"),
    bankName: v.string(),
    accountName: v.string(),
    accountNumber: v.string(),
    iban: v.string(),
    isVirtual: v.boolean(),
    isActive: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"]),
  
  shelves: defineTable({
    // Owner information
    ownerId: v.id("users"),
    
    // Basic shelf information
    shelfName: v.string(),
    city: v.string(),
    branch: v.string(),
    
    // Pricing
    monthlyPrice: v.number(),
    discountPercentage: v.number(),
    finalPrice: v.optional(v.number()), // Price after platform fee
    
    // Availability
    availableFrom: v.string(),
    isAvailable: v.boolean(),
    
    // Dimensions
    length: v.string(),
    width: v.string(),
    depth: v.string(),
    
    // Optional details
    productType: v.optional(v.string()),
    description: v.optional(v.string()),
    
    // Location
    address: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    
    // Images (will store file IDs from storage)
    exteriorImage: v.optional(v.string()),
    interiorImage: v.optional(v.string()),
    shelfImage: v.optional(v.string()),
    
    // Status
    status: v.union(
      v.literal("pending"),    // Waiting for admin review
      v.literal("approved"),   // Approved and visible
      v.literal("rejected"),   // Rejected by admin
      v.literal("rented"),     // Currently rented
      v.literal("archived")    // Archived by owner
    ),
    
    // Rental information (when rented)
    renterId: v.optional(v.id("users")),
    rentalStartDate: v.optional(v.string()),
    rentalEndDate: v.optional(v.string()),
    rentalPrice: v.optional(v.number()),
    
    // Admin review
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
    
    // Timestamps
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_city", ["city"])
    .index("by_available", ["isAvailable"])
    .index("by_created_at", ["createdAt"]),
})

export default schema