import { v } from "convex/values"
import { mutation, action, internalMutation, internalQuery } from "./_generated/server"
import { api, internal } from "./_generated/api"
import { getAuthUserId } from "@convex-dev/auth/server"
import { Id } from "./_generated/dataModel"

// Get the Tap secret key
function getTapSecretKey(): string {
  return process.env.TAP_SECRET_KEY!
}

// Helper to get the site URL
function getSiteUrl(): string {
  return process.env.SITE_URL || "http://localhost:3000"
}


// Internal mutation to store charge information
export const storeChargeInfo = internalMutation({
  args: {
    chargeId: v.string(),
    rentalRequestId: v.id("rentalRequests"),
    amount: v.number(),
    status: v.string(),
    transactionUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the rental request
    const rentalRequest = await ctx.db.get(args.rentalRequestId)
    if (!rentalRequest) {
      throw new Error("Rental request not found")
    }

    // Find the payment record
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_rental", (q) => q.eq("rentalRequestId", args.rentalRequestId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first()

    if (payment) {
      // Update payment with Tap charge info
      await ctx.db.patch(payment._id, {
        transactionReference: args.chargeId,
        paymentMethod: "card",
        status: args.status === "CAPTURED" ? "completed" : "processing",
        processedDate: Date.now(),
      })
    }

    return { success: true }
  },
})

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

// Internal mutation to update payment status
export const updatePaymentStatus = internalMutation({
  args: {
    rentalRequestId: v.id("rentalRequests"),
    status: v.string(),
    chargeId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the payment record
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_rental", (q) => q.eq("rentalRequestId", args.rentalRequestId))
      .filter((q) => q.eq(q.field("transactionReference"), args.chargeId))
      .first()

    if (!payment) {
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

    // Update payment status
    await ctx.db.patch(payment._id, {
      status: paymentStatus,
      processedDate: Date.now(),
      ...(paymentStatus === "completed" && { settlementDate: Date.now() }),
    })

    // Update rental request status
    const rentalRequest = await ctx.db.get(args.rentalRequestId)
    if (rentalRequest && paymentStatus === "completed") {
      await ctx.db.patch(args.rentalRequestId, {
        status: "active" as any,
      })

      // Create shelf store for QR code functionality
      await ctx.runMutation(api.shelfStores.createShelfStore, {
        rentalRequestId: args.rentalRequestId,
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
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Not authenticated")
    }

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
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Not authenticated")
    }

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
        url: `${process.env.SITE_URL || "https://shibr.io"}/api/tap/webhook-refund`,
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
      storeSlug: v.optional(v.string()), // Store slug for redirect URLs
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Not authenticated")
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
    // For store payments, we need the slug which we'll pass through metadata
    const storeSlug = args.metadata?.storeSlug

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
    } else if (args.orderId && storeSlug) {
      // Redirect to success page which will verify the payment status
      redirectUrl = `${siteUrl}/store/${storeSlug}/payment/success`
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
        userId: userId,
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

      // Store charge info if it's for a rental
      if (args.rentalRequestId) {
        await ctx.runMutation(internal.tapPayments.storeChargeInfo, {
          chargeId: charge.id,
          rentalRequestId: args.rentalRequestId,
          amount: args.amount,
          status: charge.status,
          transactionUrl: charge.transaction?.url,
        })
      }

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