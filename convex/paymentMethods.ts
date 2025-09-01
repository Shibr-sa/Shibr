import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getUserProfile } from "./profileHelpers";

// Add bank account for receiving payments
export const addPaymentMethod = mutation({
  args: {
    bankName: v.string(),
    accountHolderName: v.string(),
    iban: v.string(),
    accountNumber: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    // Get user profile
    const profileData = await getUserProfile(ctx, userId);
    if (!profileData) {
      throw new Error("User profile not found");
    }
    
    // Both store and brand owners can add bank accounts
    // Store owners receive rental payments, brand owners might receive refunds
    if (profileData.type !== "store_owner" && profileData.type !== "brand_owner") {
      throw new Error("Only store and brand owners can add bank accounts");
    }
    
    const profileId = profileData.profile._id;
    
    // Check if there's already a default payment method
    const existingMethods = await ctx.db
      .query("paymentMethods")
      .withIndex("by_profile", (q) => q.eq("profileId", profileId as any))
      .collect();
    
    // Determine if this should be default
    const shouldBeDefault = args.isDefault !== undefined ? args.isDefault : existingMethods.length === 0;
    
    // If setting as default, unset other defaults
    if (shouldBeDefault && existingMethods.length > 0) {
      for (const method of existingMethods) {
        if (method.isDefault) {
          await ctx.db.patch(method._id, { isDefault: false });
        }
      }
    }
    
    // Create new bank account
    const paymentMethodId = await ctx.db.insert("paymentMethods", {
      profileId: profileId as any,
      bankName: args.bankName,
      accountHolderName: args.accountHolderName,
      iban: args.iban,
      accountNumber: args.accountNumber,
      isDefault: shouldBeDefault,
      isActive: true, // Always active when created by user, only admin can deactivate
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

// Update bank account details
export const updatePaymentMethod = mutation({
  args: {
    paymentMethodId: v.id("paymentMethods"),
    bankName: v.optional(v.string()),
    accountHolderName: v.optional(v.string()),
    iban: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { paymentMethodId, ...updateData } = args;
    
    // Verify user owns this payment method
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const paymentMethod = await ctx.db.get(paymentMethodId);
    if (!paymentMethod) {
      throw new Error("Payment method not found");
    }
    
    const profileData = await getUserProfile(ctx, userId);
    if (!profileData || profileData.profile._id !== paymentMethod.profileId) {
      throw new Error("Unauthorized to update this payment method");
    }
    
    // If setting as default, unset other defaults first
    if (updateData.isDefault === true && paymentMethod.profileId) {
      const otherMethods = await ctx.db
        .query("paymentMethods")
        .withIndex("by_profile", (q) => q.eq("profileId", paymentMethod.profileId))
        .filter((q) => q.neq(q.field("_id"), paymentMethodId))
        .collect();
      
      for (const method of otherMethods) {
        if (method.isDefault) {
          await ctx.db.patch(method._id, { isDefault: false });
        }
      }
    }
    
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