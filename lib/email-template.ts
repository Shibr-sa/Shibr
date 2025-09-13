export interface EmailTemplateProps {
  language: 'en' | 'ar';
  subject: string;
  preheader?: string;
  heading: string;
  greeting?: string;
  content: string[];
  buttonText?: string;
  buttonUrl?: string;
  warning?: {
    title: string;
    message: string;
  };
  footerNote?: string;
  code?: string;
}

export function generateEmailHTML({
  language,
  subject,
  preheader,
  heading,
  greeting,
  content,
  buttonText,
  buttonUrl,
  warning,
  footerNote,
  code
}: EmailTemplateProps): { subject: string; html: string } {
  const isArabic = language === 'ar';
  const direction = isArabic ? 'rtl' : 'ltr';
  const fontFamily = isArabic ? 'Cairo, Arial, sans-serif' : 'Inter, Arial, sans-serif';
  const textAlign = isArabic ? 'right' : 'left';

  const html = `
    <!DOCTYPE html>
    <html dir="${direction}" lang="${isArabic ? 'ar' : 'en'}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="x-apple-disable-message-reformatting">
      <meta name="format-detection" content="telephone=no">
      <title>${subject}</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Inter:wght@400;600;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          font-family: ${fontFamily};
          background-color: #f5f5f5;
          direction: ${direction};
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
        }

        table {
          border-collapse: collapse;
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
        }

        .container {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
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
          text-decoration: none;
        }

        .tagline {
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
        }

        .content {
          padding: 40px 32px;
          text-align: ${textAlign};
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
          margin-bottom: 20px;
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
          transition: background-color 0.3s;
        }

        .button:hover {
          background-color: #5e4a91;
        }

        .code-container {
          background-color: #f8f9fa;
          border: 2px dashed #725CAD;
          border-radius: 8px;
          padding: 24px;
          margin: 32px 0;
          text-align: center;
        }

        .code {
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          color: #725CAD;
          font-family: 'Courier New', monospace;
        }

        .code-label {
          color: #666666;
          font-size: 14px;
          margin-bottom: 12px;
        }

        .warning {
          background-color: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 8px;
          padding: 16px;
          margin: 24px 0;
        }

        .warning-title {
          color: #856404;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .warning-text {
          color: #856404;
          font-size: 14px;
          line-height: 1.5;
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
          line-height: 1.6;
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
          direction: ltr;
        }

        .divider {
          height: 1px;
          background-color: #e9ecef;
          margin: 24px 0;
        }

        @media only screen and (max-width: 600px) {
          .container {
            border-radius: 0;
          }

          .content {
            padding: 32px 20px;
          }

          .code {
            font-size: 28px;
            letter-spacing: 6px;
          }
        }
      </style>
    </head>
    <body>
      ${preheader ? `<div style="display:none;font-size:1px;color:#f5f5f5;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ''}

      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 20px;">
        <tr>
          <td align="center">
            <div class="container">
              <!-- Header -->
              <div class="header">
                <a href="${process.env.SITE_URL || 'http://localhost:3000'}" class="logo">شبر | Shibr</a>
                <div class="tagline">
                  ${isArabic ? 'منصة الربط الذكية بين المتاجر' : 'Smart Store Connection Platform'}
                </div>
              </div>

              <!-- Content -->
              <div class="content">
                ${greeting ? `<h1>${greeting}</h1>` : ''}
                ${heading && heading !== greeting ? `<h2 style="color: #333; font-size: 20px; margin-bottom: 16px;">${heading}</h2>` : ''}

                ${content.map(paragraph => `<p>${paragraph}</p>`).join('')}

                ${code ? `
                  <div class="code-container">
                    <div class="code-label">
                      ${isArabic ? 'رمز التحقق الخاص بك:' : 'Your verification code:'}
                    </div>
                    <div class="code">${code}</div>
                  </div>
                ` : ''}

                ${buttonText && buttonUrl ? `
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${buttonUrl}" class="button">${buttonText}</a>
                  </div>
                ` : ''}

                ${warning ? `
                  <div class="warning">
                    <div class="warning-title">${warning.title}</div>
                    <div class="warning-text">${warning.message}</div>
                  </div>
                ` : ''}

                ${footerNote ? `
                  <div class="divider"></div>
                  <p style="font-size: 14px; color: #999; margin-top: 24px;">
                    ${footerNote}
                  </p>
                ` : ''}

                ${buttonUrl && buttonText ? `
                  <p style="font-size: 14px; color: #999;">
                    ${isArabic
                      ? 'إذا كان الزر لا يعمل، يمكنك نسخ الرابط التالي ولصقه في متصفحك:'
                      : 'If the button doesn\'t work, you can copy and paste the following link into your browser:'}
                  </p>
                  <div class="link-text">${buttonUrl}</div>
                ` : ''}
              </div>

              <!-- Footer -->
              <div class="footer">
                <p>
                  ${isArabic ? '© 2024 شبر. جميع الحقوق محفوظة.' : '© 2024 Shibr. All rights reserved.'}
                </p>
                <p style="margin-top: 8px;">
                  ${isArabic
                    ? 'هذا بريد إلكتروني تلقائي، يرجى عدم الرد عليه.'
                    : 'This is an automated email, please do not reply.'}
                </p>
                <p style="margin-top: 12px; font-size: 12px;">
                  ${isArabic
                    ? 'تم إرسال هذا البريد الإلكتروني إليك لأنك مسجل في منصة شبر.'
                    : 'You received this email because you are registered with Shibr platform.'}
                </p>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return { subject, html };
}