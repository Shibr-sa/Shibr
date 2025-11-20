import { query, mutation } from "../_generated/server"
import { v } from "convex/values"
import { verifyAdminAccess } from "./helpers"
import { getUserProfile } from "../profileHelpers"
import { getDateRange } from "../helpers"
import { api, internal } from "../_generated/api"

/**
 * Admin query to list rental requests pending approval
 * Follows standard admin patterns: batch fetching, search, pagination, stats
 */
export const getPendingApprovals = query({
  args: {
    searchQuery: v.optional(v.string()),
    page: v.number(),
    limit: v.number(),
    statusFilter: v.optional(v.union(
      v.literal("all"),
      v.literal("pending_admin_approval"),
      v.literal("approved"),      // Actually "pending" in DB (admin approved, store reviewing)
      v.literal("rejected")
    )),
    timePeriod: v.optional(v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("yearly")
    )),
  },
  handler: async (ctx, args) => {
    // Verify admin access - return empty if not authorized
    const auth = await verifyAdminAccess(ctx)
    if (!auth.isAuthenticated || !auth.isAdmin) {
      return {
        items: [],
        totalPages: 0,
        stats: {
          totalPending: 0,
          pendingChange: 0,
          totalApproved: 0,
          approvedChange: 0,
          totalRejected: 0,
          rejectedChange: 0,
          totalRevenue: 0,
          revenueChange: 0,
        }
      }
    }

    const { searchQuery, page, limit, statusFilter = "all", timePeriod = "monthly" } = args

    // Query ALL rental requests to enable search and accurate stats
    // Note: Using .collect() is acceptable for rental requests (expected volume < 10k)
    const allRentals = await ctx.db
      .query("rentalRequests")
      .collect()

    // BATCH FETCH 1: Get all unique IDs upfront (avoid N+1 queries)
    const brandIds = [...new Set(allRentals.map(r => r.brandProfileId))]
    const storeIds = [...new Set(allRentals.map(r => r.storeProfileId))]
    const shelfIds = [...new Set(allRentals.map(r => r.shelfId))]

    // BATCH FETCH 2: Fetch all profiles and shelves in parallel
    const [brandProfiles, storeProfiles, shelves] = await Promise.all([
      Promise.all(brandIds.map(id => ctx.db.get(id))),
      Promise.all(storeIds.map(id => ctx.db.get(id))),
      Promise.all(shelfIds.map(id => ctx.db.get(id)))
    ])

    // BATCH FETCH 3: Get user IDs from profiles
    const userIds = [...new Set([
      ...brandProfiles.filter(p => p !== null).map(p => p!.userId),
      ...storeProfiles.filter(p => p !== null).map(p => p!.userId)
    ])]

    // BATCH FETCH 4: Fetch all users
    const users = await Promise.all(userIds.map(id => ctx.db.get(id)))

    // Create Maps for O(1) lookup - NO queries in loop!
    const brandMap = new Map(brandProfiles.filter(p => p !== null).map(p => [p!._id.toString(), p!]))
    const storeMap = new Map(storeProfiles.filter(p => p !== null).map(p => [p!._id.toString(), p!]))
    const shelfMap = new Map(shelves.filter(s => s !== null).map(s => [s!._id.toString(), s!]))
    const userMap = new Map(users.filter(u => u !== null).map(u => [u!._id.toString(), u!]))

    // Enrich rental data - using batched data, NO queries in loop!
    const enrichedRentals = allRentals.map(rental => {
      // O(1) map lookups
      const brandProfile = brandMap.get(rental.brandProfileId.toString())
      const storeProfile = storeMap.get(rental.storeProfileId.toString())
      const shelf = shelfMap.get(rental.shelfId.toString())

      const brandUser = brandProfile ? userMap.get(brandProfile.userId.toString()) : null
      const storeUser = storeProfile ? userMap.get(storeProfile.userId.toString()) : null

      // Calculate duration in months
      const durationMs = rental.endDate - rental.startDate
      const durationMonths = Math.ceil(durationMs / (30 * 24 * 60 * 60 * 1000))
      const duration = `${durationMonths} ${durationMonths === 1 ? 'month' : 'months'}`

      // Calculate products summary
      const productsCount = rental.selectedProducts?.length || 0
      const totalQuantity = rental.selectedProducts?.reduce((sum, p) => sum + p.quantity, 0) || 0
      const productCategories = rental.selectedProducts
        ? [...new Set(rental.selectedProducts.map(p => p.category))]
        : []

      // Shelf location string
      const shelfLocation = shelf
        ? `${shelf.branchId ? 'Branch' : 'Unknown'}`
        : "-"

      return {
        id: rental._id,
        status: rental.status,
        createdAt: rental._creationTime,

        // Brand info
        brandId: rental.brandProfileId,
        brandName: brandProfile?.brandName || "-",
        brandOwnerName: brandUser?.name || "-",
        brandOwnerEmail: brandUser?.email || "-",
        brandOwnerPhone: brandUser?.phone || "-",
        brandProfileImage: brandUser?.image || null,

        // Store info
        storeId: rental.storeProfileId,
        storeName: storeProfile?.storeName || "-",
        storeOwnerName: storeUser?.name || "-",
        storeOwnerEmail: storeUser?.email || "-",
        storeOwnerPhone: storeUser?.phone || "-",
        storeProfileImage: storeUser?.image || null,

        // Shelf info
        shelfId: rental.shelfId,
        shelfName: shelf?.shelfName || "-",
        shelfLocation,
        shelfImageUrl: null, // Can add shelf image URL extraction if needed

        // Rental details
        startDate: rental.startDate,
        endDate: rental.endDate,
        duration,
        monthlyPrice: rental.monthlyPrice,
        totalAmount: rental.totalAmount,

        // Products
        productsCount,
        totalQuantity,
        productCategories,

        // Admin fields
        adminReviewedBy: rental.adminReviewedBy || null,
        adminReviewedAt: rental.adminReviewedAt || null,
        adminApprovedCommission: rental.adminApprovedCommission || null,
      }
    })

    // Apply status filter
    let filteredRentals = enrichedRentals
    if (statusFilter !== "all") {
      filteredRentals = enrichedRentals.filter(rental => {
        if (statusFilter === "pending_admin_approval") {
          return rental.status === "pending_admin_approval"
        } else if (statusFilter === "approved") {
          // "approved" means admin approved (status is "pending", "payment_pending", "active", etc.)
          return rental.status !== "pending_admin_approval" &&
                 rental.status !== "rejected" &&
                 rental.status !== "cancelled"
        } else if (statusFilter === "rejected") {
          return rental.status === "rejected"
        }
        return true
      })
    }

    // Apply search filter (after enrichment, before pagination)
    if (searchQuery?.trim()) {
      const normalizedQuery = searchQuery.toLowerCase()
      filteredRentals = filteredRentals.filter(rental =>
        rental.brandName?.toLowerCase().includes(normalizedQuery) ||
        rental.storeName?.toLowerCase().includes(normalizedQuery) ||
        rental.shelfName?.toLowerCase().includes(normalizedQuery) ||
        rental.brandOwnerEmail?.includes(normalizedQuery) ||  // Email already lowercase in DB
        rental.storeOwnerEmail?.includes(normalizedQuery)
      )
    }

    // Calculate stats with period-over-period changes
    const now = new Date()
    const { startDate: periodStart } = getDateRange(now, timePeriod)
    const { startDate: previousStart, endDate: previousEnd } = getDateRange(periodStart, timePeriod)

    // Filter rentals by period for stats
    const rentalsInPeriod = enrichedRentals.filter(r => {
      const createdDate = new Date(r.createdAt)
      return createdDate >= periodStart
    })

    const rentalsInPreviousPeriod = enrichedRentals.filter(r => {
      const createdDate = new Date(r.createdAt)
      return createdDate >= previousStart && createdDate < previousEnd
    })

    // Count by status for stats
    const totalPending = rentalsInPeriod.filter(r => r.status === "pending_admin_approval").length
    const totalApproved = rentalsInPeriod.filter(r =>
      r.status !== "pending_admin_approval" && r.status !== "rejected" && r.status !== "cancelled"
    ).length
    const totalRejected = rentalsInPeriod.filter(r => r.status === "rejected").length

    const previousPending = rentalsInPreviousPeriod.filter(r => r.status === "pending_admin_approval").length
    const previousApproved = rentalsInPreviousPeriod.filter(r =>
      r.status !== "pending_admin_approval" && r.status !== "rejected" && r.status !== "cancelled"
    ).length
    const previousRejected = rentalsInPreviousPeriod.filter(r => r.status === "rejected").length

    // Calculate percentage changes
    const pendingChange = previousPending > 0
      ? Math.round(((totalPending - previousPending) / previousPending) * 100 * 10) / 10
      : totalPending > 0 ? 100 : 0

    const approvedChange = previousApproved > 0
      ? Math.round(((totalApproved - previousApproved) / previousApproved) * 100 * 10) / 10
      : totalApproved > 0 ? 100 : 0

    const rejectedChange = previousRejected > 0
      ? Math.round(((totalRejected - previousRejected) / previousRejected) * 100 * 10) / 10
      : totalRejected > 0 ? 100 : 0

    // Calculate revenue (total amount from pending_admin_approval requests)
    const totalRevenue = rentalsInPeriod
      .filter(r => r.status === "pending_admin_approval")
      .reduce((sum, r) => sum + r.totalAmount, 0)

    const previousRevenue = rentalsInPreviousPeriod
      .filter(r => r.status === "pending_admin_approval")
      .reduce((sum, r) => sum + r.totalAmount, 0)

    const revenueChange = previousRevenue > 0
      ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100 * 10) / 10
      : totalRevenue > 0 ? 100 : 0

    // Apply pagination LAST (after all filtering)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedRentals = filteredRentals.slice(startIndex, endIndex)

    return {
      items: paginatedRentals,
      totalPages: Math.ceil(filteredRentals.length / limit),
      stats: {
        totalPending,
        pendingChange,
        totalApproved,
        approvedChange,
        totalRejected,
        rejectedChange,
        totalRevenue,
        revenueChange,
      }
    }
  },
})

/**
 * Admin mutation to approve a rental request
 * Sets platform commission and activates request for store review
 */
export const approveRequest = mutation({
  args: {
    requestId: v.id("rentalRequests"),
    platformCommissionRate: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Verify admin access
    const auth = await verifyAdminAccess(ctx)
    if (!auth.isAuthenticated || !auth.isAdmin) {
      throw new Error("Unauthorized: Admin access required")
    }

    // 2. Validate commission rate (maximum 50% per updated requirements)
    if (args.platformCommissionRate > 50) {
      throw new Error("Platform commission must not exceed 50%")
    }
    if (args.platformCommissionRate < 0) {
      throw new Error("Platform commission must be positive")
    }

    // 3. Get request and validate current state
    const request = await ctx.db.get(args.requestId)
    if (!request) {
      throw new Error("Request not found")
    }
    if (request.status !== "pending_admin_approval") {
      throw new Error(`Cannot approve request with status: ${request.status}. Expected: pending_admin_approval`)
    }

    // 4. Update request status and admin fields
    await ctx.db.patch(args.requestId, {
      status: "pending", // Store can now see it
      adminReviewedBy: auth.userId!,
      adminReviewedAt: Date.now(),
      adminApprovedCommission: args.platformCommissionRate,
    })

    // 5. Update commissions array with admin-set platform rate
    const updatedCommissions = [
      { type: "platform" as const, rate: args.platformCommissionRate },
      ...(request.commissions || []).filter(c => c.type !== "platform")
    ]
    await ctx.db.patch(args.requestId, {
      commissions: updatedCommissions
    })

    // 6. DEFERRED NOTIFICATIONS (moved from Task A1.2)
    // Fetch profiles for notifications
    const brandProfile = await ctx.db.get(request.brandProfileId)
    const storeProfile = await ctx.db.get(request.storeProfileId)
    const storeUser = storeProfile ? await ctx.db.get(storeProfile.userId) : null

    // 6a. System message in conversation
    if (request.conversationId && brandProfile) {
      await ctx.runMutation(api.chats.sendSystemMessage, {
        conversationId: request.conversationId,
        senderId: brandProfile._id as any,
        text: `تمت الموافقة على طلب الإيجار من قبل الإدارة. يمكن للمتجر مراجعته الآن.\nRental request approved by admin. Store can now review it.`,
        messageType: "rental_request",
      })
    }

    // 6b. WhatsApp notification to store owner
    if (storeProfile && storeUser?.phone && brandProfile) {
      await ctx.scheduler.runAfter(0, internal.whatsappNotifications.sendNewRequestNotification, {
        storeOwnerPhone: storeUser.phone,
        storeName: storeProfile.storeName || "المتجر",
        brandName: brandProfile.brandName || "العلامة التجارية",
        requestId: args.requestId,
      })
    }

    // 7. TODO: Audit log insertion (auditLogs table doesn't exist yet)
    // await ctx.db.insert("auditLogs", {
    //   userId: auth.userId!,
    //   action: "approve_rental_request",
    //   targetId: args.requestId,
    //   details: { commission: args.platformCommissionRate },
    //   timestamp: Date.now(),
    // })

    return { success: true }
  }
})

/**
 * Admin mutation to reject a rental request
 * Prevents store from ever seeing the request
 */
export const rejectRequest = mutation({
  args: {
    requestId: v.id("rentalRequests"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Verify admin access
    const auth = await verifyAdminAccess(ctx)
    if (!auth.isAuthenticated || !auth.isAdmin) {
      throw new Error("Unauthorized: Admin access required")
    }

    // 2. Validate reason is provided
    if (!args.reason.trim()) {
      throw new Error("Rejection reason is required")
    }

    // 3. Get request and validate
    const request = await ctx.db.get(args.requestId)
    if (!request) {
      throw new Error("Request not found")
    }

    // 4. Update request status and rejection details
    await ctx.db.patch(args.requestId, {
      status: "rejected",
      adminReviewedBy: auth.userId!,
      adminReviewedAt: Date.now(),
      adminRejectionReason: args.reason,
    })

    // 5. Notify brand owner of rejection
    const brandProfile = await ctx.db.get(request.brandProfileId)
    const storeProfile = await ctx.db.get(request.storeProfileId)
    const brandUser = brandProfile ? await ctx.db.get(brandProfile.userId) : null

    // 5a. WhatsApp notification to brand
    if (brandProfile && brandUser?.phone && storeProfile) {
      await ctx.scheduler.runAfter(0, internal.whatsappNotifications.sendRequestRejectedNotification, {
        brandOwnerPhone: brandUser.phone,
        brandName: brandProfile.brandName || "العلامة التجارية",
        storeName: storeProfile.storeName || "المتجر",
        requestId: args.requestId,
      })
    }

    // 5b. System message in conversation
    if (request.conversationId && brandProfile) {
      await ctx.runMutation(api.chats.sendSystemMessage, {
        conversationId: request.conversationId,
        senderId: brandProfile._id as any,
        text: `تم رفض طلب الإيجار من قبل الإدارة: ${args.reason}\nRental request rejected by admin: ${args.reason}`,
        messageType: "rental_rejected",
      })
    }

    // 6. TODO: Audit log insertion (auditLogs table doesn't exist yet)
    // await ctx.db.insert("auditLogs", {
    //   userId: auth.userId!,
    //   action: "reject_rental_request",
    //   targetId: args.requestId,
    //   details: { reason: args.reason },
    //   timestamp: Date.now(),
    // })

    return { success: true }
  }
})
