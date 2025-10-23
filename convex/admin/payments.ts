import { v } from "convex/values"
import { query } from "../_generated/server"
import { verifyAdminAccess } from "./helpers"

// Get all payments/transactions for admin dashboard
export const getPayments = query({
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

    // Get ALL payments for accurate search
    // Note: Must use .collect() so search works across all payments
    let payments = await ctx.db.query("payments").collect() // Get ALL - search requires complete data

    // Filter by status if specified
    if (status !== "all") {
      payments = payments.filter(payment => {
        if (status === "paid") {
          return payment.status === "completed"
        } else if (status === "unpaid") {
          // "unpaid" filter no longer makes sense since payments are only created after success
          // Return payments that failed or were refunded
          return payment.status === "failed" || payment.status === "refunded"
        }
        return true
      })
    }

    // BATCH FETCH 1: Get all unique rental request IDs
    const rentalIds = [...new Set(payments.map(p => p.rentalRequestId))];
    const rentals = await Promise.all(rentalIds.map(id => ctx.db.get(id)));
    const rentalMap = new Map(rentals.filter(r => r !== null).map(r => [r!._id.toString(), r!]));

    // BATCH FETCH 2: Get all unique brand and store profile IDs from rentals
    const brandProfileIds = [...new Set(rentals.filter(r => r !== null).map(r => r!.brandProfileId))];
    const storeProfileIds = [...new Set(rentals.filter(r => r !== null).map(r => r!.storeProfileId))];
    const shelfIds = [...new Set(rentals.filter(r => r !== null).map(r => r!.shelfId))];

    // Fetch all profiles and shelves in parallel
    const [brandProfiles, storeProfiles, shelves] = await Promise.all([
      Promise.all(brandProfileIds.map(id => ctx.db.get(id))),
      Promise.all(storeProfileIds.map(id => ctx.db.get(id))),
      Promise.all(shelfIds.map(id => ctx.db.get(id)))
    ]);

    // Create maps for O(1) lookup
    const brandProfileMap = new Map(brandProfiles.filter(p => p !== null).map(p => [p!._id.toString(), p!]));
    const storeProfileMap = new Map(storeProfiles.filter(p => p !== null).map(p => [p!._id.toString(), p!]));
    const shelfMap = new Map(shelves.filter(s => s !== null).map(s => [s!._id.toString(), s!]));

    // BATCH FETCH 3: Get all unique user IDs from profiles
    const userIds = [...new Set([
      ...brandProfiles.filter(p => p !== null).map(p => p!.userId),
      ...storeProfiles.filter(p => p !== null).map(p => p!.userId)
    ])];
    const users = await Promise.all(userIds.map(id => ctx.db.get(id)));
    const userMap = new Map(users.filter(u => u !== null).map(u => [u!._id.toString(), u!]));

    // Build payment details using pre-fetched data (no queries in loop!)
    const paymentsWithDetails = payments.map(payment => {
      // O(1) map lookups instead of queries
      const rental = rentalMap.get(payment.rentalRequestId.toString())
      if (!rental) return null

      const brandProfile = brandProfileMap.get(rental.brandProfileId.toString())
      const storeProfile = storeProfileMap.get(rental.storeProfileId.toString())

      if (!brandProfile || !storeProfile) return null

      const brandUser = userMap.get(brandProfile.userId.toString())
      const storeUser = userMap.get(storeProfile.userId.toString())

      const shelf = shelfMap.get(rental.shelfId.toString())
      if (!shelf) return null

      return {
        id: payment._id,
        transactionReference: payment.transactionReference,
        type: payment.type,
        merchant: brandUser?.name || brandProfile.brandName,
        merchantEmail: brandUser?.email,
        merchantProfileId: brandProfile._id,
        store: storeProfile.storeName || storeUser?.name || "",
        storeEmail: storeUser?.email || "",
        storeProfileId: storeProfile._id,
        shelfName: shelf.shelfName,
        date: payment.paymentDate,
        amount: payment.amount,
        platformFee: payment.platformFee || 0,
        netAmount: payment.netAmount || payment.amount,
        method: payment.paymentMethod || "card",
        status: payment.status === "completed" ? "paid" : "unpaid",
        paymentStatus: payment.status,
        transferStatus: payment.transferStatus || null,
        tapTransferId: payment.tapTransferId || null,
        startDate: rental.startDate,
        endDate: rental.endDate,
        description: payment.description || `Shelf rental payment from ${brandProfile.brandName} to شبر Platform`,
        toProfileId: payment.toProfileId,
      }
    });

    // Filter out null entries
    const validPayments = paymentsWithDetails.filter(Boolean) as NonNullable<typeof paymentsWithDetails[0]>[];

    // Apply search filter
    const filteredPayments = searchQuery
      ? validPayments.filter(payment =>
        payment.store?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.transactionReference?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : validPayments;

    // Sort by date (newest first)
    filteredPayments.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

    // Calculate stats
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get all payments (not just filtered) for stats
    const allPaymentsWithDetails = paymentsWithDetails.filter(Boolean) as NonNullable<typeof paymentsWithDetails[0]>[];

    // Total received (all paid payments)
    const paidPayments = allPaymentsWithDetails.filter(p => p.status === "paid");
    const totalReceived = paidPayments.reduce((sum, p) => sum + p.amount, 0);

    // Current month payments
    const currentMonthPaymentsList = paidPayments.filter(p => {
      const paymentDate = new Date(p.date);
      return paymentDate >= currentMonth;
    });
    const currentMonthTotal = currentMonthPaymentsList.reduce((sum, p) => sum + p.amount, 0);

    // Previous month payments (for comparison)
    const previousMonthPaymentsList = paidPayments.filter(p => {
      const paymentDate = new Date(p.date);
      return paymentDate >= previousMonth && paymentDate <= previousMonthEnd;
    });
    const previousMonthTotal = previousMonthPaymentsList.reduce((sum, p) => sum + p.amount, 0);

    // Pending payments
    const pendingPaymentsList = allPaymentsWithDetails.filter(p => p.status === "unpaid");
    const pendingTotal = pendingPaymentsList.reduce((sum, p) => sum + p.amount, 0);

    // Previous month pending (for comparison)
    const previousPendingList = allPaymentsWithDetails.filter(p => {
      const paymentDate = new Date(p.date);
      return p.status === "unpaid" && paymentDate >= previousMonth && paymentDate <= previousMonthEnd;
    });
    const previousPendingTotal = previousPendingList.reduce((sum, p) => sum + p.amount, 0);

    // Total invoices issued
    const totalInvoices = allPaymentsWithDetails.length;
    const currentMonthInvoices = allPaymentsWithDetails.filter(p => {
      const paymentDate = new Date(p.date);
      return paymentDate >= currentMonth;
    }).length;
    const previousMonthInvoices = allPaymentsWithDetails.filter(p => {
      const paymentDate = new Date(p.date);
      return paymentDate >= previousMonth && paymentDate <= previousMonthEnd;
    }).length;

    // Calculate percentage changes
    const totalReceivedChange = previousMonthTotal > 0
      ? Math.round(((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 * 10) / 10
      : currentMonthTotal > 0 ? 100 : 0;

    const currentMonthChange = previousMonthTotal > 0
      ? Math.round(((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 * 10) / 10
      : currentMonthTotal > 0 ? 100 : 0;

    const pendingChange = previousPendingTotal > 0
      ? Math.round(((pendingTotal - previousPendingTotal) / previousPendingTotal) * 100 * 10) / 10
      : pendingTotal > 0 ? 100 : 0;

    const invoicesChange = previousMonthInvoices > 0
      ? Math.round(((currentMonthInvoices - previousMonthInvoices) / previousMonthInvoices) * 100 * 10) / 10
      : currentMonthInvoices > 0 ? 100 : 0;

    return {
      items: paginatedPayments,
      totalPages: Math.ceil(filteredPayments.length / limit),
      stats: {
        totalReceived,
        totalReceivedChange,
        currentMonthPayments: currentMonthTotal,
        currentMonthChange,
        pendingPayments: pendingTotal,
        pendingChange,
        invoicesIssued: totalInvoices,
        invoicesChange,
      },
    };
  },
});

// Get rental request details (used in payment context)
export const getRentalRequest = query({
  args: {
    shelfId: v.id("shelves"),
  },
  handler: async (ctx, args) => {
    // Find active rental request for this shelf
    const rentalRequest = await ctx.db
      .query("rentalRequests")
      .filter(q =>
        q.and(
          q.eq(q.field("shelfId"), args.shelfId),
          q.eq(q.field("status"), "active")
        )
      )
      .first()

    if (!rentalRequest) {
      return null
    }

    // Get the brand profile and user
    const requester = await ctx.db.get(rentalRequest.brandProfileId)
    const requesterUser = requester ? await ctx.db.get(requester.userId) : null

    return {
      ...rentalRequest,
      renterName: requester?.brandName || requesterUser?.name || "-",
      renterEmail: requesterUser?.email || "-",
      renterPhone: requesterUser?.phone || "-",
      commercialRegistry: requester?.commercialRegisterDocument || null,
    }
  }
})
