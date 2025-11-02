# Complete Seeding Guide - Test Data with Logos & Images 🎨

This document explains how to seed your Shibr marketplace with complete test data including store logos, branch images, and shelf product images.

## What's Included

You now have a **complete seeding system** that creates:

- ✅ **5 Professional Test Stores** with SVG logos
- ✅ **8 Store Branches** across Saudi Arabia with images
- ✅ **18 Product Shelves** with images and product displays
- ✅ **All images uploaded to Convex storage** automatically
- ✅ **Realistic pricing, categories, and descriptions**

## Quick Start (30 seconds)

```bash
# Terminal 1: Start dev server
bun dev

# Terminal 2: Seed stores with logos (wait for Terminal 1 to fully load)
bun seed:logos
```

Done! Visit http://localhost:3000/marketplace to see the results.

## How It Works

### 1. Logo Generation
The seeding script generates professional SVG logos for each store with:
- Store name in Arabic and English
- Unique brand color (gradient background)
- Store building graphics
- Professional styling

### 2. Image Generation
The script generates and uploads:
- **Branch exterior images** (storefront mockups)
- **Shelf product images** (product display layouts)
- All as professionally styled SVG graphics

### 3. Image Upload
All generated SVGs are:
- Converted to image format
- Uploaded to Convex storage via the API
- Storage IDs returned for database references

### 4. Database Creation
The seeding function:
- Creates store profiles
- Creates branches with image references
- Creates shelves with image references
- Links everything together properly

## File Structure

```
/convex/
  └── seedTestStoresWithLogos.ts    # Main seeding mutation

/scripts/
  └── seedWithUploadedLogos.js      # Upload script + seeding orchestration

/SEEDING_COMPLETE.md               # This file
/SEED_QUICK_START.md               # Quick reference
/SEEDING_GUIDE.md                  # Detailed guide
```

## Commands

### Seed with Full Logos & Images
```bash
bun seed:logos
```
- Generates SVG logos for 5 stores
- Generates images for 8 branches
- Generates images for 18 shelves
- Uploads all to Convex storage
- Creates stores, branches, shelves with images
- Takes ~30-60 seconds depending on internet speed

### Seed Basic Data Only (No Images)
```bash
bun seed
```
- Creates stores, branches, shelves
- No image generation or uploads
- Much faster
- Useful for quick data structure testing

### Seed Admin User
```bash
bun seed:admin
```
- Creates initial admin user (if not exists)
- Credentials: `it@shibr.io` / `wwadnj0aw2nc@!!`

## Test Store Details

### الرياض مول (Riyadh Mall) 🔴
- **Category**: Shopping Center
- **Color**: #FF6B6B (Red)
- **Branches**:
  - Riyadh (main)
  - Kharj
- **Shelves** (3):
  - Electronics (2,500 ر.س/month)
  - Fashion (2,000 ر.س/month)
  - Beauty Products (1,800 ر.س/month)

### جدة بلازا (Jeddah Plaza) 🟦
- **Category**: Commercial Center
- **Color**: #4ECDC4 (Teal)
- **Branches**:
  - Jeddah (main)
- **Shelves** (3):
  - Beverages & Food (1,500 ر.س/month)
  - Toys & Gifts (1,600 ر.س/month)
  - Books & Stationery (1,400 ر.س/month)

### الدمام ماركت (Dammam Market) 🔵
- **Category**: Traditional Market
- **Color**: #45B7D1 (Blue)
- **Branches**:
  - Dammam (main)
- **Shelves** (4):
  - Men's Fashion (1,700 ر.س/month)
  - Jewelry (3,000 ر.س/month)
  - Shoes & Bags (1,900 ر.س/month)
  - Watches & Glasses (2,200 ر.س/month)

### الأحساء جاليريا (Al-Ahsa Gallery) 🟠
- **Category**: Art Gallery
- **Color**: #FFA07A (Salmon)
- **Branches**:
  - Al-Ahsa (main)
- **Shelves** (3):
  - Traditional Art (1,300 ر.س/month)
  - Gifts & Decor (1,500 ر.س/month)
  - Perfumes & Oud (1,600 ر.س/month)

### عنيزة هايبر (Unaizah Hyper) 💚
- **Category**: Large Store
- **Color**: #98D8C8 (Mint)
- **Branches**:
  - Unaizah (main)
- **Shelves** (5):
  - Appliances (2,400 ر.س/month)
  - Kids & Baby (1,800 ر.س/month)
  - Sports & Fitness (1,700 ر.س/month)
  - Furniture & Decor (2,000 ر.س/month)
  - Accessories (1,400 ر.س/month)

## Database Schema

### Created Records
- **5** storeProfiles (stores)
- **8** branches (locations)
- **18** shelves (rental listings)
- **32+** storage entries (logos and images)

### Image References
Each branch has:
```json
{
  "images": [
    {
      "storageId": "j7b8h9k0l1m2n3o4p5",
      "type": "exterior",
      "order": 0
    }
  ]
}
```

Each shelf has:
```json
{
  "images": [
    {
      "storageId": "q1w2e3r4t5y6u7i8o9",
      "type": "shelf",
      "order": 0
    }
  ]
}
```

## Verification

### 1. Check Marketplace Page
Visit: `http://localhost:3000/marketplace`

You should see:
- 5 store sections
- 8 locations represented
- 18 shelf listings total
- Images displaying for each shelf
- Filter options by city and product type

### 2. Check Convex Dashboard
1. Go to https://dashboard.convex.dev
2. Select your project
3. Check data:
   - **storeProfiles**: 5 records
   - **branches**: 8 records
   - **shelves**: 18 records
   - **_storage**: 32+ files (logos and images)

### 3. Check Admin Dashboard
1. Log in as admin: `it@shibr.io`
2. Go to Stores section
3. View all seeded stores

## Troubleshooting

### Problem: Script shows "not found" error
```bash
# Solution: Make sure Convex dev server is running
bun dev
# Wait for compilation, then in another terminal:
bun seed:logos
```

### Problem: Upload failures
```bash
# Solution: Retry - sometimes needs server warm-up
bun seed:logos
```

### Problem: Images not appearing in UI
1. Reload marketplace page (Ctrl+R)
2. Check browser console for errors (F12)
3. Verify in Convex dashboard that images exist
4. Try clearing browser cache

### Problem: Duplicate data if running multiple times
```bash
# Clear and reseed:
# 1. Delete all from storeProfiles, branches, shelves tables in Convex Dashboard
# 2. Then run: bun seed:logos
```

## Technical Details

### SVG Generation
- Each store logo is a unique SVG with brand colors
- Branch images show storefront with signage
- Shelf images show product displays
- All optimized for web display

### Upload Process
- Uses Convex file storage API
- Automatic MIME type detection
- Returns storage IDs for database references
- Handles concurrent uploads efficiently

### Image Optimization
- SVG format for small file size
- Professional styling and layouts
- Responsive design ready
- Works on all devices

## Customization

### Change Store Information
Edit `/convex/seedTestStoresWithLogos.ts`:
```typescript
{
  id: "riyadh-mall",
  name: "Your Store Name",
  category: "Your Category",
  // ... other properties
}
```

### Change Colors
Modify the `color` property:
```typescript
color: "#FF6B6B", // Change to your preferred hex color
```

### Add More Shelves
Add to the `shelves` array:
```typescript
{
  id: "new-shelf",
  branchIndex: 0,
  name: "New Shelf Name",
  price: 2000,
  commission: 10,
  // ... other properties
}
```

### Regenerate Specific Images
Edit image generation functions in `/scripts/seedWithUploadedLogos.js`:
- `generateStoreLogo()`
- `generateBranchExteriorImage()`
- `generateShelfImage()`

## Performance Notes

- First seed takes 30-60 seconds (image generation + uploads)
- Subsequent runs are idempotent (create same data)
- Concurrent image uploads for speed
- SVG format keeps file sizes small

## File Sizes

Typical generated images:
- Store logo: 2-3 KB
- Branch image: 3-4 KB
- Shelf image: 4-5 KB
- **Total per complete seed**: ~100-150 KB of data

## Next Steps After Seeding

1. ✅ **View Marketplace** - Browse stores with logos
2. ✅ **Create Test Account** - Sign up as brand owner
3. ✅ **Request Rental** - Test the full workflow
4. ✅ **Process Payment** - Test payment integration
5. ✅ **View Admin Dashboard** - Manage stores as admin
6. ✅ **Customize Data** - Edit stores and shelf information

## FAQ

**Q: Can I use real images instead of generated SVGs?**
A: Yes, replace the image generation code with your own image files in the `/scripts/seedWithUploadedLogos.js` file.

**Q: Can I seed different data?**
A: Yes, edit the store definitions in both files to match your needs.

**Q: Do images persist after redeployment?**
A: Yes, images are stored in Convex storage which persists across deployments.

**Q: Can I mix seeded and manual data?**
A: Yes, seeded data and manually created stores coexist peacefully.

**Q: What if I want to keep old data and add more?**
A: Change the store IDs in the seed script to create new stores alongside existing ones.

## Support

For issues:
1. Check Convex dev server is running: `bun dev`
2. Check console output for specific error messages
3. Review Convex dashboard for data validation
4. Check browser console (F12) for client-side errors

For detailed API documentation:
- Convex: https://docs.convex.dev
- Project: See [CLAUDE.md](./CLAUDE.md)

---

**Ready to seed? Run `bun seed:logos` now!** 🚀

🎉 Your marketplace will be populated with professional test data in seconds!
