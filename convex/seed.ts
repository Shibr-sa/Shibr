import { mutation } from "./_generated/server";

export const seedSampleData = mutation({
  handler: async (ctx) => {
    // Check if data already exists
    const existingUsers = await ctx.db.query("users").take(1);
    if (existingUsers.length > 0) {
      return { message: "Data already exists, skipping seed" };
    }

    // Create sample store owners
    const storeOwner1 = await ctx.db.insert("users", {
      email: "store1@example.com",
      password: "password123",
      fullName: "أحمد محمد",
      phoneNumber: "0501234567",
      accountType: "store-owner",
      storeName: "متجر الأزياء",
      storeType: "fashion",
      businessRegistration: "1234567890",
      isActive: true,
      isEmailVerified: true,
      storeDataComplete: true,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      updatedAt: new Date().toISOString(),
      preferredLanguage: "ar",
    });

    const storeOwner2 = await ctx.db.insert("users", {
      email: "store2@example.com",
      password: "password123",
      fullName: "فاطمة علي",
      phoneNumber: "0507654321",
      accountType: "store-owner",
      storeName: "متجر العطور",
      storeType: "beauty",
      businessRegistration: "0987654321",
      isActive: true,
      isEmailVerified: true,
      storeDataComplete: true,
      createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days ago
      updatedAt: new Date().toISOString(),
      preferredLanguage: "ar",
    });

    // Create sample brand owners
    const brandOwner1 = await ctx.db.insert("users", {
      email: "brand1@example.com",
      password: "password123",
      fullName: "خالد سعيد",
      phoneNumber: "0509876543",
      accountType: "brand-owner",
      brandName: "Nike",
      brandType: "sports",
      businessRegistration: "1122334455",
      isActive: true,
      isEmailVerified: true,
      brandDataComplete: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      updatedAt: new Date().toISOString(),
      preferredLanguage: "ar",
    });

    const brandOwner2 = await ctx.db.insert("users", {
      email: "brand2@example.com",
      password: "password123",
      fullName: "سارة أحمد",
      phoneNumber: "0503456789",
      accountType: "brand-owner",
      brandName: "Zara",
      brandType: "fashion",
      businessRegistration: "5544332211",
      isActive: true,
      isEmailVerified: true,
      brandDataComplete: true,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      updatedAt: new Date().toISOString(),
      preferredLanguage: "ar",
    });

    // Create sample shelves for store owners
    const shelf1 = await ctx.db.insert("shelves", {
      ownerId: storeOwner1,
      shelfName: "رف العرض الأمامي",
      city: "الرياض",
      branch: "حي النخيل",
      monthlyPrice: 2500,
      discountPercentage: 10,
      finalPrice: 2250,
      availableFrom: new Date().toISOString(),
      isAvailable: true,
      length: "180",
      width: "90",
      depth: "45",
      productType: "ملابس",
      description: "رف عرض أمامي في موقع استراتيجي",
      address: "شارع الملك فهد، مبنى 23",
      status: "approved",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const shelf2 = await ctx.db.insert("shelves", {
      ownerId: storeOwner1,
      shelfName: "رف الزاوية",
      city: "الرياض",
      branch: "حي العليا",
      monthlyPrice: 1800,
      discountPercentage: 15,
      finalPrice: 1530,
      availableFrom: new Date().toISOString(),
      isAvailable: false,
      length: "120",
      width: "60",
      depth: "40",
      productType: "إكسسوارات",
      status: "rented",
      renterId: brandOwner1,
      rentalStartDate: new Date().toISOString(),
      rentalEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      rentalPrice: 1530,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const shelf3 = await ctx.db.insert("shelves", {
      ownerId: storeOwner2,
      shelfName: "رف العطور المميز",
      city: "جدة",
      branch: "الكورنيش",
      monthlyPrice: 3500,
      discountPercentage: 5,
      finalPrice: 3325,
      availableFrom: new Date().toISOString(),
      isAvailable: true,
      length: "200",
      width: "100",
      depth: "50",
      productType: "عطور",
      status: "approved",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create sample products for brand owners
    await ctx.db.insert("products", {
      ownerId: brandOwner1,
      name: "حذاء رياضي",
      code: "PRD-001",
      category: "أحذية",
      price: 350,
      currency: "SAR",
      quantity: 150,
      totalSales: 89,
      totalRevenue: 31150,
      shelfCount: 3,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await ctx.db.insert("products", {
      ownerId: brandOwner1,
      name: "قميص رياضي",
      code: "PRD-002",
      category: "ملابس",
      price: 180,
      currency: "SAR",
      quantity: 200,
      totalSales: 156,
      totalRevenue: 28080,
      shelfCount: 5,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await ctx.db.insert("products", {
      ownerId: brandOwner2,
      name: "فستان سهرة",
      code: "PRD-003",
      category: "ملابس نسائية",
      price: 450,
      currency: "SAR",
      quantity: 80,
      totalSales: 45,
      totalRevenue: 20250,
      shelfCount: 2,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create sample rental requests
    await ctx.db.insert("rentalRequests", {
      conversationId: await ctx.db.insert("conversations", {
        brandOwnerId: brandOwner1,
        storeOwnerId: storeOwner1,
        shelfId: shelf2,
        status: "active",
        brandOwnerUnreadCount: 0,
        storeOwnerUnreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      shelfId: shelf2,
      brandOwnerId: brandOwner1,
      storeOwnerId: storeOwner1,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      productType: "أحذية رياضية",
      productDescription: "مجموعة من الأحذية الرياضية الحديثة",
      productCount: 25,
      monthlyPrice: 1530,
      totalPrice: 4590,
      status: "active",
      paymentConfirmedAt: new Date().toISOString(),
      paymentVerifiedAt: new Date().toISOString(),
      activatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    });

    // Create another pending rental request
    await ctx.db.insert("rentalRequests", {
      conversationId: await ctx.db.insert("conversations", {
        brandOwnerId: brandOwner2,
        storeOwnerId: storeOwner1,
        shelfId: shelf1,
        status: "pending",
        brandOwnerUnreadCount: 0,
        storeOwnerUnreadCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      shelfId: shelf1,
      brandOwnerId: brandOwner2,
      storeOwnerId: storeOwner1,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 97 * 24 * 60 * 60 * 1000).toISOString(),
      productType: "ملابس نسائية",
      productDescription: "تشكيلة من الفساتين والملابس النسائية",
      productCount: 40,
      monthlyPrice: 2250,
      totalPrice: 6750,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    });

    // Create admin user
    await ctx.db.insert("users", {
      email: "admin@shibr.sa",
      password: "Admin@123",
      fullName: "مدير النظام",
      phoneNumber: "0500000000",
      accountType: "admin",
      isActive: true,
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preferredLanguage: "ar",
    });

    return {
      message: "Sample data seeded successfully",
      counts: {
        users: 5,
        shelves: 3,
        products: 3,
        rentalRequests: 2,
      }
    };
  },
});