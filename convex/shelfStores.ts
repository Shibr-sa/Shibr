import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"
import { getUserProfile } from "./profileHelpers"
import { api, internal } from "./_generated/api"

// Create a shelf store when a rental becomes active
export const createShelfStore = mutation({
  args: {
    rentalRequestId: v.id("rentalRequests"),
  },
  handler: async (ctx, args) => {
    // Get the rental request
    const rental = await ctx.db.get(args.rentalRequestId)
    if (!rental) {
      throw new Error("Rental request not found")
    }

    // Check if rental is active
    if (rental.status !== "active") {
      throw new Error("Rental must be active to create store")
    }

    // Check if store already exists
    const existingStore = await ctx.db
      .query("shelfStores")
      .withIndex("by_rental", (q) => q.eq("rentalRequestId", args.rentalRequestId))
      .first()

    if (existingStore) {
      return existingStore._id
    }

    // Get shelf and store profile details
    const shelf = await ctx.db.get(rental.shelfId)
    const storeProfile = await ctx.db.get(rental.storeProfileId)
    const brandProfile = await ctx.db.get(rental.brandProfileId)

    if (!shelf || !storeProfile || !brandProfile) {
      throw new Error("Missing required data for store creation")
    }

    // Generate unique store slug
    const baseSlug = `${storeProfile.storeName}-${shelf.shelfName}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

    // Ensure slug is unique
    let slug = baseSlug
    let counter = 1
    while (true) {
      const existing = await ctx.db
        .query("shelfStores")
        .withIndex("by_slug", (q) => q.eq("storeSlug", slug))
        .first()

      if (!existing) break
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Get platform settings for commission
    const platformSettings = await ctx.db.query("platformSettings").collect()
    const brandSalesCommission = platformSettings.find(s => s.key === "brandSalesCommission")?.value || 8

    // Create the store
    const siteUrl = process.env.SITE_URL || "http://localhost:3000"
    const qrCodeUrl = `${siteUrl}/store/${slug}`

    const storeId = await ctx.db.insert("shelfStores", {
      rentalRequestId: args.rentalRequestId,
      shelfId: rental.shelfId,
      storeProfileId: rental.storeProfileId,
      brandProfileId: rental.brandProfileId,
      storeName: `${storeProfile.storeName} - ${shelf.shelfName}`,
      storeSlug: slug,
      description: shelf.description,
      qrCodeUrl,
      storeCommissionRate: rental.storeCommission,
      platformFeeRate: brandSalesCommission,
      isActive: true,
      activatedAt: Date.now(),
      totalScans: 0,
      totalViews: 0,
      totalOrders: 0,
      totalRevenue: 0,
    })

    return storeId
  },
})

// Get shelf store by rental request
export const getShelfStoreByRental = query({
  args: {
    rentalRequestId: v.id("rentalRequests"),
  },
  handler: async (ctx, args) => {
    const store = await ctx.db
      .query("shelfStores")
      .withIndex("by_rental", (q) => q.eq("rentalRequestId", args.rentalRequestId))
      .first()

    return store
  },
})


// Get shelf store by slug (for public access)
export const getShelfStoreBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const store = await ctx.db
      .query("shelfStores")
      .withIndex("by_slug", (q) => q.eq("storeSlug", args.slug))
      .first()

    if (!store || !store.isActive) {
      return null
    }

    // Get associated data
    const rental = await ctx.db.get(store.rentalRequestId)
    const shelf = await ctx.db.get(store.shelfId)
    const storeProfile = await ctx.db.get(store.storeProfileId)
    const brandProfile = await ctx.db.get(store.brandProfileId)

    // Get products for this rental
    const products = rental?.selectedProducts || []

    // Enrich product data
    const enrichedProducts = await Promise.all(
      products.map(async (item) => {
        const product = await ctx.db.get(item.productId)
        return {
          ...product,
          ...item, // item fields override product fields to preserve rental quantity
          description: product?.description,
          imageUrl: product?.imageUrl,
          shelfQuantity: item.quantity, // Quantity available on this shelf
          available: item.quantity > 0,
        }
      })
    )

    return {
      ...store,
      shelf,
      storeName: storeProfile?.storeName,
      brandName: brandProfile?.brandName,
      products: enrichedProducts,
    }
  },
})

// Note: QR code generation is handled client-side for better compatibility
// The qrCodeUrl field contains the URL that should be encoded in the QR code

// Internal query to get shelf store by ID
export const getShelfStoreById = query({
  args: {
    shelfStoreId: v.id("shelfStores"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.shelfStoreId)
  },
})

// Deactivate a shelf store (when rental ends)
export const deactivateShelfStore = mutation({
  args: {
    rentalRequestId: v.id("rentalRequests"),
  },
  handler: async (ctx, args) => {
    const store = await ctx.db
      .query("shelfStores")
      .withIndex("by_rental", (q) => q.eq("rentalRequestId", args.rentalRequestId))
      .first()

    if (store) {
      await ctx.db.patch(store._id, {
        isActive: false,
        deactivatedAt: Date.now(),
      })
    }
  },
})

// Track analytics event
export const trackAnalytics = mutation({
  args: {
    shelfStoreId: v.id("shelfStores"),
    eventType: v.union(
      v.literal("qr_scan"),
      v.literal("page_view"),
      v.literal("product_view"),
      v.literal("add_to_cart"),
      v.literal("checkout_started"),
      v.literal("order_completed")
    ),
    sessionId: v.string(),
    productId: v.optional(v.id("products")),
    orderId: v.optional(v.id("customerOrders")),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    referrer: v.optional(v.string()),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Record the analytics event
    await ctx.db.insert("shelfStoreAnalytics", {
      shelfStoreId: args.shelfStoreId,
      eventType: args.eventType,
      sessionId: args.sessionId,
      productId: args.productId,
      orderId: args.orderId,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      referrer: args.referrer,
      country: args.country,
      city: args.city,
      timestamp: Date.now(),
    })

    // Update store statistics
    const store = await ctx.db.get(args.shelfStoreId)
    if (store) {
      const updates: any = {}

      if (args.eventType === "qr_scan") {
        updates.totalScans = (store.totalScans || 0) + 1
      } else if (args.eventType === "page_view") {
        updates.totalViews = (store.totalViews || 0) + 1
      }

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(args.shelfStoreId, updates)
      }
    }
  },
})

// Get analytics for a shelf store
export const getShelfStoreAnalytics = query({
  args: {
    shelfStoreId: v.id("shelfStores"),
    period: v.optional(v.union(
      v.literal("day"),
      v.literal("week"),
      v.literal("month"),
      v.literal("all")
    )),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    let startTime = 0

    switch (args.period) {
      case "day":
        startTime = now - 24 * 60 * 60 * 1000
        break
      case "week":
        startTime = now - 7 * 24 * 60 * 60 * 1000
        break
      case "month":
        startTime = now - 30 * 24 * 60 * 60 * 1000
        break
      default:
        startTime = 0
    }

    const analytics = await ctx.db
      .query("shelfStoreAnalytics")
      .withIndex("by_shelf_store", (q) =>
        q.eq("shelfStoreId", args.shelfStoreId)
      )
      .filter((q) => q.gte(q.field("timestamp"), startTime))
      .collect()

    // Aggregate analytics data
    const summary = {
      totalEvents: analytics.length,
      qrScans: analytics.filter(a => a.eventType === "qr_scan").length,
      pageViews: analytics.filter(a => a.eventType === "page_view").length,
      productViews: analytics.filter(a => a.eventType === "product_view").length,
      addToCarts: analytics.filter(a => a.eventType === "add_to_cart").length,
      checkoutsStarted: analytics.filter(a => a.eventType === "checkout_started").length,
      ordersCompleted: analytics.filter(a => a.eventType === "order_completed").length,
      uniqueSessions: new Set(analytics.map(a => a.sessionId)).size,
    }

    // Calculate conversion rate
    const conversionRate = summary.pageViews > 0
      ? (summary.ordersCompleted / summary.pageViews) * 100
      : 0

    return {
      ...summary,
      conversionRate,
      events: analytics,
    }
  },
})