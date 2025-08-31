import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getUserProfile } from "./profileHelpers";

// Add payment method
export const addPaymentMethod = mutation({
  args: {
    bankName: v.string(),
    accountName: v.string(),
    accountNumber: v.string(),
    iban: v.string(),
    isVirtual: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    // Get user profile to determine profileType
    const profileData = await getUserProfile(ctx, userId);
    if (!profileData) {
      throw new Error("User profile not found");
    }
    
    const profileType = profileData.type === "store_owner" ? "store" : "brand";
    const profileId = profileData.profile._id;
    
    // Create new payment method
    const paymentMethodId = await ctx.db.insert("paymentMethods", {
      profileId: profileId as any,
      profileType,
      type: "bank_transfer",
      bankName: args.bankName,
      iban: args.iban,
      isDefault: true,
      isActive: true,
    });
    
    return { success: true, paymentMethodId };
  },
});

// Get payment methods for user
export const getPaymentMethods = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    
    // Get user profile to find payment methods
    const profileData = await getUserProfile(ctx, userId);
    if (!profileData) {
      return [];
    }
    
    const paymentMethods = await ctx.db
      .query("paymentMethods")
      .withIndex("by_profile", (q) => q.eq("profileId", profileData.profile._id as any))
      .collect();
    
    return paymentMethods;
  },
});

// Update payment method
export const updatePaymentMethod = mutation({
  args: {
    paymentMethodId: v.id("paymentMethods"),
    bankName: v.optional(v.string()),
    accountName: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
    iban: v.optional(v.string()),
    isVirtual: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { paymentMethodId, ...updateData } = args;
    
    // Filter out undefined values
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );
    
    await ctx.db.patch(paymentMethodId, {
      ...filteredData,
    });
    
    return { success: true };
  },
});

// Delete payment method
export const deletePaymentMethod = mutation({
  args: { paymentMethodId: v.id("paymentMethods") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.paymentMethodId);
    return { success: true };
  },
});