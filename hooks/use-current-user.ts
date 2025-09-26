"use client"

import { useQuery, useConvexAuth } from "convex/react"
import { api } from "@/convex/_generated/api"

export function useCurrentUser() {
  const userWithProfile = useQuery(api.users.getCurrentUserWithProfile)
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  
  // Function to get initials from name
  const getInitials = (name: string) => {
    if (!name || name.trim().length === 0) {
      return "US"
    }
    const parts = name.trim().split(" ")
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }
  
  return {
    user: userWithProfile ? {
      id: userWithProfile._id,
      email: userWithProfile.email || "",
      fullName: userWithProfile.profile?.fullName || userWithProfile.name || "User",
      accountType: userWithProfile.accountType || "user" as const,
      storeName: userWithProfile.profile?.storeName,
      brandName: userWithProfile.profile?.brandName,
      preferredLanguage: "en" as const,
      isAdmin: userWithProfile.accountType === "admin",
      avatar: userWithProfile.image,
      profile: userWithProfile.profile,
    } : null,
    isLoading: authLoading || (!isAuthenticated && userWithProfile === undefined),
    getInitials: userWithProfile ? () => getInitials(userWithProfile.profile?.fullName || userWithProfile.name || "User") : () => "US",
  }
}