import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"
import { getUserProfile } from "./profileHelpers"
import { getSiteUrl } from "./utils"

/**
 * Branch Management Functions
 */

// Get all branches for the current store owner
export const getBranches = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return []
    }

    const userProfile = await getUserProfile(ctx, userId)
    if (!userProfile || userProfile.type !== "store_owner") {
      return []
    }

    const branches = await ctx.db
      .query("branches")
      .withIndex("by_store_profile", (q) => q.eq("storeProfileId", userProfile.profile._id))
      .order("desc")
      .collect()

    // Get shelf count for each branch
    const branchesWithStats = await Promise.all(
      branches.map(async (branch) => {
        const shelves = await ctx.db
          .query("shelves")
          .withIndex("by_branch", (q) => q.eq("branchId", branch._id))
          .collect()

        // Get image URLs
        const imagesWithUrls = branch.images
          ? await Promise.all(
              branch.images.map(async (img) => ({
                ...img,
                url: await ctx.storage.getUrl(img.storageId),
              }))
            )
          : []

        return {
          ...branch,
          shelfCount: shelves.length,
          images: imagesWithUrls,
        }
      })
    )

    return branchesWithStats
  },
})

// Get branches for a specific owner (used in admin or other contexts)
export const getOwnerBranches = query({
  args: { ownerId: v.id("users") },
  handler: async (ctx, args) => {
    const userProfile = await getUserProfile(ctx, args.ownerId)

    if (!userProfile || userProfile.type !== "store_owner") {
      return []
    }

    const branches = await ctx.db
      .query("branches")
      .withIndex("by_store_profile", (q) => q.eq("storeProfileId", userProfile.profile._id))
      .order("desc")
      .collect()

    // Get shelf count and image URLs for each branch
    const branchesWithStats = await Promise.all(
      branches.map(async (branch) => {
        const shelves = await ctx.db
          .query("shelves")
          .withIndex("by_branch", (q) => q.eq("branchId", branch._id))
          .collect()

        const imagesWithUrls = branch.images
          ? await Promise.all(
              branch.images.map(async (img) => ({
                ...img,
                url: await ctx.storage.getUrl(img.storageId),
              }))
            )
          : []

        return {
          ...branch,
          shelfCount: shelves.length,
          images: imagesWithUrls,
        }
      })
    )

    return branchesWithStats
  },
})

// Get a single branch by ID
export const getBranchById = query({
  args: { branchId: v.id("branches") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return null
    }

    const branch = await ctx.db.get(args.branchId)
    if (!branch) {
      return null
    }

    // Verify ownership
    const userProfile = await getUserProfile(ctx, userId)
    if (!userProfile || userProfile.type !== "store_owner" || branch.storeProfileId !== userProfile.profile._id) {
      return null
    }

    // Get shelf count
    const shelves = await ctx.db
      .query("shelves")
      .withIndex("by_branch", (q) => q.eq("branchId", branch._id))
      .collect()

    // Get image URLs
    const imagesWithUrls = branch.images
      ? await Promise.all(
          branch.images.map(async (img) => ({
            ...img,
            url: await ctx.storage.getUrl(img.storageId),
          }))
        )
      : []

    return {
      ...branch,
      shelfCount: shelves.length,
      images: imagesWithUrls,
      shelves: shelves.map(s => ({
        _id: s._id,
        shelfName: s.shelfName,
        status: s.status,
        monthlyPrice: s.monthlyPrice,
      })),
    }
  },
})

// Get branch statistics
export const getBranchStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return {
        totalBranches: 0,
        activeBranches: 0,
        totalShelves: 0,
        shelvesChange: 0,
      }
    }

    const userProfile = await getUserProfile(ctx, userId)
    if (!userProfile || userProfile.type !== "store_owner") {
      return {
        totalBranches: 0,
        activeBranches: 0,
        totalShelves: 0,
        shelvesChange: 0,
      }
    }

    const branches = await ctx.db
      .query("branches")
      .withIndex("by_store_profile", (q) => q.eq("storeProfileId", userProfile.profile._id))
      .collect()

    const activeBranches = branches.filter((b) => b.status === "active")

    // Count total shelves across all branches
    let totalShelves = 0
    for (const branch of branches) {
      const shelves = await ctx.db
        .query("shelves")
        .withIndex("by_branch", (q) => q.eq("branchId", branch._id))
        .collect()
      totalShelves += shelves.length
    }

    return {
      totalBranches: branches.length,
      activeBranches: activeBranches.length,
      totalShelves,
      shelvesChange: 0, // Could be calculated with historical data
    }
  },
})

// Create a new branch
export const createBranch = mutation({
  args: {
    branchName: v.string(),
    city: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    address: v.string(),
    images: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          type: v.union(v.literal("exterior"), v.literal("interior")),
          order: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Not authenticated")
    }

    const userProfile = await getUserProfile(ctx, userId)
    if (!userProfile || userProfile.type !== "store_owner") {
      throw new Error("Only store owners can create branches")
    }

    // Create branch with placeholder URL, then update with actual _id
    // (required due to Convex schema validation - can't reference _id before insert)
    const siteUrl = getSiteUrl()

    const branchId = await ctx.db.insert("branches", {
      storeProfileId: userProfile.profile._id,
      branchName: args.branchName,
      city: args.city,
      location: {
        lat: args.latitude,
        lng: args.longitude,
        address: args.address,
      },
      images: args.images || [],
      status: "active",
      qrCodeUrl: "temp", // Will be updated immediately
      totalScans: 0,
      totalOrders: 0,
      totalRevenue: 0,
    })

    // Update URL with the branch's own _id
    await ctx.db.patch(branchId, {
      qrCodeUrl: `${siteUrl}/store/${branchId}`,
    })

    return branchId
  },
})

// Update an existing branch
export const updateBranch = mutation({
  args: {
    branchId: v.id("branches"),
    branchName: v.optional(v.string()),
    city: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    address: v.optional(v.string()),
    images: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          type: v.union(v.literal("exterior"), v.literal("interior")),
          order: v.number(),
        })
      )
    ),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Not authenticated")
    }

    const branch = await ctx.db.get(args.branchId)
    if (!branch) {
      throw new Error("Branch not found")
    }

    const userProfile = await getUserProfile(ctx, userId)
    if (!userProfile || userProfile.type !== "store_owner" || branch.storeProfileId !== userProfile.profile._id) {
      throw new Error("Unauthorized: You can only update your own branches")
    }

    const updates: any = {}

    if (args.branchName !== undefined) updates.branchName = args.branchName
    if (args.city !== undefined) updates.city = args.city
    if (args.status !== undefined) updates.status = args.status
    if (args.images !== undefined) updates.images = args.images

    // Update location if any location field is provided
    if (args.latitude !== undefined || args.longitude !== undefined || args.address !== undefined) {
      updates.location = {
        lat: args.latitude !== undefined ? args.latitude : branch.location.lat,
        lng: args.longitude !== undefined ? args.longitude : branch.location.lng,
        address: args.address !== undefined ? args.address : branch.location.address,
      }
    }

    await ctx.db.patch(args.branchId, updates)

    // Note: Shelves will automatically get updated city/location via branchId reference
    // No need to update shelf records as they don't store denormalized data anymore

    return { success: true }
  },
})

// Delete a branch
export const deleteBranch = mutation({
  args: { branchId: v.id("branches") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Not authenticated")
    }

    const branch = await ctx.db.get(args.branchId)
    if (!branch) {
      throw new Error("Branch not found")
    }

    const userProfile = await getUserProfile(ctx, userId)
    if (!userProfile || userProfile.type !== "store_owner" || branch.storeProfileId !== userProfile.profile._id) {
      throw new Error("Unauthorized: You can only delete your own branches")
    }

    // Check if any shelves are using this branch
    const shelves = await ctx.db
      .query("shelves")
      .withIndex("by_branch", (q) => q.eq("branchId", args.branchId))
      .collect()

    if (shelves.length > 0) {
      throw new Error(`Cannot delete branch: ${shelves.length} shelf(es) are using this branch. Please delete or reassign the shelves first.`)
    }

    await ctx.db.delete(args.branchId)

    return { success: true }
  },
})

// Get branch store by ID (for public access via QR code/URL)
export const getBranchStoreById = query({
  args: {
    branchId: v.id("branches"),
  },
  handler: async (ctx, args) => {
    // 1. Get branch
    const branch = await ctx.db.get(args.branchId)
    if (!branch) return null

    // 2. Get ONLY rented shelves in this branch using compound index
    const rentedShelves = await ctx.db
      .query("shelves")
      .withIndex("by_branch_status", (q) =>
        q.eq("branchId", branch._id).eq("status", "rented")
      )
      .collect()

    // Early return if no rented shelves
    if (rentedShelves.length === 0) {
      const storeProfile = await ctx.db.get(branch.storeProfileId)
      return {
        branch,
        storeName: storeProfile?.storeName,
        products: [],
        location: branch.location,
        city: branch.city,
        branchName: branch.branchName,
      }
    }

    // 3. Batch fetch active rentals for rented shelves using compound index
    const activeRentals = (
      await Promise.all(
        rentedShelves.map((shelf) =>
          ctx.db
            .query("rentalRequests")
            .withIndex("by_shelf_status", (q) =>
              q.eq("shelfId", shelf._id).eq("status", "active")
            )
            .collect()
        )
      )
    ).flat()

    // Early return if no active rentals
    if (activeRentals.length === 0) {
      const storeProfile = await ctx.db.get(branch.storeProfileId)
      return {
        branch,
        storeName: storeProfile?.storeName,
        products: [],
        location: branch.location,
        city: branch.city,
        branchName: branch.branchName,
      }
    }

    // 4. Batch fetch all brand profiles
    const brandProfileIds = [...new Set(activeRentals.map((r) => r.brandProfileId))]
    const brandProfiles = await Promise.all(
      brandProfileIds.map((id) => ctx.db.get(id))
    )
    const brandProfileMap = new Map(
      brandProfiles.filter(Boolean).map((p) => [p!._id, p])
    )

    // 5. Batch fetch all products (fix N+1)
    const productIds = [
      ...new Set(activeRentals.flatMap((r) => r.selectedProducts.map((p) => p.productId))),
    ]
    const products = await Promise.all(productIds.map((id) => ctx.db.get(id)))
    const productMap = new Map(products.filter(Boolean).map((p) => [p!._id, p]))

    // 6. Aggregate products with quantities using Map lookups (O(1) instead of O(n))
    const aggregatedProducts = new Map()
    for (const rental of activeRentals) {
      const brandProfile = brandProfileMap.get(rental.brandProfileId)

      for (const item of rental.selectedProducts) {
        const product = productMap.get(item.productId)
        if (!product) continue

        const key = item.productId

        if (aggregatedProducts.has(key)) {
          // Aggregate quantities from multiple rentals
          const existing = aggregatedProducts.get(key)
          existing.shelfQuantity += item.quantity
          existing.rentals.push({
            rentalId: rental._id,
            quantity: item.quantity,
            brandName: brandProfile?.brandName,
          })
        } else {
          aggregatedProducts.set(key, {
            _id: product._id,
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            imageUrl: product.imageUrl,
            shelfQuantity: item.quantity,
            available: item.quantity > 0,
            brandName: brandProfile?.brandName,
            rentals: [
              {
                rentalId: rental._id,
                quantity: item.quantity,
                brandName: brandProfile?.brandName,
              },
            ],
          })
        }
      }
    }

    // 7. Return store data
    const storeProfile = await ctx.db.get(branch.storeProfileId)

    return {
      branch,
      storeName: storeProfile?.storeName,
      products: Array.from(aggregatedProducts.values()),
      location: branch.location,
      city: branch.city,
      branchName: branch.branchName,
    }
  },
})

// Increment branch store stats
export const incrementBranchStoreStats = mutation({
  args: {
    branchId: v.id("branches"),
    statType: v.union(
      v.literal("scan"),
      v.literal("view"),
      v.literal("order")
    ),
    revenue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const branch = await ctx.db.get(args.branchId)
    if (!branch) return

    const updates: any = {}

    if (args.statType === "scan" || args.statType === "view") {
      updates.totalScans = (branch.totalScans || 0) + 1
    } else if (args.statType === "order") {
      updates.totalOrders = (branch.totalOrders || 0) + 1
      if (args.revenue) {
        updates.totalRevenue = (branch.totalRevenue || 0) + args.revenue
      }
    }

    await ctx.db.patch(args.branchId, updates)
  },
})
