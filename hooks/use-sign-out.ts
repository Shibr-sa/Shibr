import { useAuthActions } from "@convex-dev/auth/react"
import { useState } from "react"

export function useSignOut() {
  const { signOut } = useAuthActions()
  const [isSigningOut, setIsSigningOut] = useState(false)
  
  const handleSignOut = async () => {
    if (isSigningOut) return // Prevent double-clicks
    
    setIsSigningOut(true)
    
    try {
      // Sign out from Convex auth
      await signOut()
      
      // Use hard navigation to clear all client state
      // This prevents any race conditions with cached auth state
      window.location.href = "/signin"
    } catch (error) {
      console.error("Sign out failed:", error)
      setIsSigningOut(false)
      // Even on error, try to redirect
      window.location.href = "/signin"
    }
  }

  return handleSignOut
}