import { v } from "convex/values"
import { mutation, action, internalMutation, internalQuery } from "./_generated/server"
import { api, internal } from "./_generated/api"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"
import { requireAuth } from "./helpers"
import { getSiteUrl } from "./utils"

// Get the Tap secret key
function getTapSecretKey(): string {
  return process.env.TAP_SECRET_KEY!
}


// Handle webhook from Tap for payment status updates
export const handleWebhook = action({
  args: {
    chargeId: v.string(),
    status: v.string(),
    amount: v.number(),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    // Verify the charge with Tap API
    const tapSecretKey = getTapSecretKey()

    try {
      const response = await fetch(`https://api.tap.company/v2/charges/${args.chargeId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${tapSecretKey}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to verify charge")
      }

      const charge = await response.json()

      // Update payment status based on charge status
      if (charge.metadata?.rentalRequestId) {
        await ctx.runMutation(internal.tapPayments.updatePaymentStatus, {
          rentalRequestId: charge.metadata.rentalRequestId as Id<"rentalRequests">,
          status: charge.status,
          chargeId: charge.id,
        })
      }

      return { success: true }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to handle webhook")
    }
  },
})

// Internal mutation to create or update payment status after Tap payment
export const updatePaymentStatus = internalMutation({
  args: {
    rentalRequestId: v.id("rentalRequests"),
    status: v.string(),
    chargeId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get rental request details
    const rentalRequest = await ctx.db.get(args.rentalRequestId)
    if (!rentalRequest) {
      console.error(`[updatePaymentStatus] Rental request not found: ${args.rentalRequestId}`)
      return { success: false }
    }

    // Map Tap status to our payment status
    let paymentStatus: "pending" | "completed" | "failed" | "refunded" = "pending"
    let rentalStatus = "payment_pending"

    switch (args.status.toUpperCase()) {
      case "CAPTURED":
        paymentStatus = "completed"
        rentalStatus = "active"
        break
      case "FAILED":
      case "DECLINED":
      case "CANCELLED":
        paymentStatus = "failed"
        rentalStatus = "payment_pending"
        break
      case "REFUNDED":
        paymentStatus = "refunded"
        rentalStatus = "cancelled"
        break
      default:
        paymentStatus = "pending"
        rentalStatus = "payment_pending"
    }

    // Only create payment record if payment was successful
    if (paymentStatus === "completed") {
      // Check if payment already exists to avoid duplicates
      const existingPayment = await ctx.db
        .query("payments")
        .withIndex("by_rental", (q) => q.eq("rentalRequestId", args.rentalRequestId))
        .filter((q) => q.eq(q.field("transactionReference"), args.chargeId))
        .first()

      if (existingPayment) {
        // Payment already exists, just update status
        await ctx.db.patch(existingPayment._id, {
          status: paymentStatus,
          processedDate: Date.now(),
          // Only set settlementDate if it doesn't already exist
          ...(existingPayment.settlementDate ? {} : { settlementDate: Date.now() }),
        })
      } else {
        // Create new payment record after successful payment
        // Get platform settings for store rent commission
        const platformSettings = await ctx.db.query("platformSettings").collect()
        const storeRentCommission = platformSettings.find(s => s.key === "storeRentCommission")?.value || 10

        // Calculate platform fee based on store rent commission
        const platformFee = (rentalRequest.totalAmount * storeRentCommission) / 100
        const netAmount = rentalRequest.totalAmount - platformFee

        // Create payment record
        await ctx.db.insert("payments", {
          rentalRequestId: args.rentalRequestId,
          type: "brand_payment",
          fromProfileId: rentalRequest.brandProfileId,
          toProfileId: undefined, // Platform (no specific profile)
          amount: rentalRequest.totalAmount,
          platformFee: platformFee,
          netAmount: netAmount,
          transactionReference: args.chargeId,
          paymentMethod: "card",
          status: "completed",
          paymentDate: Date.now(),
          processedDate: Date.now(),
          settlementDate: Date.now(),
          description: `Shelf rental payment for ${Math.ceil((rentalRequest.endDate - rentalRequest.startDate) / (30 * 24 * 60 * 60 * 1000)) || 1} month(s)`,
        })
      }

      // Update rental request status to active
      await ctx.db.patch(args.rentalRequestId, {
        status: "active" as any,
      })
    }

    return { success: true }
  },
})

// Get charge details from Tap
export const getChargeDetails = action({
  args: {
    chargeId: v.string(),
  },
  handler: async (ctx, args) => {
    const tapSecretKey = getTapSecretKey()

    try {
      const response = await fetch(`https://api.tap.company/v2/charges/${args.chargeId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${tapSecretKey}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Failed to get charge details: ${response.status} ${response.statusText}`)
      }

      const charge = await response.json()
      return charge
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to get charge details")
    }
  },
})

// Manual verification action for local development (when webhooks can't reach localhost)
// This simulates what the webhook would do - verify charge with Tap and update status
export const verifyAndConfirmPayment = action({
  args: {
    chargeId: v.string(),
    rentalRequestId: v.id("rentalRequests"),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx)

    const tapSecretKey = getTapSecretKey()

    console.log(`[verifyAndConfirmPayment] Manually verifying charge ${args.chargeId} for rental ${args.rentalRequestId}`)

    try {
      // Verify the charge with Tap API (same as webhook does)
      const response = await fetch(`https://api.tap.company/v2/charges/${args.chargeId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${tapSecretKey}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to verify charge with Tap")
      }

      const charge = await response.json()

      console.log(`[verifyAndConfirmPayment] Charge status: ${charge.status}`)

      // Only proceed if payment was captured
      if (charge.status !== "CAPTURED") {
        return {
          success: false,
          error: `Payment not completed. Status: ${charge.status}`
        }
      }

      // Update payment status (same as webhook does)
      await ctx.runMutation(internal.tapPayments.updatePaymentStatus, {
        rentalRequestId: args.rentalRequestId,
        status: charge.status,
        chargeId: charge.id,
      })

      console.log(`[verifyAndConfirmPayment] Successfully confirmed payment for rental ${args.rentalRequestId}`)

      return {
        success: true,
        status: charge.status,
        message: "Payment verified and rental activated"
      }
    } catch (error) {
      console.error(`[verifyAndConfirmPayment] Error:`, error)
      throw new Error(error instanceof Error ? error.message : "Failed to verify payment")
    }
  },
})

// Refund a charge
export const refundCharge = action({
  args: {
    chargeId: v.string(),
    amount: v.optional(v.number()), // Optional for partial refunds
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    const tapSecretKey = getTapSecretKey()

    const refundRequest = {
      charge_id: args.chargeId,
      amount: args.amount,
      currency: "SAR",
      reason: args.reason,
      reference: {
        merchant: `refund_${Date.now()}`,
      },
      metadata: {
        userId: userId,
      },
      post: {
        url: `${getSiteUrl()}/api/tap/webhook-refund`,
      },
    }

    try {
      const response = await fetch("https://api.tap.company/v2/refunds", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${tapSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(refundRequest),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.errors?.[0]?.description || "Failed to process refund")
      }

      const refund = await response.json()
      return {
        success: true,
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount,
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to process refund")
    }
  },
})

// Create a checkout session using Tap Checkout API
export const createCheckoutSession = action({
  args: {
    amount: v.number(),
    description: v.string(),
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: v.string(),
    rentalRequestId: v.optional(v.id("rentalRequests")),
    orderId: v.optional(v.id("customerOrders")),
    metadata: v.optional(v.object({
      type: v.string(), // "rental" or "purchase"
      branchId: v.optional(v.string()), // Branch ID for redirect URLs
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)

    // For rental requests, authentication is required (brand owners only)
    // For customer orders (purchases), authentication is optional (guest checkout)
    if (args.rentalRequestId && !userId) {
      throw new Error("Authentication required for rental payments")
    }

    const tapSecretKey = getTapSecretKey()
    const siteUrl = getSiteUrl()

    // Format phone number: remove leading 0 and any non-digits
    let phoneNumber = args.customerPhone.replace(/\D/g, '') // Remove all non-digits

    // If phone is empty, use a default phone number
    if (!phoneNumber) {
      phoneNumber = "500000001"
    } else {
      if (phoneNumber.startsWith('966')) {
        phoneNumber = phoneNumber.substring(3) // Remove country code if present
      }
      if (phoneNumber.startsWith('0')) {
        phoneNumber = phoneNumber.substring(1) // Remove leading 0
      }

      // Ensure phone number is valid (should be 9 digits for Saudi numbers)
      if (phoneNumber.length !== 9 || !phoneNumber.startsWith('5')) {
        phoneNumber = "500000001"
      }
    }

    // Parse customer name into first, middle, and last names
    const nameParts = args.customerName.trim().split(' ').filter(Boolean)
    const firstName = nameParts[0] || ""
    const lastName = nameParts.length > 2 ? nameParts[nameParts.length - 1] : (nameParts[1] || "")
    const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : ""

    // Validate required customer fields
    if (!firstName || !args.customerEmail) {
      throw new Error('Customer first name and email are required')
    }

    const customer = {
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      email: args.customerEmail,
      phone: {
        country_code: "966",
        number: phoneNumber
      }
    }

    // Prepare redirect URLs
    // For store payments, we need the branch ID which we'll pass through metadata
    const branchId = args.metadata?.branchId

    // Both success and failure redirect to the same page
    // The payment status will be checked there and appropriate dialog shown
    let redirectUrl = `${siteUrl}/payment` // default

    if (args.rentalRequestId) {
      // For rental requests, we need to get the shelf ID to redirect to marketplace page
      // We'll pass the rental request ID as a query parameter for verification
      const rentalRequest = await ctx.runQuery(internal.rentalRequests.getById, {
        requestId: args.rentalRequestId
      })
      if (rentalRequest?.shelfId) {
        redirectUrl = `${siteUrl}/brand-dashboard/shelves/marketplace/${rentalRequest.shelfId}?rentalRequestId=${args.rentalRequestId}`
      }
    } else if (branchId && args.metadata?.type === "purchase") {
      // For guest checkout purchases, redirect to store-specific success page
      redirectUrl = `${siteUrl}/store/${branchId}/payment/success`
    }

    // Generate unique reference IDs
    const timestamp = Date.now()
    const uniqueId = Math.random().toString(36).substring(7)
    const transactionRef = `txn_${timestamp}_${uniqueId}`
    const orderRef = args.rentalRequestId ?
      `rental_${args.rentalRequestId}` :
      args.orderId ? `order_${args.orderId}` : `order_${timestamp}_${uniqueId}`

    // Create charge request with redirect (Checkout) mode
    const checkoutRequest = {
      amount: args.amount,
      currency: "SAR",
      customer_initiated: true, // CRITICAL: Indicates this is a customer-initiated transaction
      threeDSecure: true, // 3D Secure is required by Tap for all transactions
      save_card: false,
      description: args.description,
      statement_descriptor: "SHIBR.IO",
      reference: {
        transaction: transactionRef,
        order: orderRef
      },
      metadata: {
        ...(userId && { userId }), // Only include userId if authenticated
        rentalRequestId: args.rentalRequestId,
        orderId: args.orderId,
        ...args.metadata,
      },
      receipt: {
        email: true,
        sms: false
      },
      customer: customer,
      source: {
        id: "src_all" // This enables all payment methods
      },
      post: {
        url: `${siteUrl}/api/tap/webhook`
      },
      redirect: {
        url: redirectUrl  // Let Tap append parameters automatically
      }
    }


    try {
      const response = await fetch("https://api.tap.company/v2/charges", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${tapSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutRequest),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.errors?.[0]?.description || "Failed to create checkout session")
      }

      const charge = await response.json()

      // Payment record will be created after successful payment verification via webhook
      // No need to create/update payment record here

      return {
        success: true,
        chargeId: charge.id,
        status: charge.status,
        checkoutUrl: charge.transaction?.url,
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to create checkout session")
    }
  },
})