/**
 * Admin Clearance Management Functions
 * B3.3: Admin oversight, approval, and payment tracking
 */

import { v } from "convex/values"
import { query, mutation } from "../_generated/server"
import { Doc, Id } from "../_generated/dataModel"
import { requireAdmin } from "./helpers"

/**
 * B3.3: Get all clearances for admin oversight
 * Returns paginated list with comprehensive filters
 */
export const getAdminClearances = query({
  args: {
    page: v.number(),
    limit: v.optional(v.number()),
    statusFilter: v.optional(v.union(
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
    pendingApprovalOnly: v.optional(v.boolean()),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require admin authentication
    await requireAdmin(ctx)

    const limit = args.limit || 10

    // 1. Get all rentals that have clearance data
    let allRentals = await ctx.db
      .query("rentalRequests")
      .filter((q) => q.neq(q.field("clearanceStatus"), undefined))
      .collect()

    // 2. Apply filters
    if (args.statusFilter) {
      allRentals = allRentals.filter((r) => r.clearanceStatus === args.statusFilter)
    }

    if (args.pendingApprovalOnly) {
      allRentals = allRentals.filter((r) =>
        r.clearanceStatus === "pending_settlement" &&
        r.settlementCalculation &&
        !r.settlementCalculation.approvedAt
      )
    }

    // 3. Batch fetch related data for search
    if (args.searchQuery && args.searchQuery.trim()) {
      const brandIds = [...new Set(allRentals.map(r => r.brandProfileId))]
      const storeIds = [...new Set(allRentals.map(r => r.storeProfileId))]

      const brands = await Promise.all(brandIds.map(id => ctx.db.get(id)))
      const stores = await Promise.all(storeIds.map(id => ctx.db.get(id)))

      const brandMap = new Map(brands.filter(Boolean).map(b => [b!._id, b!]))
      const storeMap = new Map(stores.filter(Boolean).map(s => [s!._id, s!]))

      const query = args.searchQuery.toLowerCase()
      allRentals = allRentals.filter((rental) => {
        const brand = brandMap.get(rental.brandProfileId)
        const store = storeMap.get(rental.storeProfileId)

        return (
          brand?.brandName?.toLowerCase().includes(query) ||
          store?.storeName?.toLowerCase().includes(query)
        )
      })
    }

    // 4. Sort by creation time (newest first)
    allRentals.sort((a, b) => b._creationTime - a._creationTime)

    // 5. Paginate
    const start = (args.page - 1) * limit
    const end = start + limit
    const paginatedRentals = allRentals.slice(start, end)

    // 6. Batch fetch related data for display
    const brandIds = [...new Set(paginatedRentals.map(r => r.brandProfileId))]
    const storeIds = [...new Set(paginatedRentals.map(r => r.storeProfileId))]
    const shelfIds = [...new Set(paginatedRentals.map(r => r.shelfId))]

    const brands = await Promise.all(brandIds.map(id => ctx.db.get(id)))
    const stores = await Promise.all(storeIds.map(id => ctx.db.get(id)))
    const shelves = await Promise.all(shelfIds.map(id => ctx.db.get(id)))

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
    const storeMap = new Map(stores.filter(Boolean).map(s => [s!._id, s!]))
    const shelfMap = new Map(shelves.filter(Boolean).map(s => [s!._id, s!]))
    const clearanceMap = new Map(clearances.filter(Boolean).map(c => [c!.rentalRequestId, c!]))

    // 7. Enrich rentals with related data
    const enrichedItems = paginatedRentals.map((rental) => {
      const brand = brandMap.get(rental.brandProfileId)
      const store = storeMap.get(rental.storeProfileId)
      const shelf = shelfMap.get(rental.shelfId)
      const clearance = clearanceMap.get(rental._id)

      return {
        _id: rental._id,
        rentalId: rental._id,
        startDate: rental.startDate,
        endDate: rental.endDate,
        clearanceStatus: rental.clearanceStatus,
        brandName: brand?.brandName || "Unknown",
        storeName: store?.storeName || "Unknown",
        shelfLocation: shelf?.shelfName || "Unknown",
        platformCommission: rental.settlementCalculation?.platformCommissionAmount || 0,
        storeCommission: rental.settlementCalculation?.storePayoutAmount || 0,
        brandRevenue: rental.settlementCalculation?.brandTotalAmount || 0,
        totalSales: rental.settlementCalculation?.totalSalesWithTax || 0,
        settlementApproved: rental.settlementCalculation?.approvedAt !== undefined,
        clearanceId: clearance?._id,
        clearanceInitiatedAt: clearance?.initiatedAt,
      }
    })

    // 8. Calculate stats
    const totalClearances = allRentals.length
    const pendingApproval = allRentals.filter(r =>
      r.clearanceStatus === "pending_settlement" &&
      r.settlementCalculation &&
      !r.settlementCalculation.approvedAt
    ).length
    const completed = allRentals.filter(r => r.clearanceStatus === "closed").length
    const totalSalesVolume = allRentals.reduce((sum, r) =>
      sum + (r.settlementCalculation?.totalSalesWithTax || 0), 0
    )

    return {
      items: enrichedItems,
      page: args.page,
      totalPages: Math.ceil(allRentals.length / limit),
      totalCount: totalClearances,
      stats: {
        total: totalClearances,
        pendingApproval,
        completed,
        totalSalesVolume,
      }
    }
  }
})

/**
 * B3.3: Get detailed clearance information for admin
 * Returns complete clearance data with all related info
 */
export const getAdminClearanceDetails = query({
  args: {
    clearanceId: v.id("rentalClearances"),
  },
  handler: async (ctx, args) => {
    // Require admin authentication
    await requireAdmin(ctx)

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

    // 3. Get related data
    const brand = await ctx.db.get(rental.brandProfileId)
    const store = await ctx.db.get(rental.storeProfileId)
    const shelf = await ctx.db.get(rental.shelfId)

    // 4. Get settlement payments if they exist
    let settlementPayments = null
    if (clearance.settlementPaymentIds && clearance.settlementPaymentIds.length > 0) {
      settlementPayments = await Promise.all(
        clearance.settlementPaymentIds.map(id => ctx.db.get(id))
      )
    }

    // 5. Get admin users who interacted with this clearance
    let settlementApprovedByUser = null
    if (rental.settlementCalculation?.approvedBy) {
      settlementApprovedByUser = await ctx.db.get(rental.settlementCalculation.approvedBy)
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
        nameAr: brand.brandName,
      } : null,
      store: store ? {
        _id: store._id,
        name: store.storeName,
        nameAr: store.storeName,
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
      settlementApprovedByUser: settlementApprovedByUser ? {
        _id: settlementApprovedByUser._id,
        email: settlementApprovedByUser.email,
        name: settlementApprovedByUser.name,
      } : null,
    }
  }
})

/**
 * B3.3: Admin manually updates clearance status
 * For troubleshooting and edge cases only
 */
export const updateClearanceStatus = mutation({
  args: {
    clearanceId: v.id("rentalClearances"),
    rentalRequestId: v.id("rentalRequests"),
    newStatus: v.union(
      v.literal("not_started"),
      v.literal("pending_inventory_check"),
      v.literal("pending_return_shipment"),
      v.literal("return_shipped"),
      v.literal("return_received"),
      v.literal("pending_settlement"),
      v.literal("settlement_approved"),
      v.literal("payment_completed"),
      v.literal("closed")
    ),
    reason: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require admin authentication
    const { userId } = await requireAdmin(ctx)

    // 1. Get clearance and rental
    const clearance = await ctx.db.get(args.clearanceId)
    if (!clearance) {
      throw new Error("Clearance not found")
    }

    const rental = await ctx.db.get(args.rentalRequestId)
    if (!rental) {
      throw new Error("Rental not found")
    }

    const oldStatus = rental.clearanceStatus

    // 2. Update clearance status
    await ctx.db.patch(args.rentalRequestId, {
      clearanceStatus: args.newStatus,
    })

    // 3. TODO: Create audit log entry
    // await ctx.db.insert("auditLogs", {
    //   userId,
    //   action: "update_clearance_status",
    //   resourceType: "rentalClearances",
    //   resourceId: args.clearanceId,
    //   details: {
    //     oldStatus,
    //     newStatus: args.newStatus,
    //     reason: args.reason,
    //     notes: args.notes,
    //   },
    //   timestamp: Date.now(),
    // })

    return { success: true, oldStatus, newStatus: args.newStatus }
  }
})

/**
 * B3.3: Admin uploads payment transfer receipt
 * Proof of store payout completion
 */
export const uploadPaymentReceipt = mutation({
  args: {
    paymentId: v.id("payments"),
    receiptFileId: v.string(), // Convex storage ID
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require admin authentication
    const { userId } = await requireAdmin(ctx)

    // 1. Get payment record
    const payment = await ctx.db.get(args.paymentId)
    if (!payment) {
      throw new Error("Payment not found")
    }

    // 2. Verify this is a settlement payment
    if (payment.type !== "store_settlement") {
      throw new Error("Can only upload receipts for store settlement payments")
    }

    // 3. Update payment with receipt info
    await ctx.db.patch(args.paymentId, {
      receiptFileId: args.receiptFileId,
      receiptUploadedBy: userId,
      receiptUploadedAt: Date.now(),
    })

    // 4. TODO: Create audit log entry
    // await ctx.db.insert("auditLogs", {
    //   userId,
    //   action: "upload_payment_receipt",
    //   resourceType: "payments",
    //   resourceId: args.paymentId,
    //   details: { receiptFileId: args.receiptFileId, notes: args.notes },
    //   timestamp: Date.now(),
    // })

    return { success: true }
  }
})

/**
 * B4.3: Get clearance analytics statistics
 * Overall clearance performance metrics
 */
export const getClearanceStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)

    // Get all rentals with clearance data
    const rentalsWithClearance = await ctx.db
      .query("rentalRequests")
      .filter((q) => q.neq(q.field("clearanceStatus"), undefined))
      .collect()

    // Get all clearance records
    const clearances = await ctx.db.query("rentalClearances").collect()

    // Calculate statistics
    const totalClearances = rentalsWithClearance.length
    const closedClearances = rentalsWithClearance.filter(r => r.clearanceStatus === "closed").length
    const activeClearances = totalClearances - closedClearances

    // Calculate average duration (initiated → closed)
    const closedClearanceRecords = clearances.filter(c => c.status === "closed" && c.closedAt)
    const avgDuration = closedClearanceRecords.length > 0
      ? closedClearanceRecords.reduce((sum, c) => {
          return sum + ((c.closedAt || 0) - c.initiatedAt)
        }, 0) / closedClearanceRecords.length / (24 * 60 * 60 * 1000) // Convert to days
      : 0

    // Financial metrics
    const totalSalesVolume = rentalsWithClearance.reduce((sum, r) =>
      sum + (r.settlementCalculation?.totalSalesWithTax || 0), 0
    )
    const totalPlatformCommission = rentalsWithClearance.reduce((sum, r) =>
      sum + (r.settlementCalculation?.platformCommissionAmount || 0), 0
    )
    const totalStorePayouts = rentalsWithClearance.reduce((sum, r) =>
      sum + (r.settlementCalculation?.storePayoutAmount || 0), 0
    )
    const totalBrandRevenue = rentalsWithClearance.reduce((sum, r) =>
      sum + (r.settlementCalculation?.brandTotalAmount || 0), 0
    )

    // Status breakdown
    const statusBreakdown = rentalsWithClearance.reduce((acc, r) => {
      const status = r.clearanceStatus || "unknown"
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalClearances,
      activeClearances,
      closedClearances,
      avgDurationDays: Math.round(avgDuration * 10) / 10, // Round to 1 decimal
      totalSalesVolume,
      totalPlatformCommission,
      totalStorePayouts,
      totalBrandRevenue,
      statusBreakdown,
    }
  }
})

/**
 * B4.3: Get clearances by date range
 * Filter clearances within specific timeframe
 */
export const getClearancesByDateRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    // Get clearances initiated within date range
    const clearances = await ctx.db
      .query("rentalClearances")
      .withIndex("by_initiated_at")
      .filter((q) => q.and(
        q.gte(q.field("initiatedAt"), args.startDate),
        q.lte(q.field("initiatedAt"), args.endDate)
      ))
      .collect()

    // Get corresponding rentals
    const rentals = await Promise.all(
      clearances.map(c => ctx.db.get(c.rentalRequestId))
    )

    const rentalsMap = new Map(
      rentals.filter(Boolean).map(r => [r!._id, r!])
    )

    // Calculate aggregated metrics
    const totalSalesVolume = clearances.reduce((sum, c) => {
      const rental = rentalsMap.get(c.rentalRequestId)
      return sum + (rental?.settlementCalculation?.totalSalesWithTax || 0)
    }, 0)

    const totalPlatformCommission = clearances.reduce((sum, c) => {
      const rental = rentalsMap.get(c.rentalRequestId)
      return sum + (rental?.settlementCalculation?.platformCommissionAmount || 0)
    }, 0)

    return {
      clearances: clearances.map(c => {
        const rental = rentalsMap.get(c.rentalRequestId)
        return {
          clearanceId: c._id,
          rentalId: c.rentalRequestId,
          status: c.status,
          initiatedAt: c.initiatedAt,
          closedAt: c.closedAt,
          salesVolume: rental?.settlementCalculation?.totalSalesWithTax || 0,
          platformCommission: rental?.settlementCalculation?.platformCommissionAmount || 0,
          storePayout: rental?.settlementCalculation?.storePayoutAmount || 0,
        }
      }),
      aggregates: {
        count: clearances.length,
        totalSalesVolume,
        totalPlatformCommission,
      }
    }
  }
})

/**
 * B4.3: Get clearances by performance
 * Top performing brands, stores, and slowest clearances
 */
export const getClearancesByPerformance = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const limit = args.limit || 10

    // Get all rentals with clearance
    const rentalsWithClearance = await ctx.db
      .query("rentalRequests")
      .filter((q) => q.neq(q.field("clearanceStatus"), undefined))
      .collect()

    // Get clearance records
    const clearances = await ctx.db.query("rentalClearances").collect()
    const clearanceMap = new Map(clearances.map(c => [c.rentalRequestId, c]))

    // Top brands by sales volume
    const brandSales = new Map<string, { brandId: string; brandName: string; totalSales: number }>()

    for (const rental of rentalsWithClearance) {
      const brand = await ctx.db.get(rental.brandProfileId)
      const sales = rental.settlementCalculation?.totalSalesWithTax || 0

      if (brand) {
        const existing = brandSales.get(rental.brandProfileId)
        if (existing) {
          existing.totalSales += sales
        } else {
          brandSales.set(rental.brandProfileId, {
            brandId: rental.brandProfileId,
            brandName: brand.brandName || "Unknown",
            totalSales: sales,
          })
        }
      }
    }

    const topBrands = Array.from(brandSales.values())
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, limit)

    // Top stores by commission earned
    const storeCommissions = new Map<string, { storeId: string; storeName: string; totalCommission: number }>()

    for (const rental of rentalsWithClearance) {
      const store = await ctx.db.get(rental.storeProfileId)
      const commission = rental.settlementCalculation?.storePayoutAmount || 0

      if (store) {
        const existing = storeCommissions.get(rental.storeProfileId)
        if (existing) {
          existing.totalCommission += commission
        } else {
          storeCommissions.set(rental.storeProfileId, {
            storeId: rental.storeProfileId,
            storeName: store.storeName,
            totalCommission: commission,
          })
        }
      }
    }

    const topStores = Array.from(storeCommissions.values())
      .sort((a, b) => b.totalCommission - a.totalCommission)
      .slice(0, limit)

    // Slowest clearances (longest time to close)
    const closedClearances = clearances
      .filter(c => c.status === "closed" && c.closedAt)
      .map(c => ({
        clearanceId: c._id,
        rentalId: c.rentalRequestId,
        durationDays: ((c.closedAt || 0) - c.initiatedAt) / (24 * 60 * 60 * 1000),
        initiatedAt: c.initiatedAt,
        closedAt: c.closedAt || 0,
      }))
      .sort((a, b) => b.durationDays - a.durationDays)
      .slice(0, limit)

    return {
      topBrands,
      topStores,
      slowestClearances: closedClearances,
    }
  }
})
