import { query, mutation } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { v } from "convex/values"
import { getUserProfile as getUserProfileHelper } from "./profileHelpers"

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

// Create or update user profile (used during signup)
export const createOrUpdateUserProfile = mutation({
  args: {
    accountType: v.union(
      v.literal("store_owner"),
      v.literal("brand_owner"),
      v.literal("admin")
    ),
    // Store owner fields
    storeName: v.optional(v.string()),
    businessType: v.optional(v.string()),
    storeCommercialRegisterNumber: v.optional(v.string()),
    // Brand owner fields
    brandName: v.optional(v.string()),
    brandBusinessType: v.optional(v.union(
      v.literal("registered_company"),
      v.literal("freelancer")
    )),
    brandCommercialRegisterNumber: v.optional(v.string()),
    freelanceLicenseNumber: v.optional(v.string()),
    // Common fields
    phoneNumber: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if profile already exists
    const existingProfile = await getUserProfileHelper(ctx, userId);
    if (existingProfile) {
      // Profile already exists, could update it here if needed
      return { success: true, profileId: existingProfile.profile._id };
    }

    // Create appropriate profile based on account type
    if (args.accountType === "store_owner") {
      if (!args.storeName || !args.businessType || !args.storeCommercialRegisterNumber) {
        throw new Error("Store name, business type, and commercial register number are required for store owners");
      }
      const profileId = await ctx.db.insert("storeProfiles", {
        userId,
        isActive: true,
        storeName: args.storeName,
        businessType: args.businessType,
        commercialRegisterNumber: args.storeCommercialRegisterNumber,
      });
      return { success: true, profileId };
    } else if (args.accountType === "brand_owner") {
      const profileId = await ctx.db.insert("brandProfiles", {
        userId,
        isActive: true,
        brandName: args.brandName,
        businessType: args.brandBusinessType,
        commercialRegisterNumber: args.brandCommercialRegisterNumber,
        freelanceLicenseNumber: args.freelanceLicenseNumber,
      });
      return { success: true, profileId };
    } else if (args.accountType === "admin") {
      const profileId = await ctx.db.insert("adminProfiles", {
        userId,
        isActive: true,
        adminRole: "support",
        permissions: [],
        phoneNumber: args.phoneNumber,
        email: args.email,
      });
      return { success: true, profileId };
    }

    throw new Error("Invalid account type");
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
      storeProfile.businessType &&
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
    businessType: v.string(),
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
    
    // Check if profile already exists
    const existing = await ctx.db
      .query("storeProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (existing) {
      throw new Error("Store profile already exists");
    }
    
    // Create store profile
    const profileId = await ctx.db.insert("storeProfiles", {
      userId,
      isActive: true,
      storeName: args.storeName,
      businessType: args.businessType,
      commercialRegisterNumber: args.commercialRegisterNumber,
      commercialRegisterDocument: args.commercialRegisterDocument,
    });
    
    return profileId;
  },
})

export const createBrandProfile = mutation({
  args: {
    brandName: v.string(),
    businessType: v.union(
      v.literal("registered_company"),
      v.literal("freelancer")
    ),
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
    
    // Check if profile already exists
    const existing = await ctx.db
      .query("brandProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (existing) {
      throw new Error("Brand profile already exists");
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
    
    return profileId;
  },
})

export const updateStoreProfile = mutation({
  args: {
    storeName: v.optional(v.string()),
    businessType: v.optional(v.string()),
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

export const getUsersByType = query({
  args: {
    accountType: v.union(
      v.literal("store_owner"),
      v.literal("brand_owner"),
      v.literal("admin")
    )
  },
  handler: async (ctx, args) => {
    let profiles: any[] = [];
    
    switch (args.accountType) {
      case "store_owner":
        profiles = await ctx.db.query("storeProfiles").collect();
        break;
      case "brand_owner":
        profiles = await ctx.db.query("brandProfiles").collect();
        break;
      case "admin":
        profiles = await ctx.db.query("adminProfiles").collect();
        break;
    }
    
    const usersWithProfiles = await Promise.all(
      profiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        return {
          user,
          profile,
          accountType: args.accountType,
        };
      })
    );
    
    return usersWithProfiles.filter(u => u.user !== null);
  },
})

export const checkUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { hasProfile: false, accountType: null };
    }
    
    const profileData = await getUserProfileHelper(ctx, userId);
    
    if (!profileData) {
      return { hasProfile: false, accountType: null };
    }
    
    return {
      hasProfile: true,
      accountType: profileData.type,
    };
  },
})



// Admin function to create admin profile
export const createAdminProfile = mutation({
  args: {
    userId: v.id("users"),
    adminRole: v.union(
      v.literal("super_admin"),
      v.literal("support"),
      v.literal("finance"),
      v.literal("operations")
    ),
    permissions: v.array(v.string()),
    department: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // This should only be called by super admins
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }
    
    // Check if caller is a super admin
    const callerProfile = await ctx.db
      .query("adminProfiles")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .first();
    
    if (!callerProfile || callerProfile.adminRole !== "super_admin") {
      throw new Error("Only super admins can create admin profiles");
    }
    
    // Check if profile already exists
    const existing = await ctx.db
      .query("adminProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    if (existing) {
      throw new Error("Admin profile already exists");
    }
    
    // Create admin profile
    const profileId = await ctx.db.insert("adminProfiles", {
      userId: args.userId,
      isActive: true,
      adminRole: args.adminRole,
      permissions: args.permissions,
      department: args.department,
      phoneNumber: args.phoneNumber,
      email: args.email,
    });
    
    return profileId;
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
    businessType: v.optional(v.string()),
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
      if (!args.storeName || !args.businessType || !args.commercialRegisterNumber) {
        throw new Error("Store name, business type, and commercial register number are required");
      }
      const newProfileId = await ctx.db.insert("storeProfiles", {
        userId,
        isActive: true,
        storeName: args.storeName,
        businessType: args.businessType,
        commercialRegisterNumber: args.commercialRegisterNumber,
        website: args.website,
      });
      return { success: true, profileId: newProfileId };
    }

    // Update existing profile
    const updates: any = {};
    if (args.storeName !== undefined) updates.storeName = args.storeName;
    if (args.businessType !== undefined) updates.businessType = args.businessType;
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