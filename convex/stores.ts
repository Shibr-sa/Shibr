import { v } from "convex/values"
import { query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

// Get all available stores for marketplace
export const getMarketplaceStores = query({
  args: {
    city: v.optional(v.string()),
    area: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    productType: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
    month: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Start with all approved and available shelves
    let shelvesQuery = ctx.db
      .query("shelves")
      .withIndex("by_status")
      .filter((q) => q.eq(q.field("status"), "approved"))
      .filter((q) => q.eq(q.field("isAvailable"), true))

    // Get all shelves first
    let shelves = await shelvesQuery.collect()

    // Apply filters
    if (args.city && args.city !== "all") {
      shelves = shelves.filter(shelf => shelf.city === args.city)
    }

    // Area filter - for demo purposes, we'll filter by branch containing area keywords
    if (args.area && args.area !== "all") {
      const areaKeywords: Record<string, string[]> = {
        north: ["الشمال", "النزهة", "العليا", "السليمانية"],
        south: ["الجنوب", "العزيزية", "البديعة"],
        east: ["الشرق", "الروضة", "النسيم"],
        west: ["الغرب", "الحمراء", "السلام"],
        center: ["الوسط", "الملز", "الديرة"]
      }
      const keywords = areaKeywords[args.area] || []
      shelves = shelves.filter(shelf => 
        keywords.some(keyword => shelf.branch.includes(keyword))
      )
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
      shelves = shelves.filter(shelf => shelf.productType === args.productType)
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
      shelves = shelves.filter(shelf => 
        shelf.shelfName.toLowerCase().includes(query) ||
        shelf.city.toLowerCase().includes(query) ||
        shelf.branch.toLowerCase().includes(query) ||
        shelf.address?.toLowerCase().includes(query) ||
        shelf.description?.toLowerCase().includes(query)
      )
    }

    // Get owner information for each shelf
    const shelvesWithOwners = await Promise.all(
      shelves.map(async (shelf) => {
        const owner = await ctx.db.get(shelf.ownerId)
        return {
          ...shelf,
          ownerName: owner?.storeName || owner?.fullName || "Unknown",
          ownerEmail: owner?.email,
          storeType: owner?.storeType,
        }
      })
    )

    // Sort by creation date (newest first)
    return shelvesWithOwners.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },
})

// Get single store details
export const getStoreDetails = query({
  args: { shelfId: v.id("shelves") },
  handler: async (ctx, args) => {
    const shelf = await ctx.db.get(args.shelfId)
    
    if (!shelf) {
      return null
    }

    const owner = await ctx.db.get(shelf.ownerId)
    
    return {
      ...shelf,
      ownerName: owner?.storeName || owner?.fullName || "Unknown",
      ownerEmail: owner?.email,
      storeType: owner?.storeType,
      ownerPhone: owner?.phoneNumber,
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
    
    // Get owner information
    const owner = shelf.ownerId 
      ? await ctx.db.get(shelf.ownerId as Id<"users">)
      : null
    
    // Return the shelf with owner information
    return {
      ...shelf,
      ownerName: owner?.storeName || owner?.fullName || "Store Owner",
      ownerEmail: owner?.email,
      storeType: owner?.storeType,
      ownerPhone: owner?.phoneNumber,
    }
  },
})

// Get available cities
export const getAvailableCities = query({
  args: {},
  handler: async (ctx) => {
    const shelves = await ctx.db
      .query("shelves")
      .withIndex("by_status")
      .filter((q) => q.eq(q.field("status"), "approved"))
      .filter((q) => q.eq(q.field("isAvailable"), true))
      .collect()

    const cities = [...new Set(shelves.map(shelf => shelf.city))]
    return cities.sort()
  },
})

// Get available product types
export const getAvailableProductTypes = query({
  args: {},
  handler: async (ctx) => {
    const shelves = await ctx.db
      .query("shelves")
      .withIndex("by_status")
      .filter((q) => q.eq(q.field("status"), "approved"))
      .filter((q) => q.eq(q.field("isAvailable"), true))
      .collect()

    const types = [...new Set(shelves.filter(s => s.productType).map(shelf => shelf.productType!))]
    return types.sort()
  },
})

// Get price range with filters
export const getPriceRange = query({
  args: {
    city: v.optional(v.string()),
    area: v.optional(v.string()),
    productType: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
    month: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Start with all approved and available shelves
    let shelves = await ctx.db
      .query("shelves")
      .withIndex("by_status")
      .filter((q) => q.eq(q.field("status"), "approved"))
      .filter((q) => q.eq(q.field("isAvailable"), true))
      .collect()

    // Apply the same filters as getMarketplaceStores (except price)
    if (args.city && args.city !== "all") {
      shelves = shelves.filter(shelf => shelf.city === args.city)
    }

    // Area filter
    if (args.area && args.area !== "all") {
      const areaKeywords: Record<string, string[]> = {
        north: ["الشمال", "النزهة", "العليا", "السليمانية"],
        south: ["الجنوب", "العزيزية", "البديعة"],
        east: ["الشرق", "الروضة", "النسيم"],
        west: ["الغرب", "الحمراء", "السلام"],
        center: ["الوسط", "الملز", "الديرة"]
      }
      const keywords = areaKeywords[args.area] || []
      shelves = shelves.filter(shelf => 
        keywords.some(keyword => shelf.branch.includes(keyword))
      )
    }

    if (args.productType && args.productType !== "all") {
      shelves = shelves.filter(shelf => shelf.productType === args.productType)
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
      shelves = shelves.filter(shelf => 
        shelf.shelfName.toLowerCase().includes(query) ||
        shelf.city.toLowerCase().includes(query) ||
        shelf.branch.toLowerCase().includes(query) ||
        shelf.address?.toLowerCase().includes(query) ||
        shelf.description?.toLowerCase().includes(query)
      )
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