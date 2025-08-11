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
    // Get platform settings for dynamic fee percentage
    const settings = await ctx.db
      .query("platformSettings")
      .order("desc")
      .first()
    
    // Use platform fee from settings or default to 8%
    const platformFeePercentage = settings?.platformFeePercentage || 8
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
    
    // Fetch renter names and calculate next collection dates for rented shelves
    const shelvesWithDetails = await Promise.all(
      shelves.map(async (shelf) => {
        let renterName = null
        let nextCollectionDate = null
        
        if (shelf.renterId) {
          const renter = await ctx.db.get(shelf.renterId)
          renterName = renter?.fullName || renter?.brandName || renter?.storeName || null
        }
        
        // Calculate next collection date for rented shelves
        if (shelf.status === "rented" && shelf.rentalEndDate) {
          // Collection happens at the end of the rental period
          nextCollectionDate = shelf.rentalEndDate
        }
        
        return {
          ...shelf,
          renterName,
          nextCollectionDate
        }
      })
    )
    
    return shelvesWithDetails
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
    city: v.optional(v.string()),
    branch: v.optional(v.string()),
    monthlyPrice: v.optional(v.number()),
    discountPercentage: v.optional(v.number()),
    availableFrom: v.optional(v.string()),
    isAvailable: v.optional(v.boolean()),
    length: v.optional(v.string()),
    width: v.optional(v.string()),
    depth: v.optional(v.string()),
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
        // Get platform settings for dynamic fee percentage
        const settings = await ctx.db
          .query("platformSettings")
          .order("desc")
          .first()
        
        const monthlyPrice = updateData.monthlyPrice ?? shelf.monthlyPrice
        const platformFeePercentage = settings?.platformFeePercentage || 8
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

// Get shelf statistics with percentage changes based on period
export const getShelfStatsWithChanges = query({
  args: {
    ownerId: v.id("users"),
    period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("yearly")),
  },
  handler: async (ctx, args) => {
    const now = new Date()
    let compareDate = new Date()
    
    // Calculate comparison date based on period
    switch (args.period) {
      case "daily":
        compareDate.setDate(compareDate.getDate() - 1)
        break
      case "weekly":
        compareDate.setDate(compareDate.getDate() - 7)
        break
      case "monthly":
        compareDate.setMonth(compareDate.getMonth() - 1)
        break
      case "yearly":
        compareDate.setFullYear(compareDate.getFullYear() - 1)
        break
    }
    
    // Get current shelves
    const allShelves = await ctx.db
      .query("shelves")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect()
    
    // Current stats
    const currentRented = allShelves.filter(s => s.status === "rented").length
    const currentAvailable = allShelves.filter(s => s.status === "approved" && s.isAvailable).length
    const currentRevenue = allShelves
      .filter(s => s.status === "rented")
      .reduce((sum, s) => sum + (s.rentalPrice || s.monthlyPrice || 0), 0)
    
    // Get rental requests to analyze trends
    const rentalRequests = await ctx.db
      .query("rentalRequests")
      .withIndex("by_store_owner", (q) => q.eq("storeOwnerId", args.ownerId))
      .collect()
    
    // Filter requests within comparison period
    const recentRequests = rentalRequests.filter(r => 
      new Date(r.createdAt) > compareDate
    )
    
    // Calculate trends based on actual data
    const acceptedRecent = recentRequests.filter(r => r.status === "active").length
    const totalRequests = rentalRequests.length
    const previousPeriodRequests = rentalRequests.filter(r => {
      const createdDate = new Date(r.createdAt)
      return createdDate <= compareDate
    })
    
    // Calculate real percentage changes based on activity
    let rentedChange = 0
    let availableChange = 0
    let revenueChange = 0
    
    // Analyze previous period data
    const oldRequests = previousPeriodRequests.filter(r => r.status === "active").length
    const newRequests = acceptedRecent
    
    // For rented shelves change
    // Track shelves that were rented in the previous period
    const shelvesRentedRecently = allShelves.filter(s => 
      s.status === "rented" && 
      s.rentalStartDate && 
      new Date(s.rentalStartDate) > compareDate
    ).length
    
    const previousRented = Math.max(0, currentRented - shelvesRentedRecently)
    
    if (previousRented > 0) {
      rentedChange = ((currentRented - previousRented) / previousRented) * 100
    } else if (currentRented > 0) {
      rentedChange = 100 // 100% increase if starting from 0
    } else {
      rentedChange = 0 // No change if both are 0
    }
    
    // For available shelves change
    // We need to track how many shelves were available in the previous period
    const shelvesCreatedRecently = allShelves.filter(s => 
      new Date(s.createdAt) > compareDate
    ).length
    
    const previousAvailable = Math.max(0, currentAvailable - shelvesCreatedRecently + acceptedRecent)
    
    if (previousAvailable > 0) {
      // Calculate actual percentage change
      availableChange = ((currentAvailable - previousAvailable) / previousAvailable) * 100
    } else if (currentAvailable > 0) {
      // If we had 0 available shelves before and now have some, it's a 100% increase
      availableChange = 100
    } else {
      // No change if both are 0
      availableChange = 0
    }
    
    // For revenue change
    // Calculate revenue from shelves that started renting in the previous period
    const shelvesWithRecentRevenue = allShelves.filter(s => 
      s.status === "rented" && 
      s.rentalStartDate && 
      new Date(s.rentalStartDate) > compareDate
    )
    
    const recentRevenue = shelvesWithRecentRevenue.reduce((sum, s) => 
      sum + (s.rentalPrice || s.monthlyPrice || 0), 0
    )
    
    const previousRevenue = Math.max(0, currentRevenue - recentRevenue)
    
    if (previousRevenue > 0) {
      revenueChange = ((currentRevenue - previousRevenue) / previousRevenue) * 100
    } else if (currentRevenue > 0) {
      revenueChange = 100 // 100% increase if starting from 0 revenue
    } else {
      revenueChange = 0 // No change if both are 0
    }
    
    // Round to 1 decimal place
    rentedChange = Math.round(rentedChange * 10) / 10
    availableChange = Math.round(availableChange * 10) / 10  
    revenueChange = Math.round(revenueChange * 10) / 10
    
    return {
      totalShelves: allShelves.length,
      rentedShelves: currentRented,
      availableShelves: currentAvailable,
      pendingShelves: allShelves.filter(s => s.status === "pending").length,
      totalRevenue: currentRevenue,
      // Percentage changes
      rentedChange,
      availableChange,
      revenueChange,
    }
  },
})