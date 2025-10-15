import { v } from "convex/values"
import { mutation, internalAction } from "./_generated/server"
import { internal } from "./_generated/api"

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
 * Clean up expired OTPs for a phone number
 */
async function cleanupExpiredOTPs(ctx: any, phoneNumber: string) {
  const now = Date.now()
  const expiredOTPs = await ctx.db
    .query("verificationOTP")
    .withIndex("by_type_identifier", (q: any) => q.eq("type", "phone").eq("identifier", phoneNumber))
    .filter((q: any) => q.lt(q.field("expiresAt"), now))
    .collect()

  for (const otp of expiredOTPs) {
    await ctx.db.delete(otp._id)
  }
}

/**
 * Format phone number to ensure it starts with 966 for Saudi Arabia
 */
function formatPhoneNumber(phoneNumber: string): string {
  // Remove any non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '')
  
  // If it starts with 0, remove it
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1)
  }
  
  // If it doesn't start with 966, add it
  if (!cleaned.startsWith('966')) {
    cleaned = '966' + cleaned
  }
  
  return cleaned
}

// ============================================
// MUTATIONS - PHONE VERIFICATION FOR SIGNUP
// ============================================

/**
 * Send OTP for phone verification during signup
 */
export const sendPhoneOTP = mutation({
  args: {
    phoneNumber: v.string(),
    email: v.string(), // Associated email for linking
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const formattedPhone = formatPhoneNumber(args.phoneNumber)
    const email = args.email.toLowerCase().trim()

    // Clean up expired OTPs for this phone
    await cleanupExpiredOTPs(ctx, formattedPhone)

    // Check rate limiting
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    const recentOTPs = await ctx.db
      .query("verificationOTP")
      .withIndex("by_type_identifier", (q) => q.eq("type", "phone").eq("identifier", formattedPhone))
      .filter((q) => q.gt(q.field("createdAt"), oneHourAgo))
      .collect()

    if (recentOTPs.length >= MAX_OTP_REQUESTS_PER_HOUR) {
      return {
        success: false,
        error: "Too many verification attempts. Please try again later."
      }
    }

    // Delete any existing OTPs for this phone
    const existingOTPs = await ctx.db
      .query("verificationOTP")
      .withIndex("by_type_identifier", (q) => q.eq("type", "phone").eq("identifier", formattedPhone))
      .collect()

    for (const oldOTP of existingOTPs) {
      await ctx.db.delete(oldOTP._id)
    }

    // Generate new OTP
    const otp = generateOTP()
    const expiresAt = Date.now() + (OTP_EXPIRY_MINUTES * 60 * 1000)

    // Store OTP
    await ctx.db.insert("verificationOTP", {
      type: "phone",
      identifier: formattedPhone,
      email,
      otp,
      expiresAt,
      attempts: 0,
      createdAt: Date.now(),
      verified: false,
    })

    // Schedule WhatsApp OTP sending via Karzoun API
    await ctx.scheduler.runAfter(0, internal.phoneVerification.sendPhoneOTPViaKarzoun, {
      phoneNumber: formattedPhone,
      otp,
      userName: args.name,
    })

    return {
      success: true,
      message: "Verification code sent to your WhatsApp"
    }
  }
})

/**
 * Verify phone OTP
 */
export const verifyPhoneOTP = mutation({
  args: {
    phoneNumber: v.string(),
    email: v.string(),
    otp: v.string(),
  },
  handler: async (ctx, args) => {
    const formattedPhone = formatPhoneNumber(args.phoneNumber)
    const email = args.email.toLowerCase().trim()

    // Find the OTP record
    const otpRecord = await ctx.db
      .query("verificationOTP")
      .withIndex("by_type_identifier", (q) => q.eq("type", "phone").eq("identifier", formattedPhone))
      .filter((q) =>
        q.and(
          q.eq(q.field("email"), email),
          q.eq(q.field("otp"), args.otp)
        )
      )
      .first()

    if (!otpRecord) {
      // Try to find record to update attempts
      const phoneRecord = await ctx.db
        .query("verificationOTP")
        .withIndex("by_type_identifier", (q) => q.eq("type", "phone").eq("identifier", formattedPhone))
        .filter((q) => q.eq(q.field("email"), email))
        .first()
      
      if (phoneRecord) {
        // Update attempts
        await ctx.db.patch(phoneRecord._id, {
          attempts: phoneRecord.attempts + 1
        })
        
        // Check if too many attempts
        if (phoneRecord.attempts + 1 >= MAX_VERIFICATION_ATTEMPTS) {
          await ctx.db.delete(phoneRecord._id)
          return {
            success: false,
            error: "Too many failed attempts. Please request a new code"
          }
        }
      }
      
      return {
        success: false,
        error: "Invalid verification code"
      }
    }

    // Check if expired
    if (otpRecord.expiresAt < Date.now()) {
      await ctx.db.delete(otpRecord._id)
      return {
        success: false,
        error: "Verification code has expired"
      }
    }

    // Mark as verified but don't delete yet - will be cleaned up after account creation
    await ctx.db.patch(otpRecord._id, {
      verified: true
    })

    return {
      success: true,
      message: "Phone number verified successfully"
    }
  }
})

/**
 * Check if phone is verified (called after email verification)
 */
export const isPhoneVerified = mutation({
  args: {
    phoneNumber: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const formattedPhone = formatPhoneNumber(args.phoneNumber)
    const email = args.email.toLowerCase().trim()

    const otpRecord = await ctx.db
      .query("verificationOTP")
      .withIndex("by_type_identifier", (q) => q.eq("type", "phone").eq("identifier", formattedPhone))
      .filter((q) =>
        q.and(
          q.eq(q.field("email"), email),
          q.eq(q.field("verified"), true)
        )
      )
      .first()

    return {
      verified: !!otpRecord,
      phoneNumber: formattedPhone
    }
  }
})

/**
 * Cleanup phone verification records after successful account creation
 */
export const cleanupPhoneVerification = mutation({
  args: {
    phoneNumber: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const formattedPhone = formatPhoneNumber(args.phoneNumber)
    const email = args.email.toLowerCase().trim()

    // Query by phone number and filter by email
    const records = await ctx.db
      .query("verificationOTP")
      .withIndex("by_type_identifier", (q) => q.eq("type", "phone").eq("identifier", formattedPhone))
      .filter((q) => q.eq(q.field("email"), email))
      .collect()

    for (const record of records) {
      await ctx.db.delete(record._id)
    }

    return { success: true }
  }
})

/**
 * Resend phone OTP
 */
export const resendPhoneOTP = mutation({
  args: {
    phoneNumber: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const formattedPhone = formatPhoneNumber(args.phoneNumber)

    // Check cooldown - last OTP should be at least 60 seconds old
    const recentOTP = await ctx.db
      .query("verificationOTP")
      .withIndex("by_type_identifier", (q) => q.eq("type", "phone").eq("identifier", formattedPhone))
      .order("desc")
      .first()

    if (recentOTP && (Date.now() - recentOTP.createdAt < 60000)) {
      return {
        success: false,
        error: "Please wait before requesting a new code"
      }
    }

    // Delete any existing OTPs for this phone
    const existingOTPs = await ctx.db
      .query("verificationOTP")
      .withIndex("by_type_identifier", (q) => q.eq("type", "phone").eq("identifier", formattedPhone))
      .collect()

    for (const oldOTP of existingOTPs) {
      await ctx.db.delete(oldOTP._id)
    }

    // Generate new OTP
    const otp = generateOTP()
    const expiresAt = Date.now() + (OTP_EXPIRY_MINUTES * 60 * 1000)

    // Store OTP
    await ctx.db.insert("verificationOTP", {
      type: "phone",
      identifier: formattedPhone,
      email: args.email.toLowerCase().trim(),
      otp,
      expiresAt,
      attempts: 0,
      createdAt: Date.now(),
      verified: false,
    })

    // Schedule WhatsApp OTP sending
    await ctx.scheduler.runAfter(0, internal.phoneVerification.sendPhoneOTPViaKarzoun, {
      phoneNumber: formattedPhone,
      otp,
      userName: args.name,
    })

    return {
      success: true,
      message: "Verification code sent to your WhatsApp"
    }
  }
})

// ============================================
// INTERNAL ACTIONS - WHATSAPP SENDING
// ============================================

/**
 * Internal action to send phone OTP via Karzoun WhatsApp API
 */
export const sendPhoneOTPViaKarzoun = internalAction({
  args: {
    phoneNumber: v.string(),
    otp: v.string(),
    userName: v.string(),
  },
  handler: async (ctx, args) => {
    const karzounToken = process.env.KARZOUN_API_TOKEN
    const karzounSenderId = process.env.KARZOUN_SENDER_ID
    const templateName = process.env.KARZOUN_TEMPLATE_NAME

    console.log('Sending WhatsApp OTP to:', args.phoneNumber)

    if (!karzounToken || !karzounSenderId || !templateName) {
      throw new Error('Karzoun API credentials are not configured. Please set KARZOUN_API_TOKEN, KARZOUN_SENDER_ID, and KARZOUN_TEMPLATE_NAME in environment variables.')
    }

    try {
      // Build the API URL with template parameters
      // url_button parameter is required if the template has a URL button
      const apiUrl = `https://api.karzoun.app/CloudApi.php?token=${encodeURIComponent(karzounToken)}&sender_id=${encodeURIComponent(karzounSenderId)}&phone=${args.phoneNumber}&template=${templateName}&param_1=${args.otp}&url_button=${args.otp}`

      console.log('Calling Karzoun API with template:', templateName)
      console.log('Phone:', args.phoneNumber, 'OTP:', args.otp)

      // Make the API request
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Karzoun API error:', errorText)
        throw new Error(`Failed to send WhatsApp OTP: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()

      console.log('Karzoun API Response:', result)

      // Check if the API returned an error
      if (result.error) {
        console.error('Karzoun API returned error:', result)
        const errorMessage = typeof result.error === 'string' 
          ? result.error 
          : result.error.message || JSON.stringify(result.error)
        throw new Error(`Karzoun API error: ${errorMessage}`)
      }

      console.log('WhatsApp OTP sent successfully:', {
        phoneNumber: args.phoneNumber,
        response: result
      })

      return { 
        success: true, 
        messageId: result.message_id || result.id || 'unknown',
        response: result 
      }
    } catch (error: any) {
      console.error('Error sending WhatsApp OTP:', error)
      throw new Error(`Failed to send WhatsApp OTP: ${error.message}`)
    }
  }
})
