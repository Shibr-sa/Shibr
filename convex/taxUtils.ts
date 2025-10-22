/**
 * Tax utilities for backend (Saudi Arabia 15% VAT)
 * Backend always recalculates from database prices for security
 */

export const TAX_RATE = 0.15

// Round to 2 decimal places
const round = (n: number) => Math.round(n * 100) / 100

/**
 * Calculate order totals from base prices
 */
export function calculateOrderTotals(
  items: Array<{ basePrice: number; quantity: number }>
) {
  const subtotal = items.reduce(
    (sum, item) => sum + round(item.basePrice * item.quantity),
    0
  )
  const tax = round(subtotal * TAX_RATE)
  const total = round(subtotal + tax)

  return { subtotal: round(subtotal), tax, total }
}
