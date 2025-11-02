import { v } from "convex/values"
import { query } from "./_generated/server"
import { Id } from "./_generated/dataModel"
import { getImageUrlsFromArray } from "./helpers"


// Get all available stores for marketplace
export const getMarketplaceStores = query({
  args: {
    city: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    productType: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
    month: v.optional(v.string()),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get all non-suspended shelves using indexed queries (more efficient)
    // Brands can book rented shelves for dates after current rental ends
    const [activeShelves, rentedShelves] = await Promise.all([
      ctx.db.query("shelves").withIndex("by_status", (q) => q.eq("status", "active")).collect(),
      ctx.db.query("shelves").withIndex("by_status", (q) => q.eq("status", "rented")).collect(),
    ])
    let shelves = [...activeShelves, ...rentedShelves]

    // Get branches for all shelves
    const branchesMap = new Map()
    for (const shelf of shelves) {
      const branch = shelf.branchId ? await ctx.db.get(shelf.branchId) : null
      if (branch) {
        branchesMap.set(shelf._id, branch)
      }
    }

    // Get all active and payment_pending rentals to add rental info
    const [activeRequests, paymentPendingRequests] = await Promise.all([
      ctx.db
        .query("rentalRequests")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .collect(),
      ctx.db
        .query("rentalRequests")
        .withIndex("by_status", (q) => q.eq("status", "payment_pending"))
        .collect(),
    ])

    const allActiveRentals = [...activeRequests, ...paymentPendingRequests]

    // Apply filters
    if (args.city && args.city !== "all") {
      shelves = shelves.filter(shelf => {
        const branch = branchesMap.get(shelf._id)
        return branch?.city === args.city
      })
    }


    if (args.minPrice !== undefined) {
      const minPrice = args.minPrice
      shelves = shelves.filter(shelf => shelf.monthlyPrice >= minPrice)
    }

    if (args.maxPrice !== undefined) {
      const maxPrice = args.maxPrice
      shelves = shelves.filter(shelf => shelf.monthlyPrice <= maxPrice)
    }

    if (args.productType && args.productType !== "all") {
      shelves = shelves.filter(shelf => 
        shelf.productTypes && shelf.productTypes.includes(args.productType!)
      )
    }

    // Month filter - filter by availableFrom date
    if (args.month && args.month !== "all") {
      const monthMap: Record<string, number> = {
        january: 0, february: 1, march: 2, april: 3,
        may: 4, june: 5, july: 6, august: 7,
        september: 8, october: 9, november: 10, december: 11
      }
      const monthIndex = monthMap[args.month]
      if (monthIndex !== undefined) {
        shelves = shelves.filter(shelf => {
          const date = new Date(shelf.availableFrom)
          return date.getMonth() === monthIndex
        })
      }
    }

    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase()
      shelves = shelves.filter(shelf => {
        const branch = branchesMap.get(shelf._id)
        return shelf.shelfName.toLowerCase().includes(query) ||
          branch?.city.toLowerCase().includes(query) ||
          branch?.branchName?.toLowerCase().includes(query) ||
          shelf.description?.toLowerCase().includes(query)
      })
    }

    // Sort by creation date (newest first) - do this BEFORE pagination
    shelves.sort((a, b) =>
      new Date(b._creationTime).getTime() - new Date(a._creationTime).getTime()
    )

    // Pagination (after all filters, before expensive processing)
    const totalCount = shelves.length
    const page = args.page || 1
    const pageSize = args.pageSize || 10
    const startIndex = (page - 1) * pageSize
    const paginatedShelves = shelves.slice(startIndex, startIndex + pageSize)

    // Batch fetch all store profiles (fix N+1) - ONLY for paginated shelves
    const storeProfileIds = [...new Set(paginatedShelves.map(s => s.storeProfileId))]
    const storeProfiles = await Promise.all(
      storeProfileIds.map(id => ctx.db.get(id))
    )
    const storeProfileMap = new Map(
      storeProfiles.filter(Boolean).map(p => [p!._id, p])
    )

    // Batch fetch all owners (fix N+1) - ONLY for paginated shelves
    const ownerUserIds = [...new Set(storeProfiles.filter(Boolean).map(p => p!.userId))]
    const owners = await Promise.all(
      ownerUserIds.map(id => ctx.db.get(id))
    )
    const ownerMap = new Map(
      owners.filter(Boolean).map(o => [o!._id, o])
    )

    // Batch fetch all brand profiles for rentals (fix N+1) - ONLY for paginated shelf rentals
    const paginatedShelfIds = paginatedShelves.map(s => s._id)
    const relevantRentals = allActiveRentals.filter(r => paginatedShelfIds.includes(r.shelfId))
    const brandProfileIds = [...new Set(relevantRentals.map(r => r.brandProfileId).filter(Boolean))]
    const brandProfiles = await Promise.all(
      brandProfileIds.map(id => ctx.db.get(id!))
    )
    const brandProfileMap = new Map(
      brandProfiles.filter(Boolean).map(p => [p!._id, p])
    )

    // Create rental map for O(1) lookups (fix O(n²))
    const rentalMap = new Map(
      allActiveRentals.map(r => [r.shelfId, r])
    )

    // Process ONLY paginated shelves with batched data
    const shelvesWithOwners = await Promise.all(
      paginatedShelves.map(async (shelf) => {
        const ownerProfile = storeProfileMap.get(shelf.storeProfileId)
        const owner = ownerProfile ? ownerMap.get(ownerProfile.userId) : null
        const branch = branchesMap.get(shelf._id)

        // Convert storage IDs to URLs
        const shelfImageUrls = await getImageUrlsFromArray(ctx, shelf.images)
        const branchImageUrls = branch?.images ? await getImageUrlsFromArray(ctx, branch.images) : null

        // Build images array for gallery - combine shelf and branch images
        const imagesArray = [
          shelfImageUrls.shelfImageUrl && { url: shelfImageUrls.shelfImageUrl, type: 'shelf' },
          branchImageUrls?.exteriorImageUrl && { url: branchImageUrls.exteriorImageUrl, type: 'exterior' },
          branchImageUrls?.interiorImageUrl && { url: branchImageUrls.interiorImageUrl, type: 'interior' },
          ...shelfImageUrls.additionalImageUrls.map(url => ({ url, type: 'additional' }))
        ].filter(Boolean)

        // Lookup current rental from map (no .find()!)
        const currentRental = rentalMap.get(shelf._id)
        let rentalInfo = null

        if (currentRental) {
          const brandProfile = brandProfileMap.get(currentRental.brandProfileId)
          rentalInfo = {
            endDate: currentRental.endDate,
            startDate: currentRental.startDate,
            brandName: brandProfile?.brandName || "Unknown",
            status: currentRental.status
          }
        }

        return {
          ...shelf,
          city: branch?.city,
          storeBranch: branch?.branchName,
          location: branch?.location,
          shelfImage: shelfImageUrls.shelfImageUrl,
          exteriorImage: branchImageUrls?.exteriorImageUrl || shelfImageUrls.exteriorImageUrl,
          interiorImage: branchImageUrls?.interiorImageUrl || shelfImageUrls.interiorImageUrl,
          images: imagesArray,
          ownerName: ownerProfile?.storeName,
          ownerEmail: owner?.email,
          ownerImage: owner?.image,
          businessCategory: ownerProfile?.businessCategory,
          latitude: branch?.location?.lat,
          longitude: branch?.location?.lng,
          currentRental: rentalInfo,
        }
      })
    )

    // Return paginated results with metadata
    return {
      shelves: shelvesWithOwners,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasMore: startIndex + pageSize < totalCount,
      },
    }
  },
})


// Get a single store by ID
export const getStoreById = query({
  args: {
    storeId: v.id("shelves"),
  },
  handler: async (ctx, args) => {
    const shelf = await ctx.db.get(args.storeId)

    if (!shelf) {
      return null
    }

    // Get branch information
    const branch = shelf.branchId ? await ctx.db.get(shelf.branchId) : null

    // Get owner information from profile
    const ownerProfile = shelf.storeProfileId
      ? await ctx.db.get(shelf.storeProfileId)
      : null
    const owner = ownerProfile ? await ctx.db.get(ownerProfile.userId) : null

    // Convert storage IDs to URLs using new structure
    const imageUrls = await getImageUrlsFromArray(ctx, shelf.images)

    // Return the shelf with owner information and image URLs
    return {
      ...shelf,
      city: branch?.city,
      storeBranch: branch?.branchName,
      location: branch?.location,
      shelfImage: imageUrls.shelfImageUrl,
      exteriorImage: imageUrls.exteriorImageUrl,
      interiorImage: imageUrls.interiorImageUrl,
      ownerName: ownerProfile?.storeName,
      ownerEmail: owner?.email,
      ownerImage: owner?.image || null,
      businessCategory: ownerProfile?.businessCategory,
      // Add latitude and longitude from location for map compatibility
      latitude: branch?.location?.lat,
      longitude: branch?.location?.lng,
    }
  },
})

// Get available cities
export const getAvailableCities = query({
  args: {},
  handler: async (ctx) => {
    // Get all non-suspended shelves using indexed queries
    const [activeShelves, rentedShelves] = await Promise.all([
      ctx.db.query("shelves").withIndex("by_status", (q) => q.eq("status", "active")).collect(),
      ctx.db.query("shelves").withIndex("by_status", (q) => q.eq("status", "rented")).collect(),
    ])
    const shelves = [...activeShelves, ...rentedShelves]

    // Get unique branch IDs (filter out undefined)
    const branchIds = [...new Set(shelves.map(shelf => shelf.branchId).filter(Boolean))]

    // Fetch all branches
    const branches = await Promise.all(
      branchIds.map(id => ctx.db.get(id!))
    )

    // Get unique cities from branches
    const cities = [...new Set(branches.filter(Boolean).map(branch => branch!.city))]
    return cities.sort()
  },
})

// Get available product types
export const getAvailableProductTypes = query({
  args: {},
  handler: async (ctx) => {
    // Get all non-suspended shelves using indexed queries
    const [activeShelves, rentedShelves] = await Promise.all([
      ctx.db.query("shelves").withIndex("by_status", (q) => q.eq("status", "active")).collect(),
      ctx.db.query("shelves").withIndex("by_status", (q) => q.eq("status", "rented")).collect(),
    ])
    const shelves = [...activeShelves, ...rentedShelves]

    // Extract all product types from the productTypes arrays
    const types = [...new Set(
      shelves
        .filter(s => s.productTypes && s.productTypes.length > 0)
        .flatMap(shelf => shelf.productTypes!)
    )]
    return types.sort()
  },
})

// Get price range with filters
export const getPriceRange = query({
  args: {
    city: v.optional(v.string()),
    productType: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
    month: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get all non-suspended shelves using indexed queries
    const [activeShelves, rentedShelves] = await Promise.all([
      ctx.db.query("shelves").withIndex("by_status", (q) => q.eq("status", "active")).collect(),
      ctx.db.query("shelves").withIndex("by_status", (q) => q.eq("status", "rented")).collect(),
    ])
    let shelves = [...activeShelves, ...rentedShelves]

    // Get branches for all shelves
    const branchesMap = new Map()
    for (const shelf of shelves) {
      const branch = shelf.branchId ? await ctx.db.get(shelf.branchId) : null
      if (branch) {
        branchesMap.set(shelf._id, branch)
      }
    }

    // Apply the same filters as getMarketplaceStores (except price)
    if (args.city && args.city !== "all") {
      shelves = shelves.filter(shelf => {
        const branch = branchesMap.get(shelf._id)
        return branch?.city === args.city
      })
    }


    if (args.productType && args.productType !== "all") {
      shelves = shelves.filter(shelf =>
        shelf.productTypes && shelf.productTypes.includes(args.productType!)
      )
    }

    // Month filter
    if (args.month && args.month !== "all") {
      const monthMap: Record<string, number> = {
        january: 0, february: 1, march: 2, april: 3,
        may: 4, june: 5, july: 6, august: 7,
        september: 8, october: 9, november: 10, december: 11
      }
      const monthIndex = monthMap[args.month]
      if (monthIndex !== undefined) {
        shelves = shelves.filter(shelf => {
          const date = new Date(shelf.availableFrom)
          return date.getMonth() === monthIndex
        })
      }
    }

    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase()
      shelves = shelves.filter(shelf => {
        const branch = branchesMap.get(shelf._id)
        return shelf.shelfName.toLowerCase().includes(query) ||
          branch?.city.toLowerCase().includes(query) ||
          branch?.branchName?.toLowerCase().includes(query) ||
          shelf.description?.toLowerCase().includes(query)
      })
    }

    if (shelves.length === 0) {
      return { min: 0, max: 10000 }
    }

    const prices = shelves.map(shelf => shelf.monthlyPrice)
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    }
  },
})