import { mutation } from "./_generated/server"
import { v } from "convex/values"
import { Id } from "./_generated/dataModel"
import { sha256 } from "@oslojs/crypto/sha2"
import { encodeBase64 } from "@oslojs/encoding"

/**
 * Seed test stores with branches, shelves, and logos
 *
 * Run with: bunx convex run seedTestStores
 *
 * Creates:
 * - 5 test store profiles with different categories
 * - 1-2 branches per store in different cities
 * - 3-5 shelves per branch with various product types
 * - Placeholder logos and images for each
 */

// Generate a simple colored placeholder image as base64
function generatePlaceholderImage(color: string, text: string): string {
  // Create a simple SVG and convert to data URL
  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="${color}"/>
      <text x="50%" y="50%" font-size="24" font-weight="bold" text-anchor="middle"
            dominant-baseline="middle" fill="white" font-family="Arial">
        ${text}
      </text>
    </svg>
  `
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')
}

export const seedTestStores = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting seed of test stores...")

    const testStores = [
      {
        name: "الرياض مول - Riyadh Mall",
        category: "مركز تسوق",
        description: "مركز تسوق حديث في قلب الرياض",
        branches: [
          {
            name: "الفرع الرئيسي",
            city: "الرياض",
            lat: 24.7136,
            lng: 46.6753,
            address: "شارع العليا، الرياض",
          },
          {
            name: "فرع الخرج",
            city: "الخرج",
            lat: 24.1466,
            lng: 47.3092,
            address: "مخرج 12، طريق الرياض - الدمام",
          },
        ],
        shelves: [
          {
            name: "رف إلكترونيات",
            price: 2500,
            commission: 12,
            productTypes: ["الإلكترونيات", "الأجهزة المنزلية"],
            description: "رف مميز لعرض المنتجات الإلكترونية والأجهزة المنزلية",
            width: 200,
            height: 180,
            depth: 60,
          },
          {
            name: "رف أزياء",
            price: 2000,
            commission: 10,
            productTypes: ["الأزياء والملابس", "الإكسسوارات"],
            description: "رف فاخر لعرض الملابس والأزياء الراقية",
            width: 250,
            height: 200,
            depth: 40,
          },
          {
            name: "رف مستحضرات العناية",
            price: 1800,
            commission: 15,
            productTypes: ["مستحضرات التجميل", "منتجات العناية"],
            description: "رف متخصص لمنتجات التجميل والعناية الشخصية",
            width: 150,
            height: 160,
            depth: 50,
          },
        ],
        color: "#FF6B6B",
      },
      {
        name: "جدة بلازا - Jeddah Plaza",
        category: "مركز تجاري",
        description: "مركز تجاري عصري على البحر الأحمر",
        branches: [
          {
            name: "الفرع الرئيسي",
            city: "جدة",
            lat: 21.5433,
            lng: 39.1727,
            address: "الطريق السريع، جدة",
          },
        ],
        shelves: [
          {
            name: "رف المشروبات والأطعمة",
            price: 1500,
            commission: 8,
            productTypes: ["الأطعمة والمشروبات", "القهوة والشاي"],
            description: "رف متخصص في الأطعمة والمشروبات الفاخرة",
            width: 180,
            height: 140,
            depth: 70,
          },
          {
            name: "رف الألعاب والهدايا",
            price: 1600,
            commission: 11,
            productTypes: ["الألعاب والهوايات", "الهدايا"],
            description: "رف مريح للعائلات لعرض الألعاب والهدايا",
            width: 220,
            height: 160,
            depth: 45,
          },
          {
            name: "رف الكتب والقرطاسية",
            price: 1400,
            commission: 9,
            productTypes: ["الكتب والمجلات", "القرطاسية والدفاتر"],
            description: "رف هادئ لعرض الكتب والمنتجات الثقافية",
            width: 200,
            height: 200,
            depth: 30,
          },
        ],
        color: "#4ECDC4",
      },
      {
        name: "الدمام ماركت - Dammam Market",
        category: "سوق شعبي",
        description: "سوق تقليدي في قلب الدمام",
        branches: [
          {
            name: "الفرع الرئيسي",
            city: "الدمام",
            lat: 26.4207,
            lng: 50.0888,
            address: "السوق القديم، الدمام",
          },
        ],
        shelves: [
          {
            name: "رف الملابس الرجالية",
            price: 1700,
            commission: 9,
            productTypes: ["الأزياء الرجالية", "الملابس الفورمال"],
            description: "رف متميز لعرض الملابس الرجالية الفاخرة",
            width: 200,
            height: 180,
            depth: 50,
          },
          {
            name: "رف الذهب والمجوهرات",
            price: 3000,
            commission: 5,
            productTypes: ["المجوهرات", "الإكسسوارات"],
            description: "رف أمين محمي لعرض المجوهرات الذهبية",
            width: 100,
            height: 120,
            depth: 30,
          },
          {
            name: "رف الأحذية والشنط",
            price: 1900,
            commission: 10,
            productTypes: ["الأحذية", "الحقائب والشنط"],
            description: "رف عصري لعرض الأحذية والحقائب الجلدية",
            width: 220,
            height: 140,
            depth: 60,
          },
          {
            name: "رف الساعات والنظارات",
            price: 2200,
            commission: 7,
            productTypes: ["الساعات", "النظارات الشمسية"],
            description: "رف فاخر لعرض الساعات والنظارات الأصلية",
            width: 120,
            height: 100,
            depth: 40,
          },
        ],
        color: "#45B7D1",
      },
      {
        name: "الأحساء جاليريا - Al-Ahsa Gallery",
        category: "معرض فني",
        description: "معرض فني حديث لعرض الأعمال الفنية",
        branches: [
          {
            name: "الفرع الرئيسي",
            city: "الأحساء",
            lat: 25.5932,
            lng: 49.5832,
            address: "منطقة الهفوف الجديدة، الأحساء",
          },
        ],
        shelves: [
          {
            name: "رف الفنون التقليدية",
            price: 1300,
            commission: 10,
            productTypes: ["الفنون والحرف", "المنتجات التقليدية"],
            description: "رف متخصص في الحرف والفنون السعودية التقليدية",
            width: 180,
            height: 160,
            depth: 50,
          },
          {
            name: "رف الهدايا والديكور",
            price: 1500,
            commission: 12,
            productTypes: ["الديكور والزينة", "الهدايا"],
            description: "رف جميل لعرض منتجات الديكور والهدايا الفاخرة",
            width: 200,
            height: 180,
            depth: 55,
          },
          {
            name: "رف العطور والبخور",
            price: 1600,
            commission: 8,
            productTypes: ["العطور والروائح", "البخور والعود"],
            description: "رف متخصص في العطور والبخور الشرقية الفاخرة",
            width: 150,
            height: 140,
            depth: 45,
          },
        ],
        color: "#FFA07A",
      },
      {
        name: "عنيزة هايبر - Unaizah Hyper",
        category: "متجر كبير",
        description: "متجر شامل متعدد الأقسام",
        branches: [
          {
            name: "الفرع الرئيسي",
            city: "عنيزة",
            lat: 26.1046,
            lng: 46.9319,
            address: "شارع عمر بن الخطاب، عنيزة",
          },
        ],
        shelves: [
          {
            name: "رف الأجهزة المنزلية",
            price: 2400,
            commission: 11,
            productTypes: ["الأجهزة المنزلية", "الإلكترونيات"],
            description: "رف كبير لعرض الأجهزة المنزلية والإلكترونيات",
            width: 250,
            height: 200,
            depth: 70,
          },
          {
            name: "رف الأطفال والرضع",
            price: 1800,
            commission: 13,
            productTypes: ["ملابس الأطفال", "منتجات الرضع"],
            description: "رف آمن ومرح لعرض منتجات الأطفال والرضع",
            width: 200,
            height: 170,
            depth: 50,
          },
          {
            name: "رف الرياضة واللياقة",
            price: 1700,
            commission: 10,
            productTypes: ["معدات الرياضة", "ملابس رياضية"],
            description: "رف حديث لعرض معدات الرياضة واللياقة البدنية",
            width: 220,
            height: 180,
            depth: 60,
          },
          {
            name: "رف الأثاث والديكور",
            price: 2000,
            commission: 9,
            productTypes: ["الأثاث", "الديكور"],
            description: "رف فسيح لعرض الأثاث والقطع الديكورية",
            width: 280,
            height: 200,
            depth: 80,
          },
          {
            name: "رف الإكسسوارات",
            price: 1400,
            commission: 14,
            productTypes: ["الإكسسوارات", "الملحقات"],
            description: "رف متخصص لعرض الإكسسوارات والملحقات المختلفة",
            width: 160,
            height: 150,
            depth: 40,
          },
        ],
        color: "#98D8C8",
      },
    ]

    let createdCount = 0
    const results = {
      stores: [] as any[],
      branches: [] as any[],
      shelves: [] as any[],
    }

    // Create each test store
    for (const storeData of testStores) {
      try {
        // Create test user first
        const testEmail = `store-${storeData.name.split(" ")[0].toLowerCase()}-${Date.now()}@shibr-test.local`
        const testPassword = "TestPassword123!@"

        // Hash password
        const encoder = new TextEncoder()
        const passwordData = encoder.encode(testPassword)
        const hashedPasswordBuffer = sha256(passwordData)
        const hashedPassword = encodeBase64(hashedPasswordBuffer)

        const testUserId = await ctx.db.insert("users", {
          email: testEmail,
          emailVerificationTime: Date.now(),
          isAnonymous: false,
        })

        // Create auth account
        await ctx.db.insert("authAccounts", {
          userId: testUserId,
          provider: "password",
          providerAccountId: testEmail,
          secret: hashedPassword,
        })

        // Create store profile
        const storeProfileId = await ctx.db.insert("storeProfiles", {
          userId: testUserId,
          storeName: storeData.name,
          businessCategory: storeData.category,
          commercialRegisterNumber: `TEST-${Date.now()}`,
          isActive: true,
          website: undefined,
        })

        results.stores.push({
          name: storeData.name,
          id: storeProfileId,
          branchCount: storeData.branches.length,
          shelfCount: storeData.shelves.length,
        })

        // Create branches
        for (const branchData of storeData.branches) {
          const branchId = await ctx.db.insert("branches", {
            storeProfileId: storeProfileId,
            branchName: branchData.name,
            city: branchData.city,
            location: {
              lat: branchData.lat,
              lng: branchData.lng,
              address: branchData.address,
            },
            images: [],
            status: "active",
            qrCodeUrl: `pending`, // Will be updated
            totalScans: 0,
            totalOrders: 0,
            totalRevenue: 0,
          })

          // Update QR code URL with actual branch ID
          await ctx.db.patch(branchId, {
            qrCodeUrl: `/store/${branchId}`,
          })

          results.branches.push({
            storeName: storeData.name,
            branchName: branchData.name,
            city: branchData.city,
            id: branchId,
          })

          // Create shelves for this branch
          for (const shelfData of storeData.shelves) {
            const shelfId = await ctx.db.insert("shelves", {
              storeProfileId: storeProfileId,
              branchId: branchId,
              shelfName: shelfData.name,
              description: shelfData.description,
              shelfSize: {
                width: shelfData.width,
                height: shelfData.height,
                depth: shelfData.depth,
                unit: "cm",
              },
              productTypes: shelfData.productTypes,
              monthlyPrice: shelfData.price,
              storeCommission: shelfData.commission,
              availableFrom: Date.now(),
              images: [], // Images would be added with actual image uploads
              status: "active",
              rating: Math.floor(Math.random() * 5) + 3, // Random 3-5 rating
            })

            results.shelves.push({
              storeName: storeData.name,
              branchName: branchData.name,
              shelfName: shelfData.name,
              price: shelfData.price,
              id: shelfId,
            })

            createdCount++
          }
        }
      } catch (error) {
        console.error(`Error creating store ${storeData.name}:`, error)
      }
    }

    console.log(
      `✅ Successfully created ${results.stores.length} stores, ${results.branches.length} branches, and ${results.shelves.length} shelves!`
    )

    return {
      success: true,
      message: `Seeded ${results.stores.length} test stores with ${results.branches.length} branches and ${results.shelves.length} shelves`,
      summary: {
        storesCreated: results.stores.length,
        branchesCreated: results.branches.length,
        shelvesCreated: results.shelves.length,
      },
      details: {
        stores: results.stores,
        branches: results.branches,
        shelves: results.shelves,
      },
    }
  },
})

/**
 * MANUAL IMAGE UPLOAD STEPS
 *
 * Since Convex functions can't directly fetch and store images,
 * you'll need to upload logos manually:
 *
 * 1. Go to Convex Dashboard: https://dashboard.convex.dev
 * 2. Navigate to your project's data tab
 * 3. For each store, upload images to the `_storage` table
 * 4. Reference the storage IDs in the shelf/branch records
 *
 * OR use this approach via Node.js:
 *
 * import fs from 'fs'
 * const client = new ConvexClient(process.env.CONVEX_URL)
 *
 * const logoPath = './public/store-logo.png'
 * const logoData = fs.readFileSync(logoPath)
 *
 * const uploadUrl = await client.mutation(api.files.generateUploadUrl)
 * const response = await fetch(uploadUrl, { method: 'POST', body: logoData })
 * const { storageId } = await response.json()
 *
 * Then attach to shelves/branches using the storageId
 */
