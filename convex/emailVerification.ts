import { v } from "convex/values"
import { mutation, query, internalAction } from "./_generated/server"
import { internal } from "./_generated/api"
import { Resend } from "resend"
import { generateEmailHTML } from "../lib/email-template"

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================
const OTP_EXPIRY_MINUTES = 10
const MAX_VERIFICATION_ATTEMPTS = 5
const MAX_OTP_REQUESTS_PER_HOUR = 5
const RESEND_COOLDOWN_SECONDS = 60

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
 * Log with consistent formatting for debugging
 */
function log(prefix: string, message: string, data?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${prefix} ${message}`, data ? JSON.stringify(data, null, 2) : '')
}

// ============================================
// INTERNAL HELPER FUNCTIONS
// ============================================

/**
 * Clean up expired OTPs for all users (can be scheduled)
 */
async function cleanupExpiredOTPs(ctx: any) {
  log('🧹', 'Starting OTP cleanup')

  const now = Date.now()
  const expiredOTPs = await ctx.db
    .query("emailVerificationOTP")
    .filter((q: any) => q.lt(q.field("expiresAt"), now))
    .collect()

  let deletedCount = 0
  for (const otp of expiredOTPs) {
    await ctx.db.delete(otp._id)
    deletedCount++
  }

  log('🧹', `Cleaned up ${deletedCount} expired OTPs`)
  return deletedCount
}

/**
 * Internal helper for sending verification OTP with comprehensive logging
 */
async function sendVerificationOTPInternal(
  ctx: any,
  args: { userId: any; email: string; userName?: string }
): Promise<{ success: boolean; error?: string; message?: string; otpId?: any }> {
  log('📧', 'sendVerificationOTPInternal called', { userId: args.userId, email: args.email })

  try {
    // Step 1: Check if email is already verified
    const existingVerifiedOTP = await ctx.db
      .query("emailVerificationOTP")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .filter((q: any) => q.eq(q.field("verified"), true))
      .first()

    if (existingVerifiedOTP) {
      log('✅', 'Email already verified', { userId: args.userId })
      return {
        success: false,
        error: "Email is already verified"
      }
    }

    // Step 2: Check rate limiting
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    const recentOTPs = await ctx.db
      .query("emailVerificationOTP")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .filter((q: any) => q.gt(q.field("createdAt"), oneHourAgo))
      .collect()

    log('🔒', 'Rate limit check', { recentRequests: recentOTPs.length, limit: MAX_OTP_REQUESTS_PER_HOUR })

    if (recentOTPs.length >= MAX_OTP_REQUESTS_PER_HOUR) {
      log('❌', 'Rate limit exceeded', { userId: args.userId })
      return {
        success: false,
        error: "Too many verification attempts. Please try again later."
      }
    }

    // Step 3: Clean up old unverified OTPs for this user
    const existingUnverifiedOTPs = await ctx.db
      .query("emailVerificationOTP")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .filter((q: any) => q.eq(q.field("verified"), false))
      .collect()

    log('🗑️', 'Cleaning up old OTPs', { count: existingUnverifiedOTPs.length })

    for (const oldOTP of existingUnverifiedOTPs) {
      await ctx.db.delete(oldOTP._id)
    }

    // Step 4: Generate new OTP
    const otp = generateOTP()
    const expiresAt = Date.now() + (OTP_EXPIRY_MINUTES * 60 * 1000)

    log('🔑', 'Generated new OTP', {
      otp,
      expiresAt: new Date(expiresAt).toISOString(),
      expiryMinutes: OTP_EXPIRY_MINUTES
    })

    // Step 5: Store the OTP
    const otpId = await ctx.db.insert("emailVerificationOTP", {
      userId: args.userId,
      email: args.email,
      otp,
      expiresAt,
      verified: false,
      attempts: 0,
      createdAt: Date.now(),
    })

    log('💾', 'OTP stored in database', { otpId })

    // Step 6: Schedule email to be sent
    await ctx.scheduler.runAfter(0, internal.emailVerification.sendOTPEmail, {
      email: args.email,
      otp,
      userName: args.userName,
    })

    log('📨', 'Email scheduled for sending', { email: args.email })

    return {
      success: true,
      message: "Verification code has been sent to your email.",
      otpId
    }
  } catch (error: any) {
    log('❌', 'Error in sendVerificationOTPInternal', error)
    return {
      success: false,
      error: error.message || "Failed to send verification code"
    }
  }
}

// ============================================
// PUBLIC MUTATIONS
// ============================================

/**
 * Send verification OTP to user's email
 */
export const sendVerificationOTP = mutation({
  args: {
    userId: v.id("users"),
    email: v.string(),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    log('🚀', 'sendVerificationOTP mutation called', { userId: args.userId })
    return await sendVerificationOTPInternal(ctx, args)
  },
})

/**
 * Verify OTP code entered by user
 */
export const verifyOTP = mutation({
  args: {
    userId: v.id("users"),
    otp: v.string(),
  },
  handler: async (ctx, args) => {
    log('🔐', 'verifyOTP mutation called', { userId: args.userId, otp: args.otp })

    try {
      // Step 1: Find the most recent OTP record for this user
      const otpRecords = await ctx.db
        .query("emailVerificationOTP")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("verified"), false))
        .order("desc")
        .take(1)

      const otpRecord = otpRecords[0]

      if (!otpRecord) {
        log('❌', 'No OTP record found', { userId: args.userId })
        return {
          success: false,
          error: "No verification code found. Please request a new one."
        }
      }

      log('📋', 'Found OTP record', {
        otpId: otpRecord._id,
        attempts: otpRecord.attempts,
        expiresAt: new Date(otpRecord.expiresAt).toISOString()
      })

      // Step 2: Check if OTP has expired
      if (Date.now() > otpRecord.expiresAt) {
        log('⏰', 'OTP expired', { userId: args.userId })
        // Clean up expired OTP
        await ctx.db.delete(otpRecord._id)
        return {
          success: false,
          error: "Verification code has expired. Please request a new one."
        }
      }

      // Step 3: Check max attempts
      if (otpRecord.attempts >= MAX_VERIFICATION_ATTEMPTS) {
        log('🚫', 'Max attempts exceeded', { userId: args.userId, attempts: otpRecord.attempts })
        // Delete the OTP to force user to request new one
        await ctx.db.delete(otpRecord._id)
        return {
          success: false,
          error: "Too many failed attempts. Please request a new code."
        }
      }

      // Step 4: Verify the OTP
      if (otpRecord.otp !== args.otp) {
        log('❌', 'Invalid OTP', { userId: args.userId, provided: args.otp, expected: otpRecord.otp })

        // Increment attempts
        await ctx.db.patch(otpRecord._id, {
          attempts: otpRecord.attempts + 1
        })

        const remainingAttempts = MAX_VERIFICATION_ATTEMPTS - otpRecord.attempts - 1
        return {
          success: false,
          error: `Invalid verification code. ${remainingAttempts} attempts remaining.`
        }
      }

      // Step 5: Mark as verified
      log('✅', 'OTP verified successfully', { userId: args.userId })

      await ctx.db.patch(otpRecord._id, {
        verified: true,
        verifiedAt: Date.now(),
      })

      // Step 6: Clean up any other unverified OTPs for this user
      const otherOTPs = await ctx.db
        .query("emailVerificationOTP")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) =>
          q.and(
            q.neq(q.field("_id"), otpRecord._id),
            q.eq(q.field("verified"), false)
          )
        )
        .collect()

      for (const otp of otherOTPs) {
        await ctx.db.delete(otp._id)
      }

      log('🎉', 'Email verification complete', { userId: args.userId })

      return {
        success: true,
        message: "Email verified successfully!"
      }
    } catch (error: any) {
      log('❌', 'Error in verifyOTP', error)
      return {
        success: false,
        error: "An error occurred during verification. Please try again."
      }
    }
  },
})

/**
 * Resend OTP to user's email
 */
export const resendOTP = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    log('🔄', 'resendOTP mutation called', { userId: args.userId })

    try {
      // Get user details
      const user = await ctx.db.get(args.userId)

      if (!user) {
        log('❌', 'User not found', { userId: args.userId })
        return {
          success: false,
          error: "User not found"
        }
      }

      if (!user.email) {
        log('❌', 'User has no email', { userId: args.userId })
        return {
          success: false,
          error: "User email not found"
        }
      }

      // Check if already verified
      const verifiedOTP = await ctx.db
        .query("emailVerificationOTP")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("verified"), true))
        .first()

      if (verifiedOTP) {
        log('✅', 'Email already verified', { userId: args.userId })
        return {
          success: false,
          error: "Email is already verified"
        }
      }

      // Check cooldown period
      const recentOTP = await ctx.db
        .query("emailVerificationOTP")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("verified"), false))
        .order("desc")
        .first()

      if (recentOTP) {
        const cooldownEnd = recentOTP.createdAt + (RESEND_COOLDOWN_SECONDS * 1000)
        if (Date.now() < cooldownEnd) {
          const remainingSeconds = Math.ceil((cooldownEnd - Date.now()) / 1000)
          log('⏱️', 'Resend cooldown active', { remainingSeconds })
          return {
            success: false,
            error: `Please wait ${remainingSeconds} seconds before requesting a new code`
          }
        }
      }

      // Send new OTP
      return await sendVerificationOTPInternal(ctx, {
        userId: args.userId,
        email: user.email,
        userName: user.name || undefined,
      })
    } catch (error: any) {
      log('❌', 'Error in resendOTP', error)
      return {
        success: false,
        error: "Failed to resend verification code"
      }
    }
  },
})

// ============================================
// PUBLIC QUERIES
// ============================================

/**
 * Check verification status for a specific user
 */
export const checkVerificationStatus = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    log('🔍', 'checkVerificationStatus query called', { userId: args.userId })

    try {
      const user = await ctx.db.get(args.userId)

      if (!user) {
        log('❌', 'User not found in checkVerificationStatus', { userId: args.userId })
        return {
          verified: false,
          error: "User not found"
        }
      }

      // Check for verified OTP
      const verifiedOTP = await ctx.db
        .query("emailVerificationOTP")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("verified"), true))
        .first()

      if (verifiedOTP) {
        log('✅', 'User email is verified', { userId: args.userId, verifiedAt: verifiedOTP.verifiedAt })
        return {
          verified: true,
          verifiedAt: verifiedOTP.verifiedAt
        }
      }

      // Check for pending OTP
      const pendingOTP = await ctx.db
        .query("emailVerificationOTP")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) =>
          q.and(
            q.eq(q.field("verified"), false),
            q.gt(q.field("expiresAt"), Date.now())
          )
        )
        .first()

      log('🔄', 'Verification status', {
        userId: args.userId,
        verified: false,
        hasPendingOTP: !!pendingOTP
      })

      return {
        verified: false,
        hasPendingOTP: !!pendingOTP,
        otpExpiresAt: pendingOTP?.expiresAt
      }
    } catch (error: any) {
      log('❌', 'Error in checkVerificationStatus', error)
      return {
        verified: false,
        error: "Failed to check verification status"
      }
    }
  },
})

/**
 * Check if current authenticated user's email is verified
 */
export const isCurrentUserVerified = query({
  args: {},
  handler: async (ctx) => {
    log('👤', 'isCurrentUserVerified query called')

    try {
      const identity = await ctx.auth.getUserIdentity()
      log('🔍', 'Identity object', {
        hasIdentity: !!identity,
        email: identity?.email,
        subject: identity?.subject
      })

      if (!identity) {
        log('❌', 'No user identity found')
        return { verified: false, needsVerification: false }
      }

      // Check if we have an email in the identity
      if (!identity.email) {
        log('❌', 'No email in identity', { identity })
        return { verified: false, needsVerification: false }
      }

      // Get the user from the database
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), identity.email))
        .first()

      if (!user) {
        log('❌', 'User not found by email', { email: identity.email })
        return { verified: false, needsVerification: false }
      }

      // Development mode bypass (only for explicit flag)
      const skipVerification = process.env.SKIP_EMAIL_VERIFICATION === "true"
      if (skipVerification) {
        log('⚠️', 'SKIP_EMAIL_VERIFICATION is true - bypassing verification')
        return { verified: true, needsVerification: false, skipped: true }
      }

      // Check for verified OTP
      const verifiedOTP = await ctx.db
        .query("emailVerificationOTP")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("verified"), true))
        .first()

      log('🔍', 'Current user verification status', {
        userId: user._id,
        email: user.email,
        verified: !!verifiedOTP
      })

      return {
        verified: !!verifiedOTP,
        needsVerification: !verifiedOTP,
        userId: user._id
      }
    } catch (error: any) {
      log('❌', 'Error in isCurrentUserVerified', error)
      return { verified: false, needsVerification: false, error: error.message }
    }
  }
})

/**
 * Get verification history for debugging (admin only in production)
 */
export const getVerificationHistory = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    log('📊', 'getVerificationHistory query called', { userId: args.userId })

    const otps = await ctx.db
      .query("emailVerificationOTP")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(10)

    return otps.map(otp => ({
      id: otp._id,
      createdAt: otp.createdAt,
      expiresAt: otp.expiresAt,
      verified: otp.verified,
      verifiedAt: otp.verifiedAt,
      attempts: otp.attempts,
      isExpired: Date.now() > otp.expiresAt
    }))
  }
})

// ============================================
// INTERNAL ACTIONS
// ============================================

/**
 * Send OTP email via Resend service
 */
export const sendOTPEmail = internalAction({
  args: {
    email: v.string(),
    otp: v.string(),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    log('📮', 'sendOTPEmail action called', { email: args.email, otp: args.otp })

    // Development mode check
    const isDevelopment = process.env.NODE_ENV === 'development'
    const skipEmail = process.env.SKIP_EMAIL_VERIFICATION === 'true'

    if (isDevelopment && !process.env.RESEND_API_KEY) {
      log('⚠️', 'Development mode - No RESEND_API_KEY, showing OTP in console', {
        email: args.email,
        otp: args.otp
      })
      console.log('\n' + '='.repeat(50))
      console.log('📧 EMAIL VERIFICATION OTP')
      console.log('='.repeat(50))
      console.log(`To: ${args.email}`)
      console.log(`OTP Code: ${args.otp}`)
      console.log(`Valid for: ${OTP_EXPIRY_MINUTES} minutes`)
      console.log('='.repeat(50) + '\n')

      return {
        success: true,
        data: {
          id: 'dev-console',
          message: 'OTP displayed in console (development mode)'
        }
      }
    }

    if (skipEmail) {
      log('⚠️', 'SKIP_EMAIL_VERIFICATION is true - Email not sent')
      return {
        success: true,
        data: {
          id: 'skipped',
          message: 'Email skipped due to SKIP_EMAIL_VERIFICATION flag'
        }
      }
    }

    try {
      const resend = new Resend(process.env.RESEND_API_KEY)

      // Determine user's preferred language (default to 'en' for now)
      const language: 'en' | 'ar' = 'en'
      const isArabic = language === 'ar'

      const greeting = args.userName
        ? (isArabic ? `مرحباً ${args.userName}` : `Hello ${args.userName}`)
        : (isArabic ? 'مرحباً' : 'Hello')

      const emailData = generateEmailHTML({
        language,
        subject: isArabic
          ? 'تأكيد بريدك الإلكتروني - شبر'
          : 'Verify Your Email - Shibr',
        preheader: isArabic
          ? 'رمز التحقق الخاص بك لتأكيد حسابك'
          : 'Your verification code to confirm your account',
        heading: isArabic
          ? 'تأكيد بريدك الإلكتروني'
          : 'Verify Your Email',
        greeting,
        content: [
          isArabic
            ? 'شكراً لتسجيلك في منصة شبر. لإكمال إعداد حسابك، يرجى التحقق من بريدك الإلكتروني باستخدام الرمز أدناه.'
            : 'Thank you for registering with Shibr. To complete your account setup, please verify your email address using the code below.',
          isArabic
            ? `هذا الرمز صالح لمدة ${OTP_EXPIRY_MINUTES} دقائق فقط.`
            : `This code is valid for ${OTP_EXPIRY_MINUTES} minutes only.`
        ],
        code: args.otp,
        warning: {
          title: isArabic ? 'ملاحظة مهمة:' : 'Important Note:',
          message: isArabic
            ? 'إذا لم تقم بإنشاء حساب على منصة شبر، يمكنك تجاهل هذا البريد الإلكتروني بأمان.'
            : 'If you didn\'t create an account on Shibr, you can safely ignore this email.'
        },
        footerNote: isArabic
          ? 'إذا واجهت أي مشاكل، يرجى التواصل مع فريق الدعم لدينا.'
          : 'If you encounter any issues, please contact our support team.'
      })

      const result = await resend.emails.send({
        from: 'Shibr <noreply@shibr.io>',
        to: args.email,
        subject: emailData.subject,
        html: emailData.html,
      })

      log('✅', 'Email sent successfully', { emailId: result.data?.id })
      return { success: true, data: result.data }
    } catch (error: any) {
      log('❌', 'Failed to send email', error)
      return {
        success: false,
        error: error?.message || 'Failed to send email'
      }
    }
  },
})

/**
 * Cleanup expired OTPs (can be scheduled to run periodically)
 */
export const cleanupOTPs = internalAction({
  args: {},
  handler: async (ctx) => {
    log('🧹', 'cleanupOTPs action called')
    // This would need database access, so we'd need to make it a mutation
    // or use a different approach for cleanup
    return { message: "Cleanup should be implemented as a scheduled mutation" }
  }
})