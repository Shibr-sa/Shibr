import { v } from "convex/values"
import { mutation, query, internalQuery } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"
import { getUserProfile } from "./profileHelpers"
import { getImageUrlsFromArray, getPeriodDates, calculatePercentageChange, requireAuth } from "./helpers"
import { api, internal } from "./_generated/api"


// Create a new rental request
export const createRentalRequest = mutation({
  args: {
    shelfId: v.id("shelves"),
    startDate: v.string(),
    endDate: v.string(),
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
    const brandProfileData = await getUserProfile(ctx, userId)
    if (!brandProfileData || brandProfileData.type !== "brand_owner") {
      throw new Error("Only brand owners can create rental requests")
    }
    const brandOwnerProfile = brandProfileData.profile as any
    
    // Get store owner profile from shelf's storeProfileId
    const storeOwnerProfile = shelf.storeProfileId ? await ctx.db.get(shelf.storeProfileId) : null

    // Check for date overlaps with existing active/pending rentals
    const requestedStartDate = new Date(args.startDate).getTime()
    const requestedEndDate = new Date(args.endDate).getTime()

    // Get all non-rejected/cancelled rentals for this shelf
    const existingRentals = await ctx.db
      .query("rentalRequests")
      .withIndex("by_shelf", (q) => q.eq("shelfId", args.shelfId))
      .filter((q) =>
        q.and(
          q.neq(q.field("status"), "rejected"),
          q.neq(q.field("status"), "cancelled"),
          q.neq(q.field("status"), "expired"),
          q.neq(q.field("status"), "completed")
        )
      )
      .collect()

    // Check for overlaps
    for (const rental of existingRentals) {
      // Skip if it's the user's own pending request (will be updated)
      if (rental.brandProfileId === brandOwnerProfile._id &&
          (rental.status === "pending" || rental.status === "payment_pending")) {
        continue
      }

      // Check if dates overlap
      const rentalStart = rental.startDate
      const rentalEnd = rental.endDate

      // Overlap occurs if:
      // 1. Requested period starts during existing rental
      // 2. Requested period ends during existing rental
      // 3. Requested period completely contains existing rental
      // 4. Existing rental completely contains requested period
      const hasOverlap =
        (requestedStartDate >= rentalStart && requestedStartDate < rentalEnd) || // Start during existing
        (requestedEndDate > rentalStart && requestedEndDate <= rentalEnd) || // End during existing
        (requestedStartDate <= rentalStart && requestedEndDate >= rentalEnd) || // Contains existing
        (rentalStart <= requestedStartDate && rentalEnd >= requestedEndDate) // Contained by existing

      if (hasOverlap) {
        const endDateStr = new Date(rental.endDate).toLocaleDateString()
        throw new Error(`This shelf is already rented during the selected period. It will be available after ${endDateStr}`)
      }
    }
    
    // Check if there's an existing active request for the same shelf by the same brand
    const existingRequest = await ctx.db
      .query("rentalRequests")
      .withIndex("by_brand")
      .filter((q) => 
        q.and(
          q.eq(q.field("brandProfileId"), brandOwnerProfile._id),
          q.eq(q.field("shelfId"), args.shelfId)
        )
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "payment_pending")
        )
      )
      .first()
    
    // If there's an existing request, update it instead of creating a new one
    if (existingRequest) {
      // Build selectedProducts array for update
      const selectedProducts = []
      if (args.selectedProductIds.length > 0) {
        for (let i = 0; i < args.selectedProductIds.length; i++) {
          const productId = args.selectedProductIds[i]
          const quantity = args.selectedProductQuantities?.[i] || 1
          const product = await ctx.db.get(productId)
          
          if (product) {
            selectedProducts.push({
              productId: productId,
              quantity: quantity,
              name: product.name,
              price: product.price,
              category: product.category || "other"
            })
          }
        }
      }
      
      // Get platform settings for commission
      const platformSettings = await ctx.db
        .query("platformSettings")
        .withIndex("by_key", (q) => q.eq("key", "commission_rates"))
        .first()
      const platformCommission = platformSettings?.value?.brandSalesCommission || 9
      const storeCommission = shelf.storeCommission || 0

      await ctx.db.patch(existingRequest._id, {
        startDate: new Date(args.startDate).getTime(),
        endDate: new Date(args.endDate).getTime(),
        selectedProducts: selectedProducts,
        commissions: [
          { type: "store" as const, rate: storeCommission },
          { type: "platform" as const, rate: platformCommission },
        ],
      })
      
      // Send a system message in the conversation about the update
      if (args.conversationId) {
        await ctx.runMutation(api.chats.sendSystemMessage, {
          conversationId: args.conversationId,
          senderId: brandOwnerProfile._id as any,
          text: "تم تحديث تفاصيل طلب الإيجار\nRental request details have been updated",
          messageType: "text",
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
    
    // Build selectedProducts array for new request
    const selectedProducts = []
    let totalProductCount = 0
    let productDescriptions = []
    
    if (args.selectedProductIds.length > 0) {
      for (let i = 0; i < args.selectedProductIds.length; i++) {
        const productId = args.selectedProductIds[i]
        const quantity = args.selectedProductQuantities?.[i] || 1
        const product = await ctx.db.get(productId)
        
        if (product) {
          selectedProducts.push({
            productId: productId,
            quantity: quantity,
            name: product.name,
            price: product.price,
            category: product.category || "other"
          })
          totalProductCount += quantity
          productDescriptions.push(`${product.name} (${quantity})`)
        }
      }
    }
    
    // Get platform settings for commission
    const platformSettings = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "commission_rates"))
      .first()
    const platformCommission = platformSettings?.value?.brandSalesCommission || 9
    const storeCommission = shelf.storeCommission || 0

    // Create the rental request
    const requestId = await ctx.db.insert("rentalRequests", {
      shelfId: args.shelfId,
      brandProfileId: brandOwnerProfile._id,
      storeProfileId: storeOwnerProfile?._id!,
      startDate: new Date(args.startDate).getTime(),
      endDate: new Date(args.endDate).getTime(),
      selectedProducts: selectedProducts || [],
      monthlyPrice: shelf.monthlyPrice,
      totalAmount: totalPrice,
      commissions: [
        { type: "store" as const, rate: storeCommission },
        { type: "platform" as const, rate: platformCommission },
      ],
      status: "pending",
      conversationId: args.conversationId,
    })
    
    
    // Send a system message in the conversation with proper unread count handling
    if (args.conversationId) {
      await ctx.runMutation(api.chats.sendSystemMessage, {
        conversationId: args.conversationId,
        senderId: brandOwnerProfile._id as any,
        text: `تم إرسال طلب إيجار جديد للرف\nNew rental request sent for the shelf`,
        messageType: "rental_request",
      })
    }
    
    // No longer need to update conversation with rental request ID
    
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
    // Note: Payment record will be created after successful payment verification
    await ctx.db.patch(args.requestId, {
      status: "payment_pending",
    })
    
    // Get store user ID for messages
    const storeProfile = request.storeProfileId ? await ctx.db.get(request.storeProfileId) : null
    const storeUserId = storeProfile?.userId
    
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
      })
      
      
      // Send system message in conversation if exists
      if (otherRequest.conversationId && storeProfile) {
        await ctx.runMutation(api.chats.sendSystemMessage, {
          conversationId: otherRequest.conversationId,
          senderId: storeProfile._id as any,
          text: "عذراً، تم قبول طلب إيجار آخر لهذا الرف.\nSorry, another rental request has been accepted for this shelf.",
          messageType: "rental_rejected",
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
    
    // Get related data
    const brandProfile = request.brandProfileId ? await ctx.db.get(request.brandProfileId) : null
    const brandOwner = brandProfile?.userId ? await ctx.db.get(brandProfile.userId) : null
    const shelf = await ctx.db.get(request.shelfId)
    
    
    // Reactivate conversation if it was archived and send system message
    if (request.conversationId && storeProfile) {
      // Ensure conversation is active (in case it was previously archived)
      const conversation = await ctx.db.get(request.conversationId)
      if (conversation && conversation.status === "archived") {
        await ctx.db.patch(request.conversationId, {
          status: "active",
        })
      }
      
      await ctx.runMutation(api.chats.sendSystemMessage, {
        conversationId: request.conversationId,
        senderId: storeProfile._id as any,
        text: args.response || "تم قبول طلب الإيجار! يرجى إتمام الدفع لتفعيل الإيجار.\nRental request accepted! Please complete payment to activate the rental.",
        messageType: "rental_accepted",
      })
    }
    
    return { success: true }
  },
})

// Reject a rental request
export const rejectRentalRequest = mutation({
  args: {
    requestId: v.id("rentalRequests"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId)
    if (!request) {
      throw new Error("Request not found")
    }
    
    // Update request status to rejected
    await ctx.db.patch(args.requestId, {
      status: "rejected",
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
    
    
    // Send system message in conversation if exists
    const storeProfile = request.storeProfileId ? await ctx.db.get(request.storeProfileId) : null
    if (request.conversationId && storeProfile) {
      await ctx.runMutation(api.chats.sendSystemMessage, {
        conversationId: request.conversationId,
        senderId: storeProfile._id as any,
        text: "عذراً، تم رفض طلب الإيجار.\nSorry, the rental request has been rejected.",
        messageType: "rental_rejected",
      })
    }
    
    return { success: true }
  },
})

// Update a rental request (only for pending requests by brand owner)
export const updateRentalRequest = mutation({
  args: {
    requestId: v.id("rentalRequests"),
    selectedProducts: v.optional(v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
    }))),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    const request = await ctx.db.get(args.requestId)
    if (!request) {
      throw new Error("Request not found")
    }

    // Only allow updates for pending requests
    if (request.status !== "pending") {
      throw new Error("Can only update pending requests")
    }

    // Verify the user is the brand owner who created this request
    const userProfile = await getUserProfile(ctx, userId)
    if (!userProfile || userProfile.type !== "brand_owner" ||
        userProfile.profile._id !== request.brandProfileId) {
      throw new Error("Not authorized to update this request")
    }

    // Prepare update object
    const updates: any = {}
    if (args.selectedProducts !== undefined) {
      updates.selectedProducts = args.selectedProducts
    }
    if (args.startDate !== undefined) {
      updates.startDate = args.startDate
    }
    if (args.endDate !== undefined) {
      updates.endDate = args.endDate
    }
    if (args.message !== undefined) {
      updates.message = args.message
    }

    // Update the request
    await ctx.db.patch(args.requestId, updates)

    // Send system message about the update
    if (request.conversationId) {
      await ctx.runMutation(api.chats.sendSystemMessage, {
        conversationId: request.conversationId,
        senderId: request.brandProfileId as any,
        text: "تم تحديث تفاصيل طلب الإيجار\nRental request details have been updated",
        messageType: "text",
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
    const brandProfile = request.brandProfileId ? await ctx.db.get(request.brandProfileId) : null
    const storeProfile = request.storeProfileId ? await ctx.db.get(request.storeProfileId) : null
    const brandOwnerId = brandProfile?.userId
    const storeOwnerId = storeProfile?.userId
    const brandOwner = brandOwnerId ? await ctx.db.get(brandOwnerId) : null
    const storeOwner = storeOwnerId ? await ctx.db.get(storeOwnerId) : null
    
    // Get shelf images if they exist
    const imageUrls = shelf ? await getImageUrlsFromArray(ctx, shelf.images) : null
    
    return {
      ...request,
      shelf: shelf && imageUrls ? {
        ...shelf,
        shelfImage: imageUrls.shelfImageUrl,
        exteriorImage: imageUrls.exteriorImageUrl,
        interiorImage: imageUrls.interiorImageUrl,
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
    const brandOwnerProfile = request.brandProfileId ? await ctx.db.get(request.brandProfileId) : null
    const brandOwner = brandOwnerProfile?.userId ? await ctx.db.get(brandOwnerProfile.userId) : null
    
    // Get shelf details
    const shelf = await ctx.db.get(request.shelfId)
    
    // Get selected products with their requested quantities
    let products: any[] = []
    if (request.selectedProducts && request.selectedProducts.length > 0) {
      products = await Promise.all(
        request.selectedProducts.map(async (selectedProduct) => {
          const product = await ctx.db.get(selectedProduct.productId)
          if (product) {
            // Add the requested quantity to the product
            return {
              ...product,
              requestedQuantity: selectedProduct.quantity || 1
            }
          }
          // If product not found in database, use the stored info
          return {
            _id: selectedProduct.productId,
            name: selectedProduct.name,
            category: selectedProduct.category,
            price: selectedProduct.price,
            requestedQuantity: selectedProduct.quantity || 1
          }
        })
      )
      // Filter out any null products
      products = products.filter(p => p !== null)
    }
    
    // Get shelf store if exists (for active rentals)
    const shelfStore = await ctx.db
      .query("shelfStores")
      .withIndex("by_rental", (q) => q.eq("rentalRequestId", args.requestId))
      .first()

    // Return enriched request data
    return {
      ...request,
      otherUserId: brandOwner?._id,
      otherUserName: brandOwnerProfile?.brandName || "",
      otherUserEmail: brandOwner?.email || "",
      city: shelf?.city,
      shelfCity: shelf?.city,
      shelfName: shelf?.shelfName,
      shelfBranch: shelf?.storeBranch,
      // Brand specific details
      activityType: brandOwnerProfile?.businessType,
      businessCategory: brandOwnerProfile?.businessCategory,
      website: brandOwnerProfile?.website,
      commercialRegisterNumber: brandOwnerProfile?.commercialRegisterNumber || brandOwnerProfile?.freelanceLicenseNumber,
      commercialRegisterFile: brandOwnerProfile?.commercialRegisterDocument
        ? await ctx.storage.getUrl(brandOwnerProfile.commercialRegisterDocument)
        : brandOwnerProfile?.freelanceLicenseDocument
        ? await ctx.storage.getUrl(brandOwnerProfile.freelanceLicenseDocument)
        : undefined,
      ownerName: brandOwnerProfile?.brandName,
      // Rating information (fields not available yet in schema)
      brandRating: 0, // brandOwner?.averageRating || 0,
      brandTotalRatings: 0, // brandOwner?.totalRatings || 0,
      // Products
      products: products,
      // Shelf store information
      shelfStore: shelfStore ? {
        _id: shelfStore._id,
        storeSlug: shelfStore.storeSlug,
        qrCodeUrl: shelfStore.qrCodeUrl,
        isActive: shelfStore.isActive,
        totalScans: shelfStore.totalScans,
        totalOrders: shelfStore.totalOrders,
        totalRevenue: shelfStore.totalRevenue,
      } : null,
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
    
    // Get user's profile to determine correct field
    const profileData = await getUserProfile(ctx, userId)
    if (!profileData) return []
    
    // Query based on user type
    const requests = args.userType === "brand"
      ? await ctx.db
          .query("rentalRequests")
          .withIndex("by_brand")
          .filter((q) => q.eq(q.field("brandProfileId"), profileData.profile._id))
          .collect()
      : await ctx.db
          .query("rentalRequests")
          .withIndex("by_store")
          .filter((q) => q.eq(q.field("storeProfileId"), profileData.profile._id))
          .collect()
    
    // Get additional data for each request
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        // Get the other party's details based on user type
        let otherUserId, otherUser, otherUserProfile

        if (args.userType === "brand") {
          // For brand viewing store responses
          const storeProfile = request.storeProfileId ? await ctx.db.get(request.storeProfileId) : null
          otherUserId = storeProfile?.userId
          otherUser = otherUserId ? await ctx.db.get(otherUserId) : null
          otherUserProfile = storeProfile
        } else {
          // For store viewing brand requests
          const brandProfile = request.brandProfileId ? await ctx.db.get(request.brandProfileId) : null
          otherUserId = brandProfile?.userId
          otherUser = otherUserId ? await ctx.db.get(otherUserId) : null
          otherUserProfile = brandProfile
        }

        // Get shelf details
        const shelf = await ctx.db.get(request.shelfId)

        // Get shelf store for this rental to calculate sales count
        const shelfStore = await ctx.db
          .query("shelfStores")
          .withIndex("by_rental", (q) => q.eq("rentalRequestId", request._id))
          .first()

        // Calculate total sales count from customer orders
        let salesCount = 0
        if (shelfStore) {
          const orders = await ctx.db
            .query("customerOrders")
            .withIndex("by_shelf_store", (q) => q.eq("shelfStoreId", shelfStore._id))
            .collect()

          // Sum up all item quantities from all orders
          salesCount = orders.reduce((total, order) => {
            return total + order.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0)
          }, 0)
        }

        // For store owners viewing brand requests, include all brand details
        if (args.userType === "store" && otherUser && otherUserProfile) {
          return {
            ...request,
            otherUserId: otherUser._id,
            otherUserName: (otherUserProfile as any).brandName || "",
            otherUserEmail: otherUser?.email || "",
            city: shelf?.city,
            shelfCity: shelf?.city,
            shelfName: shelf?.shelfName,
            shelfBranch: shelf?.storeBranch,
            activityType: (otherUserProfile as any).brandType,
                  website: (otherUserProfile as any).website,
            commercialRegisterNumber: (otherUserProfile as any).commercialRegisterNumber || (otherUserProfile as any).freelanceLicenseNumber,
            commercialRegisterFile: (otherUserProfile as any).commercialRegisterDocument
              ? await ctx.storage.getUrl((otherUserProfile as any).commercialRegisterDocument)
              : (otherUserProfile as any).freelanceLicenseDocument
              ? await ctx.storage.getUrl((otherUserProfile as any).freelanceLicenseDocument)
              : undefined,
            ownerName: (otherUserProfile as any).brandName,
            salesCount, // Add real sales count
          }
        }

        // For brand owners viewing store responses
        return {
          ...request,
          otherUserId: otherUser?._id,
          otherUserName: (otherUserProfile as any)?.storeName || "",
          otherUserEmail: otherUser?.email || "",
          city: shelf?.city,
          shelfName: shelf?.shelfName,
          shelfBranch: shelf?.storeBranch,
          salesCount, // Add real sales count
        }
      })
    )
    
    // Sort by creation date (newest first)
    return enrichedRequests.sort((a, b) => 
      new Date(b._creationTime).getTime() - new Date(a._creationTime).getTime()
    )
  },
})


// Get active rental request for a shelf
export const getActiveRentalRequest = query({
  args: {
    shelfId: v.id("shelves"),
    brandOwnerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get brand profile first
    const brandProfileData = await getUserProfile(ctx, args.brandOwnerId)
    if (!brandProfileData || brandProfileData.type !== "brand_owner") {
      return null
    }
    
    // Look for an active request for this shelf by this brand owner
    const activeRequest = await ctx.db
      .query("rentalRequests")
      .withIndex("by_brand")
      .filter((q) =>
        q.and(
          q.eq(q.field("brandProfileId"), brandProfileData.profile._id),
          q.eq(q.field("shelfId"), args.shelfId)
        )
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
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
    
    // Get user's profile
    const profileData = await getUserProfile(ctx, userId)
    if (!profileData || profileData.type !== "brand_owner") {
      return null
    }
    
    // Look for an active request for this shelf by current user
    const activeRequest = await ctx.db
      .query("rentalRequests")
      .withIndex("by_brand")
      .filter((q) =>
        q.and(
          q.eq(q.field("brandProfileId"), profileData.profile._id),
          q.eq(q.field("shelfId"), args.shelfId)
        )
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
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
    // Get user's profile
    const profileData = await getUserProfile(ctx, args.userId)
    if (!profileData || profileData.type !== "brand_owner") {
      return null
    }
    
    // Find any rental request from this user for this shelf
    const request = await ctx.db
      .query("rentalRequests")
      .withIndex("by_shelf")
      .filter((q) => 
        q.and(
          q.eq(q.field("shelfId"), args.shelfId),
          q.eq(q.field("brandProfileId"), profileData.profile._id)
        )
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "payment_pending"),
          q.eq(q.field("status"), "active")
        )
      )
      .first()
    
    return request
  },
})

// Get all active/pending rentals for a shelf to show in calendar
export const getShelfRentalSchedule = query({
  args: {
    shelfId: v.id("shelves"),
  },
  handler: async (ctx, args) => {
    // Get all non-rejected/cancelled rentals for this shelf
    const rentals = await ctx.db
      .query("rentalRequests")
      .withIndex("by_shelf", (q) => q.eq("shelfId", args.shelfId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "payment_pending"),
          q.eq(q.field("status"), "pending")
        )
      )
      .collect()

    // Get brand names for each rental
    const rentalsWithBrands = await Promise.all(
      rentals.map(async (rental) => {
        const brandProfile = await ctx.db.get(rental.brandProfileId)
        return {
          startDate: rental.startDate,
          endDate: rental.endDate,
          status: rental.status,
          brandName: brandProfile?.brandName || "Unknown",
          brandProfileId: rental.brandProfileId,
        }
      })
    )

    return rentalsWithBrands
  },
})

// Check if shelf is still available (no accepted/active requests from anyone)
export const isShelfAvailable = query({
  args: {
    shelfId: v.id("shelves"),
    currentUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Check if shelf exists
    const shelf = await ctx.db.get(args.shelfId)
    if (!shelf || shelf.status !== "active") {
      return { available: false, reason: "shelf_not_available" }
    }
    
    // Check for any accepted, payment_pending, or active requests
    const unavailableRequests = await ctx.db
      .query("rentalRequests")
      .withIndex("by_shelf")
      .filter((q) => q.eq(q.field("shelfId"), args.shelfId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "payment_pending"),
          q.eq(q.field("status"), "active")
        )
      )
      .first()
    
    if (unavailableRequests) {
      // Check if the request belongs to the current user
      let acceptedByCurrentUser = false
      if (args.currentUserId) {
        const profileData = await getUserProfile(ctx, args.currentUserId)
        if (profileData && profileData.type === "brand_owner") {
          acceptedByCurrentUser = unavailableRequests.brandProfileId === profileData.profile._id
        }
      }
      
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
    
    // Get user's profile to determine correct field
    const profileData = await getUserProfile(ctx, userId)
    if (!profileData) return {
      totalRequests: 0,
      activeRentals: 0,
      pendingRequests: 0,
      totalRevenue: 0,
      requestsChange: 0,
      activeChange: 0,
      pendingChange: 0,
      revenueChange: 0,
    }
    
    // Query based on user type
    const requests = args.userType === "brand"
      ? await ctx.db
          .query("rentalRequests")
          .withIndex("by_brand")
          .filter((q) => q.eq(q.field("brandProfileId"), profileData.profile._id))
          .collect()
      : await ctx.db
          .query("rentalRequests")
          .withIndex("by_store")
          .filter((q) => q.eq(q.field("storeProfileId"), profileData.profile._id))
          .collect()
    
    // Calculate date range based on period using helper
    const { now, currentPeriodStart, previousPeriodStart, previousPeriodEnd } = getPeriodDates(args.period)

    // Filter requests by period
    const currentPeriodRequests = requests.filter(r => {
      const createdAt = new Date(r._creationTime)
      return createdAt >= currentPeriodStart && createdAt <= now
    })

    const previousPeriodRequests = requests.filter(r => {
      const createdAt = new Date(r._creationTime)
      return createdAt >= previousPeriodStart && createdAt <= previousPeriodEnd
    })

    // Calculate stats for current period
    const currentActive = currentPeriodRequests.filter(r => r.status === "active").length
    const currentPending = currentPeriodRequests.filter(r => r.status === "pending").length
    const currentAccepted = currentPeriodRequests.filter(r =>
      r.status === "payment_pending"
    ).length

    // Calculate stats for previous period
    const previousActive = previousPeriodRequests.filter(r => r.status === "active").length
    const previousPending = previousPeriodRequests.filter(r => r.status === "pending").length
    const previousAccepted = previousPeriodRequests.filter(r =>
      r.status === "payment_pending"
    ).length

    return {
      active: currentActive,
      activeChange: calculatePercentageChange(currentActive, previousActive),
      pending: currentPending,
      pendingChange: calculatePercentageChange(currentPending, previousPending),
      accepted: currentAccepted,
      acceptedChange: calculatePercentageChange(currentAccepted, previousAccepted),
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

    // Idempotency check: If already active, verify shelf store exists and return success
    // This prevents errors when webhook is called multiple times (retries, duplicates, etc.)
    if (request.status === "active") {
      const existingShelfStore = await ctx.db
        .query("shelfStores")
        .withIndex("by_rental", (q) => q.eq("rentalRequestId", args.requestId))
        .first()

      if (existingShelfStore) {
        // Already processed successfully, return success (idempotent behavior)
        console.log(`[confirmPayment] Request ${args.requestId} already confirmed (status: active, shelf store exists)`)
        return { success: true, alreadyProcessed: true }
      }

      // Status is active but shelf store missing - this shouldn't happen, but let's log it
      console.warn(`[confirmPayment] Request ${args.requestId} is active but shelf store missing - will attempt to create`)
      // Continue with shelf store creation below
    } else {
      // Verify the request status is valid for payment confirmation
      // Allow payment from multiple states (for testing and flexibility)
      const validStatuses = ["payment_pending", "pending", "approved"]
      if (!validStatuses.includes(request.status)) {
        throw new Error(`Invalid request status for payment confirmation. Current: ${request.status}, Expected one of: ${validStatuses.join(", ")}`)
      }
    }
    
    // Update the request status to active (since we'll have automated payment in future)
    await ctx.db.patch(args.requestId, {
      status: "active",
    })

    // Create shelf store for QR code functionality
    await ctx.runMutation(api.shelfStores.createShelfStore, {
      rentalRequestId: args.requestId,
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
            q.eq(q.field("status"), "payment_pending")
          )
        )
      )
      .collect()
    
    // Reject each other request
    for (const otherRequest of otherRequests) {
      await ctx.db.patch(otherRequest._id, {
        status: "rejected",
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
    const brandProfile = request.brandProfileId ? await ctx.db.get(request.brandProfileId) : null
    const brandOwner = brandProfile?.userId ? await ctx.db.get(brandProfile.userId) : null
    const storeProfile = request.storeProfileId ? await ctx.db.get(request.storeProfileId) : null
    const storeOwner = storeProfile?.userId ? await ctx.db.get(storeProfile.userId) : null
    
    
    // Send system message in the conversation
    if (request.conversationId && brandProfile) {
      await ctx.db.insert("messages", {
        conversationId: request.conversationId,
        senderType: "brand" as const,
        senderId: brandProfile._id as any,
        text: `تم تأكيد التحويل البنكي بمبلغ ${args.paymentAmount} ريال. يرجى الانتظار حتى يتم التحقق من الدفع.\nBank transfer of ${args.paymentAmount} SAR confirmed. Please wait for payment verification.`,
        messageType: "text",
        isRead: false,
      })
    }
    
    return { success: true }
  },
})



// Get rental request details
export const getRentalRequestDetails = query({
  args: {
    requestId: v.id("rentalRequests"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId)
    if (!request) {
      return null
    }

    // Get shelf details
    const shelf = await ctx.db.get(request.shelfId)
    if (!shelf) {
      return null
    }

    // Get brand profile
    const brandProfile = await ctx.db.get(request.brandProfileId)

    // Get store profile
    const storeProfile = await ctx.db.get(request.storeProfileId)

    // Calculate rental months from dates
    const startDate = new Date(request.startDate)
    const endDate = new Date(request.endDate)
    const monthDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                      (endDate.getMonth() - startDate.getMonth())
    const rentalMonths = Math.max(1, Math.ceil(monthDiff))

    return {
      ...request,
      shelfName: shelf.shelfName,
      city: shelf.city,
      branch: shelf.storeBranch,
      brandName: brandProfile?.brandName,
      storeName: storeProfile?.storeName,
      rentalMonths,
    }
  },
})

// Internal query to get rental request by ID (for Tap payment redirect)
export const getById = internalQuery({
  args: {
    requestId: v.id("rentalRequests"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.requestId)
  },
})
