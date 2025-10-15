import { internalMutation } from "../_generated/server"

/**
 * Migration: Add subtotal field to existing customer orders
 *
 * For legacy orders:
 * - Old 'total' field represents amount WITHOUT tax
 * - New schema requires both 'subtotal' (without tax) and 'total' (with tax)
 *
 * This migration:
 * 1. Sets subtotal = current total (old value was without tax)
 * 2. Recalculates total = subtotal * 1.15 (adds 15% VAT)
 */
export const addSubtotalToCustomerOrders = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log('[Migration] Starting to add subtotal to customerOrders...')

    // Get all customer orders
    const orders = await ctx.db.query("customerOrders").collect()

    console.log(`[Migration] Found ${orders.length} customer orders to process`)

    let updated = 0
    let skipped = 0

    for (const order of orders) {
      // Check if order already has subtotal field
      if ('subtotal' in order && typeof order.subtotal === 'number') {
        skipped++
        continue
      }

      // For legacy orders: current 'total' is actually the subtotal (without tax)
      const subtotal = order.total
      const newTotal = subtotal * 1.15 // Add 15% VAT

      await ctx.db.patch(order._id, {
        subtotal,
        total: newTotal,
      })

      updated++
    }

    console.log(`[Migration] Completed! Updated: ${updated}, Skipped (already has subtotal): ${skipped}`)
  },
})
