import { v } from "convex/values"
import { mutation, query, internalQuery } from "./_generated/server"

// Get platform settings (including commission percentages)
export const getPlatformSettings = query({
  args: {},
  handler: async (ctx) => {
    const allSettings = await ctx.db
      .query("platformSettings")
      .collect()

    // Return default values if database is empty
    if (allSettings.length === 0) {
      return {
        brandSalesCommission: 8,
        storeRentCommission: 10,
        updatedAt: new Date().toISOString(),
      }
    }

    // Convert key-value pairs to object
    const settings: any = {
      brandSalesCommission: 8,
      storeRentCommission: 10,
      updatedAt: new Date().toISOString(),
    }

    for (const setting of allSettings) {
      if (setting.key === "brandSalesCommission" ||
          setting.key === "storeRentCommission") {
        settings[setting.key] = setting.value
      }
      if (setting.updatedAt > settings.updatedAt) {
        settings.updatedAt = setting.updatedAt
      }
    }

    return settings
  },
})

// Internal query for platform settings (callable from mutations)
export const internalGetPlatformSettings = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allSettings = await ctx.db
      .query("platformSettings")
      .collect()

    // Return default values if database is empty
    if (allSettings.length === 0) {
      return {
        brandSalesCommission: 8,
        storeRentCommission: 10,
        updatedAt: new Date().toISOString(),
      }
    }

    // Convert key-value pairs to object
    const settings: any = {
      brandSalesCommission: 8,
      storeRentCommission: 10,
      updatedAt: new Date().toISOString(),
    }

    for (const setting of allSettings) {
      if (setting.key === "brandSalesCommission" ||
          setting.key === "storeRentCommission") {
        settings[setting.key] = setting.value
      }
      if (setting.updatedAt > settings.updatedAt) {
        settings.updatedAt = setting.updatedAt
      }
    }

    return settings
  },
})

// Update platform settings (admin only)
export const updatePlatformSettings = mutation({
  args: {
    brandSalesCommission: v.optional(v.number()),
    storeRentCommission: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Admin authentication is handled at the API level

    // Validate commission percentages
    if (args.brandSalesCommission !== undefined && (args.brandSalesCommission < 0 || args.brandSalesCommission > 100)) {
      throw new Error("Brand sales commission must be between 0 and 100")
    }
    if (args.storeRentCommission !== undefined && (args.storeRentCommission < 0 || args.storeRentCommission > 100)) {
      throw new Error("Store rent commission must be between 0 and 100")
    }

    // Update or create individual settings
    const settingsToUpdate = [
      { key: "brandSalesCommission", value: args.brandSalesCommission },
      { key: "storeRentCommission", value: args.storeRentCommission },
    ].filter(setting => setting.value !== undefined)

    const now = Date.now()
    let updated = 0
    let created = 0

    for (const setting of settingsToUpdate) {
      // Check if this specific setting exists
      const existingSetting = await ctx.db
        .query("platformSettings")
        .withIndex("by_key", (q) => q.eq("key", setting.key))
        .first()

      if (existingSetting) {
        // Update existing setting
        await ctx.db.patch(existingSetting._id, {
          value: setting.value,
          updatedAt: now,
        })
        updated++
      } else {
        // Create new setting
        await ctx.db.insert("platformSettings", {
          key: setting.key,
          value: setting.value,
          description: `Platform setting for ${setting.key}`,
          updatedAt: now,
        })
        created++
      }
    }

    return {
      success: true,
      action: updated > 0 ? "updated" : "created",
      updated,
      created
    }
  },
})