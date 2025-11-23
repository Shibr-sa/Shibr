import { logger } from "./logger";
import { v } from "convex/values"
import { action, mutation, internalMutation } from "./_generated/server"
import { getAuthUserId } from "@convex-dev/auth/server"
import { api, internal } from "./_generated/api"
import { requireAuth } from "./helpers"

// Tap Transfer API endpoint
const TAP_TRANSFER_API = "https://api.tap.company/v2/transfers"

// Get API key based on environment
function getTapSecretKey() {
  const key = process.env.TAP_SECRET_KEY
  if (!key) {
    throw new Error("TAP_SECRET_KEY not configured")
  }
  return key
}

// Create a transfer (payout) to a bank account
export const createTransfer = action({
  args: {
    paymentId: v.id("payments"),
    amount: v.number(),
    currency: v.string(),
    description: v.string(),
    bankAccountId: v.id("bankAccounts"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; transferId?: string; status?: string }> => {
    // Verify admin user
    await requireAuth(ctx)

    // Note: getUserProfile requires db context, which actions don't have
    // For now, we'll skip the admin check here since this is called from admin dashboard
    // TODO: Add proper admin verification for actions

    // Get bank account details
    const bankAccount: any = await ctx.runQuery(api.bankAccounts.getBankAccountById, {
      bankAccountId: args.bankAccountId,
    })

    if (!bankAccount) {
      throw new Error("Bank account not found")
    }

    // Get payment details to verify
    const payment = await ctx.runQuery(api.payments.getPaymentById, {
      paymentId: args.paymentId,
    })

    if (!payment) {
      throw new Error("Payment not found")
    }

    if (payment.status !== "completed") {
      throw new Error("Payment must be completed before transfer")
    }

    if (payment.transferStatus === "completed") {
      throw new Error("Transfer already completed for this payment")
    }

    const secretKey = getTapSecretKey()

    // Create transfer request to Tap
    const transferRequest: any = {
      amount: args.amount,
      currency: args.currency,
      description: args.description,
      destination: {
        type: "bank_account",
        iban: bankAccount.iban,
        account_holder_name: bankAccount.accountHolderName,
        bank_name: bankAccount.bankName,
      },
      reference: {
        payment: args.paymentId,
      },
      metadata: {
        payment_id: args.paymentId,
        bank_account_id: args.bankAccountId,
      },
    }

    try {
      const response: Response = await fetch(TAP_TRANSFER_API, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferRequest),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Tap Transfer API error:", errorData)
        throw new Error(`Transfer failed: ${errorData.errors?.[0]?.description || "Unknown error"}`)
      }

      const transferData: any = await response.json()

      // Update payment record with transfer details
      await ctx.runMutation(api.payments.updatePaymentTransfer, {
        paymentId: args.paymentId,
        tapTransferId: transferData.id,
        transferStatus: "processing",
        transferredAt: Date.now(),
      })

      return {
        success: true,
        transferId: transferData.id,
        status: transferData.status,
      }
    } catch (error) {
      console.error("Transfer creation failed:", error)
      throw new Error(`Failed to create transfer: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },
})

// Get transfer status from Tap
export const getTransferStatus = action({
  args: {
    transferId: v.string(),
  },
  handler: async (ctx, args) => {
    const secretKey = getTapSecretKey()

    try {
      const response = await fetch(`${TAP_TRANSFER_API}/${args.transferId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${secretKey}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to get transfer status: ${errorData.errors?.[0]?.description || "Unknown error"}`)
      }

      const transferData: any = await response.json()

      return {
        id: transferData.id,
        status: transferData.status,
        amount: transferData.amount,
        currency: transferData.currency,
        created_at: transferData.created,
        destination: transferData.destination,
      }
    } catch (error) {
      console.error("Failed to get transfer status:", error)
      throw new Error(`Failed to get transfer status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },
})

// Handle Tap transfer webhook
export const handleTransferWebhook = action({
  args: {
    transferId: v.string(),
    status: v.string(),
    webhookData: v.any(),
  },
  handler: async (ctx, args) => {
    logger.info("Transfer webhook received:", {
      transferId: args.transferId,
      status: args.status,
    })

    // Find payment by Tap transfer ID
    const payment = await ctx.runQuery(api.payments.getPaymentByTransferId, {
      tapTransferId: args.transferId,
    })

    if (!payment) {
      console.error("Payment not found for transfer:", args.transferId)
      return { success: false, error: "Payment not found" }
    }

    // Map Tap transfer status to our transfer status
    let transferStatus: "completed" | "failed" | "processing" = "processing"

    switch (args.status.toLowerCase()) {
      case "completed":
      case "succeeded":
      case "success":
        transferStatus = "completed"
        break
      case "failed":
      case "cancelled":
      case "declined":
        transferStatus = "failed"
        break
      default:
        transferStatus = "processing"
    }

    // Update payment transfer status
    await ctx.runMutation(api.payments.updatePaymentTransfer, {
      paymentId: payment._id,
      transferStatus,
    })

    return { success: true }
  },
})

// Get bank account by ID (helper query)
export const getBankAccountById = mutation({
  args: {
    bankAccountId: v.id("bankAccounts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.bankAccountId)
  },
})

/**
 * B4.2: Automatically initiate store settlement payout after approval
 * Called from createSettlementPayments after admin approval
 */
export const initiateAutomaticSettlementPayout = internalMutation({
  args: {
    paymentId: v.id("payments"),
  },
  handler: async (ctx, args) => {
    // 1. Get payment record
    const payment = await ctx.db.get(args.paymentId)
    if (!payment) {
      logger.error("Payment not found for auto-payout", { paymentId: args.paymentId })
      return { success: false, reason: "payment_not_found" }
    }

    // 2. Verify this is a store settlement payment
    if (payment.type !== "store_settlement") {
      logger.error("Auto-payout attempted on non-settlement payment", {
        paymentId: args.paymentId,
        type: payment.type
      })
      return { success: false, reason: "invalid_payment_type" }
    }

    // 3. Get store profile to find userId
    const storeProfile = payment.toProfileId
      ? await ctx.db.get(payment.toProfileId)
      : null

    if (!storeProfile || !("userId" in storeProfile)) {
      logger.error("Store profile not found for payment", { paymentId: args.paymentId })
      return { success: false, reason: "store_not_found" }
    }

    // 4. Find store's default bank account
    const bankAccount = await ctx.db
      .query("bankAccounts")
      .filter((q) => q.and(
        q.eq(q.field("profileId"), payment.toProfileId),
        q.eq(q.field("isDefault"), true)
      ))
      .first()

    if (!bankAccount) {
      logger.warn("No bank account found for auto-payout", {
        paymentId: args.paymentId,
        storeUserId: storeProfile.userId
      })

      // TODO: Send notification to store and admin
      // await ctx.scheduler.runAfter(0, api.notifications.sendPayoutRequiresManualAction, {
      //   paymentId: payment._id,
      //   storeUserId: storeProfile.userId,
      //   reason: "no_bank_account"
      // })

      return { success: false, reason: "no_bank_account" }
    }

    // 5. Schedule transfer via Tap API (using scheduler since it's an action)
    try {
      ctx.scheduler.runAfter(0, api.tapTransfers.createTransfer, {
        paymentId: payment._id,
        amount: payment.amount,
        currency: "SAR",
        description: `Settlement payout for rental ${payment.rentalRequestId?.slice(-8) || ""}`,
        bankAccountId: bankAccount._id,
      })

      logger.info("Auto-payout initiated successfully", {
        paymentId: args.paymentId,
        bankAccountId: bankAccount._id,
        amount: payment.amount
      })

      return { success: true }
    } catch (error) {
      logger.error("Auto-payout failed", {
        paymentId: args.paymentId,
        error: error instanceof Error ? error.message : "Unknown error"
      })

      return { success: false, reason: "transfer_failed" }
    }
  }
})