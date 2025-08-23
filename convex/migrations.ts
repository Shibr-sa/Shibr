import { internalMutation } from "./_generated/server"

// Migration to rename discountPercentage to storeCommission
export const renameDiscountPercentageToStoreCommission = internalMutation({
  args: {},
  handler: async (ctx) => {
    const shelves = await ctx.db.query("shelves").collect()
    
    let updated = 0
    for (const shelf of shelves) {
      const shelfData = shelf as any
      if ("discountPercentage" in shelfData) {
        // Add storeCommission with the value from discountPercentage
        await ctx.db.patch(shelf._id, {
          storeCommission: shelfData.discountPercentage,
        })
        updated++
      }
    }
    
    return { updated, total: shelves.length }
  },
})

// Migration to remove ownerId field from shelves
export const removeOwnerIdFromShelves = internalMutation({
  args: {},
  handler: async (ctx) => {
    const shelves = await ctx.db.query("shelves").collect()
    
    let updated = 0
    for (const shelf of shelves) {
      if ("ownerId" in shelf) {
        // Remove ownerId field by patching with all fields except ownerId
        const { ownerId, ...shelfWithoutOwnerId } = shelf as any
        
        // Update the document
        await ctx.db.replace(shelf._id, shelfWithoutOwnerId)
        updated++
      }
    }
    
    return { updated, total: shelves.length }
  },
})

// Migration to add sample coordinates to shelves without them
export const addSampleCoordinatesToShelves = internalMutation({
  args: {},
  handler: async (ctx) => {
    const shelves = await ctx.db.query("shelves").collect()
    
    // Sample coordinates for different cities in Saudi Arabia
    const cityCoordinates: Record<string, { lat: number; lng: number }[]> = {
      "الرياض": [
        { lat: 24.7136, lng: 46.6753 }, // Central Riyadh
        { lat: 24.7741, lng: 46.7381 }, // North Riyadh
        { lat: 24.6877, lng: 46.7219 }, // East Riyadh
        { lat: 24.6334, lng: 46.7156 }, // South Riyadh
        { lat: 24.7499, lng: 46.6261 }, // West Riyadh
      ],
      "جدة": [
        { lat: 21.5169, lng: 39.2192 }, // Central Jeddah
        { lat: 21.6001, lng: 39.1360 }, // North Jeddah
        { lat: 21.4858, lng: 39.1925 }, // South Jeddah
      ],
      "الدمام": [
        { lat: 26.3927, lng: 49.9777 }, // Central Dammam
        { lat: 26.4207, lng: 50.0888 }, // East Dammam
      ],
    }
    
    let updated = 0
    for (const shelf of shelves) {
      // Only update shelves without coordinates
      if (!shelf.coordinates) {
        const cityCoords = cityCoordinates[shelf.city] || cityCoordinates["الرياض"]
        // Pick a random coordinate from the city's list
        const randomIndex = Math.floor(Math.random() * cityCoords.length)
        const baseCoord = cityCoords[randomIndex]
        
        // Add small random offset to spread markers
        const latOffset = (Math.random() - 0.5) * 0.02 // ±0.01 degrees
        const lngOffset = (Math.random() - 0.5) * 0.02
        
        await ctx.db.patch(shelf._id, {
          coordinates: {
            lat: baseCoord.lat + latOffset,
            lng: baseCoord.lng + lngOffset,
          }
        })
        updated++
      }
    }
    
    return { updated, total: shelves.length }
  },
})