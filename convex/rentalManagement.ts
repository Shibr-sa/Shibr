import { v } from "convex/values"
import { internalMutation, internalQuery, mutation, query } from "./_generated/server"
import { Doc, Id } from "./_generated/dataModel"
import { getUserProfile } from "./profileHelpers"
import { api } from "./_generated/api"

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
          status: "completed"
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
        
        // Add system message to conversation if conversation exists
        const storeProfile = rental.storeProfileId ? await ctx.db.get(rental.storeProfileId) : null
        if (rental.conversationId && storeProfile) {
          await ctx.db.insert("messages", {
            conversationId: rental.conversationId,
            senderType: "store" as const,
            senderId: storeProfile._id as any, // System message from store owner perspective
            text: "The rental period has been completed successfully. Thank you for using our platform!",
            messageType: "text",
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
      // Check if request is older than 48 hours
      const expiryTime = request._creationTime + (48 * 60 * 60 * 1000)
      if (expiryTime <= now) {
        await ctx.db.patch(request._id, {
          status: "expired",
        })
        
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
    
    // No rental reminders needed
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
    
    // Calculate total commission (store + platform)
    const platformFee = 8 // 8% platform fee
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
      storeCommission: totalCommission, // Store + Shibr platform commission
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