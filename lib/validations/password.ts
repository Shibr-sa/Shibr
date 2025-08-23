import { z } from "zod"

// Password validation schema with security requirements
export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")

// Simplified password strength checker
export function getPasswordStrength(password: string): {
  strength: "weak" | "medium" | "strong"
  feedback: string
} {
  let score = 0
  
  // Basic checks
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  
  // Determine strength
  if (score <= 2) return { strength: "weak", feedback: "Use a longer password with mixed characters" }
  if (score <= 4) return { strength: "medium", feedback: "Add more character variety for better security" }
  return { strength: "strong", feedback: "Good password strength" }
}

// Common weak passwords to block
const COMMON_WEAK_PASSWORDS = [
  "password", "123456", "password123", "admin", "letmein",
  "welcome", "monkey", "dragon", "master", "qwerty"
]

export function isCommonPassword(password: string): boolean {
  return COMMON_WEAK_PASSWORDS.includes(password.toLowerCase())
}