import { Email } from "@convex-dev/auth/providers/Email";
import { Resend as ResendAPI } from "resend";
import { generateEmailHTML } from "../lib/email-template";
import { alphabet, generateRandomString } from "oslo/crypto";
import { logger } from "./logger";

// Create the Resend OTP Password Reset provider
export const ResendOTPPasswordReset = Email({
  id: "resend-otp-password-reset",
  apiKey: process.env.RESEND_API_KEY!,
  maxAge: 60 * 10, // 10 minutes
  async generateVerificationToken() {
    // Generate a 6-digit OTP
    return generateRandomString(6, alphabet("0-9"));
  },
  async sendVerificationRequest({ identifier: email, token, provider }: any) {
    // Use development mode if no API key
    if (!process.env.RESEND_API_KEY) {
      logger.debug('Password Reset OTP Email')
      
      
      logger.debug('OTP Email', { to: email, token })
      
      
      
      return
    }

    const resend = new ResendAPI(process.env.RESEND_API_KEY);

    const language = 'en' as 'en' | 'ar';
    const isArabic = language === 'ar';

    const { subject, html } = generateEmailHTML({
      language,
      subject: isArabic
        ? 'إعادة تعيين كلمة المرور - منصة شبر'
        : 'Password Reset - Shibr Platform',
      heading: isArabic ? 'إعادة تعيين كلمة المرور' : 'Password Reset',
      greeting: isArabic ? 'مرحباً' : 'Hello',
      content: [
        isArabic
          ? 'لقد طلبت إعادة تعيين كلمة المرور. استخدم الرمز التالي لإعادة تعيين كلمة المرور:'
          : 'You requested a password reset. Use the following code to reset your password:'
      ],
      code: token,
      footerNote: isArabic
        ? 'سينتهي هذا الرمز خلال 10 دقائق'
        : 'This code will expire in 10 minutes'
    });

    try {
      const { error } = await resend.emails.send({
        from: 'Shibr Platform <noreply@shibr.io>',
        to: email,
        subject,
        html,
      });

      if (error) {
        logger.error('Resend error', error);
        // Fall back to debug logging in development
        logger.debug('Password Reset OTP Email', { to: email, token })
        // Don't throw error, just log it
        return;
      }
    } catch (err) {
      // Fall back to debug logging if Resend fails
      logger.error('Failed to send email via Resend', err);
      logger.debug('Password Reset OTP Email (Email service error)', { to: email, token })
      
      
      
    }
  },
});