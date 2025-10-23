import { v } from "convex/values"
import { query } from "../_generated/server"
import { verifyAdminAccess } from "./helpers"
import { getDateRange, getImageUrlsFromArray } from "../helpers"

// Query limits for detail pages (not main list)
// Note: Main list (getStores) uses .collect() for accurate search/stats
const MAX_SHELVES_PER_STORE_DETAIL = 100  // Max shelves to show on store detail page
const MAX_RENTALS_PER_STORE_DETAIL = 100  // Max rentals to show on store detail page

// Get all stores (store owners) with their stats for admin dashboard
export const getStores = query({
  args: {
    searchQuery: v.optional(v.string()),
    page: v.number(),
    limit: v.number(),
    timePeriod: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("yearly"))),
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

    const { searchQuery = "", page, limit, timePeriod = "monthly" } = args;

    // Get ALL store profiles for accurate search and stats
    // Note: Must use .collect() so search works across all stores
    // and stats calculations are accurate
    const allStoreProfiles = await ctx.db
      .query("storeProfiles")
      .collect() // Get ALL - search/stats require complete data

    // BATCH FETCH 1: Get all users upfront (avoid N+1 queries)
    const userIds = [...new Set(allStoreProfiles.map(p => p.userId))];
    const users = await Promise.all(userIds.map(id => ctx.db.get(id)));
    const userMap = new Map(users.filter(u => u !== null).map(u => [u!._id.toString(), u!]));

    // Build store owners with user data
    const allStoreOwners = allStoreProfiles.map(profile => {
      const user = userMap.get(profile.userId.toString());
      return {
        ...profile,
        email: user?.email
      };
    });

    // Filter by search query
    // Note: emails are already stored lowercase, only normalize search input
    const normalizedSearchQuery = searchQuery.toLowerCase();
    const filteredStoreOwners = searchQuery
      ? allStoreOwners.filter(store =>
        store.storeName?.toLowerCase().includes(normalizedSearchQuery) ||
        store.email?.includes(normalizedSearchQuery)  // email already lowercase in DB
      )
      : allStoreOwners;

    // BATCH FETCH 2: Get ALL shelves for accurate stats
    // Note: Using .collect() ensures stats are correct
    const allShelves = await ctx.db
      .query("shelves")
      .collect(); // Get ALL for accurate shelf counts

    // Group shelves by store
    const shelvesByStore = new Map<string, typeof allShelves>();
    for (const shelf of allShelves) {
      const storeId = shelf.storeProfileId.toString();
      const existing = shelvesByStore.get(storeId) || [];
      existing.push(shelf);
      shelvesByStore.set(storeId, existing);
    }

    // BATCH FETCH 3: Get ALL rentals for accurate stats
    // Note: Using .collect() ensures revenue totals are accurate
    const allRentals = await ctx.db
      .query("rentalRequests")
      .collect(); // Get ALL for accurate rental/revenue stats

    // Group rentals by store
    const rentalsByStore = new Map<string, typeof allRentals>();
    for (const rental of allRentals) {
      const storeId = rental.storeProfileId.toString();
      const existing = rentalsByStore.get(storeId) || [];
      existing.push(rental);
      rentalsByStore.set(storeId, existing);
    }

    // Get stats for each store owner (using batched data - NO queries in loop!)
    const storesWithStats = await Promise.all(
      filteredStoreOwners.map(async (store) => {
        // Use pre-fetched shelves (O(1) map lookup)
        const shelves = shelvesByStore.get(store._id.toString()) || [];
        const approvedShelves = shelves.filter(s => s.status === "active").length;
        const totalShelves = shelves.length;

        // Use pre-fetched rentals (O(1) map lookup)
        const rentals = rentalsByStore.get(store._id.toString()) || [];
        const activeRentals = rentals.filter(r => r.status === "active").length;
        const totalRevenue = rentals
          .filter(r => r.status === "active")
          .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

        // Use pre-fetched user (O(1) map lookup)
        const user = userMap.get(store.userId.toString())

        // Profile image is now stored in users.image field as URL string
        const profileImageUrl = user?.image || null;

        // Convert commercial register document storage ID to URL if exists
        let businessRegistrationUrl = null;
        if (store.commercialRegisterDocument) {
          businessRegistrationUrl = await ctx.storage.getUrl(store.commercialRegisterDocument);
        }

        return {
          id: store._id,
          name: store.storeName || user?.name,
          email: store.email,
          phoneNumber: user?.phone,
          shelves: totalShelves,
          approvedShelves,
          rentedShelves: activeRentals, // Add this for consistency
          rentals: activeRentals,
          revenue: totalRevenue,
          status: store.isActive ? "active" : "suspended",
          joinDate: store._creationTime,
          businessRegistration: store.commercialRegisterNumber,
          businessRegistrationUrl, // Now returns actual URL
          profileImageUrl, // Include the profile image URL
          fullName: user?.name,
          storeName: store.storeName,
          businessCategory: store.businessCategory,
          // Location is now per shelf, not per store
        };
      })
    );

    // Sort by creation date (newest first)
    storesWithStats.sort((a, b) =>
      new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()
    );

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedStores = storesWithStats.slice(startIndex, endIndex);

    // Calculate percentage changes based on timePeriod
    const now = new Date();
    const { startDate: periodStart } = getDateRange(now, timePeriod);
    const { startDate: previousStart } = getDateRange(periodStart, timePeriod);

    // Filter stores created in current period
    const storesInPeriod = storesWithStats.filter(store => {
      const joinDate = new Date(store.joinDate);
      return joinDate >= periodStart;
    });

    // Filter stores created in previous period
    const storesInPreviousPeriod = storesWithStats.filter(store => {
      const joinDate = new Date(store.joinDate);
      return joinDate >= previousStart && joinDate < periodStart;
    });

    // Get total cumulative counts up to end of previous period
    const storesUpToPreviousPeriod = storesWithStats.filter(store => {
      const joinDate = new Date(store.joinDate);
      return joinDate < periodStart;
    });

    // Calculate shelves for current and previous periods (use already-fetched data)
    const shelvesInPeriod = allShelves.filter(s => {
      const createdDate = new Date(s._creationTime);
      return createdDate >= periodStart;
    });

    const shelvesUpToPreviousPeriod = allShelves.filter(s => {
      const createdDate = new Date(s._creationTime);
      return createdDate < periodStart;
    });

    // Calculate rentals and revenue for current and previous periods (use already-fetched data)
    const activeRentals = allRentals.filter(r => r.status === "active");

    const rentalsInPeriod = activeRentals.filter(r => {
      const createdDate = new Date(r._creationTime);
      return createdDate >= periodStart;
    });

    const rentalsUpToPreviousPeriod = activeRentals.filter(r => {
      const createdDate = new Date(r._creationTime);
      return createdDate < periodStart;
    });

    // Calculate revenue from shelf rentals
    const revenueInPeriod = rentalsInPeriod.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const revenueInPreviousPeriod = activeRentals.filter(r => {
      const createdDate = new Date(r._creationTime);
      return createdDate >= previousStart && createdDate < periodStart;
    }).reduce((sum, r) => sum + (r.totalAmount || 0), 0);

    // When showing stats for a period, show counts specific to that period
    // For "monthly", show stores added this month, for "yearly" show stores added this year, etc.
    const displayStores = storesInPeriod.length;
    const displayShelves = shelvesInPeriod.length;
    const displayRevenue = revenueInPeriod;

    // Calculate percentage changes
    // Compare current period count to previous period count
    const totalChange = storesInPreviousPeriod.length > 0
      ? Math.round(((storesInPeriod.length - storesInPreviousPeriod.length) / storesInPreviousPeriod.length) * 100 * 10) / 10
      : storesInPeriod.length > 0 ? 100 : 0;

    // For shelves: get shelves from previous period to compare
    const shelvesInPreviousPeriod = allShelves.filter(s => {
      const createdDate = new Date(s._creationTime);
      return createdDate >= previousStart && createdDate < periodStart;
    });

    const shelvesChange = shelvesInPreviousPeriod.length > 0
      ? Math.round(((shelvesInPeriod.length - shelvesInPreviousPeriod.length) / shelvesInPreviousPeriod.length) * 100 * 10) / 10
      : shelvesInPeriod.length > 0 ? 100 : 0;

    // Calculate revenue change percentage
    const revenueChange = revenueInPreviousPeriod > 0
      ? Math.round(((revenueInPeriod - revenueInPreviousPeriod) / revenueInPreviousPeriod) * 100 * 10) / 10
      : revenueInPeriod > 0 ? 100 : 0;

    return {
      items: paginatedStores,
      totalPages: Math.ceil(storesWithStats.length / limit),
      stats: {
        totalStores: displayStores, // Show period-specific count
        totalChange,
        activeStores: storesInPeriod.filter(s => s.status === "active").length,
        activeChange: 0, // Would need historical data to calculate
        suspendedStores: storesInPeriod.filter(s => s.status === "suspended").length,
        suspendedChange: 0, // Would need historical data to calculate
        totalShelves: displayShelves, // Show period-specific count
        shelvesChange,
        totalRevenue: displayRevenue, // Show revenue from shelf rentals
        revenueChange,
      },
    };
  },
});

export const getStoreShelves = query({
  args: {
    profileId: v.id("storeProfiles"),
    searchQuery: v.optional(v.string()),
    status: v.optional(v.string()),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
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
        currentPage: args.page || 1
      }
    }

    const page = args.page || 1
    const limit = args.limit || 5
    const searchQuery = args.searchQuery?.toLowerCase() || ""
    const statusFilter = args.status || "all"

    let shelves = await ctx.db
      .query("shelves")
      .filter(q => q.eq(q.field("storeProfileId"), args.profileId))
      .take(MAX_SHELVES_PER_STORE_DETAIL) // Limit shelves displayed per store

    // Get branches for all shelves to enable search by branch name
    const shelvesWithBranches = await Promise.all(
      shelves.map(async (shelf) => {
        const branch = shelf.branchId ? await ctx.db.get(shelf.branchId) : null
        return { shelf, branch }
      })
    )

    // Apply search filter
    let filteredShelvesWithBranches = shelvesWithBranches
    if (searchQuery) {
      filteredShelvesWithBranches = shelvesWithBranches.filter(({ shelf, branch }) =>
        shelf.shelfName?.toLowerCase().includes(searchQuery) ||
        branch?.branchName?.toLowerCase().includes(searchQuery)
      )
    }

    // Extract shelves from filtered results
    shelves = filteredShelvesWithBranches.map(({ shelf }) => shelf)

    // Apply status filter based on shelf status field
    if (statusFilter !== "all") {
      shelves = shelves.filter(shelf => {
        const shelfStatus = shelf.status === "rented" ? "rented" : "available"
        return shelfStatus === statusFilter
      })
    }

    // Convert storage IDs to URLs for images
    const shelvesWithUrls = await Promise.all(
      shelves.map(async (shelf) => {
        const imageUrls = await getImageUrlsFromArray(ctx, shelf.images)

        return {
          ...shelf,
          ...imageUrls
        }
      })
    )

    // Pagination
    const totalItems = shelvesWithUrls.length
    const totalPages = Math.ceil(totalItems / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedShelves = shelvesWithUrls.slice(startIndex, endIndex)

    return {
      items: paginatedShelves,
      totalItems,
      totalPages,
      currentPage: page,
    }
  },
})

// Get rental requests for a specific store (admin store details page)
export const getStoreRentals = query({
  args: {
    profileId: v.id("storeProfiles"),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const auth = await verifyAdminAccess(ctx)
    if (!auth.isAuthenticated || !auth.isAdmin) {
      // Return empty array when not authenticated or not admin
      return []
    }

    const rentals = await ctx.db
      .query("rentalRequests")
      .filter(q => q.eq(q.field("storeProfileId"), args.profileId))
      .take(MAX_RENTALS_PER_STORE_DETAIL) // Limit rentals displayed per store

    // Get additional details for each rental
    const rentalsWithDetails = await Promise.all(
      rentals.map(async (rental) => {
        const shelf = rental.shelfId ? await ctx.db.get(rental.shelfId) : null
        const renterProfile = await ctx.db.get(rental.brandProfileId)
        const renter = renterProfile ? await ctx.db.get(renterProfile.userId) : null

        return {
          ...rental,
          shelfName: shelf?.shelfName || "",
          renterName: renterProfile?.brandName || "",
          duration: Math.ceil((rental.endDate - rental.startDate) / (30 * 24 * 60 * 60 * 1000)),
        }
      })
    )

    return rentalsWithDetails
  },
})

// Get monthly payment summary for a store (admin store details page)
export const getStorePayments = query({
  args: {
    profileId: v.id("storeProfiles"),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const auth = await verifyAdminAccess(ctx)
    if (!auth.isAuthenticated || !auth.isAdmin) {
      // Return empty array when not authenticated or not admin
      return []
    }

    const rentals = await ctx.db
      .query("rentalRequests")
      .filter(q => q.eq(q.field("storeProfileId"), args.profileId))
      .filter(q => q.eq(q.field("status"), "active"))
      .take(MAX_RENTALS_PER_STORE_DETAIL) // Limit rentals for payment summary

    // Group by month
    const paymentsByMonth: Record<string, {
      month: string,
      rentedShelves: number,
      totalIncome: number,
      paymentMethod: string,
      status: string
    }> = {}

    rentals.forEach(rental => {
      const date = new Date(rental._creationTime)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!paymentsByMonth[monthKey]) {
        paymentsByMonth[monthKey] = {
          month: monthKey,
          rentedShelves: 0,
          totalIncome: 0,
          paymentMethod: "Credit Card", // Default
          status: "completed"
        }
      }

      paymentsByMonth[monthKey].rentedShelves++
      paymentsByMonth[monthKey].totalIncome += rental.totalAmount || 0
    })

    // Convert to array and sort by month
    return Object.values(paymentsByMonth).sort((a, b) => a.month.localeCompare(b.month))
  },
});
