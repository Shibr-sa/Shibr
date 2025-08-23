import { useRouter } from "next/navigation"
import { useAuthActions } from "@convex-dev/auth/react"

export function useSignOut() {
  const router = useRouter()
  const { signOut } = useAuthActions()
  
  const handleSignOut = async () => {
    // Sign out from Convex auth
    await signOut()
    // Redirect to signin page
    router.push("/signin")
  }

  return handleSignOut
}