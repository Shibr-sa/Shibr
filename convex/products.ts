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

    // Get all rental requests (both active and completed) for this brand to track sales
    const allRentalRequests = await ctx.db
      .query("rentalRequests")
      .withIndex("by_brand", (q) => q.eq("brandProfileId", userProfile.profile._id))
      .collect()

    // Create a map of rental ID to commission rates
    const rentalCommissions = new Map(
      allRentalRequests.map(rental => {
        const storeRate = rental.commissions.find(c => c.type === "store")?.rate || 0
        const platformRate = rental.commissions.find(c => c.type === "platform")?.rate || platformFeeRate

        return [
          rental._id.toString(),
          {
            storeCommissionRate: storeRate,
            platformFeeRate: platformRate,
          }
        ]
      })
    )

    // Get active rental requests to count branches selling each product
    const activeRentalRequests = allRentalRequests.filter(r => r.status === "active")

    // Batch fetch all shelves for rentals (avoid N+1 queries)
    const shelfIds = [...new Set(allRentalRequests.map(r => r.shelfId))]
    const shelves = await Promise.all(shelfIds.map(id => ctx.db.get(id)))
    const shelfMap = new Map(shelves.filter(s => s !== null).map(s => [s!._id.toString(), s!]))

    // Create a map of branch ID to rentals for faster lookup
    const branchToRentals = new Map<string, typeof allRentalRequests>()
    for (const rental of allRentalRequests) {
      const shelf = shelfMap.get(rental.shelfId.toString())
      if (shelf?.branchId) {
        const branchIdStr = shelf.branchId.toString()
        const existing = branchToRentals.get(branchIdStr) || []
        existing.push(rental)
        branchToRentals.set(branchIdStr, existing)
      }
    }

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

            // Find which rental this product belongs to (in this branch)
            const branchRentals = branchToRentals.get(order.branchId.toString()) || []
            const rentalWithProduct = branchRentals.find(r =>
              r.selectedProducts.some(sp => sp.productId === p._id)
            )

            const commissions = rentalWithProduct
              ? rentalCommissions.get(rentalWithProduct._id.toString())
              : null

            if (commissions) {
              const storeCommission = (saleAmount * commissions.storeCommissionRate) / 100
              const platformCommission = (saleAmount * commissions.platformFeeRate) / 100
              const netAmount = saleAmount - storeCommission - platformCommission
              totalNetRevenue += netAmount
            } else {
              // Fallback: use default platform fee if rental not found
              const platformCommission = (saleAmount * platformFeeRate) / 100
              totalNetRevenue += saleAmount - platformCommission
            }
          }
        }
      }

      // Count how many active branches are selling this product
      let storeCount = 0
      for (const rental of activeRentalRequests) {
        if (rental.selectedProducts) {
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
        // Branch store stats
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

    // Get all rental requests for this brand to track sales
    const allRentalRequests = await ctx.db
      .query("rentalRequests")
      .withIndex("by_brand", (q) => q.eq("brandProfileId", userProfile.profile._id))
      .collect()

    // Create a map of rental ID to commission rates
    const rentalCommissions = new Map(
      allRentalRequests.map(rental => {
        const storeRate = rental.commissions.find(c => c.type === "store")?.rate || 0
        const platformRate = rental.commissions.find(c => c.type === "platform")?.rate || platformFeeRate

        return [
          rental._id.toString(),
          {
            storeCommissionRate: storeRate,
            platformFeeRate: platformRate,
          }
        ]
      })
    )

    // Batch fetch all shelves for rentals (avoid N+1 queries)
    const shelfIdsForStats = [...new Set(allRentalRequests.map(r => r.shelfId))]
    const shelvesForStats = await Promise.all(shelfIdsForStats.map(id => ctx.db.get(id)))
    const shelfMapForStats = new Map(shelvesForStats.filter(s => s !== null).map(s => [s!._id.toString(), s!]))

    // Create a map of branch ID to rentals for faster lookup
    const branchToRentals = new Map<string, typeof allRentalRequests>()
    for (const rental of allRentalRequests) {
      const shelf = shelfMapForStats.get(rental.shelfId.toString())
      if (shelf?.branchId) {
        const branchIdStr = shelf.branchId.toString()
        const existing = branchToRentals.get(branchIdStr) || []
        existing.push(rental)
        branchToRentals.set(branchIdStr, existing)
      }
    }

    // Create a Set of product IDs for faster lookup
    const productIds = new Set(products.map(p => p._id.toString()))

    // Calculate total sales and net revenue across all products
    let totalSalesCount = 0
    let totalNetRevenue = 0

    for (const order of allOrders) {
      for (const item of order.items) {
        // Check if this product belongs to this brand
        if (productIds.has(item.productId.toString())) {
          totalSalesCount += item.quantity

          // Calculate net revenue after commissions
          const saleAmount = item.subtotal

          // Find which rental this product belongs to (in this branch)
          const branchRentals = branchToRentals.get(order.branchId.toString()) || []
          const rentalWithProduct = branchRentals.find(r =>
            r.selectedProducts.some(sp => sp.productId.toString() === item.productId.toString())
          )

          const commissions = rentalWithProduct
            ? rentalCommissions.get(rentalWithProduct._id.toString())
            : null

          if (commissions) {
            const storeCommission = (saleAmount * commissions.storeCommissionRate) / 100
            const platformCommission = (saleAmount * commissions.platformFeeRate) / 100
            const netAmount = saleAmount - storeCommission - platformCommission
            totalNetRevenue += netAmount
          } else {
            // Fallback: use default platform fee if rental not found
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

    // Calculate branch store stats (scans and orders)
    // Get unique branch IDs from active rentals
    const branchIds = new Set<Id<"branches">>()
    for (const rental of allRentalRequests) {
      if (rental.status === "active") {
        const shelf = shelfMapForStats.get(rental.shelfId.toString())
        if (shelf?.branchId) {
          branchIds.add(shelf.branchId)
        }
      }
    }

    // Batch fetch all branches (avoid N+1 queries)
    const branches = await Promise.all([...branchIds].map(id => ctx.db.get(id)))

    // Sum up scans and orders from all active branches
    let totalScans = 0
    let totalOrders = 0
    for (const branch of branches) {
      if (branch && branch.storeIsActive) {
        totalScans += branch.totalScans || 0
        totalOrders += branch.totalOrders || 0
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
      // Branch store stats
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

    // Get all rental requests for this brand to find branches
    const allRentalRequests = await ctx.db
      .query("rentalRequests")
      .withIndex("by_brand", (q) => q.eq("brandProfileId", brandProfileId))
      .collect()

    // Get all brand's products to filter orders
    const brandProducts = await ctx.db
      .query("products")
      .withIndex("by_brand_profile", (q) => q.eq("brandProfileId", brandProfileId))
      .collect()
    const brandProductIds = new Set(brandProducts.map(p => p._id))

    // Get unique branch IDs from rentals
    const branchIds = new Set<Id<"branches">>()
    for (const rental of allRentalRequests) {
      const shelf = await ctx.db.get(rental.shelfId)
      if (shelf?.branchId) {
        branchIds.add(shelf.branchId)
      }
    }

    // Get all customer orders for these branches
    const allSalesOperations = []

    for (const branchId of branchIds) {
      // Get orders for this branch
      const orders = await ctx.db
        .query("customerOrders")
        .withIndex("by_branch", (q) => q.eq("branchId", branchId))
        .collect()

      // Get branch information
      const branch = await ctx.db.get(branchId)
      const storeProfile = branch ? await ctx.db.get(branch.storeProfileId) : null

      // Process each order
      for (const order of orders) {
        // Process each item in the order as a separate sale operation
        // Only include items that are this brand's products
        for (const item of order.items) {
          if (brandProductIds.has(item.productId)) {
            allSalesOperations.push({
              invoiceNumber: order.invoiceNumber,
              productName: item.productName,
              storeName: storeProfile?.storeName || "Unknown Store",
              city: branch?.city || "Unknown",
              price: item.subtotal, // Full sale amount (before commissions)
              date: order._creationTime,
              quantity: item.quantity,
            })
          }
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