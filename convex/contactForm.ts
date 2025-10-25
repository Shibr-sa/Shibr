import { v } from "convex/values"
import { mutation, action } from "./_generated/server"
import { api } from "./_generated/api"

/**
 * Contact Form - Public mutation to submit contact form
 * Creates a support ticket and triggers email notification
 */
export const submitContactForm = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    subject: v.union(
      v.literal("general"),
      v.literal("support"),
      v.literal("business"),
      v.literal("complaint")
    ),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate input
    if (!args.name.trim() || args.name.length < 2) {
      throw new Error("Name must be at least 2 characters")
    }

    if (!args.email.trim() || !args.email.includes("@")) {
      throw new Error("Valid email is required")
    }

    if (!args.phone.trim()) {
      throw new Error("Phone number is required")
    }

    if (!args.message.trim() || args.message.length < 10) {
      throw new Error("Message must be at least 10 characters")
    }

    // Create support ticket
    const ticketId = await ctx.db.insert("supportTickets", {
      name: args.name.trim(),
      email: args.email.toLowerCase().trim(),
      phone: args.phone.trim(),
      subject: args.subject,
      message: args.message.trim(),
      status: "new",
      createdAt: Date.now(),
    })

    // Schedule email notification (run asynchronously)
    await ctx.scheduler.runAfter(0, api.contactForm.sendContactFormEmail, {
      ticketId,
      name: args.name,
      email: args.email,
      phone: args.phone,
      subject: args.subject,
      message: args.message,
    })

    return {
      success: true,
      ticketId,
      message: "Your message has been received. We'll get back to you soon.",
    }
  },
})

/**
 * Send contact form email notification to info@shibr.io
 * Uses Resend API with the same configuration as OTP emails
 */
export const sendContactFormEmail = action({
  args: {
    ticketId: v.id("supportTickets"),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    subject: v.union(
      v.literal("general"),
      v.literal("support"),
      v.literal("business"),
      v.literal("complaint")
    ),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured")
      return { success: false, error: "Email service not configured" }
    }

    // Map subject to readable labels
    const subjectLabels = {
      general: "General Inquiry",
      support: "Technical Support",
      business: "Business Partnership",
      complaint: "Complaint",
    }

    const subjectLabel = subjectLabels[args.subject]

    // Create email HTML
    const emailHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #7c3aed;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #7c3aed;
      margin: 0;
      font-size: 24px;
    }
    .badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .badge-general { background-color: #e0e7ff; color: #4338ca; }
    .badge-support { background-color: #fef3c7; color: #92400e; }
    .badge-business { background-color: #d1fae5; color: #065f46; }
    .badge-complaint { background-color: #fee2e2; color: #991b1b; }
    .info-row {
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .label {
      font-weight: bold;
      color: #6b7280;
      font-size: 13px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .value {
      color: #111827;
      font-size: 15px;
    }
    .message-box {
      background-color: #f9fafb;
      border-left: 4px solid #7c3aed;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 13px;
    }
    .ticket-id {
      background-color: #f3f4f6;
      padding: 8px 12px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 14px;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 رسالة جديدة من نموذج التواصل</h1>
      <p style="color: #6b7280; margin: 5px 0 0 0;">منصة شبر</p>
    </div>

    <div style="margin-bottom: 20px;">
      <span class="badge badge-${args.subject}">${subjectLabel}</span>
    </div>

    <div class="info-row">
      <div class="label">معرف التذكرة</div>
      <div class="ticket-id">${args.ticketId}</div>
    </div>

    <div class="info-row">
      <div class="label">الاسم</div>
      <div class="value">${args.name}</div>
    </div>

    <div class="info-row">
      <div class="label">البريد الإلكتروني</div>
      <div class="value" dir="ltr" style="text-align: right;">${args.email}</div>
    </div>

    <div class="info-row">
      <div class="label">رقم الهاتف</div>
      <div class="value" dir="ltr" style="text-align: right;">${args.phone}</div>
    </div>

    <div class="info-row">
      <div class="label">الرسالة</div>
      <div class="message-box">
        ${args.message.replace(/\n/g, "<br>")}
      </div>
    </div>

    <div class="footer">
      <p>تم الإرسال من نموذج التواصل في <strong>shibr.io</strong></p>
      <p>التاريخ: ${new Date().toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" })}</p>
    </div>
  </div>
</body>
</html>
    `

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "نموذج التواصل - شبر <noreply@shibr.io>",
          to: ["info@shibr.io"],
          subject: `[${subjectLabel}] رسالة جديدة من ${args.name}`,
          html: emailHtml,
          reply_to: args.email, // Allow replying directly to the customer
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error("Resend API error:", error)
        return { success: false, error: "Failed to send email" }
      }

      const result = await response.json()

      return {
        success: true,
        emailId: result.id,
      }
    } catch (error) {
      console.error("Error sending contact form email:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  },
})
