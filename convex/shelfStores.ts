import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"
import { getUserProfile } from "./profileHelpers"
import { getPeriodDates, calculatePercentageChange } from "./helpers"
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

    // Create the store with commissions from rental
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
      commissions: rental.commissions,
      isActive: true,
      activatedAt: Date.now(),
      totalScans: 0,
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

// Simplified stats increment
// NOTE: getBrandShelfStoresStats has been replaced by the unified getBrandDashboardStats
// query in products.ts for better performance and code reusability
export const incrementStats = mutation({
  args: {
    shelfStoreId: v.id("shelfStores"),
    statType: v.union(
      v.literal("scan"),
      v.literal("view"),
      v.literal("order")
    ),
    revenue: v.optional(v.number()), // For order events
  },
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.shelfStoreId)
    if (!store) return

    const updates: any = {}

    if (args.statType === "scan" || args.statType === "view") {
      // Both scan and view events increment totalScans
      updates.totalScans = (store.totalScans || 0) + 1
    } else if (args.statType === "order") {
      updates.totalOrders = (store.totalOrders || 0) + 1
      if (args.revenue) {
        updates.totalRevenue = (store.totalRevenue || 0) + args.revenue
      }
    }

    await ctx.db.patch(args.shelfStoreId, updates)
  },
})

