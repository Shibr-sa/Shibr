"use client"

import { createContext, useContext, ReactNode } from "react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

interface StoreDataContextType {
  isLoading: boolean
  isStoreDataComplete: boolean
  userData: any
  refetch?: () => void
}

const StoreDataContext = createContext<StoreDataContextType>({
  isLoading: true,
  isStoreDataComplete: false,
  userData: null,
})

export function StoreDataProvider({ children }: { children: ReactNode }) {
  const { user } = useCurrentUser()
  
  // Fetch current user data from backend
  const userData = useQuery(api.users.getCurrentUserWithProfile)
  
  // Check if store data is complete
  const storeDataCompleteQuery = useQuery(
    api.users.checkStoreDataComplete, 
    user ? { userId: user.id as Id<"users"> } : "skip"
  )
  
  // Determine loading state - both queries should be loaded
  const isLoading = userData === undefined || storeDataCompleteQuery === undefined
  const isStoreDataComplete = storeDataCompleteQuery ?? false
  
  return (
    <StoreDataContext.Provider
      value={{
        isLoading,
        isStoreDataComplete,
        userData,
      }}
    >
      {children}
    </StoreDataContext.Provider>
  )
}

export function useStoreData() {
  const context = useContext(StoreDataContext)
  if (!context) {
    throw new Error("useStoreData must be used within a StoreDataProvider")
  }
  return context
}