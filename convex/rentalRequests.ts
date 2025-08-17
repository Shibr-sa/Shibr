import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

// Create or update a rental request
export const createRentalRequest = mutation({
  args: {
    shelfId: v.id("shelves"),
    brandOwnerId: v.id("users"),
    startDate: v.string(),
    endDate: v.string(),
    productType: v.string(),
    productDescription: v.string(),
    productCount: v.number(),
    additionalNotes: v.optional(v.string()),
    conversationId: v.id("conversations"),
    selectedProductIds: v.optional(v.array(v.id("products"))),
  },
  handler: async (ctx, args) => {
    // Get shelf details
    const shelf = await ctx.db.get(args.shelfId)
    if (!shelf || !shelf.ownerId) {
      throw new Error("Shelf not found")
    }

    // Check for existing active rental request for the same shelf from the same brand owner
    const existingRequests = await ctx.db
      .query("rentalRequests")
      .withIndex("by_brand_owner")
      .filter((q) => 
        q.eq(q.field("brandOwnerId"), args.brandOwnerId)
      )
      .collect()
    
    // Filter for pending requests for the same shelf
    const activeRequest = existingRequests.find(
      req => req.shelfId === args.shelfId && 
             req.status === "pending" &&
             req.storeOwnerId === shelf.ownerId
    )

    // Calculate total price
    const startDate = new Date(args.startDate)
    const endDate = new Date(args.endDate)
    const months = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
    const totalPrice = shelf.monthlyPrice * months

    let requestId: Id<"rentalRequests">
    let isUpdate = false

    if (activeRequest) {
      // Update existing request
      await ctx.db.patch(activeRequest._id, {
        startDate: args.startDate,
        endDate: args.endDate,
        productType: args.productType,
        productDescription: args.productDescription,
        productCount: args.productCount,
        additionalNotes: args.additionalNotes,
        selectedProductIds: args.selectedProductIds,
        monthlyPrice: shelf.monthlyPrice,
        totalPrice: totalPrice,
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Reset 48 hours
      })
      requestId = activeRequest._id
      isUpdate = true
    } else {
      // Create new rental request
      requestId = await ctx.db.insert("rentalRequests", {
        conversationId: args.conversationId,
        shelfId: args.shelfId,
        brandOwnerId: args.brandOwnerId,
        storeOwnerId: shelf.ownerId,
        startDate: args.startDate,
        endDate: args.endDate,
        productType: args.productType,
        productDescription: args.productDescription,
        productCount: args.productCount,
        additionalNotes: args.additionalNotes,
        selectedProductIds: args.selectedProductIds,
        monthlyPrice: shelf.monthlyPrice,
        totalPrice: totalPrice,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
      })
    }

    // Update conversation status
    const conversation = await ctx.db.get(args.conversationId)
    if (conversation) {
      await ctx.db.patch(conversation._id, {
        status: "pending",
        rentalRequestId: requestId,
        updatedAt: new Date().toISOString(),
      })
    }

    // Format dates nicely (using Gregorian calendar with Western numerals)
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr)
      // Format in Arabic text but with Western numerals
      const monthNames = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ]
      const month = monthNames[date.getMonth()]
      const day = date.getDate()
      const year = date.getFullYear()
      return `${day} ${month} ${year}`
    }
    
    // Calculate duration in days
    const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Send system message about rental request
    const messageText = isUpdate 
      ? `🔄 تحديث طلب الإيجار

📍 الرف: ${shelf.shelfName}
📅 الفترة: ${formatDate(args.startDate)} - ${formatDate(args.endDate)}
⏱️ المدة: ${durationDays} يوم

📦 نوع المنتج: ${args.productType}
📝 الوصف: ${args.productDescription}
🔢 الكمية: ${args.productCount} قطعة

💵 السعر الشهري: ${shelf.monthlyPrice.toLocaleString('en-US')} ريال
💰 الإجمالي: ${totalPrice.toLocaleString('en-US')} ريال

${args.additionalNotes ? `📌 ملاحظات: ${args.additionalNotes}` : ''}`
      : `✨ طلب إيجار جديد

📍 الرف: ${shelf.shelfName}
📅 الفترة: ${formatDate(args.startDate)} - ${formatDate(args.endDate)}
⏱️ المدة: ${durationDays} يوم

📦 نوع المنتج: ${args.productType}
📝 الوصف: ${args.productDescription}
🔢 الكمية: ${args.productCount} قطعة

💵 السعر الشهري: ${shelf.monthlyPrice.toLocaleString('en-US')} ريال
💰 الإجمالي: ${totalPrice.toLocaleString('en-US')} ريال

${args.additionalNotes ? `📌 ملاحظات: ${args.additionalNotes}` : ''}`
    
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.brandOwnerId,
      text: messageText,
      messageType: "rental_request",
      isRead: false,
      createdAt: new Date().toISOString(),
    })

    // Create notification for store owner
    const brandOwner = await ctx.db.get(args.brandOwnerId)
    await ctx.db.insert("notifications", {
      userId: shelf.ownerId,
      title: isUpdate ? "تحديث طلب إيجار" : "طلب إيجار جديد",
      message: isUpdate 
        ? `${brandOwner?.fullName || brandOwner?.brandName || "عميل"} قام بتحديث طلب استئجار ${shelf.shelfName}`
        : `${brandOwner?.fullName || brandOwner?.brandName || "عميل"} يريد استئجار ${shelf.shelfName}`,
      type: "rental_request",
      conversationId: args.conversationId,
      rentalRequestId: requestId,
      isRead: false,
      createdAt: new Date().toISOString(),
    })

    return { requestId, isUpdate }
  },
})

// Accept rental request
export const acceptRentalRequest = mutation({
  args: {
    requestId: v.id("rentalRequests"),
    storeOwnerResponse: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId)
    if (!request) {
      throw new Error("Request not found")
    }

    // Update request status to accepted (requires payment before activation)
    await ctx.db.patch(request._id, {
      status: "accepted",
      storeOwnerResponse: args.storeOwnerResponse,
      respondedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    // Don't update shelf as rented yet - wait for payment confirmation
    // The shelf will be marked as rented only after payment is verified

    // Update conversation status
    if (request.conversationId) {
      const conversation = await ctx.db.get(request.conversationId)
      if (conversation) {
        await ctx.db.patch(conversation._id, {
          status: "active",
          updatedAt: new Date().toISOString(),
        })
      }

      // Send system message
      await ctx.db.insert("messages", {
        conversationId: request.conversationId,
        senderId: request.storeOwnerId,
        text: args.storeOwnerResponse || "تم قبول طلب الإيجار! يرجى إتمام عملية الدفع لتفعيل الإيجار ✅ / Rental request accepted! Please complete payment to activate the rental ✅",
        messageType: "rental_accepted",
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    }

    // Notify brand owner about payment requirement
    await ctx.db.insert("notifications", {
      userId: request.brandOwnerId,
      title: "تم قبول طلب الإيجار - مطلوب الدفع / Rental Request Accepted - Payment Required",
      message: "تم قبول طلبك لاستئجار الرف. يرجى إتمام عملية الدفع لتفعيل الإيجار / Your rental request has been accepted. Please complete payment to activate the rental.",
      type: "payment_required",
      rentalRequestId: request._id,
      conversationId: request.conversationId,
      actionUrl: `/brand-dashboard/shelves`,
      actionLabel: "ادفع الآن / Pay Now",
      isRead: false,
      createdAt: new Date().toISOString(),
    })

    return request._id
  },
})

// Reject rental request
export const rejectRentalRequest = mutation({
  args: {
    requestId: v.id("rentalRequests"),
    storeOwnerResponse: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId)
    if (!request) {
      throw new Error("Request not found")
    }

    // Update request status
    await ctx.db.patch(request._id, {
      status: "rejected",
      storeOwnerResponse: args.storeOwnerResponse,
      respondedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    // Archive conversation when request is rejected
    if (request.conversationId) {
      const conversation = await ctx.db.get(request.conversationId)
      if (conversation) {
        await ctx.db.patch(conversation._id, {
          status: "archived",
          updatedAt: new Date().toISOString(),
        })
      }

      // Send system message
      await ctx.db.insert("messages", {
        conversationId: request.conversationId,
        senderId: request.storeOwnerId,
        text: args.storeOwnerResponse || "عذراً، تم رفض طلب الإيجار.",
        messageType: "rental_rejected",
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    }

    // Notify brand owner
    await ctx.db.insert("notifications", {
      userId: request.brandOwnerId,
      title: "تم رفض طلب الإيجار",
      message: args.storeOwnerResponse || "عذراً، تم رفض طلبك لاستئجار الرف.",
      type: "rental_rejected",
      rentalRequestId: request._id,
      conversationId: request.conversationId,
      isRead: false,
      createdAt: new Date().toISOString(),
    })

    return request._id
  },
})

// Get rental request details
export const getRentalRequest = query({
  args: {
    requestId: v.id("rentalRequests"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId)
    if (!request) return null

    const shelf = await ctx.db.get(request.shelfId)
    const brandOwner = await ctx.db.get(request.brandOwnerId)
    const storeOwner = await ctx.db.get(request.storeOwnerId)

    return {
      ...request,
      shelfName: shelf?.shelfName,
      shelfDetails: shelf,
      brandOwnerName: brandOwner?.fullName || brandOwner?.brandName,
      storeOwnerName: storeOwner?.fullName || storeOwner?.storeName,
    }
  },
})

// Get rental requests for a user
export const getUserRentalRequests = query({
  args: {
    userId: v.id("users"),
    userType: v.union(v.literal("brand"), v.literal("store")),
  },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("rentalRequests")
      .withIndex(args.userType === "brand" ? "by_brand_owner" : "by_store_owner")
      .filter((q) => 
        q.eq(
          q.field(args.userType === "brand" ? "brandOwnerId" : "storeOwnerId"),
          args.userId
        )
      )
      .collect()

    // Get additional details for each request
    const requestsWithDetails = await Promise.all(
      requests.map(async (request) => {
        const shelf = await ctx.db.get(request.shelfId)
        const otherUserId = args.userType === "brand" ? request.storeOwnerId : request.brandOwnerId
        const otherUser = await ctx.db.get(otherUserId)
        
        return {
          ...request,
          shelfName: shelf?.shelfName,
          shelfBranch: shelf?.branch,
          shelfCity: shelf?.city,
          shelfPrice: shelf?.monthlyPrice,
          otherUserId: otherUserId,
          otherUserName: otherUser?.fullName || otherUser?.storeName || otherUser?.brandName,
          otherUserEmail: otherUser?.email,
          phoneNumber: otherUser?.phoneNumber,
          website: otherUser?.website,
          activityType: otherUser?.storeType || otherUser?.brandType || "-",
          city: shelf?.city,
          commercialRegisterNumber: otherUser?.businessRegistration,
          commercialRegisterFile: otherUser?.businessRegistrationDocumentUrl,
          rating: 4, // Default rating for now
          rentalType: "monthly", // Default rental type
        }
      })
    )

    return requestsWithDetails.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
})

// Expire rental requests that have passed their expiration time
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
        await ctx.db.patch(conversation._id, {
          status: "archived",
          updatedAt: new Date().toISOString(),
        })
      }

      // Send system message
      await ctx.db.insert("messages", {
        conversationId: request.conversationId,
        senderId: request.storeOwnerId,
        text: "انتهت صلاحية طلب الإيجار / Rental request has expired",
        messageType: "rental_rejected",
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    }

    // Notify brand owner
    await ctx.db.insert("notifications", {
      userId: request.brandOwnerId,
      title: "انتهت صلاحية طلب الإيجار",
      message: "انتهت صلاحية طلبك لاستئجار الرف",
      type: "rental_rejected",
      rentalRequestId: request._id,
      conversationId: request.conversationId,
      isRead: false,
      createdAt: new Date().toISOString(),
    })

    return request._id
  },
})

// Check for active rental request
export const getActiveRentalRequest = query({
  args: {
    shelfId: v.id("shelves"),
    brandOwnerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get shelf to verify store owner
    const shelf = await ctx.db.get(args.shelfId)
    if (!shelf) return null

    // Get all requests for this brand owner
    const requests = await ctx.db
      .query("rentalRequests")
      .withIndex("by_brand_owner")
      .filter((q) => 
        q.eq(q.field("brandOwnerId"), args.brandOwnerId)
      )
      .collect()
    
    // Find pending request for this specific shelf
    const activeRequest = requests.find(
      req => req.shelfId === args.shelfId && 
             req.status === "pending" &&
             req.storeOwnerId === shelf.ownerId
    )

    return activeRequest || null
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
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    const currentWeek = Math.floor(now.getDate() / 7)

    // Define period boundaries
    let currentPeriodStart: Date
    let previousPeriodStart: Date
    let previousPeriodEnd: Date

    switch (args.period) {
      case "daily":
        currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        currentPeriodStart.setHours(0, 0, 0, 0)
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        previousPeriodStart.setHours(0, 0, 0, 0)
        previousPeriodEnd = currentPeriodStart
        break
      case "weekly":
        currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14)
        previousPeriodEnd = currentPeriodStart
        break
      case "monthly":
        currentPeriodStart = new Date(currentYear, currentMonth, 1)
        previousPeriodStart = new Date(currentYear, currentMonth - 1, 1)
        previousPeriodEnd = currentPeriodStart
        break
      case "yearly":
        currentPeriodStart = new Date(currentYear, 0, 1)
        previousPeriodStart = new Date(currentYear - 1, 0, 1)
        previousPeriodEnd = currentPeriodStart
        break
    }

    // Get all requests for the user
    const allRequests = await ctx.db
      .query("rentalRequests")
      .withIndex(args.userType === "brand" ? "by_brand_owner" : "by_store_owner")
      .filter((q) => 
        q.eq(
          q.field(args.userType === "brand" ? "brandOwnerId" : "storeOwnerId"),
          args.userId
        )
      )
      .collect()

    // Filter requests by period
    const currentRequests = allRequests.filter(r => {
      const createdAt = new Date(r.createdAt || r._creationTime)
      return createdAt >= currentPeriodStart && createdAt <= now
    })

    const previousRequests = allRequests.filter(r => {
      const createdAt = new Date(r.createdAt || r._creationTime)
      return createdAt >= previousPeriodStart && createdAt < previousPeriodEnd
    })

    // Calculate current stats
    const currentActive = currentRequests.filter(r => r.status === "active").length
    const currentPending = currentRequests.filter(r => r.status === "pending").length
    const currentTotal = currentRequests.length

    // Calculate previous stats
    const previousActive = previousRequests.filter(r => r.status === "active").length
    const previousPending = previousRequests.filter(r => r.status === "pending").length
    const previousTotal = previousRequests.length

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    return {
      active: currentActive,
      pending: currentPending,
      total: currentTotal,
      activeChange: calculateChange(currentActive, previousActive),
      pendingChange: calculateChange(currentPending, previousPending),
      totalChange: calculateChange(currentTotal, previousTotal),
    }
  },
})

// Confirm payment transfer by brand owner
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
    
    // Update the request status to payment_processing
    await ctx.db.patch(args.requestId, {
      status: "payment_processing",
      paymentConfirmedAt: new Date().toISOString(),
      paymentAmount: args.paymentAmount,
    })
    
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
    // For now, we'll just log this
    console.log("Admin notification: Payment confirmation pending for request", args.requestId)
    
    // Send system message in the conversation
    if (request.conversationId) {
      await ctx.db.insert("messages", {
        conversationId: request.conversationId,
        senderId: request.brandOwnerId,
        text: `Bank transfer of ${args.paymentAmount} SAR confirmed. Verifying payment... / تم تأكيد التحويل البنكي بمبلغ ${args.paymentAmount} ريال. جاري التحقق من الدفعة...`,
        messageType: "payment_confirmed",
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    }
    
    return { success: true }
  },
})

// Verify payment and activate rental (called by admin after verifying bank transfer)
export const verifyPaymentAndActivate = mutation({
  args: {
    requestId: v.id("rentalRequests"),
    verifiedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Get the rental request
    const request = await ctx.db.get(args.requestId)
    if (!request) {
      throw new Error("Rental request not found")
    }
    
    // Verify the request status is payment_processing
    if (request.status !== "payment_processing") {
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
      title: "تم تفعيل الإيجار / Rental Activated",
      message: "تم التحقق من الدفعة وتفعيل إيجار الرف بنجاح / Payment verified and shelf rental activated successfully",
      type: "rental_activated",
      rentalRequestId: request._id,
      actionUrl: `/brand-dashboard/shelves/${request._id}`,
      actionLabel: "عرض التفاصيل / View Details",
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