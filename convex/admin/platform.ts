import { v } from "convex/values"
import { mutation, query } from "../_generated/server"
import { Id } from "../_generated/dataModel"
import { getUserProfile } from "../profileHelpers"
import { verifyAdminAccess } from "./helpers"

// Update platform settings (admin only)
export const updatePlatformSettings = mutation({
  args: {
    brandSalesCommission: v.optional(v.number()),
    storeRentCommission: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const auth = await verifyAdminAccess(ctx)
    if (!auth.isAuthenticated || !auth.isAdmin || !auth.adminProfile) {
      throw new Error("Unauthorized: Admin access required")
    }

    // Validate commission percentages
    if (args.brandSalesCommission !== undefined && (args.brandSalesCommission < 0 || args.brandSalesCommission > 100)) {
      throw new Error("Brand sales commission must be between 0 and 100")
    }
    if (args.storeRentCommission !== undefined && (args.storeRentCommission < 0 || args.storeRentCommission > 100)) {
      throw new Error("Store rent commission must be between 0 and 100")
    }

    const settings = args

    // Update or create brand sales commission setting
    if (settings.brandSalesCommission !== undefined) {
      const key = "brandSalesCommission"
      const existingSetting = await ctx.db.query("platformSettings").withIndex("by_key", q => q.eq("key", key)).first()

      if (existingSetting) {
        await ctx.db.patch(existingSetting._id, {
          value: settings.brandSalesCommission,
          updatedByAdminId: auth.adminProfile._id,
          updatedAt: Date.now(),
        })
      } else {
        await ctx.db.insert("platformSettings", {
          key: key,
          value: settings.brandSalesCommission,
          description: "Brand sales commission percentage",
          updatedByAdminId: auth.adminProfile._id,
          updatedAt: Date.now(),
        })
      }
    }

    // Update or create store rent commission setting
    if (settings.storeRentCommission !== undefined) {
      const key = "storeRentCommission"
      const existingSetting = await ctx.db.query("platformSettings").withIndex("by_key", q => q.eq("key", key)).first()

      if (existingSetting) {
        await ctx.db.patch(existingSetting._id, {
          value: settings.storeRentCommission,
          updatedByAdminId: auth.adminProfile._id,
          updatedAt: Date.now(),
        })
      } else {
        await ctx.db.insert("platformSettings", {
          key: key,
          value: settings.storeRentCommission,
          description: "Store rent commission percentage",
          updatedByAdminId: auth.adminProfile._id,
          updatedAt: Date.now(),
        })
      }
    }

    return { success: true, message: "Platform settings updated" }
  },
})

// Toggle user active status (admin only) - for store/brand users, not admin users
export const toggleUserStatus = mutation({
  args: {
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const auth = await verifyAdminAccess(ctx)
    if (!auth.isAuthenticated || !auth.isAdmin || !auth.userId) {
      throw new Error("Unauthorized: Admin access required")
    }

    // Prevent admin from deactivating themselves
    if (auth.userId === args.targetUserId) {
      throw new Error("Cannot deactivate your own admin account")
    }

    const targetUser = await ctx.db.get(args.targetUserId)
    if (!targetUser) {
      throw new Error("User not found")
    }

    // Check for profile in different tables
    const targetProfile = await getUserProfile(ctx, args.targetUserId)

    if (!targetProfile) {
      throw new Error("User profile not found")
    }

    // Toggle active status based on profile type
    const newStatus = !targetProfile.profile.isActive
    await ctx.db.patch(targetProfile.profile._id, {
      isActive: newStatus,
    })

    return {
      success: true,
      message: `User ${newStatus ? "activated" : "deactivated"} successfully`,
      newStatus
    }
  },
})

// Get all shelf posts with their details for admin dashboard
export const getPosts = query({
  args: {
    searchQuery: v.optional(v.string()),
    status: v.optional(v.string()),
    page: v.number(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const auth = await verifyAdminAccess(ctx)
    if (!auth.isAuthenticated || !auth.isAdmin) {
      // Return empty results when not authenticated or not admin
      return {
        items: [],
        total: 0,
        pages: 0,
        currentPage: args.page
      }
    }

    const { searchQuery = "", status = "all", page, limit } = args;

    // Get ALL shelves for accurate search
    // Note: Must use .collect() so search works across all shelves
    let shelves = await ctx.db
      .query("shelves")
      .order("desc")
      .collect(); // Get ALL - search requires complete data

    // Filter by status
    const filteredByStatus = status === "all"
      ? shelves
      : shelves.filter(shelf => {
        if (status === "published") return shelf.status === "active";
        if (status === "approved") return shelf.status === "active";
        return false;
      });

    // BATCH FETCH: Get all unique store profile IDs and branch IDs
    const storeProfileIds = [...new Set(filteredByStatus.map(s => s.storeProfileId))];
    const branchIds = [...new Set(filteredByStatus.filter(s => s.branchId).map(s => s.branchId!))];

    // Fetch all store profiles and branches in parallel batches
    const [storeProfiles, branches] = await Promise.all([
      Promise.all(storeProfileIds.map(id => ctx.db.get(id))),
      Promise.all(branchIds.map(id => ctx.db.get(id)))
    ]);

    // Create maps for O(1) lookup
    const storeProfileMap = new Map(storeProfiles.filter(p => p !== null).map(p => [p!._id.toString(), p!]));
    const branchMap = new Map(branches.filter(b => b !== null).map(b => [b!._id.toString(), b!]));

    // BATCH FETCH: Get all unique user IDs from store profiles
    const userIds = [...new Set(storeProfiles.filter(p => p !== null).map(p => p!.userId))];
    const users = await Promise.all(userIds.map(id => ctx.db.get(id)));
    const userMap = new Map(users.filter(u => u !== null).map(u => [u!._id.toString(), u!]));

    // Build results using pre-fetched data (no queries in loop!)
    const shelvesWithOwners = filteredByStatus.map(shelf => {
      const ownerProfile = storeProfileMap.get(shelf.storeProfileId.toString());
      if (!ownerProfile) return null;

      // Get branch data (O(1) map lookup)
      const branch = shelf.branchId ? branchMap.get(shelf.branchId.toString()) : null;
      if (!branch) return null;

      // Get user data (O(1) map lookup)
      const ownerUser = userMap.get(ownerProfile.userId.toString())

      return {
        id: shelf._id,
        storeId: shelf.storeProfileId, // Add storeId which is the profileId
        storeName: ownerProfile.storeName || ownerUser?.name,
        storeOwnerName: ownerUser?.name,
        storeOwnerEmail: ownerUser?.email || "",
        storeOwnerPhone: ownerUser?.phone,
        businessRegistration: ownerProfile.commercialRegisterNumber,
        storeBranch: branch.branchName,
        shelfName: shelf.shelfName,
        percentage: shelf.storeCommission ?? 0, // Store commission
        price: shelf.monthlyPrice,
        addedDate: shelf._creationTime,
        status: shelf.status === "active" ? "published" : shelf.status,
        city: branch.city,
        dimensions: `${shelf.shelfSize.width} × ${shelf.shelfSize.height} × ${shelf.shelfSize.depth} ${shelf.shelfSize.unit}`,
        productTypes: shelf.productTypes?.join(", "),
        description: shelf.description,
        availableFrom: shelf.availableFrom,
        images: shelf.images?.map(img => img.storageId) || [],
      };
    });

    // Filter out null entries and apply search
    const validShelves = shelvesWithOwners.filter(Boolean) as NonNullable<typeof shelvesWithOwners[0]>[];

    const filteredShelves = searchQuery
      ? validShelves.filter(post =>
        post.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.shelfName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.storeBranch?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : validShelves;

    // Sort by date (newest first)
    filteredShelves.sort((a, b) =>
      new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
    );

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = filteredShelves.slice(startIndex, endIndex);

    return {
      items: paginatedPosts, // Changed from 'posts' to 'items' for consistency
      totalPages: Math.ceil(filteredShelves.length / limit),
    };
  },
});
