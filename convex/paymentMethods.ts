import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

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
    
    // Create new payment method
    const paymentMethodId = await ctx.db.insert("paymentMethods", {
      userId,
      type: "bank_transfer",
      bankName: args.bankName,
      accountNumber: args.accountNumber,
      iban: args.iban,
      isDefault: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
    
    const paymentMethods = await ctx.db
      .query("paymentMethods")
      .withIndex("by_user", (q) => q.eq("userId", userId))
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
      updatedAt: new Date().toISOString(),
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