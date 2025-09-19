import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"
import { getUserProfile } from "./profileHelpers"
import { api } from "./_generated/api"

// Create a new customer order
export const createOrder = mutation({
  args: {
    shelfStoreId: v.id("shelfStores"),
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: v.string(),
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
    })),
    paymentMethod: v.union(
      v.literal("cash"),
      v.literal("bank_transfer"),
      v.literal("card"),
      v.literal("apple")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the shelf store
    const shelfStore = await ctx.db.get(args.shelfStoreId)
    if (!shelfStore || !shelfStore.isActive) {
      throw new Error("Store not found or inactive")
    }

    // Calculate order details
    let subtotal = 0
    const orderItems = await Promise.all(
      args.items.map(async (item) => {
        const product = await ctx.db.get(item.productId)
        if (!product) {
          throw new Error(`Product ${item.productId} not found`)
        }

        // Check stock availability
        if (product.stockQuantity && product.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`)
        }

        const itemSubtotal = product.price * item.quantity

        return {
          productId: item.productId,
          productName: product.name,
          price: product.price,
          quantity: item.quantity,
          subtotal: itemSubtotal,
        }
      })
    )

    // Calculate totals
    subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0)
    const storeCommission = (subtotal * shelfStore.storeCommissionRate) / 100
    const platformFee = (subtotal * shelfStore.platformFeeRate) / 100
    const brandRevenue = subtotal - storeCommission - platformFee
    const total = subtotal // Customer pays full price

    // Generate order number
    const orderCount = await ctx.db
      .query("customerOrders")
      .collect()
      .then(orders => orders.length)

    const orderNumber = `ORD-${String(orderCount + 1).padStart(6, "0")}`

    // Create the order
    const orderId = await ctx.db.insert("customerOrders", {
      shelfStoreId: args.shelfStoreId,
      customerName: args.customerName,
      customerEmail: args.customerEmail,
      customerPhone: args.customerPhone,
      items: orderItems,
      subtotal,
      storeCommission,
      platformFee,
      brandRevenue,
      total,
      status: "pending",
      paymentMethod: args.paymentMethod,
      paymentStatus: "pending",
      orderNumber,
      notes: args.notes,
      orderedAt: Date.now(),
    })

    // Update product stock
    for (const item of args.items) {
      const product = await ctx.db.get(item.productId)
      if (product && product.stockQuantity) {
        await ctx.db.patch(item.productId, {
          stockQuantity: product.stockQuantity - item.quantity,
          totalSales: (product.totalSales || 0) + item.quantity,
          totalRevenue: (product.totalRevenue || 0) + (product.price * item.quantity),
        })
      }
    }

    // Update rental request's selectedProducts quantities
    const rental = await ctx.db.get(shelfStore.rentalRequestId)
    if (rental && rental.selectedProducts) {
      const updatedProducts = rental.selectedProducts.map(prod => {
        const orderedItem = args.items.find(item => item.productId === prod.productId)
        if (orderedItem) {
          // Reduce the quantity available on the shelf
          return {
            ...prod,
            quantity: Math.max(0, prod.quantity - orderedItem.quantity)
          }
        }
        return prod
      })

      await ctx.db.patch(rental._id, {
        selectedProducts: updatedProducts
      })
    }

    // Update shelf store statistics
    await ctx.db.patch(args.shelfStoreId, {
      totalOrders: (shelfStore.totalOrders || 0) + 1,
      totalRevenue: (shelfStore.totalRevenue || 0) + total,
    })

    return {
      orderId,
      orderNumber,
    }
  },
})

// Get order by ID
export const getOrderById = query({
  args: {
    orderId: v.id("customerOrders"),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      return null
    }

    // Get shelf store details
    const shelfStore = await ctx.db.get(order.shelfStoreId)

    // Get brand profile details
    let brandName = null
    if (shelfStore?.brandProfileId) {
      const brandProfile = await ctx.db.get(shelfStore.brandProfileId)
      brandName = brandProfile?.brandName
    }

    return {
      ...order,
      storeName: shelfStore?.storeName,
      brandName: brandName || "Brand",
    }
  },
})

// Get order by order number
export const getOrderByNumber = query({
  args: {
    orderNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("customerOrders")
      .withIndex("by_order_number", (q) => q.eq("orderNumber", args.orderNumber))
      .first()

    if (!order) {
      return null
    }

    // Get shelf store details
    const shelfStore = await ctx.db.get(order.shelfStoreId)

    return {
      ...order,
      storeName: shelfStore?.storeName,
    }
  },
})

// Get orders for a shelf store
export const getShelfStoreOrders = query({
  args: {
    shelfStoreId: v.id("shelfStores"),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("refunded")
    )),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("customerOrders")
      .withIndex("by_shelf_store", (q) => q.eq("shelfStoreId", args.shelfStoreId))

    const orders = await query.collect()

    // Filter by status if provided
    const filteredOrders = args.status
      ? orders.filter(order => order.status === args.status)
      : orders

    // Sort by order date (newest first)
    return filteredOrders.sort((a, b) => b.orderedAt - a.orderedAt)
  },
})

// Get orders for store owner
export const getStoreOwnerOrders = query({
  args: {
    period: v.optional(v.union(
      v.literal("today"),
      v.literal("week"),
      v.literal("month"),
      v.literal("all")
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return []
    }

    // Get store profile
    const profileData = await getUserProfile(ctx, userId)
    if (!profileData || profileData.type !== "store_owner") {
      return []
    }

    // Get all shelf stores for this store owner
    const shelfStores = await ctx.db
      .query("shelfStores")
      .withIndex("by_store_profile", (q) =>
        q.eq("storeProfileId", profileData.profile._id)
      )
      .collect()

    // Get orders for all shelf stores
    const allOrders = await Promise.all(
      shelfStores.map(async (store) => {
        const orders = await ctx.db
          .query("customerOrders")
          .withIndex("by_shelf_store", (q) => q.eq("shelfStoreId", store._id))
          .collect()

        return orders.map(order => ({
          ...order,
          storeName: store.storeName,
          storeSlug: store.storeSlug,
        }))
      })
    )

    // Flatten and filter by period
    let orders = allOrders.flat()
    const now = Date.now()

    if (args.period && args.period !== "all") {
      const periodStart = {
        today: now - 24 * 60 * 60 * 1000,
        week: now - 7 * 24 * 60 * 60 * 1000,
        month: now - 30 * 24 * 60 * 60 * 1000,
      }[args.period]

      orders = orders.filter(order => order.orderedAt >= periodStart)
    }

    // Sort by order date (newest first)
    return orders.sort((a, b) => b.orderedAt - a.orderedAt)
  },
})

// Get orders for brand owner
export const getBrandOwnerOrders = query({
  args: {
    period: v.optional(v.union(
      v.literal("today"),
      v.literal("week"),
      v.literal("month"),
      v.literal("all")
    )),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return []
    }

    // Get brand profile
    const profileData = await getUserProfile(ctx, userId)
    if (!profileData || profileData.type !== "brand_owner") {
      return []
    }

    // Get all shelf stores for this brand owner
    const shelfStores = await ctx.db
      .query("shelfStores")
      .withIndex("by_brand_profile", (q) =>
        q.eq("brandProfileId", profileData.profile._id)
      )
      .collect()

    // Get orders for all shelf stores
    const allOrders = await Promise.all(
      shelfStores.map(async (store) => {
        const orders = await ctx.db
          .query("customerOrders")
          .withIndex("by_shelf_store", (q) => q.eq("shelfStoreId", store._id))
          .collect()

        return orders.map(order => ({
          ...order,
          storeName: store.storeName,
          storeSlug: store.storeSlug,
        }))
      })
    )

    // Flatten and filter by period
    let orders = allOrders.flat()
    const now = Date.now()

    if (args.period && args.period !== "all") {
      const periodStart = {
        today: now - 24 * 60 * 60 * 1000,
        week: now - 7 * 24 * 60 * 60 * 1000,
        month: now - 30 * 24 * 60 * 60 * 1000,
      }[args.period]

      orders = orders.filter(order => order.orderedAt >= periodStart)
    }

    // Sort by order date (newest first)
    return orders.sort((a, b) => b.orderedAt - a.orderedAt)
  },
})

// Update order status
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("customerOrders"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("refunded")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Not authenticated")
    }

    const order = await ctx.db.get(args.orderId)
    if (!order) {
      throw new Error("Order not found")
    }

    // Get the shelf store to verify ownership
    const shelfStore = await ctx.db.get(order.shelfStoreId)
    if (!shelfStore) {
      throw new Error("Store not found")
    }

    // Verify user has permission (store owner or brand owner)
    const profileData = await getUserProfile(ctx, userId)
    if (!profileData) {
      throw new Error("User profile not found")
    }

    const isStoreOwner = profileData.type === "store_owner" &&
      shelfStore.storeProfileId === profileData.profile._id
    const isBrandOwner = profileData.type === "brand_owner" &&
      shelfStore.brandProfileId === profileData.profile._id

    if (!isStoreOwner && !isBrandOwner) {
      throw new Error("Unauthorized to update this order")
    }

    // Update the order status
    const updates: any = {
      status: args.status,
    }

    // Add timestamps for specific status changes
    if (args.status === "confirmed") {
      updates.confirmedAt = Date.now()
    } else if (args.status === "delivered") {
      updates.deliveredAt = Date.now()
      updates.paymentStatus = "paid" // Mark as paid when delivered (for cash)
    } else if (args.status === "cancelled") {
      updates.cancelledAt = Date.now()

      // Restore product stock for cancelled orders
      for (const item of order.items) {
        const product = await ctx.db.get(item.productId)
        if (product) {
          await ctx.db.patch(item.productId, {
            stockQuantity: (product.stockQuantity || 0) + item.quantity,
            totalSales: Math.max(0, (product.totalSales || 0) - item.quantity),
            totalRevenue: Math.max(0, (product.totalRevenue || 0) - item.subtotal),
          })
        }
      }

      // Restore rental request's selectedProducts quantities
      const rental = await ctx.db.get(shelfStore.rentalRequestId)
      if (rental && rental.selectedProducts) {
        const updatedProducts = rental.selectedProducts.map(prod => {
          const cancelledItem = order.items.find(item => item.productId === prod.productId)
          if (cancelledItem) {
            // Restore the quantity back to the shelf
            return {
              ...prod,
              quantity: prod.quantity + cancelledItem.quantity
            }
          }
          return prod
        })

        await ctx.db.patch(rental._id, {
          selectedProducts: updatedProducts
        })
      }

      // Update shelf store statistics
      await ctx.db.patch(order.shelfStoreId, {
        totalOrders: Math.max(0, (shelfStore.totalOrders || 0) - 1),
        totalRevenue: Math.max(0, (shelfStore.totalRevenue || 0) - order.total),
      })
    }

    await ctx.db.patch(args.orderId, updates)

    return { success: true }
  },
})

// Update payment status
export const updatePaymentStatus = mutation({
  args: {
    orderId: v.id("customerOrders"),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    paymentReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      throw new Error("Order not found")
    }

    await ctx.db.patch(args.orderId, {
      paymentStatus: args.paymentStatus,
      paymentReference: args.paymentReference,
    })

    return { success: true }
  },
})

// Get order statistics for dashboard
export const getOrderStatistics = query({
  args: {
    shelfStoreId: v.optional(v.id("shelfStores")),
    period: v.union(
      v.literal("today"),
      v.literal("week"),
      v.literal("month"),
      v.literal("all")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return {
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
      }
    }

    let orders: any[] = []

    if (args.shelfStoreId) {
      // Get orders for specific shelf store
      orders = await ctx.db
        .query("customerOrders")
        .withIndex("by_shelf_store", (q) => q.eq("shelfStoreId", args.shelfStoreId!))
        .collect()
    } else {
      // Get all orders for user's stores
      const profileData = await getUserProfile(ctx, userId)
      if (!profileData) {
        return {
          totalOrders: 0,
          pendingOrders: 0,
          completedOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
        }
      }

      const shelfStores = await ctx.db
        .query("shelfStores")
        .withIndex(
          profileData.type === "store_owner" ? "by_store_profile" : "by_brand_profile",
          (q) => q.eq(
            profileData.type === "store_owner" ? "storeProfileId" : "brandProfileId",
            profileData.profile._id as any
          )
        )
        .collect()

      const allOrders = await Promise.all(
        shelfStores.map(store =>
          ctx.db
            .query("customerOrders")
            .withIndex("by_shelf_store", (q) => q.eq("shelfStoreId", store._id))
            .collect()
        )
      )

      orders = allOrders.flat()
    }

    // Filter by period
    const now = Date.now()
    if (args.period !== "all") {
      const periodStart = {
        today: now - 24 * 60 * 60 * 1000,
        week: now - 7 * 24 * 60 * 60 * 1000,
        month: now - 30 * 24 * 60 * 60 * 1000,
      }[args.period as "today" | "week" | "month"]

      orders = orders.filter(order => order.orderedAt >= periodStart)
    }

    // Calculate statistics
    const totalOrders = orders.length
    const pendingOrders = orders.filter(o => o.status === "pending").length
    const completedOrders = orders.filter(o => o.status === "delivered").length
    const totalRevenue = orders
      .filter(o => o.paymentStatus === "paid")
      .reduce((sum, o) => sum + o.total, 0)
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      averageOrderValue,
    }
  },
})