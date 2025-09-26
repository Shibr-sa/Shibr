/**
 * Centralized authentication error handling utilities
 * Provides consistent error parsing and message mapping across the application
 */

export type AuthErrorCode =
  | 'USER_NOT_FOUND'
  | 'INVALID_PASSWORD'
  | 'ACCOUNT_EXISTS'
  | 'EMAIL_NOT_VERIFIED'
  | 'INVALID_OTP'
  | 'OTP_EXPIRED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'NETWORK_ERROR'
  | 'INVALID_EMAIL'
  | 'WEAK_PASSWORD'
  | 'SESSION_EXPIRED'
  | 'NOT_AUTHENTICATED'
  | 'PROFILE_EXISTS'
  | 'PROFILE_NOT_FOUND'
  | 'UNKNOWN_ERROR'

export interface AuthError {
  code: AuthErrorCode
  translationKey: string
  fallbackMessage: string
  shouldRedirect?: boolean
  redirectTo?: string
}

/**
 * Maps error messages to standardized error codes and translation keys
 */
export function parseAuthError(error: any): AuthError {
  const errorMessage = error?.message?.toLowerCase() || ''

  // User not found
  if (errorMessage.includes('user not found') ||
      errorMessage.includes('no user') ||
      errorMessage.includes('user does not exist')) {
    return {
      code: 'USER_NOT_FOUND',
      translationKey: 'auth.user_not_found',
      fallbackMessage: 'User not found',
    }
  }

  // Invalid password
  if (errorMessage.includes('invalid password') ||
      errorMessage.includes('incorrect password') ||
      errorMessage.includes('wrong password')) {
    return {
      code: 'INVALID_PASSWORD',
      translationKey: 'auth.invalid_password',
      fallbackMessage: 'Invalid password',
    }
  }

  // Account already exists
  if (errorMessage.includes('already exists') ||
      errorMessage.includes('duplicate') ||
      errorMessage.includes('already registered') ||
      errorMessage === 'auth.account_already_exists') {
    return {
      code: 'ACCOUNT_EXISTS',
      translationKey: 'auth.account_already_exists',
      fallbackMessage: 'Account already exists',
      shouldRedirect: true,
      redirectTo: '/signin'
    }
  }

  // Email verification errors
  if (errorMessage.includes('not verified') ||
      errorMessage.includes('verify email') ||
      errorMessage.includes('email verification')) {
    return {
      code: 'EMAIL_NOT_VERIFIED',
      translationKey: 'auth.email_not_verified',
      fallbackMessage: 'Please verify your email',
      shouldRedirect: true,
      redirectTo: '/verify-email'
    }
  }

  // OTP errors
  if (errorMessage.includes('invalid verification code') ||
      errorMessage.includes('invalid otp') ||
      errorMessage.includes('wrong code')) {
    return {
      code: 'INVALID_OTP',
      translationKey: 'verification.invalid_code',
      fallbackMessage: 'Invalid verification code',
    }
  }

  if (errorMessage.includes('expired') ||
      errorMessage.includes('code has expired')) {
    return {
      code: 'OTP_EXPIRED',
      translationKey: 'verification.code_expired',
      fallbackMessage: 'Verification code has expired',
    }
  }

  // Rate limiting
  if (errorMessage.includes('too many') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('try again later')) {
    return {
      code: 'RATE_LIMIT_EXCEEDED',
      translationKey: 'auth.rate_limit_exceeded',
      fallbackMessage: 'Too many attempts. Please try again later',
    }
  }

  // Network errors
  if (errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('fetch failed') ||
      error?.code === 'NETWORK_ERROR') {
    return {
      code: 'NETWORK_ERROR',
      translationKey: 'auth.network_error',
      fallbackMessage: 'Network error. Please check your connection',
    }
  }

  // Email validation
  if (errorMessage.includes('invalid email') ||
      errorMessage.includes('email format')) {
    return {
      code: 'INVALID_EMAIL',
      translationKey: 'auth.invalid_email',
      fallbackMessage: 'Invalid email address',
    }
  }

  // Password validation
  if (errorMessage.includes('weak password') ||
      errorMessage.includes('password too short') ||
      errorMessage.includes('password requirements')) {
    return {
      code: 'WEAK_PASSWORD',
      translationKey: 'auth.weak_password',
      fallbackMessage: 'Password is too weak',
    }
  }

  // Authentication errors
  if (errorMessage.includes('not authenticated') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('not logged in')) {
    return {
      code: 'NOT_AUTHENTICATED',
      translationKey: 'auth.not_authenticated',
      fallbackMessage: 'Please sign in to continue',
      shouldRedirect: true,
      redirectTo: '/signin'
    }
  }

  // Session errors
  if (errorMessage.includes('session expired') ||
      errorMessage.includes('token expired')) {
    return {
      code: 'SESSION_EXPIRED',
      translationKey: 'auth.session_expired',
      fallbackMessage: 'Your session has expired',
      shouldRedirect: true,
      redirectTo: '/signin'
    }
  }

  // Profile errors
  if (errorMessage.includes('profile already exists')) {
    return {
      code: 'PROFILE_EXISTS',
      translationKey: 'auth.profile_already_exists',
      fallbackMessage: 'Profile already exists',
    }
  }

  if (errorMessage.includes('profile not found')) {
    return {
      code: 'PROFILE_NOT_FOUND',
      translationKey: 'auth.profile_not_found',
      fallbackMessage: 'Profile not found',
    }
  }

  // Default/Unknown error
  return {
    code: 'UNKNOWN_ERROR',
    translationKey: 'auth.unknown_error',
    fallbackMessage: 'An unexpected error occurred',
  }
}

/**
 * Retry configuration for network errors
 */
export interface RetryConfig {
  maxAttempts: number
  initialDelay: number
  maxDelay: number
  backoffFactor: number
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
}

/**
 * Executes an async function with exponential backoff retry logic
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxAttempts, initialDelay, maxDelay, backoffFactor } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  }

  let lastError: any

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error

      // Don't retry if it's not a network error
      const parsedError = parseAuthError(error)
      if (parsedError.code !== 'NETWORK_ERROR' && attempt === 0) {
        throw error
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      )

      // Don't wait after the last attempt
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

/**
 * Sanitizes error messages to avoid exposing sensitive information
 */
export function sanitizeErrorMessage(error: any): string {
  const parsed = parseAuthError(error)

  // Never expose internal error details in production
  if (process.env.NODE_ENV === 'production') {
    return parsed.fallbackMessage
  }

  // In development, return more detailed error
  return error?.message || parsed.fallbackMessage
}

/**
 * Checks if an error should trigger a redirect
 */
export function shouldRedirectOnError(error: any): { redirect: boolean; path?: string } {
  const parsed = parseAuthError(error)
  return {
    redirect: parsed.shouldRedirect || false,
    path: parsed.redirectTo
  }
}