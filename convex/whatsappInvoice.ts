import { logger } from "./logger";
import { v } from "convex/values"
import { internalAction } from "./_generated/server"
import { internal } from "./_generated/api"

/**
 * Internal action to send invoice PDF via WhatsApp using Karzoun API
 */
export const sendInvoiceViaWhatsApp = internalAction({
  args: {
    customerName: v.string(),
    customerPhone: v.string(),
    brandName: v.string(), // Changed from storeName to brandName
    invoiceNumber: v.string(),
    invoiceDate: v.string(),
    invoiceTotal: v.string(),
    pdfUrl: v.string(), // Public URL to the PDF file
  },
  handler: async (ctx, args) => {
    const karzounToken = process.env.KARZOUN_API_TOKEN
    const karzounSenderId = process.env.KARZOUN_SENDER_ID
    const invoiceTemplateName = process.env.KARZOUN_INVOICE_TEMPLATE_NAME || 'invoice'

    logger.info('[WhatsApp Invoice] Sending invoice to:', args.customerPhone)

    if (!karzounToken || !karzounSenderId) {
      throw new Error('Karzoun API credentials not configured. Please set KARZOUN_API_TOKEN and KARZOUN_SENDER_ID in environment variables.')
    }

    try {
      // Format phone number (ensure it starts with 966)
      let formattedPhone = args.customerPhone.replace(/\D/g, '')
      if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.substring(1)
      }
      if (!formattedPhone.startsWith('966')) {
        formattedPhone = '966' + formattedPhone
      }

      // Build the API URL with template parameters for invoice
      // Note: No url_button parameter - the template doesn't have button components
      const apiUrl = `https://api.karzoun.app/CloudApi.php?` +
        `token=${encodeURIComponent(karzounToken)}` +
        `&sender_id=${encodeURIComponent(karzounSenderId)}` +
        `&phone=${formattedPhone}` +
        `&template=${encodeURIComponent(invoiceTemplateName)}` +
        `&param_1=${encodeURIComponent(args.customerName)}` +
        `&param_2=${encodeURIComponent(args.brandName)}` +
        `&pdf=${encodeURIComponent(args.pdfUrl)}` +
        `&param_3=${encodeURIComponent(args.invoiceNumber)}` +
        `&param_4=${encodeURIComponent(args.invoiceDate)}` +
        `&param_5=${encodeURIComponent(args.invoiceTotal)}`

      logger.info('[WhatsApp Invoice] Calling Karzoun API with template:', invoiceTemplateName)
      logger.info('[WhatsApp Invoice] Customer:', args.customerName, 'Phone:', formattedPhone)
      logger.info('[WhatsApp Invoice] Brand:', args.brandName, 'Invoice:', args.invoiceNumber, 'Total:', args.invoiceTotal)
      logger.info('[WhatsApp Invoice] Full API URL (without token):', apiUrl.replace(karzounToken, 'REDACTED'))

      // Make the API request
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[WhatsApp Invoice] Karzoun API error:', errorText)
        throw new Error(`Failed to send WhatsApp invoice: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()

      logger.info('[WhatsApp Invoice] Karzoun API Response:', result)

      // Check if the API returned an error
      if (result.error) {
        console.error('[WhatsApp Invoice] Karzoun API returned error:', result)
        const errorMessage = typeof result.error === 'string'
          ? result.error
          : result.error.message || JSON.stringify(result.error)
        throw new Error(`Karzoun API error: ${errorMessage}`)
      }

      logger.info('[WhatsApp Invoice] Invoice sent successfully:', {
        phoneNumber: formattedPhone,
        invoiceNumber: args.invoiceNumber,
        response: result
      })

      return {
        success: true,
        messageId: result.message_id || result.id || 'unknown',
        response: result
      }
    } catch (error: any) {
      console.error('[WhatsApp Invoice] Error sending invoice:', error)
      throw new Error(`Failed to send WhatsApp invoice: ${error.message}`)
    }
  }
})
