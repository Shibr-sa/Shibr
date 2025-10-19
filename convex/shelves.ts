import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"
import { getUserProfile } from "./profileHelpers"
import { internal } from "./_generated/api"


// Add a new shelf
export const addShelf = mutation({
  args: {
    branchId: v.id("branches"), // Required: shelf must belong to a branch
    shelfName: v.string(),
    monthlyPrice: v.number(),
    storeCommission: v.number(),
    availableFrom: v.string(),
    length: v.string(),
    width: v.string(),
    depth: v.string(),
    productTypes: v.array(v.string()), // Array of product categories
    description: v.optional(v.string()),
    images: v.optional(v.array(v.object({
      storageId: v.id("_storage"),
      type: v.union(v.literal("shelf"), v.literal("additional")), // Only shelf and additional images
      order: v.number()
    }))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get user's profile
    const userProfile = await getUserProfile(ctx, userId);

    if (!userProfile || userProfile.type !== "store_owner") {
      throw new Error("Only store owners can add shelves");
    }

    // Get the branch to verify ownership and get location data
    const branch = await ctx.db.get(args.branchId);
    if (!branch) {
      throw new Error("Branch not found");
    }

    // Verify branch belongs to this store owner
    if (branch.storeProfileId !== userProfile.profile._id) {
      throw new Error("Branch does not belong to this store owner");
    }

    // Get platform settings for dynamic fee percentage
    const settings = await ctx.runQuery(internal.platformSettings.internalGetPlatformSettings)
    const storeRentCommission = settings.storeRentCommission
    const finalPrice = args.monthlyPrice * (1 + storeRentCommission / 100)

    // Create the shelf with approved status (active listing)
    // Location data comes from the branch table
    const shelfId = await ctx.db.insert("shelves", {
      storeProfileId: userProfile.profile._id,
      branchId: args.branchId,
      shelfName: args.shelfName,
      shelfSize: {
        width: parseFloat(args.width),
        height: parseFloat(args.length), // Using length as height
        depth: parseFloat(args.depth),
        unit: "cm"
      },
      productTypes: args.productTypes || [],
      description: args.description,
      monthlyPrice: args.monthlyPrice,
      storeCommission: args.storeCommission,
      availableFrom: new Date(args.availableFrom).getTime(),
      images: args.images || [],
      status: "active" as const,
    })

    return shelfId
  },
})

// Get shelves for a specific owner
export const getOwnerShelves = query({
  args: { ownerId: v.id("users") },
  handler: async (ctx, args) => {
    // Get the user's profile first
    const userProfile = await getUserProfile(ctx, args.ownerId)

    if (!userProfile || userProfile.type !== "store_owner") {
      return []
    }

    // Get platform settings for commission rates
    const settings = await ctx.runQuery(internal.platformSettings.internalGetPlatformSettings)
    const platformRentCommission = settings.storeRentCommission // Default 10%

    const shelves = await ctx.db
      .query("shelves")
      .withIndex("by_store_profile", (q) => q.eq("storeProfileId", userProfile.profile._id))
      .order("desc")
      .collect()

    // Fetch renter names, branch data, and calculate next collection dates for rented shelves
    const shelvesWithDetails = await Promise.all(
      shelves.map(async (shelf) => {
        let renterName = null
        let nextCollectionDate = null
        let netRevenue = 0

        // Check if there's an active rental for this shelf
        const activeRental = await ctx.db
          .query("rentalRequests")
          .withIndex("by_shelf", (q) => q.eq("shelfId", shelf._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .first()

        if (activeRental) {
          const renterProfile = activeRental.brandProfileId ? await ctx.db.get(activeRental.brandProfileId) : null
          renterName = renterProfile?.brandName

          // Calculate net revenue after Shibr commission
          const monthlyPrice = activeRental.monthlyPrice || 0
          const shibrCommission = (monthlyPrice * platformRentCommission) / 100
          netRevenue = monthlyPrice - shibrCommission
        }

        // Calculate next collection date for rented shelves
        if (activeRental && activeRental.endDate) {
          // Collection happens at the end of the rental period
          nextCollectionDate = activeRental.endDate
        }

        // Get branch data if branchId exists
        let branchData = null
        let allImages = shelf.images || []

        if (shelf.branchId) {
          const branch = shelf.branchId ? await ctx.db.get(shelf.branchId) : null
          if (branch) {
            branchData = {
              _id: branch._id,
              branchName: branch.branchName,
              city: branch.city,
              location: branch.location,
            }

            // Include branch images (exterior/interior)
            if (branch.images && branch.images.length > 0) {
              const branchImagesWithUrls = await Promise.all(
                branch.images.map(async (img) => ({
                  ...img,
                  url: await ctx.storage.getUrl(img.storageId)
                }))
              )
              allImages = [...allImages, ...branchImagesWithUrls]
            }
          }
        }

        // Convert shelf image storage IDs to URLs
        const imagesWithUrls = await Promise.all(
          allImages.map(async (img: any) => ({
            ...img,
            url: await ctx.storage.getUrl(img.storageId)
          }))
        )

        return {
          ...shelf,
          images: imagesWithUrls,
          branch: branchData,
          renterName,
          nextCollectionDate,
          netRevenue
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
      .withIndex("by_status", (q) => q.eq("status", "active"))
    
    const shelves = await query.collect()
    
    // Get all active and payment_pending rentals to check availability
    const activeRentals = await ctx.db
      .query("rentalRequests")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect()
    const paymentPendingRentals = await ctx.db
      .query("rentalRequests")
      .withIndex("by_status", (q) => q.eq("status", "payment_pending"))
      .collect()
    const allActiveRentals = [...activeRentals, ...paymentPendingRentals]

    // Filter by additional criteria and add rental info
    const filteredShelves = await Promise.all(
      shelves.map(async (shelf) => {
        // Get branch to check city filter
        const branch = shelf.branchId ? await ctx.db.get(shelf.branchId) : null
        if (!branch) return null

        if (args.city && branch.city !== args.city) return null
        if (args.maxPrice && shelf.monthlyPrice && shelf.monthlyPrice > args.maxPrice) return null
        if (args.minPrice && shelf.monthlyPrice && shelf.monthlyPrice < args.minPrice) return null

        // Find active rental for this shelf
        const currentRental = allActiveRentals.find(r => r.shelfId === shelf._id)

        return {
          ...shelf,
          city: branch.city,
          storeBranch: branch.branchName,
          location: branch.location,
          currentRental: currentRental ? {
            endDate: currentRental.endDate,
            startDate: currentRental.startDate,
            brandProfileId: currentRental.brandProfileId
          } : null
        }
      })
    )

    const validShelves = filteredShelves.filter(Boolean) as any[]
    
    // Convert image storage IDs to URLs for filtered shelves
    return Promise.all(
      validShelves.map(async (shelf) => {
        const imagesWithUrls = await Promise.all(
          (shelf.images || []).map(async (img: any) => ({
            ...img,
            url: await ctx.storage.getUrl(img.storageId)
          }))
        )
        
        return {
          ...shelf,
          images: imagesWithUrls
        }
      })
    )
  },
})

// Update shelf details
export const updateShelf = mutation({
  args: {
    shelfId: v.id("shelves"),
    branchId: v.optional(v.id("branches")),
    shelfName: v.optional(v.string()),
    monthlyPrice: v.optional(v.number()),
    storeCommission: v.optional(v.number()),
    availableFrom: v.optional(v.string()),
    length: v.optional(v.string()),
    width: v.optional(v.string()),
    depth: v.optional(v.string()),
    productTypes: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    images: v.optional(v.array(v.object({
      storageId: v.id("_storage"),
      type: v.union(v.literal("shelf"), v.literal("exterior"), v.literal("interior"), v.literal("additional")),
      order: v.number()
    }))),
  },
  handler: async (ctx, args) => {
    const { shelfId, length, width, depth, ...otherData } = args

    // Create a properly typed update object
    const patchData: any = {}

    // Add other fields that are in the schema
    if (otherData.branchId !== undefined) patchData.branchId = otherData.branchId
    if (otherData.shelfName !== undefined) patchData.shelfName = otherData.shelfName
    if (otherData.monthlyPrice !== undefined) patchData.monthlyPrice = otherData.monthlyPrice
    if (otherData.storeCommission !== undefined) patchData.storeCommission = otherData.storeCommission
    if (otherData.availableFrom !== undefined) patchData.availableFrom = new Date(otherData.availableFrom).getTime()
    if (otherData.productTypes !== undefined) patchData.productTypes = otherData.productTypes
    if (otherData.description !== undefined) patchData.description = otherData.description

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

    // Handle images array
    if (otherData.images !== undefined) {
      patchData.images = otherData.images
    }

    await ctx.db.patch(shelfId, patchData)

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
    const ownerProfile = await ctx.db.get(shelf.storeProfileId)
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
      renterProfile = activeRental.brandProfileId ? await ctx.db.get(activeRental.brandProfileId) : null
      renter = renterProfile?.userId ? await ctx.db.get(renterProfile.userId) : null
    }
    
    // Get image URLs from the images array
    const imagesWithUrls = await Promise.all(
      (shelf.images || []).map(async (img) => ({
        ...img,
        url: await ctx.storage.getUrl(img.storageId)
      }))
    )
    
    return {
      ...shelf,
      ownerName: ownerProfile?.storeName,
      ownerEmail: owner?.email,
      renterName: renterProfile?.brandName,
      renterEmail: renter?.email,
      renterRating: null,
      images: imagesWithUrls
    }
  },
})

// Get shelf statistics for owner dashboard
export const getShelfStats = query({
  args: { ownerId: v.id("users") },
  handler: async (ctx, args) => {
    // Get the user's profile first
    const userProfile = await getUserProfile(ctx, args.ownerId)
    
    if (!userProfile || userProfile.type !== "store_owner") {
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
      .withIndex("by_store_profile", (q) => q.eq("storeProfileId", userProfile.profile._id))
      .collect()
    
    // Get active rentals to count rented shelves properly
    const activeRentals = await ctx.db
      .query("rentalRequests")
      .withIndex("by_store", (q) => q.eq("storeProfileId", userProfile.profile._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect()
    
    const totalShelves = shelves.length
    const rentedShelves = activeRentals.length // Count by active rentals, not shelf status
    // Count shelves without active rentals
    const shelvesWithoutRentals = shelves.filter(shelf => {
      const hasActiveRental = activeRentals.some(r => r.shelfId === shelf._id)
      return shelf.status === "active" && !hasActiveRental
    })
    const availableShelves = shelvesWithoutRentals.length
    
    // Calculate total revenue from active rentals
    const totalRevenue = activeRentals.reduce((sum, rental) => sum + (rental.monthlyPrice || 0), 0)
    
    return {
      totalShelves,
      rentedShelves,
      availableShelves,
      pendingShelves: 0, // No pending status for shelves
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
    const userProfile = await getUserProfile(ctx, args.ownerId)
    
    if (!userProfile || userProfile.type !== "store_owner") {
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
      .withIndex("by_store_profile", (q) => q.eq("storeProfileId", userProfile.profile._id))
      .collect()
    
    // Get active rentals for current stats
    const currentActiveRentals = await ctx.db
      .query("rentalRequests")
      .withIndex("by_store", (q) => q.eq("storeProfileId", userProfile.profile._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect()

    // Get platform settings for commission rates
    const settings: { storeRentCommission: number; brandSalesCommission: number } = await ctx.runQuery(internal.platformSettings.internalGetPlatformSettings)
    const platformRentCommission: number = settings.storeRentCommission // Default 10%

    // Current stats
    const currentRented = currentActiveRentals.length
    // Count shelves without active rentals
    const shelvesWithoutRentals = allShelves.filter(shelf => {
      const hasActiveRental = currentActiveRentals.some(r => r.shelfId === shelf._id)
      return shelf.status === "active" && !hasActiveRental
    })
    const currentAvailable = shelvesWithoutRentals.length

    // Calculate rental revenue after deducting Shibr's commission
    const rentalRevenue: number = currentActiveRentals.reduce((sum: number, rental) => {
      const monthlyPrice = rental.monthlyPrice || 0
      const shibrCommission: number = (monthlyPrice * platformRentCommission) / 100
      return sum + (monthlyPrice - shibrCommission)
    }, 0)

    // Get all shelf stores for this store profile
    const allShelfStores = await ctx.db
      .query("shelfStores")
      .withIndex("by_store_profile", (q) => q.eq("storeProfileId", userProfile.profile._id))
      .collect()

    // Get all customer orders to calculate store commission revenue
    const allOrders = await ctx.db.query("customerOrders").collect()

    // Calculate store commission revenue from product sales
    let storeCommissionRevenue = 0
    for (const order of allOrders) {
      // Check if this order belongs to one of the store's shelf stores
      const shelfStore = allShelfStores.find(ss => ss._id === order.shelfStoreId)
      if (shelfStore) {
        // Get store commission rate from shelf store commissions
        const storeCommissionRate = shelfStore.commissions.find(c => c.type === "store")?.rate || 0

        // Calculate commission from all items in this order
        for (const item of order.items) {
          const itemRevenue = (item.subtotal * storeCommissionRate) / 100
          storeCommissionRevenue += itemRevenue
        }
      }
    }

    // Total revenue = rental revenue (after Shibr commission) + store commission revenue
    const currentRevenue: number = rentalRevenue + storeCommissionRevenue
    
    // Get rental requests to analyze trends
    const rentalRequests = await ctx.db
      .query("rentalRequests")
      .withIndex("by_store", (q) => q.eq("storeProfileId", userProfile.profile._id))
      .collect()
    
    // Filter requests within comparison period
    const recentRequests = rentalRequests.filter(r => 
      new Date(r._creationTime) > compareDate
    )
    
    // Calculate trends based on actual data
    const acceptedRecent = recentRequests.filter(r => r.status === "active").length
    const totalRequests = rentalRequests.length
    const previousPeriodRequests = rentalRequests.filter(r => {
      const createdDate = new Date(r._creationTime)
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
      new Date(s._creationTime) > compareDate
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
    // Calculate rental revenue from rentals that started recently (after Shibr commission)
    const recentRevenueRentals = currentActiveRentals.filter(rental =>
      new Date(rental.startDate) > compareDate
    )

    const recentRentalRevenue = recentRevenueRentals.reduce((sum, rental) => {
      const monthlyPrice = rental.monthlyPrice || 0
      const shibrCommission = (monthlyPrice * platformRentCommission) / 100
      return sum + (monthlyPrice - shibrCommission)
    }, 0)

    // Calculate previous revenue
    // Note: We're only tracking rental revenue changes, not store commission changes
    // Store commission revenue requires historical order data which we don't track by period
    const previousRentalRevenue = Math.max(0, rentalRevenue - recentRentalRevenue)
    const previousRevenue = previousRentalRevenue + storeCommissionRevenue // Assume store commission hasn't changed

    if (previousRevenue > 0) {
      revenueChange = ((currentRevenue - previousRevenue) / previousRevenue) * 100
      // Cap at 100% for better display
      if (revenueChange > 100) {
        revenueChange = 100
      }
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
        const requesterProfile = request.brandProfileId
          ? await ctx.db.get(request.brandProfileId)
          : null

        // Get commercial register document URL if available
        let commercialRegisterUrl = null
        if (requesterProfile?.commercialRegisterDocument) {
          commercialRegisterUrl = await ctx.storage.getUrl(requesterProfile.commercialRegisterDocument)
        } else if (requesterProfile?.freelanceLicenseDocument) {
          commercialRegisterUrl = await ctx.storage.getUrl(requesterProfile.freelanceLicenseDocument)
        }

        return {
          ...request,
          requesterProfile: requesterProfile ? {
            ...requesterProfile,
            commercialRegisterUrl
          } : null,
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
    
    if (!activeRental || !activeRental.selectedProducts) {
      return []
    }
    
    // Get the selected products
    const products = await Promise.all(
      activeRental.selectedProducts.map(async (selectedProduct) => {
        const product = await ctx.db.get(selectedProduct.productId)
        if (product) {
          return {
            ...product,
            requestedQuantity: selectedProduct.quantity
          }
        }
        // Return stored product info if not found in database
        return {
          _id: selectedProduct.productId,
          name: selectedProduct.name,
          category: selectedProduct.category,
          price: selectedProduct.price,
          requestedQuantity: selectedProduct.quantity
        }
      })
    )
    
    return products.filter(Boolean)
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
    
    // Check for any active rental requests
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