"use client"

import { useEffect, useState } from "react"

interface CurrentUser {
  id: string
  email: string
  fullName: string
  accountType: "admin" | "brand-owner" | "store-owner"
  storeName?: string
  brandName?: string
  preferredLanguage: "ar" | "en"
  avatar?: string
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get user from sessionStorage
    const storedUser = sessionStorage.getItem("currentUser")
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
      } catch (error) {
        console.error("Failed to parse user data:", error)
      }
    }
    setIsLoading(false)
  }, [])

  // Function to get initials from name
  const getInitials = (name: string) => {
    const parts = name.split(" ")
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return {
    user,
    isLoading,
    getInitials: user ? getInitials(user.fullName) : () => "US",
  }
}