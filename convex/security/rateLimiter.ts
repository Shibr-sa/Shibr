import { v } from "convex/values"
import { Id } from "../_generated/dataModel"

/**
 * Simple in-memory rate limiter for Convex functions
 * In production, consider using Redis or a database-backed solution
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// Store rate limit data in memory
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyPrefix?: string
}

/**
 * Check if a request is rate limited
 * @param identifier - Unique identifier (userId, IP, etc.)
 * @param config - Rate limit configuration
 * @returns true if request should be allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = config.keyPrefix ? `${config.keyPrefix}:${identifier}` : identifier
  const entry = rateLimitStore.get(key)

  // If no entry exists or window has passed, create new entry
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    }
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime
    }
  }

  // Increment count and allow request
  entry.count++
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime
  }
}

/**
 * Rate limit configurations for different operations
 */
export const RATE_LIMITS = {
  // API endpoints
  api: {
    default: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
    search: { maxRequests: 30, windowMs: 60000 }, // 30 searches per minute
    mutation: { maxRequests: 50, windowMs: 60000 }, // 50 mutations per minute
  },

  // Authentication
  auth: {
    login: { maxRequests: 5, windowMs: 900000 }, // 5 attempts per 15 minutes
    signup: { maxRequests: 3, windowMs: 3600000 }, // 3 signups per hour
    passwordReset: { maxRequests: 3, windowMs: 3600000 }, // 3 resets per hour
    otpVerify: { maxRequests: 5, windowMs: 600000 }, // 5 OTP attempts per 10 minutes
  },

  // File operations
  files: {
    upload: { maxRequests: 10, windowMs: 3600000 }, // 10 uploads per hour
    download: { maxRequests: 100, windowMs: 3600000 }, // 100 downloads per hour
  },

  // Messages/Chat
  messages: {
    send: { maxRequests: 30, windowMs: 60000 }, // 30 messages per minute
    typing: { maxRequests: 10, windowMs: 10000 }, // 10 typing indicators per 10 seconds
  },

  // Payments
  payments: {
    create: { maxRequests: 10, windowMs: 3600000 }, // 10 payment attempts per hour
    webhook: { maxRequests: 100, windowMs: 60000 }, // 100 webhook calls per minute
  },
}

/**
 * Helper to create a rate-limited mutation wrapper
 */
export function withRateLimit<Args extends Record<string, any>, Return>(
  handler: (ctx: any, args: Args) => Promise<Return>,
  config: RateLimitConfig,
  getIdentifier: (ctx: any, args: Args) => string
) {
  return async (ctx: any, args: Args): Promise<Return> => {
    const identifier = getIdentifier(ctx, args)
    const result = checkRateLimit(identifier, config)

    if (!result.allowed) {
      const resetIn = Math.ceil((result.resetTime - Date.now()) / 1000)
      throw new Error(`Rate limit exceeded. Try again in ${resetIn} seconds.`)
    }

    return handler(ctx, args)
  }
}

/**
 * Helper to get rate limit key for user-based limiting
 */
export function getUserRateLimitKey(userId: string, operation: string): string {
  return `user:${userId}:${operation}`
}

/**
 * Helper to get rate limit key for IP-based limiting
 * Note: IP should be passed from the request headers
 */
export function getIpRateLimitKey(ip: string, operation: string): string {
  return `ip:${ip}:${operation}`
}

/**
 * Reset rate limit for a specific key (useful for testing or admin operations)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key)
}

/**
 * Get current rate limit status for a key
 */
export function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig
): { count: number; remaining: number; resetTime: number } {
  const key = config.keyPrefix ? `${config.keyPrefix}:${identifier}` : identifier
  const entry = rateLimitStore.get(key)
  const now = Date.now()

  if (!entry || entry.resetTime < now) {
    return {
      count: 0,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs
    }
  }

  return {
    count: entry.count,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime
  }
}