import { logger } from "./logger";
import { v } from "convex/values"
import { mutation, internalAction } from "./_generated/server"
import { internal } from "./_generated/api"
import { Resend } from "resend"
import { generateEmailHTML } from "../lib/email-template"
import { getAuthUserId } from "@convex-dev/auth/server"

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================
const OTP_EXPIRY_MINUTES = 10
const MAX_VERIFICATION_ATTEMPTS = 5
const MAX_OTP_REQUESTS_PER_HOUR = 5

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a secure 6-digit OTP
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Clean up expired OTPs for an email
 */
async function cleanupExpiredOTPs(ctx: any, email: string) {
  const now = Date.now()
  const expiredOTPs = await ctx.db
    .query("verificationOTP")
    .withIndex("by_type_identifier", (q: any) => q.eq("type", "email").eq("identifier", email))
    .filter((q: any) => q.lt(q.field("expiresAt"), now))
    .collect()

  for (const otp of expiredOTPs) {
    await ctx.db.delete(otp._id)
  }
}


// ============================================
// MUTATIONS - SIGNUP FLOW ONLY
// ============================================

/**
 * Check if email and phone are available for signup (no OTPs sent)
 */
export const checkAvailability = mutation({
  args: {
    email: v.string(),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim()
    const phoneNumber = args.phoneNumber

    // Check if email already exists
    const existingEmail = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), email))
      .first()

    if (existingEmail) {
      return {
        success: false,
        error: "auth.email_already_exists",
        field: "email"
      }
    }

    // Check if phone already exists (check both with and without 966 prefix)
    const existingPhone = await ctx.db
      .query("users")
      .filter((q) =>
        q.or(
          q.eq(q.field("phone"), phoneNumber),
          q.eq(q.field("phone"), phoneNumber.replace('966', ''))
        )
      )
      .first()

    if (existingPhone) {
      return {
        success: false,
        error: "auth.phone_already_exists",
        field: "phone"
      }
    }

    return {
      success: true,
      message: "Email and phone are available"
    }
  }
})

/**
 * Send OTP for signup email verification (no account exists yet)
 */
export const sendSignupOTP = mutation({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim()

    // Clean up expired OTPs for this email
    await cleanupExpiredOTPs(ctx, email)

    // Check rate limiting
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    const recentOTPs = await ctx.db
      .query("verificationOTP")
      .withIndex("by_type_identifier", (q) => q.eq("type", "email").eq("identifier", email))
      .filter((q) => q.gt(q.field("createdAt"), oneHourAgo))
      .collect()

    if (recentOTPs.length >= MAX_OTP_REQUESTS_PER_HOUR) {
      return {
        success: false,
        error: "auth.rate_limit_exceeded"
      }
    }

    // Delete any existing OTPs for this email
    const existingOTPs = await ctx.db
      .query("verificationOTP")
      .withIndex("by_type_identifier", (q) => q.eq("type", "email").eq("identifier", email))
      .collect()

    for (const oldOTP of existingOTPs) {
      await ctx.db.delete(oldOTP._id)
    }

    // Generate new OTP
    const otp = generateOTP()
    const expiresAt = Date.now() + (OTP_EXPIRY_MINUTES * 60 * 1000)

    // Store OTP
    await ctx.db.insert("verificationOTP", {
      type: "email",
      identifier: email,
      email,
      otp,
      expiresAt,
      attempts: 0,
      createdAt: Date.now(),
    })

    // Schedule email sending
    await ctx.scheduler.runAfter(0, internal.emailVerification.sendSignupOTPEmail, {
      email,
      otp,
      userName: args.name,
    })

    return {
      success: true,
      message: "Verification code sent to your email"
    }
  }
})

/**
 * Verify OTP and create user account
 */
export const verifySignupAndCreateAccount = mutation({
  args: {
    email: v.string(),
    otp: v.string(),
    // Signup data
    fullName: v.string(),
    password: v.string(),
    phoneNumber: v.string(),
    accountType: v.union(v.literal("store-owner"), v.literal("brand-owner")),
    storeName: v.optional(v.string()),
    brandName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim()

    // Find the OTP record
    const otpRecord = await ctx.db
      .query("verificationOTP")
      .withIndex("by_type_identifier", (q) => q.eq("type", "email").eq("identifier", email))
      .filter((q) => q.eq(q.field("otp"), args.otp))
      .first()

    if (!otpRecord) {
      return {
        success: false,
        error: "verification.invalid_code"
      }
    }

    // Check if expired
    if (otpRecord.expiresAt < Date.now()) {
      await ctx.db.delete(otpRecord._id)
      return {
        success: false,
        error: "verification.code_expired"
      }
    }

    // Check attempts
    if (otpRecord.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      await ctx.db.delete(otpRecord._id)
      return {
        success: false,
        error: "auth.rate_limit_exceeded"
      }
    }

    // Update attempts
    await ctx.db.patch(otpRecord._id, {
      attempts: otpRecord.attempts + 1
    })

    // Verify the OTP matches
    if (otpRecord.otp !== args.otp) {
      return {
        success: false,
        error: "verification.invalid_code"
      }
    }

    // OTP is valid - delete it
    await ctx.db.delete(otpRecord._id)

    // Create user account using Convex Auth
    // This will be handled by the signup page after receiving success
    // We just return success here to indicate email is verified

    return {
      success: true,
      message: "Email verified successfully"
    }
  }
})

/**
 * Resend OTP for signup
 */
export const resendSignupOTP = mutation({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim()

    // Check cooldown - last OTP should be at least 60 seconds old
    const recentOTP = await ctx.db
      .query("verificationOTP")
      .withIndex("by_type_identifier", (q) => q.eq("type", "email").eq("identifier", email))
      .order("desc")
      .first()

    if (recentOTP && (Date.now() - recentOTP.createdAt < 60000)) {
      return {
        success: false,
        error: "verification.wait_before_resend"
      }
    }

    // Delete any existing OTPs for this email
    const existingOTPs = await ctx.db
      .query("verificationOTP")
      .withIndex("by_type_identifier", (q) => q.eq("type", "email").eq("identifier", email))
      .collect()

    for (const oldOTP of existingOTPs) {
      await ctx.db.delete(oldOTP._id)
    }

    // Generate new OTP
    const otp = generateOTP()
    const expiresAt = Date.now() + (OTP_EXPIRY_MINUTES * 60 * 1000)

    // Store OTP
    await ctx.db.insert("verificationOTP", {
      type: "email",
      identifier: email,
      email,
      otp,
      expiresAt,
      attempts: 0,
      createdAt: Date.now(),
    })

    // Schedule email sending
    await ctx.scheduler.runAfter(0, internal.emailVerification.sendSignupOTPEmail, {
      email,
      otp,
      userName: args.name,
    })

    return {
      success: true,
      message: "Verification code sent to your email"
    }
  }
})

// ============================================
// INTERNAL ACTIONS - EMAIL SENDING
// ============================================

/**
 * Internal action to send signup OTP email
 */
export const sendSignupOTPEmail = internalAction({
  args: {
    email: v.string(),
    otp: v.string(),
    userName: v.string(),
  },
  handler: async (ctx, args) => {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const resendApiKey = process.env.RESEND_API_KEY

    // Development mode - just log the OTP
    if (isDevelopment && !resendApiKey) {
      logger.info('\n' + '='.repeat(50))
      logger.info('📧 SIGNUP EMAIL VERIFICATION OTP')
      logger.info('='.repeat(50))
      logger.info(`To: ${args.email}`)
      logger.info(`Name: ${args.userName}`)
      logger.info(`OTP Code: ${args.otp}`)
      logger.info('='.repeat(50) + '\n')
      return { success: true, messageId: 'dev-mode' }
    }

    // Production mode - send real email
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    const resend = new Resend(resendApiKey)

    try {
      const language = 'en' as 'en' | 'ar'
      const { subject, html } = generateEmailHTML({
        language,
        subject: language === 'ar'
          ? 'رمز التحقق من البريد الإلكتروني - منصة شبر'
          : 'Email Verification Code - Shibr Platform',
        heading: language === 'ar' ? 'تأكيد البريد الإلكتروني' : 'Email Verification',
        greeting: language === 'ar'
          ? `مرحباً ${args.userName}`
          : `Hello ${args.userName}`,
        content: [
          language === 'ar'
            ? 'شكراً لتسجيلك في منصة شبر. استخدم الرمز التالي لتأكيد بريدك الإلكتروني:'
            : 'Thank you for signing up with Shibr Platform. Use the following code to verify your email address:'
        ],
        code: args.otp,
        footerNote: language === 'ar'
          ? 'سينتهي هذا الرمز خلال 10 دقائق'
          : 'This code will expire in 10 minutes'
      })

      const { data, error } = await resend.emails.send({
        from: 'Shibr Platform <noreply@shibr.io>',
        to: args.email,
        subject,
        html,
      })

      if (error) {
        console.error('Failed to send email:', error)
        throw new Error(`Failed to send email: ${error.message}`)
      }

      return { success: true, messageId: data?.id }
    } catch (error: any) {
      console.error('Error sending verification email:', error)
      throw new Error(`Failed to send verification email: ${error.message}`)
    }
  }
})