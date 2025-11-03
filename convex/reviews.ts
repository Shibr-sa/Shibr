import { v } from "convex/values"
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server"
import { api } from "./_generated/api"
import { Id } from "./_generated/dataModel"

/**
 * Submit a review for a completed rental
 * Store owners can rate brands, and brand owners can rate stores
 */
export const submitReview = mutation({
  args: {
    rentalRequestId: v.id("rentalRequests"),
    rating: v.number(), // 1-5 stars
  },
  handler: async (ctx, args): Promise<{ success: boolean; reviewId: Id<"reviews"> }> => {
    // Get current user
    const user: any = await ctx.runQuery(api.users.getCurrentUser)
    if (!user) {
      throw new Error("Unauthorized")
    }

    // Get rental request
    const rental = await ctx.db.get(args.rentalRequestId)
    if (!rental) {
      throw new Error("Rental request not found")
    }

    // Validate rental is completed
    if (rental.status !== "completed") {
      throw new Error("Can only review completed rentals")
    }

    // Validate rating is in valid range
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5")
    }

    // Get user's profile to determine reviewer type
    const storeProfile = await ctx.db
      .query("storeProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first()

    const brandProfile = await ctx.db
      .query("brandProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first()

    let reviewerType: "store_owner" | "brand_owner"
    let revieweeId: Id<"users">

    if (storeProfile && rental.storeProfileId === storeProfile._id) {
      // Store owner is reviewing the brand
      reviewerType = "store_owner"

      // Get brand's userId
      const brandProfile = await ctx.db.get(rental.brandProfileId)
      if (!brandProfile) {
        throw new Error("Brand profile not found")
      }
      revieweeId = brandProfile.userId
    } else if (brandProfile && rental.brandProfileId === brandProfile._id) {
      // Brand owner is reviewing the store
      reviewerType = "brand_owner"

      // Get store's userId
      const storeProfile = await ctx.db.get(rental.storeProfileId)
      if (!storeProfile) {
        throw new Error("Store profile not found")
      }
      revieweeId = storeProfile.userId
    } else {
      throw new Error("You are not authorized to review this rental")
    }

    // Check if user has already reviewed this rental
    const existingReview = await ctx.db
      .query("reviews")
      .withIndex("by_rental_and_reviewer", (q) =>
        q.eq("rentalRequestId", args.rentalRequestId).eq("reviewerId", user._id)
      )
      .first()

    if (existingReview) {
      throw new Error("You have already reviewed this rental")
    }

    // Create the review
    const reviewId: Id<"reviews"> = await ctx.db.insert("reviews", {
      rentalRequestId: args.rentalRequestId,
      reviewerId: user._id,
      reviewerType,
      revieweeId,
      rating: args.rating,
      createdAt: Date.now(),
    })

    // Update reviewee's profile rating statistics
    await updateProfileRating(ctx, revieweeId, reviewerType === "store_owner" ? "brand" : "store")

    return { success: true, reviewId }
  },
})

/**
 * Check if a user has already reviewed a rental
 */
export const hasUserReviewedRental = query({
  args: {
    rentalRequestId: v.id("rentalRequests"),
  },
  handler: async (ctx, args): Promise<boolean> => {
    const user: any = await ctx.runQuery(api.users.getCurrentUser)
    if (!user) {
      return false
    }

    const review: any = await ctx.db
      .query("reviews")
      .withIndex("by_rental_and_reviewer", (q: any) =>
        q.eq("rentalRequestId", args.rentalRequestId).eq("reviewerId", user._id)
      )
      .first()

    return review !== null
  },
})

/**
 * Get a review for a specific rental by the current user
 */
export const getReviewForRental = query({
  args: {
    rentalRequestId: v.id("rentalRequests"),
  },
  handler: async (ctx, args): Promise<any> => {
    const user: any = await ctx.runQuery(api.users.getCurrentUser)
    if (!user) {
      return null
    }

    const review: any = await ctx.db
      .query("reviews")
      .withIndex("by_rental_and_reviewer", (q: any) =>
        q.eq("rentalRequestId", args.rentalRequestId).eq("reviewerId", user._id)
      )
      .first()

    return review
  },
})

/**
 * Helper function to recalculate and update profile rating
 */
async function updateProfileRating(
  ctx: MutationCtx,
  userId: Id<"users">,
  profileType: "brand" | "store"
) {
  // Get all reviews for this user
  const reviews = await ctx.db
    .query("reviews")
    .withIndex("by_reviewee", (q) => q.eq("revieweeId", userId))
    .collect()

  if (reviews.length === 0) {
    return
  }

  // Calculate rating statistics
  const totalRatings = reviews.length
  const ratingSum = reviews.reduce((sum, review) => sum + review.rating, 0)
  const averageRating = ratingSum / totalRatings

  // Get the profile
  let profile
  if (profileType === "brand") {
    profile = await ctx.db
      .query("brandProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()
  } else {
    profile = await ctx.db
      .query("storeProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first()
  }

  if (!profile) {
    return
  }

  // Update the profile with new rating statistics
  await ctx.db.patch(profile._id, {
    averageRating,
    totalRatings,
    ratingSum,
    // Also update legacy 'rating' field for brand profiles for backwards compatibility
    ...(profileType === "brand" ? { rating: averageRating } : {}),
  })
}
