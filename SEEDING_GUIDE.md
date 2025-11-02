# Store Seeding Guide - Test Data with Logos

This guide explains how to seed your marketplace with test stores, branches, and shelves with logos.

## Quick Start

### Run the Seed Script

```bash
# Using the Convex function directly
bunx convex run seedTestStores

# Or using the Node.js script
bun scripts/seedStoresWithLogos.js
```

## What Gets Created

The seeding process creates:

### 5 Test Stores
1. **الرياض مول - Riyadh Mall** (Shopping Center)
   - 2 branches: Riyadh, Kharj
   - 3 shelves per branch (Electronics, Fashion, Beauty)

2. **جدة بلازا - Jeddah Plaza** (Commercial Center)
   - 1 branch: Jeddah
   - 3 shelves (Beverages, Toys & Gifts, Books)

3. **الدمام ماركت - Dammam Market** (Traditional Market)
   - 1 branch: Dammam
   - 4 shelves (Men's Clothing, Jewelry, Shoes, Watches)

4. **الأحساء جاليريا - Al-Ahsa Gallery** (Art Gallery)
   - 1 branch: Al-Ahsa
   - 3 shelves (Traditional Art, Gifts & Decor, Perfumes)

5. **عنيزة هايبر - Unaizah Hyper** (Large Store)
   - 1 branch: Unaizah
   - 5 shelves (Appliances, Kids, Sports, Furniture, Accessories)

**Total: 5 stores, 8 branches, 18 shelves**

## Adding Logos to Stores

Since Convex functions cannot directly download and store images, you have three options:

### Option 1: Upload via Convex Dashboard (Easiest)

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project
3. Navigate to **Data** tab
4. Find the `_storage` table
5. Upload your logo images:
   - For each store, upload a logo image (PNG, JPG, or WebP)
   - Note the `storageId` that gets assigned
6. Update the shelf records with the image references:
   ```json
   {
     "images": [
       {
         "storageId": "j7b8h9k0l1m2n3o4p5",
         "type": "shelf",
         "order": 0
       }
     ]
   }
   ```

### Option 2: Use the Web App Upload Feature

1. Log in as a store owner to your app
2. Go to **Dashboard → Shelves**
3. Click "Add Shelf" or edit existing shelves
4. Upload logos through the web interface
5. Images are automatically attached to the shelf

### Option 3: Programmatic Upload (Node.js)

Create a script to upload logos programmatically:

```javascript
import { ConvexHttpClient } from "convex/browser"
import fs from "fs"

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL)

async function uploadStoreLogo(imagePath, storeName) {
  // Get upload URL
  const uploadUrl = await client.mutation(api.files.generateUploadUrl, {
    fileType: "image",
    mimeType: "image/png",
  })

  // Read image file
  const imageData = fs.readFileSync(imagePath)

  // Upload image
  const response = await fetch(uploadUrl, {
    method: "POST",
    body: imageData,
  })

  if (!response.ok) {
    throw new Error("Failed to upload image")
  }

  const result = await response.json()
  console.log(`✅ Uploaded logo for ${storeName}: ${result.storageId}`)

  return result.storageId
}

// Usage
const logos = [
  { path: "./public/logos/riyadh-mall.png", store: "الرياض مول" },
  { path: "./public/logos/jeddah-plaza.png", store: "جدة بلازا" },
  { path: "./public/logos/dammam-market.png", store: "الدمام ماركت" },
  { path: "./public/logos/ahsa-gallery.png", store: "الأحساء جاليريا" },
  { path: "./public/logos/unaizah-hyper.png", store: "عنيزة هايبر" },
]

for (const logo of logos) {
  await uploadStoreLogo(logo.path, logo.store)
}
```

## Store Colors & Branding

Each test store has a unique color for visual differentiation:

| Store | Color | Hex Code |
|-------|-------|----------|
| الرياض مول | Red | #FF6B6B |
| جدة بلازا | Teal | #4ECDC4 |
| الدمام ماركت | Blue | #45B7D1 |
| الأحساء جاليريا | Salmon | #FFA07A |
| عنيزة هايبر | Mint | #98D8C8 |

### Create Branded Logos

You can use these colors to create logos using:
- **Figma** (figma.com) - Free design tool
- **Canva** (canva.com) - Easy logo maker
- **Logo Makr** (logomakr.com) - Quick logo generator
- **Adobe Express** - Simple logo creation

Recommended logo dimensions: **400x400px** or **512x512px**

## Product Types Included

The seeded shelves use these product types:

- الإلكترونيات (Electronics)
- الأجهزة المنزلية (Home Appliances)
- الأزياء والملابس (Fashion & Clothing)
- الإكسسوارات (Accessories)
- مستحضرات التجميل (Cosmetics)
- منتجات العناية (Care Products)
- الأطعمة والمشروبات (Food & Beverages)
- القهوة والشاي (Coffee & Tea)
- الألعاب والهوايات (Toys & Hobbies)
- الهدايا (Gifts)
- الكتب والمجلات (Books & Magazines)
- القرطاسية (Stationery)
- الأزياء الرجالية (Men's Fashion)
- المجوهرات (Jewelry)
- الأحذية (Shoes)
- الحقائب والشنط (Bags & Purses)
- الساعات (Watches)
- النظارات الشمسية (Sunglasses)
- الفنون والحرف (Arts & Crafts)
- الديكور والزينة (Decor & Decoration)
- العطور والروائح (Perfumes & Fragrances)
- البخور والعود (Incense & Oud)
- ملابس الأطفال (Children's Clothing)
- منتجات الرضع (Baby Products)
- معدات الرياضة (Sports Equipment)
- ملابس رياضية (Sports Clothing)
- الأثاث (Furniture)

## Pricing Overview

The seeded shelves have realistic pricing:

- **Budget Shelves**: ر.س 1,300 - 1,600 (Electronics, Food)
- **Standard Shelves**: ر.س 1,700 - 2,000 (Fashion, Furniture)
- **Premium Shelves**: ر.س 2,200 - 3,000 (Jewelry, Electronics)

Commission rates: **5% - 15%** depending on category

## Verifying the Seed

### Via Marketplace Page
1. Visit `http://localhost:3000/marketplace`
2. You should see the 5 test stores listed
3. Click on a shelf to view details

### Via Admin Dashboard
1. Log in as admin
2. Go to **Stores** section
3. You'll see all seeded stores listed

### Via Convex Dashboard
1. Go to [Convex Data Tab](https://dashboard.convex.dev)
2. Check `storeProfiles` - should have 5 records
3. Check `branches` - should have 8 records
4. Check `shelves` - should have 18 records

## Troubleshooting

### Seed Script Not Working

**Problem**: `bunx convex run seedTestStores` returns an error

**Solution**:
```bash
# Make sure Convex dev server is running
bunx convex dev

# In another terminal
bunx convex run seedTestStores
```

### Stores Not Appearing in Marketplace

**Problem**: Stores are created but don't appear in the marketplace

**Solution**:
- Verify stores have `status: "active"`
- Check that branches have valid city names
- Ensure shelves are linked to valid branches

### Images/Logos Not Showing

**Problem**: Logos uploaded but not displaying

**Solution**:
1. Verify `storageId` is correct in the database
2. Check that image objects have the correct structure:
   ```json
   {
     "storageId": "valid_id_here",
     "type": "shelf",
     "order": 0
   }
   ```
3. Use `getFileUrl` mutation to test if storage ID is valid

## Clearing Seed Data

To remove all test data and start fresh:

```bash
# Delete from Convex Dashboard > Data tab:
# 1. Delete all records from 'shelves' table
# 2. Delete all records from 'branches' table
# 3. Delete all records from 'storeProfiles' table

# Or use Convex CLI if you have a clear function:
bunx convex run clearTestData
```

## Next Steps

1. **Add Real Logos**: Replace placeholder data with real store logos
2. **Create User Accounts**: Create actual store owner and brand owner accounts
3. **Test Functionality**:
   - Browse marketplace
   - View shelf details
   - Request rentals
   - Process payments
4. **Customize Data**: Edit shelves, branches, and store information as needed

## File Structure

```
/convex/
  └── seedTestStores.ts          # Convex seeding function

/scripts/
  └── seedStoresWithLogos.js     # Node.js wrapper script

/SEEDING_GUIDE.md               # This file
```

## Support

For issues or questions:
1. Check the [Convex Documentation](https://docs.convex.dev)
2. Review the [Project README](./README.md)
3. Check [CLAUDE.md](./CLAUDE.md) for architecture details

---

**Happy testing! 🎉**
