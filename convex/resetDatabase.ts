import { mutation } from "./_generated/server";

/**
 * DANGER: This will delete ALL data from the database
 * Use only in development to reset the database
 */
export const resetAllData = mutation({
  handler: async (ctx) => {
    console.log("⚠️ Starting database reset...");

    const tablesToClear = [
      "adminProfiles",
      "authSessions",
      "authAccounts",
      "notifications",
      "messages",
      "conversations",
      "reviews",
      "payments",
      "rentalRequests",
      "products",
      "shelves",
      "branches",
      "bankAccounts",
      "customerOrders",
      "storeProfiles",
      "brandProfiles",
      "users",
      "emailVerificationOTP",
      "phoneVerificationOTP",
      "auditLogs",
      "supportTickets",
    ];

    const deletionStats: Record<string, number> = {};

    for (const tableName of tablesToClear) {
      try {
        const records = await ctx.db.query(tableName as any).collect();
        let deleteCount = 0;

        for (const record of records) {
          await ctx.db.delete(record._id);
          deleteCount++;
        }

        deletionStats[tableName] = deleteCount;
        console.log(`✓ Cleared ${deleteCount} records from ${tableName}`);
      } catch (error) {
        console.log(`✗ Error clearing ${tableName}:`, error);
        deletionStats[tableName] = -1;
      }
    }

    console.log("✅ Database reset complete!");

    return {
      success: true,
      message: "Database has been completely reset",
      deletionStats,
      totalTables: tablesToClear.length,
      tablesCleared: Object.values(deletionStats).filter(v => v >= 0).length,
    };
  },
});
