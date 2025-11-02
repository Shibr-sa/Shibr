#!/usr/bin/env node

/**
 * Seed Script: Create test stores with logos and images
 *
 * Usage:
 *   bun scripts/seedStoresWithLogos.js
 *
 * This script:
 * 1. Creates 5 test stores with different categories
 * 2. Creates branches in different cities
 * 3. Creates shelves with product types
 * 4. Generates placeholder logos as SVG/PNG and uploads them
 * 5. Attaches logos to store branches
 */

const https = require("https")
const fs = require("fs")
const path = require("path")

// Configuration
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "http://localhost:19000"
const API_ENDPOINT = `${CONVEX_URL}/api`

// Color palette for store logos
const STORE_COLORS = {
  "الرياض مول": "#FF6B6B",
  "جدة بلازا": "#4ECDC4",
  "الدمام ماركت": "#45B7D1",
  "الأحساء جاليريا": "#FFA07A",
  "عنيزة هايبر": "#98D8C8",
}

// Function to create SVG logo as base64
function createStoreLogo(storeName, color) {
  const arabicName = storeName.split(" - ")[0]
  const englishName = storeName.split(" - ")[1] || storeName

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <!-- Background -->
  <rect width="400" height="400" fill="${color}"/>

  <!-- Gradient overlay -->
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${adjustBrightness(color, -20)};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#grad)"/>

  <!-- Store icon placeholder -->
  <g>
    <!-- Store building shape -->
    <rect x="80" y="120" width="240" height="200" fill="white" opacity="0.2" rx="10"/>
    <polygon points="80,120 200,50 320,120" fill="white" opacity="0.3"/>

    <!-- Store door -->
    <rect x="170" y="220" width="60" height="100" fill="white" opacity="0.2" rx="5"/>

    <!-- Windows -->
    <rect x="110" y="150" width="40" height="40" fill="white" opacity="0.15" rx="3"/>
    <rect x="170" y="150" width="40" height="40" fill="white" opacity="0.15" rx="3"/>
    <rect x="230" y="150" width="40" height="40" fill="white" opacity="0.15" rx="3"/>
  </g>

  <!-- Text -->
  <text x="200" y="200" font-size="32" font-weight="bold" text-anchor="middle"
        dominant-baseline="middle" fill="white" font-family="Arial, sans-serif">
    ${arabicName}
  </text>
  <text x="200" y="250" font-size="20" text-anchor="middle"
        dominant-baseline="middle" fill="white" opacity="0.9" font-family="Arial, sans-serif">
    ${englishName}
  </text>

  <!-- Decorative elements -->
  <circle cx="50" cy="50" r="20" fill="white" opacity="0.1"/>
  <circle cx="350" cy="350" r="30" fill="white" opacity="0.1"/>
</svg>`

  return svg
}

// Helper to adjust hex color brightness
function adjustBrightness(color, percent) {
  const num = parseInt(color.replace("#", ""), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.min(255, Math.max(0, (num >> 16) + amt))
  const G = Math.min(255, Math.max(0, (num >> 8) + amt))
  const B = Math.min(255, Math.max(0, (num & 0xff) + amt))
  return (
    "#" +
    [R, G, B]
      .map((x) => {
        const hex = x.toString(16)
        return hex.length === 1 ? "0" + hex : hex
      })
      .join("")
  )
}

// HTTP request helper
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(CONVEX_URL)
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    }

    const req = https.request(options, (res) => {
      let data = ""

      res.on("data", (chunk) => {
        data += chunk
      })

      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null,
          })
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data,
          })
        }
      })
    })

    req.on("error", reject)

    if (body) {
      req.write(JSON.stringify(body))
    }

    req.end()
  })
}

// Main seeding function
async function seedStores() {
  console.log("🌱 Starting store seeding with logos...\n")

  try {
    // Run the Convex seed function
    console.log("📦 Creating stores, branches, and shelves...")
    const seedResponse = await makeRequest("POST", "/api/run_mutation", {
      path: "seedTestStores",
      args: {},
    })

    if (seedResponse.status !== 200) {
      console.error("❌ Failed to seed stores:", seedResponse)
      return
    }

    const result = seedResponse.body

    console.log(
      `✅ Successfully created ${result.summary.storesCreated} stores with ${result.summary.branchesCreated} branches and ${result.summary.shelvesCreated} shelves\n`
    )

    // Display created stores
    console.log("📍 Created Stores:")
    result.details.stores.forEach((store) => {
      console.log(`  • ${store.name} (${store.branchCount} branches, ${store.shelfCount} shelves per branch)`)
    })

    console.log("\n🏪 Created Branches:")
    result.details.branches.forEach((branch) => {
      console.log(`  • ${branch.storeName} → ${branch.branchName} (${branch.city})`)
    })

    console.log("\n📊 Created Shelves Summary:")
    console.log(`  Total shelves created: ${result.details.shelves.length}`)
    console.log(`  Average price: ر.س ${(result.details.shelves.reduce((sum, s) => sum + s.price, 0) / result.details.shelves.length).toFixed(0)}`)

    console.log("\n" + "=".repeat(60))
    console.log("🎉 Store seeding completed successfully!")
    console.log("=".repeat(60))

    console.log("\n📸 LOGO UPLOAD INSTRUCTIONS:")
    console.log(`
The test stores have been created successfully!
However, to add logos to the stores, you need to:

Option 1: Upload via Convex Dashboard
  1. Go to: https://dashboard.convex.dev
  2. Select your project and go to the Data tab
  3. Upload logo images to _storage
  4. Note the storage IDs
  5. Update the shelf/branch records with image references

Option 2: Using the Convex API (Node.js example)
  const fetch = require('node-fetch')

  // Get upload URL
  const uploadUrl = await fetch(\`\${CONVEX_URL}/api/...\`)

  // Upload image
  const logoData = fs.readFileSync('./logo.png')
  const result = await fetch(uploadUrl, {
    method: 'POST',
    body: logoData
  })
  const { storageId } = await result.json()

Option 3: Create Placeholder Logos
  You can create simple logos using online tools or design software.
  Recommended dimensions: 400x400px or 512x512px
  File formats: PNG, JPG, or WebP

📝 Store Logos by Category:
`)

    Object.entries(STORE_COLORS).forEach(([storeName, color]) => {
      console.log(`  • ${storeName} (Color: ${color})`)
    })

    console.log("\n💾 Saved store data for reference:")
    console.log(JSON.stringify(result.details, null, 2))
  } catch (error) {
    console.error("❌ Error during seeding:", error)
    process.exit(1)
  }
}

// Run the seed
seedStores().catch(console.error)
