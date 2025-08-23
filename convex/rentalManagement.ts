import { v } from "convex/values"
import { internalMutation, internalQuery, mutation, query } from "./_generated/server"
import { Doc, Id } from "./_generated/dataModel"

// Internal function to check and update rental statuses
export const checkRentalStatuses = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString()
    
    // Get all active rentals
    const activeRentals = await ctx.db
      .query("rentalRequests")
      .withIndex("by_status")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect()
    
    for (const rental of activeRentals) {
      // Check if rental period has ended
      if (rental.endDate <= now) {
        // Mark rental as completed
        await ctx.db.patch(rental._id, {
          status: "completed",
          updatedAt: now,
        })
        
        // Release the shelf - remove invalid fields that don't exist in shelf schema
        await ctx.db.patch(rental.shelfId, {
          isAvailable: true,
          status: "approved",
          updatedAt: now,
        })
        
        // Update conversation status if conversation exists
        if (rental.conversationId) {
          await ctx.db.patch(rental.conversationId, {
            status: "archived",
            updatedAt: now,
          })
        }
        
        // Send completion notifications
        if (rental.requesterId) {
          await ctx.db.insert("notifications", {
            userId: rental.requesterId,
            title: "Rental Completed",
            message: `Your rental period has ended. Please rate your experience.`,
            type: "rental_completed",
            rentalRequestId: rental._id,
            conversationId: rental.conversationId,
            isRead: false,
            createdAt: now,
          })
        }
        
        if (rental.ownerId) {
          await ctx.db.insert("notifications", {
            userId: rental.ownerId,
            title: "Rental Completed",
            message: `The rental period has ended. The shelf is now available. Please rate your experience.`,
            type: "rental_completed",
            rentalRequestId: rental._id,
            conversationId: rental.conversationId,
            isRead: false,
            createdAt: now,
          })
        }
        
        // Add system message to conversation if conversation exists
        if (rental.conversationId && rental.ownerId) {
          await ctx.db.insert("messages", {
            conversationId: rental.conversationId,
            senderId: rental.ownerId, // System message from store owner perspective
            text: "The rental period has been completed successfully. Thank you for using our platform!",
            messageType: "system",
            isRead: false,
            createdAt: now,
          })
        }
      }
    }
    
    // Check for expired pending requests (48 hours)
    const pendingRequests = await ctx.db
      .query("rentalRequests")
      .withIndex("by_status")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect()
    
    for (const request of pendingRequests) {
      if (request.expiresAt && request.expiresAt <= now) {
        await ctx.db.patch(request._id, {
          status: "expired",
          updatedAt: now,
        })
        
        // Send expiration notification
        if (request.requesterId) {
          await ctx.db.insert("notifications", {
            userId: request.requesterId,
            title: "Rental Request Expired",
            message: "Your rental request has expired after 48 hours without response.",
            type: "rental_expired",
            rentalRequestId: request._id,
            conversationId: request.conversationId,
            isRead: false,
            createdAt: now,
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
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const nowStr = now.toISOString()
    const sevenDaysStr = sevenDaysFromNow.toISOString()
    
    // Get rentals ending in 7 days
    const expiringRentals = await ctx.db
      .query("rentalRequests")
      .withIndex("by_status")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect()
    
    for (const rental of expiringRentals) {
      // Check if rental ends within 7 days
      if (rental.endDate > nowStr && rental.endDate <= sevenDaysStr) {
        // Calculate days remaining
        const endDate = new Date(rental.endDate)
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        // Check if we haven't already sent a reminder for this day
        const existingReminder = await ctx.db
          .query("notifications")
          .withIndex("by_user", (q) => q.eq("userId", rental.requesterId!))
          .filter((q) => 
            q.and(
              q.eq(q.field("rentalRequestId"), rental._id),
              q.eq(q.field("type"), "system")
            )
          )
          .first()
        
        if (!existingReminder || !existingReminder.message.includes(`${daysRemaining} day`)) {
          // Send reminder to brand owner
          if (rental.requesterId) {
            await ctx.db.insert("notifications", {
              userId: rental.requesterId,
              title: "Rental Ending Soon",
              message: `Your rental will end in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}. Consider renewing if you'd like to continue.`,
              type: "system",
              rentalRequestId: rental._id,
              conversationId: rental.conversationId,
              actionUrl: `/brand-dashboard/shelves`,
              actionLabel: "View Rental",
              isRead: false,
              createdAt: nowStr,
            })
          }
          
          // Send reminder to store owner
          if (rental.ownerId) {
            await ctx.db.insert("notifications", {
              userId: rental.ownerId,
              title: "Rental Ending Soon",
              message: `A rental on your shelf will end in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}.`,
              type: "system",
              rentalRequestId: rental._id,
              conversationId: rental.conversationId,
              actionUrl: `/store-dashboard/orders`,
              actionLabel: "View Order",
              isRead: false,
              createdAt: nowStr,
            })
          }
        }
      }
    }
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
    
    if (!user || user._id !== rental.requesterId) {
      throw new Error("Unauthorized")
    }
    
    // Calculate new total price
    const newTotalPrice = rental.monthlyPrice * args.additionalMonths
    const now = new Date().toISOString()
    
    // Create a new rental request for renewal
    const renewalRequest = await ctx.db.insert("rentalRequests", {
      shelfId: rental.shelfId,
      requesterId: rental.requesterId,
      requesterProfileId: rental.requesterProfileId,
      ownerId: rental.ownerId,
      ownerProfileId: rental.ownerProfileId,
      startDate: rental.endDate, // Start from current end date
      endDate: args.newEndDate,
      productType: rental.productType,
      productDescription: rental.productDescription,
      productCount: rental.productCount,
      additionalNotes: `Renewal of rental #${rental._id}`,
      selectedProductIds: rental.selectedProductIds,
      selectedProductQuantities: rental.selectedProductQuantities,
      monthlyPrice: rental.monthlyPrice,
      totalAmount: newTotalPrice,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      conversationId: rental.conversationId,
    })
    
    // Send notification to store owner
    if (rental.ownerId) {
      await ctx.db.insert("notifications", {
        userId: rental.ownerId,
        title: "Renewal Request",
        message: `The brand owner wants to renew their rental for ${args.additionalMonths} more month${args.additionalMonths > 1 ? 's' : ''}.`,
        type: "rental_request",
        rentalRequestId: renewalRequest,
        conversationId: rental.conversationId,
        actionUrl: `/store-dashboard/orders/${renewalRequest}`,
        actionLabel: "Review Request",
        isRead: false,
        createdAt: now,
      })
    }
    
    // Add message to conversation if it exists
    if (rental.conversationId && rental.requesterId) {
      await ctx.db.insert("messages", {
        conversationId: rental.conversationId,
        senderId: rental.requesterId,
        text: `I would like to renew the rental for ${args.additionalMonths} more month${args.additionalMonths > 1 ? 's' : ''}.`,
        messageType: "rental_request",
        isRead: false,
        createdAt: now,
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