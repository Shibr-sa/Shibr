import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"
import { getUserProfile } from "./profileHelpers"

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
    
    return products.map(p => ({
      _id: p._id,
      name: p.name,
      code: p.code,
      category: p.category,
      price: p.price,
      quantity: p.stockQuantity,
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
    // Get the brand profile for this user
    const userProfile = await getUserProfile(ctx, args.ownerId)
    
    if (!userProfile || userProfile.type !== "brand_owner") {
      throw new Error("User is not a brand owner")
    }
    
    const brandProfileId = userProfile.profile._id
    const sampleProducts = [
      {
        name: "قهوة عربية فاخرة",
        code: "PRD-001",
        description: "قهوة عربية مميزة بنكهة الهيل",
        category: "مشروبات",
        price: 45,
        cost: 25,
        stockQuantity: 100,
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
        stockQuantity: 150,
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
        stockQuantity: 50,
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
        stockQuantity: 200,
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
        stockQuantity: 30,
        minQuantity: 5,
        sku: "SKU-SAFFRON-001",
        imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=200",
      },
    ]
    
    const productIds = []
    for (const product of sampleProducts) {
      const productId = await ctx.db.insert("products", {
        brandProfileId,
        ...product,
        totalSales: 0,
        totalRevenue: 0,
        shelfCount: 0,
        isActive: true,
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
    const activeProducts = products.filter(p => p.isActive).length
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
    const activeProducts = products.filter(p => p.isActive).length
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
    code: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    price: v.number(),
    cost: v.optional(v.number()),
    stockQuantity: v.number(),
    minQuantity: v.optional(v.number()),
    sku: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Not authenticated")
    }
    
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
      code: args.code,
      description: args.description || "",
      category: args.category || "",
      price: args.price,
      cost: args.cost,
      stockQuantity: args.stockQuantity,
      minQuantity: args.minQuantity,
      sku: args.sku,
      imageUrl: args.imageUrl,
      totalSales: 0,
      totalRevenue: 0,
      shelfCount: 0,
      isActive: true,
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
    stockQuantity: v.optional(v.number()),
    minQuantity: v.optional(v.number()),
    sku: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { productId, ...updates } = args
    
    await ctx.db.patch(productId, {
      ...updates,
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
    
    // Get all products for the owner
    const products = await ctx.db
      .query("products")
      .withIndex("by_brand_profile", (q) => q.eq("brandProfileId", brandProfileId))
      .collect()
    
    // Get rental requests with full information
    const rentalRequests = await ctx.db
      .query("rentalRequests")
      .withIndex("by_brand", (q) => q.eq("brandProfileId", brandProfileId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect()
    
    // Get store user information for each rental
    const rentalsWithStoreInfo = await Promise.all(
      rentalRequests.map(async (request) => {
        if (!request.storeProfileId) return { ...request, storeName: "متجر", city: "الرياض" }
        
        const storeProfile = await ctx.db.get(request.storeProfileId)
        const shelf = await ctx.db.get(request.shelfId)
        
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