import { v } from "convex/values"
import { mutation, query, internalAction } from "./_generated/server"
import { internal } from "./_generated/api"
import { Resend } from "resend"
import { generateEmailHTML } from "../lib/email-template"

const OTP_EXPIRY_MINUTES = 10
const MAX_VERIFICATION_ATTEMPTS = 3
const MAX_OTP_REQUESTS_PER_HOUR = 3

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Internal helper function for sending verification OTP
async function sendVerificationOTPInternal(
  ctx: any,
  args: { userId: any; email: string; userName?: string }
): Promise<{ success: boolean; error?: string; message?: string }> {
  // Check for rate limiting - max 3 OTP requests per hour
  const oneHourAgo = Date.now() - (60 * 60 * 1000)
  const recentOTPs = await ctx.db
    .query("emailVerificationOTP")
    .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
    .filter((q: any) => q.gt(q.field("createdAt"), oneHourAgo))
    .collect()

  if (recentOTPs.length >= MAX_OTP_REQUESTS_PER_HOUR) {
    return {
      success: false,
      error: "Too many verification attempts. Please try again later."
    }
  }

  // Invalidate any existing unused OTPs for this user
  const existingOTPs = await ctx.db
    .query("emailVerificationOTP")
    .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
    .filter((q: any) => q.eq(q.field("verified"), false))
    .collect()

  for (const otp of existingOTPs) {
    await ctx.db.patch(otp._id, { verified: true })
  }

  // Generate new OTP
  const otp = generateOTP()
  const expiresAt = Date.now() + (OTP_EXPIRY_MINUTES * 60 * 1000)

  // Store the OTP
  await ctx.db.insert("emailVerificationOTP", {
    userId: args.userId,
    email: args.email,
    otp,
    expiresAt,
    verified: false,
    attempts: 0,
    createdAt: Date.now(),
  })

  // Schedule the email to be sent
  await ctx.scheduler.runAfter(0, internal.emailVerification.sendOTPEmail, {
    email: args.email,
    otp,
    userName: args.userName,
  })

  return {
    success: true,
    message: "Verification code has been sent to your email."
  }
}

export const sendVerificationOTP = mutation({
  args: {
    userId: v.id("users"),
    email: v.string(),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await sendVerificationOTPInternal(ctx, args)
  },
})

export const sendOTPEmail = internalAction({
  args: {
    email: v.string(),
    otp: v.string(),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Determine user's preferred language (default to 'en' for now)
    // In production, you'd get this from user preferences
    const language: 'en' | 'ar' = 'en'
    const isArabic = (language as string) === 'ar'

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

    try {
      const result = await resend.emails.send({
        from: 'Shibr <no-reply@shibr.sa>',
        to: args.email,
        subject: emailData.subject,
        html: emailData.html,
      })

      console.log("Verification email sent successfully:", result)
      return { success: true, data: result }
    } catch (error: any) {
      console.error("Failed to send verification email:", error)
      return {
        success: false,
        error: error?.message || 'Failed to send email'
      }
    }
  },
})

export const verifyOTP = mutation({
  args: {
    userId: v.id("users"),
    otp: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the OTP record
    const otpRecord = await ctx.db
      .query("emailVerificationOTP")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("otp"), args.otp),
          q.eq(q.field("verified"), false)
        )
      )
      .first()

    if (!otpRecord) {
      return {
        success: false,
        error: "Invalid verification code"
      }
    }

    // Check if OTP has expired
    if (Date.now() > otpRecord.expiresAt) {
      return {
        success: false,
        error: "Verification code has expired"
      }
    }

    // Check attempts
    if (otpRecord.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      return {
        success: false,
        error: "Too many failed attempts. Please request a new code."
      }
    }

    // Verify the OTP
    if (otpRecord.otp !== args.otp) {
      // Increment attempts
      await ctx.db.patch(otpRecord._id, {
        attempts: otpRecord.attempts + 1
      })

      return {
        success: false,
        error: "Invalid verification code"
      }
    }

    // Mark as verified
    await ctx.db.patch(otpRecord._id, {
      verified: true,
      verifiedAt: Date.now(),
    })

    // Update user's email verification status
    const user = await ctx.db.get(args.userId)
    if (user) {
      await ctx.db.patch(args.userId, {
        emailVerificationTime: Date.now(),
      })
    }

    return {
      success: true,
      message: "Email verified successfully"
    }
  },
})

export const checkVerificationStatus = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)

    if (!user) {
      return {
        verified: false,
        error: "User not found"
      }
    }

    // Check if email is already verified
    if (user.emailVerificationTime) {
      return {
        verified: true,
        verifiedAt: user.emailVerificationTime
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

    return {
      verified: false,
      hasPendingOTP: !!pendingOTP,
      otpExpiresAt: pendingOTP?.expiresAt
    }
  },
})

export const resendOTP = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)

    if (!user) {
      return {
        success: false,
        error: "User not found"
      }
    }

    if (user.emailVerificationTime) {
      return {
        success: false,
        error: "Email is already verified"
      }
    }

    // Use the internal helper function
    return await sendVerificationOTPInternal(ctx, {
      userId: args.userId,
      email: user.email!,
      userName: user.name || undefined,
    })
  },
})