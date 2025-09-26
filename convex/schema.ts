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
    businessCategory: v.string(), // grocery, pharmacy, etc.
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
    storeCommission: v.number(), // Store commission percentage on sales

    // Availability
    availableFrom: v.number(), // Unix timestamp when shelf was first listed

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
    .index("by_price", ["monthlyPrice"])
    .index("by_status_city", ["status", "city"]),

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
    storeCommission: v.number(), // Store commission percentage on sales

    // Product details - REQUIRED (empty array if no products)
    selectedProducts: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
      name: v.string(),
      price: v.number(),
      category: v.string()
    })),

    // Simplified status (no "accepted")
    status: v.union(
      v.literal("pending"),
      v.literal("payment_pending"), // Replaces old "accepted"
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("rejected"),
      v.literal("expired")
    ),

    // Communication
    conversationId: v.optional(v.id("conversations"))
  })
    .index("by_shelf", ["shelfId"])
    .index("by_brand", ["brandProfileId"])
    .index("by_store", ["storeProfileId"])
    .index("by_status", ["status"])
    .index("by_store_status", ["storeProfileId", "status"])
    .index("by_brand_status", ["brandProfileId", "status"])
    .index("by_shelf_status", ["shelfId", "status"])
    .index("by_date_range", ["startDate", "endDate"]),

  // Products managed by brand owners
  products: defineTable({
    brandProfileId: v.id("brandProfiles"),

    name: v.string(),
    sku: v.optional(v.string()),
    description: v.string(),
    category: v.string(),
    price: v.number(),

    // Images
    imageUrl: v.optional(v.string()), // URL for external images

    // Stock info
    stockQuantity: v.optional(v.number()),

    // Sales tracking
    totalSales: v.optional(v.number()),
    totalRevenue: v.optional(v.number()),
  })
    .index("by_brand_profile", ["brandProfileId"])
    .index("by_category", ["category"])
    .index("by_brand_category", ["brandProfileId", "category"]),

  // Conversations (chat system)
  conversations: defineTable({
    brandProfileId: v.id("brandProfiles"),
    storeProfileId: v.id("storeProfiles"),
    shelfId: v.id("shelves"),

    status: v.union(
      v.literal("active"),
      v.literal("archived")
    ),

    brandUnreadCount: v.number(),
    storeUnreadCount: v.number(),
  })
    .index("by_brand_profile", ["brandProfileId"])
    .index("by_store_profile", ["storeProfileId"])
    .index("by_shelf", ["shelfId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderType: v.union(
      v.literal("brand"),
      v.literal("store"),
      v.literal("system")
    ),
    senderId: v.union(
      v.id("brandProfiles"),
      v.id("storeProfiles")
    ),

    text: v.string(),
    messageType: v.union(
      v.literal("text"),
      v.literal("rental_request"),
      v.literal("rental_accepted"),
      v.literal("rental_rejected")
    ),

    isRead: v.boolean(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_conversation_read", ["conversationId", "isRead"]),

  // Bank accounts for receiving payouts from admin
  bankAccounts: defineTable({
    // Profile-based ownership (store and brand owners receive payouts)
    profileId: v.optional(v.union(
      v.id("storeProfiles"),
      v.id("brandProfiles")
    )),

    // Bank account details for receiving payouts
    bankName: v.string(), // Name of the bank
    accountHolderName: v.string(), // Account holder's name
    iban: v.string(), // IBAN for international transfers
    accountNumber: v.optional(v.string()), // Local account number if needed

    isDefault: v.boolean(),
    isActive: v.boolean(), // Whether this bank account is active
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
    platformFee: v.optional(v.number()), // Platform commission
    netAmount: v.optional(v.number()), // Amount after platform fee

    // Payment details
    invoiceNumber: v.string(),
    paymentMethod: v.optional(v.string()), // card, apple_pay
    transactionReference: v.optional(v.string()), // External payment reference

    // Tap specific fields
    tapChargeId: v.optional(v.string()), // Tap charge ID for incoming payments
    tapCustomerId: v.optional(v.string()), // Tap customer ID
    tapRefundId: v.optional(v.string()), // Tap refund ID if refunded
    tapTransferId: v.optional(v.string()), // Tap transfer ID for payouts
    paymentGateway: v.optional(v.literal("tap")), // Only Tap gateway allowed

    // Transfer/Payout tracking
    transferStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    )),
    transferredAt: v.optional(v.number()), // Unix timestamp - when payout was initiated

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
    .index("by_type_status", ["type", "status"])
    .index("by_from_profile", ["fromProfileId"])
    .index("by_to_profile", ["toProfileId"]),

  // Platform settings (for admins)
  platformSettings: defineTable({
    key: v.string(),
    value: v.any(),
    description: v.optional(v.string()),
    updatedByAdminId: v.optional(v.id("adminProfiles")),
    updatedAt: v.number(), // Unix timestamp
  })
    .index("by_key", ["key"]),

  // Email verification OTP (for signup only - no userId needed)
  emailVerificationOTP: defineTable({
    email: v.string(),
    otp: v.string(),
    expiresAt: v.number(), // Unix timestamp
    attempts: v.number(), // Number of verification attempts
    createdAt: v.number(), // Unix timestamp
    // Legacy fields - kept for backward compatibility with existing documents
    userId: v.optional(v.string()),
    verified: v.optional(v.boolean()),
  })
    .index("by_email", ["email"])
    .index("by_otp", ["otp"])
    .index("by_expires", ["expiresAt"]),

  // Shelf Stores (QR code-enabled stores for active rentals)
  shelfStores: defineTable({
    rentalRequestId: v.id("rentalRequests"), // Link to active rental
    shelfId: v.id("shelves"),
    storeProfileId: v.id("storeProfiles"),
    brandProfileId: v.id("brandProfiles"),

    // Store details
    storeName: v.string(), // Generated name for the store
    storeSlug: v.string(), // URL-friendly identifier
    description: v.optional(v.string()),

    // QR Code data
    qrCodeUrl: v.string(), // Full URL that QR code points to
    qrCodeImage: v.optional(v.id("_storage")), // Generated QR code image

    // Commission settings (inherited from rental)
    storeCommissionRate: v.number(), // Store's commission percentage
    platformFeeRate: v.number(), // Platform fee percentage

    // Store status
    isActive: v.boolean(),
    activatedAt: v.number(), // When store was activated
    deactivatedAt: v.optional(v.number()),

    // Analytics
    totalScans: v.number(),
    totalOrders: v.number(),
    totalRevenue: v.number(),
  })
    .index("by_rental", ["rentalRequestId"])
    .index("by_shelf", ["shelfId"])
    .index("by_store_profile", ["storeProfileId"])
    .index("by_brand_profile", ["brandProfileId"])
    .index("by_slug", ["storeSlug"])
    .index("by_active", ["isActive"]),

  // Customer Orders from shelf stores
  customerOrders: defineTable({
    shelfStoreId: v.id("shelfStores"),

    // Customer information (guest checkout)
    customerPhone: v.string(),

    // Order items
    items: v.array(v.object({
      productId: v.id("products"),
      productName: v.string(),
      price: v.number(),
      quantity: v.number(),
      subtotal: v.number(),
    })),

    // Order totals
    subtotal: v.number(),
    storeCommission: v.number(), // Amount for store owner
    platformFee: v.number(), // Platform commission
    brandRevenue: v.number(), // Amount for brand owner
    total: v.number(),

    // Payment info
    paymentMethod: v.union(
      v.literal("card"),
      v.literal("apple"), // Apple Pay
    ),
    paymentReference: v.optional(v.string()),

    // Order tracking
    orderNumber: v.string(), // Human-readable order number
  })
    .index("by_shelf_store", ["shelfStoreId"])
    .index("by_customer_phone", ["customerPhone"])
    .index("by_order_number", ["orderNumber"]),
})

export default schema