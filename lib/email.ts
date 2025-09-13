import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
}

export class EmailService {
  private static instance: EmailService
  private resend: Resend
  private defaultFrom = 'Shibr <noreply@shibr.io>'

  private constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY)
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const result = await this.resend.emails.send({
        from: options.from || this.defaultFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
      })

      return { success: true, data: result }
    } catch (error: any) {
      console.error('Failed to send email:', error)
      return {
        success: false,
        error: error?.message || 'Failed to send email'
      }
    }
  }

  async sendPasswordResetEmail(
    email: string,
    resetLink: string,
    language: 'ar' | 'en' = 'en',
    userName?: string
  ): Promise<{ success: boolean; error?: string }> {
    const isArabic = language === 'ar'
    const direction = isArabic ? 'rtl' : 'ltr'
    const fontFamily = isArabic ? 'Cairo, Arial, sans-serif' : 'Inter, Arial, sans-serif'

    const subject = isArabic
      ? 'إعادة تعيين كلمة المرور - شبر'
      : 'Reset Your Password - Shibr'

    const greeting = userName
      ? (isArabic ? `مرحباً ${userName}` : `Hello ${userName}`)
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

          .button:hover {
            background-color: #5e4b8f;
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

            <div class="link-text">
              ${resetLink}
            </div>
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

    const text = isArabic
      ? `${greeting}

لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك على منصة شبر.

لإعادة تعيين كلمة المرور، يرجى زيارة الرابط التالي:
${resetLink}

ملاحظة مهمة: هذا الرابط صالح لمدة ساعة واحدة فقط.

إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني بأمان.

مع تحيات فريق شبر`
      : `${greeting}

We received a request to reset the password for your Shibr account.

To reset your password, please visit the following link:
${resetLink}

Important Note: This link is valid for 1 hour only.

If you didn't request a password reset, you can safely ignore this email.

Best regards,
The Shibr Team`

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    })
  }

  async sendWelcomeEmail(
    email: string,
    language: 'ar' | 'en' = 'en',
    userName?: string,
    accountType?: 'store_owner' | 'brand_owner'
  ): Promise<{ success: boolean; error?: string }> {
    const isArabic = language === 'ar'
    const direction = isArabic ? 'rtl' : 'ltr'
    const fontFamily = isArabic ? 'Cairo, Arial, sans-serif' : 'Inter, Arial, sans-serif'

    const subject = isArabic
      ? 'مرحباً بك في شبر'
      : 'Welcome to Shibr'

    const greeting = userName
      ? (isArabic ? `مرحباً ${userName}` : `Hello ${userName}`)
      : (isArabic ? 'مرحباً' : 'Hello')

    const accountTypeText = accountType === 'store_owner'
      ? (isArabic ? 'صاحب متجر' : 'Store Owner')
      : accountType === 'brand_owner'
      ? (isArabic ? 'صاحب علامة تجارية' : 'Brand Owner')
      : ''

    const dashboardLink = accountType === 'store_owner'
      ? `${process.env.SITE_URL || 'http://localhost:3000'}/store-dashboard`
      : accountType === 'brand_owner'
      ? `${process.env.SITE_URL || 'http://localhost:3000'}/brand-dashboard`
      : `${process.env.SITE_URL || 'http://localhost:3000'}`

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

          .features {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
          }

          .feature-item {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
          }

          .feature-icon {
            width: 24px;
            height: 24px;
            background-color: #725CAD;
            border-radius: 50%;
            margin-inline-end: 12px;
            flex-shrink: 0;
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
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">شبر | Shibr</div>
          </div>

          <div class="content">
            <h1>${greeting}! 🎉</h1>

            <p>
              ${isArabic
                ? `مرحباً بك في منصة شبر${accountTypeText ? ` كـ${accountTypeText}` : ''}! نحن سعداء جداً بانضمامك إلينا.`
                : `Welcome to Shibr${accountTypeText ? ` as a ${accountTypeText}` : ''}! We're thrilled to have you on board.`}
            </p>

            <div class="features">
              <h3>${isArabic ? 'ابدأ رحلتك مع شبر:' : 'Start your journey with Shibr:'}</h3>
              ${accountType === 'store_owner' ? `
                <div class="feature-item">
                  <div class="feature-icon"></div>
                  <span>${isArabic ? 'أضف أرففك للإيجار' : 'Add your shelves for rent'}</span>
                </div>
                <div class="feature-item">
                  <div class="feature-icon"></div>
                  <span>${isArabic ? 'استقبل طلبات الحجز' : 'Receive booking requests'}</span>
                </div>
                <div class="feature-item">
                  <div class="feature-icon"></div>
                  <span>${isArabic ? 'تتبع أرباحك' : 'Track your earnings'}</span>
                </div>
              ` : accountType === 'brand_owner' ? `
                <div class="feature-item">
                  <div class="feature-icon"></div>
                  <span>${isArabic ? 'تصفح الأرفف المتاحة' : 'Browse available shelves'}</span>
                </div>
                <div class="feature-item">
                  <div class="feature-icon"></div>
                  <span>${isArabic ? 'احجز الأرفف المناسبة' : 'Book suitable shelves'}</span>
                </div>
                <div class="feature-item">
                  <div class="feature-icon"></div>
                  <span>${isArabic ? 'وسّع نطاق عملك' : 'Expand your business reach'}</span>
                </div>
              ` : ''}
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${dashboardLink}" class="button">
                ${isArabic ? 'الذهاب إلى لوحة التحكم' : 'Go to Dashboard'}
              </a>
            </div>

            <p style="font-size: 14px; color: #999;">
              ${isArabic
                ? 'إذا كان لديك أي أسئلة، لا تتردد في التواصل معنا.'
                : 'If you have any questions, don\'t hesitate to contact us.'}
            </p>
          </div>

          <div class="footer">
            <p>
              ${isArabic
                ? '© 2024 شبر. جميع الحقوق محفوظة.'
                : '© 2024 Shibr. All rights reserved.'}
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    return this.sendEmail({
      to: email,
      subject,
      html,
    })
  }
}

export const emailService = EmailService.getInstance()