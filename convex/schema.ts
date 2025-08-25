import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { authTables } from "@convex-dev/auth/server"

const schema = defineSchema({
  ...authTables,
  
  // User profiles for different account types
  userProfiles: defineTable({
    userId: v.id("users"), // Reference to auth user
    accountType: v.union(
      v.literal("store_owner"),
      v.literal("brand_owner"),
      v.literal("admin")
    ),
    
    // Common fields
    fullName: v.string(),
    phoneNumber: v.string(),
    email: v.string(),
    isVerified: v.boolean(),
    isActive: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
    
    // Store owner specific fields
    storeName: v.optional(v.string()),
    storeType: v.optional(v.string()), // grocery, pharmacy, etc.
    commercialRegisterNumber: v.optional(v.string()),
    commercialRegisterDocument: v.optional(v.id("_storage")),
    storeLocation: v.optional(v.object({
      city: v.string(),
      area: v.string(),
      address: v.string(),
      coordinates: v.optional(v.object({
        lat: v.number(),
        lng: v.number(),
      })),
    })),
    
    // Brand owner specific fields
    brandName: v.optional(v.string()),
    brandType: v.optional(v.string()), // Type of products/business (e.g., "Electronics", "Fashion")
    businessType: v.optional(v.union(
      v.literal("registered_company"),
      v.literal("freelancer")
    )),
    brandCommercialRegisterNumber: v.optional(v.string()),
    freelanceLicenseNumber: v.optional(v.string()),
    brandCommercialRegisterDocument: v.optional(v.id("_storage")),
    freelanceLicenseDocument: v.optional(v.id("_storage")),
    
    // Business verification documents
    vatNumber: v.optional(v.string()),
    vatCertificate: v.optional(v.id("_storage")),
    bankAccountInfo: v.optional(v.object({
      bankName: v.string(),
      accountNumber: v.string(),
      iban: v.string(),
    })),
    
    // Admin specific fields
    adminRole: v.optional(v.union(
      v.literal("super_admin"),
      v.literal("support"),
      v.literal("finance"),
      v.literal("operations")
    )),
    permissions: v.optional(v.array(v.string())),
  })
    .index("by_user", ["userId"])
    .index("by_account_type", ["accountType"])
    .index("by_email", ["email"])
    .index("by_phone", ["phoneNumber"])
    .index("by_account_type_active", ["accountType", "isActive"])
    .index("by_created", ["createdAt"]),
  
  // Shelves/Stores for marketplace
  shelves: defineTable({
    profileId: v.id("userProfiles"),
    
    // Basic info
    shelfName: v.string(),
    description: v.optional(v.string()),
    
    // Location
    city: v.string(),
    area: v.string(),
    branch: v.string(),
    address: v.optional(v.string()),
    coordinates: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
    })),
    
    // Shelf details
    shelfSize: v.object({
      width: v.number(),
      height: v.number(),
      depth: v.number(),
      unit: v.string(), // cm, m, etc.
    }),
    productType: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    footTraffic: v.optional(v.string()), // high, medium, low
    
    // Pricing
    monthlyPrice: v.number(),
    currency: v.string(),
    minimumRentalPeriod: v.number(), // in months
    storeCommission: v.optional(v.number()), // Store commission percentage on sales
    
    // Availability
    isAvailable: v.boolean(),
    availableFrom: v.string(),
    availableUntil: v.optional(v.string()),
    
    // Images
    shelfImage: v.optional(v.id("_storage")),
    exteriorImage: v.optional(v.id("_storage")),
    interiorImage: v.optional(v.id("_storage")),
    additionalImages: v.optional(v.array(v.id("_storage"))),
    
    // Status
    status: v.union(
      v.literal("draft"),
      v.literal("pending_approval"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("suspended")
    ),
    rejectionReason: v.optional(v.string()),
    
    // Metadata
    createdAt: v.string(),
    updatedAt: v.string(),
    views: v.number(),
    rating: v.optional(v.number()),
    totalRentals: v.number(),
  })
    .index("by_profile", ["profileId"])
    .index("by_status", ["status"])
    .index("by_city", ["city"])
    .index("by_availability", ["isAvailable"])
    .index("by_price", ["monthlyPrice"])
    .index("by_status_available", ["status", "isAvailable"])
    .index("by_created", ["createdAt"]),
  
  // Rental requests
  rentalRequests: defineTable({
    shelfId: v.id("shelves"),
    requesterId: v.id("users"), // The brand owner requesting
    requesterProfileId: v.optional(v.id("userProfiles")),
    ownerId: v.id("users"), // The store owner
    ownerProfileId: v.optional(v.id("userProfiles")),
    
    // Request details
    startDate: v.string(),
    endDate: v.string(),
    rentalPeriod: v.optional(v.number()), // in months
    monthlyPrice: v.number(),
    totalAmount: v.optional(v.number()),
    
    // Product details
    productType: v.string(),
    productDescription: v.string(),
    productCount: v.optional(v.number()),
    brandName: v.optional(v.string()),
    selectedProductIds: v.optional(v.array(v.id("products"))),
    selectedProductQuantities: v.optional(v.array(v.number())),
    
    // Status
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("payment_pending"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("expired")
    ),
    
    // Payment info
    paymentStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    )),
    paymentMethod: v.optional(v.string()),
    paymentReference: v.optional(v.string()),
    
    // Communication
    message: v.optional(v.string()),
    additionalNotes: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
    storeOwnerResponse: v.optional(v.string()),
    conversationId: v.optional(v.id("conversations")),
    
    // Metadata
    createdAt: v.string(),
    updatedAt: v.string(),
    acceptedAt: v.optional(v.string()),
    completedAt: v.optional(v.string()),
    expiresAt: v.optional(v.string()),
    respondedAt: v.optional(v.string()),
  })
    .index("by_shelf", ["shelfId"])
    .index("by_requester", ["requesterId"])
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_payment_status", ["paymentStatus"])
    .index("by_created", ["createdAt"])
    .index("by_owner_status", ["ownerId", "status"]),
  
  // Products managed by brand owners
  products: defineTable({
    ownerId: v.id("users"),
    profileId: v.optional(v.id("userProfiles")),
    
    name: v.string(),
    code: v.optional(v.string()),
    description: v.string(),
    category: v.string(),
    price: v.number(),
    cost: v.optional(v.number()),
    currency: v.string(),
    
    // Images
    mainImage: v.optional(v.id("_storage")),
    images: v.optional(v.array(v.id("_storage"))),
    imageUrl: v.optional(v.string()), // URL for external images
    
    // Stock info
    sku: v.optional(v.string()),
    barcode: v.optional(v.string()),
    quantity: v.optional(v.number()), // Available quantity
    stockQuantity: v.optional(v.number()),
    minQuantity: v.optional(v.number()),
    
    // Sales tracking
    totalSales: v.optional(v.number()),
    totalRevenue: v.optional(v.number()),
    shelfCount: v.optional(v.number()),
    
    // Status
    isActive: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_profile", ["profileId"])
    .index("by_category", ["category"])
    .index("by_active", ["isActive"]),
  
  // Conversations (chat system)
  conversations: defineTable({
    brandProfileId: v.id("userProfiles"),
    storeProfileId: v.id("userProfiles"),
    shelfId: v.id("shelves"),
    rentalRequestId: v.optional(v.id("rentalRequests")),
    
    status: v.union(
      v.literal("active"),
      v.literal("archived"),
      v.literal("rejected")
    ),
    
    brandUnreadCount: v.number(),
    storeUnreadCount: v.number(),
    
    lastMessageText: v.optional(v.string()),
    lastMessageTime: v.optional(v.string()),
    lastMessageSenderId: v.optional(v.id("users")),
    
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_brand_profile", ["brandProfileId"])
    .index("by_store_profile", ["storeProfileId"])
    .index("by_shelf", ["shelfId"])
    .index("by_rental_request", ["rentalRequestId"]),
  
  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    
    text: v.string(),
    messageType: v.optional(v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("rental_request"),
      v.literal("rental_accepted"),
      v.literal("rental_rejected"),
      v.literal("system")
    )),
    attachment: v.optional(v.id("_storage")),
    
    isRead: v.boolean(),
    readAt: v.optional(v.string()),
    
    createdAt: v.string(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_sender", ["senderId"]),
  
  // Notifications
  notifications: defineTable({
    userId: v.id("users"),
    
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("rental_request"),
      v.literal("rental_accepted"),
      v.literal("rental_rejected"),
      v.literal("rental_completed"),
      v.literal("rental_expired"),
      v.literal("payment_received"),
      v.literal("payment_confirmation"),
      v.literal("message"),
      v.literal("new_message"),
      v.literal("system")
    ),
    
    conversationId: v.optional(v.id("conversations")),
    rentalRequestId: v.optional(v.id("rentalRequests")),
    relatedId: v.optional(v.string()), // ID of related entity
    relatedType: v.optional(v.string()), // Type of related entity
    actionUrl: v.optional(v.string()), // URL to navigate to
    actionLabel: v.optional(v.string()), // Label for action button
    
    isRead: v.boolean(),
    readAt: v.optional(v.string()),
    
    createdAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_read", ["isRead"])
    .index("by_type", ["type"]),
  
  // Payment methods
  paymentMethods: defineTable({
    userId: v.id("users"),
    
    type: v.union(
      v.literal("credit_card"),
      v.literal("debit_card"),
      v.literal("bank_transfer"),
      v.literal("apple_pay"),
      v.literal("stc_pay")
    ),
    
    // Card details (encrypted)
    last4Digits: v.optional(v.string()),
    cardBrand: v.optional(v.string()),
    expiryMonth: v.optional(v.number()),
    expiryYear: v.optional(v.number()),
    
    // Bank details
    bankName: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
    iban: v.optional(v.string()),
    
    isDefault: v.boolean(),
    isActive: v.boolean(),
    
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_default", ["isDefault"]),
  
  // Platform settings (for admins)
  platformSettings: defineTable({
    key: v.string(),
    value: v.any(),
    description: v.optional(v.string()),
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.string(),
  })
    .index("by_key", ["key"]),
  
  // Files/Documents storage reference
  files: defineTable({
    storageId: v.id("_storage"),
    userId: v.id("users"),
    
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    
    purpose: v.union(
      v.literal("commercial_register"),
      v.literal("freelance_license"),
      v.literal("vat_certificate"),
      v.literal("shelf_image"),
      v.literal("product_image"),
      v.literal("chat_attachment"),
      v.literal("other")
    ),
    
    relatedId: v.optional(v.string()),
    relatedType: v.optional(v.string()),
    
    uploadedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_purpose", ["purpose"])
    .index("by_storage", ["storageId"]),
})

export default schema