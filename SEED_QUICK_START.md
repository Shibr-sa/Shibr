# Quick Start: Seed Test Stores with Logos 🌱

## One-Command Setup (WITH LOGOS!)

```bash
# Make sure dev server is running in another terminal
bun dev

# In another terminal, seed test stores WITH uploaded logos and images
bun seed:logos
```

That's it! Your marketplace will now have 5 test stores with 18 shelves, complete with uploaded logos and branch/shelf images. ✨

### Option 2: Quick Seed Without Logos

If you just want the basic data without waiting for image uploads:

```bash
bun seed
```

## What You Get

✅ **5 Professional Test Stores WITH LOGOS**
- الرياض مول (Riyadh Mall) 🔴
- جدة بلازا (Jeddah Plaza) 🟦
- الدمام ماركت (Dammam Market) 🔵
- الأحساء جاليريا (Al-Ahsa Gallery) 🟠
- عنيزة هايبر (Unaizah Hyper) 💚

✅ **8 Branches** with Professional Images
- Riyadh, Kharj, Jeddah, Dammam, Al-Ahsa, Unaizah
- Each branch has exterior/storefront images
- QR codes for customer access

✅ **18 Shelves** with Images & Realistic Pricing
- Monthly rent: ر.س 1,300 - 3,000
- Commission rates: 5% - 15%
- Product types: 30+ categories
- Each shelf has professional product display images

✅ **Professional Branding**
- Generated SVG logos for each store
- Branch exterior images with branding
- Shelf product display mockups
- All images uploaded to Convex storage

## How to Use

### Browse in Marketplace
```
http://localhost:3000/marketplace
```
- See all test stores listed
- Filter by city and product type
- Click shelf details to view information

### Admin Dashboard
```
http://localhost:3000/admin-dashboard
```
- Navigate to "Stores" section
- View all seeded stores and their data

### Convex Dashboard
```
https://dashboard.convex.dev
```
- Check `storeProfiles` table (5 records)
- Check `branches` table (8 records)
- Check `shelves` table (18 records)

## Images & Logos Included! ✨

When you run `bun seed:logos`, it automatically:

✅ **Generates professional SVG logos** for each store with brand colors
✅ **Creates branch storefront images** with exterior mockups
✅ **Generates shelf product images** with display layouts
✅ **Uploads all images to Convex storage** automatically
✅ **Attaches images to branches and shelves** with proper references

### Store Brand Colors

Each store uses a distinct, professional color scheme:
- الرياض مول: 🔴 #FF6B6B (Vibrant Red)
- جدة بلازا: 🟦 #4ECDC4 (Teal Blue)
- الدمام ماركت: 🔵 #45B7D1 (Ocean Blue)
- الأحساء جاليريا: 🟠 #FFA07A (Salmon Orange)
- عنيزة هايبر: 💚 #98D8C8 (Mint Green)

**No manual uploads needed!** The seeding script handles everything. 🚀

## Verify It Worked

### ✅ Check 1: Marketplace Page
```
Visit http://localhost:3000/marketplace
Should show 5 stores with shelves
```

### ✅ Check 2: Console Output
```bash
# If running bun seed, should see:
✅ Successfully created 5 stores...
```

### ✅ Check 3: Database
```bash
# Check Convex dashboard
Should have 5 storeProfiles
Should have 8 branches
Should have 18 shelves
```

## Troubleshooting

### "seedTestStoresWithLogos not found"
```bash
# Make sure you're running the Convex dev server
bun dev
# Wait for it to compile
# Then in another terminal:
bun seed:logos
```

### "Upload failed" during seeding
```bash
# Make sure Convex dev server is fully started
# Try running the command again - sometimes the first request needs the server to warm up
bun seed:logos
```

### "No stores or images appearing in marketplace"
```bash
# 1. Check marketplace page is fully loaded
# 2. Reload the page (Ctrl+R or Cmd+R)
# 3. Check browser console for errors (F12)
# 4. Verify Convex is running: bunx convex dev
# 5. Check Convex dashboard for data
```

### "Images not showing on shelf details"
- Reload the page
- Check that images were uploaded (check Convex dashboard > _storage table)
- Verify image storage IDs are in branch/shelf records

## Testing Workflows

### Test 1: Browse Marketplace
1. Visit http://localhost:3000/marketplace
2. See list of 5 test stores
3. Filter by city (Riyadh, Jeddah, etc.)
4. Filter by product type
5. Click shelf to see details

### Test 2: Request Rental
1. As a brand owner, request a shelf rental
2. Select dates and duration
3. Complete the rental request workflow

### Test 3: Admin Features
1. Log in as admin
2. View stores in admin dashboard
3. See shelf listings and statuses

## Next Steps

1. **Test the Marketplace** - Browse stores, filter by city/category, view shelf details with logos
2. **Create Brand Accounts** - Sign up as a brand owner to test rental requests
3. **Test Rental Workflow** - Request a shelf rental, complete the flow
4. **Admin Dashboard** - View seeded stores and their data as an admin
5. **Payment Testing** - Test the payment flow with seeded shelf rentals
6. **Customize Data** - Edit shelf descriptions, prices, and branding as needed

## Need More Info?

For detailed instructions, see:
- [SEEDING_GUIDE.md](./SEEDING_GUIDE.md) - Complete seeding documentation
- [CLAUDE.md](./CLAUDE.md) - Architecture overview
- [README.md](./README.md) - Project setup

---

**Ready to test? Run `bun seed` now! 🚀**
