import { v } from "convex/values"
import { internalMutation, internalQuery, mutation, query } from "./_generated/server"
import { Doc, Id } from "./_generated/dataModel"
import { getUserProfile } from "./profileHelpers"
import { api, internal } from "./_generated/api"

// Internal function to check and update rental statuses
export const checkRentalStatuses = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    
    // 1. Check for payment_pending requests that need to be activated (when start date arrives)
    const paymentPendingRentals = await ctx.db
      .query("rentalRequests")
      .withIndex("by_status", (q) => q.eq("status", "payment_pending"))
      .collect()
    
    for (const rental of paymentPendingRentals) {
      // If the start date has arrived, activate the rental
      if (rental.startDate <= now) {
        // Mark rental as active
        await ctx.db.patch(rental._id, {
          status: "active"
        })
        
        // Send system message about rental activation
        if (rental.conversationId) {
          await ctx.scheduler.runAfter(0, internal.rentalManagement.sendRentalSystemMessage, {
            conversationId: rental.conversationId,
            text: "تم تفعيل الإيجار بنجاح. فترة الإيجار النشطة بدأت الآن.\nThe rental has been activated successfully. The active rental period has now begun.",
            messageType: "rental_accepted",
            senderId: rental.storeProfileId as any
          })
        }
      }
    }
    
    // 2. Check for active rentals that need to be completed (when end date passes)
    const activeRentals = await ctx.db
      .query("rentalRequests")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect()
    
    for (const rental of activeRentals) {
      // Check if rental period has ended
      if (rental.endDate <= now) {
        // Mark rental as completed
        await ctx.db.patch(rental._id, {
          status: "completed"
        })
        
        // Send system message about rental completion
        if (rental.conversationId) {
          await ctx.scheduler.runAfter(0, internal.rentalManagement.sendRentalSystemMessage, {
            conversationId: rental.conversationId,
            text: "تم إكمال فترة الإيجار بنجاح. شكراً لاستخدامك منصتنا!\nThe rental period has been completed successfully. Thank you for using our platform!",
            messageType: "text",
            senderId: rental.storeProfileId as any
          })
        }
      }
    }
    
    // 3. Check for expired pending requests (not responded to within 48 hours)
    const pendingRequests = await ctx.db
      .query("rentalRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect()
    
    for (const request of pendingRequests) {
      // Check if request is older than 48 hours
      const expiryTime = request._creationTime + (48 * 60 * 60 * 1000)
      if (expiryTime <= now) {
        // Mark request as expired
        await ctx.db.patch(request._id, {
          status: "expired",
        })
        
        // Send system message about request expiration
        if (request.conversationId) {
          await ctx.scheduler.runAfter(0, internal.rentalManagement.sendRentalSystemMessage, {
            conversationId: request.conversationId,
            text: "انتهت صلاحية طلب الإيجار بسبب عدم الرد خلال 48 ساعة.\nThe rental request has expired due to no response within 48 hours.",
            messageType: "rental_rejected",
            senderId: request.storeProfileId as any
          })
        }
      }
    }
  },
})

// Internal function to send rental reminders
export const sendRentalReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000
    const threeDaysFromNow = now + 3 * 24 * 60 * 60 * 1000
    const oneDayFromNow = now + 24 * 60 * 60 * 1000
    
    // 1. Get active rentals ending soon
    const activeRentals = await ctx.db
      .query("rentalRequests")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect()
    
    for (const rental of activeRentals) {
      // Skip if no conversation
      if (!rental.conversationId) continue
      
      const daysUntilEnd = Math.ceil((rental.endDate - now) / (24 * 60 * 60 * 1000))
      let reminderMessage: string | null = null
      
      // Send reminders at 7 days, 3 days, and 1 day before expiry
      if (daysUntilEnd === 7) {
        reminderMessage = `تذكير: سينتهي إيجار الرف خلال 7 أيام (${new Date(rental.endDate).toLocaleDateString()}). يرجى التخطيط للتجديد إذا لزم الأمر.\nReminder: The shelf rental will expire in 7 days (${new Date(rental.endDate).toLocaleDateString()}). Please plan for renewal if needed.`
      } else if (daysUntilEnd === 3) {
        reminderMessage = `تذكير عاجل: سينتهي إيجار الرف خلال 3 أيام (${new Date(rental.endDate).toLocaleDateString()}).\nUrgent reminder: The shelf rental will expire in 3 days (${new Date(rental.endDate).toLocaleDateString()}).`
      } else if (daysUntilEnd === 1) {
        reminderMessage = `تذكير نهائي: سينتهي إيجار الرف غداً (${new Date(rental.endDate).toLocaleDateString()}). يرجى إزالة منتجاتك أو تجديد الإيجار.\nFinal reminder: The shelf rental will expire tomorrow (${new Date(rental.endDate).toLocaleDateString()}). Please remove your products or renew the rental.`
      }
      
      if (reminderMessage) {
        await ctx.scheduler.runAfter(0, internal.rentalManagement.sendRentalSystemMessage, {
          conversationId: rental.conversationId,
          text: reminderMessage,
          messageType: "text",
          senderId: rental.storeProfileId as any
        })
      }
    }
    
    // 2. Get payment_pending rentals (remind about payment)
    const paymentPendingRentals = await ctx.db
      .query("rentalRequests")
      .withIndex("by_status", (q) => q.eq("status", "payment_pending"))
      .collect()
    
    for (const rental of paymentPendingRentals) {
      // Skip if no conversation
      if (!rental.conversationId) continue
      
      const daysSinceAccepted = Math.floor((now - rental._creationTime) / (24 * 60 * 60 * 1000))
      
      // Send payment reminder after 1 day of acceptance
      if (daysSinceAccepted === 1) {
        await ctx.scheduler.runAfter(0, internal.rentalManagement.sendRentalSystemMessage, {
          conversationId: rental.conversationId,
          text: "تذكير: يرجى إكمال الدفع لتفعيل إيجار الرف. سيتم إلغاء الطلب إذا لم يتم الدفع خلال 48 ساعة من الموافقة.\nReminder: Please complete the payment to activate the shelf rental. The request will be cancelled if payment is not made within 48 hours of acceptance.",
          messageType: "text",
          senderId: rental.brandProfileId as any
        })
      }
    }
  },
})

// Internal helper to send rental system messages
export const sendRentalSystemMessage = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    text: v.string(),
    messageType: v.union(
      v.literal("text"),
      v.literal("rental_request"),
      v.literal("rental_accepted"),
      v.literal("rental_rejected")
    ),
    senderId: v.union(
      v.id("brandProfiles"),
      v.id("storeProfiles")
    ), // Profile ID for context
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) return
    
    // Create system message
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderType: "system",
      senderId: args.senderId,
      text: args.text,
      messageType: args.messageType,
      isRead: false,
    })
    
    // Increment unread counts for both parties
    await ctx.db.patch(args.conversationId, {
      brandUnreadCount: conversation.brandUnreadCount + 1,
      storeUnreadCount: conversation.storeUnreadCount + 1,
    })
  },
})

// Mutation to renew a rental
export const renewRental = mutation({
  args: {
    rentalRequestId: v.id("rentalRequests"),
    newEndDate: v.string(),
    additionalMonths: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    
    const rental = await ctx.db.get(args.rentalRequestId)
    if (!rental) throw new Error("Rental not found")
    
    // Verify the user is the brand owner
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email!))
      .first()
    
    if (!user) {
      throw new Error("User not found")
    }
    
    // Get user profile and verify they own this rental
    const profileData = await getUserProfile(ctx, user._id)
    if (!profileData || profileData.type !== "brand_owner" || profileData.profile._id !== rental.brandProfileId) {
      throw new Error("Unauthorized")
    }
    
    // Calculate new total price
    const newTotalPrice = rental.monthlyPrice * args.additionalMonths
    const now = Date.now()
    
    // Get the shelf to get current commission rate
    const shelf = await ctx.db.get(rental.shelfId)
    
    // Get platform settings for commission
    const platformSettings = await ctx.db.query("platformSettings").collect()
    const brandSalesCommission = platformSettings.find(s => s.key === "brandSalesCommission")?.value || 8
    const platformFee = brandSalesCommission
    const shelfStoreCommission = shelf?.storeCommission || 0
    // If shelf has commission, use shelf + platform. Otherwise use the original rental's total commission
    const totalCommission = shelf ? (shelfStoreCommission + platformFee) : (rental.storeCommission || 0)
    
    // Create a new rental request for renewal
    const renewalRequest = await ctx.db.insert("rentalRequests", {
      shelfId: rental.shelfId,
      brandProfileId: rental.brandProfileId,
      storeProfileId: rental.storeProfileId,
      startDate: rental.endDate, // Start from current end date
      endDate: new Date(args.newEndDate).getTime(),
      selectedProducts: rental.selectedProducts,
      monthlyPrice: rental.monthlyPrice,
      totalAmount: newTotalPrice,
      storeCommission: totalCommission, // Store + شبر platform commission
      status: "pending",
      conversationId: rental.conversationId,
    })
    
    // Add message to conversation if it exists
    if (rental.conversationId && profileData) {
      await ctx.runMutation(api.chats.sendSystemMessage, {
        conversationId: rental.conversationId,
        senderId: profileData.profile._id as any,
        text: `I would like to renew the rental for ${args.additionalMonths} more month${args.additionalMonths > 1 ? 's' : ''}.`,
        messageType: "rental_request",
      })
    }
    
    return renewalRequest
  },
})

// Query to get rental reviews - DISABLED: rentalReviews table not in schema
// export const getRentalReviews = query({
//   args: {
//     rentalRequestId: v.id("rentalRequests"),
//   },
//   handler: async (ctx, args) => {
//     // TODO: Add rentalReviews table to schema first
//     return []
//   },
// })

// Mutation to submit a review - DISABLED: rentalReviews table not in schema
// export const submitReview = mutation({
//   args: {
//     rentalRequestId: v.id("rentalRequests"),
//     rating: v.number(),
//     revieweeId: v.id("users"),
//   },
//   handler: async (ctx, args) => {
//     // TODO: Add rentalReviews table to schema first
//     return { success: false, message: "Reviews not implemented yet" }
//   },
// })