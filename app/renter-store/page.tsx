"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Loader2 } from "lucide-react"

export default function RenterStorePage() {
  const router = useRouter()
  const currentUser = useQuery(api.users.getCurrentUserWithProfile)

  useEffect(() => {
    // Wait for the query to resolve
    if (currentUser === undefined) return

    // If not authenticated, redirect to signup selection
    if (currentUser === null) {
      router.push("/signup/select-type")
      return
    }

    // If authenticated, redirect based on account type
    switch (currentUser.accountType) {
      case "store_owner":
        router.push("/store-dashboard")
        break
      case "brand_owner":
        router.push("/brand-dashboard")
        break
      case "admin":
        router.push("/admin-dashboard")
        break
      default:
        // If somehow no account type, redirect to signup
        router.push("/signup/select-type")
    }
  }, [currentUser, router])

  // Show loading state while checking authentication
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}