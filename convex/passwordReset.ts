import { v } from "convex/values"
import { mutation, action, query, internalAction } from "./_generated/server"
import { api, internal } from "./_generated/api"
import { Resend } from "resend"

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
    const direction = isArabic ? 'rtl' : 'ltr'
    const fontFamily = isArabic ? 'Cairo, Arial, sans-serif' : 'Inter, Arial, sans-serif'

    const subject = isArabic
      ? 'إعادة تعيين كلمة المرور - شبر'
      : 'Reset Your Password - Shibr'

    const greeting = args.userName
      ? (isArabic ? `مرحباً ${args.userName}` : `Hello ${args.userName}`)
      : (isArabic ? 'مرحباً' : 'Hello')

    const html = `
      <!DOCTYPE html>
      <html dir="${direction}" lang="${isArabic ? 'ar' : 'en'}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Inter:wght@400;600;700&display=swap');
          body {
            margin: 0;
            padding: 0;
            font-family: ${fontFamily};
            background-color: #f5f5f5;
            direction: ${direction};
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #725CAD 0%, #8B6DC9 100%);
            padding: 32px;
            text-align: center;
          }
          .logo {
            font-size: 36px;
            font-weight: bold;
            color: white;
            margin-bottom: 8px;
          }
          .content {
            padding: 40px 32px;
            text-align: ${isArabic ? 'right' : 'left'};
          }
          h1 {
            color: #1a1a1a;
            font-size: 24px;
            margin-bottom: 16px;
            font-weight: 600;
          }
          p {
            color: #666666;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          .button {
            display: inline-block;
            background-color: #725CAD;
            color: white !important;
            padding: 14px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
            color: #856404;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 24px 32px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          .footer p {
            color: #999999;
            font-size: 14px;
            margin: 0;
          }
          .link-text {
            color: #725CAD;
            word-break: break-all;
            font-size: 14px;
            margin-top: 16px;
            padding: 12px;
            background-color: #f8f9fa;
            border-radius: 4px;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">شبر | Shibr</div>
          </div>
          <div class="content">
            <h1>${greeting}</h1>
            <p>
              ${isArabic
                ? 'لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك على منصة شبر.'
                : 'We received a request to reset the password for your Shibr account.'}
            </p>
            <p>
              ${isArabic
                ? 'انقر على الزر أدناه لإعادة تعيين كلمة المرور الخاصة بك:'
                : 'Click the button below to reset your password:'}
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" class="button">
                ${isArabic ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
              </a>
            </div>
            <div class="warning">
              <strong>${isArabic ? 'ملاحظة مهمة:' : 'Important Note:'}</strong><br>
              ${isArabic
                ? 'هذا الرابط صالح لمدة ساعة واحدة فقط. إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني بأمان.'
                : 'This link is valid for 1 hour only. If you didn\'t request a password reset, you can safely ignore this email.'}
            </div>
            <p style="font-size: 14px; color: #999;">
              ${isArabic
                ? 'إذا كان الزر لا يعمل، يمكنك نسخ الرابط التالي ولصقه في متصفحك:'
                : 'If the button doesn\'t work, you can copy and paste the following link into your browser:'}
            </p>
            <div class="link-text">${resetLink}</div>
          </div>
          <div class="footer">
            <p>
              ${isArabic
                ? '© 2024 شبر. جميع الحقوق محفوظة.'
                : '© 2024 Shibr. All rights reserved.'}
            </p>
            <p style="margin-top: 8px;">
              ${isArabic
                ? 'هذا بريد إلكتروني تلقائي، يرجى عدم الرد عليه.'
                : 'This is an automated email, please do not reply.'}
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    try {
      const result = await resend.emails.send({
        from: 'Shibr <no-reply@shibr.sa>',
        to: args.email,
        subject,
        html,
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