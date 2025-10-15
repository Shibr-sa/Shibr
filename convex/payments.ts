import { v } from "convex/values"
import { query, mutation } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { getUserProfile } from "./profileHelpers"
import { Doc } from "./_generated/dataModel"
import { requireAuth } from "./helpers"

// Get payment by rental request ID
export const getPaymentByRental = query({
  args: {
    rentalRequestId: v.id("rentalRequests"),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_rental", (q) => q.eq("rentalRequestId", args.rentalRequestId))
      .filter((q) => q.eq(q.field("type"), "brand_payment"))
      .first()

    return payment
  },
})

// Get all payments for the current user
export const getUserPayments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return []
    }

    const profileData = await getUserProfile(ctx, userId)
    if (!profileData) {
      return []
    }

    // Get payments based on profile type
    let payments: Doc<"payments">[] = []

    if (profileData.type === "brand_owner") {
      // Get payments made by brand
      payments = await ctx.db
        .query("payments")
        .withIndex("by_from_profile", (q) => q.eq("fromProfileId", profileData.profile._id))
        .order("desc")
        .collect()
    } else if (profileData.type === "store_owner") {
      // Get payments received by store
      payments = await ctx.db
        .query("payments")
        .withIndex("by_to_profile", (q) => q.eq("toProfileId", profileData.profile._id))
        .order("desc")
        .collect()
    }

    return payments
  },
})

// Get payment statistics
export const getPaymentStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return null
    }

    const profileData = await getUserProfile(ctx, userId)
    if (!profileData) {
      return null
    }

    let totalPaid = 0
    let totalReceived = 0

    if (profileData.type === "brand_owner") {
      // Get brand payment stats
      const payments = await ctx.db
        .query("payments")
        .withIndex("by_from_profile", (q) => q.eq("fromProfileId", profileData.profile._id))
        .collect()

      for (const payment of payments) {
        if (payment.status === "completed") {
          totalPaid += payment.amount
        }
      }
    } else if (profileData.type === "store_owner") {
      // Get store payment stats
      const payments = await ctx.db
        .query("payments")
        .withIndex("by_to_profile", (q) => q.eq("toProfileId", profileData.profile._id))
        .collect()

      for (const payment of payments) {
        if (payment.status === "completed") {
          totalReceived += payment.netAmount || payment.amount
        }
      }
    }

    return {
      totalPaid,
      totalReceived,
      accountType: profileData.type,
    }
  },
})

// Update payment method (for manual payment confirmation)
export const updatePaymentMethod = mutation({
  args: {
    paymentId: v.id("payments"),
    paymentMethod: v.string(),
    transactionReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx)

    const payment = await ctx.db.get(args.paymentId)
    if (!payment) {
      throw new Error("Payment not found")
    }

    // Update payment method
    await ctx.db.patch(args.paymentId, {
      paymentMethod: args.paymentMethod,
      transactionReference: args.transactionReference,
    })

    return { success: true }
  },
})

// Get payment by ID
export const getPaymentById = query({
  args: {
    paymentId: v.id("payments"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.paymentId)
  },
})

// Get payment by transfer ID
export const getPaymentByTransferId = query({
  args: {
    tapTransferId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .filter((q) => q.eq(q.field("tapTransferId"), args.tapTransferId))
      .first()
  },
})

// Update payment with transfer details
export const updatePaymentTransfer = mutation({
  args: {
    paymentId: v.id("payments"),
    tapTransferId: v.optional(v.string()),
    transferStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    )),
    transferredAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { paymentId, ...updateData } = args

    // Filter out undefined values
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    )

    await ctx.db.patch(paymentId, filteredData)

    return { success: true }
  },
})