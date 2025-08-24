import { query, mutation } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"

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
    
    // Get user profile
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    // Convert document storage IDs to URLs if they exist
    if (profile) {
      const brandCommercialRegisterDocumentUrl = profile.brandCommercialRegisterDocument
        ? await ctx.storage.getUrl(profile.brandCommercialRegisterDocument)
        : null;
      const freelanceLicenseDocumentUrl = profile.freelanceLicenseDocument
        ? await ctx.storage.getUrl(profile.freelanceLicenseDocument)
        : null;
      const commercialRegisterDocumentUrl = profile.commercialRegisterDocument
        ? await ctx.storage.getUrl(profile.commercialRegisterDocument)
        : null;
      
      return {
        ...user,
        profile: {
          ...profile,
          brandCommercialRegisterDocumentUrl,
          freelanceLicenseDocumentUrl,
          commercialRegisterDocumentUrl,
        },
      };
    }
    
    return {
      ...user,
      profile,
    };
  },
})

export const createOrUpdateUserProfile = mutation({
  args: {
    accountType: v.union(
      v.literal("store_owner"),
      v.literal("brand_owner"),
      v.literal("admin")
    ),
    fullName: v.string(),
    phoneNumber: v.string(),
    email: v.string(),
    
    // Store owner fields
    storeName: v.optional(v.string()),
    storeType: v.optional(v.string()),
    commercialRegisterNumber: v.optional(v.string()),
    storeLocation: v.optional(v.object({
      city: v.string(),
      area: v.string(),
      address: v.string(),
    })),
    
    // Brand owner fields
    brandName: v.optional(v.string()),
    businessType: v.optional(v.union(
      v.literal("registered_company"),
      v.literal("freelancer")
    )),
    brandCommercialRegisterNumber: v.optional(v.string()),
    freelanceLicenseNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    // First check if profile exists by userId
    let existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    // If no profile found by userId, check by email (for pre-created admin profiles)
    if (!existingProfile) {
      existingProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();
      
      // If found by email, update the userId to link it to the authenticated user
      if (existingProfile) {
        await ctx.db.patch(existingProfile._id, {
          userId,
          updatedAt: new Date().toISOString(),
        });
      }
    }
    
    const now = new Date().toISOString();
    
    if (existingProfile) {
      // Don't override admin account type if it's already set
      const updateData = { ...args };
      if (existingProfile.accountType === "admin") {
        // Preserve admin account type and related fields
        updateData.accountType = "admin";
        // Preserve admin-specific fields
        if (existingProfile.adminRole) {
          (updateData as any).adminRole = existingProfile.adminRole;
        }
        if (existingProfile.permissions) {
          (updateData as any).permissions = existingProfile.permissions;
        }
        delete updateData.storeName;
        delete updateData.brandName;
        delete updateData.storeType;
        delete updateData.storeLocation;
        delete updateData.commercialRegisterNumber;
        delete updateData.brandCommercialRegisterNumber;
        delete updateData.businessType;
        delete updateData.freelanceLicenseNumber;
      }
      
      // Update existing profile
      await ctx.db.patch(existingProfile._id, {
        ...updateData,
        updatedAt: now,
      });
      
      // Return the profile ID and actual account type
      return {
        profileId: existingProfile._id,
        accountType: updateData.accountType
      };
    } else {
      // Create new profile
      const profileId = await ctx.db.insert("userProfiles", {
        userId,
        ...args,
        isVerified: false,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      
      // Return the profile ID and account type
      return {
        profileId,
        accountType: args.accountType
      };
    }
  },
})

export const getUserProfile = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    return profile;
  },
})

export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }
    
    // Get user profile
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    return {
      ...user,
      profile,
    };
  },
})

export const checkStoreDataComplete = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!profile || profile.accountType !== "store_owner") {
      return false;
    }
    
    // Check all required store owner fields (similar to brand owner)
    // 1. Basic Information
    const hasBasicInfo = !!(
      profile.fullName && 
      profile.phoneNumber && 
      profile.email
    );
    
    // 2. Store Information
    const hasStoreInfo = !!(
      profile.storeName && 
      profile.storeType
    );
    
    // 3. Business Registration & Document
    const hasBusinessRegistration = !!(
      profile.commercialRegisterNumber && 
      profile.commercialRegisterDocument
    );
    
    // All requirements must be met
    return hasBasicInfo && hasStoreInfo && hasBusinessRegistration;
  },
})

export const checkBrandDataComplete = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!profile || profile.accountType !== "brand_owner") {
      return false;
    }
    
    // Check all required brand owner fields
    // 1. Basic Information
    const hasBasicInfo = !!(
      profile.fullName && 
      profile.phoneNumber && 
      profile.email
    );
    
    // 2. Brand Information
    const hasBrandInfo = !!(
      profile.brandName && 
      profile.businessType
    );
    
    // 3. Business Registration & Document
    let hasBusinessRegistration = false;
    if (profile.businessType === "registered_company") {
      hasBusinessRegistration = !!(
        profile.brandCommercialRegisterNumber && 
        profile.brandCommercialRegisterDocument
      );
    } else if (profile.businessType === "freelancer") {
      hasBusinessRegistration = !!(
        profile.freelanceLicenseNumber && 
        profile.freelanceLicenseDocument
      );
    }
    
    // All requirements must be met
    return hasBasicInfo && hasBrandInfo && hasBusinessRegistration;
  },
})

export const updateProfileImage = mutation({
  args: {
    profileImageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    // Get the storage URL for the image
    const imageUrl = await ctx.storage.getUrl(args.profileImageId);
    if (!imageUrl) {
      throw new Error("Failed to get image URL");
    }
    
    // Update the user's image field
    await ctx.db.patch(userId, {
      image: imageUrl,
    });
    
    // Also update the profile if it exists
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (profile) {
      await ctx.db.patch(profile._id, {
        updatedAt: new Date().toISOString(),
      });
    }
    
    return { success: true, imageUrl };
  },
})

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const profiles = await ctx.db.query("userProfiles").collect();
    
    return users.map(user => {
      const profile = profiles.find(p => p.userId === user._id);
      return { ...user, profile };
    });
  },
})

export const updateGeneralSettings = mutation({
  args: {
    ownerName: v.optional(v.string()),
    email: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    password: v.optional(v.string()),
    preferredLanguage: v.optional(v.union(v.literal("ar"), v.literal("en"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    // Update user fields if provided
    const userUpdates: any = {};
    if (args.ownerName) {
      userUpdates.name = args.ownerName;
    }
    if (args.email) {
      userUpdates.email = args.email;
    }
    
    if (Object.keys(userUpdates).length > 0) {
      await ctx.db.patch(userId, userUpdates);
    }
    
    // Update profile
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (profile) {
      const profileUpdates: any = {
        updatedAt: new Date().toISOString(),
      };
      
      if (args.ownerName) {
        profileUpdates.fullName = args.ownerName;
      }
      if (args.phoneNumber) {
        profileUpdates.phoneNumber = args.phoneNumber;
      }
      if (args.email) {
        profileUpdates.email = args.email;
      }
      
      await ctx.db.patch(profile._id, profileUpdates);
    }
    
    return { success: true };
  },
})

export const updateBrandData = mutation({
  args: {
    brandName: v.string(),
    brandType: v.optional(v.string()), // The type of products/business (e.g., "Electronics")
    isFreelance: v.boolean(),
    businessRegistration: v.optional(v.string()),
    website: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (!profile) {
      throw new Error("Profile not found");
    }
    
    await ctx.db.patch(profile._id, {
      brandName: args.brandName,
      brandType: args.brandType, // Store the actual brand/product type
      businessType: args.isFreelance ? "freelancer" : "registered_company",
      brandCommercialRegisterNumber: !args.isFreelance ? args.businessRegistration : undefined,
      freelanceLicenseNumber: args.isFreelance ? args.businessRegistration : undefined,
      phoneNumber: args.phoneNumber || profile.phoneNumber,
      updatedAt: new Date().toISOString(),
    });
    
    return { success: true };
  },
})

export const updateStoreData = mutation({
  args: {
    storeName: v.string(),
    storeType: v.string(),
    businessRegistration: v.optional(v.string()),
    isFreelance: v.boolean(),
    website: v.optional(v.string()),
    phoneNumber: v.string(),
    storeLocation: v.optional(v.object({
      city: v.string(),
      area: v.string(),
      address: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (!profile) {
      throw new Error("Profile not found");
    }
    
    const updateData: any = {
      storeName: args.storeName,
      storeType: args.storeType,
      phoneNumber: args.phoneNumber,
      updatedAt: new Date().toISOString(),
    };
    
    // Add commercial registration or set business type to freelancer
    if (args.isFreelance) {
      updateData.businessType = "freelancer";
    } else if (args.businessRegistration) {
      updateData.commercialRegisterNumber = args.businessRegistration;
    }
    
    // Add optional fields
    if (args.website) {
      updateData.website = args.website;
    }
    
    if (args.storeLocation) {
      updateData.storeLocation = args.storeLocation;
    }
    
    await ctx.db.patch(profile._id, updateData);
    
    return { success: true };
  },
})

export const updateBusinessRegistrationDocument = mutation({
  args: {
    documentId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (!profile) {
      throw new Error("Profile not found");
    }
    
    await ctx.db.patch(profile._id, {
      // Map to correct field name based on business type
      ...(profile.accountType === "brand_owner" && profile.businessType === "registered_company" 
        ? { brandCommercialRegisterDocument: args.documentId } 
        : profile.businessType === "freelancer" 
        ? { freelanceLicenseDocument: args.documentId }
        : profile.accountType === "store_owner"
        ? { commercialRegisterDocument: args.documentId }
        : {}),
      updatedAt: new Date().toISOString(),
    });
    
    return { success: true };
  },
})

export const updateFreelanceDocument = mutation({
  args: {
    documentId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (!profile) {
      throw new Error("Profile not found");
    }
    
    await ctx.db.patch(profile._id, {
      freelanceLicenseDocument: args.documentId,
      updatedAt: new Date().toISOString(),
    });
    
    return { success: true };
  },
})