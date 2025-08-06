import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Add payment method
export const addPaymentMethod = mutation({
  args: {
    userId: v.id("users"),
    bankName: v.string(),
    accountName: v.string(),
    accountNumber: v.string(),
    iban: v.string(),
    isVirtual: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userId, ...paymentData } = args;
    
    // Create new payment method
    const paymentMethodId = await ctx.db.insert("paymentMethods", {
      userId,
      ...paymentData,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    return { success: true, paymentMethodId };
  },
});

// Get payment methods for user
export const getPaymentMethods = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const paymentMethods = await ctx.db
      .query("paymentMethods")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
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