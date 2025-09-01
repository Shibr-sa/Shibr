import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { authTables } from "@convex-dev/auth/server"

const schema = defineSchema({
  ...authTables,
  
  // Store owner profile
  storeProfiles: defineTable({
    userId: v.id("users"), // Direct reference to auth user
    
    // Account status
    isActive: v.boolean(),
    
    // Store information
    storeName: v.string(),
    businessType: v.string(), // grocery, pharmacy, etc.
    commercialRegisterNumber: v.string(),
    commercialRegisterDocument: v.optional(v.id("_storage")),
    
    // Website
    website: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_active", ["isActive"]),
  
  // Brand owner profile
  brandProfiles: defineTable({
    userId: v.id("users"), // Direct reference to auth user
    
    // Account status
    isActive: v.boolean(),
    
    // Brand information
    brandName: v.optional(v.string()),
    businessCategory: v.optional(v.string()), // Type of products/business (e.g., "Electronics", "Food")
    businessType: v.optional(v.union(
      v.literal("registered_company"),
      v.literal("freelancer")
    )),
    
    // Business documents
    commercialRegisterNumber: v.optional(v.string()),
    freelanceLicenseNumber: v.optional(v.string()),
    commercialRegisterDocument: v.optional(v.id("_storage")),
    freelanceLicenseDocument: v.optional(v.id("_storage")),
    
    // Website
    website: v.optional(v.string()),
    
    // Rating
    rating: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_active", ["isActive"]),
  
  // Admin profile
  adminProfiles: defineTable({
    userId: v.id("users"), // Direct reference to auth user
    
    // Account status
    isActive: v.boolean(),
    
    // Admin role and permissions
    adminRole: v.union(
      v.literal("super_admin"),
      v.literal("support"),
      v.literal("finance"),
      v.literal("operations")
    ),
    permissions: v.array(v.string()),
    
    // Contact information
    phoneNumber: v.optional(v.string()),
    email: v.optional(v.string()),
    
    // Admin metadata
    department: v.optional(v.string()),
    lastActiveAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_role", ["adminRole"])
    .index("by_active", ["isActive"]),
  
  // Shelves/Stores for marketplace
  shelves: defineTable({
    storeProfileId: v.id("storeProfiles"),
    
    // Basic info
    shelfName: v.string(),
    description: v.optional(v.string()),
    
    // Location (denormalized for search performance)
    city: v.string(),
    storeBranch: v.string(),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(), // Actual street address (required)
    })),
    
    // Shelf details
    shelfSize: v.object({
      width: v.number(),
      height: v.number(),
      depth: v.number(),
      unit: v.string(), // cm, m, etc.
    }),
    productTypes: v.array(v.string()), // Array of product categories
    
    // Pricing
    monthlyPrice: v.number(),
    storeCommission: v.optional(v.number()), // Store commission percentage on sales
    
    // Availability
    isAvailable: v.boolean(),
    availableFrom: v.number(), // Unix timestamp
    
    // Images - consolidated into single array
    images: v.optional(v.array(v.object({
      storageId: v.id("_storage"),
      type: v.union(
        v.literal("shelf"),
        v.literal("exterior"),
        v.literal("interior"),
        v.literal("additional")
      ),
      order: v.number(),
    }))),
    
    // Status
    status: v.union(
      v.literal("active"),
      v.literal("suspended")
    ),
    
    // Metadata
    rating: v.optional(v.number()),
  })
    .index("by_store_profile", ["storeProfileId"])
    .index("by_status", ["status"])
    .index("by_city", ["city"])
    .index("by_availability", ["isAvailable"])
    .index("by_price", ["monthlyPrice"])
    .index("by_status_available", ["status", "isAvailable"])
    .index("by_city_available", ["city", "isAvailable", "status"]),
  
  // Rental requests
  rentalRequests: defineTable({
    shelfId: v.id("shelves"),
    brandProfileId: v.id("brandProfiles"),
    storeProfileId: v.id("storeProfiles"),
    
    // Request details
    startDate: v.number(), // Unix timestamp
    endDate: v.number(), // Unix timestamp
    monthlyPrice: v.number(),
    totalAmount: v.number(),
    
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
    storeOwnerResponse: v.optional(v.string()),
    conversationId: v.optional(v.id("conversations")),
    
    // Timestamps
    acceptedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    respondedAt: v.optional(v.number()),
  })
    .index("by_shelf", ["shelfId"])
    .index("by_brand", ["brandProfileId"])
    .index("by_store", ["storeProfileId"])
    .index("by_status", ["status"])
    .index("by_payment_status", ["paymentStatus"])
    .index("by_store_status", ["storeProfileId", "status"])
    .index("by_date_range", ["startDate", "endDate"]),
  
  // Products managed by brand owners
  products: defineTable({
    brandProfileId: v.id("brandProfiles"),
    
    name: v.string(),
    code: v.optional(v.string()),
    description: v.string(),
    category: v.string(),
    price: v.number(),
    cost: v.optional(v.number()),
    
    // Images
    mainImage: v.optional(v.id("_storage")),
    images: v.optional(v.array(v.id("_storage"))),
    imageUrl: v.optional(v.string()), // URL for external images
    
    // Stock info
    sku: v.optional(v.string()),
    barcode: v.optional(v.string()),
    stockQuantity: v.optional(v.number()),
    minQuantity: v.optional(v.number()),
    
    // Sales tracking
    totalSales: v.optional(v.number()),
    totalRevenue: v.optional(v.number()),
    shelfCount: v.optional(v.number()),
    
    // Status
    isActive: v.boolean(),
  })
    .index("by_brand_profile", ["brandProfileId"])
    .index("by_category", ["category"])
    .index("by_active", ["isActive"])
    .index("by_brand_active_category", ["brandProfileId", "isActive", "category"]),
  
  // Conversations (chat system)
  conversations: defineTable({
    brandProfileId: v.id("brandProfiles"),
    storeProfileId: v.id("storeProfiles"),
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
    lastMessageTime: v.optional(v.number()), // Unix timestamp
    lastMessageSenderType: v.optional(v.union(
      v.literal("brand"),
      v.literal("store"),
      v.literal("system")
    )),
  })
    .index("by_brand_profile", ["brandProfileId"])
    .index("by_store_profile", ["storeProfileId"])
    .index("by_shelf", ["shelfId"])
    .index("by_rental_request", ["rentalRequestId"]),
  
  messages: defineTable({
    conversationId: v.id("conversations"),
    senderType: v.union(
      v.literal("brand"),
      v.literal("store"),
      v.literal("system")
    ),
    senderId: v.optional(v.union(
      v.id("brandProfiles"),
      v.id("storeProfiles")
    )),
    
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
    readAt: v.optional(v.number()), // Unix timestamp
  })
    .index("by_conversation", ["conversationId"])
    .index("by_conversation_read", ["conversationId", "isRead"]),
  
  // Notifications
  notifications: defineTable({
    userId: v.id("users"), // Keep for quick user lookup
    profileId: v.optional(v.union(
      v.id("storeProfiles"),
      v.id("brandProfiles"),
      v.id("adminProfiles")
    )),
    profileType: v.union(
      v.literal("store"),
      v.literal("brand"),
      v.literal("admin")
    ),
    
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
    readAt: v.optional(v.number()), // Unix timestamp
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "isRead"])
    .index("by_profile", ["profileId"])
    .index("by_type", ["type"]),
  
  // Payment methods (bank accounts for receiving payments)
  paymentMethods: defineTable({
    // Profile-based ownership (store owners receive payments)
    profileId: v.optional(v.union(
      v.id("storeProfiles"),
      v.id("brandProfiles")
    )),
    
    // Bank account details for receiving payments
    bankName: v.string(), // Name of the bank
    accountHolderName: v.string(), // Account holder's name
    iban: v.string(), // IBAN for international transfers
    accountNumber: v.optional(v.string()), // Local account number if needed
    
    isDefault: v.boolean(),
    isActive: v.boolean(), // Whether this payment method is active
  })
    .index("by_profile", ["profileId"])
    .index("by_profile_default", ["profileId", "isDefault"]),
  
  // Payments/Transactions table
  payments: defineTable({
    rentalRequestId: v.id("rentalRequests"), // Reference to the rental
    
    // Payment type
    type: v.union(
      v.literal("brand_payment"), // Brand paying for shelf rental
      v.literal("store_settlement"), // Payment to store after rental completion
      v.literal("refund"), // Refund to brand
      v.literal("platform_fee") // Platform commission
    ),
    
    // Parties involved (using profile IDs)
    fromProfileId: v.optional(v.union(
      v.id("brandProfiles"),
      v.id("storeProfiles")
    )),
    toProfileId: v.optional(v.union(
      v.id("brandProfiles"),
      v.id("storeProfiles")
    )),
    
    // Amounts
    amount: v.number(), // Base amount
    platformFee: v.optional(v.number()), // Platform commission (8%)
    netAmount: v.optional(v.number()), // Amount after platform fee
    
    // Payment details
    invoiceNumber: v.string(),
    paymentMethod: v.optional(v.string()), // bank_transfer, credit_card, etc.
    transactionReference: v.optional(v.string()), // External payment reference
    
    // Status
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled"),
      v.literal("refunded")
    ),
    
    // Dates
    paymentDate: v.number(), // Unix timestamp - when payment was initiated
    processedDate: v.optional(v.number()), // Unix timestamp - when payment was processed
    settlementDate: v.optional(v.number()), // Unix timestamp - when funds were settled
    dueDate: v.optional(v.number()), // Unix timestamp - payment due date
    
    // Additional info
    description: v.optional(v.string()),
    notes: v.optional(v.string()),
    failureReason: v.optional(v.string()),
  })
    .index("by_rental", ["rentalRequestId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_invoice", ["invoiceNumber"])
    .index("by_payment_date", ["paymentDate"])
    .index("by_type_status", ["type", "status"]),
  
  // Platform settings (for admins)
  platformSettings: defineTable({
    key: v.string(),
    value: v.any(),
    description: v.optional(v.string()),
    updatedByAdminId: v.optional(v.id("adminProfiles")),
    updatedAt: v.number(), // Unix timestamp
  })
    .index("by_key", ["key"]),
  
  // Files/Documents storage reference
  files: defineTable({
    storageId: v.id("_storage"),
    uploadedByUserId: v.id("users"), // Who uploaded the file
    
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
    
    uploadedAt: v.number(), // Unix timestamp
  })
    .index("by_user", ["uploadedByUserId"])
    .index("by_purpose", ["purpose"])
    .index("by_storage", ["storageId"]),
})

export default schema