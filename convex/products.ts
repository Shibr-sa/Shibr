import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"
import { getUserProfile } from "./profileHelpers"
import { requireAuth } from "./helpers"

// Get products for a brand owner
export const getOwnerProducts = query({
  args: {
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get the user first
    const user = await ctx.db.get(args.ownerId)
    if (!user) {
      return []
    }
    
    // Try to get existing brand profile
    const brandProfile = await ctx.db
      .query("brandProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.ownerId))
      .first()
    
    // If no profile exists, return empty array
    // The profile will be created when they first try to add a product
    if (!brandProfile) {
      return []
    }
    
    const products = await ctx.db
      .query("products")
      .withIndex("by_brand_profile", (q) => q.eq("brandProfileId", brandProfile._id))
      .collect()
    
    return products.sort((a, b) => b._creationTime - a._creationTime)
  },
})

// Get products for the current user
export const getUserProducts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get user profile first
    const userProfile = await getUserProfile(ctx, userId)
    if (!userProfile || userProfile.type !== "brand_owner") {
      return []
    }

    const products = await ctx.db
      .query("products")
      .withIndex("by_brand_profile", (q) => q.eq("brandProfileId", userProfile.profile._id))
      .collect()

    // Get platform settings for commission rates
    const platformSettings = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "commission_rates"))
      .first()

    const platformFeeRate = platformSettings?.value?.brandSalesCommission || 9 // Default 9%

    // Get all customer orders to calculate real sales
    const allOrders = await ctx.db.query("customerOrders").collect()

    // Get all shelf stores (both active and inactive) for this brand
    const brandShelfStores = await ctx.db
      .query("shelfStores")
      .withIndex("by_brand_profile", (q) => q.eq("brandProfileId", userProfile.profile._id))
      .collect()

    // Create a map of shelf store ID to commission rates
    const shelfStoreCommissions = new Map(
      brandShelfStores.map(ss => {
        const storeRate = ss.commissions.find(c => c.type === "store")?.rate || 0
        const platformRate = ss.commissions.find(c => c.type === "platform")?.rate || platformFeeRate

        return [
          ss._id.toString(),
          {
            storeCommissionRate: storeRate,
            platformFeeRate: platformRate,
          }
        ]
      })
    )

    // Get active shelf stores to count stores selling each product
    const activeShelfStores = brandShelfStores.filter(ss => ss.isActive)

    // Get rental requests for active shelf stores to know which products they're selling
    const rentalRequestIds = activeShelfStores.map(ss => ss.rentalRequestId)
    const rentalRequests = await Promise.all(
      rentalRequestIds.map(id => ctx.db.get(id))
    )

    return products.map(p => {
      // Calculate total sales and net revenue for this product across all orders
      let totalSalesCount = 0
      let totalNetRevenue = 0

      for (const order of allOrders) {
        for (const item of order.items) {
          if (item.productId === p._id) {
            totalSalesCount += item.quantity

            // Calculate net revenue after commissions
            const saleAmount = item.subtotal
            const commissions = shelfStoreCommissions.get(order.shelfStoreId.toString())

            if (commissions) {
              const storeCommission = (saleAmount * commissions.storeCommissionRate) / 100
              const platformCommission = (saleAmount * commissions.platformFeeRate) / 100
              const netAmount = saleAmount - storeCommission - platformCommission
              totalNetRevenue += netAmount
            } else {
              // Fallback: use default platform fee if shelf store not found
              const platformCommission = (saleAmount * platformFeeRate) / 100
              totalNetRevenue += saleAmount - platformCommission
            }
          }
        }
      }

      // Count how many active stores are selling this product
      let storeCount = 0
      for (let i = 0; i < rentalRequests.length; i++) {
        const rental = rentalRequests[i]
        if (rental && rental.selectedProducts) {
          const hasProduct = rental.selectedProducts.some(sp => sp.productId === p._id)
          if (hasProduct) {
            storeCount++
          }
        }
      }

      return {
        _id: p._id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        price: p.price,
        quantity: p.stockQuantity,
        imageUrl: p.imageUrl,
        description: p.description,
        totalSales: totalSalesCount,
        totalRevenue: totalNetRevenue, // Net revenue after commissions
        shelfCount: storeCount,
      }
    })
  },
})

// Debug: Get all products in the database
export const getAllProducts = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect()
    return products
  },
})

// Get sales chart data for dashboard
export const getSalesChartData = query({
  args: {
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get the brand profile for this user
    const userProfile = await getUserProfile(ctx, args.ownerId)
    
    if (!userProfile || userProfile.type !== "brand_owner") {
      return []
    }
    
    const brandProfileId = userProfile.profile._id
    
    // Get all products for the owner
    const products = await ctx.db
      .query("products")
      .withIndex("by_brand_profile", (q) => q.eq("brandProfileId", brandProfileId))
      .collect()
    
    // Sort by revenue and take top products
    const topProducts = products
      .filter(p => (p.totalRevenue || 0) > 0)
      .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
    
    // Create array for 10 items
    const chartData = []
    
    // If we have products with sales, add them
    if (topProducts.length > 0) {
      for (let i = 0; i < 10; i++) {
        if (i < topProducts.length) {
          chartData.push({
            name: topProducts[i].name,
            revenue: topProducts[i].totalRevenue || 0,
            sales: topProducts[i].totalSales || 0,
            percentage: Math.round(((topProducts[i].totalRevenue || 0) / (topProducts[0].totalRevenue || 1)) * 100),
          })
        } else {
          // Add empty bar placeholder
          chartData.push({
            name: "",
            revenue: 0,
            sales: 0,
            percentage: 0,
          })
        }
      }
      return chartData
    }
    
    // If no products have actual sales, return empty array to show "no data" state
    // Don't show estimated/fake data
    return []
  },
})

// UNIFIED: Get all brand dashboard statistics in one query
// Replaces: getUserProductStats + getBrandShelfStoresStats
// More efficient: Single query, calculates net revenue once
export const getBrandDashboardStats = query({
  args: {
    period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("yearly")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        // Product stats
        totalProducts: 0,
        activeProducts: 0,
        totalSales: 0,
        totalRevenue: 0,
        totalInventory: 0,
        // Shelf store stats
        totalScans: 0,
        totalOrders: 0,
        // Changes (would need historical data)
        salesChange: 0,
        revenueChange: 0,
        productsChange: 0,
        scansChange: 0,
        ordersChange: 0,
      };
    }

    // Get user profile first
    const userProfile = await getUserProfile(ctx, userId)
    if (!userProfile || userProfile.type !== "brand_owner") {
      return {
        totalProducts: 0,
        activeProducts: 0,
        totalSales: 0,
        totalRevenue: 0,
        totalInventory: 0,
        totalScans: 0,
        totalOrders: 0,
        salesChange: 0,
        revenueChange: 0,
        productsChange: 0,
        scansChange: 0,
        ordersChange: 0,
      }
    }

    // Get all products for the owner
    const products = await ctx.db
      .query("products")
      .withIndex("by_brand_profile", (q) => q.eq("brandProfileId", userProfile.profile._id))
      .collect()

    // Get platform settings for commission rates
    const platformSettings = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "commission_rates"))
      .first()

    const platformFeeRate = platformSettings?.value?.brandSalesCommission || 9 // Default 9%

    // Get all customer orders to calculate real sales
    const allOrders = await ctx.db.query("customerOrders").collect()

    // Get all shelf stores for this brand
    const brandShelfStores = await ctx.db
      .query("shelfStores")
      .withIndex("by_brand_profile", (q) => q.eq("brandProfileId", userProfile.profile._id))
      .collect()

    // Create a map of shelf store ID to commission rates
    const shelfStoreCommissions = new Map(
      brandShelfStores.map(ss => {
        const storeRate = ss.commissions.find(c => c.type === "store")?.rate || 0
        const platformRate = ss.commissions.find(c => c.type === "platform")?.rate || platformFeeRate

        return [
          ss._id.toString(),
          {
            storeCommissionRate: storeRate,
            platformFeeRate: platformRate,
          }
        ]
      })
    )

    // Calculate total sales and net revenue across all products
    let totalSalesCount = 0
    let totalNetRevenue = 0

    for (const order of allOrders) {
      for (const item of order.items) {
        // Check if this product belongs to this brand
        const product = products.find(p => p._id === item.productId)
        if (product) {
          totalSalesCount += item.quantity

          // Calculate net revenue after commissions
          const saleAmount = item.subtotal
          const commissions = shelfStoreCommissions.get(order.shelfStoreId.toString())

          if (commissions) {
            const storeCommission = (saleAmount * commissions.storeCommissionRate) / 100
            const platformCommission = (saleAmount * commissions.platformFeeRate) / 100
            const netAmount = saleAmount - storeCommission - platformCommission
            totalNetRevenue += netAmount
          } else {
            // Fallback: use default platform fee if shelf store not found
            const platformCommission = (saleAmount * platformFeeRate) / 100
            totalNetRevenue += saleAmount - platformCommission
          }
        }
      }
    }

    // Calculate product stats
    const totalProducts = products.length
    const activeProducts = products.filter(p => (p.stockQuantity || 0) > 0).length
    const totalInventory = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0)

    // Calculate shelf store stats (scans and orders)
    let totalScans = 0
    let totalOrders = 0

    for (const store of brandShelfStores) {
      if (store.isActive) {
        totalScans += store.totalScans || 0
        totalOrders += store.totalOrders || 0
      }
    }

    // Calculate percentage changes based on actual data
    // In a real scenario, these would be compared with historical data from the previous period
    // For now, return 0 as we don't have historical data tracking yet
    const salesChange = 0
    const revenueChange = 0
    const productsChange = 0
    const scansChange = 0
    const ordersChange = 0

    return {
      // Product stats
      totalProducts,
      activeProducts,
      totalSales: totalSalesCount,
      totalRevenue: totalNetRevenue, // Net revenue after commissions
      totalInventory,
      // Shelf store stats
      totalScans,
      totalOrders,
      // Changes
      salesChange,
      revenueChange,
      productsChange,
      scansChange,
      ordersChange,
    }
  },
})

// Create a new product
export const createProduct = mutation({
  args: {
    name: v.string(),
    sku: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    price: v.number(),
    stockQuantity: v.number(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    // Get or create brand profile
    let brandProfile = await ctx.db
      .query("brandProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()
    
    if (!brandProfile) {
      const user = await ctx.db.get(userId)
      const brandProfileId = await ctx.db.insert("brandProfiles", {
        userId,
        isActive: true,
        brandName: user?.name || "My Brand",
      })
      brandProfile = await ctx.db.get(brandProfileId)
    }
    
    if (!brandProfile) {
      throw new Error("Could not create brand profile")
    }
    
    const productId = await ctx.db.insert("products", {
      brandProfileId: brandProfile._id,
      name: args.name,
      sku: args.sku,
      description: args.description || "",
      category: args.category || "",
      price: args.price,
      stockQuantity: args.stockQuantity,
      imageUrl: args.imageUrl,
      totalSales: 0,
      totalRevenue: 0,
    })
    
    return productId
  },
})

// Update a product
export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    name: v.optional(v.string()),
    sku: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    price: v.optional(v.number()),
    stockQuantity: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { productId, ...updates } = args
    
    await ctx.db.patch(productId, {
      ...updates,
    })
    
    return { success: true }
  },
})

// Delete a product
export const deleteProduct = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    // Get the product to verify ownership
    const product = await ctx.db.get(args.productId)
    if (!product) {
      throw new Error("Product not found")
    }

    // Verify user owns this product
    const userProfile = await getUserProfile(ctx, userId)
    if (!userProfile || userProfile.type !== "brand_owner") {
      throw new Error("Unauthorized: Only brand owners can delete products")
    }

    if (product.brandProfileId !== userProfile.profile._id) {
      throw new Error("Unauthorized: You can only delete your own products")
    }

    // Check if product is used in any active or payment_pending rental requests
    const activeRentals = await ctx.db
      .query("rentalRequests")
      .filter(q => q.or(
        q.eq(q.field("status"), "active"),
        q.eq(q.field("status"), "payment_pending")
      ))
      .collect()

    // Check if any active rental includes this product
    for (const rental of activeRentals) {
      if (rental.selectedProducts && rental.selectedProducts.length > 0) {
        const hasProduct = rental.selectedProducts.some(sp => sp.productId === args.productId)
        if (hasProduct) {
          throw new Error("Cannot delete product: It is currently displayed in an active shelf rental")
        }
      }
    }

    // Check if product has any sales in customer orders
    const allOrders = await ctx.db.query("customerOrders").collect()
    const hasSales = allOrders.some(order =>
      order.items.some(item => item.productId === args.productId)
    )

    if (hasSales) {
      throw new Error("Cannot delete product: It has existing sales records")
    }

    // All checks passed - delete the product
    await ctx.db.delete(args.productId)

    return { success: true }
  },
})

// Get latest sales operations for brand dashboard
export const getLatestSalesOperations = query({
  args: {
    ownerId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 3

    // Get the brand profile for this user
    const userProfile = await getUserProfile(ctx, args.ownerId)

    if (!userProfile || userProfile.type !== "brand_owner") {
      return []
    }

    const brandProfileId = userProfile.profile._id

    // Get all shelf stores for this brand
    const brandShelfStores = await ctx.db
      .query("shelfStores")
      .withIndex("by_brand_profile", (q) => q.eq("brandProfileId", brandProfileId))
      .collect()

    // Get all customer orders for these shelf stores
    const allSalesOperations = []

    for (const shelfStore of brandShelfStores) {
      // Get orders for this shelf store
      const orders = await ctx.db
        .query("customerOrders")
        .withIndex("by_shelf_store", (q) => q.eq("shelfStoreId", shelfStore._id))
        .collect()

      // Get store and shelf information
      const storeProfile = await ctx.db.get(shelfStore.storeProfileId)
      const shelf = await ctx.db.get(shelfStore.shelfId)

      // Process each order
      for (const order of orders) {
        // Process each item in the order as a separate sale operation
        for (const item of order.items) {
          allSalesOperations.push({
            invoiceNumber: order.invoiceNumber,
            productName: item.productName,
            storeName: storeProfile?.storeName || "Unknown Store",
            city: shelf?.city || "Unknown",
            price: item.subtotal, // Full sale amount (before commissions)
            date: order._creationTime,
            quantity: item.quantity,
          })
        }
      }
    }

    // Sort by date (newest first) and limit
    const sortedOperations = allSalesOperations
      .sort((a, b) => b.date - a.date)
      .slice(0, limit)

    return sortedOperations
  },
})