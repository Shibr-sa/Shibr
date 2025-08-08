import { mutation } from "./_generated/server"

// Sample coordinates for major Saudi cities
const cityCoordinates = {
  "الرياض": { lat: 24.7136, lng: 46.6753 },
  "جدة": { lat: 21.5433, lng: 39.1728 },
  "الدمام": { lat: 26.3927, lng: 49.9777 },
  "المدينة المنورة": { lat: 24.5247, lng: 39.5692 },
  "مكة المكرمة": { lat: 21.4225, lng: 39.8262 },
  "الخبر": { lat: 26.2172, lng: 50.1971 },
  "الطائف": { lat: 21.4858, lng: 40.5441 },
  "تبوك": { lat: 28.3838, lng: 36.5550 },
}

// Helper function to add random offset to coordinates (within city bounds)
function addRandomOffset(lat: number, lng: number) {
  const latOffset = (Math.random() - 0.5) * 0.1 // ~5.5km radius
  const lngOffset = (Math.random() - 0.5) * 0.1
  return {
    latitude: lat + latOffset,
    longitude: lng + lngOffset,
  }
}

export const seedStores = mutation({
  handler: async (ctx) => {
    // Check if we already have stores
    const existingStores = await ctx.db.query("shelves").take(1)
    if (existingStores.length > 0) {
      return { message: "Stores already seeded" }
    }

    // Create sample store owner users first
    const storeOwners = []
    for (let i = 1; i <= 5; i++) {
      const owner = await ctx.db.insert("users", {
        email: `store${i}@example.com`,
        password: "password123", // In production, this should be hashed
        fullName: `Store Owner ${i}`,
        phoneNumber: `050000000${i}`,
        accountType: "store-owner",
        storeName: `متجر رقم ${i}`,
        storeType: ["بقالة", "مطعم", "كافيه", "صيدلية", "متجر أزياء"][i - 1],
        isActive: true,
        isEmailVerified: true,
        storeDataComplete: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferredLanguage: "ar",
      })
      storeOwners.push(owner)
    }

    // Create sample shelves
    const shelves = [
      {
        ownerId: storeOwners[0],
        shelfName: "رف البقالة المميز",
        city: "الرياض",
        branch: "حي النزهة",
        monthlyPrice: 1500,
        discountPercentage: 10,
        finalPrice: 1350,
        availableFrom: new Date().toISOString(),
        isAvailable: true,
        length: "120cm",
        width: "60cm",
        depth: "40cm",
        productType: "مواد غذائية",
        description: "رف مميز في موقع استراتيجي بالقرب من المدخل الرئيسي",
        address: "شارع الملك فهد، حي النزهة، الرياض",
        ...addRandomOffset(cityCoordinates["الرياض"].lat, cityCoordinates["الرياض"].lng),
        status: "approved" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        ownerId: storeOwners[1],
        shelfName: "رف المطعم الفاخر",
        city: "جدة",
        branch: "حي الروضة",
        monthlyPrice: 2000,
        discountPercentage: 15,
        finalPrice: 1700,
        availableFrom: new Date().toISOString(),
        isAvailable: true,
        length: "150cm",
        width: "70cm",
        depth: "50cm",
        productType: "منتجات غذائية",
        description: "رف في مطعم راقي يستقبل عملاء من الفئة المميزة",
        address: "شارع التحلية، حي الروضة، جدة",
        ...addRandomOffset(cityCoordinates["جدة"].lat, cityCoordinates["جدة"].lng),
        status: "approved" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        ownerId: storeOwners[2],
        shelfName: "رف الكافيه العصري",
        city: "الدمام",
        branch: "حي الشاطئ",
        monthlyPrice: 1800,
        discountPercentage: 5,
        finalPrice: 1710,
        availableFrom: new Date().toISOString(),
        isAvailable: true,
        length: "100cm",
        width: "50cm",
        depth: "35cm",
        productType: "مشروبات ووجبات خفيفة",
        description: "رف في كافيه عصري يزوره الشباب والعائلات",
        address: "كورنيش الدمام، حي الشاطئ",
        ...addRandomOffset(cityCoordinates["الدمام"].lat, cityCoordinates["الدمام"].lng),
        status: "approved" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        ownerId: storeOwners[3],
        shelfName: "رف الصيدلية الصحية",
        city: "المدينة المنورة",
        branch: "حي السلام",
        monthlyPrice: 1200,
        discountPercentage: 0,
        finalPrice: 1200,
        availableFrom: new Date().toISOString(),
        isAvailable: true,
        length: "80cm",
        width: "40cm",
        depth: "30cm",
        productType: "منتجات صحية",
        description: "رف في صيدلية مركزية بموقع ممتاز",
        address: "طريق الملك عبدالله، حي السلام، المدينة المنورة",
        ...addRandomOffset(cityCoordinates["المدينة المنورة"].lat, cityCoordinates["المدينة المنورة"].lng),
        status: "approved" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        ownerId: storeOwners[4],
        shelfName: "رف متجر الأزياء",
        city: "الرياض",
        branch: "حي العليا",
        monthlyPrice: 2500,
        discountPercentage: 20,
        finalPrice: 2000,
        availableFrom: new Date().toISOString(),
        isAvailable: true,
        length: "200cm",
        width: "80cm",
        depth: "60cm",
        productType: "ملابس واكسسوارات",
        description: "رف واسع في متجر أزياء راقي في قلب العليا",
        address: "شارع العليا العام، حي العليا، الرياض",
        ...addRandomOffset(cityCoordinates["الرياض"].lat, cityCoordinates["الرياض"].lng),
        status: "approved" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        ownerId: storeOwners[0],
        shelfName: "رف السوبر ماركت",
        city: "جدة",
        branch: "حي الحمراء",
        monthlyPrice: 1600,
        discountPercentage: 8,
        finalPrice: 1472,
        availableFrom: new Date().toISOString(),
        isAvailable: true,
        length: "140cm",
        width: "65cm",
        depth: "45cm",
        productType: "منتجات استهلاكية",
        description: "رف في سوبر ماركت كبير يخدم حي سكني مزدحم",
        address: "شارع الأمير سلطان، حي الحمراء، جدة",
        ...addRandomOffset(cityCoordinates["جدة"].lat, cityCoordinates["جدة"].lng),
        status: "approved" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    // Insert all shelves
    for (const shelf of shelves) {
      await ctx.db.insert("shelves", shelf)
    }

    return { 
      message: "Successfully seeded stores", 
      count: shelves.length 
    }
  },
})