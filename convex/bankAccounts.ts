import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getUserProfile } from "./profileHelpers";

// Add bank account for receiving payouts
export const addBankAccount = mutation({
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
    // Store owners receive rental payouts, brand owners might receive refunds
    if (profileData.type !== "store_owner" && profileData.type !== "brand_owner") {
      throw new Error("Only store and brand owners can add bank accounts");
    }
    
    const profileId = profileData.profile._id;
    
    // Check if there's already a default bank account
    const existingAccounts = await ctx.db
      .query("bankAccounts")
      .withIndex("by_profile", (q) => q.eq("profileId", profileId as any))
      .collect();
    
    // Determine if this should be default
    const shouldBeDefault = args.isDefault !== undefined ? args.isDefault : existingAccounts.length === 0;

    // If setting as default, unset other defaults
    if (shouldBeDefault && existingAccounts.length > 0) {
      for (const account of existingAccounts) {
        if (account.isDefault) {
          await ctx.db.patch(account._id, { isDefault: false });
        }
      }
    }
    
    // Create new bank account
    const bankAccountId = await ctx.db.insert("bankAccounts", {
      profileId: profileId as any,
      bankName: args.bankName,
      accountHolderName: args.accountHolderName,
      iban: args.iban,
      accountNumber: args.accountNumber,
      isDefault: shouldBeDefault,
      isActive: true, // Always active when created by user, only admin can deactivate
    });
    
    return { success: true, bankAccountId };
  },
});

// Get bank accounts for user
export const getBankAccounts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    
    // Get user profile to find bank accounts
    const profileData = await getUserProfile(ctx, userId);
    if (!profileData) {
      return [];
    }
    
    const bankAccounts = await ctx.db
      .query("bankAccounts")
      .withIndex("by_profile", (q) => q.eq("profileId", profileData.profile._id as any))
      .collect();

    return bankAccounts;
  },
});

// Update bank account details
export const updateBankAccount = mutation({
  args: {
    bankAccountId: v.id("bankAccounts"),
    bankName: v.optional(v.string()),
    accountHolderName: v.optional(v.string()),
    iban: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { bankAccountId, ...updateData } = args;

    // Verify user owns this bank account
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const bankAccount = await ctx.db.get(bankAccountId);
    if (!bankAccount) {
      throw new Error("Bank account not found");
    }
    
    const profileData = await getUserProfile(ctx, userId);
    if (!profileData || profileData.profile._id !== bankAccount.profileId) {
      throw new Error("Unauthorized to update this bank account");
    }
    
    // If setting as default, unset other defaults first
    if (updateData.isDefault === true && bankAccount.profileId) {
      const otherAccounts = await ctx.db
        .query("bankAccounts")
        .withIndex("by_profile", (q) => q.eq("profileId", bankAccount.profileId))
        .filter((q) => q.neq(q.field("_id"), bankAccountId))
        .collect();

      for (const account of otherAccounts) {
        if (account.isDefault) {
          await ctx.db.patch(account._id, { isDefault: false });
        }
      }
    }
    
    // Filter out undefined values
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );
    
    await ctx.db.patch(bankAccountId, {
      ...filteredData,
    });
    
    return { success: true };
  },
});

// Delete bank account
export const deleteBankAccount = mutation({
  args: { bankAccountId: v.id("bankAccounts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.bankAccountId);
    return { success: true };
  },
});

// Get bank account by ID (for admin use)
export const getBankAccountById = query({
  args: {
    bankAccountId: v.id("bankAccounts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.bankAccountId);
  },
});

// Get bank accounts by profile ID (for admin payouts)
export const getBankAccountsByProfile = query({
  args: {
    profileId: v.union(
      v.id("storeProfiles"),
      v.id("brandProfiles")
    ),
  },
  handler: async (ctx, args) => {
    const bankAccounts = await ctx.db
      .query("bankAccounts")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId as any))
      .collect();

    return bankAccounts;
  },
});