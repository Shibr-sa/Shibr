"use client"

import { createContext, useContext, ReactNode } from "react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

interface BrandDataContextType {
  isLoading: boolean
  isBrandDataComplete: boolean
  userData: any
  refetch?: () => void
}

const BrandDataContext = createContext<BrandDataContextType>({
  isLoading: true,
  isBrandDataComplete: false,
  userData: null,
})

export function BrandDataProvider({ children }: { children: ReactNode }) {
  const { user } = useCurrentUser()
  
  // Fetch current user data from backend
  const userData = useQuery(api.users.getCurrentUserWithProfile)
  
  // Check if brand data is complete
  const brandDataCompleteQuery = useQuery(
    api.users.checkBrandDataComplete, 
    user ? { userId: user.id as Id<"users"> } : "skip"
  )
  
  // Determine loading state - both queries should be loaded
  const isLoading = userData === undefined || brandDataCompleteQuery === undefined
  const isBrandDataComplete = brandDataCompleteQuery?.isComplete ?? false
  
  return (
    <BrandDataContext.Provider
      value={{
        isLoading,
        isBrandDataComplete,
        userData,
      }}
    >
      {children}
    </BrandDataContext.Provider>
  )
}

export function useBrandData() {
  const context = useContext(BrandDataContext)
  if (!context) {
    throw new Error("useBrandData must be used within a BrandDataProvider")
  }
  return context
}