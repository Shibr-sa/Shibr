import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

// Create a new rental request
export const createRentalRequest = mutation({
  args: {
    shelfId: v.id("shelves"),
    brandOwnerId: v.id("users"),
    startDate: v.string(),
    endDate: v.string(),
    productType: v.string(),
    productDescription: v.string(),
    productCount: v.number(),
    additionalNotes: v.string(),
    conversationId: v.id("conversations"),
    selectedProductIds: v.array(v.id("products")),
    selectedProductQuantities: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    // Get the shelf details
    const shelf = await ctx.db.get(args.shelfId)
    if (!shelf) {
      throw new Error("Shelf not found")
    }
    
    // Get the brand owner details
    const brandOwner = await ctx.db.get(args.brandOwnerId)
    if (!brandOwner) {
      throw new Error("Brand owner not found")
    }
    
    // Check if there's an existing active request for the same shelf by the same brand
    const existingRequest = await ctx.db
      .query("rentalRequests")
      .withIndex("by_brand_owner")
      .filter((q) => 
        q.and(
          q.eq(q.field("brandOwnerId"), args.brandOwnerId),
          q.eq(q.field("shelfId"), args.shelfId)
        )
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "accepted"),
          q.eq(q.field("status"), "payment_pending")
        )
      )
      .first()
    
    // If there's an existing request, update it instead of creating a new one
    if (existingRequest) {
      await ctx.db.patch(existingRequest._id, {
        startDate: args.startDate,
        endDate: args.endDate,
        productType: args.productType,
        productDescription: args.productDescription,
        productCount: args.productCount,
        additionalNotes: args.additionalNotes,
        selectedProductIds: args.selectedProductIds,
        selectedProductQuantities: args.selectedProductQuantities,
        updatedAt: new Date().toISOString(),
      })
      
      // Send a message in the conversation about the update
      if (args.conversationId) {
        await ctx.db.insert("messages", {
          conversationId: args.conversationId,
          senderId: args.brandOwnerId,
          text: "تم تحديث تفاصيل طلب الإيجار / Rental request details have been updated",
          messageType: "system",
          isRead: false,
          createdAt: new Date().toISOString(),
        })
      }
      
      return { 
        requestId: existingRequest._id,
        isUpdate: true 
      }
    }
    
    // Calculate monthly price and total price
    const startDate = new Date(args.startDate)
    const endDate = new Date(args.endDate)
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                      (endDate.getMonth() - startDate.getMonth()) + 
                      (endDate.getDate() >= startDate.getDate() ? 1 : 0)
    const months = Math.max(1, monthsDiff)
    const totalPrice = shelf.monthlyPrice * months
    
    // Create the rental request with 48 hour expiry
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000) // 48 hours from now
    
    const requestId = await ctx.db.insert("rentalRequests", {
      shelfId: args.shelfId,
      brandOwnerId: args.brandOwnerId,
      storeOwnerId: shelf.ownerId,
      startDate: args.startDate,
      endDate: args.endDate,
      productType: args.productType,
      productDescription: args.productDescription,
      productCount: args.productCount,
      additionalNotes: args.additionalNotes,
      monthlyPrice: shelf.monthlyPrice,
      totalPrice: totalPrice,
      status: "pending",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      conversationId: args.conversationId,
      selectedProductIds: args.selectedProductIds,
      selectedProductQuantities: args.selectedProductQuantities,
    })
    
    // Create a notification for the store owner
    await ctx.db.insert("notifications", {
      userId: shelf.ownerId,
      title: "طلب إيجار جديد / New Rental Request",
      message: `${brandOwner.storeName || brandOwner.fullName} wants to rent your shelf / يرغب ${brandOwner.storeName || brandOwner.fullName} في استئجار رفك`,
      type: "rental_request",
      rentalRequestId: requestId,
      actionUrl: `/store-dashboard/orders`,
      actionLabel: "عرض الطلب / View Request",
      isRead: false,
      createdAt: new Date().toISOString(),
    })
    
    // Send a system message in the conversation
    if (args.conversationId) {
      await ctx.db.insert("messages", {
        conversationId: args.conversationId,
        senderId: args.brandOwnerId,
        text: `تم إرسال طلب إيجار جديد للرف / New rental request sent for the shelf`,
        messageType: "rental_request",
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    }
    
    return { 
      requestId,
      isUpdate: false 
    }
  },
})

// Accept a rental request
export const acceptRentalRequest = mutation({
  args: {
    requestId: v.id("rentalRequests"),
    response: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId)
    if (!request) {
      throw new Error("Request not found")
    }
    
    // Update request status to accepted (payment_pending)
    await ctx.db.patch(args.requestId, {
      status: "accepted",
      storeOwnerResponse: args.response || "Request accepted",
      respondedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    
    // Auto-reject all other pending requests for the same shelf
    const otherPendingRequests = await ctx.db
      .query("rentalRequests")
      .withIndex("by_shelf")
      .filter((q) => 
        q.and(
          q.eq(q.field("shelfId"), request.shelfId),
          q.eq(q.field("status"), "pending"),
          q.neq(q.field("_id"), args.requestId)
        )
      )
      .collect()
    
    // Reject each other pending request
    for (const otherRequest of otherPendingRequests) {
      await ctx.db.patch(otherRequest._id, {
        status: "rejected",
        storeOwnerResponse: "Another rental request was accepted for this shelf / تم قبول طلب إيجار آخر لهذا الرف",
        respondedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      
      // Create notification for the brand owner
      await ctx.db.insert("notifications", {
        userId: otherRequest.brandOwnerId,
        title: "طلبك تم رفضه تلقائياً / Request Auto-Rejected",
        message: `تم قبول طلب آخر لنفس الرف / Another request was accepted for the same shelf`,
        type: "rental_rejected",
        rentalRequestId: otherRequest._id,
        isRead: false,
        createdAt: new Date().toISOString(),
      })
      
      // Send system message in conversation if exists
      if (otherRequest.conversationId) {
        await ctx.db.insert("messages", {
          conversationId: otherRequest.conversationId,
          senderId: request.storeOwnerId,
          text: "عذراً، تم قبول طلب إيجار آخر لهذا الرف. / Sorry, another rental request has been accepted for this shelf.",
          messageType: "rental_rejected",
          isRead: false,
          createdAt: new Date().toISOString(),
        })
        
        // Archive the conversation
        const conversation = await ctx.db.get(otherRequest.conversationId)
        if (conversation) {
          await ctx.db.patch(otherRequest.conversationId, {
            status: "archived",
          })
        }
      }
    }
    
    // Get brand owner details for notification
    const brandOwner = await ctx.db.get(request.brandOwnerId)
    const shelf = await ctx.db.get(request.shelfId)
    
    // Create notification for brand owner
    await ctx.db.insert("notifications", {
      userId: request.brandOwnerId,
      title: "طلبك تم قبوله! / Your Request Was Accepted!",
      message: `تم قبول طلب إيجار الرف. يرجى إتمام الدفع / Your shelf rental request has been accepted. Please complete payment`,
      type: "rental_accepted",
      rentalRequestId: request._id,
      actionUrl: `/brand-dashboard/shelves`,
      actionLabel: "إتمام الدفع / Complete Payment",
      isRead: false,
      createdAt: new Date().toISOString(),
    })
    
    // Send system message in conversation if exists
    if (request.conversationId) {
      await ctx.db.insert("messages", {
        conversationId: request.conversationId,
        senderId: request.storeOwnerId,
        text: args.response || "تم قبول طلب الإيجار! يرجى إتمام الدفع لتفعيل الإيجار. / Rental request accepted! Please complete payment to activate the rental.",
        messageType: "rental_accepted",
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    }
    
    return { success: true }
  },
})

// Reject a rental request
export const rejectRentalRequest = mutation({
  args: {
    requestId: v.id("rentalRequests"),
    response: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId)
    if (!request) {
      throw new Error("Request not found")
    }
    
    // Update request status to rejected
    await ctx.db.patch(args.requestId, {
      status: "rejected",
      storeOwnerResponse: args.response || "Request rejected",
      respondedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    
    // Archive the conversation to prevent further messages
    if (request.conversationId) {
      const conversation = await ctx.db.get(request.conversationId)
      if (conversation) {
        await ctx.db.patch(request.conversationId, {
          status: "archived",
        })
      }
    }
    
    // Create notification for brand owner
    await ctx.db.insert("notifications", {
      userId: request.brandOwnerId,
      title: "طلبك تم رفضه / Your Request Was Rejected",
      message: `تم رفض طلب إيجار الرف / Your shelf rental request has been rejected`,
      type: "rental_rejected",
      rentalRequestId: request._id,
      isRead: false,
      createdAt: new Date().toISOString(),
    })
    
    // Send system message in conversation if exists
    if (request.conversationId) {
      await ctx.db.insert("messages", {
        conversationId: request.conversationId,
        senderId: request.storeOwnerId,
        text: args.response || "عذراً، تم رفض طلب الإيجار. / Sorry, the rental request has been rejected.",
        messageType: "rental_rejected",
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    }
    
    return { success: true }
  },
})

// Get a single rental request
export const getRentalRequest = query({
  args: { requestId: v.id("rentalRequests") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId)
    if (!request) {
      return null
    }
    
    // Get related data
    const [shelf, brandOwner, storeOwner] = await Promise.all([
      ctx.db.get(request.shelfId),
      ctx.db.get(request.brandOwnerId),
      ctx.db.get(request.storeOwnerId),
    ])
    
    // Get shelf images if they exist
    let shelfImageUrl = null
    let exteriorImageUrl = null
    let interiorImageUrl = null
    
    if (shelf?.shelfImage) {
      shelfImageUrl = await ctx.storage.getUrl(shelf.shelfImage as Id<"_storage">)
    }
    if (shelf?.exteriorImage) {
      exteriorImageUrl = await ctx.storage.getUrl(shelf.exteriorImage as Id<"_storage">)
    }
    if (shelf?.interiorImage) {
      interiorImageUrl = await ctx.storage.getUrl(shelf.interiorImage as Id<"_storage">)
    }
    
    return {
      ...request,
      shelf: shelf ? {
        ...shelf,
        shelfImage: shelfImageUrl,
        exteriorImage: exteriorImageUrl,
        interiorImage: interiorImageUrl,
      } : null,
      brandOwner,
      storeOwner,
    }
  },
})

// Get a single rental request by ID with full details
export const getRentalRequestById = query({
  args: {
    requestId: v.id("rentalRequests"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId)
    
    if (!request) {
      return null
    }
    
    // Get the brand owner details
    const brandOwner = await ctx.db.get(request.brandOwnerId)
    
    // Get shelf details
    const shelf = await ctx.db.get(request.shelfId)
    
    // Get selected products with their requested quantities
    let products: any[] = []
    if (request.selectedProductIds && request.selectedProductIds.length > 0) {
      products = await Promise.all(
        request.selectedProductIds.map(async (productId, index) => {
          const product = await ctx.db.get(productId)
          if (product) {
            // Add the requested quantity to the product
            return {
              ...product,
              requestedQuantity: request.selectedProductQuantities?.[index] || 1
            }
          }
          return null
        })
      )
      // Filter out any null products
      products = products.filter(p => p !== null)
    }
    
    // Return enriched request data
    return {
      ...request,
      otherUserId: brandOwner?._id,
      otherUserName: brandOwner?.brandName || brandOwner?.fullName || "Unknown",
      otherUserEmail: brandOwner?.email,
      city: shelf?.city,
      shelfCity: shelf?.city,
      shelfName: shelf?.shelfName,
      shelfBranch: shelf?.branch,
      // Brand specific details
      activityType: brandOwner?.brandType || "Not specified",
      phoneNumber: brandOwner?.phoneNumber,
      mobileNumber: brandOwner?.phoneNumber,
      website: brandOwner?.website,
      commercialRegisterNumber: brandOwner?.businessRegistration,
      commercialRegisterFile: brandOwner?.businessRegistrationDocumentUrl,
      crNumber: brandOwner?.businessRegistration,
      crFile: brandOwner?.businessRegistrationDocumentUrl,
      brandLogo: brandOwner?.profileImageUrl || brandOwner?.storeLogo,
      ownerName: brandOwner?.ownerName || brandOwner?.fullName,
      // Rating information
      brandRating: brandOwner?.averageRating || 0,
      brandTotalRatings: brandOwner?.totalRatings || 0,
      // Products
      products: products,
    }
  },
})

// Get all rental requests for a user (as brand owner or store owner)
export const getUserRentalRequests = query({
  args: {
    userId: v.id("users"),
    userType: v.union(v.literal("brand"), v.literal("store")),
  },
  handler: async (ctx, args) => {
    // Query based on user type
    const requests = args.userType === "brand"
      ? await ctx.db
          .query("rentalRequests")
          .withIndex("by_brand_owner")
          .filter((q) => q.eq(q.field("brandOwnerId"), args.userId))
          .collect()
      : await ctx.db
          .query("rentalRequests")
          .withIndex("by_store_owner")
          .filter((q) => q.eq(q.field("storeOwnerId"), args.userId))
          .collect()
    
    // Get additional data for each request
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        // Get the other party's details
        const otherUser = args.userType === "brand"
          ? await ctx.db.get(request.storeOwnerId)
          : await ctx.db.get(request.brandOwnerId)
        
        // Get shelf details
        const shelf = await ctx.db.get(request.shelfId)
        
        // For store owners viewing brand requests, include all brand details
        if (args.userType === "store" && otherUser) {
          return {
            ...request,
            otherUserId: otherUser._id,
            otherUserName: otherUser.brandName || otherUser.fullName || "Unknown",
            otherUserEmail: otherUser.email,
            city: shelf?.city,
            shelfCity: shelf?.city,
            shelfName: shelf?.shelfName,
            shelfBranch: shelf?.branch,
            // Brand specific details
            activityType: otherUser.brandType || "Not specified",
            phoneNumber: otherUser.phoneNumber,
            mobileNumber: otherUser.phoneNumber,
            website: otherUser.website,
            commercialRegisterNumber: otherUser.businessRegistration,
            commercialRegisterFile: otherUser.businessRegistrationDocumentUrl,
            crNumber: otherUser.businessRegistration,
            crFile: otherUser.businessRegistrationDocumentUrl,
            brandLogo: otherUser.profileImageUrl || otherUser.storeLogo,
            ownerName: otherUser.ownerName || otherUser.fullName,
            // Note: Social media and brand description fields don't exist in the schema yet
            // They would need to be added to the users table if needed
          }
        }
        
        // For brand owners viewing store requests
        return {
          ...request,
          otherUserId: otherUser?._id,
          otherUserName: otherUser?.storeName || otherUser?.fullName || "Unknown",
          otherUserEmail: otherUser?.email,
          city: shelf?.city,
          shelfName: shelf?.shelfName,
          shelfBranch: shelf?.branch,
          phoneNumber: otherUser?.phoneNumber,
        }
      })
    )
    
    // Sort by creation date (newest first)
    return enrichedRequests.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },
})

// Automatically expire pending requests after 48 hours
export const expireRentalRequest = mutation({
  args: {
    requestId: v.id("rentalRequests"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId)
    if (!request) {
      throw new Error("Request not found")
    }
    // Update request status to rejected (expired)
    await ctx.db.patch(request._id, {
      status: "rejected",
      storeOwnerResponse: "Request expired",
      respondedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    // Archive conversation when request expires
    if (request.conversationId) {
      const conversation = await ctx.db.get(request.conversationId)
      if (conversation) {
        await ctx.db.patch(request.conversationId, {
          status: "archived",
        })
      }
    }
    // Create notification for brand owner
    await ctx.db.insert("notifications", {
      userId: request.brandOwnerId,
      title: "انتهت صلاحية الطلب / Request Expired",
      message: `انتهت صلاحية طلب إيجار الرف / Your shelf rental request has expired`,
      type: "rental_expired",
      rentalRequestId: request._id,
      isRead: false,
      createdAt: new Date().toISOString(),
    })
    return { success: true }
  },
})

// Get active rental request for a shelf
export const getActiveRentalRequest = query({
  args: {
    shelfId: v.id("shelves"),
    brandOwnerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Look for an active request for this shelf by this brand owner
    const activeRequest = await ctx.db
      .query("rentalRequests")
      .withIndex("by_brand_owner")
      .filter((q) =>
        q.and(
          q.eq(q.field("brandOwnerId"), args.brandOwnerId),
          q.eq(q.field("shelfId"), args.shelfId)
        )
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "accepted"),
          q.eq(q.field("status"), "payment_pending")
        )
      )
      .first()
    
    return activeRequest
  },
})

// Check if shelf is still available (no accepted/active requests from anyone)
export const isShelfAvailable = query({
  args: {
    shelfId: v.id("shelves"),
  },
  handler: async (ctx, args) => {
    // Check if shelf exists and is available
    const shelf = await ctx.db.get(args.shelfId)
    if (!shelf || !shelf.isAvailable) {
      return { available: false, reason: "shelf_not_available" }
    }
    
    // Check for any accepted, payment_pending, or active requests
    const unavailableRequests = await ctx.db
      .query("rentalRequests")
      .withIndex("by_shelf")
      .filter((q) => q.eq(q.field("shelfId"), args.shelfId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "accepted"),
          q.eq(q.field("status"), "payment_pending"),
          q.eq(q.field("status"), "active")
        )
      )
      .first()
    
    if (unavailableRequests) {
      return { 
        available: false, 
        reason: "already_accepted",
        acceptedByOther: true 
      }
    }
    
    return { available: true, reason: null }
  },
})

// Get rental statistics with percentage changes
export const getRentalStatsWithChanges = query({
  args: {
    userId: v.id("users"),
    userType: v.union(v.literal("brand"), v.literal("store")),
    period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("yearly")),
  },
  handler: async (ctx, args) => {
    // Query based on user type
    const requests = args.userType === "brand"
      ? await ctx.db
          .query("rentalRequests")
          .withIndex("by_brand_owner")
          .filter((q) => q.eq(q.field("brandOwnerId"), args.userId))
          .collect()
      : await ctx.db
          .query("rentalRequests")
          .withIndex("by_store_owner")
          .filter((q) => q.eq(q.field("storeOwnerId"), args.userId))
          .collect()
    
    // Calculate date range based on period
    const now = new Date()
    const currentPeriodStart = new Date()
    const previousPeriodStart = new Date()
    const previousPeriodEnd = new Date()
    
    switch (args.period) {
      case "daily":
        currentPeriodStart.setHours(0, 0, 0, 0)
        previousPeriodStart.setDate(now.getDate() - 1)
        previousPeriodStart.setHours(0, 0, 0, 0)
        previousPeriodEnd.setDate(now.getDate() - 1)
        previousPeriodEnd.setHours(23, 59, 59, 999)
        break
      case "weekly":
        currentPeriodStart.setDate(now.getDate() - now.getDay())
        currentPeriodStart.setHours(0, 0, 0, 0)
        previousPeriodStart.setDate(currentPeriodStart.getDate() - 7)
        previousPeriodEnd.setDate(currentPeriodStart.getDate() - 1)
        previousPeriodEnd.setHours(23, 59, 59, 999)
        break
      case "monthly":
        currentPeriodStart.setDate(1)
        currentPeriodStart.setHours(0, 0, 0, 0)
        previousPeriodStart.setMonth(now.getMonth() - 1)
        previousPeriodStart.setDate(1)
        previousPeriodEnd.setMonth(now.getMonth())
        previousPeriodEnd.setDate(0)
        previousPeriodEnd.setHours(23, 59, 59, 999)
        break
      case "yearly":
        currentPeriodStart.setMonth(0, 1)
        currentPeriodStart.setHours(0, 0, 0, 0)
        previousPeriodStart.setFullYear(now.getFullYear() - 1)
        previousPeriodStart.setMonth(0, 1)
        previousPeriodEnd.setFullYear(now.getFullYear() - 1)
        previousPeriodEnd.setMonth(11, 31)
        previousPeriodEnd.setHours(23, 59, 59, 999)
        break
    }
    
    // Filter requests by period
    const currentPeriodRequests = requests.filter(r => {
      const createdAt = new Date(r.createdAt)
      return createdAt >= currentPeriodStart && createdAt <= now
    })
    
    const previousPeriodRequests = requests.filter(r => {
      const createdAt = new Date(r.createdAt)
      return createdAt >= previousPeriodStart && createdAt <= previousPeriodEnd
    })
    
    // Calculate stats for current period
    const currentActive = currentPeriodRequests.filter(r => r.status === "active").length
    const currentPending = currentPeriodRequests.filter(r => r.status === "pending").length
    const currentAccepted = currentPeriodRequests.filter(r => 
      r.status === "accepted" || r.status === "payment_pending"
    ).length
    
    // Calculate stats for previous period
    const previousActive = previousPeriodRequests.filter(r => r.status === "active").length
    const previousPending = previousPeriodRequests.filter(r => r.status === "pending").length
    const previousAccepted = previousPeriodRequests.filter(r => 
      r.status === "accepted" || r.status === "payment_pending"
    ).length
    
    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }
    
    return {
      active: currentActive,
      activeChange: calculateChange(currentActive, previousActive),
      pending: currentPending,
      pendingChange: calculateChange(currentPending, previousPending),
      accepted: currentAccepted,
      acceptedChange: calculateChange(currentAccepted, previousAccepted),
    }
  },
})

// Confirm payment from brand owner
export const confirmPayment = mutation({
  args: {
    requestId: v.id("rentalRequests"),
    paymentAmount: v.number(),
  },
  handler: async (ctx, args) => {
    // Get the rental request
    const request = await ctx.db.get(args.requestId)
    if (!request) {
      throw new Error("Rental request not found")
    }
    
    // Verify the request status is accepted or payment_pending
    if (request.status !== "accepted" && request.status !== "payment_pending") {
      throw new Error("Invalid request status for payment confirmation")
    }
    
    // Update the request status to active (since we'll have automated payment in future)
    await ctx.db.patch(args.requestId, {
      status: "active",
      paymentConfirmedAt: new Date().toISOString(),
      paymentAmount: args.paymentAmount,
    })
    
    // Update shelf availability
    await ctx.db.patch(request.shelfId, {
      isAvailable: false,
    })
    
    // Auto-reject any other accepted/pending requests for the same shelf
    const otherRequests = await ctx.db
      .query("rentalRequests")
      .withIndex("by_shelf")
      .filter((q) => 
        q.and(
          q.eq(q.field("shelfId"), request.shelfId),
          q.neq(q.field("_id"), args.requestId),
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "accepted"),
            q.eq(q.field("status"), "payment_pending")
          )
        )
      )
      .collect()
    
    // Reject each other request
    for (const otherRequest of otherRequests) {
      await ctx.db.patch(otherRequest._id, {
        status: "rejected",
        storeOwnerResponse: "Shelf has been rented to another brand / تم تأجير الرف لعلامة تجارية أخرى",
        respondedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      
      // Create notification
      await ctx.db.insert("notifications", {
        userId: otherRequest.brandOwnerId,
        title: "الرف لم يعد متاحاً / Shelf No Longer Available",
        message: `تم تأجير الرف لعلامة تجارية أخرى / The shelf has been rented to another brand`,
        type: "rental_rejected",
        rentalRequestId: otherRequest._id,
        isRead: false,
        createdAt: new Date().toISOString(),
      })
      
      // Archive conversation if exists
      if (otherRequest.conversationId) {
        const conversation = await ctx.db.get(otherRequest.conversationId)
        if (conversation) {
          await ctx.db.patch(otherRequest.conversationId, {
            status: "archived",
          })
        }
      }
    }
    
    // Get brand and store owner details
    const brandOwner = await ctx.db.get(request.brandOwnerId)
    const storeOwner = await ctx.db.get(request.storeOwnerId)
    
    // Create notification for store owner that payment is pending verification
    if (storeOwner) {
      await ctx.db.insert("notifications", {
        userId: request.storeOwnerId,
        title: "تأكيد دفع جديد / New Payment Confirmation",
        message: `${brandOwner?.fullName || "User"} confirmed bank transfer of ${args.paymentAmount} SAR / أكد ${brandOwner?.fullName || "مستخدم"} إتمام التحويل البنكي بمبلغ ${args.paymentAmount} ريال`,
        type: "payment_confirmation",
        rentalRequestId: request._id,
        actionUrl: `/store-dashboard/orders`,
        actionLabel: "التحقق من الدفع / Verify Payment",
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    }
    
    // Create notification for admin
    // In production, you would have an admin user or admin notification system
    
    // Send system message in the conversation
    if (request.conversationId) {
      await ctx.db.insert("messages", {
        conversationId: request.conversationId,
        senderId: request.brandOwnerId,
        text: `تم تأكيد التحويل البنكي بمبلغ ${args.paymentAmount} ريال. يرجى الانتظار حتى يتم التحقق من الدفع. / Bank transfer of ${args.paymentAmount} SAR confirmed. Please wait for payment verification.`,
        messageType: "payment_confirmed",
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    }
    
    return { success: true }
  },
})

// Verify payment and activate rental (for store owner)
export const verifyPaymentAndActivate = mutation({
  args: {
    requestId: v.id("rentalRequests"),
    verifiedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get the rental request
    const request = await ctx.db.get(args.requestId)
    if (!request) {
      throw new Error("Rental request not found")
    }
    
    // Verify the request status is accepted or payment_pending (removing payment_processing)
    if (request.status !== "accepted" && request.status !== "payment_pending") {
      throw new Error("Invalid request status for payment verification")
    }
    
    // Update the request status to active
    await ctx.db.patch(args.requestId, {
      status: "active",
      paymentVerifiedAt: new Date().toISOString(),
      paymentVerifiedBy: args.verifiedBy,
      activatedAt: new Date().toISOString(),
    })
    
    // Now update the shelf as rented
    await ctx.db.patch(request.shelfId, {
      isAvailable: false,
      status: "rented",
      renterId: request.brandOwnerId,
      rentalStartDate: request.startDate,
      rentalEndDate: request.endDate,
      rentalPrice: request.monthlyPrice,
      updatedAt: new Date().toISOString(),
    })
    
    // Get brand owner details
    const brandOwner = await ctx.db.get(request.brandOwnerId)
    
    // Create notification for brand owner that rental is now active
    await ctx.db.insert("notifications", {
      userId: request.brandOwnerId,
      title: "تم تفعيل الإيجار! / Rental Activated!",
      message: `تم التحقق من الدفع وتفعيل إيجار الرف / Payment verified and shelf rental is now active`,
      type: "rental_activated",
      rentalRequestId: request._id,
      actionUrl: `/brand-dashboard/shelves`,
      actionLabel: "عرض الرف / View Shelf",
      isRead: false,
      createdAt: new Date().toISOString(),
    })
    
    // Send system message in the conversation
    if (request.conversationId) {
      await ctx.db.insert("messages", {
        conversationId: request.conversationId,
        senderId: request.storeOwnerId,
        text: "تم تفعيل إيجار الرف بنجاح! ✅ / Shelf rental has been activated successfully! ✅",
        messageType: "rental_activated",
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    }
    
    return { success: true }
  },
})

// Expire active rentals that have passed their end date
export const expireActiveRentals = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString()
    
    // Get all active rental requests
    const activeRequests = await ctx.db
      .query("rentalRequests")
      .withIndex("by_status")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect()
    
    // Filter for expired rentals
    const expiredRequests = activeRequests.filter(request => 
      request.endDate && new Date(request.endDate) < new Date(now)
    )
    
    // Update each expired rental
    for (const request of expiredRequests) {
      // Update request status to expired
      await ctx.db.patch(request._id, {
        status: "expired",
        updatedAt: now,
      })
      
      // Make the shelf available again
      await ctx.db.patch(request.shelfId, {
        isAvailable: true,
        status: "approved",
        renterId: undefined,
        rentalStartDate: undefined,
        rentalEndDate: undefined,
        rentalPrice: undefined,
        updatedAt: now,
      })
      
      // Create notifications for both parties
      await ctx.db.insert("notifications", {
        userId: request.brandOwnerId,
        title: "انتهت مدة الإيجار / Rental Period Ended",
        message: `Your rental period for the shelf has ended / انتهت مدة إيجار الرف`,
        type: "rental_expired",
        rentalRequestId: request._id,
        isRead: false,
        createdAt: now,
      })
      
      await ctx.db.insert("notifications", {
        userId: request.storeOwnerId,
        title: "الرف متاح مجدداً / Shelf Available Again",
        message: `The rental period has ended and the shelf is now available / انتهت مدة الإيجار والرف متاح الآن`,
        type: "rental_expired",
        rentalRequestId: request._id,
        isRead: false,
        createdAt: now,
      })
    }
    
    return {
      expiredCount: expiredRequests.length,
      message: `Expired ${expiredRequests.length} rental(s)`,
    }
  },
})