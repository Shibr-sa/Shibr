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

    // Brand logo (required during signup)
    logo: v.optional(v.id("_storage")),

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

  // Store branches/locations
  branches: defineTable({
    storeProfileId: v.id("storeProfiles"),

    // Branch details
    branchName: v.string(),
    city: v.string(),

    // Location
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.string(),
    }),

    // Images - only exterior and interior for the branch
    images: v.optional(v.array(v.object({
      storageId: v.id("_storage"),
      type: v.union(
        v.literal("exterior"),
        v.literal("interior")
      ),
      order: v.number(),
    }))),

    // Status
    status: v.union(
      v.literal("active"),
      v.literal("inactive")
    ),

    // Store/QR Code fields
    qrCodeUrl: v.string(), // Full URL that QR code points to (uses branch _id)

    // Store analytics
    totalScans: v.number(), // QR scans + page views
    totalOrders: v.number(),
    totalRevenue: v.number(),
  })
    .index("by_store_profile", ["storeProfileId"])
    .index("by_city", ["city"])
    .index("by_store_city", ["storeProfileId", "city"]),

  // Shelves/Stores for marketplace
  shelves: defineTable({
    storeProfileId: v.id("storeProfiles"),
    branchId: v.optional(v.id("branches")),

    // Basic info
    shelfName: v.string(),
    description: v.optional(v.string()),

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
      v.literal("rented"),
      v.literal("suspended")
    ),

    // Metadata
    rating: v.optional(v.number()),
  })
    .index("by_store_profile", ["storeProfileId"])
    .index("by_branch", ["branchId"])
    .index("by_status", ["status"])
    .index("by_branch_status", ["branchId", "status"])
    .index("by_price", ["monthlyPrice"]),

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

    // Commission rates - array structure for flexibility
    commissions: v.array(v.object({
      type: v.union(v.literal("store"), v.literal("platform")),
      rate: v.number(),
    })),

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
      v.literal("refund") // Refund to brand
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
    transactionReference: v.optional(v.string()), // Tap charge/refund ID (unique payment identifier) - optional for failed payments
    paymentMethod: v.optional(v.string()), // card, apple_pay, etc

    // Tap transfer ID for payouts (store settlements)
    tapTransferId: v.optional(v.string()),

    // Transfer/Payout tracking (for store settlements)
    transferStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    )),
    transferredAt: v.optional(v.number()), // Unix timestamp - when payout was initiated

    // Payment status (simplified - only created after success)
    status: v.union(
      v.literal("completed"), // Payment succeeded
      v.literal("failed"), // Payment failed
      v.literal("refunded") // Payment was refunded
    ),

    // Dates
    paymentDate: v.number(), // Unix timestamp - when payment was completed
    processedDate: v.optional(v.number()), // Unix timestamp - when payment was processed
    settlementDate: v.optional(v.number()), // Unix timestamp - when funds were settled

    // Additional info
    description: v.optional(v.string()),
    failureReason: v.optional(v.string()), // Error message if status is "failed"
  })
    .index("by_rental", ["rentalRequestId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_transaction", ["transactionReference"])
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

  // Unified OTP verification table for both email and phone
  verificationOTP: defineTable({
    type: v.union(v.literal("email"), v.literal("phone")),
    identifier: v.string(), // Email address or phone number
    email: v.optional(v.string()), // Associated email for linking during signup
    otp: v.string(),
    expiresAt: v.number(), // Unix timestamp
    attempts: v.number(), // Number of verification attempts
    createdAt: v.number(), // Unix timestamp
    verified: v.optional(v.boolean()),
  })
    .index("by_type_identifier", ["type", "identifier"]),

  // Customer Orders from branch stores
  customerOrders: defineTable({
    branchId: v.id("branches"),

    // Customer information (guest checkout)
    customerName: v.optional(v.string()),
    customerPhone: v.string(),
    wafeqContactId: v.optional(v.string()),
    invoiceNumber: v.string(), // Wafeq invoice ID (required)

    // Order items
    items: v.array(v.object({
      productId: v.id("products"),
      productName: v.string(),
      price: v.number(),
      quantity: v.number(),
      subtotal: v.number(),
    })),

    // Order totals
    subtotal: v.number(), // Before tax
    taxAmount: v.optional(v.number()), // Tax amount
    taxRate: v.optional(v.number()), // Tax rate (0.15)
    total: v.number(), // With tax

    // Payment info
    paymentReference: v.optional(v.string()), // Tap charge ID
  })
    .index("by_branch", ["branchId"])
    .index("by_customer_phone", ["customerPhone"])
    .index("by_invoice_number", ["invoiceNumber"])
    .index("by_payment_reference", ["paymentReference"]), // For duplicate order prevention

  // Support Tickets (Contact Form Submissions)
  supportTickets: defineTable({
    // Contact information
    name: v.string(),
    email: v.string(),
    phone: v.string(),

    // Message details
    subject: v.union(
      v.literal("general"),
      v.literal("support"),
      v.literal("business"),
      v.literal("complaint")
    ),
    message: v.string(),

    // Status tracking
    status: v.union(
      v.literal("new"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed")
    ),

    // Admin assignment (optional)
    assignedToAdminId: v.optional(v.id("adminProfiles")),

    // Admin notes (optional)
    adminNotes: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_email", ["email"])
    .index("by_created_at", ["createdAt"])
    .index("by_assigned_admin", ["assignedToAdminId"]),
})

export default schema