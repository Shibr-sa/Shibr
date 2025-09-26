import { httpRouter } from "convex/server"
import { httpAction } from "./_generated/server"
import { api } from "./_generated/api"
import { auth } from "./auth"

const http = httpRouter()

// Add auth routes
auth.addHttpRoutes(http)

// Tap webhook for payment status updates
http.route({
  path: "/api/tap/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json()

      // Log the webhook for debugging
      console.log("Tap webhook received:", body)

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
      const body = await request.json()

      console.log("Tap refund webhook received:", body)

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