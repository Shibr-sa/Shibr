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
    brandDataComplete: v.optional(v.boolean()),
    
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
  
  // Chat conversations between brand and store owners
  conversations: defineTable({
    // Participants
    brandOwnerId: v.id("users"),
    storeOwnerId: v.id("users"),
    shelfId: v.id("shelves"),
    
    // Status
    status: v.union(
      v.literal("active"),      // Active conversation/rental
      v.literal("pending"),     // Rental request pending
      v.literal("rejected"),    // Rental request rejected
      v.literal("archived")     // Archived conversation
    ),
    
    // Last message info for quick preview
    lastMessageText: v.optional(v.string()),
    lastMessageTime: v.optional(v.string()),
    lastMessageSenderId: v.optional(v.id("users")),
    
    // Unread counts
    brandOwnerUnreadCount: v.number(),
    storeOwnerUnreadCount: v.number(),
    
    // Rental request details (if discussion)
    rentalRequestId: v.optional(v.id("rentalRequests")),
    
    // Timestamps
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_brand_owner", ["brandOwnerId"])
    .index("by_store_owner", ["storeOwnerId"])
    .index("by_shelf", ["shelfId"])
    .index("by_status", ["status"])
    .index("by_updated", ["updatedAt"]),
  
  // Individual chat messages
  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    
    // Message content
    text: v.string(),
    imageUrl: v.optional(v.string()),
    
    // Read status
    isRead: v.boolean(),
    readAt: v.optional(v.string()),
    
    // Message type
    messageType: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("rental_request"),
      v.literal("rental_accepted"),
      v.literal("rental_rejected"),
      v.literal("rental_activated"),
      v.literal("payment_confirmed"),
      v.literal("system")
    ),
    
    // Timestamps
    createdAt: v.string(),
  })
    .index("by_conversation", ["conversationId", "createdAt"])
    .index("by_sender", ["senderId"])
    .index("by_unread", ["conversationId", "isRead"]),
  
  // Rental requests
  rentalRequests: defineTable({
    conversationId: v.id("conversations"),
    shelfId: v.id("shelves"),
    brandOwnerId: v.id("users"),
    storeOwnerId: v.id("users"),
    
    // Request details
    startDate: v.string(),
    endDate: v.string(),
    productType: v.string(),
    productDescription: v.string(),
    productCount: v.number(),
    additionalNotes: v.optional(v.string()),
    
    // Pricing
    monthlyPrice: v.number(),
    totalPrice: v.number(),
    
    // Status
    status: v.union(
      v.literal("pending"),           // Request is pending review
      v.literal("accepted"),          // Request is accepted, awaiting payment
      v.literal("payment_pending"),   // Alias for accepted state
      v.literal("payment_processing"), // Payment is being verified
      v.literal("active"),            // Request is active after payment verified
      v.literal("rejected"),          // Request is rejected
      v.literal("expired")            // Request expired after 48 hours
    ),
    
    // Response from store owner
    storeOwnerResponse: v.optional(v.string()),
    respondedAt: v.optional(v.string()),
    
    // Payment tracking
    paymentAmount: v.optional(v.number()),
    paymentConfirmedAt: v.optional(v.string()),
    paymentVerifiedAt: v.optional(v.string()),
    paymentVerifiedBy: v.optional(v.id("users")),
    activatedAt: v.optional(v.string()),
    
    // Timestamps
    createdAt: v.string(),
    updatedAt: v.string(),
    expiresAt: v.string(), // 48 hours from creation
  })
    .index("by_brand_owner", ["brandOwnerId"])
    .index("by_store_owner", ["storeOwnerId"])
    .index("by_shelf", ["shelfId"])
    .index("by_status", ["status"])
    .index("by_conversation", ["conversationId"]),
  
  // Notifications
  notifications: defineTable({
    userId: v.id("users"),
    
    // Notification details
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("new_message"),
      v.literal("rental_request"),
      v.literal("rental_accepted"),
      v.literal("rental_rejected"),
      v.literal("rental_expired"),
      v.literal("rental_activated"),
      v.literal("payment_required"),
      v.literal("payment_confirmation"),
      v.literal("payment_received"),
      v.literal("system")
    ),
    
    // Related entities
    conversationId: v.optional(v.id("conversations")),
    rentalRequestId: v.optional(v.id("rentalRequests")),
    
    // Action button
    actionUrl: v.optional(v.string()),
    actionLabel: v.optional(v.string()),
    
    // Status
    isRead: v.boolean(),
    readAt: v.optional(v.string()),
    
    // Timestamps
    createdAt: v.string(),
  })
    .index("by_user", ["userId", "isRead"])
    .index("by_created", ["createdAt"])
    .index("by_type", ["type"]),
  
  // Platform settings (admin configurable)
  platformSettings: defineTable({
    platformFeePercentage: v.number(), // Platform fee percentage (e.g., 8%)
    minimumShelfPrice: v.number(), // Minimum allowed shelf price
    maximumDiscountPercentage: v.number(), // Maximum discount percentage allowed
    updatedAt: v.string(),
  }),
})

export default schema