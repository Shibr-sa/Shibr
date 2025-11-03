import { logger } from "./logger";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";

/**
 * Helper function to format phone numbers for WhatsApp
 * Ensures phone is in 966XXXXXXXXX format
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let formatted = phone.replace(/\D/g, '');

  // Remove leading 0 if present
  if (formatted.startsWith('0')) {
    formatted = formatted.substring(1);
  }

  // Add 966 prefix if not present
  if (!formatted.startsWith('966')) {
    formatted = '966' + formatted;
  }

  return formatted;
}

/**
 * Helper function to send WhatsApp notification via Karzoun API
 */
async function sendWhatsAppNotification(params: {
  recipientPhone: string;
  recipientName: string;
  senderName: string;
  detailsUrl: string;
  context: string;
}): Promise<{ success: boolean; messageId?: string }> {
  const karzounToken = process.env.KARZOUN_API_TOKEN;
  const karzounSenderId = process.env.KARZOUN_SENDER_ID;
  const templateName = process.env.KARZOUN_NEW_REQUEST_TEMPLATE || 'new_request_notif';

  logger.info(`[WhatsApp ${params.context}] Sending notification to:`, params.recipientPhone);

  if (!karzounToken || !karzounSenderId) {
    logger.error(`[WhatsApp ${params.context}] Karzoun API credentials not configured`);
    return { success: false };
  }

  try {
    const formattedPhone = formatPhoneNumber(params.recipientPhone);

    // Build the API URL with template parameters
    // param_1: Recipient name (Store or Brand)
    // param_2: Sender name (Brand or Store)
    // param_3: URL to view details
    const apiUrl = `https://api.karzoun.app/CloudApi.php?` +
      `token=${encodeURIComponent(karzounToken)}` +
      `&sender_id=${encodeURIComponent(karzounSenderId)}` +
      `&phone=${formattedPhone}` +
      `&template=${encodeURIComponent(templateName)}` +
      `&param_1=${encodeURIComponent(params.recipientName)}` +
      `&param_2=${encodeURIComponent(params.senderName)}` +
      `&param_3=${encodeURIComponent(params.detailsUrl)}`;

    logger.info(`[WhatsApp ${params.context}] Calling Karzoun API`, {
      template: templateName,
      recipient: params.recipientName,
      sender: params.senderName,
      phone: formattedPhone
    });

    // Make the API request
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`[WhatsApp ${params.context}] Karzoun API error:`, errorText);
      // Fail silently - don't throw error
      return { success: false };
    }

    const result = await response.json();

    logger.info(`[WhatsApp ${params.context}] Karzoun API Response:`, result);

    // Check if the API returned an error
    if (result.error) {
      logger.error(`[WhatsApp ${params.context}] Karzoun API returned error:`, result);
      // Fail silently - don't throw error
      return { success: false };
    }

    logger.info(`[WhatsApp ${params.context}] Notification sent successfully`, {
      phone: formattedPhone,
      messageId: result.messages?.[0]?.id || result.message_id || result.id || 'unknown'
    });

    return {
      success: true,
      messageId: result.messages?.[0]?.id || result.message_id || result.id || 'unknown'
    };
  } catch (error: any) {
    logger.error(`[WhatsApp ${params.context}] Error sending notification:`, error);
    // Fail silently - don't throw error
    return { success: false };
  }
}

/**
 * Send notification to store owner when a new rental request is created
 */
export const sendNewRequestNotification = internalAction({
  args: {
    storeOwnerPhone: v.string(),
    storeName: v.string(),
    brandName: v.string(),
    requestId: v.string(),
  },
  handler: async (ctx, args) => {
    const siteUrl = process.env.SITE_URL || 'https://shibr.io';
    const detailsUrl = `${siteUrl}/store-dashboard/rental-requests/${args.requestId}`;

    return await sendWhatsAppNotification({
      recipientPhone: args.storeOwnerPhone,
      recipientName: args.storeName,
      senderName: args.brandName,
      detailsUrl,
      context: 'New Request'
    });
  }
});

/**
 * Send notification to brand owner when their rental request is accepted
 */
export const sendRequestAcceptedNotification = internalAction({
  args: {
    brandOwnerPhone: v.string(),
    brandName: v.string(),
    storeName: v.string(),
    requestId: v.string(),
  },
  handler: async (ctx, args) => {
    const siteUrl = process.env.SITE_URL || 'https://shibr.io';
    const detailsUrl = `${siteUrl}/brand-dashboard/rental-requests/${args.requestId}`;

    return await sendWhatsAppNotification({
      recipientPhone: args.brandOwnerPhone,
      recipientName: args.brandName,
      senderName: args.storeName,
      detailsUrl,
      context: 'Request Accepted'
    });
  }
});

/**
 * Send notification to brand owner when their rental request is rejected
 */
export const sendRequestRejectedNotification = internalAction({
  args: {
    brandOwnerPhone: v.string(),
    brandName: v.string(),
    storeName: v.string(),
    requestId: v.string(),
  },
  handler: async (ctx, args) => {
    const siteUrl = process.env.SITE_URL || 'https://shibr.io';
    const detailsUrl = `${siteUrl}/brand-dashboard/rental-requests/${args.requestId}`;

    return await sendWhatsAppNotification({
      recipientPhone: args.brandOwnerPhone,
      recipientName: args.brandName,
      senderName: args.storeName,
      detailsUrl,
      context: 'Request Rejected'
    });
  }
});

/**
 * Send notification when rental becomes active (payment confirmed)
 * This can be sent to both store owner and brand owner
 */
export const sendRentalActiveNotification = internalAction({
  args: {
    recipientPhone: v.string(),
    recipientName: v.string(),
    partnerName: v.string(),
    requestId: v.string(),
    dashboardType: v.union(v.literal('store'), v.literal('brand')),
  },
  handler: async (ctx, args) => {
    const siteUrl = process.env.SITE_URL || 'https://shibr.io';
    const detailsUrl = `${siteUrl}/${args.dashboardType}-dashboard/rental-requests/${args.requestId}`;

    return await sendWhatsAppNotification({
      recipientPhone: args.recipientPhone,
      recipientName: args.recipientName,
      senderName: args.partnerName,
      detailsUrl,
      context: 'Rental Active'
    });
  }
});
