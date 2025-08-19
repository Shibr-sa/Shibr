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
        
        // Release the shelf
        await ctx.db.patch(rental.shelfId, {
          isAvailable: true,
          renterId: undefined,
          rentalStartDate: undefined,
          rentalEndDate: undefined,
          rentalPrice: undefined,
          status: "approved",
          updatedAt: now,
        })
        
        // Update conversation status
        await ctx.db.patch(rental.conversationId, {
          status: "archived",
          updatedAt: now,
        })
        
        // Send completion notifications
        await ctx.db.insert("notifications", {
          userId: rental.brandOwnerId,
          title: "Rental Completed",
          message: `Your rental period has ended. Please rate your experience.`,
          type: "rental_completed",
          rentalRequestId: rental._id,
          conversationId: rental.conversationId,
          isRead: false,
          createdAt: now,
        })
        
        await ctx.db.insert("notifications", {
          userId: rental.storeOwnerId,
          title: "Rental Completed",
          message: `The rental period has ended. The shelf is now available. Please rate your experience.`,
          type: "rental_completed",
          rentalRequestId: rental._id,
          conversationId: rental.conversationId,
          isRead: false,
          createdAt: now,
        })
        
        // Add system message to conversation
        await ctx.db.insert("messages", {
          conversationId: rental.conversationId,
          senderId: rental.storeOwnerId, // System message from store owner perspective
          text: "The rental period has been completed successfully. Thank you for using our platform!",
          messageType: "system",
          isRead: false,
          createdAt: now,
        })
      }
    }
    
    // Check for expired pending requests (48 hours)
    const pendingRequests = await ctx.db
      .query("rentalRequests")
      .withIndex("by_status")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect()
    
    for (const request of pendingRequests) {
      if (request.expiresAt <= now) {
        await ctx.db.patch(request._id, {
          status: "expired",
          updatedAt: now,
        })
        
        // Send expiration notification
        await ctx.db.insert("notifications", {
          userId: request.brandOwnerId,
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
          .withIndex("by_user")
          .filter((q) => 
            q.and(
              q.eq(q.field("userId"), rental.brandOwnerId),
              q.eq(q.field("rentalRequestId"), rental._id),
              q.eq(q.field("type"), "system")
            )
          )
          .first()
        
        if (!existingReminder || !existingReminder.message.includes(`${daysRemaining} day`)) {
          // Send reminder to brand owner
          await ctx.db.insert("notifications", {
            userId: rental.brandOwnerId,
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
          
          // Send reminder to store owner
          await ctx.db.insert("notifications", {
            userId: rental.storeOwnerId,
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
      .withIndex("by_email")
      .filter((q) => q.eq(q.field("email"), identity.email!))
      .first()
    
    if (!user || user._id !== rental.brandOwnerId) {
      throw new Error("Unauthorized")
    }
    
    // Calculate new total price
    const newTotalPrice = rental.monthlyPrice * args.additionalMonths
    const now = new Date().toISOString()
    
    // Create a new rental request for renewal
    const renewalRequest = await ctx.db.insert("rentalRequests", {
      conversationId: rental.conversationId,
      shelfId: rental.shelfId,
      brandOwnerId: rental.brandOwnerId,
      storeOwnerId: rental.storeOwnerId,
      startDate: rental.endDate, // Start from current end date
      endDate: args.newEndDate,
      productType: rental.productType,
      productDescription: rental.productDescription,
      productCount: rental.productCount,
      additionalNotes: `Renewal of rental #${rental._id}`,
      selectedProductIds: rental.selectedProductIds,
      selectedProductQuantities: rental.selectedProductQuantities,
      monthlyPrice: rental.monthlyPrice,
      totalPrice: newTotalPrice,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    })
    
    // Send notification to store owner
    await ctx.db.insert("notifications", {
      userId: rental.storeOwnerId,
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
    
    // Add message to conversation
    await ctx.db.insert("messages", {
      conversationId: rental.conversationId,
      senderId: rental.brandOwnerId,
      text: `I would like to renew the rental for ${args.additionalMonths} more month${args.additionalMonths > 1 ? 's' : ''}.`,
      messageType: "rental_request",
      isRead: false,
      createdAt: now,
    })
    
    return renewalRequest
  },
})

// Query to get rental reviews
export const getRentalReviews = query({
  args: {
    rentalRequestId: v.id("rentalRequests"),
  },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("rentalReviews")
      .withIndex("by_rental")
      .filter((q) => q.eq(q.field("rentalRequestId"), args.rentalRequestId))
      .collect()
    
    return reviews
  },
})

// Mutation to submit a review
export const submitReview = mutation({
  args: {
    rentalRequestId: v.id("rentalRequests"),
    rating: v.number(),
    revieweeId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email")
      .filter((q) => q.eq(q.field("email"), identity.email!))
      .first()
    
    if (!user) throw new Error("User not found")
    
    const rental = await ctx.db.get(args.rentalRequestId)
    if (!rental) throw new Error("Rental not found")
    
    // Verify the rental is completed
    if (rental.status !== "completed") {
      throw new Error("Can only review completed rentals")
    }
    
    // Check if user already reviewed
    const existingReview = await ctx.db
      .query("rentalReviews")
      .withIndex("by_rental")
      .filter((q) => 
        q.and(
          q.eq(q.field("rentalRequestId"), args.rentalRequestId),
          q.eq(q.field("reviewerId"), user._id)
        )
      )
      .first()
    
    if (existingReview) {
      throw new Error("You have already reviewed this rental")
    }
    
    const now = new Date().toISOString()
    
    // Create the review
    const review = await ctx.db.insert("rentalReviews", {
      rentalRequestId: args.rentalRequestId,
      reviewerId: user._id,
      revieweeId: args.revieweeId,
      rating: args.rating,
      createdAt: now,
    })
    
    // Update reviewee's average rating
    const reviewee = await ctx.db.get(args.revieweeId)
    if (reviewee) {
      const allReviews = await ctx.db
        .query("rentalReviews")
        .withIndex("by_reviewee")
        .filter((q) => q.eq(q.field("revieweeId"), args.revieweeId))
        .collect()
      
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0)
      const averageRating = totalRating / allReviews.length
      
      await ctx.db.patch(args.revieweeId, {
        averageRating: averageRating,
        totalRatings: allReviews.length,
        updatedAt: now,
      })
    }
    
    // Send notification to reviewee
    await ctx.db.insert("notifications", {
      userId: args.revieweeId,
      title: "New Review",
      message: `You received a ${args.rating}-star review.`,
      type: "system",
      rentalRequestId: args.rentalRequestId,
      isRead: false,
      createdAt: now,
    })
    
    return review
  },
})