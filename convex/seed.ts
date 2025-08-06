import { mutation } from "./_generated/server"

// Seed function to create initial admin user
// Run this once to create an admin account
export const createAdminUser = mutation({
  handler: async (ctx) => {
    // Check if admin already exists
    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "admin@shibr.com"))
      .first()

    if (existingAdmin) {
      return { message: "Admin user already exists" }
    }

    // Create admin user
    const adminId = await ctx.db.insert("users", {
      email: "admin@shibr.com",
      password: "admin123", // Change this in production!
      fullName: "System Administrator",
      phoneNumber: "+966500000000",
      accountType: "admin",
      isActive: true,
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preferredLanguage: "en",
    })

    return { 
      message: "Admin user created successfully", 
      adminId,
      credentials: {
        email: "admin@shibr.com",
        password: "admin123"
      }
    }
  },
})

// Seed function to create test users
export const createTestUsers = mutation({
  handler: async (ctx) => {
    const testUsers = [
      {
        email: "store@test.com",
        password: "test123",
        fullName: "Test Store Owner",
        phoneNumber: "+966501234567",
        accountType: "store-owner" as const,
        storeName: "Test Electronics Store",
        commercialRegister: "1234567890",
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferredLanguage: "ar" as const,
      },
      {
        email: "brand@test.com",
        password: "test123",
        fullName: "Test Brand Owner",
        phoneNumber: "+966507654321",
        accountType: "brand-owner" as const,
        brandName: "Test Fashion Brand",
        commercialRegister: "0987654321",
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferredLanguage: "en" as const,
      },
    ]

    const created = []
    
    for (const user of testUsers) {
      // Check if user already exists
      const existing = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", user.email))
        .first()

      if (!existing) {
        const userId = await ctx.db.insert("users", user)
        created.push({ email: user.email, password: user.password, accountType: user.accountType })
      }
    }

    return {
      message: `Created ${created.length} test users`,
      users: created,
    }
  },
})