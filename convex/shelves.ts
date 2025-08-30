import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"

// Add a new shelf
export const addShelf = mutation({
  args: {
    shelfName: v.string(),
    city: v.string(),
    branch: v.string(),
    monthlyPrice: v.number(),
    storeCommission: v.number(),
    availableFrom: v.string(),
    length: v.string(),
    width: v.string(),
    depth: v.string(),
    productType: v.optional(v.string()), // Deprecated
    productTypes: v.optional(v.array(v.string())), // New: array of categories
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    exteriorImage: v.optional(v.string()),
    interiorImage: v.optional(v.string()),
    shelfImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    // Get user's profile
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (!userProfile) {
      throw new Error("User profile not found");
    }
    
    // Get platform settings for dynamic fee percentage
    const allSettings = await ctx.db
      .query("platformSettings")
      .collect()
    
    // Find platform fee setting or default to 8%
    let platformFeePercentage = 8
    const feeSettings = allSettings.find(s => s.key === "platformFeePercentage")
    if (feeSettings) {
      platformFeePercentage = feeSettings.value
    }
    const finalPrice = args.monthlyPrice * (1 + platformFeePercentage / 100)
    
    // Create the shelf with approved status (active listing)
    const shelfId = await ctx.db.insert("shelves", {
      profileId: userProfile._id,
      shelfName: args.shelfName,
      city: args.city,
      area: args.city, // Use city as area if area not provided separately
      branch: args.branch,
      address: args.address,
      coordinates: args.latitude && args.longitude ? {
        lat: args.latitude,
        lng: args.longitude
      } : undefined,
      shelfSize: {
        width: parseFloat(args.width),
        height: parseFloat(args.length), // Using length as height
        depth: parseFloat(args.depth),
        unit: "cm"
      },
      productType: args.productType, // Keep for backward compatibility
      productTypes: args.productTypes || (args.productType ? [args.productType] : []),
      description: args.description,
      monthlyPrice: args.monthlyPrice,
      storeCommission: args.storeCommission,
      currency: "SAR",
      minimumRentalPeriod: 1,
      isAvailable: true,
      availableFrom: args.availableFrom,
      // Image handling - store the storage IDs if provided
      exteriorImage: args.exteriorImage ? args.exteriorImage as Id<"_storage"> : undefined,
      interiorImage: args.interiorImage ? args.interiorImage as Id<"_storage"> : undefined,
      shelfImage: args.shelfImage ? args.shelfImage as Id<"_storage"> : undefined,
      status: "approved", // Directly approved and active
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      totalRentals: 0,
    })
    
    return shelfId
  },
})

// Get shelves for a specific owner
export const getOwnerShelves = query({
  args: { ownerId: v.id("users") },
  handler: async (ctx, args) => {
    // Get the user's profile first
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.ownerId))
      .first()
    
    if (!userProfile) {
      return []
    }
    
    const shelves = await ctx.db
      .query("shelves")
      .withIndex("by_profile", (q) => q.eq("profileId", userProfile._id))
      .order("desc")
      .collect()
    
    // Helper function to get URL from storage ID or return existing URL
    const getImageUrl = async (imageId: any) => {
      if (!imageId) return null
      // Check if it's already a URL (legacy data)
      if (typeof imageId === 'string' && (imageId.startsWith('http://') || imageId.startsWith('https://'))) {
        return imageId
      }
      // Otherwise, get URL from storage
      try {
        return await ctx.storage.getUrl(imageId)
      } catch (error) {
        console.error('Failed to get storage URL:', error)
        return null
      }
    }
    
    // Fetch renter names and calculate next collection dates for rented shelves
    const shelvesWithDetails = await Promise.all(
      shelves.map(async (shelf) => {
        let renterName = null
        let nextCollectionDate = null
        
        // Check if there's an active rental for this shelf
        const activeRental = await ctx.db
          .query("rentalRequests")
          .withIndex("by_shelf", (q) => q.eq("shelfId", shelf._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .first()
        
        if (activeRental) {
          const renter = await ctx.db.get(activeRental.requesterId)
          const renterProfile = renter ? await ctx.db
            .query("userProfiles")
            .withIndex("by_user", (q) => q.eq("userId", activeRental.requesterId))
            .first() : null
          renterName = renterProfile?.brandName || null // Simplified - fullName removed
        }
        
        // Calculate next collection date for rented shelves
        // Note: "rented" is not a valid status in the schema, so we check for active rentals
        if (activeRental && activeRental.endDate) {
          // Collection happens at the end of the rental period
          nextCollectionDate = activeRental.endDate
        }
        
        // Convert image storage IDs to URLs
        const exteriorImage = await getImageUrl(shelf.exteriorImage)
        const interiorImage = await getImageUrl(shelf.interiorImage)
        const shelfImage = await getImageUrl(shelf.shelfImage)
        
        return {
          ...shelf,
          exteriorImage,
          interiorImage,
          shelfImage,
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
    
    // Helper function to get URL from storage ID or return existing URL
    const getImageUrl = async (imageId: any) => {
      if (!imageId) return null
      // Check if it's already a URL (legacy data)
      if (typeof imageId === 'string' && (imageId.startsWith('http://') || imageId.startsWith('https://'))) {
        return imageId
      }
      // Otherwise, get URL from storage
      try {
        return await ctx.storage.getUrl(imageId)
      } catch (error) {
        console.error('Failed to get storage URL:', error)
        return null
      }
    }
    
    // Filter by additional criteria and convert images
    const filteredShelves = shelves.filter((shelf) => {
      if (!shelf.isAvailable) return false
      if (args.city && shelf.city !== args.city) return false
      if (args.maxPrice && shelf.monthlyPrice && shelf.monthlyPrice > args.maxPrice) return false
      if (args.minPrice && shelf.monthlyPrice && shelf.monthlyPrice < args.minPrice) return false
      return true
    })
    
    // Convert image storage IDs to URLs for filtered shelves
    return Promise.all(
      filteredShelves.map(async (shelf) => {
        const exteriorImage = await getImageUrl(shelf.exteriorImage)
        const interiorImage = await getImageUrl(shelf.interiorImage)
        const shelfImage = await getImageUrl(shelf.shelfImage)
        
        return {
          ...shelf,
          exteriorImage,
          interiorImage,
          shelfImage,
        }
      })
    )
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
    storeCommission: v.optional(v.number()),
    availableFrom: v.optional(v.string()),
    isAvailable: v.optional(v.boolean()),
    length: v.optional(v.string()),
    width: v.optional(v.string()),
    depth: v.optional(v.string()),
    productType: v.optional(v.string()),
    productTypes: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    exteriorImage: v.optional(v.string()),
    interiorImage: v.optional(v.string()),
    shelfImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { shelfId, length, width, depth, latitude, longitude, ...otherData } = args
    
    // Create a properly typed update object
    const patchData: any = {
      updatedAt: new Date().toISOString(),
    }
    
    // Add other fields that are in the schema
    if (otherData.shelfName !== undefined) patchData.shelfName = otherData.shelfName
    if (otherData.city !== undefined) {
      patchData.city = otherData.city
      patchData.area = otherData.city // Update area when city changes
    }
    if (otherData.branch !== undefined) patchData.branch = otherData.branch
    if (otherData.monthlyPrice !== undefined) patchData.monthlyPrice = otherData.monthlyPrice
    if (otherData.storeCommission !== undefined) patchData.storeCommission = otherData.storeCommission
    if (otherData.availableFrom !== undefined) patchData.availableFrom = otherData.availableFrom
    if (otherData.isAvailable !== undefined) patchData.isAvailable = otherData.isAvailable
    if (otherData.productType !== undefined) patchData.productType = otherData.productType
    if (otherData.productTypes !== undefined) patchData.productTypes = otherData.productTypes
    if (otherData.description !== undefined) patchData.description = otherData.description
    if (otherData.address !== undefined) patchData.address = otherData.address
    
    // Handle shelf size (convert string dimensions to shelfSize object)
    if (length !== undefined || width !== undefined || depth !== undefined) {
      const shelf = await ctx.db.get(shelfId)
      if (shelf) {
        patchData.shelfSize = {
          width: width ? parseFloat(width) : shelf.shelfSize.width,
          height: length ? parseFloat(length) : shelf.shelfSize.height,
          depth: depth ? parseFloat(depth) : shelf.shelfSize.depth,
          unit: shelf.shelfSize.unit || "cm",
        }
      }
    }
    
    // Handle coordinates
    if (latitude !== undefined && longitude !== undefined) {
      patchData.coordinates = {
        lat: latitude,
        lng: longitude,
      }
    }
    
    // Handle image IDs (they should be storage IDs, not strings)
    if (otherData.exteriorImage !== undefined) {
      patchData.exteriorImage = otherData.exteriorImage as any
    }
    if (otherData.interiorImage !== undefined) {
      patchData.interiorImage = otherData.interiorImage as any
    }
    if (otherData.shelfImage !== undefined) {
      patchData.shelfImage = otherData.shelfImage as any
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
      status: "suspended", // Use suspended status as closest to archived
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
    
    // Get owner details from profile
    const ownerProfile = await ctx.db.get(shelf.profileId)
    const owner = ownerProfile ? await ctx.db.get(ownerProfile.userId) : null
    
    // Get renter details if shelf is rented
    let renter = null
    let renterProfile = null
    
    // Check if there's an active rental for this shelf
    const activeRental = await ctx.db
      .query("rentalRequests")
      .withIndex("by_shelf", (q) => q.eq("shelfId", shelf._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first()
    
    if (activeRental) {
      renter = await ctx.db.get(activeRental.requesterId)
      renterProfile = renter ? await ctx.db
        .query("userProfiles")
        .withIndex("by_user", (q) => q.eq("userId", activeRental.requesterId))
        .first() : null
    }
    
    // Get shelf images URLs from storage
    let exteriorImageUrl = null
    let interiorImageUrl = null
    let shelfImageUrl = null
    
    // Helper function to get URL from storage ID or return existing URL
    const getImageUrl = async (imageId: any) => {
      if (!imageId) return null
      // Check if it's already a URL (legacy data)
      if (typeof imageId === 'string' && (imageId.startsWith('http://') || imageId.startsWith('https://'))) {
        return imageId
      }
      // Otherwise, get URL from storage
      try {
        return await ctx.storage.getUrl(imageId)
      } catch (error) {
        console.error('Failed to get storage URL:', error)
        return null
      }
    }
    
    exteriorImageUrl = await getImageUrl(shelf.exteriorImage)
    interiorImageUrl = await getImageUrl(shelf.interiorImage)
    shelfImageUrl = await getImageUrl(shelf.shelfImage)
    
    // Format product types - use the new productTypes array field, fallback to old productType field
    const productTypes = shelf.productTypes && shelf.productTypes.length > 0
      ? shelf.productTypes
      : shelf.productType 
        ? (typeof shelf.productType === 'string' ? [shelf.productType] : shelf.productType)
        : []
    
    return {
      ...shelf,
      ownerName: ownerProfile?.storeName || "Unknown",
      ownerEmail: owner?.email || "",
      renterName: renterProfile?.brandName || null,
      renterEmail: renter?.email || "",
      renterRating: null, // Rating field not yet implemented in users table
      // Return both the URL fields and the expected field names for compatibility
      exteriorImageUrl,
      interiorImageUrl,
      shelfImageUrl,
      exteriorImage: exteriorImageUrl,
      interiorImage: interiorImageUrl,
      shelfImage: shelfImageUrl,
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
    // Get the user's profile first
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.ownerId))
      .first()
    
    if (!userProfile) {
      return {
        totalShelves: 0,
        rentedShelves: 0,
        availableShelves: 0,
        pendingShelves: 0,
        totalRevenue: 0,
      }
    }
    
    const shelves = await ctx.db
      .query("shelves")
      .withIndex("by_profile", (q) => q.eq("profileId", userProfile._id))
      .collect()
    
    // Get active rentals to count rented shelves properly
    const activeRentals = await ctx.db
      .query("rentalRequests")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect()
    
    const totalShelves = shelves.length
    const rentedShelves = activeRentals.length // Count by active rentals, not shelf status
    const availableShelves = shelves.filter(s => s.status === "approved" && s.isAvailable).length
    const pendingShelves = shelves.filter(s => s.status === "pending_approval").length
    
    // Calculate total revenue from active rentals
    const totalRevenue = activeRentals.reduce((sum, rental) => sum + (rental.monthlyPrice || 0), 0)
    
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
    
    // Get the user's profile first
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.ownerId))
      .first()
    
    if (!userProfile) {
      return {
        rentedChange: 0,
        availableChange: 0,
        revenueChange: 0,
        shelfViewsChange: 0,
      }
    }
    
    // Get current shelves
    const allShelves = await ctx.db
      .query("shelves")
      .withIndex("by_profile", (q) => q.eq("profileId", userProfile._id))
      .collect()
    
    // Get active rentals for current stats
    const currentActiveRentals = await ctx.db
      .query("rentalRequests")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect()
    
    // Current stats
    const currentRented = currentActiveRentals.length
    const currentAvailable = allShelves.filter(s => s.status === "approved" && s.isAvailable).length
    const currentRevenue = currentActiveRentals.reduce((sum, rental) => sum + (rental.monthlyPrice || 0), 0)
    
    // Get rental requests to analyze trends
    const rentalRequests = await ctx.db
      .query("rentalRequests")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
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
    // Track rentals that started recently
    const recentRentals = currentActiveRentals.filter(rental => 
      new Date(rental.startDate) > compareDate
    ).length
    
    const previousRented = Math.max(0, currentRented - recentRentals)
    
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
    // Calculate revenue from rentals that started recently
    const recentRevenueRentals = currentActiveRentals.filter(rental => 
      new Date(rental.startDate) > compareDate
    )
    
    const recentRevenue = recentRevenueRentals.reduce((sum, rental) => 
      sum + (rental.monthlyPrice || 0), 0
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
      pendingShelves: allShelves.filter(s => s.status === "pending_approval").length,
      totalRevenue: currentRevenue,
      // Percentage changes
      rentedChange,
      availableChange,
      revenueChange,
    }
  },
})

// Get rental requests for a shelf
export const getShelfRentalRequests = query({
  args: {
    shelfId: v.id("shelves"),
  },
  handler: async (ctx, args) => {
    // Get all rental requests for this shelf
    const rentalRequests = await ctx.db
      .query("rentalRequests")
      .withIndex("by_shelf", (q) => q.eq("shelfId", args.shelfId))
      .collect()
    
    // Get profile information for each requester
    const requestsWithProfiles = await Promise.all(
      rentalRequests.map(async (request) => {
        const requesterProfile = request.requesterProfileId
          ? await ctx.db.get(request.requesterProfileId)
          : null
        
        return {
          ...request,
          requesterProfile,
        }
      })
    )
    
    return requestsWithProfiles
  },
})

// Get products displayed on a shelf (from active rental)
export const getShelfProducts = query({
  args: {
    shelfId: v.id("shelves"),
  },
  handler: async (ctx, args) => {
    // Find active rental for this shelf
    const activeRental = await ctx.db
      .query("rentalRequests")
      .withIndex("by_shelf", (q) => q.eq("shelfId", args.shelfId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first()
    
    if (!activeRental || !activeRental.selectedProductIds) {
      return []
    }
    
    // Get the selected products
    const products = await Promise.all(
      activeRental.selectedProductIds.map(async (productId) => {
        const product = await ctx.db.get(productId)
        return product
      })
    )
    
    return products.filter(Boolean)
  },
})

// Get payment history for a shelf
export const getShelfPayments = query({
  args: {
    shelfId: v.id("shelves"),
  },
  handler: async (ctx, args) => {
    // Get all rental requests for this shelf
    const rentalRequests = await ctx.db
      .query("rentalRequests")
      .withIndex("by_shelf", (q) => q.eq("shelfId", args.shelfId))
      .collect()
    
    const rentalRequestIds = rentalRequests.map(r => r._id)
    
    // Get all payments for these rental requests
    const payments = await ctx.db
      .query("payments")
      .filter((q) => 
        rentalRequestIds.reduce(
          (acc, id) => q.or(acc, q.eq(q.field("rentalRequestId"), id)),
          q.eq(q.field("rentalRequestId"), rentalRequestIds[0])
        )
      )
      .collect()
    
    return payments
  },
})

// Delete a shelf
export const deleteShelf = mutation({
  args: { 
    shelfId: v.id("shelves") 
  },
  handler: async (ctx, args) => {
    // Get the shelf to check if it exists and is not rented
    const shelf = await ctx.db.get(args.shelfId)
    
    if (!shelf) {
      throw new Error("Shelf not found")
    }
    
    // Check if shelf is rented (isAvailable = false means it's rented)
    if (shelf.isAvailable === false) {
      throw new Error("Cannot delete a rented shelf")
    }
    
    // Also check for any active rental requests
    const activeRentals = await ctx.db
      .query("rentalRequests")
      .withIndex("by_shelf", (q) => q.eq("shelfId", args.shelfId))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "payment_pending")
        )
      )
      .collect()
    
    if (activeRentals.length > 0) {
      throw new Error("Cannot delete a shelf with active rental requests")
    }
    
    // Delete the shelf
    await ctx.db.delete(args.shelfId)
    
    return { success: true }
  },
})