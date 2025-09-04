// Shared helper functions for Convex backend

// Helper to extract image URLs from new image structure
export const getImageUrlsFromArray = async (ctx: any, images: any[] | undefined) => {
  const result = {
    shelfImageUrl: null as string | null,
    exteriorImageUrl: null as string | null,
    interiorImageUrl: null as string | null,
    additionalImageUrls: [] as string[],
  }
  
  if (!images || !Array.isArray(images)) return result
  
  for (const img of images) {
    const url = await ctx.storage.getUrl(img.storageId)
    if (!url) continue
    
    switch (img.type) {
      case 'shelf':
        result.shelfImageUrl = url
        break
      case 'exterior':
        result.exteriorImageUrl = url
        break
      case 'interior':
        result.interiorImageUrl = url
        break
      case 'additional':
        result.additionalImageUrls.push(url)
        break
    }
  }
  
  return result
}

// Helper function to get date ranges based on time period
export function getDateRange(endDate: Date, period: string): { startDate: Date; endDate: Date } {
  const startDate = new Date(endDate);
  
  switch (period) {
    case "daily":
      startDate.setDate(startDate.getDate() - 1);
      break;
    case "weekly":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "monthly":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "yearly":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
  }
  
  return { startDate, endDate: new Date(endDate) };
}