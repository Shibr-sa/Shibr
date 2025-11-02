# 🌱 Shibr Marketplace Seeding - Complete Solution

Your Shibr marketplace now has a complete, professional seeding system for test data with logos and images!

## 🚀 Quick Start (1 minute)

```bash
# Terminal 1
bun dev

# Terminal 2 (after Terminal 1 is ready)
bun seed:logos
```

That's it! 🎉 Visit http://localhost:3000/marketplace

## 📦 What Gets Created

✅ **5 Professional Test Stores** with unique logos
- الرياض مول (Riyadh Mall)
- جدة بلازا (Jeddah Plaza)
- الدمام ماركت (Dammam Market)
- الأحساء جاليريا (Al-Ahsa Gallery)
- عنيزة هايبر (Unaizah Hyper)

✅ **8 Store Branches** across Saudi Arabia with exterior images
✅ **18 Product Shelves** with product display mockups
✅ **All images uploaded to Convex storage** automatically
✅ **Realistic pricing, product types, and descriptions**

## 📊 Data Breakdown

| Item | Count |
|------|-------|
| Stores | 5 |
| Branches | 8 |
| Shelves | 18 |
| Total Product Types | 30+ |
| Images Generated | 32+ |
| Price Range | ر.س 1,300 - 3,000/month |

## 📁 Files Created

### Seeding Scripts
- **`/convex/seedTestStoresWithLogos.ts`** - Main Convex mutation with logo support
- **`/scripts/seedWithUploadedLogos.js`** - Node.js orchestration + image upload

### Documentation
- **`/SEED_README.md`** - This file (quick reference)
- **`/SEED_QUICK_START.md`** - Fast setup guide
- **`/SEEDING_COMPLETE.md`** - Complete detailed guide
- **`/SEEDING_GUIDE.md`** - Extended reference

### Configuration
- **`/package.json`** - Updated with seed scripts

## 🎨 Features

### Logos
- Generated SVG logos for each store
- Unique brand colors (gradient backgrounds)
- Arabic and English text
- Professional styling

### Branch Images
- Storefront exterior mockups
- Branded with store color
- Professional signage
- Real-world appearance

### Shelf Images
- Product display mockups
- Professional layouts
- Branded with store color
- Ready-to-use visuals

### Full Upload Pipeline
- Automatic SVG generation
- Convex storage upload
- Database integration
- Image reference management

## 📋 Available Commands

```bash
# Seed with full logos and images (RECOMMENDED)
bun seed:logos

# Seed basic data without images (fast)
bun seed

# Seed admin user
bun seed:admin
```

## ✅ Verification Checklist

- [ ] Run `bun dev` and wait for compilation
- [ ] Run `bun seed:logos` in another terminal
- [ ] Wait for "SEEDING COMPLETE!" message
- [ ] Visit http://localhost:3000/marketplace
- [ ] See 5 stores with logos
- [ ] See 8 branches with images
- [ ] See 18 shelves with product images
- [ ] Filter by city and product type
- [ ] Click shelf to see details with images

## 🎯 What to Test

### Marketplace Features
- [ ] Browse all stores
- [ ] Filter by city
- [ ] Filter by product type
- [ ] View shelf details
- [ ] See logos and images
- [ ] Check pricing information
- [ ] View store descriptions

### Brand Owner Workflow
- [ ] Sign up as brand owner
- [ ] Browse marketplace
- [ ] Request shelf rental
- [ ] Complete rental request
- [ ] View rental status

### Store Owner Features
- [ ] View seeded shelves
- [ ] See shelf metrics
- [ ] Check rental requests
- [ ] Manage store data

### Admin Features
- [ ] View all stores
- [ ] Check store details
- [ ] View shelves
- [ ] Access analytics

## 🔧 Customization

Want to change store data?

1. **Edit store names/categories**: `/convex/seedTestStoresWithLogos.ts` (lines 20+)
2. **Change colors**: Update the `color` property
3. **Add more shelves**: Add to the `shelves` array
4. **Modify pricing**: Edit `price` and `commission` properties

## 🐛 Troubleshooting

### Images not uploading
```bash
# Make sure Convex dev server is fully loaded
bun dev
# Wait 10-15 seconds, then:
bun seed:logos
```

### Script hangs or times out
```bash
# Kill and retry
# Ctrl+C to stop the script
bun seed:logos
```

### Marketplace shows no stores
1. Check Convex dashboard for data
2. Reload marketplace page
3. Check browser console (F12) for errors

## 📚 Documentation

For more information, see:
- **[SEED_QUICK_START.md](./SEED_QUICK_START.md)** - Fast setup
- **[SEEDING_COMPLETE.md](./SEEDING_COMPLETE.md)** - Complete guide
- **[SEEDING_GUIDE.md](./SEEDING_GUIDE.md)** - Detailed reference
- **[CLAUDE.md](./CLAUDE.md)** - Architecture overview

## 🎨 Store Colors

Each store has a unique professional color:

| Store | Color | Code |
|-------|-------|------|
| الرياض مول | 🔴 Red | #FF6B6B |
| جدة بلازا | 🟦 Teal | #4ECDC4 |
| الدمام ماركت | 🔵 Blue | #45B7D1 |
| الأحساء جاليريا | 🟠 Salmon | #FFA07A |
| عنيزة هايبر | 💚 Mint | #98D8C8 |

## 📱 Testing on Mobile

The seeded data works perfectly on mobile:
1. Start dev server with `bun dev`
2. Get your machine IP: `ipconfig getifaddr en0` (Mac)
3. Visit `http://YOUR_IP:3000/marketplace` on phone
4. Test responsive design

## 🔄 Resetting Data

To start fresh:

```bash
# Option 1: Delete via Convex Dashboard
# Go to https://dashboard.convex.dev > Data tab
# Delete all from: storeProfiles, branches, shelves, _storage

# Option 2: Just reseed
# Runs same seed again (creates duplicates if old data exists)
bun seed:logos
```

## 🚀 Production Deployment

After testing, you can:
1. Delete test data (optional)
2. Deploy to production
3. Production data will be separate
4. Test stores remain in development

## 💡 Tips & Tricks

### Speed Up Development
- Use `bun seed` (no images) for quick iteration
- Use `bun seed:logos` only when you need images

### Customize Appearance
- Edit SVG generation in `/scripts/seedWithUploadedLogos.js`
- Generate PNGs instead of SVGs
- Add custom logos

### Real Store Data
- Replace with actual store information
- Upload real logos/photos
- Maintain same data structure

## 🎓 Learning Resources

- **Convex Docs**: https://docs.convex.dev
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com
- **Project Architecture**: See [CLAUDE.md](./CLAUDE.md)

## 📞 Need Help?

1. **Check docs**: See links above
2. **Review error messages**: Often very helpful
3. **Check Convex dashboard**: Verify data creation
4. **Browser console**: Look for client errors (F12)
5. **Server logs**: Check `bun dev` output

## ✨ What's Next?

After seeding:
1. Test marketplace browsing
2. Create test brand accounts
3. Request shelf rentals
4. Test payment flow
5. Admin operations
6. Full end-to-end testing

---

## 📊 Quick Reference

```bash
# All available commands
bun seed              # Seed basic data (no images)
bun seed:logos        # Seed with logos & images ⭐ RECOMMENDED
bun seed:admin        # Seed admin user
bun dev              # Start development server
bun run build        # Build for production
```

---

🎉 **You're all set! Run `bun seed:logos` to get started!**

Your marketplace is ready for professional testing with complete sample data, logos, and images! 🚀
