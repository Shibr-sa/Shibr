import { v } from "convex/values"
import { internalMutation, query, mutation, action } from "./_generated/server"
import { api, internal } from "./_generated/api"
import { Doc, Id } from "./_generated/dataModel"
import { requireAuthWithProfile } from "./helpers"

// Type definition for settlement calculation result
type SettlementCalculation = {
  totalSales: number
  totalSalesWithTax: number
  totalSoldUnits: number
  totalReturnedUnits: number
  platformCommissionRate: number
  platformCommissionAmount: number
  storeCommissionRate: number
  storeCommissionAmount: number
  storePayoutAmount: number
  returnInventoryValue: number
  brandSalesRevenue: number
  brandTotalAmount: number
  breakdown: Doc<"rentalRequests">["finalProductSnapshot"]
}

/**
 * Helper function to calculate final inventory snapshot at rental end
 * Calculates sold vs remaining quantities for each product
 */
async function calculateFinalInventory(
  ctx: any,
  rental: Doc<"rentalRequests">
): Promise<Array<{
  productId: Id<"products">
  productName: string
  productNameAr: string
  initialQuantity: number
  soldQuantity: number
  remainingQuantity: number
  unitPrice: number
  totalSalesValue: number
  totalSalesWithTax: number
}>> {
  const snapshot = []

  for (const item of rental.selectedProducts) {
    // Get product details
    const product = await ctx.db.get(item.productId)
    if (!product) continue // Skip if product no longer exists

    // Get all customer orders during rental period
    const orders = await ctx.db
      .query("customerOrders")
      .filter((q: any) => q.and(
        q.gte(q.field("_creationTime"), rental.startDate),
        q.lte(q.field("_creationTime"), rental.endDate)
      ))
      .collect()

    // Calculate sold quantity for this product
    let soldQty = 0
    for (const order of orders) {
      const orderItem = order.items.find((i: any) => i.productId === item.productId)
      if (orderItem) {
        soldQty += orderItem.quantity
      }
    }

    // Calculate quantities and values
    const initialQty = (item as any).originalQuantity || item.quantity
    const remainingQty = Math.max(0, initialQty - soldQty)
    const unitPrice = product.price
    const salesValue = soldQty * unitPrice
    const salesWithTax = salesValue * 1.15 // 15% VAT

    snapshot.push({
      productId: item.productId,
      productName: product.name,
      productNameAr: product.nameAr,
      initialQuantity: initialQty,
      soldQuantity: soldQty,
      remainingQuantity: remainingQty,
      unitPrice: unitPrice,
      totalSalesValue: salesValue,
      totalSalesWithTax: salesWithTax,
    })
  }

  return snapshot
}

/**
 * Initiates clearance workflow when rental is completed
 * Calculates inventory snapshot and creates clearance record
 */
export const initiateClearance = internalMutation({
  args: {
    rentalRequestId: v.id("rentalRequests"),
  },
  handler: async (ctx, args) => {
    // 1. Get rental request
    const rental = await ctx.db.get(args.rentalRequestId)
    if (!rental) {
      throw new Error("Rental not found")
    }

    // 2. Get store profile to get userId
    const storeProfile = await ctx.db.get(rental.storeProfileId)
    if (!storeProfile) {
      throw new Error("Store profile not found")
    }

    // 3. Calculate inventory snapshot
    const inventorySnapshot = await calculateFinalInventory(ctx, rental)

    // 4. Update rental request with clearance initiation
    await ctx.db.patch(rental._id, {
      clearanceStatus: "pending_inventory_check",
      clearanceInitiatedAt: Date.now(),
      clearanceInitiatedBy: storeProfile.userId, // System initiates, attributed to store owner
      finalProductSnapshot: inventorySnapshot,
    })

    // 5. Create clearance record
    const clearanceId = await ctx.db.insert("rentalClearances", {
      rentalRequestId: rental._id,
      status: "initiated",
      initiatedBy: storeProfile.userId,
      initiatedAt: Date.now(),
    })

    // 5. TODO: Notify both parties about clearance initiation
    // await ctx.scheduler.runAfter(0, api.notifications.sendClearanceInitiated, {
    //   rentalRequestId: rental._id,
    //   clearanceId,
    //   brandProfileId: rental.brandProfileId,
    //   storeProfileId: rental.storeProfileId,
    // })

    return clearanceId
  }
})

/**
 * Query to calculate financial settlement for a completed rental
 * Returns commission breakdown and payout amounts for all parties
 */
export const calculateSettlement = query({
  args: { rentalRequestId: v.id("rentalRequests") },
  handler: async (ctx, args) => {
    // 1. Get rental and validate
    const rental = await ctx.db.get(args.rentalRequestId)
    if (!rental?.finalProductSnapshot) {
      throw new Error("Inventory snapshot not available")
    }

    const snapshot = rental.finalProductSnapshot

    // 2. Calculate total sales (pre-tax and with-tax)
    const totalSales = snapshot.reduce((sum, item) =>
      sum + item.totalSalesValue, 0
    )
    const totalSalesWithTax = snapshot.reduce((sum, item) =>
      sum + item.totalSalesWithTax, 0
    )

    // 3. Get commission rates with proper fallbacks
    const platformRate = rental.adminApprovedCommission
      ?? rental.commissions?.find(c => c.type === "platform")?.rate
      ?? 22

    const storeRate = rental.commissions?.find(c =>
      c.type === "store"
    )?.rate ?? 10

    // 4. Calculate commissions (on pre-tax amount)
    const platformCommission = (totalSales * platformRate) / 100
    const storeCommission = (totalSales * storeRate) / 100

    // 5. Store receives their commission as payout
    const storePayoutAmount = storeCommission

    // 6. Brand receives sales revenue minus all commissions
    const brandSalesRevenue = totalSales - platformCommission - storeCommission

    // 7. Calculate value of products being returned
    const returnValue = snapshot.reduce((sum, item) =>
      sum + (item.remainingQuantity * item.unitPrice), 0
    )

    // 8. Brand total = sales revenue + returned inventory
    const brandTotalAmount = brandSalesRevenue + returnValue

    // 9. Return comprehensive breakdown
    return {
      totalSales,
      totalSalesWithTax,
      totalSoldUnits: snapshot.reduce((s, i) => s + i.soldQuantity, 0),
      totalReturnedUnits: snapshot.reduce((s, i) => s + i.remainingQuantity, 0),

      platformCommissionRate: platformRate,
      platformCommissionAmount: platformCommission,

      storeCommissionRate: storeRate,
      storeCommissionAmount: storeCommission,
      storePayoutAmount,

      returnInventoryValue: returnValue,
      brandSalesRevenue,
      brandTotalAmount,

      breakdown: snapshot,
    }
  }
})

/**
 * Mutation for admin to approve settlement calculation
 * Saves the settlement to rental request and updates clearance status
 */
export const approveSettlement = mutation({
  args: {
    rentalRequestId: v.id("rentalRequests"),
    clearanceId: v.id("rentalClearances"),
  },
  handler: async (ctx, args) => {
    // 1. Verify admin authentication
    const { userId, profileData } = await requireAuthWithProfile(ctx)
    if (profileData.type !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    // 2. Calculate settlement
    const settlement: SettlementCalculation = await ctx.runQuery(
      api.rentalClearance.calculateSettlement,
      { rentalRequestId: args.rentalRequestId }
    )

    // 3. Store settlement in rental request
    await ctx.db.patch(args.rentalRequestId, {
      settlementCalculation: {
        totalSales: settlement.totalSales,
        totalSalesWithTax: settlement.totalSalesWithTax,
        platformCommissionRate: settlement.platformCommissionRate,
        platformCommissionAmount: settlement.platformCommissionAmount,
        storeCommissionRate: settlement.storeCommissionRate,
        storeCommissionAmount: settlement.storeCommissionAmount,
        storePayoutAmount: settlement.storePayoutAmount,
        returnInventoryValue: settlement.returnInventoryValue,
        brandTotalAmount: settlement.brandTotalAmount,
        calculatedAt: Date.now(),
        calculatedBy: userId,
        approvedAt: Date.now(),
        approvedBy: userId,
      },
      clearanceStatus: "settlement_approved",
    })

    // 4. Update clearance record
    await ctx.db.patch(args.clearanceId, {
      status: "settlement_approved",
      settlementApprovedAt: Date.now(),
    })

    // 5. Create settlement payment records automatically
    await ctx.runMutation(api.rentalClearance.createSettlementPayments, {
      rentalRequestId: args.rentalRequestId,
      clearanceId: args.clearanceId,
    })

    return settlement
  }
})

/**
 * Create payment records for store settlement after approval
 * Automatically creates payout records for store commission
 */
export const createSettlementPayments = mutation({
  args: {
    rentalRequestId: v.id("rentalRequests"),
    clearanceId: v.id("rentalClearances"),
  },
  handler: async (ctx, args) => {
    // 1. Get rental and validate settlement exists
    const rental = await ctx.db.get(args.rentalRequestId)
    if (!rental) {
      throw new Error("Rental not found")
    }

    const settlement = rental.settlementCalculation
    if (!settlement) {
      throw new Error("Settlement not calculated. Run approveSettlement first.")
    }

    const paymentIds: Id<"payments">[] = []

    // 2. Create store settlement payment (only if amount > 0)
    if (settlement.storePayoutAmount > 0) {
      const paymentId = await ctx.db.insert("payments", {
        type: "store_settlement",
        rentalRequestId: rental._id,
        clearanceId: args.clearanceId,

        // Parties: Platform pays store
        fromProfileId: undefined, // Platform is the payer
        toProfileId: rental.storeProfileId, // Store receives payout

        // Amounts
        amount: settlement.storePayoutAmount,
        platformFee: 0, // Already deducted during calculation
        netAmount: settlement.storePayoutAmount,

        // Payment status and method
        status: "completed", // Settlement approved, record created
        transferStatus: "pending", // Awaiting admin to initiate Tap transfer
        paymentMethod: "bank_transfer",

        // Dates
        paymentDate: Date.now(),
        settlementDate: Date.now(),

        // Detailed breakdown
        settlementBreakdown: {
          totalSalesAmount: settlement.totalSales,
          totalSalesWithTax: settlement.totalSalesWithTax,
          platformCommissionRate: settlement.platformCommissionRate,
          platformCommissionAmount: settlement.platformCommissionAmount,
          storeCommissionRate: settlement.storeCommissionRate,
          storeCommissionAmount: settlement.storeCommissionAmount,
          netPayoutToStore: settlement.storePayoutAmount,
        },

        description: `Store commission payout for rental period ending ${new Date(rental.endDate).toLocaleDateString()}`,
      })

      paymentIds.push(paymentId)
    }

    // 3. Update clearance record with payment references
    await ctx.db.patch(args.clearanceId, {
      settlementPaymentIds: paymentIds,
      status: "payment_completed", // Payment record created (not yet transferred)
      paymentCompletedAt: Date.now(),
    })

    // 4. TODO: Notify store about pending payout
    // Notification system doesn't exist yet
    // if (paymentIds.length > 0) {
    //   await ctx.scheduler.runAfter(0, api.notifications.sendSettlementPaymentCreated, {
    //     storeProfileId: rental.storeProfileId,
    //     paymentId: paymentIds[0],
    //     amount: settlement.storePayoutAmount,
    //   })
    // }

    // B4.2: Auto-initiate payout if payment was created
    if (paymentIds.length > 0) {
      await ctx.scheduler.runAfter(0, internal.tapTransfers.initiateAutomaticSettlementPayout, {
        paymentId: paymentIds[0]
      })
    }

    return paymentIds
  }
})

/**
 * Store submits return shipment details (Store → Brand)
 * Called after settlement is approved and payment records created
 */
export const submitReturnShipment = mutation({
  args: {
    rentalRequestId: v.id("rentalRequests"),
    clearanceId: v.id("rentalClearances"),
    carrier: v.string(),
    trackingNumber: v.string(),
    expectedDeliveryDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Verify store owner authentication
    const { userId, profileData } = await requireAuthWithProfile(ctx)

    // 2. Get rental and validate
    const rental = await ctx.db.get(args.rentalRequestId)
    if (!rental) {
      throw new Error("Rental not found")
    }

    // 3. Verify ownership - only store owner can ship return
    const storeProfile = await ctx.db.get(rental.storeProfileId)
    if (!storeProfile || storeProfile.userId !== userId) {
      throw new Error("Only the store owner can ship return")
    }

    // 4. Update rental with return shipment details
    await ctx.db.patch(rental._id, {
      returnShipment: {
        carrier: args.carrier,
        trackingNumber: args.trackingNumber,
        shippedAt: Date.now(),
        shippedBy: userId,
        expectedDeliveryDate: args.expectedDeliveryDate,
        notes: args.notes,
      },
      clearanceStatus: "return_shipped",
    })

    // 5. Update clearance record
    await ctx.db.patch(args.clearanceId, {
      status: "return_shipped",
      returnShippedAt: Date.now(),
    })

    // 6. TODO: Notify brand about return shipment
    // await ctx.scheduler.runAfter(0, api.notifications.sendReturnShipmentSent, {
    //   brandProfileId: rental.brandProfileId,
    //   rentalId: rental._id,
    //   trackingNumber: args.trackingNumber,
    // })

    return { success: true }
  }
})

/**
 * Brand confirms receipt of returned products (Brand ← Store)
 * Final step before document generation and clearance closure
 */
export const confirmReturnReceipt = mutation({
  args: {
    rentalRequestId: v.id("rentalRequests"),
    clearanceId: v.id("rentalClearances"),
    condition: v.optional(v.string()),
    receiptPhotos: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Verify brand owner authentication
    const { userId, profileData } = await requireAuthWithProfile(ctx)

    // 2. Get rental and validate
    const rental = await ctx.db.get(args.rentalRequestId)
    if (!rental) {
      throw new Error("Rental not found")
    }

    // 3. Verify status - must have return shipment sent
    if (rental.clearanceStatus !== "return_shipped") {
      throw new Error("No return shipment to confirm")
    }

    // 4. Verify ownership - only brand owner can confirm receipt
    const brandProfile = await ctx.db.get(rental.brandProfileId)
    if (!brandProfile || brandProfile.userId !== userId) {
      throw new Error("Only the brand owner can confirm receipt")
    }

    // 5. Update rental with receipt confirmation
    await ctx.db.patch(rental._id, {
      returnShipment: {
        ...rental.returnShipment!,
        receivedAt: Date.now(),
        receivedBy: userId,
        condition: args.condition || "good",
        receiptPhotos: args.receiptPhotos,
        confirmationNotes: args.notes,
      },
      clearanceStatus: "return_received",
    })

    // 6. Update clearance record
    await ctx.db.patch(args.clearanceId, {
      status: "return_received",
      returnReceivedAt: Date.now(),
    })

    // 7. TODO: Notify store about return received
    // await ctx.scheduler.runAfter(0, api.notifications.sendReturnReceived, {
    //   storeProfileId: rental.storeProfileId,
    //   rentalId: rental._id,
    // })

    return { success: true }
  }
})

/**
 * Generate clearance document with complete rental breakdown
 * Creates JSON document (PDF generation can be added later)
 */
export const generateClearanceDocument = action({
  args: {
    rentalRequestId: v.id("rentalRequests"),
    clearanceId: v.id("rentalClearances"),
  },
  handler: async (ctx, args) => {
    // 1. Get rental data
    const rental = await ctx.runQuery(api.rentalRequests.getRentalRequestDetails, {
      requestId: args.rentalRequestId
    })
    if (!rental) {
      throw new Error("Rental not found")
    }

    // 2. Get clearance record
    const clearance = await ctx.runQuery(api.rentalClearance.getClearanceById, {
      clearanceId: args.clearanceId
    })

    // 3. Build document data structure
    const documentData = {
      // Document metadata
      documentNumber: `CLR-${args.clearanceId.slice(-8).toUpperCase()}`,
      generatedDate: new Date().toISOString(),

      // Rental information
      rentalId: rental._id,
      rentalPeriod: {
        start: new Date(rental.startDate).toLocaleDateString('en-US'),
        end: new Date(rental.endDate).toLocaleDateString('en-US'),
      },

      // Parties
      brandProfileId: rental.brandProfileId,
      storeProfileId: rental.storeProfileId,

      // Inventory reconciliation
      products: rental.finalProductSnapshot || [],

      // Financial settlement
      settlement: rental.settlementCalculation || null,

      // Return shipping
      returnShipment: rental.returnShipment || null,

      // Timestamps
      clearanceInitiated: rental.clearanceInitiatedAt,
      clearanceCompleted: Date.now(),
    }

    // 4. Store as JSON document (PDF generation deferred)
    const blob = new Blob(
      [JSON.stringify(documentData, null, 2)],
      { type: "application/json" }
    )

    const storageId = await ctx.storage.store(blob)

    // 5. Update rental and clearance with document reference
    await ctx.runMutation(api.rentalClearance.updateDocument, {
      rentalRequestId: args.rentalRequestId,
      clearanceId: args.clearanceId,
      documentId: storageId,
    })

    return storageId
  }
})

/**
 * Helper mutation to update document references
 */
export const updateDocument = mutation({
  args: {
    rentalRequestId: v.id("rentalRequests"),
    clearanceId: v.id("rentalClearances"),
    documentId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.rentalRequestId, {
      clearanceDocumentId: args.documentId,
    })

    await ctx.db.patch(args.clearanceId, {
      clearanceDocumentId: args.documentId,
      documentGeneratedAt: Date.now(),
    })

    return { success: true }
  }
})

/**
 * Final step: Close clearance after all steps complete
 * Admin verifies everything is done and officially closes the clearance
 */
export const closeClearance = mutation({
  args: {
    rentalRequestId: v.id("rentalRequests"),
    clearanceId: v.id("rentalClearances"),
  },
  handler: async (ctx, args) => {
    // 1. Verify admin authentication
    const { userId, profileData } = await requireAuthWithProfile(ctx)
    if (profileData.type !== "admin") {
      throw new Error("Unauthorized: Admin access required")
    }

    // 2. Get rental and clearance
    const rental = await ctx.db.get(args.rentalRequestId)
    const clearance = await ctx.db.get(args.clearanceId)

    if (!rental) throw new Error("Rental not found")
    if (!clearance) throw new Error("Clearance not found")

    // 3. Validate all steps are complete
    if (!rental.settlementCalculation) {
      throw new Error("Cannot close: Settlement not calculated")
    }

    if (!clearance.settlementPaymentIds || clearance.settlementPaymentIds.length === 0) {
      throw new Error("Cannot close: Payment records not created")
    }

    if (!rental.returnShipment?.receivedAt) {
      throw new Error("Cannot close: Return not confirmed by brand")
    }

    if (!rental.clearanceDocumentId) {
      throw new Error("Cannot close: Document not generated")
    }

    // 4. Close clearance
    await ctx.db.patch(args.clearanceId, {
      status: "closed",
      closedAt: Date.now(),
    })

    await ctx.db.patch(args.rentalRequestId, {
      clearanceStatus: "closed",
      clearanceCompletedAt: Date.now(),
    })

    // 5. TODO: Notify both parties of closure
    // await ctx.scheduler.runAfter(0, api.notifications.sendClearanceCompleted, {
    //   rentalRequestId: args.rentalRequestId,
    //   brandProfileId: rental.brandProfileId,
    //   storeProfileId: rental.storeProfileId,
    // })

    return { success: true }
  }
})

// Helper query for document generation
export const getClearanceById = query({
  args: { clearanceId: v.id("rentalClearances") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.clearanceId)
  }
})

/**
 * B3.1: Get all clearances for logged-in brand
 * Returns paginated list with enriched data (store, shelf info)
 */
export const getBrandClearances = query({
  args: {
    page: v.number(),
    limit: v.optional(v.number()),
    statusFilter: v.optional(v.union(
      v.literal("active"),
      v.literal("closed")
    )),
  },
  handler: async (ctx, args) => {
    const { userId, profileData } = await requireAuthWithProfile(ctx)

    if (profileData.type !== "brand_owner") {
      throw new Error("Unauthorized: Only brand owners can access this")
    }

    const profileId = profileData.profile._id

    const limit = args.limit || 10

    // 1. Get all rentals for this brand that have clearance data
    const allRentals = await ctx.db
      .query("rentalRequests")
      .filter((q) => q.eq(q.field("brandProfileId"), profileId))
      .filter((q) => q.neq(q.field("clearanceStatus"), undefined))
      .collect()

    // 2. Apply status filter if provided
    let filteredRentals = allRentals
    if (args.statusFilter === "active") {
      filteredRentals = allRentals.filter((r) => r.clearanceStatus !== "closed")
    } else if (args.statusFilter === "closed") {
      filteredRentals = allRentals.filter((r) => r.clearanceStatus === "closed")
    }

    // 3. Sort by creation time (newest first)
    filteredRentals.sort((a, b) => b._creationTime - a._creationTime)

    // 4. Paginate
    const start = (args.page - 1) * limit
    const end = start + limit
    const paginatedRentals = filteredRentals.slice(start, end)

    // 5. Batch fetch related data
    const storeIds = [...new Set(paginatedRentals.map(r => r.storeProfileId))]
    const shelfIds = [...new Set(paginatedRentals.map(r => r.shelfId))]
    const clearanceIds = paginatedRentals
      .map(r => {
        // Find clearance by rentalRequestId
        return r._id
      })

    const stores = await Promise.all(storeIds.map(id => ctx.db.get(id)))
    const shelves = await Promise.all(shelfIds.map(id => ctx.db.get(id)))

    // Get clearance records
    const clearances = await Promise.all(
      paginatedRentals.map(async (rental) => {
        const clearance = await ctx.db
          .query("rentalClearances")
          .withIndex("by_rental", (q) => q.eq("rentalRequestId", rental._id))
          .first()
        return clearance
      })
    )

    // Create lookup maps
    const storeMap = new Map(stores.filter(Boolean).map(s => [s!._id, s!]))
    const shelfMap = new Map(shelves.filter(Boolean).map(s => [s!._id, s!]))
    const clearanceMap = new Map(clearances.filter(Boolean).map(c => [c!.rentalRequestId, c!]))

    // 6. Enrich rentals with related data
    const enrichedItems = paginatedRentals.map((rental) => {
      const store = storeMap.get(rental.storeProfileId)
      const shelf = shelfMap.get(rental.shelfId)
      const clearance = clearanceMap.get(rental._id)

      return {
        _id: rental._id,
        rentalId: rental._id,
        startDate: rental.startDate,
        endDate: rental.endDate,
        clearanceStatus: rental.clearanceStatus,
        settlementAmount: rental.settlementCalculation?.brandTotalAmount || 0,
        storeName: store?.storeName || "Unknown Store",
        storeNameAr: store?.storeName || "متجر غير معروف",
        shelfLocation: shelf?.shelfName || "Unknown",
        clearanceId: clearance?._id,
        clearanceInitiatedAt: clearance?.initiatedAt,
      }
    })

    // 7. Calculate stats
    const totalClearances = filteredRentals.length
    const activeClearances = filteredRentals.filter(r => r.clearanceStatus !== "closed").length
    const closedClearances = filteredRentals.filter(r => r.clearanceStatus === "closed").length
    const totalRevenue = filteredRentals.reduce((sum, r) =>
      sum + (r.settlementCalculation?.brandTotalAmount || 0), 0
    )

    return {
      items: enrichedItems,
      page: args.page,
      totalPages: Math.ceil(filteredRentals.length / limit),
      totalCount: totalClearances,
      stats: {
        total: totalClearances,
        active: activeClearances,
        closed: closedClearances,
        totalRevenue,
      }
    }
  }
})

/**
 * B3.1: Get detailed clearance information for brand
 * Returns complete clearance data with rental, store, shelf info
 */
export const getClearanceDetails = query({
  args: {
    clearanceId: v.id("rentalClearances"),
  },
  handler: async (ctx, args) => {
    const { userId, profileData } = await requireAuthWithProfile(ctx)

    if (profileData.type !== "brand_owner") {
      throw new Error("Unauthorized: Only brand owners can access this")
    }

    const profileId = profileData.profile._id

    // 1. Get clearance record
    const clearance = await ctx.db.get(args.clearanceId)
    if (!clearance) {
      throw new Error("Clearance not found")
    }

    // 2. Get rental request
    const rental = await ctx.db.get(clearance.rentalRequestId)
    if (!rental) {
      throw new Error("Rental not found")
    }

    // 3. Verify ownership
    if (rental.brandProfileId !== profileId) {
      throw new Error("Unauthorized: This clearance belongs to another brand")
    }

    // 4. Get related data
    const store = await ctx.db.get(rental.storeProfileId)
    const shelf = await ctx.db.get(rental.shelfId)

    // 5. Get settlement payments if they exist
    let settlementPayments = null
    if (clearance.settlementPaymentIds && clearance.settlementPaymentIds.length > 0) {
      settlementPayments = await Promise.all(
        clearance.settlementPaymentIds.map(id => ctx.db.get(id))
      )
    }

    return {
      clearance,
      rental: {
        _id: rental._id,
        startDate: rental.startDate,
        endDate: rental.endDate,
        monthlyPrice: rental.monthlyPrice,
        totalAmount: rental.totalAmount,
        selectedProducts: rental.selectedProducts,
        finalProductSnapshot: rental.finalProductSnapshot,
        settlementCalculation: rental.settlementCalculation,
        initialShipment: rental.initialShipment,
        returnShipment: rental.returnShipment,
        clearanceStatus: rental.clearanceStatus,
        clearanceDocumentId: rental.clearanceDocumentId,
      },
      store: store ? {
        _id: store._id,
        name: store.storeName,
        nameAr: store.storeName, // Store profiles only have storeName
      } : null,
      shelf: shelf ? {
        _id: shelf._id,
        title: shelf.shelfName,
        titleAr: shelf.shelfName, // Shelves only have shelfName
        width: shelf.shelfSize.width,
        height: shelf.shelfSize.height,
        depth: shelf.shelfSize.depth,
      } : null,
      settlementPayments: settlementPayments?.filter(Boolean) || [],
    }
  }
})

/**
 * B3.2: Get all clearances for logged-in store
 * Returns paginated list with enriched data (brand, shelf info)
 */
export const getStoreClearances = query({
  args: {
    page: v.number(),
    limit: v.optional(v.number()),
    statusFilter: v.optional(v.union(
      v.literal("active"),
      v.literal("closed")
    )),
  },
  handler: async (ctx, args) => {
    const { userId, profileData } = await requireAuthWithProfile(ctx)

    if (profileData.type !== "store_owner") {
      throw new Error("Unauthorized: Only store owners can access this")
    }

    const profileId = profileData.profile._id
    const limit = args.limit || 10

    // 1. Get all rentals for this store that have clearance data
    const allRentals = await ctx.db
      .query("rentalRequests")
      .filter((q) => q.eq(q.field("storeProfileId"), profileId))
      .filter((q) => q.neq(q.field("clearanceStatus"), undefined))
      .collect()

    // 2. Apply status filter if provided
    let filteredRentals = allRentals
    if (args.statusFilter === "active") {
      filteredRentals = allRentals.filter((r) => r.clearanceStatus !== "closed")
    } else if (args.statusFilter === "closed") {
      filteredRentals = allRentals.filter((r) => r.clearanceStatus === "closed")
    }

    // 3. Sort by creation time (newest first)
    filteredRentals.sort((a, b) => b._creationTime - a._creationTime)

    // 4. Paginate
    const start = (args.page - 1) * limit
    const end = start + limit
    const paginatedRentals = filteredRentals.slice(start, end)

    // 5. Batch fetch related data
    const brandIds = [...new Set(paginatedRentals.map(r => r.brandProfileId))]
    const shelfIds = [...new Set(paginatedRentals.map(r => r.shelfId))]

    const brands = await Promise.all(brandIds.map(id => ctx.db.get(id)))
    const shelves = await Promise.all(shelfIds.map(id => ctx.db.get(id)))

    // Get clearance records
    const clearances = await Promise.all(
      paginatedRentals.map(async (rental) => {
        const clearance = await ctx.db
          .query("rentalClearances")
          .withIndex("by_rental", (q) => q.eq("rentalRequestId", rental._id))
          .first()
        return clearance
      })
    )

    // Create lookup maps
    const brandMap = new Map(brands.filter(Boolean).map(b => [b!._id, b!]))
    const shelfMap = new Map(shelves.filter(Boolean).map(s => [s!._id, s!]))
    const clearanceMap = new Map(clearances.filter(Boolean).map(c => [c!.rentalRequestId, c!]))

    // 6. Enrich rentals with related data
    const enrichedItems = paginatedRentals.map((rental) => {
      const brand = brandMap.get(rental.brandProfileId)
      const shelf = shelfMap.get(rental.shelfId)
      const clearance = clearanceMap.get(rental._id)

      return {
        _id: rental._id,
        rentalId: rental._id,
        startDate: rental.startDate,
        endDate: rental.endDate,
        clearanceStatus: rental.clearanceStatus,
        payoutAmount: rental.settlementCalculation?.storePayoutAmount || 0,
        brandName: brand?.brandName || "Unknown Brand",
        shelfLocation: shelf?.shelfName || "Unknown",
        clearanceId: clearance?._id,
        clearanceInitiatedAt: clearance?.initiatedAt,
      }
    })

    // 7. Calculate stats
    const totalClearances = filteredRentals.length
    const activeClearances = filteredRentals.filter(r => r.clearanceStatus !== "closed").length
    const closedClearances = filteredRentals.filter(r => r.clearanceStatus === "closed").length

    // Calculate pending and completed payouts
    const pendingPayouts = filteredRentals.filter(r => {
      const status = r.clearanceStatus
      return status !== "closed" && status !== "payment_completed"
    }).length
    const completedPayouts = filteredRentals.filter(r =>
      r.clearanceStatus === "payment_completed" || r.clearanceStatus === "closed"
    ).length

    const totalRevenue = filteredRentals.reduce((sum, r) =>
      sum + (r.settlementCalculation?.storePayoutAmount || 0), 0
    )

    return {
      items: enrichedItems,
      page: args.page,
      totalPages: Math.ceil(filteredRentals.length / limit),
      totalCount: totalClearances,
      stats: {
        total: totalClearances,
        active: activeClearances,
        closed: closedClearances,
        pendingPayouts,
        completedPayouts,
        totalRevenue,
      }
    }
  }
})

/**
 * B3.2: Get detailed clearance information for store
 * Returns complete clearance data with rental, brand, shelf info
 */
export const getStoreClearanceDetails = query({
  args: {
    clearanceId: v.id("rentalClearances"),
  },
  handler: async (ctx, args) => {
    const { userId, profileData } = await requireAuthWithProfile(ctx)

    if (profileData.type !== "store_owner") {
      throw new Error("Unauthorized: Only store owners can access this")
    }

    const profileId = profileData.profile._id

    // 1. Get clearance record
    const clearance = await ctx.db.get(args.clearanceId)
    if (!clearance) {
      throw new Error("Clearance not found")
    }

    // 2. Get rental request
    const rental = await ctx.db.get(clearance.rentalRequestId)
    if (!rental) {
      throw new Error("Rental not found")
    }

    // 3. Verify ownership
    if (rental.storeProfileId !== profileId) {
      throw new Error("Unauthorized: This clearance belongs to another store")
    }

    // 4. Get related data
    const brand = await ctx.db.get(rental.brandProfileId)
    const shelf = await ctx.db.get(rental.shelfId)

    // 5. Get settlement payments if they exist
    let settlementPayments = null
    if (clearance.settlementPaymentIds && clearance.settlementPaymentIds.length > 0) {
      settlementPayments = await Promise.all(
        clearance.settlementPaymentIds.map(id => ctx.db.get(id))
      )
    }

    return {
      clearance,
      rental: {
        _id: rental._id,
        startDate: rental.startDate,
        endDate: rental.endDate,
        monthlyPrice: rental.monthlyPrice,
        totalAmount: rental.totalAmount,
        selectedProducts: rental.selectedProducts,
        finalProductSnapshot: rental.finalProductSnapshot,
        settlementCalculation: rental.settlementCalculation,
        initialShipment: rental.initialShipment,
        returnShipment: rental.returnShipment,
        clearanceStatus: rental.clearanceStatus,
        clearanceDocumentId: rental.clearanceDocumentId,
      },
      brand: brand ? {
        _id: brand._id,
        name: brand.brandName,
        nameAr: brand.brandName, // Brand profiles only have brandName
      } : null,
      shelf: shelf ? {
        _id: shelf._id,
        title: shelf.shelfName,
        titleAr: shelf.shelfName,
        width: shelf.shelfSize.width,
        height: shelf.shelfSize.height,
        depth: shelf.shelfSize.depth,
      } : null,
      settlementPayments: settlementPayments?.filter(Boolean) || [],
    }
  }
})

/**
 * B4.1: Process pending clearances (Cron job)
 * Runs daily to auto-initiate clearances and send reminders
 */
export const processPendingClearances = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()

    // 1. Auto-initiate clearance for completed rentals without clearance
    const completedNoClearance = await ctx.db
      .query("rentalRequests")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .filter((q) => q.eq(q.field("clearanceStatus"), undefined))
      .collect()

    for (const rental of completedNoClearance) {
      // Initiate clearance
      await ctx.scheduler.runAfter(0, internal.rentalClearance.initiateClearance, {
        rentalRequestId: rental._id
      })
    }

    // 2. Find stalled clearances (7+ days with no progress)
    const stalledClearances = await ctx.db
      .query("rentalClearances")
      .withIndex("by_status")
      .filter((q) => q.neq(q.field("status"), "closed"))
      .collect()

    for (const clearance of stalledClearances) {
      const daysSinceInitiated = (now - clearance.initiatedAt) / (24 * 60 * 60 * 1000)

      // Send reminder after 7 days of inactivity
      if (daysSinceInitiated >= 7) {
        const rental = await ctx.db.get(clearance.rentalRequestId)
        if (!rental) continue

        // Different reminders based on current status
        let reminderMessage = ""

        switch (rental.clearanceStatus) {
          case "pending_inventory_check":
            reminderMessage = "تذكير: يرجى مراجعة جرد المخزون لإكمال التسوية.\\nReminder: Please review inventory to complete clearance."
            break
          case "pending_return_shipment":
            reminderMessage = "تذكير: يرجى شحن المنتجات المتبقية للعلامة التجارية.\\nReminder: Please ship remaining products back to the brand."
            break
          case "return_shipped":
            reminderMessage = "تذكير: يرجى تأكيد استلام المنتجات المرتجعة.\\nReminder: Please confirm receipt of returned products."
            break
          case "pending_settlement":
            reminderMessage = "تذكير: بانتظار موافقة الإدارة على التسوية المالية.\\nReminder: Awaiting admin approval for settlement."
            break
        }

        // TODO: Send notification (notification system not fully implemented)
        // if (reminderMessage && rental.conversationId) {
        //   await ctx.scheduler.runAfter(0, api.notifications.sendClearanceReminder, {
        //     rentalId: rental._id,
        //     message: reminderMessage
        //   })
        // }
      }
    }

    return {
      initiated: completedNoClearance.length,
      reminders: stalledClearances.filter(c =>
        (now - c.initiatedAt) / (24 * 60 * 60 * 1000) >= 7
      ).length
    }
  }
})
