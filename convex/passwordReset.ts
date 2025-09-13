import { v } from "convex/values"
import { mutation, action, query, internalAction } from "./_generated/server"
import { api, internal } from "./_generated/api"
import { Resend } from "resend"
import { generateEmailHTML } from "../lib/email-template"

const RESET_TOKEN_EXPIRY_HOURS = 1
const MAX_RESET_ATTEMPTS_PER_HOUR = 3

export const requestPasswordReset = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first()

    if (!user) {
      // Don't reveal if user exists or not for security
      return { success: true, message: "If an account exists with this email, you will receive a password reset link." }
    }

    // Check for rate limiting - max 3 attempts per hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000)
    const recentTokens = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.gt(q.field("createdAt"), oneHourAgo))
      .collect()

    if (recentTokens.length >= MAX_RESET_ATTEMPTS_PER_HOUR) {
      return {
        success: false,
        error: "Too many reset attempts. Please try again later."
      }
    }

    // Invalidate any existing unused tokens for this user
    const existingTokens = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("used"), false))
      .collect()

    for (const token of existingTokens) {
      await ctx.db.patch(token._id, { used: true })
    }

    // Generate a secure random token
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const expiresAt = Date.now() + (RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

    // Store the token
    await ctx.db.insert("passwordResetTokens", {
      userId: user._id,
      token,
      expiresAt,
      used: false,
      createdAt: Date.now(),
    })

    // Schedule the email to be sent
    await ctx.scheduler.runAfter(0, internal.passwordReset.sendResetEmail, {
      email: args.email,
      token,
      userName: user.name || undefined,
    })

    return {
      success: true,
      message: "If an account exists with this email, you will receive a password reset link."
    }
  },
})

export const sendResetEmail = internalAction({
  args: {
    email: v.string(),
    token: v.string(),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const siteUrl = process.env.SITE_URL || "http://localhost:3000"
    const resetLink = `${siteUrl}/reset-password?token=${args.token}`

    // Determine user's preferred language (default to 'en' for now)
    const language: 'en' | 'ar' = 'en' // or 'ar' based on user preference
    const isArabic = language === 'ar'

    const greeting = args.userName
      ? (isArabic ? `مرحباً ${args.userName}` : `Hello ${args.userName}`)
      : (isArabic ? 'مرحباً' : 'Hello')

    const emailData = generateEmailHTML({
      language,
      subject: isArabic
        ? 'إعادة تعيين كلمة المرور - شبر'
        : 'Reset Your Password - Shibr',
      preheader: isArabic
        ? 'طلب إعادة تعيين كلمة المرور الخاصة بك'
        : 'Your password reset request',
      heading: isArabic
        ? 'إعادة تعيين كلمة المرور'
        : 'Reset Your Password',
      greeting,
      content: [
        isArabic
          ? 'لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك على منصة شبر.'
          : 'We received a request to reset the password for your Shibr account.',
        isArabic
          ? 'انقر على الزر أدناه لإعادة تعيين كلمة المرور الخاصة بك:'
          : 'Click the button below to reset your password:'
      ],
      buttonText: isArabic ? 'إعادة تعيين كلمة المرور' : 'Reset Password',
      buttonUrl: resetLink,
      warning: {
        title: isArabic ? 'ملاحظة مهمة:' : 'Important Note:',
        message: isArabic
          ? 'هذا الرابط صالح لمدة ساعة واحدة فقط. إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني بأمان.'
          : 'This link is valid for 1 hour only. If you didn\'t request a password reset, you can safely ignore this email.'
      }
    })



    try {
      const result = await resend.emails.send({
        from: 'Shibr <no-reply@shibr.sa>',
        to: args.email,
        subject: emailData.subject,
        html: emailData.html,
      })

      console.log("Password reset email sent successfully:", result)
      return { success: true, data: result }
    } catch (error: any) {
      console.error("Failed to send password reset email:", error)
      return {
        success: false,
        error: error?.message || 'Failed to send email'
      }
    }
  },
})

export const verifyResetToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const resetToken = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first()

    if (!resetToken) {
      return { valid: false, error: "Invalid or expired token" }
    }

    if (resetToken.used) {
      return { valid: false, error: "This token has already been used" }
    }

    if (Date.now() > resetToken.expiresAt) {
      return { valid: false, error: "This token has expired" }
    }

    return { valid: true }
  },
})

export const resetPassword = mutation({
  args: {
    token: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify token
    const resetToken = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first()

    if (!resetToken) {
      throw new Error("Invalid or expired token")
    }

    if (resetToken.used) {
      throw new Error("This token has already been used")
    }

    if (Date.now() > resetToken.expiresAt) {
      throw new Error("This token has expired")
    }

    // Get the user
    const user = await ctx.db.get(resetToken.userId)
    if (!user) {
      throw new Error("User not found")
    }

    // Update the password using Convex Auth
    // Import bcryptjs
    const bcrypt = await import("bcryptjs")
    const hashedPassword = await bcrypt.hash(args.newPassword, 10)

    // Find and update the authAccounts entry for password provider
    const authAccounts = await ctx.db
      .query("authAccounts")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), resetToken.userId),
          q.eq(q.field("provider"), "password")
        )
      )
      .collect()

    if (authAccounts.length === 0) {
      throw new Error("Password account not found")
    }

    // Update the password
    for (const account of authAccounts) {
      await ctx.db.patch(account._id, {
        secret: hashedPassword,
      })
    }

    // Mark token as used
    await ctx.db.patch(resetToken._id, {
      used: true,
      usedAt: Date.now(),
    })

    return { success: true, message: "Password has been reset successfully" }
  },
})