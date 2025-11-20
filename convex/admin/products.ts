import { v } from "convex/values"
import { query } from "../_generated/server"
import { verifyAdminAccess } from "./helpers"
import { Id } from "../_generated/dataModel"

/**
 * Admin Products Module
 *
 * Provides queries for administrators to view and analyze products across the platform.
 * Includes active products on shelves with detailed sales and inventory metrics.
 */

// Query to get all active products currently on shelves
export const getActiveProductsOnShelves = query({
  args: {
    filters: v.optional(v.object({
      storeId: v.optional(v.id("storeProfiles")),
      brandId: v.optional(v.id("brandProfiles")),
      branchId: v.optional(v.id("branches")),
      expiringBefore: v.optional(v.number()), // Timestamp - show rentals ending before this date
    })),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const auth = await verifyAdminAccess(ctx)
    if (!auth.isAuthenticated || !auth.isAdmin) {
      // Return empty results when not authenticated or not admin
      return {
        products: [],
        total: 0,
      }
    }

    const { filters, limit = 50 } = args

    // Get all active rental requests
    const activeRentals = await ctx.db
      .query("rentalRequests")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect()

    // Apply filters at rental level
    let filteredRentals = activeRentals

    if (filters?.storeId) {
      filteredRentals = filteredRentals.filter(r => r.storeProfileId === filters.storeId)
    }

    if (filters?.brandId) {
      filteredRentals = filteredRentals.filter(r => r.brandProfileId === filters.brandId)
    }

    if (filters?.expiringBefore) {
      filteredRentals = filteredRentals.filter(r => r.endDate <= filters.expiringBefore!)
    }

    // Apply branch filter (requires shelf lookup)
    if (filters?.branchId) {
      const rentalShelfPairs = await Promise.all(
        filteredRentals.map(async (rental) => ({
          rental,
          shelf: await ctx.db.get(rental.shelfId)
        }))
      )
      filteredRentals = rentalShelfPairs
        .filter(pair => pair.shelf?.branchId === filters.branchId)
        .map(pair => pair.rental)
    }

    // Limit the number of rentals processed
    const limitedRentals = filteredRentals.slice(0, limit)

    // BATCH FETCH: Get all related entities upfront to avoid N+1 queries
    const brandIds = [...new Set(limitedRentals.map(r => r.brandProfileId))]
    const storeIds = [...new Set(limitedRentals.map(r => r.storeProfileId))]
    const shelfIds = [...new Set(limitedRentals.map(r => r.shelfId))]

    const brands = await Promise.all(brandIds.map(id => ctx.db.get(id)))
    const stores = await Promise.all(storeIds.map(id => ctx.db.get(id)))
    const shelves = await Promise.all(shelfIds.map(id => ctx.db.get(id)))

    // Create lookup maps for efficient access
    const brandMap = new Map(brands.map(b => b ? [b._id, b] : null).filter(Boolean) as [Id<"brandProfiles">, any][])
    const storeMap = new Map(stores.map(s => s ? [s._id, s] : null).filter(Boolean) as [Id<"storeProfiles">, any][])
    const shelfMap = new Map(shelves.map(s => s ? [s._id, s] : null).filter(Boolean) as [Id<"shelves">, any][])

    // Get branch IDs from shelves
    const branchIds = [...new Set(shelves.map(s => s?.branchId).filter(Boolean))] as Id<"branches">[]
    const branches = await Promise.all(branchIds.map(id => ctx.db.get(id)))
    const branchMap = new Map(branches.map(b => b ? [b._id, b] : null).filter(Boolean) as [Id<"branches">, any][])

    // Get all products from all rentals
    const productIds = [...new Set(
      limitedRentals.flatMap(r => r.selectedProducts.map(p => p.productId))
    )]
    const products = await Promise.all(productIds.map(id => ctx.db.get(id)))
    const productMap = new Map(products.map(p => p ? [p._id, p] : null).filter(Boolean) as [Id<"products">, any][])

    // Get all customer orders for sales calculation
    // Note: This could be optimized with a date range query if needed
    const allOrders = await ctx.db.query("customerOrders").collect()

    // Flatten products from all rentals with enriched data
    const productsOnShelves = []

    for (const rental of limitedRentals) {
      const brand = brandMap.get(rental.brandProfileId)
      const store = storeMap.get(rental.storeProfileId)
      const shelf = shelfMap.get(rental.shelfId)
      const branch = shelf?.branchId ? branchMap.get(shelf.branchId) : null

      // Process each product in the rental
      for (const item of rental.selectedProducts) {
        const product = productMap.get(item.productId)
        if (!product) continue

        // Calculate sold quantity from customer orders during rental period
        let soldQty = 0
        for (const order of allOrders) {
          // Only count orders within rental period (using _creationTime)
          if (order._creationTime >= rental.startDate && order._creationTime <= Date.now()) {
            const orderItem = order.items.find(i => i.productId === item.productId)
            if (orderItem) {
              soldQty += orderItem.quantity
            }
          }
        }

        const initialQuantity = item.quantity
        const remainingQuantity = Math.max(0, initialQuantity - soldQty)
        const daysUntilExpiry = Math.ceil((rental.endDate - Date.now()) / (24 * 60 * 60 * 1000))

        productsOnShelves.push({
          productId: item.productId,
          productName: product.name,
          productNameAr: product.nameAr,
          productPrice: product.price,
          productImages: product.images,

          brandId: rental.brandProfileId,
          brandName: brand?.brandName,
          brandNameAr: brand?.brandNameAr,

          storeId: rental.storeProfileId,
          storeName: store?.storeName,
          storeNameAr: store?.storeNameAr,

          branchId: branch?._id,
          branchName: branch?.branchName,
          branchNameAr: branch?.branchNameAr,

          shelfId: rental.shelfId,
          shelfName: shelf?.name,
          shelfNameAr: shelf?.nameAr,

          initialQuantity,
          soldQuantity: soldQty,
          remainingQuantity,

          rentalStartDate: rental.startDate,
          rentalEndDate: rental.endDate,
          daysUntilExpiry,

          rentalId: rental._id,
        })
      }
    }

    return {
      products: productsOnShelves,
      total: productsOnShelves.length,
    }
  }
})
