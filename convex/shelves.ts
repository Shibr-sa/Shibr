import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

// Add a new shelf
export const addShelf = mutation({
  args: {
    userId: v.id("users"),
    shelfName: v.string(),
    city: v.string(),
    branch: v.string(),
    monthlyPrice: v.number(),
    discountPercentage: v.number(),
    availableFrom: v.string(),
    length: v.string(),
    width: v.string(),
    depth: v.string(),
    productType: v.optional(v.string()),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    exteriorImage: v.optional(v.string()),
    interiorImage: v.optional(v.string()),
    shelfImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Calculate final price with platform fee (8% increase)
    const platformFeePercentage = 8
    const finalPrice = args.monthlyPrice * (1 + platformFeePercentage / 100)
    
    // Create the shelf with approved status (active listing)
    const shelfId = await ctx.db.insert("shelves", {
      ownerId: args.userId,
      shelfName: args.shelfName,
      city: args.city,
      branch: args.branch,
      monthlyPrice: args.monthlyPrice,
      discountPercentage: args.discountPercentage,
      finalPrice: finalPrice,
      availableFrom: args.availableFrom,
      isAvailable: true,
      length: args.length,
      width: args.width,
      depth: args.depth,
      productType: args.productType,
      description: args.description,
      address: args.address,
      latitude: args.latitude,
      longitude: args.longitude,
      exteriorImage: args.exteriorImage,
      interiorImage: args.interiorImage,
      shelfImage: args.shelfImage,
      status: "approved", // Directly approved and active
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    
    return shelfId
  },
})

// Get shelves for a specific owner
export const getOwnerShelves = query({
  args: { ownerId: v.id("users") },
  handler: async (ctx, args) => {
    const shelves = await ctx.db
      .query("shelves")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .order("desc")
      .collect()
    
    return shelves
  },
})

// Get all available shelves (for marketplace)
export const getAvailableShelves = query({
  args: {
    city: v.optional(v.string()),
    maxPrice: v.optional(v.number()),
    minPrice: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("shelves")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
    
    const shelves = await query.collect()
    
    // Filter by additional criteria
    return shelves.filter((shelf) => {
      if (!shelf.isAvailable) return false
      if (args.city && shelf.city !== args.city) return false
      if (args.maxPrice && shelf.finalPrice && shelf.finalPrice > args.maxPrice) return false
      if (args.minPrice && shelf.finalPrice && shelf.finalPrice < args.minPrice) return false
      return true
    })
  },
})

// Update shelf details
export const updateShelf = mutation({
  args: {
    shelfId: v.id("shelves"),
    shelfName: v.optional(v.string()),
    monthlyPrice: v.optional(v.number()),
    discountPercentage: v.optional(v.number()),
    availableFrom: v.optional(v.string()),
    isAvailable: v.optional(v.boolean()),
    productType: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { shelfId, ...updateData } = args
    
    // Create a properly typed update object
    const patchData: any = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    }
    
    // If price or discount is updated, recalculate final price
    if (updateData.monthlyPrice !== undefined || updateData.discountPercentage !== undefined) {
      const shelf = await ctx.db.get(shelfId)
      if (shelf) {
        const monthlyPrice = updateData.monthlyPrice ?? shelf.monthlyPrice
        const platformFeePercentage = 8
        patchData.finalPrice = monthlyPrice * (1 + platformFeePercentage / 100)
      }
    }
    
    await ctx.db.patch(shelfId, patchData)
    
    return { success: true }
  },
})

// Delete shelf (soft delete by archiving)
export const archiveShelf = mutation({
  args: {
    shelfId: v.id("shelves"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.shelfId, {
      status: "archived",
      isAvailable: false,
      updatedAt: new Date().toISOString(),
    })
    
    return { success: true }
  },
})

// Get single shelf details by ID
export const getShelfById = query({
  args: {
    shelfId: v.id("shelves"),
  },
  handler: async (ctx, args) => {
    const shelf = await ctx.db.get(args.shelfId)
    
    if (!shelf) {
      return null
    }
    
    // Get owner details
    const owner = await ctx.db.get(shelf.ownerId)
    
    // Get renter details if shelf is rented
    let renter = null
    if (shelf.renterId) {
      renter = await ctx.db.get(shelf.renterId)
    }
    
    // Get shelf images URLs from storage
    let exteriorImageUrl = null
    let interiorImageUrl = null
    let shelfImageUrl = null
    
    if (shelf.exteriorImage) {
      exteriorImageUrl = await ctx.storage.getUrl(shelf.exteriorImage)
    }
    if (shelf.interiorImage) {
      interiorImageUrl = await ctx.storage.getUrl(shelf.interiorImage)
    }
    if (shelf.shelfImage) {
      shelfImageUrl = await ctx.storage.getUrl(shelf.shelfImage)
    }
    
    // Format product types - if it's a string, convert to array
    const productTypes = shelf.productType 
      ? (typeof shelf.productType === 'string' ? [shelf.productType] : shelf.productType)
      : []
    
    return {
      ...shelf,
      ownerName: owner?.ownerName || owner?.fullName || "Unknown",
      ownerEmail: owner?.email,
      renterName: renter?.ownerName || renter?.fullName || null,
      renterEmail: renter?.email || null,
      renterRating: null, // Rating field not yet implemented in users table
      exteriorImageUrl,
      interiorImageUrl,
      shelfImageUrl,
      productTypes,
      images: [
        exteriorImageUrl,
        interiorImageUrl,
        shelfImageUrl
      ].filter(Boolean), // Filter out null values
    }
  },
})

// Get shelf statistics for owner dashboard
export const getShelfStats = query({
  args: { ownerId: v.id("users") },
  handler: async (ctx, args) => {
    const shelves = await ctx.db
      .query("shelves")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect()
    
    const totalShelves = shelves.length
    const rentedShelves = shelves.filter(s => s.status === "rented").length
    const availableShelves = shelves.filter(s => s.status === "approved" && s.isAvailable).length
    const pendingShelves = shelves.filter(s => s.status === "pending").length
    
    // Calculate total revenue from rented shelves
    const totalRevenue = shelves
      .filter(s => s.status === "rented" && s.rentalPrice)
      .reduce((sum, shelf) => sum + (shelf.rentalPrice || 0), 0)
    
    return {
      totalShelves,
      rentedShelves,
      availableShelves,
      pendingShelves,
      totalRevenue,
    }
  },
})