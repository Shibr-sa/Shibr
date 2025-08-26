import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"

// Get products for a brand owner
export const getOwnerProducts = query({
  args: {
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect()
    
    return products.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
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
    
    const products = await ctx.db
      .query("products")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect()
    
    return products.map(p => ({
      _id: p._id,
      name: p.name,
      code: p.code,
      category: p.category,
      price: p.price,
      quantity: p.quantity,
      imageUrl: p.imageUrl,
      isActive: p.isActive
    }))
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

// Seed sample products for a user
export const seedSampleProducts = mutation({
  args: {
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const sampleProducts = [
      {
        name: "قهوة عربية فاخرة",
        code: "PRD-001",
        description: "قهوة عربية مميزة بنكهة الهيل",
        category: "مشروبات",
        price: 45,
        cost: 25,
        currency: "SAR",
        quantity: 100,
        minQuantity: 20,
        sku: "SKU-COFFEE-001",
        imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200",
      },
      {
        name: "شاي أخضر عضوي",
        code: "PRD-002",
        description: "شاي أخضر طبيعي 100%",
        category: "مشروبات",
        price: 35,
        cost: 18,
        currency: "SAR",
        quantity: 150,
        minQuantity: 30,
        sku: "SKU-TEA-001",
        imageUrl: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=200",
      },
      {
        name: "عسل طبيعي",
        code: "PRD-003",
        description: "عسل جبلي طبيعي",
        category: "أغذية",
        price: 120,
        cost: 80,
        currency: "SAR",
        quantity: 50,
        minQuantity: 10,
        sku: "SKU-HONEY-001",
        imageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=200",
      },
      {
        name: "تمر سكري",
        code: "PRD-004",
        description: "تمر سكري فاخر من القصيم",
        category: "أغذية",
        price: 65,
        cost: 40,
        currency: "SAR",
        quantity: 200,
        minQuantity: 40,
        sku: "SKU-DATES-001",
        imageUrl: "https://images.unsplash.com/photo-1608797178974-15b35a64ede9?w=200",
      },
      {
        name: "زعفران إيراني",
        code: "PRD-005",
        description: "زعفران إيراني أصلي",
        category: "توابل",
        price: 250,
        cost: 180,
        currency: "SAR",
        quantity: 30,
        minQuantity: 5,
        sku: "SKU-SAFFRON-001",
        imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=200",
      },
    ]
    
    const productIds = []
    for (const product of sampleProducts) {
      const productId = await ctx.db.insert("products", {
        ownerId: args.ownerId,
        ...product,
        totalSales: 0,
        totalRevenue: 0,
        shelfCount: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      productIds.push(productId)
    }
    
    return { success: true, productIds, count: productIds.length }
  },
})

// Get sales chart data for dashboard
export const getSalesChartData = query({
  args: {
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all products for the owner
    const products = await ctx.db
      .query("products")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect()
    
    // Sort by revenue and take top products
    const topProducts = products
      .filter(p => (p.totalRevenue || 0) > 0)
      .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
    
    // Create array for 6 items
    const chartData = []
    
    // If we have products with sales, add them
    if (topProducts.length > 0) {
      for (let i = 0; i < 6; i++) {
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
    
    // Otherwise return products sorted by price potential
    const estimatedProducts = products
      .map(product => ({
        name: product.name,
        revenue: product.price * Math.min(product.quantity || 0, 10), // Estimate based on price
        sales: 0,
        percentage: 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
    
    // Create array with exactly 6 items
    const result = []
    for (let i = 0; i < 6; i++) {
      if (i < estimatedProducts.length) {
        const product = estimatedProducts[i]
        if (estimatedProducts[0].revenue > 0) {
          product.percentage = Math.round((product.revenue / estimatedProducts[0].revenue) * 100)
        }
        result.push(product)
      } else {
        // Add empty bar placeholder
        result.push({
          name: "",
          revenue: 0,
          sales: 0,
          percentage: 0,
        })
      }
    }
    
    return result
  },
})

// Get product statistics for dashboard
export const getProductStats = query({
  args: {
    ownerId: v.id("users"),
    period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("yearly")),
  },
  handler: async (ctx, args) => {
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
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect()
    
    // Calculate current stats
    const totalProducts = products.length
    const activeProducts = products.filter(p => p.isActive).length
    const totalSales = products.reduce((sum, p) => sum + (p.totalSales || 0), 0)
    const totalRevenue = products.reduce((sum, p) => sum + (p.totalRevenue || 0), 0)
    const totalInventory = products.reduce((sum, p) => sum + (p.quantity || 0), 0)
    
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
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect()
    
    // Calculate current stats
    const totalProducts = products.length
    const activeProducts = products.filter(p => p.isActive).length
    const totalSales = products.reduce((sum, p) => sum + (p.totalSales || 0), 0)
    const totalRevenue = products.reduce((sum, p) => sum + (p.totalRevenue || 0), 0)
    const totalInventory = products.reduce((sum, p) => sum + (p.quantity || 0), 0)
    
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
    ownerId: v.id("users"),
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    price: v.number(),
    cost: v.optional(v.number()),
    currency: v.string(),
    quantity: v.number(),
    minQuantity: v.optional(v.number()),
    sku: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const productId = await ctx.db.insert("products", {
      ownerId: args.ownerId,
      name: args.name,
      code: args.code,
      description: args.description || "",
      category: args.category || "",
      price: args.price,
      cost: args.cost,
      currency: args.currency || "SAR",
      quantity: args.quantity,
      minQuantity: args.minQuantity,
      sku: args.sku,
      imageUrl: args.imageUrl,
      totalSales: 0,
      totalRevenue: 0,
      shelfCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    
    return productId
  },
})

// Update a product
export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    price: v.optional(v.number()),
    cost: v.optional(v.number()),
    quantity: v.optional(v.number()),
    minQuantity: v.optional(v.number()),
    sku: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { productId, ...updates } = args
    
    await ctx.db.patch(productId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    
    return { success: true }
  },
})

// Delete a product (soft delete)
export const deleteProduct = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.productId, {
      isActive: false,
      updatedAt: new Date().toISOString(),
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
    
    // Get all products for the owner
    const products = await ctx.db
      .query("products")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect()
    
    // Get rental requests with full information
    const rentalRequests = await ctx.db
      .query("rentalRequests")
      .withIndex("by_requester")
      .filter((q) => q.and(
        q.eq(q.field("requesterId"), args.ownerId),
        q.eq(q.field("status"), "active")
      ))
      .collect()
    
    // Get store user information for each rental
    const rentalsWithStoreInfo = await Promise.all(
      rentalRequests.map(async (request) => {
        if (!request.ownerId) return { ...request, storeName: "متجر", city: "الرياض" }
        
        const storeUser = await ctx.db.get(request.ownerId)
        const storeProfile = storeUser ? await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", request.ownerId!))
          .first() : null
        const shelf = await ctx.db.get(request.shelfId)
        
        // Get store owner name from users table
        // Removed to avoid variable redeclaration
        return {
          ...request,
          storeName: storeProfile?.storeName || "متجر",
          city: shelf?.city || "الرياض",
        }
      })
    )
    
    // Create mock sales operations based on products with sales
    const salesOperations = []
    const productsWithSales = products.filter(p => (p.totalSales || 0) > 0)
    
    if (productsWithSales.length > 0) {
      // Generate recent sales from products
      for (let i = 0; i < Math.min(limit, productsWithSales.length); i++) {
        const product = productsWithSales[i]
        const rental = rentalsWithStoreInfo[i % rentalsWithStoreInfo.length] // Cycle through rentals
        
        // Generate a recent date (within last 7 days)
        const daysAgo = Math.floor(Math.random() * 7)
        const saleDate = new Date()
        saleDate.setDate(saleDate.getDate() - daysAgo)
        
        salesOperations.push({
          orderNumber: `ORD-${Math.floor(Math.random() * 90000 + 10000)}`,
          productName: product.name,
          storeName: rental?.storeName || "متجر الرياض",
          city: rental?.city || "الرياض",
          price: product.price,
          date: saleDate.toISOString(),
        })
      }
    }
    // If no sales or no products, return empty array
    // The UI will show an appropriate empty state
    
    return salesOperations
  },
})