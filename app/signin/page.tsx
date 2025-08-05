"use client"

import { signIn } from "next-auth/client"
import { useRouter } from "next/router"

const SigninPage = () => {
  const router = useRouter()

  const handleSignIn = async () => {
    const result = await signIn("credentials", {
      redirect: false,
      email: "example@example.com",
      password: "password",
    })

    if (result.ok) {
      router.push("/store-dashboard") // Updated redirect URL
    } else {
      console.error("Sign in failed", result.error)
    }
  }

  return (
    <div>
      <h1>Sign In</h1>
      <button onClick={handleSignIn}>Sign In</button>
      {/* rest of code here */}
    </div>
  )
}

export default SigninPage
