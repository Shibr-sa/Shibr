import { NextRequest, NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"

// Initialize Convex client for server-side API calls
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

/**
 * Tap Payment Gateway Webhook Handler
 *
 * This endpoint receives payment status updates from Tap and
 * triggers backend processing to update rental/order status.
 *
 * Tap Documentation: https://developers.tap.company/docs/webhooks
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the webhook payload from Tap
    const payload = await request.json()

    console.log("[Tap Webhook] Received webhook:", {
      id: payload.id,
      status: payload.status,
      object: payload.object,
    })

    // Validate that this is a charge object
    if (payload.object !== "charge") {
      console.warn("[Tap Webhook] Ignoring non-charge webhook:", payload.object)
      return NextResponse.json(
        { success: false, error: "Not a charge webhook" },
        { status: 400 }
      )
    }

    // Extract charge details
    const chargeId = payload.id
    const status = payload.status
    const amount = payload.amount
    const metadata = payload.metadata || {}

    // Validate required fields
    if (!chargeId || !status) {
      console.error("[Tap Webhook] Missing required fields:", { chargeId, status })
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Call the Convex action to handle the webhook
    // This will verify the charge with Tap API and update the payment status
    await convex.action(api.tapPayments.handleWebhook, {
      chargeId,
      status,
      amount,
      metadata,
    })

    console.log("[Tap Webhook] Successfully processed webhook:", chargeId)

    // Return success response to Tap
    return NextResponse.json(
      { success: true, message: "Webhook processed successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("[Tap Webhook] Error processing webhook:", error)

    // Return error response but with 200 status to prevent Tap from retrying
    // (we log the error for investigation but acknowledge receipt)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error"
      },
      { status: 200 } // Return 200 to acknowledge receipt even if processing failed
    )
  }
}

// Explicitly disable GET requests
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. This endpoint only accepts POST requests." },
    { status: 405 }
  )
}
