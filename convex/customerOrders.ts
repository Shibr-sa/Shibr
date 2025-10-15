import { v } from "convex/values"
import { mutation, query, action, internalMutation, internalQuery, internalAction } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"
import { getUserProfile } from "./profileHelpers"
import { api, internal } from "./_generated/api"

// Internal mutation to create order in database
export const createOrderInternal = internalMutation({
  args: {
    shelfStoreId: v.id("shelfStores"),
    customerName: v.string(),
    customerPhone: v.string(),
    wafeqContactId: v.optional(v.string()),
    invoiceNumber: v.string(), // Required - must be provided from Wafeq
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
    })),
  },
  handler: async (ctx, args): Promise<{ orderId: Id<"customerOrders">, invoiceNumber: string }> => {
    // Get the shelf store
    const shelfStore = await ctx.db.get(args.shelfStoreId)
    if (!shelfStore || !shelfStore.isActive) {
      throw new Error("Store not found or inactive")
    }

    // Calculate order details
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

    // Calculate subtotal (sum of all items before tax)
    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0)

    // Calculate total with 15% VAT
    const total = subtotal * 1.15

    // Create the order
    const orderId = await ctx.db.insert("customerOrders", {
      shelfStoreId: args.shelfStoreId,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      wafeqContactId: args.wafeqContactId,
      invoiceNumber: args.invoiceNumber,
      items: orderItems,
      subtotal,
      total,
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
      invoiceNumber: args.invoiceNumber,
    }
  },
})

// Create a new customer order (action that calls Wafeq API then creates order)
export const createOrder = action({
  args: {
    shelfStoreId: v.id("shelfStores"),
    customerName: v.string(),
    customerPhone: v.string(),
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
    })),
  },
  handler: async (ctx, args): Promise<{ orderId: Id<"customerOrders">, invoiceNumber: string }> => {
    const wafeqApiKey = process.env.WAFEQ_API_KEY
    if (!wafeqApiKey) {
      throw new Error("WAFEQ_API_KEY not configured. Cannot create order without invoice.")
    }

    // Create contact in Wafeq (required)
    let wafeqContactId: string
    console.log("[Wafeq] Creating contact for:", args.customerName, args.customerPhone)

    const wafeqResponse = await fetch("https://api.wafeq.com/v1/contacts/", {
      method: "POST",
      headers: {
        "Authorization": `Api-Key ${wafeqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: args.customerName,
        phone: args.customerPhone,
      }),
    })

    console.log("[Wafeq] Contact response status:", wafeqResponse.status)

    if (!wafeqResponse.ok) {
      const errorText = await wafeqResponse.text()
      console.error("[Wafeq] Failed to create contact. Status:", wafeqResponse.status, "Response:", errorText)
      throw new Error(`Failed to create Wafeq contact: ${wafeqResponse.status} ${errorText}`)
    }

    const wafeqData = await wafeqResponse.json()
    wafeqContactId = wafeqData.id?.toString()
    if (!wafeqContactId) {
      throw new Error("Wafeq contact created but no ID returned")
    }
    console.log("[Wafeq] Successfully created contact with ID:", wafeqContactId)

    // Get product details for invoice line items
    const products = await Promise.all(
      args.items.map(item => ctx.runQuery(internal.customerOrders.getProductForInvoice, { productId: item.productId }))
    )

    // Create invoice in Wafeq (required)
    console.log("[Wafeq] Creating invoice for contact:", wafeqContactId)

    // Get Wafeq configuration from environment variables
    const wafeqAccountId = process.env.WAFEQ_ACCOUNT_ID
    const wafeqTaxRateId = process.env.WAFEQ_TAX_RATE_ID

    if (!wafeqAccountId || !wafeqTaxRateId) {
      throw new Error("Wafeq configuration incomplete. Please set WAFEQ_ACCOUNT_ID and WAFEQ_TAX_RATE_ID environment variables.")
    }

    // Calculate line items with products (matching Wafeq structure exactly)
    const lineItems = args.items.map((item, index) => {
      const product = products[index]
      return {
        description: product?.name || `Product ${item.productId}`,
        quantity: item.quantity,
        unit_amount: product?.price || 0,
        account: wafeqAccountId,
        tax_rate: wafeqTaxRateId,
      }
    })

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
    const timestamp = Date.now()
    const invoiceRef = `INV-${timestamp}`

    const invoicePayload = {
      contact: wafeqContactId,
      currency: "SAR",
      invoice_number: invoiceRef,
      invoice_date: today,
      invoice_due_date: dueDate,
      line_items: lineItems,
    }

    console.log("[Wafeq] Invoice payload:", JSON.stringify(invoicePayload, null, 2))

    const invoiceResponse = await fetch("https://api.wafeq.com/v1/invoices/", {
      method: "POST",
      headers: {
        "Authorization": `Api-Key ${wafeqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoicePayload),
    })

    console.log("[Wafeq] Invoice response status:", invoiceResponse.status)

    if (!invoiceResponse.ok) {
      const errorText = await invoiceResponse.text()
      console.error("[Wafeq] Failed to create invoice. Status:", invoiceResponse.status, "Response:", errorText)
      throw new Error(`Failed to create Wafeq invoice: ${invoiceResponse.status} ${errorText}`)
    }

    const invoiceData = await invoiceResponse.json()
    // Store the invoice ID (not invoice_number) for downloading PDFs
    const invoiceNumber = invoiceData.id?.toString() || invoiceData.invoice_number
    if (!invoiceNumber) {
      throw new Error("Wafeq invoice created but no ID returned")
    }
    console.log("[Wafeq] Successfully created invoice with ID:", invoiceNumber)
    console.log("[Wafeq] Invoice data:", JSON.stringify(invoiceData, null, 2))

    // Call internal mutation to create the order
    const result = await ctx.runMutation(internal.customerOrders.createOrderInternal, {
      shelfStoreId: args.shelfStoreId,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      wafeqContactId,
      invoiceNumber,
      items: args.items,
    })

    // Send invoice via WhatsApp in the background (don't wait for it)
    try {
      // Schedule WhatsApp invoice sending
      await ctx.scheduler.runAfter(0, internal.customerOrders.sendInvoiceToCustomer, {
        orderId: result.orderId,
        brandName: await ctx.runQuery(internal.customerOrders.getBrandName, { shelfStoreId: args.shelfStoreId }),
      })
    } catch (error) {
      console.error('[Order] Failed to schedule WhatsApp invoice:', error)
      // Don't fail the order creation if WhatsApp sending fails
    }

    return result
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

// Get order by invoice number
export const getOrderByInvoiceNumber = query({
  args: {
    invoiceNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("customerOrders")
      .withIndex("by_invoice_number", (q) => q.eq("invoiceNumber", args.invoiceNumber))
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
  },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("customerOrders")
      .withIndex("by_shelf_store", (q) => q.eq("shelfStoreId", args.shelfStoreId))
      .collect()

    // Sort by order date (newest first)
    return orders.sort((a, b) => b._creationTime - a._creationTime)
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

      orders = orders.filter(order => order._creationTime >= periodStart)
    }

    // Sort by order date (newest first)
    return orders.sort((a, b) => b._creationTime - a._creationTime)
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

      orders = orders.filter(order => order._creationTime >= periodStart)
    }

    // Sort by order date (newest first)
    return orders.sort((a, b) => b._creationTime - a._creationTime)
  },
})

// DEPRECATED: Status field has been removed from schema
// Keeping this commented for potential future use
/*
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
*/

// DEPRECATED: PaymentStatus field has been removed from schema
/*
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
*/

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

      orders = orders.filter(order => order._creationTime >= periodStart)
    }

    // Calculate statistics
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
    }
  },
})

// Update order payment status after successful payment
export const updateOrderPaymentStatus = mutation({
  args: {
    orderId: v.id("customerOrders"),
    paymentStatus: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    transactionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Only update the transactionReference field since paymentStatus doesn't exist in schema
    await ctx.db.patch(args.orderId, {
      ...(args.transactionId && { paymentReference: args.transactionId }),
    })

    return { success: true }
  },
})

// Debug query to check Wafeq integration
export const checkWafeqIntegration = query({
  args: {},
  handler: async (ctx) => {
    // Get the last 10 orders
    const orders = await ctx.db
      .query("customerOrders")
      .order("desc")
      .take(10)

    return orders.map(order => ({
      invoiceNumber: order.invoiceNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      wafeqContactId: order.wafeqContactId || "NOT SET",
      createdAt: new Date(order._creationTime).toISOString(),
    }))
  },
})

// Internal query to get product details for invoice
export const getProductForInvoice = internalQuery({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product) {
      return null
    }
    return {
      name: product.name,
      description: product.description,
      price: product.price,
    }
  },
})

// Internal query to get brand name
export const getBrandName = internalQuery({
  args: {
    shelfStoreId: v.id("shelfStores"),
  },
  handler: async (ctx, args) => {
    const shelfStore = await ctx.db.get(args.shelfStoreId)
    if (!shelfStore?.brandProfileId) {
      return "Brand"
    }

    const brandProfile = await ctx.db.get(shelfStore.brandProfileId)
    return brandProfile?.brandName || "Brand"
  },
})

// Internal action to send invoice to customer via WhatsApp
export const sendInvoiceToCustomer = internalAction({
  args: {
    orderId: v.id("customerOrders"),
    brandName: v.string(), // Changed from storeName to brandName
  },
  handler: async (ctx, args) => {
    try {
      console.log('[Order] Starting WhatsApp invoice send for order:', args.orderId)

      // Get the order details
      const order = await ctx.runQuery(api.customerOrders.getOrderById, {
        orderId: args.orderId,
      })

      if (!order) {
        throw new Error("Order not found")
      }

      // Download the invoice PDF from Wafeq
      console.log('[Order] Downloading invoice PDF from Wafeq')
      const pdfData = await ctx.runAction(api.customerOrders.downloadInvoicePDF, {
        orderId: args.orderId,
      })

      // Convert base64 to blob and store temporarily in Convex storage
      console.log('[Order] Storing PDF temporarily in Convex storage')

      // Convert base64 string to Uint8Array (without using fetch with data: URLs)
      const binaryString = atob(pdfData.pdfBase64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      // Create blob from Uint8Array
      const pdfBlob = new Blob([bytes], { type: 'application/pdf' })
      const storageId = await ctx.storage.store(pdfBlob)

      // Get public URL for the PDF
      const pdfUrl = await ctx.storage.getUrl(storageId)

      if (!pdfUrl) {
        throw new Error("Failed to get public URL for PDF")
      }

      console.log('[Order] PDF stored temporarily, public URL generated')

      // Format invoice date
      const invoiceDate = new Date(order._creationTime).toLocaleDateString('en-GB')

      // Calculate tax amount from stored values
      const taxAmount = order.total - order.subtotal

      // Format total with tax breakdown
      const invoiceTotal = `Subtotal: ${order.subtotal.toFixed(2)} SAR | Tax (15%): ${taxAmount.toFixed(2)} SAR | Total: ${order.total.toFixed(2)} SAR`

      try {
        // Send invoice via WhatsApp
        console.log('[Order] Sending invoice via WhatsApp')
        await ctx.runAction(internal.whatsappInvoice.sendInvoiceViaWhatsApp, {
          customerName: order.customerName || "Customer",
          customerPhone: order.customerPhone,
          brandName: args.brandName,
          invoiceNumber: order.invoiceNumber,
          invoiceDate,
          invoiceTotal,
          pdfUrl,
        })

        console.log('[Order] Invoice sent successfully via WhatsApp')

        // Schedule PDF deletion after 5 minutes to give WhatsApp time to download it
        console.log('[Order] Scheduling PDF deletion in 5 minutes')
        await ctx.scheduler.runAfter(
          5 * 60 * 1000, // 5 minutes in milliseconds
          internal.customerOrders.deletePdfFromStorage,
          { storageId }
        )
        console.log('[Order] PDF will be automatically deleted in 5 minutes')

        return { success: true }
      } catch (whatsappError) {
        // If WhatsApp sending fails, delete the PDF immediately to avoid storage buildup
        console.error('[Order] WhatsApp sending failed, cleaning up temporary PDF:', whatsappError)
        try {
          await ctx.storage.delete(storageId)
          console.log('[Order] Temporary PDF deleted after failed send')
        } catch (deleteError) {
          console.error('[Order] Failed to delete temporary PDF:', deleteError)
        }
        // Re-throw the original WhatsApp error
        throw whatsappError
      }
    } catch (error) {
      console.error('[Order] Error sending invoice via WhatsApp:', error)
      // Don't throw - we don't want to fail the order if WhatsApp fails
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },
})

// Internal action to delete PDF from storage (scheduled after WhatsApp has time to download)
export const deletePdfFromStorage = internalAction({
  args: {
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      console.log('[Order] Deleting scheduled PDF from storage:', args.storageId)
      await ctx.storage.delete(args.storageId as any)
      console.log('[Order] Scheduled PDF deleted successfully')
    } catch (error) {
      console.error('[Order] Failed to delete scheduled PDF:', error)
      // Don't throw - this is a cleanup operation
    }
  },
})

// Download invoice PDF from Wafeq
export const downloadInvoicePDF = action({
  args: {
    orderId: v.id("customerOrders"),
  },
  handler: async (ctx, args): Promise<{
    success: boolean
    invoiceNumber: string
    pdfBase64: string
    contentType: string
  }> => {
    // Get the order to retrieve invoice number
    const order = await ctx.runQuery(api.customerOrders.getOrderById, {
      orderId: args.orderId,
    })

    if (!order) {
      throw new Error("Order not found")
    }

    if (!order.invoiceNumber) {
      throw new Error("No invoice found for this order")
    }

    const wafeqApiKey = process.env.WAFEQ_API_KEY
    if (!wafeqApiKey) {
      throw new Error("WAFEQ_API_KEY not configured")
    }

    try {
      console.log(`[Wafeq] Downloading invoice PDF for: ${order.invoiceNumber}`)

      const response = await fetch(
        `https://api.wafeq.com/v1/invoices/${order.invoiceNumber}/download/`,
        {
          method: "GET",
          headers: {
            "Authorization": `Api-Key ${wafeqApiKey}`,
          },
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[Wafeq] Failed to download invoice. Status:", response.status, "Response:", errorText)
        throw new Error(`Failed to download invoice: ${response.status} ${response.statusText}`)
      }

      // Get the PDF as array buffer
      const pdfBuffer = await response.arrayBuffer()

      // Convert ArrayBuffer to base64 (without using Node.js Buffer)
      const bytes = new Uint8Array(pdfBuffer)
      let binary = ''
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      const base64Pdf = btoa(binary)

      console.log(`[Wafeq] Successfully downloaded invoice PDF (${pdfBuffer.byteLength} bytes)`)

      return {
        success: true,
        invoiceNumber: order.invoiceNumber,
        pdfBase64: base64Pdf,
        contentType: "application/pdf",
      }
    } catch (error) {
      console.error("[Wafeq] Error downloading invoice:", error)
      throw new Error(error instanceof Error ? error.message : "Failed to download invoice PDF")
    }
  },
})