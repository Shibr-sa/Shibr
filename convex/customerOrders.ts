import { v } from "convex/values"
import { mutation, query, action, internalMutation, internalQuery, internalAction } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"
import { getUserProfile } from "./profileHelpers"
import { api, internal } from "./_generated/api"

// STEP 1: Create order record immediately after payment (with payment reference to prevent duplicates)
export const createOrderFromPayment = mutation({
  args: {
    branchId: v.id("branches"),
    customerName: v.string(),
    customerPhone: v.string(),
    paymentReference: v.string(), // Tap charge ID
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
    })),
  },
  handler: async (ctx, args): Promise<{ orderId: Id<"customerOrders"> }> => {
    console.log('[Order] Step 1: Creating order record with payment reference:', args.paymentReference)

    // Check if order already exists for this payment reference (duplicate prevention)
    const existingOrders = await ctx.db
      .query("customerOrders")
      .collect()

    const existingOrder = existingOrders.find(o => o.paymentReference === args.paymentReference)
    if (existingOrder) {
      console.log('[Order] Order already exists for this payment:', existingOrder._id)
      return { orderId: existingOrder._id }
    }

    // Get the branch
    const branch = await ctx.db.get(args.branchId)
    if (!branch || !branch.storeIsActive) {
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

    // Calculate subtotal and total with 15% VAT
    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0)
    const total = subtotal * 1.15

    // Create the order record with payment reference (prevents duplicates)
    const orderId = await ctx.db.insert("customerOrders", {
      branchId: args.branchId,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      paymentReference: args.paymentReference,
      invoiceNumber: `PENDING-${Date.now()}`, // Temporary, will be updated with Wafeq invoice
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
    // Note: Products may come from multiple rentals in this branch
    // We need to find which rental each product belongs to and update accordingly
    const shelves = await ctx.db
      .query("shelves")
      .withIndex("by_branch", (q) => q.eq("branchId", args.branchId))
      .collect()

    const activeRentals = await Promise.all(
      shelves.map(async (shelf) =>
        ctx.db
          .query("rentalRequests")
          .withIndex("by_shelf_status", (q) =>
            q.eq("shelfId", shelf._id).eq("status", "active")
          )
          .collect()
      )
    ).then((results) => results.flat())

    // Update quantities in each affected rental
    for (const rental of activeRentals) {
      const updatedProducts = rental.selectedProducts.map((prod) => {
        const orderedItem = args.items.find((item) => item.productId === prod.productId)
        if (orderedItem) {
          return {
            ...prod,
            quantity: Math.max(0, prod.quantity - orderedItem.quantity),
          }
        }
        return prod
      })

      // Only update if something changed
      if (JSON.stringify(updatedProducts) !== JSON.stringify(rental.selectedProducts)) {
        await ctx.db.patch(rental._id, {
          selectedProducts: updatedProducts,
        })
      }
    }

    // Update branch store statistics
    await ctx.db.patch(args.branchId, {
      totalOrders: (branch.totalOrders || 0) + 1,
      totalRevenue: (branch.totalRevenue || 0) + total,
    })

    console.log('[Order] Step 1 complete: Order record created:', orderId)
    return { orderId }
  },
})

// STEP 2-4: Process Wafeq and send invoice (called after order record is created)
export const processOrderAfterPayment = action({
  args: {
    orderId: v.id("customerOrders"),
  },
  handler: async (ctx, args): Promise<{ success: boolean, invoiceNumber: string }> => {
    console.log('[Order] Steps 2-4: Processing Wafeq and invoice for order:', args.orderId)

    // Get the order
    const order = await ctx.runQuery(api.customerOrders.getOrderById, {
      orderId: args.orderId,
    })

    if (!order) {
      throw new Error("Order not found")
    }

    const wafeqApiKey = process.env.WAFEQ_API_KEY
    if (!wafeqApiKey) {
      throw new Error("WAFEQ_API_KEY not configured")
    }

    // STEP 2: Create Wafeq contact
    console.log('[Order] Step 2: Creating Wafeq contact for:', order.customerName)

    const wafeqResponse = await fetch("https://api.wafeq.com/v1/contacts/", {
      method: "POST",
      headers: {
        "Authorization": `Api-Key ${wafeqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: order.customerName,
        phone: order.customerPhone,
      }),
    })

    if (!wafeqResponse.ok) {
      const errorText = await wafeqResponse.text()
      throw new Error(`Failed to create Wafeq contact: ${wafeqResponse.status} ${errorText}`)
    }

    const wafeqData = await wafeqResponse.json()
    const wafeqContactId = wafeqData.id?.toString()
    if (!wafeqContactId) {
      throw new Error("Wafeq contact created but no ID returned")
    }

    // Update order with Wafeq contact ID
    await ctx.runMutation(api.customerOrders.updateOrderWafeqContact, {
      orderId: args.orderId,
      wafeqContactId,
    })

    console.log('[Order] Step 2 complete: Wafeq contact created:', wafeqContactId)

    // STEP 3: Create Wafeq invoice
    console.log('[Order] Step 3: Creating Wafeq invoice')

    const wafeqAccountId = process.env.WAFEQ_ACCOUNT_ID
    const wafeqTaxRateId = process.env.WAFEQ_TAX_RATE_ID

    if (!wafeqAccountId || !wafeqTaxRateId) {
      throw new Error("Wafeq configuration incomplete")
    }

    // Get product details for invoice line items
    const products = await Promise.all(
      order.items.map((item: any) => ctx.runQuery(internal.customerOrders.getProductForInvoice, { productId: item.productId }))
    )

    const lineItems = order.items.map((item: any, index: number) => {
      const product = products[index]
      return {
        description: product?.name || item.productName,
        quantity: item.quantity,
        unit_amount: item.price,
        account: wafeqAccountId,
        tax_rate: wafeqTaxRateId,
      }
    })

    const today = new Date().toISOString().split('T')[0]
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const invoicePayload = {
      contact: wafeqContactId,
      currency: "SAR",
      invoice_number: `INV-${args.orderId}`,
      invoice_date: today,
      invoice_due_date: dueDate,
      line_items: lineItems,
    }

    const invoiceResponse = await fetch("https://api.wafeq.com/v1/invoices/", {
      method: "POST",
      headers: {
        "Authorization": `Api-Key ${wafeqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoicePayload),
    })

    if (!invoiceResponse.ok) {
      const errorText = await invoiceResponse.text()
      throw new Error(`Failed to create Wafeq invoice: ${invoiceResponse.status} ${errorText}`)
    }

    const invoiceData = await invoiceResponse.json()
    const invoiceNumber = invoiceData.id?.toString() || invoiceData.invoice_number
    if (!invoiceNumber) {
      throw new Error("Wafeq invoice created but no ID returned")
    }

    // Update order with Wafeq invoice number
    await ctx.runMutation(api.customerOrders.updateOrderInvoiceNumber, {
      orderId: args.orderId,
      invoiceNumber,
    })

    console.log('[Order] Step 3 complete: Wafeq invoice created:', invoiceNumber)

    // STEP 4: Send invoice via WhatsApp
    console.log('[Order] Step 4: Sending invoice via WhatsApp')

    const brandName = await ctx.runQuery(internal.customerOrders.getBrandName, {
      branchId: order.branchId,
    })

    // Schedule WhatsApp sending (don't wait for it to avoid blocking)
    await ctx.scheduler.runAfter(0, internal.customerOrders.sendInvoiceToCustomer, {
      orderId: args.orderId,
      brandName,
    })

    console.log('[Order] Step 4: WhatsApp invoice scheduled')

    return {
      success: true,
      invoiceNumber,
    }
  },
})

// Helper mutation: Update order with Wafeq contact ID
export const updateOrderWafeqContact = mutation({
  args: {
    orderId: v.id("customerOrders"),
    wafeqContactId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, {
      wafeqContactId: args.wafeqContactId,
    })
  },
})

// Helper mutation: Update order with Wafeq invoice number
export const updateOrderInvoiceNumber = mutation({
  args: {
    orderId: v.id("customerOrders"),
    invoiceNumber: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, {
      invoiceNumber: args.invoiceNumber,
    })
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

    // Get branch details
    const branch = await ctx.db.get(order.branchId)

    // Get store profile for store name
    let storeName = null
    if (branch?.storeProfileId) {
      const storeProfile = await ctx.db.get(branch.storeProfileId)
      storeName = storeProfile?.storeName
    }

    // Get brand names from active rentals in this branch
    let brandNames: string[] = []
    if (branch) {
      const shelves = await ctx.db
        .query("shelves")
        .withIndex("by_branch", (q) => q.eq("branchId", branch._id))
        .collect()

      const activeRentals = await Promise.all(
        shelves.map(async (shelf) =>
          ctx.db
            .query("rentalRequests")
            .withIndex("by_shelf_status", (q) =>
              q.eq("shelfId", shelf._id).eq("status", "active")
            )
            .collect()
        )
      ).then((results) => results.flat())

      const uniqueBrandIds = [...new Set(activeRentals.map(r => r.brandProfileId))]
      brandNames = await Promise.all(
        uniqueBrandIds.map(async (brandId) => {
          const brand = await ctx.db.get(brandId)
          return brand?.brandName || "Brand"
        })
      )
    }

    return {
      ...order,
      storeName: storeName || "Store",
      brandName: brandNames.length > 0 ? brandNames.join(", ") : "Brand",
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

    // Get branch and store details
    const branch = await ctx.db.get(order.branchId)
    let storeName = null
    if (branch?.storeProfileId) {
      const storeProfile = await ctx.db.get(branch.storeProfileId)
      storeName = storeProfile?.storeName
    }

    return {
      ...order,
      storeName: storeName || "Store",
    }
  },
})

// Get orders for a branch
export const getBranchOrders = query({
  args: {
    branchId: v.id("branches"),
  },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("customerOrders")
      .withIndex("by_branch", (q) => q.eq("branchId", args.branchId))
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

    // Get all branches for this store owner
    const branches = await ctx.db
      .query("branches")
      .withIndex("by_store_profile", (q) =>
        q.eq("storeProfileId", profileData.profile._id)
      )
      .collect()

    // Get orders for all branches
    const allOrders = await Promise.all(
      branches.map(async (branch) => {
        const orders = await ctx.db
          .query("customerOrders")
          .withIndex("by_branch", (q) => q.eq("branchId", branch._id))
          .collect()

        const storeProfile = await ctx.db.get(branch.storeProfileId)
        return orders.map(order => ({
          ...order,
          storeName: storeProfile?.storeName || "Store",
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

    // Get all active rentals for this brand owner
    const activeRentals = await ctx.db
      .query("rentalRequests")
      .withIndex("by_brand_status", (q) =>
        q.eq("brandProfileId", profileData.profile._id).eq("status", "active")
      )
      .collect()

    // Get unique branch IDs from rentals
    const branchIds = await Promise.all(
      activeRentals.map(async (rental) => {
        const shelf = await ctx.db.get(rental.shelfId)
        return shelf?.branchId
      })
    ).then((ids) => [...new Set(ids.filter(Boolean))] as Id<"branches">[])

    // Get orders for all branches
    const allOrders = await Promise.all(
      branchIds.map(async (branchId) => {
        const branch = await ctx.db.get(branchId)
        const orders = await ctx.db
          .query("customerOrders")
          .withIndex("by_branch", (q) => q.eq("branchId", branchId))
          .collect()

        const storeProfile = branch ? await ctx.db.get(branch.storeProfileId) : null
        return orders.map(order => ({
          ...order,
          storeName: storeProfile?.storeName || "Store",
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

// Get order statistics for dashboard
export const getOrderStatistics = query({
  args: {
    branchId: v.optional(v.id("branches")),
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

    if (args.branchId) {
      // Get orders for specific branch
      orders = await ctx.db
        .query("customerOrders")
        .withIndex("by_branch", (q) => q.eq("branchId", args.branchId!))
        .collect()
    } else {
      // Get all orders for user's stores/brands
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

      let branchIds: Id<"branches">[] = []

      if (profileData.type === "store_owner") {
        // Get all branches for this store owner
        const branches = await ctx.db
          .query("branches")
          .withIndex("by_store_profile", (q) =>
            q.eq("storeProfileId", profileData.profile._id)
          )
          .collect()
        branchIds = branches.map(b => b._id)
      } else if (profileData.type === "brand_owner") {
        // Get branches from active rentals
        const activeRentals = await ctx.db
          .query("rentalRequests")
          .withIndex("by_brand_status", (q) =>
            q.eq("brandProfileId", profileData.profile._id).eq("status", "active")
          )
          .collect()

        const ids = await Promise.all(
          activeRentals.map(async (rental) => {
            const shelf = await ctx.db.get(rental.shelfId)
            return shelf?.branchId
          })
        )
        branchIds = [...new Set(ids.filter(Boolean))] as Id<"branches">[]
      }

      const allOrders = await Promise.all(
        branchIds.map(branchId =>
          ctx.db
            .query("customerOrders")
            .withIndex("by_branch", (q) => q.eq("branchId", branchId))
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

// Internal query to get brand name(s) from active rentals in a branch
export const getBrandName = internalQuery({
  args: {
    branchId: v.id("branches"),
  },
  handler: async (ctx, args) => {
    const branch = await ctx.db.get(args.branchId)
    if (!branch) {
      return "Brand"
    }

    // Get all active rentals in this branch
    const shelves = await ctx.db
      .query("shelves")
      .withIndex("by_branch", (q) => q.eq("branchId", branch._id))
      .collect()

    const activeRentals = await Promise.all(
      shelves.map(async (shelf) =>
        ctx.db
          .query("rentalRequests")
          .withIndex("by_shelf_status", (q) =>
            q.eq("shelfId", shelf._id).eq("status", "active")
          )
          .collect()
      )
    ).then((results) => results.flat())

    if (activeRentals.length === 0) {
      return "Brand"
    }

    // Get unique brand names
    const uniqueBrandIds = [...new Set(activeRentals.map(r => r.brandProfileId))]
    const brandNames = await Promise.all(
      uniqueBrandIds.map(async (brandId) => {
        const brand = await ctx.db.get(brandId)
        return brand?.brandName || "Brand"
      })
    )

    return brandNames.join(", ")
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