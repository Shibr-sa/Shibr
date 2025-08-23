import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"

// Create a new rental request
export const createRentalRequest = mutation({
  args: {
    shelfId: v.id("shelves"),
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
    // Get authenticated user ID (brand owner)
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    // Get the shelf details
    const shelf = await ctx.db.get(args.shelfId)
    if (!shelf) {
      throw new Error("Shelf not found")
    }
    
    // Get the brand owner details
    const brandOwner = await ctx.db.get(userId)
    if (!brandOwner) {
      throw new Error("Brand owner not found")
    }
    
    // Get brand owner profile
    const brandOwnerProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()
    
    // Get store owner profile from shelf's profileId
    const storeOwnerProfile = await ctx.db.get(shelf.profileId)
    
    // Check if there's an existing active request for the same shelf by the same brand
    const existingRequest = await ctx.db
      .query("rentalRequests")
      .withIndex("by_requester")
      .filter((q) => 
        q.and(
          q.eq(q.field("requesterId"), userId),
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
          senderId: userId,
          text: "تم تحديث تفاصيل طلب الإيجار\nRental request details have been updated",
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
      requesterId: userId,
      requesterProfileId: brandOwnerProfile?._id,
      ownerId: storeOwnerProfile?.userId!,
      ownerProfileId: storeOwnerProfile?._id,
      startDate: args.startDate,
      endDate: args.endDate,
      rentalPeriod: months,
      productType: args.productType,
      productDescription: args.productDescription,
      productCount: args.productCount,
      additionalNotes: args.additionalNotes,
      brandName: brandOwnerProfile?.brandName,
      monthlyPrice: shelf.monthlyPrice,
      totalAmount: totalPrice,
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
      userId: storeOwnerProfile?.userId!,
      title: "طلب إيجار جديد\nNew Rental Request",
      message: `يرغب ${brandOwnerProfile?.brandName || brandOwnerProfile?.fullName || "صاحب العلامة"} في استئجار رفك\n${brandOwnerProfile?.brandName || brandOwnerProfile?.fullName || "Brand owner"} wants to rent your shelf`,
      type: "rental_request",
      rentalRequestId: requestId,
      actionUrl: `/store-dashboard/orders`,
      actionLabel: "عرض الطلب\nView Request",
      isRead: false,
      createdAt: new Date().toISOString(),
    })
    
    // Send a system message in the conversation
    if (args.conversationId) {
      await ctx.db.insert("messages", {
        conversationId: args.conversationId,
        senderId: userId,
        text: `تم إرسال طلب إيجار جديد للرف\nNew rental request sent for the shelf`,
        messageType: "rental_request",
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    }
    
    // Update the conversation with the rental request ID
    if (args.conversationId) {
      await ctx.db.patch(args.conversationId, {
        rentalRequestId: requestId,
        updatedAt: new Date().toISOString(),
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
      const rejectedUserId = otherRequest.requesterId
      if (rejectedUserId) {
        await ctx.db.insert("notifications", {
          userId: rejectedUserId,
          title: "طلبك تم رفضه تلقائياً\nRequest Auto-Rejected",
          message: `تم قبول طلب آخر لنفس الرف\nAnother request was accepted for the same shelf`,
          type: "rental_rejected",
          rentalRequestId: otherRequest._id,
          isRead: false,
          createdAt: new Date().toISOString(),
        })
      }
      
      // Send system message in conversation if exists
      if (otherRequest.conversationId && request.ownerId) {
        await ctx.db.insert("messages", {
          conversationId: otherRequest.conversationId,
          senderId: request.ownerId,
          text: "عذراً، تم قبول طلب إيجار آخر لهذا الرف.\nSorry, another rental request has been accepted for this shelf.",
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
    const brandOwner = request.requesterId ? await ctx.db.get(request.requesterId) : null
    const shelf = await ctx.db.get(request.shelfId)
    
    // Create notification for brand owner
    const brandUserId = request.requesterId
    if (brandUserId) {
      await ctx.db.insert("notifications", {
        userId: brandUserId,
        title: "طلبك تم قبوله!\nYour Request Was Accepted!",
        message: `تم قبول طلب إيجار الرف. يرجى إتمام الدفع\nYour shelf rental request has been accepted. Please complete payment`,
        type: "rental_accepted",
        rentalRequestId: request._id,
        actionUrl: `/brand-dashboard/shelves`,
        actionLabel: "إتمام الدفع\nComplete Payment",
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    }
    
    // Send system message in conversation if exists
    if (request.conversationId && request.ownerId) {
      await ctx.db.insert("messages", {
        conversationId: request.conversationId,
        senderId: request.ownerId,
        text: args.response || "تم قبول طلب الإيجار! يرجى إتمام الدفع لتفعيل الإيجار.\nRental request accepted! Please complete payment to activate the rental.",
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
    const rejectedUserId = request.requesterId
    if (rejectedUserId) {
      await ctx.db.insert("notifications", {
        userId: rejectedUserId,
        title: "طلبك تم رفضه\nYour Request Was Rejected",
        message: `تم رفض طلب إيجار الرف\nYour shelf rental request has been rejected`,
        type: "rental_rejected",
        rentalRequestId: request._id,
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    }
    
    // Send system message in conversation if exists
    if (request.conversationId && request.ownerId) {
      await ctx.db.insert("messages", {
        conversationId: request.conversationId,
        senderId: request.ownerId,
        text: args.response || "عذراً، تم رفض طلب الإيجار.\nSorry, the rental request has been rejected.",
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
    const shelf = await ctx.db.get(request.shelfId)
    const brandOwnerId = request.requesterId
    const storeOwnerId = request.ownerId
    const brandOwner = brandOwnerId ? await ctx.db.get(brandOwnerId) : null
    const storeOwner = storeOwnerId ? await ctx.db.get(storeOwnerId) : null
    
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
    const brandOwnerId = request.requesterId
    const brandOwner = brandOwnerId ? await ctx.db.get(brandOwnerId) : null
    const brandOwnerProfile = brandOwnerId ? await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", brandOwnerId))
      .first() : null
    
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
      otherUserName: brandOwnerProfile?.brandName || brandOwnerProfile?.fullName || "Unknown",
      otherUserEmail: brandOwnerProfile?.email || brandOwner?.email,
      city: shelf?.city,
      shelfCity: shelf?.city,
      shelfName: shelf?.shelfName,
      shelfBranch: shelf?.branch,
      // Brand specific details
      activityType: brandOwnerProfile?.brandType || "Not specified",
      phoneNumber: brandOwnerProfile?.phoneNumber,
      mobileNumber: brandOwnerProfile?.phoneNumber,
      website: "",
      commercialRegisterNumber: brandOwnerProfile?.brandCommercialRegisterNumber || brandOwnerProfile?.freelanceLicenseNumber,
      commercialRegisterFile: brandOwnerProfile?.brandCommercialRegisterDocument 
        ? await ctx.storage.getUrl(brandOwnerProfile.brandCommercialRegisterDocument) 
        : brandOwnerProfile?.freelanceLicenseDocument
        ? await ctx.storage.getUrl(brandOwnerProfile.freelanceLicenseDocument)
        : "",
      crNumber: brandOwnerProfile?.brandCommercialRegisterNumber || brandOwnerProfile?.freelanceLicenseNumber,
      crFile: "",
      brandLogo: "",
      ownerName: brandOwnerProfile?.fullName,
      // Rating information (fields not available yet in schema)
      brandRating: 0, // brandOwner?.averageRating || 0,
      brandTotalRatings: 0, // brandOwner?.totalRatings || 0,
      // Products
      products: products,
    }
  },
})

// Get all rental requests for a user (as brand owner or store owner)
export const getUserRentalRequests = query({
  args: {
    userType: v.union(v.literal("brand"), v.literal("store")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    
    // Query based on user type
    const requests = args.userType === "brand"
      ? await ctx.db
          .query("rentalRequests")
          .withIndex("by_requester")
          .filter((q) => q.eq(q.field("requesterId"), userId))
          .collect()
      : await ctx.db
          .query("rentalRequests")
          .withIndex("by_owner")
          .filter((q) => q.eq(q.field("ownerId"), userId))
          .collect()
    
    // Get additional data for each request
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        // Get the other party's details
        const otherUserId = args.userType === "brand"
          ? request.ownerId
          : request.requesterId
        const otherUser = otherUserId ? await ctx.db.get(otherUserId) : null
        
        // Get the other party's profile
        const otherUserProfile = otherUserId ? await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", otherUserId))
          .first() : null
        
        // Get shelf details
        const shelf = await ctx.db.get(request.shelfId)
        
        // For store owners viewing brand requests, include all brand details
        if (args.userType === "store" && otherUser && otherUserProfile) {
          return {
            ...request,
            otherUserId: otherUser._id,
            otherUserName: otherUserProfile.brandName || otherUserProfile.fullName || "Unknown",
            otherUserEmail: otherUserProfile?.email || "",
            city: shelf?.city,
            shelfCity: shelf?.city,
            shelfName: shelf?.shelfName,
            shelfBranch: shelf?.branch,
            // Brand specific details
            activityType: otherUserProfile.brandType || "Not specified",
            phoneNumber: otherUserProfile.phoneNumber,
            mobileNumber: otherUserProfile.phoneNumber,
            website: "", // otherUserProfile.website - field doesn't exist in schema
            commercialRegisterNumber: otherUserProfile.brandCommercialRegisterNumber || otherUserProfile.freelanceLicenseNumber,
            commercialRegisterFile: otherUserProfile.brandCommercialRegisterDocument 
              ? await ctx.storage.getUrl(otherUserProfile.brandCommercialRegisterDocument) 
              : otherUserProfile.freelanceLicenseDocument
              ? await ctx.storage.getUrl(otherUserProfile.freelanceLicenseDocument)
              : "", // Get document URL from storage
            crNumber: otherUserProfile.brandCommercialRegisterNumber || otherUserProfile.freelanceLicenseNumber,
            crFile: "", // Document URL would need to be retrieved from storage
            brandLogo: "",
            ownerName: otherUserProfile.fullName,
            // Note: Social media and brand description fields don't exist in the schema yet
            // They would need to be added to the userProfiles table if needed
          }
        }
        
        // For brand owners viewing store requests
        return {
          ...request,
          otherUserId: otherUser?._id,
          otherUserName: otherUserProfile?.storeName || otherUserProfile?.fullName || "Unknown",
          otherUserEmail: otherUserProfile?.email || "",
          city: shelf?.city,
          shelfName: shelf?.shelfName,
          shelfBranch: shelf?.branch,
          phoneNumber: otherUserProfile?.phoneNumber,
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
    const expiredUserId = request.requesterId
    if (expiredUserId) {
      await ctx.db.insert("notifications", {
        userId: expiredUserId,
        title: "انتهت صلاحية الطلب\nRequest Expired",
        message: `انتهت صلاحية طلب إيجار الرف\nYour shelf rental request has expired`,
        type: "rental_expired",
        rentalRequestId: request._id,
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    }
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
      .withIndex("by_requester")
      .filter((q) =>
        q.and(
          q.eq(q.field("requesterId"), args.brandOwnerId),
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

// Get active rental request for current user and a shelf
export const getUserActiveRentalRequest = query({
  args: {
    shelfId: v.id("shelves"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    
    // Look for an active request for this shelf by current user
    const activeRequest = await ctx.db
      .query("rentalRequests")
      .withIndex("by_requester")
      .filter((q) =>
        q.and(
          q.eq(q.field("requesterId"), userId),
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

// Get user's existing rental request for a shelf
export const getUserRequestForShelf = query({
  args: {
    userId: v.id("users"),
    shelfId: v.id("shelves"),
  },
  handler: async (ctx, args) => {
    // Find any rental request from this user for this shelf
    const request = await ctx.db
      .query("rentalRequests")
      .withIndex("by_shelf")
      .filter((q) => 
        q.and(
          q.eq(q.field("shelfId"), args.shelfId),
          q.eq(q.field("requesterId"), args.userId)
        )
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "accepted"),
          q.eq(q.field("status"), "payment_pending"),
          q.eq(q.field("status"), "active")
        )
      )
      .first()
    
    return request
  },
})

// Check if shelf is still available (no accepted/active requests from anyone)
export const isShelfAvailable = query({
  args: {
    shelfId: v.id("shelves"),
    currentUserId: v.optional(v.id("users")),
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
      // Check if the request belongs to the current user
      const acceptedByCurrentUser = args.currentUserId && unavailableRequests.requesterId === args.currentUserId
      
      return { 
        available: false, 
        reason: "already_accepted",
        acceptedByOther: !acceptedByCurrentUser,
        acceptedByCurrentUser 
      }
    }
    
    return { available: true, reason: null }
  },
})

// Get rental statistics with percentage changes
export const getRentalStatsWithChanges = query({
  args: {
    userType: v.union(v.literal("brand"), v.literal("store")),
    period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("yearly")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        totalRequests: 0,
        activeRentals: 0,
        pendingRequests: 0,
        totalRevenue: 0,
        requestsChange: 0,
        activeChange: 0,
        pendingChange: 0,
        revenueChange: 0,
      };
    }
    
    // Query based on user type
    const requests = args.userType === "brand"
      ? await ctx.db
          .query("rentalRequests")
          .withIndex("by_requester")
          .filter((q) => q.eq(q.field("requesterId"), userId))
          .collect()
      : await ctx.db
          .query("rentalRequests")
          .withIndex("by_owner")
          .filter((q) => q.eq(q.field("ownerId"), userId))
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
      // paymentConfirmedAt: new Date().toISOString(), // Field doesn't exist in schema
      // paymentAmount: args.paymentAmount, // Field doesn't exist in schema
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
      const notificationUserId = otherRequest.requesterId
      if (notificationUserId) {
        await ctx.db.insert("notifications", {
          userId: notificationUserId,
          title: "الرف لم يعد متاحاً\nShelf No Longer Available",
          message: `تم تأجير الرف لعلامة تجارية أخرى\nThe shelf has been rented to another brand`,
          type: "rental_rejected",
          rentalRequestId: otherRequest._id,
          isRead: false,
          createdAt: new Date().toISOString(),
        })
      }
      
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
    const brandOwner = request.requesterId ? await ctx.db.get(request.requesterId) : null
    const brandOwnerProfile = brandOwner ? await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", request.requesterId!))
      .first() : null
    const storeOwner = request.ownerId ? await ctx.db.get(request.ownerId) : null
    
    // Create notification for store owner that payment is pending verification
    const storeOwnerId = request.ownerId
    if (storeOwner && storeOwnerId) {
      await ctx.db.insert("notifications", {
        userId: storeOwnerId,
        title: "تأكيد دفع جديد\nNew Payment Confirmation",
        message: `أكد ${brandOwnerProfile?.fullName || "مستخدم"} إتمام التحويل البنكي بمبلغ ${args.paymentAmount} ريال\n${brandOwnerProfile?.fullName || "User"} confirmed bank transfer of ${args.paymentAmount} SAR`,
        type: "payment_confirmation",
        rentalRequestId: request._id,
        actionUrl: `/store-dashboard/orders`,
        actionLabel: "التحقق من الدفع\nVerify Payment",
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    }
    
    // Create notification for admin
    // In production, you would have an admin user or admin notification system
    
    // Send system message in the conversation
    if (request.conversationId && request.requesterId) {
      await ctx.db.insert("messages", {
        conversationId: request.conversationId,
        senderId: request.requesterId,
        text: `تم تأكيد التحويل البنكي بمبلغ ${args.paymentAmount} ريال. يرجى الانتظار حتى يتم التحقق من الدفع.\nBank transfer of ${args.paymentAmount} SAR confirmed. Please wait for payment verification.`,
        messageType: "system",
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
      // paymentVerifiedAt: new Date().toISOString(), // Field doesn't exist in schema
      // paymentVerifiedBy: args.verifiedBy, // Field doesn't exist in schema
      // activatedAt: new Date().toISOString(), // Field doesn't exist in schema
    })
    
    // Now update the shelf as rented
    await ctx.db.patch(request.shelfId, {
      isAvailable: false,
      status: "approved", // Keep as approved, availability is managed by isAvailable field
      // renterId: request.requesterId, // Field doesn't exist in schema
      // rentalStartDate: request.startDate, // Field doesn't exist in schema
      // rentalEndDate: request.endDate, // Field doesn't exist in schema
      // rentalPrice: request.monthlyPrice, // Field doesn't exist in schema
      updatedAt: new Date().toISOString(),
    })
    
    // Get brand owner details
    const brandOwner = request.requesterId ? await ctx.db.get(request.requesterId) : null
    
    // Create notification for brand owner that rental is now active
    const activatedUserId = request.requesterId
    if (activatedUserId) {
      await ctx.db.insert("notifications", {
        userId: activatedUserId,
        title: "تم تفعيل الإيجار!\nRental Activated!",
        message: `تم التحقق من الدفع وتفعيل إيجار الرف\nPayment verified and shelf rental is now active`,
        type: "system", // rental_activated is not a valid type in schema
        rentalRequestId: request._id,
        actionUrl: `/brand-dashboard/shelves`,
        actionLabel: "عرض الرف\nView Shelf",
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    }
    
    // Send system message in the conversation
    if (request.conversationId && request.ownerId) {
      await ctx.db.insert("messages", {
        conversationId: request.conversationId,
        senderId: request.ownerId,
        text: "تم تفعيل إيجار الرف بنجاح! ✅\nShelf rental has been activated successfully! ✅",
        messageType: "system",
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
        // renterId: undefined, // Field doesn't exist in schema
        // rentalStartDate: undefined, // Field doesn't exist in schema
        // rentalEndDate: undefined, // Field doesn't exist in schema
        // rentalPrice: undefined, // Field doesn't exist in schema
        updatedAt: now,
      })
      
      // Create notifications for both parties
      const brandUserId = request.requesterId
      if (brandUserId) {
        await ctx.db.insert("notifications", {
          userId: brandUserId,
          title: "انتهت مدة الإيجار\nRental Period Ended",
          message: `انتهت مدة إيجار الرف\nYour rental period for the shelf has ended`,
          type: "rental_expired",
          rentalRequestId: request._id,
          isRead: false,
          createdAt: now,
        })
      }
      
      if (request.ownerId) {
        await ctx.db.insert("notifications", {
          userId: request.ownerId,
          title: "الرف متاح مجدداً\nShelf Available Again",
          message: `انتهت مدة الإيجار والرف متاح الآن\nThe rental period has ended and the shelf is now available`,
          type: "rental_expired",
          rentalRequestId: request._id,
          isRead: false,
          createdAt: now,
        })
      }
    }
    
    return {
      expiredCount: expiredRequests.length,
      message: `Expired ${expiredRequests.length} rental(s)`,
    }
  },
})