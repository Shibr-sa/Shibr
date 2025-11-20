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

    // Rating and reviews
    averageRating: v.optional(v.number()),
    totalRatings: v.optional(v.number()),
    ratingSum: v.optional(v.number()),
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

    // Rating and reviews
    rating: v.optional(v.number()), // Legacy field (same as averageRating)
    averageRating: v.optional(v.number()),
    totalRatings: v.optional(v.number()),
    ratingSum: v.optional(v.number()),
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
      v.literal("pending_admin_approval"), // Brand created, awaiting admin review
      v.literal("pending"), // Admin approved, awaiting store response
      v.literal("payment_pending"), // Store accepted, awaiting brand payment
      v.literal("awaiting_shipment"), // Payment completed, awaiting brand to ship products
      v.literal("shipment_sent"), // Brand shipped products, awaiting store confirmation
      v.literal("active"), // Rental period active
      v.literal("completed"), // Rental period completed
      v.literal("cancelled"),
      v.literal("rejected"),
      v.literal("expired")
    ),

    // Admin approval fields
    adminReviewedBy: v.optional(v.id("users")), // Admin who reviewed the request
    adminReviewedAt: v.optional(v.number()), // Unix timestamp of admin review
    adminApprovedCommission: v.optional(v.number()), // Platform commission % set by admin for this request
    adminRejectionReason: v.optional(v.string()), // Reason if admin rejected the request

    // Initial product shipping (Brand → Store)
    initialShipment: v.optional(v.object({
      // Shipping details
      carrier: v.string(), // Shipping company name
      trackingNumber: v.string(), // Tracking number
      shippedAt: v.number(), // Unix timestamp when brand shipped
      shippedBy: v.id("users"), // User who initiated shipping
      expectedDeliveryDate: v.optional(v.string()), // Expected delivery date
      notes: v.optional(v.string()), // Shipping notes from brand

      // Store confirmation
      receivedAt: v.optional(v.number()), // Unix timestamp when store confirmed receipt
      receivedBy: v.optional(v.id("users")), // User who confirmed receipt
      receivedCondition: v.optional(v.string()), // Condition: "good", "damaged", etc.
      receiptPhotos: v.optional(v.array(v.string())), // Storage IDs for photos
      confirmationNotes: v.optional(v.string()), // Notes from store upon receipt
    })),

    // Post-rental clearance workflow
    clearanceStatus: v.optional(v.union(
      v.literal("not_started"),
      v.literal("pending_inventory_check"),
      v.literal("pending_return_shipment"),
      v.literal("return_shipped"),
      v.literal("return_received"),
      v.literal("pending_settlement"),
      v.literal("settlement_approved"),
      v.literal("payment_completed"),
      v.literal("closed")
    )),
    clearanceInitiatedAt: v.optional(v.number()),
    clearanceInitiatedBy: v.optional(v.id("users")),
    clearanceCompletedAt: v.optional(v.number()),

    // Inventory snapshot at rental end
    finalProductSnapshot: v.optional(v.array(v.object({
      productId: v.id("products"),
      productName: v.string(),
      productNameAr: v.string(),
      initialQuantity: v.number(), // At rental start
      soldQuantity: v.number(),    // During rental
      remainingQuantity: v.number(), // To be returned
      unitPrice: v.number(),
      totalSalesValue: v.number(),
      totalSalesWithTax: v.number(),
    }))),

    // Return shipping (Store → Brand)
    returnShipment: v.optional(v.object({
      carrier: v.string(),
      trackingNumber: v.string(),
      shippedAt: v.number(),
      shippedBy: v.id("users"),
      expectedDeliveryDate: v.optional(v.string()),
      notes: v.optional(v.string()),

      receivedAt: v.optional(v.number()),
      receivedBy: v.optional(v.id("users")),
      condition: v.optional(v.string()),
      receiptPhotos: v.optional(v.array(v.string())),
      confirmationNotes: v.optional(v.string()),
    })),

    // Financial settlement
    settlementCalculation: v.optional(v.object({
      totalSales: v.number(),
      totalSalesWithTax: v.number(),

      platformCommissionRate: v.number(),
      platformCommissionAmount: v.number(),

      storeCommissionRate: v.number(),
      storeCommissionAmount: v.number(),

      storePayoutAmount: v.number(), // Store's commission from sales

      returnInventoryValue: v.number(), // Value of unsold products
      brandTotalAmount: v.number(), // Sales revenue - commissions

      calculatedAt: v.number(),
      calculatedBy: v.id("users"),
      approvedAt: v.optional(v.number()),
      approvedBy: v.optional(v.id("users")),
    })),

    clearanceDocumentId: v.optional(v.string()), // Convex storage ID

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

    // Clearance-related fields (for store_settlement payments)
    clearanceId: v.optional(v.id("rentalClearances")),

    settlementBreakdown: v.optional(v.object({
      totalSalesAmount: v.number(),
      totalSalesWithTax: v.number(),

      platformCommissionRate: v.number(),
      platformCommissionAmount: v.number(),

      storeCommissionRate: v.number(),
      storeCommissionAmount: v.number(),

      netPayoutToStore: v.number(),
    })),

    receiptFileId: v.optional(v.string()), // Admin upload
    receiptUploadedBy: v.optional(v.id("users")),
    receiptUploadedAt: v.optional(v.number()),
  })
    .index("by_rental", ["rentalRequestId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_transaction", ["transactionReference"])
    .index("by_payment_date", ["paymentDate"])
    .index("by_type_status", ["type", "status"])
    .index("by_from_profile", ["fromProfileId"])
    .index("by_to_profile", ["toProfileId"]),

  // Rental clearance workflow tracking
  rentalClearances: defineTable({
    rentalRequestId: v.id("rentalRequests"),
    status: v.union(
      v.literal("initiated"),
      v.literal("inventory_confirmed"),
      v.literal("return_shipped"),
      v.literal("return_received"),
      v.literal("settlement_calculated"),
      v.literal("settlement_approved"),
      v.literal("payment_completed"),
      v.literal("closed")
    ),

    initiatedBy: v.id("users"),
    initiatedAt: v.number(),

    // Timeline tracking
    inventoryConfirmedAt: v.optional(v.number()),
    returnShippedAt: v.optional(v.number()),
    returnReceivedAt: v.optional(v.number()),
    settlementCalculatedAt: v.optional(v.number()),
    settlementApprovedAt: v.optional(v.number()),
    paymentCompletedAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),

    // Payment references
    settlementPaymentIds: v.optional(v.array(v.id("payments"))),

    // Document
    clearanceDocumentId: v.optional(v.string()),
    documentGeneratedAt: v.optional(v.number()),

    // Notes and issues
    notes: v.optional(v.string()),
    discrepancies: v.optional(v.array(v.object({
      productId: v.id("products"),
      issue: v.string(),
      expectedQty: v.number(),
      actualQty: v.number(),
      resolution: v.optional(v.string()),
    }))),
  })
    .index("by_rental", ["rentalRequestId"])
    .index("by_status", ["status"])
    .index("by_initiated_at", ["initiatedAt"])
    .searchIndex("search_rental", {
      searchField: "notes",
    }),

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

  // Reviews for rentals (stores rating brands and vice versa)
  reviews: defineTable({
    rentalRequestId: v.id("rentalRequests"),
    reviewerId: v.id("users"), // User who submitted the review
    reviewerType: v.union(v.literal("store_owner"), v.literal("brand_owner")),
    revieweeId: v.id("users"), // User being reviewed
    rating: v.number(), // 1-5 stars
    createdAt: v.number(), // Timestamp
  })
    .index("by_rental_request", ["rentalRequestId"])
    .index("by_reviewer", ["reviewerId"])
    .index("by_reviewee", ["revieweeId"])
    .index("by_rental_and_reviewer", ["rentalRequestId", "reviewerId"]), // Prevent duplicate reviews

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