import { v } from "convex/values"
import { query } from "../_generated/server"
import { verifyAdminAccess } from "./helpers"
import { getDateRange } from "../helpers"
import { Id } from "../_generated/dataModel"

// Query limits for detail pages (not main list)
// Note: Main list (getBrands) uses .collect() for accurate search/stats
const MAX_RENTALS_PER_BRAND = 100        // Max rentals to show per brand detail page
const MAX_PRODUCTS_PER_BRAND = 100       // Max active products to show per brand

// Get all brands (brand owners) with their stats for admin dashboard
export const getBrands = query({
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
        totalPages: 0,
        stats: {
          totalBrands: 0,
          brandsChange: 0,
          totalProducts: 0,
          productsChange: 0,
          totalRevenue: 0,
          revenueChange: 0,
        },
      }
    }

    const { searchQuery = "", page, limit, timePeriod = "monthly" } = args;

    // Get ALL brand profiles for accurate search and stats
    // Note: Must use .collect() so search works across all brands
    // and stats calculations are accurate
    const allBrandProfiles = await ctx.db
      .query("brandProfiles")
      .collect() // Get ALL - search/stats require complete data

    // BATCH FETCH 1: Get all users upfront (avoid N+1 queries)
    const userIds = [...new Set(allBrandProfiles.map(p => p.userId))];
    const users = await Promise.all(userIds.map(id => ctx.db.get(id)));
    const userMap = new Map(users.filter(u => u !== null).map(u => [u!._id.toString(), u!]));

    // BATCH FETCH 2: Get ALL products for accurate stats
    // Note: Using .collect() ensures revenue totals are accurate
    const allProducts = await ctx.db
      .query("products")
      .collect(); // Get ALL for accurate revenue calculations

    // Group products by brand
    const productsByBrand = new Map<string, typeof allProducts>();
    for (const product of allProducts) {
      const brandId = product.brandProfileId.toString();
      const existing = productsByBrand.get(brandId) || [];
      existing.push(product);
      productsByBrand.set(brandId, existing);
    }

    // BATCH FETCH 3: Get ALL rentals for accurate stats
    // Note: Using .collect() ensures stats are correct
    const allRentals = await ctx.db
      .query("rentalRequests")
      .collect(); // Get ALL for accurate rental/revenue stats

    // Group rentals by brand
    const rentalsByBrand = new Map<string, typeof allRentals>();
    for (const rental of allRentals) {
      const brandId = rental.brandProfileId.toString();
      const existing = rentalsByBrand.get(brandId) || [];
      existing.push(rental);
      rentalsByBrand.set(brandId, existing);
    }

    // Build brand owners with user data
    const allBrandOwners = allBrandProfiles.map(profile => {
      const user = userMap.get(profile.userId.toString());
      return {
        ...profile,
        email: user?.email
      };
    });

    // Filter by search query
    // Note: emails are already stored lowercase, only normalize search input
    const normalizedQuery = searchQuery.toLowerCase();
    const filteredBrandOwners = searchQuery
      ? allBrandOwners.filter(brand =>
        brand.brandName?.toLowerCase().includes(normalizedQuery) ||
        brand.email?.includes(normalizedQuery)  // email already lowercase in DB
      )
      : allBrandOwners;

    // Get stats for each brand owner (using batched data - NO queries in loop!)
    const brandsWithStats = await Promise.all(
      filteredBrandOwners.map(async (brand) => {
        // Use pre-fetched products (O(1) map lookup)
        const products = productsByBrand.get(brand._id.toString()) || [];
        const totalProducts = products.length;
        const totalProductRevenue = products.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);

        // Use pre-fetched rentals (O(1) map lookup)
        const rentals = rentalsByBrand.get(brand._id.toString()) || [];
        const activeRentals = rentals.filter(r => r.status === "active").length;

        // Get unique stores this brand is working with
        const uniqueStoreIds = new Set(rentals.map(r => r.storeProfileId));
        const storesCount = uniqueStoreIds.size;

        // Use pre-fetched user (O(1) map lookup)
        const user = userMap.get(brand.userId.toString());

        // Profile image is now stored in users.image field as URL string
        const profileImageUrl = user?.image || null;

        // Convert business registration document storage ID to URL
        let businessRegistrationUrl = null;
        const docId = brand.commercialRegisterDocument || brand.freelanceLicenseDocument;
        if (docId) {
          businessRegistrationUrl = await ctx.storage.getUrl(docId);
        }

        return {
          id: brand._id,
          name: brand.brandName,  // Use brand name only
          ownerName: user?.name,  // Add actual owner name from users table
          email: brand.email,
          phoneNumber: user?.phone,
          products: totalProducts,
          stores: storesCount,
          rentals: activeRentals,
          revenue: totalProductRevenue, // Only product sales revenue, not rental costs
          status: brand.isActive ? "active" : "suspended",
          category: brand.businessCategory,
          website: brand.website,  // Now available in schema
          joinDate: brand._creationTime,
          businessRegistration: brand.commercialRegisterNumber || brand.freelanceLicenseNumber,
          businessRegistrationUrl,  // Use converted URL
          profileImageUrl, // Include the profile image URL
        };
      })
    );

    // Sort by creation date (newest first)
    brandsWithStats.sort((a, b) => {
      if (!a.joinDate || !b.joinDate) return 0;
      return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
    });

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBrands = brandsWithStats.slice(startIndex, endIndex);

    // Calculate percentage changes based on timePeriod
    const now = new Date();
    const { startDate: periodStart } = getDateRange(now, timePeriod);
    const { startDate: previousStart } = getDateRange(periodStart, timePeriod);

    // Filter brands created in current period
    const brandsInPeriod = brandsWithStats.filter(brand => {
      const joinDate = new Date(brand.joinDate);
      return joinDate >= periodStart;
    });

    // Filter brands created in previous period
    const brandsInPreviousPeriod = brandsWithStats.filter(brand => {
      const joinDate = new Date(brand.joinDate);
      return joinDate >= previousStart && joinDate < periodStart;
    });

    // Calculate products and revenue for current period brands
    const productsInPeriod = brandsInPeriod.reduce((sum, b) => sum + b.products, 0);
    const revenueInPeriod = brandsInPeriod.reduce((sum, b) => sum + b.revenue, 0);

    // Calculate products and revenue for previous period brands
    const productsInPreviousPeriod = brandsInPreviousPeriod.reduce((sum, b) => sum + b.products, 0);
    const revenueInPreviousPeriod = brandsInPreviousPeriod.reduce((sum, b) => sum + b.revenue, 0);

    // Display period-specific counts
    const displayBrands = brandsInPeriod.length;
    const displayProducts = productsInPeriod;
    const displayRevenue = revenueInPeriod;

    // Calculate percentage changes
    const brandsChange = brandsInPreviousPeriod.length > 0
      ? Math.round(((brandsInPeriod.length - brandsInPreviousPeriod.length) / brandsInPreviousPeriod.length) * 100 * 10) / 10
      : brandsInPeriod.length > 0 ? 100 : 0;

    const productsChange = productsInPreviousPeriod > 0
      ? Math.round(((productsInPeriod - productsInPreviousPeriod) / productsInPreviousPeriod) * 100 * 10) / 10
      : productsInPeriod > 0 ? 100 : 0;

    const revenueChange = revenueInPreviousPeriod > 0
      ? Math.round(((revenueInPeriod - revenueInPreviousPeriod) / revenueInPreviousPeriod) * 100 * 10) / 10
      : revenueInPeriod > 0 ? 100 : 0;

    return {
      items: paginatedBrands,
      totalPages: Math.ceil(brandsWithStats.length / limit),
      stats: {
        totalBrands: displayBrands, // Show period-specific count
        brandsChange,
        totalProducts: displayProducts, // Show period-specific count
        productsChange,
        totalRevenue: displayRevenue, // Show period-specific revenue
        revenueChange,
      },
    };
  },
});

// Get products for a specific brand (admin brand details page)
// Shows products that are currently being displayed on rented shelves
export const getBrandProducts = query({
  args: {
    profileId: v.id("brandProfiles"),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const auth = await verifyAdminAccess(ctx)
    if (!auth.isAuthenticated || !auth.isAdmin) {
      // Return empty array when not authenticated or not admin
      return []
    }

    // Get active rental requests for this brand
    const activeRentals = await ctx.db
      .query("rentalRequests")
      .filter(q => q.and(
        q.eq(q.field("brandProfileId"), args.profileId),
        q.eq(q.field("status"), "active")
      ))
      .take(MAX_PRODUCTS_PER_BRAND) // Limit active products displayed

    // BATCH FETCH: Collect all unique product IDs from all rentals
    const productIds = new Set<Id<"products">>()
    for (const rental of activeRentals) {
      if (rental.selectedProducts && rental.selectedProducts.length > 0) {
        for (const selectedProduct of rental.selectedProducts) {
          productIds.add(selectedProduct.productId)
        }
      }
    }

    // Fetch all products in one batch (avoid N+1 queries)
    const products = await Promise.all(
      Array.from(productIds).map(id => ctx.db.get(id))
    )
    const productMap = new Map(
      products.filter(p => p !== null).map(p => [p!._id.toString(), p!])
    )

    // Now build the results using the pre-fetched product map
    const productsWithRentalQuantities = []

    for (const rental of activeRentals) {
      if (rental.selectedProducts && rental.selectedProducts.length > 0) {
        for (const selectedProduct of rental.selectedProducts) {
          const productId = selectedProduct.productId
          const rentalQuantity = selectedProduct.quantity || 1

          // O(1) map lookup instead of db query
          const product = productMap.get(productId)
          if (product) {
            // Get product image URL - check both mainImage (storage) and imageUrl (external)
            let imageUrl = null

            // Products use imageUrl directly (not storage ID)
            if (product && 'imageUrl' in product && product.imageUrl) {
              imageUrl = product.imageUrl
            }

            productsWithRentalQuantities.push({
              id: product._id,
              name: product && 'name' in product ? product.name : selectedProduct.name,
              category: product && 'category' in product ? product.category : selectedProduct.category,
              price: product && 'price' in product ? product.price : selectedProduct.price,
              quantity: rentalQuantity,  // Use rental request quantity, not total product quantity
              imageUrl,
              sku: product && 'sku' in product ? product.sku : '',
              salesCount: 0,  // Sales count not tracked yet
              createdAt: product._creationTime,
              rentalId: rental._id,  // Track which rental this product belongs to
              shelfId: rental.shelfId,  // Track which shelf this product is on
            })
          }
        }
      }
    }

    // Apply search filter if provided
    let filteredProducts = productsWithRentalQuantities
    if (args.searchQuery && args.searchQuery.trim()) {
      const search = args.searchQuery.toLowerCase()
      filteredProducts = productsWithRentalQuantities.filter(product =>
        product.name?.toLowerCase().includes(search) ||
        product.category?.toLowerCase().includes(search) ||
        product.sku?.toLowerCase().includes(search)
      )
    }

    return filteredProducts
  },
})

// Get rental requests for a specific brand (admin brand details page)
export const getBrandRentals = query({
  args: {
    profileId: v.id("brandProfiles"),
    searchQuery: v.optional(v.string()),
    statusFilter: v.optional(v.string()), // all, completed, needs_collection, upcoming
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
      .filter(q => q.eq(q.field("brandProfileId"), args.profileId))
      .take(MAX_RENTALS_PER_BRAND) // Limit rentals displayed per brand

    // BATCH FETCH: Get all unique shelf IDs and store profile IDs
    const shelfIds = [...new Set(rentals.map(r => r.shelfId))]
    const storeProfileIds = [...new Set(rentals.map(r => r.storeProfileId))]

    // Fetch all shelves and store profiles in parallel batches
    const [shelves, storeProfiles] = await Promise.all([
      Promise.all(shelfIds.map(id => ctx.db.get(id))),
      Promise.all(storeProfileIds.map(id => ctx.db.get(id)))
    ])

    // Create maps for O(1) lookup
    const shelfMap = new Map(shelves.filter(s => s !== null).map(s => [s!._id.toString(), s!]))
    const storeProfileMap = new Map(storeProfiles.filter(s => s !== null).map(s => [s!._id.toString(), s!]))

    // Build results using pre-fetched data (no queries in loop!)
    const rentalsWithDetails = rentals.map(rental => {
      const shelf = shelfMap.get(rental.shelfId.toString())
      const ownerProfile = storeProfileMap.get(rental.storeProfileId.toString())

      return {
        id: rental._id,
        shelfName: shelf?.shelfName || "-",
        storeName: ownerProfile?.storeName || "-",
        duration: `${Math.ceil((rental.endDate - rental.startDate) / (30 * 24 * 60 * 60 * 1000))} months`,
        payment: rental.totalAmount || 0,
        status: rental.status,
        createdAt: rental._creationTime,
        updatedAt: rental._creationTime,
      }
    })

    // Apply search filter if provided
    let filteredRentals = rentalsWithDetails
    if (args.searchQuery && args.searchQuery.trim()) {
      const search = args.searchQuery.toLowerCase()
      filteredRentals = rentalsWithDetails.filter(rental =>
        rental.shelfName?.toLowerCase().includes(search) ||
        rental.storeName?.toLowerCase().includes(search)
      )
    }

    // Apply status filter if provided
    if (args.statusFilter && args.statusFilter !== "all") {
      const now = new Date()
      filteredRentals = filteredRentals.filter(rental => {
        if (args.statusFilter === "completed") {
          return rental.status === "completed"
        } else if (args.statusFilter === "needs_collection") {
          return rental.status === "active" || rental.status === "payment_pending"
        } else if (args.statusFilter === "upcoming") {
          // Parse createdAt date and check if it's in the future or recent
          const rentalDate = new Date(rental.createdAt)
          const daysDiff = Math.floor((rentalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          return rental.status === "pending" || rental.status === "payment_pending" || daysDiff > 0
        }
        return true
      })
    }

    return filteredRentals
  },
})
