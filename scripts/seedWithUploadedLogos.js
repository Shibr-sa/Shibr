#!/usr/bin/env node

/**
 * Comprehensive Seeding Script with Logo Upload
 *
 * This script:
 * 1. Generates SVG logos for each store
 * 2. Uploads them to Convex storage
 * 3. Creates stores, branches, and shelves with the uploaded logos attached
 *
 * Usage:
 *   bun scripts/seedWithUploadedLogos.js
 */

const fs = require("fs")
const path = require("path")
const https = require("https")
const http = require("http")

// Configuration
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "http://localhost:19000"
const DEPLOYMENT = process.env.CONVEX_DEPLOYMENT || "dev"

// Store definitions with logos
const STORE_DEFINITIONS = {
  "riyadh-mall": {
    name: "الرياض مول - Riyadh Mall",
    color: "#FF6B6B",
    emoji: "🏪",
  },
  "jeddah-plaza": {
    name: "جدة بلازا - Jeddah Plaza",
    color: "#4ECDC4",
    emoji: "🏬",
  },
  "dammam-market": {
    name: "الدمام ماركت - Dammam Market",
    color: "#45B7D1",
    emoji: "🛍️",
  },
  "ahsa-gallery": {
    name: "الأحساء جاليريا - Al-Ahsa Gallery",
    color: "#FFA07A",
    emoji: "🎨",
  },
  "unaizah-hyper": {
    name: "عنيزة هايبر - Unaizah Hyper",
    color: "#98D8C8",
    emoji: "🏢",
  },
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

// Generate store logo SVG
function generateStoreLogo(storeName, color) {
  const [arabicName, englishName] = storeName.split(" - ")

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="500" height="500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
  <defs>
    <linearGradient id="grad${color.replace("#", "")}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${adjustBrightness(color, -30)};stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="500" height="500" fill="url(#grad${color.replace("#", "")})" />

  <!-- Store building shape -->
  <g opacity="0.15">
    <rect x="100" y="150" width="300" height="250" fill="white" rx="15" />
    <polygon points="100,150 250,80 400,150" fill="white" />
  </g>

  <!-- Store door -->
  <g opacity="0.2">
    <rect x="210" y="280" width="80" height="120" fill="white" rx="8" />
    <circle cx="280" cy="340" r="6" fill="white" opacity="0.5" />
  </g>

  <!-- Windows -->
  <g opacity="0.15">
    <rect x="130" y="180" width="50" height="50" fill="white" rx="5" />
    <rect x="225" y="180" width="50" height="50" fill="white" rx="5" />
    <rect x="320" y="180" width="50" height="50" fill="white" rx="5" />
  </g>

  <!-- Main text -->
  <text x="250" y="280" font-size="48" font-weight="bold" text-anchor="middle"
        dominant-baseline="middle" fill="white" font-family="Arial, sans-serif">
    ${arabicName}
  </text>

  <!-- English text -->
  <text x="250" y="340" font-size="28" text-anchor="middle"
        dominant-baseline="middle" fill="white" opacity="0.9" font-family="Arial, sans-serif">
    ${englishName}
  </text>

  <!-- Decorative corner elements -->
  <circle cx="40" cy="40" r="25" fill="white" opacity="0.1" />
  <circle cx="460" cy="460" r="35" fill="white" opacity="0.1" />
</svg>`
}

// Generate branch exterior image
function generateBranchExteriorImage(branchName, color) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="500" height="400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400">
  <defs>
    <linearGradient id="extGrad${color.replace("#", "")}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:${adjustBrightness(color, -20)};stop-opacity:0.8" />
    </linearGradient>
  </defs>

  <!-- Sky -->
  <rect width="500" height="200" fill="#87CEEB" />

  <!-- Store facade -->
  <rect x="50" y="150" width="400" height="200" fill="url(#extGrad${color.replace("#", "")})" />

  <!-- Store entrance -->
  <rect x="150" y="250" width="200" height="100" fill="rgba(255,255,255,0.3)" rx="10" />

  <!-- Entrance door -->
  <rect x="180" y="270" width="140" height="80" fill="rgba(255,255,255,0.2)" rx="5" />

  <!-- Windows -->
  <rect x="80" y="180" width="80" height="60" fill="rgba(255,255,255,0.25)" rx="5" />
  <rect x="340" y="180" width="80" height="60" fill="rgba(255,255,255,0.25)" rx="5" />

  <!-- Store signage -->
  <rect x="100" y="160" width="300" height="40" fill="white" opacity="0.3" rx="5" />
  <text x="250" y="190" font-size="24" font-weight="bold" text-anchor="middle"
        dominant-baseline="middle" fill="white" font-family="Arial, sans-serif">
    ${branchName}
  </text>

  <!-- Ground -->
  <rect y="350" width="500" height="50" fill="#8B8680" />

  <!-- Decoration -->
  <circle cx="100" cy="150" r="15" fill="white" opacity="0.15" />
  <circle cx="400" cy="170" r="20" fill="white" opacity="0.1" />
</svg>`
}

// Generate shelf image
function generateShelfImage(shelfName, color) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="shelfGrad${color.replace("#", "")}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:0.9" />
      <stop offset="100%" style="stop-color:${adjustBrightness(color, -25)};stop-opacity:0.9" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="600" height="400" fill="#f5f5f5" />

  <!-- Shelf structure -->
  <g fill="url(#shelfGrad${color.replace("#", "")})">
    <!-- Top shelf -->
    <rect x="80" y="80" width="440" height="20" />
    <!-- Middle shelf -->
    <rect x="80" y="160" width="440" height="20" />
    <!-- Bottom shelf -->
    <rect x="80" y="240" width="440" height="20" />
    <!-- Left support -->
    <rect x="60" y="80" width="20" height="180" />
    <!-- Right support -->
    <rect x="520" y="80" width="20" height="180" />
  </g>

  <!-- Products on shelves -->
  <g opacity="0.4">
    <!-- Top shelf items -->
    <rect x="120" y="55" width="30" height="25" fill="white" rx="3" />
    <rect x="180" y="50" width="40" height="30" fill="white" rx="3" />
    <rect x="280" y="52" width="35" height="28" fill="white" rx="3" />
    <rect x="380" y="55" width="30" height="25" fill="white" rx="3" />
    <rect x="450" y="48" width="45" height="32" fill="white" rx="3" />

    <!-- Middle shelf items -->
    <rect x="110" y="135" width="50" height="25" fill="white" rx="3" />
    <rect x="210" y="130" width="35" height="30" fill="white" rx="3" />
    <rect x="310" y="135" width="40" height="25" fill="white" rx="3" />
    <rect x="420" y="130" width="45" height="30" fill="white" rx="3" />

    <!-- Bottom shelf items -->
    <rect x="120" y="215" width="40" height="25" fill="white" rx="3" />
    <rect x="240" y="210" width="50" height="30" fill="white" rx="3" />
    <rect x="360" y="215" width="45" height="25" fill="white" rx="3" />
  </g>

  <!-- Label -->
  <text x="300" y="320" font-size="32" font-weight="bold" text-anchor="middle"
        dominant-baseline="middle" fill="${color}" font-family="Arial, sans-serif">
    ${shelfName}
  </text>

  <text x="300" y="360" font-size="16" text-anchor="middle"
        dominant-baseline="middle" fill="#666" font-family="Arial, sans-serif">
    Premium Display Shelf
  </text>
</svg>`
}

// HTTP request helper for Node.js
function makeHttpRequest(url, method, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === "https:"
    const client = isHttps ? https : http

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    }

    if (body) {
      const bodyStr = typeof body === "string" ? body : JSON.stringify(body)
      options.headers["Content-Length"] = Buffer.byteLength(bodyStr)
    }

    const req = client.request(options, (res) => {
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
      const bodyStr = typeof body === "string" ? body : JSON.stringify(body)
      req.write(bodyStr)
    }

    req.end()
  })
}

// Upload image to Convex
async function uploadImage(svgContent, fileName) {
  try {
    console.log(`  ⬆️  Uploading ${fileName}...`)

    // Step 1: Get upload URL
    const uploadUrlResponse = await makeHttpRequest(
      `${CONVEX_URL}/api/files/generateUploadUrl`,
      "POST",
      {
        fileType: "image",
        mimeType: "image/svg+xml",
      }
    )

    if (!uploadUrlResponse.body || !uploadUrlResponse.body.uploadUrl) {
      throw new Error("Failed to get upload URL")
    }

    // Step 2: Upload the SVG content directly
    const uploadUrl = uploadUrlResponse.body.uploadUrl
    const uploadResponse = await new Promise((resolve, reject) => {
      const urlObj = new URL(uploadUrl)
      const isHttps = urlObj.protocol === "https:"
      const client = isHttps ? https : http

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: "POST",
        headers: {
          "Content-Length": Buffer.byteLength(svgContent),
        },
      }

      const req = client.request(options, (res) => {
        let data = ""

        res.on("data", (chunk) => {
          data += chunk
        })

        res.on("end", () => {
          try {
            resolve({
              status: res.statusCode,
              body: JSON.parse(data),
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
      req.write(svgContent)
      req.end()
    })

    if (uploadResponse.status !== 200 && uploadResponse.status !== 201) {
      throw new Error(`Upload failed with status ${uploadResponse.status}`)
    }

    const uploadResult = uploadResponse.body
    console.log(`    ✅ ${fileName} uploaded (ID: ${uploadResult.storageId})`)

    return uploadResult.storageId
  } catch (error) {
    console.error(`    ❌ Failed to upload ${fileName}:`, error.message)
    throw error
  }
}

// Main seeding function
async function seedStoresWithLogos() {
  console.log("🌱 Starting comprehensive store seeding with uploaded logos...\n")

  try {
    const imageMap = {
      storeLogos: {},
      branchImages: {},
      shelfImages: {},
    }

    // Upload store logos
    console.log("📸 Generating and uploading store logos...")
    for (const [storeId, storeData] of Object.entries(STORE_DEFINITIONS)) {
      try {
        const logoSvg = generateStoreLogo(storeData.name, storeData.color)
        const storageId = await uploadImage(logoSvg, `${storeId}-logo.svg`)
        imageMap.storeLogos[storeId] = storageId
      } catch (error) {
        console.error(`Failed to upload logo for ${storeId}`)
      }
    }

    console.log("\n📷 Generating and uploading branch images...")

    // Define branch images to generate
    const branchImageConfigs = {
      "riyadh-mall-main": { name: "الفرع الرئيسي", color: STORE_DEFINITIONS["riyadh-mall"].color },
      "riyadh-mall-kharj": { name: "فرع الخرج", color: STORE_DEFINITIONS["riyadh-mall"].color },
      "jeddah-plaza-main": { name: "الفرع الرئيسي", color: STORE_DEFINITIONS["jeddah-plaza"].color },
      "dammam-market-main": { name: "الفرع الرئيسي", color: STORE_DEFINITIONS["dammam-market"].color },
      "ahsa-gallery-main": { name: "الفرع الرئيسي", color: STORE_DEFINITIONS["ahsa-gallery"].color },
      "unaizah-hyper-main": { name: "الفرع الرئيسي", color: STORE_DEFINITIONS["unaizah-hyper"].color },
    }

    for (const [branchId, branchConfig] of Object.entries(branchImageConfigs)) {
      try {
        // Generate exterior image
        const exteriorSvg = generateBranchExteriorImage(branchConfig.name, branchConfig.color)
        const exteriorStorageId = await uploadImage(exteriorSvg, `${branchId}-exterior.svg`)

        imageMap.branchImages[branchId] = [
          {
            storageId: exteriorStorageId,
            type: "exterior",
          },
        ]
      } catch (error) {
        console.error(`Failed to upload branch images for ${branchId}`)
      }
    }

    console.log("\n🛍️ Generating and uploading shelf images...")

    // Define shelf images to generate
    const shelfImageConfigs = [
      { id: "riyadh-mall-electronics", name: "رف إلكترونيات", color: STORE_DEFINITIONS["riyadh-mall"].color },
      { id: "riyadh-mall-fashion", name: "رف أزياء", color: STORE_DEFINITIONS["riyadh-mall"].color },
      { id: "riyadh-mall-beauty", name: "رف مستحضرات العناية", color: STORE_DEFINITIONS["riyadh-mall"].color },
      { id: "jeddah-plaza-beverages", name: "رف المشروبات والأطعمة", color: STORE_DEFINITIONS["jeddah-plaza"].color },
      { id: "jeddah-plaza-toys", name: "رف الألعاب والهدايا", color: STORE_DEFINITIONS["jeddah-plaza"].color },
      { id: "jeddah-plaza-books", name: "رف الكتب والقرطاسية", color: STORE_DEFINITIONS["jeddah-plaza"].color },
      { id: "dammam-market-mens", name: "رف الملابس الرجالية", color: STORE_DEFINITIONS["dammam-market"].color },
      { id: "dammam-market-jewelry", name: "رف الذهب والمجوهرات", color: STORE_DEFINITIONS["dammam-market"].color },
      { id: "dammam-market-shoes", name: "رف الأحذية والشنط", color: STORE_DEFINITIONS["dammam-market"].color },
      { id: "dammam-market-watches", name: "رف الساعات والنظارات", color: STORE_DEFINITIONS["dammam-market"].color },
      { id: "ahsa-gallery-traditional", name: "رف الفنون التقليدية", color: STORE_DEFINITIONS["ahsa-gallery"].color },
      { id: "ahsa-gallery-gifts", name: "رف الهدايا والديكور", color: STORE_DEFINITIONS["ahsa-gallery"].color },
      { id: "ahsa-gallery-perfumes", name: "رف العطور والبخور", color: STORE_DEFINITIONS["ahsa-gallery"].color },
      { id: "unaizah-hyper-appliances", name: "رف الأجهزة المنزلية", color: STORE_DEFINITIONS["unaizah-hyper"].color },
      { id: "unaizah-hyper-kids", name: "رف الأطفال والرضع", color: STORE_DEFINITIONS["unaizah-hyper"].color },
      { id: "unaizah-hyper-sports", name: "رف الرياضة واللياقة", color: STORE_DEFINITIONS["unaizah-hyper"].color },
      { id: "unaizah-hyper-furniture", name: "رف الأثاث والديكور", color: STORE_DEFINITIONS["unaizah-hyper"].color },
      { id: "unaizah-hyper-accessories", name: "رف الإكسسوارات", color: STORE_DEFINITIONS["unaizah-hyper"].color },
    ]

    for (const shelfConfig of shelfImageConfigs) {
      try {
        const shelfSvg = generateShelfImage(shelfConfig.name, shelfConfig.color)
        const shelfStorageId = await uploadImage(shelfSvg, `${shelfConfig.id}.svg`)

        imageMap.shelfImages[shelfConfig.id] = [
          {
            storageId: shelfStorageId,
            type: "shelf",
          },
        ]
      } catch (error) {
        console.error(`Failed to upload shelf image for ${shelfConfig.id}`)
      }
    }

    console.log("\n" + "=".repeat(60))
    console.log("✅ All images uploaded successfully!")
    console.log("=".repeat(60) + "\n")

    console.log(
      `📊 Summary:\n` +
        `  • Store logos uploaded: ${Object.keys(imageMap.storeLogos).length}\n` +
        `  • Branch images uploaded: ${Object.keys(imageMap.branchImages).length}\n` +
        `  • Shelf images uploaded: ${Object.keys(imageMap.shelfImages).length}\n`
    )

    console.log("🏪 Now seeding stores, branches, and shelves with uploaded logos...\n")

    // Call the Convex seeding function with image IDs
    const seedResponse = await makeHttpRequest(
      `${CONVEX_URL}/api/run_mutation`,
      "POST",
      {
        path: "seedTestStoresWithLogos",
        args: imageMap,
      }
    )

    if (!seedResponse.body || !seedResponse.body.success) {
      throw new Error("Seeding failed: " + JSON.stringify(seedResponse))
    }

    const result = seedResponse.body
    console.log(`✅ Successfully created:\n` +
      `  • ${result.summary.storesCreated} stores\n` +
      `  • ${result.summary.branchesCreated} branches (with images)\n` +
      `  • ${result.summary.shelvesCreated} shelves (with images)\n`)

    console.log("\n" + "=".repeat(60))
    console.log("🎉 SEEDING COMPLETE!")
    console.log("=".repeat(60))
    console.log("\n📱 Next steps:")
    console.log("  1. Visit http://localhost:3000/marketplace")
    console.log("  2. See all stores with their logos and images")
    console.log("  3. Browse shelves and filter by city/category")
    console.log("  4. Click shelves to view detailed information with images\n")
  } catch (error) {
    console.error("❌ Error during seeding:", error)
    process.exit(1)
  }
}

// Run the seed
seedStoresWithLogos()
