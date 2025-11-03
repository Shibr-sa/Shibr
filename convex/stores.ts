import { v } from "convex/values"
import { query } from "./_generated/server"
import { Id } from "./_generated/dataModel"
import { getImageUrlsFromArray } from "./helpers"

// Get all stores with aggregated data for marketplace
export const getAllStores = query({
  args: {
    city: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get all active store profiles
    let storeProfiles = await ctx.db
      .query("storeProfiles")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect()

    // Get all branches and shelves for aggregation
    const branches = await ctx.db.query("branches").collect()
    const shelves = await ctx.db
      .query("shelves")
      .withIndex("by_status")
      .filter((q) => q.or(
        q.eq(q.field("status"), "active"),
        q.eq(q.field("status"), "rented")
      ))
      .collect()

    // Create maps for efficient lookups
    const branchesByStore = new Map<string, typeof branches[0][]>()
    branches.forEach(branch => {
      if (branch.storeProfileId) {
        const existing = branchesByStore.get(branch.storeProfileId) || []
        branchesByStore.set(branch.storeProfileId, [...existing, branch])
      }
    })

    const shelvesByBranch = new Map<string, typeof shelves[0][]>()
    shelves.forEach(shelf => {
      if (shelf.branchId) {
        const existing = shelvesByBranch.get(shelf.branchId) || []
        shelvesByBranch.set(shelf.branchId, [...existing, shelf])
      }
    })

    // Apply search filter
    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase()
      storeProfiles = storeProfiles.filter(store =>
        store.storeName.toLowerCase().includes(query) ||
        store.businessCategory?.toLowerCase().includes(query)
      )
    }

    // Process stores with aggregated data
    const storesWithData = await Promise.all(
      storeProfiles.map(async (store) => {
        const storeBranches = branchesByStore.get(store._id) || []

        // Get unique cities from branches
        const cities = [...new Set(storeBranches.map(b => b.city).filter(Boolean))]

        // Calculate total available shelves and price range
        let totalAvailableShelves = 0
        let minPrice = Infinity
        let maxPrice = 0
        const allProductTypes = new Set<string>()

        storeBranches.forEach(branch => {
          const branchShelves = shelvesByBranch.get(branch._id) || []
          totalAvailableShelves += branchShelves.length

          branchShelves.forEach(shelf => {
            if (shelf.monthlyPrice < minPrice) minPrice = shelf.monthlyPrice
            if (shelf.monthlyPrice > maxPrice) maxPrice = shelf.monthlyPrice
            shelf.productTypes?.forEach(type => allProductTypes.add(type))
          })
        })

        // Get owner information
        const owner = await ctx.db.get(store.userId)

        return {
          _id: store._id,
          storeName: store.storeName,
          businessCategory: store.businessCategory,
          logo: owner?.image,
          branchCount: storeBranches.length,
          cities,
          totalAvailableShelves,
          priceRange: {
            min: minPrice === Infinity ? 0 : minPrice,
            max: maxPrice
          },
          productTypes: Array.from(allProductTypes),
          createdAt: store._creationTime
        }
      })
    )

    // Apply city filter after aggregation
    let filteredStores = storesWithData
    if (args.city && args.city !== "all") {
      filteredStores = storesWithData.filter(store =>
        store.cities.includes(args.city!)
      )
    }

    // Filter out stores with no branches
    filteredStores = filteredStores.filter(store => store.branchCount > 0)

    // Sort by creation date (newest first)
    filteredStores.sort((a, b) => b.createdAt - a.createdAt)

    // Pagination
    const totalCount = filteredStores.length
    const page = args.page || 1
    const pageSize = args.pageSize || 12
    const startIndex = (page - 1) * pageSize
    const paginatedStores = filteredStores.slice(startIndex, startIndex + pageSize)

    return {
      stores: paginatedStores,
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

// Get a single store with its branches
export const getStoreWithBranches = query({
  args: {
    storeProfileId: v.id("storeProfiles"),
    city: v.optional(v.string()),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get store profile
    const storeProfile = await ctx.db.get(args.storeProfileId)
    if (!storeProfile || !storeProfile.isActive) {
      return null
    }

    // Get owner information
    const owner = await ctx.db.get(storeProfile.userId)

    // Get all branches for this store
    let branches = await ctx.db
      .query("branches")
      .withIndex("by_store_profile", (q) => q.eq("storeProfileId", args.storeProfileId))
      .collect()

    // Apply city filter if provided
    if (args.city && args.city !== "all") {
      branches = branches.filter(branch => branch.city === args.city)
    }

    // Get shelves for each branch and aggregate data
    const branchesWithData = await Promise.all(
      branches.map(async (branch) => {
        const shelves = await ctx.db
          .query("shelves")
          .withIndex("by_branch_status")
          .filter((q) => q.and(
            q.eq(q.field("branchId"), branch._id),
            q.or(
              q.eq(q.field("status"), "active"),
              q.eq(q.field("status"), "rented")
            )
          ))
          .collect()

        // Calculate price range and get product types for this branch
        let minPrice = Infinity
        let maxPrice = 0
        const productTypes = new Set<string>()

        shelves.forEach(shelf => {
          if (shelf.monthlyPrice < minPrice) minPrice = shelf.monthlyPrice
          if (shelf.monthlyPrice > maxPrice) maxPrice = shelf.monthlyPrice
          shelf.productTypes?.forEach(type => productTypes.add(type))
        })

        // Get branch images
        const branchImages = await getImageUrlsFromArray(ctx, branch.images)

        return {
          _id: branch._id,
          branchName: branch.branchName,
          city: branch.city,
          location: branch.location,
          availableShelvesCount: shelves.length,
          priceRange: {
            min: minPrice === Infinity ? 0 : minPrice,
            max: maxPrice
          },
          productTypes: Array.from(productTypes),
          images: [
            branchImages.exteriorImageUrl && { url: branchImages.exteriorImageUrl, type: 'exterior' },
            branchImages.interiorImageUrl && { url: branchImages.interiorImageUrl, type: 'interior' }
          ].filter(Boolean),
          createdAt: branch._creationTime,
          ownerName: storeProfile.storeName,
          ownerImage: owner?.image
        }
      })
    )

    // Sort branches by creation date
    branchesWithData.sort((a, b) => b.createdAt - a.createdAt)

    // Pagination for branches
    const totalCount = branchesWithData.length
    const page = args.page || 1
    const pageSize = args.pageSize || 12
    const startIndex = (page - 1) * pageSize
    const paginatedBranches = branchesWithData.slice(startIndex, startIndex + pageSize)

    return {
      store: {
        _id: storeProfile._id,
        storeName: storeProfile.storeName,
        businessCategory: storeProfile.businessCategory,
        logo: owner?.image,
        ownerEmail: owner?.email,
        totalBranches: branchesWithData.length
      },
      branches: paginatedBranches,
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

// Get available cities for stores (or specific store)
export const getAvailableCitiesByStore = query({
  args: {
    storeProfileId: v.optional(v.id("storeProfiles"))
  },
  handler: async (ctx, args) => {
    if (args.storeProfileId) {
      // Get cities for a specific store
      const branches = await ctx.db
        .query("branches")
        .withIndex("by_store_profile", (q) => q.eq("storeProfileId", args.storeProfileId!))
        .collect()

      const cities = [...new Set(branches.map(b => b.city).filter(Boolean))]
      return cities.sort()
    } else {
      // Get all cities where stores have branches with available shelves
      const branches = await ctx.db.query("branches").collect()
      const branchIds = branches.map(b => b._id)

      // Check which branches have available shelves
      const branchesWithShelves = new Set<string>()
      for (const branchId of branchIds) {
        const shelves = await ctx.db
          .query("shelves")
          .withIndex("by_branch_status")
          .filter((q) => q.and(
            q.eq(q.field("branchId"), branchId),
            q.or(
              q.eq(q.field("status"), "active"),
              q.eq(q.field("status"), "rented")
            )
          ))
          .first()

        if (shelves) {
          branchesWithShelves.add(branchId)
        }
      }

      // Get cities from branches that have shelves
      const cities = [...new Set(
        branches
          .filter(b => branchesWithShelves.has(b._id))
          .map(b => b.city)
          .filter(Boolean)
      )]
      return cities.sort()
    }
  },
})


// Get all available stores for marketplace (DEPRECATED - now gets shelves)
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