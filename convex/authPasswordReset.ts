import { Email } from "@convex-dev/auth/providers/Email";
import { Resend as ResendAPI } from "resend";
import { generateEmailHTML } from "../lib/email-template";
import { alphabet, generateRandomString } from "oslo/crypto";

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
      console.log('\n' + '='.repeat(50))
      console.log('📧 PASSWORD RESET OTP')
      console.log('='.repeat(50))
      console.log(`To: ${email}`)
      console.log(`OTP Code: ${token}`)
      console.log(`Valid for: 10 minutes`)
      console.log('='.repeat(50) + '\n')
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
        console.error('Resend error:', error);
        // Fall back to console logging in development
        console.log('\n' + '='.repeat(50))
        console.log('📧 PASSWORD RESET OTP (Resend failed, showing in console)')
        console.log('='.repeat(50))
        console.log(`To: ${email}`)
        console.log(`OTP Code: ${token}`)
        console.log(`Valid for: 10 minutes`)
        console.log('='.repeat(50) + '\n')
        // Don't throw error, just log it
        return;
      }
    } catch (err) {
      // Fall back to console logging if Resend fails
      console.error('Failed to send email via Resend:', err);
      console.log('\n' + '='.repeat(50))
      console.log('📧 PASSWORD RESET OTP (Email service error)')
      console.log('='.repeat(50))
      console.log(`To: ${email}`)
      console.log(`OTP Code: ${token}`)
      console.log(`Valid for: 10 minutes`)
      console.log('='.repeat(50) + '\n')
    }
  },
});