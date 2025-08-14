import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
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
      .filter(p => p.totalRevenue > 0)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
    
    // Create array for 6 items
    const chartData = []
    
    // If we have products with sales, add them
    if (topProducts.length > 0) {
      for (let i = 0; i < 6; i++) {
        if (i < topProducts.length) {
          chartData.push({
            name: topProducts[i].name,
            revenue: topProducts[i].totalRevenue,
            sales: topProducts[i].totalSales,
            percentage: Math.round((topProducts[i].totalRevenue / topProducts[0].totalRevenue) * 100),
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
        revenue: product.price * Math.min(product.quantity, 10), // Estimate based on price
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
    const totalSales = products.reduce((sum, p) => sum + p.totalSales, 0)
    const totalRevenue = products.reduce((sum, p) => sum + p.totalRevenue, 0)
    const totalInventory = products.reduce((sum, p) => sum + p.quantity, 0)
    
    // For demo purposes, let's calculate some percentage changes
    // In production, you'd compare with historical data
    const salesChange = totalSales > 0 ? 15.3 : 0 // Mock positive trend
    const revenueChange = totalRevenue > 0 ? 20.1 : 0 // Mock positive trend
    const productsChange = totalProducts > 0 ? 8.5 : 0 // Mock positive trend
    
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
      description: args.description,
      category: args.category,
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

// Seed some demo products
export const seedDemoProducts = mutation({
  args: {
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const demoProducts = [
      {
        name: "تيشرت أبيض M",
        code: "#14821",
        price: 89,
        quantity: 50,
        totalSales: 34,
        shelfCount: 3,
        totalRevenue: 3026,
      },
      {
        name: "تيشرت أسود L",
        code: "#14822",
        price: 95,
        quantity: 20,
        totalSales: 35,
        shelfCount: 2,
        totalRevenue: 3325,
      },
      {
        name: "تيشرت أزرق XL",
        code: "#14823",
        price: 120,
        quantity: 30,
        totalSales: 36,
        shelfCount: 1,
        totalRevenue: 4320,
      },
      {
        name: "تيشرت أحمر S",
        code: "#14824",
        price: 75,
        quantity: 40,
        totalSales: 37,
        shelfCount: 2,
        totalRevenue: 2775,
      },
      {
        name: "تيشرت أخضر M",
        code: "#14825",
        price: 110,
        quantity: 80,
        totalSales: 38,
        shelfCount: 1,
        totalRevenue: 4180,
      },
      {
        name: "تيشرت رمادي L",
        code: "#14826",
        price: 85,
        quantity: 120,
        totalSales: 39,
        shelfCount: 1,
        totalRevenue: 3315,
      },
      {
        name: "تيشرت أصفر S",
        code: "#14827",
        price: 100,
        quantity: 200,
        totalSales: 40,
        shelfCount: 1,
        totalRevenue: 4000,
      },
    ]
    
    // Check if products already exist
    const existingProducts = await ctx.db
      .query("products")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect()
    
    if (existingProducts.length > 0) {
      return { message: "Products already exist" }
    }
    
    // Insert demo products
    for (const product of demoProducts) {
      await ctx.db.insert("products", {
        ownerId: args.ownerId,
        name: product.name,
        code: product.code,
        description: "منتج عالي الجودة",
        category: "ملابس",
        price: product.price,
        currency: "SAR",
        quantity: product.quantity,
        totalSales: product.totalSales,
        totalRevenue: product.totalRevenue,
        shelfCount: product.shelfCount,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
    
    return { message: "Demo products created successfully" }
  },
})