import { query, mutation } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { internal } from "./_generated/api"
import { getUserProfile as getUserProfileHelper } from "./profileHelpers"

// Helper query to verify auth is ready
export const verifyAuthReady = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return { isAuthenticated: !!userId, userId };
  },
})

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    return user;
  },
})

export const getCurrentUserWithProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    
    // Get user profile based on their role
    const profileData = await getUserProfileHelper(ctx, userId);
    
    if (!profileData) {
      return {
        ...user,
        profile: null,
        accountType: null
      };
    }
    
    // Convert document storage IDs to URLs if they exist
    let documentUrls: any = {};
    
    if (profileData.type === "store_owner") {
      const profile = profileData.profile as any;
      if (profile.commercialRegisterDocument) {
        documentUrls.commercialRegisterDocumentUrl = await ctx.storage.getUrl(profile.commercialRegisterDocument);
      }
      if (profile.vatCertificate) {
        documentUrls.vatCertificateUrl = await ctx.storage.getUrl(profile.vatCertificate);
      }
    } else if (profileData.type === "brand_owner") {
      const profile = profileData.profile as any;
      if (profile.commercialRegisterDocument) {
        documentUrls.commercialRegisterDocumentUrl = await ctx.storage.getUrl(profile.commercialRegisterDocument);
      }
      if (profile.freelanceLicenseDocument) {
        documentUrls.freelanceLicenseDocumentUrl = await ctx.storage.getUrl(profile.freelanceLicenseDocument);
      }
      if (profile.vatCertificate) {
        documentUrls.vatCertificateUrl = await ctx.storage.getUrl(profile.vatCertificate);
      }
    }
    
    return {
      ...user,
      accountType: profileData.type,
      profile: {
        ...profileData.profile,
        ...documentUrls,
      },
    };
  },
})

// Check if store data is complete
export const checkStoreDataComplete = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const storeProfile = await ctx.db
      .query("storeProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!storeProfile) {
      return false;
    }

    // Check required fields
    const isComplete = !!(
      storeProfile.storeName &&
      storeProfile.businessCategory &&
      storeProfile.commercialRegisterNumber &&
      storeProfile.commercialRegisterDocument
    );

    return isComplete;
  },
});

// Check if brand data is complete
export const checkBrandDataComplete = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const brandProfile = await ctx.db
      .query("brandProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!brandProfile) {
      return { isComplete: false, missingFields: ["profile"] };
    }

    const missingFields = [];

    // Check required fields
    if (!brandProfile.brandName) missingFields.push("brandName");
    if (!brandProfile.businessType) missingFields.push("businessType");
    
    // Check business type specific requirements
    if (brandProfile.businessType === "registered_company") {
      if (!brandProfile.commercialRegisterNumber) {
        missingFields.push("commercialRegisterNumber");
      }
      if (!brandProfile.commercialRegisterDocument) {
        missingFields.push("commercialRegisterDocument");
      }
    } else if (brandProfile.businessType === "freelancer") {
      if (!brandProfile.freelanceLicenseNumber) {
        missingFields.push("freelanceLicenseNumber");
      }
      if (!brandProfile.freelanceLicenseDocument) {
        missingFields.push("freelanceLicenseDocument");
      }
    } else {
      // If businessType is set but not one of the expected values, 
      // still require one of the document sets
      if (!brandProfile.commercialRegisterNumber && !brandProfile.freelanceLicenseNumber) {
        missingFields.push("commercialRegisterNumber or freelanceLicenseNumber");
      }
      if (!brandProfile.commercialRegisterDocument && !brandProfile.freelanceLicenseDocument) {
        missingFields.push("commercialRegisterDocument or freelanceLicenseDocument");
      }
    }
    
    // Don't require phone/email for profile completion - they're in the user table
    // This follows the same pattern as checkStoreDataComplete
    
    return {
      isComplete: missingFields.length === 0,
      missingFields,
    };
  },
});

export const createStoreProfile = mutation({
  args: {
    storeName: v.string(),
    businessCategory: v.string(),
    commercialRegisterNumber: v.string(),
    phoneNumber: v.optional(v.string()),
    email: v.optional(v.string()),
    vatNumber: v.optional(v.string()),
    commercialRegisterDocument: v.optional(v.id("_storage")),
    vatCertificate: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    // Check if any profile already exists for this user
    const existingStore = await ctx.db
      .query("storeProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (existingStore) {
      throw new Error("Store profile already exists");
    }
    
    // Check if user has a brand profile (prevent multiple account types)
    const existingBrand = await ctx.db
      .query("brandProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (existingBrand) {
      throw new Error("User already has a brand profile. Cannot create multiple profile types");
    }
    
    // Create store profile
    const profileId = await ctx.db.insert("storeProfiles", {
      userId,
      isActive: true,
      storeName: args.storeName,
      businessCategory: args.businessCategory,
      commercialRegisterNumber: args.commercialRegisterNumber,
      commercialRegisterDocument: args.commercialRegisterDocument,
    });

    // Get user data for email verification
    const user = await ctx.db.get(userId);
    if (user && user.email) {
      try {
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes

        // Store the OTP
        await ctx.db.insert("emailVerificationOTP", {
          userId,
          email: user.email,
          otp,
          expiresAt,
          verified: false,
          attempts: 0,
          createdAt: Date.now(),
        });

        // Schedule the email to be sent
        await ctx.scheduler.runAfter(0, internal.emailVerification.sendOTPEmail, {
          email: user.email,
          otp,
          userName: user.name || args.storeName,
        });
      } catch (error) {
        // Don't fail profile creation if email fails
      }
    }

    // Return complete profile data with account type
    const profile = await ctx.db.get(profileId);
    return {
      profileId,
      accountType: "store_owner" as const,
      profile
    };
  },
})

export const createBrandProfile = mutation({
  args: {
    brandName: v.string(),
    businessType: v.optional(v.union(
      v.literal("registered_company"),
      v.literal("freelancer")
    )),
    commercialRegisterNumber: v.optional(v.string()),
    freelanceLicenseNumber: v.optional(v.string()),
    commercialRegisterDocument: v.optional(v.id("_storage")),
    freelanceLicenseDocument: v.optional(v.id("_storage")),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    // Check if any profile already exists for this user
    const existingBrand = await ctx.db
      .query("brandProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (existingBrand) {
      throw new Error("Brand profile already exists");
    }
    
    // Check if user has a store profile (prevent multiple account types)
    const existingStore = await ctx.db
      .query("storeProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (existingStore) {
      throw new Error("User already has a store profile. Cannot create multiple profile types");
    }
    
    // Create brand profile
    const profileId = await ctx.db.insert("brandProfiles", {
      userId,
      isActive: true,
      brandName: args.brandName,
      businessType: args.businessType,
      commercialRegisterNumber: args.commercialRegisterNumber,
      freelanceLicenseNumber: args.freelanceLicenseNumber,
      commercialRegisterDocument: args.commercialRegisterDocument,
      freelanceLicenseDocument: args.freelanceLicenseDocument,
      website: args.website,
    });

    // Get user data for email verification
    const user = await ctx.db.get(userId);
    if (user && user.email) {
      try {
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes

        // Store the OTP
        await ctx.db.insert("emailVerificationOTP", {
          userId,
          email: user.email,
          otp,
          expiresAt,
          verified: false,
          attempts: 0,
          createdAt: Date.now(),
        });

        // Schedule the email to be sent
        await ctx.scheduler.runAfter(0, internal.emailVerification.sendOTPEmail, {
          email: user.email,
          otp,
          userName: user.name || args.brandName,
        });
      } catch (error) {
        // Don't fail profile creation if email fails
      }
    }

    // Return complete profile data with account type
    const profile = await ctx.db.get(profileId);
    return {
      profileId,
      accountType: "brand_owner" as const,
      profile
    };
  },
})

export const updateStoreProfile = mutation({
  args: {
    storeName: v.optional(v.string()),
    businessCategory: v.optional(v.string()),
    commercialRegisterNumber: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    email: v.optional(v.string()),
    vatNumber: v.optional(v.string()),
    commercialRegisterDocument: v.optional(v.id("_storage")),
    vatCertificate: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const profile = await ctx.db
      .query("storeProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (!profile) {
      throw new Error("Store profile not found");
    }
    
    await ctx.db.patch(profile._id, args);
    
    return profile._id;
  },
})

export const updateBrandProfile = mutation({
  args: {
    brandName: v.optional(v.string()),
    businessType: v.optional(v.union(
      v.literal("registered_company"),
      v.literal("freelancer")
    )),
    commercialRegisterNumber: v.optional(v.string()),
    freelanceLicenseNumber: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    email: v.optional(v.string()),
    vatNumber: v.optional(v.string()),
    commercialRegisterDocument: v.optional(v.id("_storage")),
    freelanceLicenseDocument: v.optional(v.id("_storage")),
    vatCertificate: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const profile = await ctx.db
      .query("brandProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (!profile) {
      throw new Error("Brand profile not found");
    }
    
    await ctx.db.patch(profile._id, args);
    
    return profile._id;
  },
})

export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profileData = await getUserProfileHelper(ctx, args.userId);
    
    if (!profileData) {
      return null;
    }
    
    const user = await ctx.db.get(args.userId);
    
    return {
      user,
      accountType: profileData.type,
      profile: profileData.profile,
    };
  },
})



// Get user's dashboard based on their account type
export const getUserDashboard = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    
    const profileData = await getUserProfileHelper(ctx, userId);
    
    if (!profileData) {
      return { dashboard: "/signup-complete" }; // Redirect to complete profile
    }
    
    switch (profileData.type) {
      case "store_owner":
        return { dashboard: "/store-dashboard" };
      case "brand_owner":
        return { dashboard: "/brand-dashboard" };
      case "admin":
        return { dashboard: "/admin-dashboard" };
      default:
        return { dashboard: "/" };
    }
  },
})

// Update general settings (name, email, phone)
export const updateGeneralSettings = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Prepare update data
    const updateData: any = {};
    if (args.name !== undefined) updateData.name = args.name;
    if (args.email !== undefined) updateData.email = args.email;
    if (args.phone !== undefined) updateData.phone = args.phone;
    
    // Note: Password update would need special handling through auth system
    // For now, we'll just update the other fields
    
    // Update the auth user record
    await ctx.db.patch(userId, updateData);

    // Phone and email are stored in the user table, not in profiles
    // This follows the same pattern as store profiles

    return { success: true };
  },
})

// Update store-specific data
export const updateStoreData = mutation({
  args: {
    storeName: v.optional(v.string()),
    businessCategory: v.optional(v.string()),
    commercialRegisterNumber: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const storeProfile = await ctx.db
      .query("storeProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!storeProfile) {
      // Create new store profile if it doesn't exist
      if (!args.storeName || !args.businessCategory || !args.commercialRegisterNumber) {
        throw new Error("Store name, business category, and commercial register number are required");
      }
      const newProfileId = await ctx.db.insert("storeProfiles", {
        userId,
        isActive: true,
        storeName: args.storeName,
        businessCategory: args.businessCategory,
        commercialRegisterNumber: args.commercialRegisterNumber,
        website: args.website,
      });
      return { success: true, profileId: newProfileId };
    }

    // Update existing profile
    const updates: any = {};
    if (args.storeName !== undefined) updates.storeName = args.storeName;
    if (args.businessCategory !== undefined) updates.businessCategory = args.businessCategory;
    if (args.commercialRegisterNumber !== undefined) updates.commercialRegisterNumber = args.commercialRegisterNumber;
    if (args.website !== undefined) updates.website = args.website;
    
    // Location is now stored per shelf, not in profile

    await ctx.db.patch(storeProfile._id, updates);
    return { success: true };
  },
})

// Update brand-specific data
export const updateBrandData = mutation({
  args: {
    brandName: v.optional(v.string()),
    businessCategory: v.optional(v.string()),
    businessType: v.optional(v.union(
      v.literal("registered_company"),
      v.literal("freelancer")
    )),
    commercialRegisterNumber: v.optional(v.string()),
    freelanceLicenseNumber: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const brandProfile = await ctx.db
      .query("brandProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!brandProfile) {
      throw new Error("Brand profile not found");
    }

    const updates: any = {};
    if (args.brandName !== undefined) updates.brandName = args.brandName;
    if (args.businessCategory !== undefined) updates.businessCategory = args.businessCategory;
    if (args.businessType !== undefined) updates.businessType = args.businessType;
    if (args.commercialRegisterNumber !== undefined) updates.commercialRegisterNumber = args.commercialRegisterNumber;
    if (args.freelanceLicenseNumber !== undefined) updates.freelanceLicenseNumber = args.freelanceLicenseNumber;
    if (args.website !== undefined) updates.website = args.website;

    await ctx.db.patch(brandProfile._id, updates);
    return { success: true };
  },
})

// Update profile image
export const updateProfileImage = mutation({
  args: {
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Update the auth user's image field
    await ctx.db.patch(userId, {
      image: args.imageUrl,
    });

    return { success: true };
  },
})

// Update business registration document (for stores)
export const updateBusinessRegistrationDocument = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const storeProfile = await ctx.db
      .query("storeProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (storeProfile) {
      await ctx.db.patch(storeProfile._id, {
        commercialRegisterDocument: args.storageId,
      });
      return { success: true };
    }

    const brandProfile = await ctx.db
      .query("brandProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (brandProfile) {
      await ctx.db.patch(brandProfile._id, {
        commercialRegisterDocument: args.storageId,
      });
      return { success: true };
    }

    throw new Error("Profile not found");
  },
})

// Update freelance document (for brands)
export const updateFreelanceDocument = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const brandProfile = await ctx.db
      .query("brandProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!brandProfile) {
      throw new Error("Brand profile not found");
    }

    await ctx.db.patch(brandProfile._id, {
      freelanceLicenseDocument: args.storageId,
    });

    return { success: true };
  },
})