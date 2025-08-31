import { v } from "convex/values"
import { internalMutation, internalQuery, mutation, query } from "./_generated/server"
import { Doc, Id } from "./_generated/dataModel"
import { getUserProfile } from "./profileHelpers"

// Internal function to check and update rental statuses
export const checkRentalStatuses = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    
    // Get all active rentals
    const activeRentals = await ctx.db
      .query("rentalRequests")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect()
    
    for (const rental of activeRentals) {
      // Check if rental period has ended
      if (rental.endDate <= now) {
        // Mark rental as completed
        await ctx.db.patch(rental._id, {
          status: "completed",
          completedAt: now
        })
        
        // Release the shelf
        await ctx.db.patch(rental.shelfId, {
          isAvailable: true,
          status: "active" as const,
        })
        
        // Update conversation status if conversation exists
        if (rental.conversationId) {
          await ctx.db.patch(rental.conversationId, {
            status: "archived",
          })
        }
        
        // Send completion notifications
        const brandProfile = rental.brandProfileId ? await ctx.db.get(rental.brandProfileId) : null
        const brandUserId = brandProfile?.userId
        if (brandUserId) {
          await ctx.db.insert("notifications", {
            userId: brandUserId,
            profileId: brandProfile?._id as any,
            profileType: "brand" as const,
            title: "Rental Completed",
            message: `Your rental period has ended. Please rate your experience.`,
            type: "rental_completed",
            rentalRequestId: rental._id,
            conversationId: rental.conversationId,
            isRead: false,
          })
        }
        
        const storeProfile = rental.storeProfileId ? await ctx.db.get(rental.storeProfileId) : null
        const storeUserId = storeProfile?.userId
        if (storeUserId) {
          await ctx.db.insert("notifications", {
            userId: storeUserId,
            profileId: storeProfile?._id as any,
            profileType: "store" as const,
            title: "Rental Completed",
            message: `The rental period has ended. The shelf is now available. Please rate your experience.`,
            type: "rental_completed",
            rentalRequestId: rental._id,
            conversationId: rental.conversationId,
            isRead: false,
          })
        }
        
        // Add system message to conversation if conversation exists
        if (rental.conversationId && storeProfile) {
          await ctx.db.insert("messages", {
            conversationId: rental.conversationId,
            senderType: "store" as const,
            senderId: storeProfile._id as any, // System message from store owner perspective
            text: "The rental period has been completed successfully. Thank you for using our platform!",
            messageType: "system",
            isRead: false,
          })
        }
      }
    }
    
    // Check for expired pending requests (48 hours)
    const pendingRequests = await ctx.db
      .query("rentalRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect()
    
    for (const request of pendingRequests) {
      if (request.expiresAt && request.expiresAt <= now) {
        await ctx.db.patch(request._id, {
          status: "expired",
        })
        
        // Send expiration notification
        const brandProfile = request.brandProfileId ? await ctx.db.get(request.brandProfileId) : null
        const brandUserId = brandProfile?.userId
        if (brandUserId) {
          await ctx.db.insert("notifications", {
            userId: brandUserId,
            profileId: brandProfile?._id as any,
            profileType: "brand" as const,
            title: "Rental Request Expired",
            message: "Your rental request has expired after 48 hours without response.",
            type: "rental_expired",
            rentalRequestId: request._id,
            conversationId: request.conversationId,
            isRead: false,
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
    
    // Get rentals ending in 7 days
    const expiringRentals = await ctx.db
      .query("rentalRequests")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect()
    
    for (const rental of expiringRentals) {
      // Check if rental ends within 7 days
      if (rental.endDate > now && rental.endDate <= sevenDaysFromNow) {
        // Calculate days remaining
        const daysRemaining = Math.ceil((rental.endDate - now) / (1000 * 60 * 60 * 24))
        
        // Check if we haven't already sent a reminder for this day
        const brandProfile = rental.brandProfileId ? await ctx.db.get(rental.brandProfileId) : null
        const brandUserId = brandProfile?.userId
        
        if (brandUserId) {
          const existingReminder = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", brandUserId))
            .filter((q) => 
              q.and(
                q.eq(q.field("rentalRequestId"), rental._id),
                q.eq(q.field("type"), "system")
              )
            )
            .first()
          
          if (!existingReminder || !existingReminder.message.includes(`${daysRemaining} day`)) {
            // Send reminder to brand owner
            await ctx.db.insert("notifications", {
              userId: brandUserId,
              profileId: brandProfile?._id as any,
              profileType: "brand" as const,
              title: "Rental Ending Soon",
              message: `Your rental will end in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}. Consider renewing if you'd like to continue.`,
              type: "system",
              rentalRequestId: rental._id,
              conversationId: rental.conversationId,
              actionUrl: `/brand-dashboard/shelves`,
              actionLabel: "View Rental",
              isRead: false,
            })
          }
          
          // Send reminder to store owner
          const storeProfile = rental.storeProfileId ? await ctx.db.get(rental.storeProfileId) : null
          const storeUserId = storeProfile?.userId
          if (storeUserId) {
            await ctx.db.insert("notifications", {
              userId: storeUserId,
              profileId: storeProfile?._id as any,
              profileType: "store" as const,
              title: "Rental Ending Soon",
              message: `A rental on your shelf will end in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}.`,
              type: "system",
              rentalRequestId: rental._id,
              conversationId: rental.conversationId,
              actionUrl: `/store-dashboard/orders`,
              actionLabel: "View Order",
              isRead: false,
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
    
    // Create a new rental request for renewal
    const renewalRequest = await ctx.db.insert("rentalRequests", {
      shelfId: rental.shelfId,
      brandProfileId: rental.brandProfileId,
      storeProfileId: rental.storeProfileId,
      startDate: rental.endDate, // Start from current end date
      endDate: new Date(args.newEndDate).getTime(),
      productType: rental.productType,
      productDescription: rental.productDescription,
      productCount: rental.productCount,
      additionalNotes: `Renewal of rental #${rental._id}`,
      selectedProductIds: rental.selectedProductIds,
      selectedProductQuantities: rental.selectedProductQuantities,
      monthlyPrice: rental.monthlyPrice,
      totalAmount: newTotalPrice,
      status: "pending",
      expiresAt: now + 48 * 60 * 60 * 1000,
      conversationId: rental.conversationId,
    })
    
    // Send notification to store owner
    const storeProfile = rental.storeProfileId ? await ctx.db.get(rental.storeProfileId) : null
    const storeUserId = storeProfile?.userId
    if (storeUserId) {
      await ctx.db.insert("notifications", {
        userId: storeUserId,
        profileId: storeProfile?._id as any,
        profileType: "store" as const,
        title: "Renewal Request",
        message: `The brand owner wants to renew their rental for ${args.additionalMonths} more month${args.additionalMonths > 1 ? 's' : ''}.`,
        type: "rental_request",
        rentalRequestId: renewalRequest,
        conversationId: rental.conversationId,
        actionUrl: `/store-dashboard/orders/${renewalRequest}`,
        actionLabel: "Review Request",
        isRead: false,
      })
    }
    
    // Add message to conversation if it exists
    if (rental.conversationId && profileData) {
      await ctx.db.insert("messages", {
        conversationId: rental.conversationId,
        senderType: "brand" as const,
        senderId: profileData.profile._id as any,
        text: `I would like to renew the rental for ${args.additionalMonths} more month${args.additionalMonths > 1 ? 's' : ''}.`,
        messageType: "rental_request",
        isRead: false,
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