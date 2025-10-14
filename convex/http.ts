import { httpRouter } from "convex/server"
import { httpAction } from "./_generated/server"
import { api } from "./_generated/api"
import { auth } from "./auth"
import {
  verifyTapWebhookSignature,
  validateTapWebhookMetadata
} from "./security/webhookValidator"

const http = httpRouter()

// Add auth routes
auth.addHttpRoutes(http)

// Get Tap webhook secret from environment
function getTapWebhookSecret(): string {
  // In production, this should be set as an environment variable
  return process.env.TAP_WEBHOOK_SECRET || "test_webhook_secret_change_in_production"
}

// Tap webhook for payment status updates
http.route({
  path: "/api/tap/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Get the raw body for signature verification
      const bodyText = await request.text()
      const body = JSON.parse(bodyText)

      // Get signature from headers
      const signature = request.headers.get("tap-signature") || ""
      const webhookSecret = getTapWebhookSecret()

      // Verify webhook signature if provided
      if (signature && process.env.NODE_ENV === "production") {
        const isValid = verifyTapWebhookSignature(bodyText, signature, webhookSecret)
        if (!isValid) {
          console.error("Invalid webhook signature")
          return new Response(
            JSON.stringify({ error: "Invalid signature" }),
            {
              status: 401,
              headers: { "Content-Type": "application/json" },
            }
          )
        }
      }

      // Validate webhook metadata
      const validation = validateTapWebhookMetadata(body)
      if (!validation.isValid) {
        console.error("Invalid webhook metadata:", validation.error)
        return new Response(
          JSON.stringify({ error: validation.error }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        )
      }

      // Log the webhook for debugging (remove sensitive data in production)
      console.log("Tap webhook received and validated:", {
        id: body.id,
        status: body.status,
        object: body.object
      })

      // Handle different event types
      if (body.object === "charge") {
        const charge = body

        // Update payment status
        await ctx.runAction(api.tapPayments.handleWebhook, {
          chargeId: charge.id,
          status: charge.status,
          amount: charge.amount,
          metadata: charge.metadata || {},
        })

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }

      // Return success for unhandled events
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    } catch (error) {
      console.error("Error processing Tap webhook:", error)
      return new Response(
        JSON.stringify({ error: "Failed to process webhook" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }
  }),
})

// Tap webhook for refund status updates
http.route({
  path: "/api/tap/webhook-refund",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // Get the raw body for signature verification
      const bodyText = await request.text()
      const body = JSON.parse(bodyText)

      // Get signature from headers
      const signature = request.headers.get("tap-signature") || ""
      const webhookSecret = getTapWebhookSecret()

      // Verify webhook signature if provided
      if (signature && process.env.NODE_ENV === "production") {
        const isValid = verifyTapWebhookSignature(bodyText, signature, webhookSecret)
        if (!isValid) {
          console.error("Invalid refund webhook signature")
          return new Response(
            JSON.stringify({ error: "Invalid signature" }),
            {
              status: 401,
              headers: { "Content-Type": "application/json" },
            }
          )
        }
      }

      // Validate webhook metadata
      const validation = validateTapWebhookMetadata(body)
      if (!validation.isValid) {
        console.error("Invalid refund webhook metadata:", validation.error)
        return new Response(
          JSON.stringify({ error: validation.error }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        )
      }

      console.log("Tap refund webhook received and validated:", {
        id: body.id,
        status: body.status,
        object: body.object
      })

      if (body.object === "refund") {
        // Handle refund updates
        // You can add refund handling logic here
        console.log("Refund processed:", body.id, "Status:", body.status)
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    } catch (error) {
      console.error("Error processing Tap refund webhook:", error)
      return new Response(
        JSON.stringify({ error: "Failed to process refund webhook" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }
  }),
})

// Health check endpoint
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response("OK", { status: 200 })
  }),
})

export default http