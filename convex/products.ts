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

    // Get all customer orders to calculate real sales
    const allOrders = await ctx.db.query("customerOrders").collect()

    // Get all active shelf stores for this brand to count stores selling each product
    const brandShelfStores = await ctx.db
      .query("shelfStores")
      .withIndex("by_brand_profile", (q) => q.eq("brandProfileId", userProfile.profile._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect()

    // Get rental requests for these shelf stores to know which products they're selling
    const rentalRequestIds = brandShelfStores.map(ss => ss.rentalRequestId)
    const rentalRequests = await Promise.all(
      rentalRequestIds.map(id => ctx.db.get(id))
    )

    return products.map(p => {
      // Calculate total sales for this product across all orders
      let totalSalesCount = 0
      let totalRevenueAmount = 0

      for (const order of allOrders) {
        for (const item of order.items) {
          if (item.productId === p._id) {
            totalSalesCount += item.quantity
            totalRevenueAmount += item.subtotal
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
        totalRevenue: totalRevenueAmount,
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

// Get product statistics for dashboard
export const getProductStats = query({
  args: {
    ownerId: v.id("users"),
    period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("yearly")),
  },
  handler: async (ctx, args) => {
    // Get the brand profile for this user
    const userProfile = await getUserProfile(ctx, args.ownerId)
    
    if (!userProfile || userProfile.type !== "brand_owner") {
      return {
        totalProducts: 0,
        activeProducts: 0,
        outOfStock: 0,
        inventoryHealth: 0,
        productsChange: 0,
        activeChange: 0,
        outOfStockChange: 0,
        inventoryHealthChange: 0,
      }
    }
    
    const brandProfileId = userProfile.profile._id
    const now = new Date()
    let compareDate = new Date()
    
    // Calculate comparison date based on period
    switch (args.period) {
      case "daily":
        compareDate.setDate(compareDate.getDate() - 1)
        break
      case "weekly":
        compareDate.setDate(compareDate.getDate() - 7)
        break
      case "monthly":
        compareDate.setMonth(compareDate.getMonth() - 1)
        break
      case "yearly":
        compareDate.setFullYear(compareDate.getFullYear() - 1)
        break
    }
    
    // Get all products for the owner
    const products = await ctx.db
      .query("products")
      .withIndex("by_brand_profile", (q) => q.eq("brandProfileId", brandProfileId))
      .collect()
    
    // Calculate current stats
    const totalProducts = products.length
    const activeProducts = products.filter(p => (p.stockQuantity || 0) > 0).length
    const totalSales = products.reduce((sum, p) => sum + (p.totalSales || 0), 0)
    const totalRevenue = products.reduce((sum, p) => sum + (p.totalRevenue || 0), 0)
    const totalInventory = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0)
    
    // Calculate percentage changes based on actual data
    // In a real scenario, these would be compared with historical data from the previous period
    // For now, return 0 as we don't have historical data tracking yet
    const salesChange = 0
    const revenueChange = 0
    const productsChange = 0
    
    return {
      totalProducts,
      activeProducts,
      totalSales,
      totalRevenue,
      totalInventory,
      salesChange,
      revenueChange,
      productsChange,
    }
  },
})

// Get product statistics for current user's dashboard
export const getUserProductStats = query({
  args: {
    period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("yearly")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        totalProducts: 0,
        activeProducts: 0,
        totalSales: 0,
        totalRevenue: 0,
        totalInventory: 0,
        salesChange: 0,
        revenueChange: 0,
        productsChange: 0,
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
        salesChange: 0,
        revenueChange: 0,
        productsChange: 0,
      }
    }
    
    const now = new Date()
    let compareDate = new Date()
    
    // Calculate comparison date based on period
    switch (args.period) {
      case "daily":
        compareDate.setDate(compareDate.getDate() - 1)
        break
      case "weekly":
        compareDate.setDate(compareDate.getDate() - 7)
        break
      case "monthly":
        compareDate.setMonth(compareDate.getMonth() - 1)
        break
      case "yearly":
        compareDate.setFullYear(compareDate.getFullYear() - 1)
        break
    }
    
    // Get all products for the owner
    const products = await ctx.db
      .query("products")
      .withIndex("by_brand_profile", (q) => q.eq("brandProfileId", userProfile.profile._id))
      .collect()
    
    // Calculate current stats
    const totalProducts = products.length
    const activeProducts = products.filter(p => (p.stockQuantity || 0) > 0).length
    const totalSales = products.reduce((sum, p) => sum + (p.totalSales || 0), 0)
    const totalRevenue = products.reduce((sum, p) => sum + (p.totalRevenue || 0), 0)
    const totalInventory = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0)
    
    // Calculate percentage changes based on actual data
    // In a real scenario, these would be compared with historical data from the previous period
    // For now, return 0 as we don't have historical data tracking yet
    const salesChange = 0
    const revenueChange = 0
    const productsChange = 0
    
    return {
      totalProducts,
      activeProducts,
      totalSales,
      totalRevenue,
      totalInventory,
      salesChange,
      revenueChange,
      productsChange,
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

// Delete a product (mark as out of stock)
export const deleteProduct = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    // Mark product as out of stock instead of using isActive
    await ctx.db.patch(args.productId, {
      stockQuantity: 0,
    })
    
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
            price: item.subtotal, // Total price for this item (price * quantity)
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