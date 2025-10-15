// Shared helper functions for Convex backend
import { getAuthUserId } from "@convex-dev/auth/server"
import { getUserProfile } from "./profileHelpers"
import { Id } from "./_generated/dataModel"

// Authentication helpers to reduce boilerplate
export async function requireAuth(ctx: any): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx)
  if (!userId) {
    throw new Error("Not authenticated")
  }
  return userId
}

export async function requireAuthWithProfile(ctx: any) {
  const userId = await requireAuth(ctx)
  const profileData = await getUserProfile(ctx, userId)
  if (!profileData) {
    throw new Error("Profile not found")
  }
  return { userId, profileData }
}

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

// Helper to convert document storage IDs to URLs
export async function getDocumentUrls(ctx: any, profileData: any) {
  const documentFields = {
    store_owner: ['commercialRegisterDocument', 'vatCertificate'],
    brand_owner: ['commercialRegisterDocument', 'freelanceLicenseDocument', 'vatCertificate'],
  } as const

  const urls: any = {}
  const fields = documentFields[profileData.type as keyof typeof documentFields] || []

  for (const field of fields) {
    const storageId = profileData.profile[field]
    if (storageId) {
      urls[`${field}Url`] = await ctx.storage.getUrl(storageId)
    }
  }

  return urls
}

// Helper function to get period date ranges for analytics
export function getPeriodDates(period: "daily" | "weekly" | "monthly" | "yearly") {
  const now = new Date()
  const currentPeriodStart = new Date()
  const previousPeriodStart = new Date()
  const previousPeriodEnd = new Date()

  switch (period) {
    case "daily":
      currentPeriodStart.setHours(0, 0, 0, 0)
      previousPeriodStart.setDate(now.getDate() - 1)
      previousPeriodStart.setHours(0, 0, 0, 0)
      previousPeriodEnd.setDate(now.getDate() - 1)
      previousPeriodEnd.setHours(23, 59, 59, 999)
      break
    case "weekly":
      currentPeriodStart.setDate(now.getDate() - now.getDay())
      currentPeriodStart.setHours(0, 0, 0, 0)
      previousPeriodStart.setDate(currentPeriodStart.getDate() - 7)
      previousPeriodEnd.setDate(currentPeriodStart.getDate() - 1)
      previousPeriodEnd.setHours(23, 59, 59, 999)
      break
    case "monthly":
      currentPeriodStart.setDate(1)
      currentPeriodStart.setHours(0, 0, 0, 0)
      previousPeriodStart.setMonth(now.getMonth() - 1)
      previousPeriodStart.setDate(1)
      previousPeriodEnd.setMonth(now.getMonth())
      previousPeriodEnd.setDate(0)
      previousPeriodEnd.setHours(23, 59, 59, 999)
      break
    case "yearly":
      currentPeriodStart.setMonth(0, 1)
      currentPeriodStart.setHours(0, 0, 0, 0)
      previousPeriodStart.setFullYear(now.getFullYear() - 1)
      previousPeriodStart.setMonth(0, 1)
      previousPeriodEnd.setFullYear(now.getFullYear() - 1)
      previousPeriodEnd.setMonth(11, 31)
      previousPeriodEnd.setHours(23, 59, 59, 999)
      break
  }

  return { now, currentPeriodStart, previousPeriodStart, previousPeriodEnd }
}

// Helper to calculate percentage change for analytics
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

// Legacy helper function for simple date ranges (kept for backwards compatibility)
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