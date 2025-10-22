/**
 * Tax utilities for Saudi Arabia VAT (15%)
 * Database stores base prices, tax calculated for display
 */

export const TAX_RATE = 0.15

// Round to 2 decimal places
const round = (n: number) => Math.round(n * 100) / 100

/**
 * Calculate tax-inclusive price for display
 */
export function calculatePriceWithTax(basePrice: number): number {
  return round(basePrice * (1 + TAX_RATE))
}

/**
 * Calculate cart totals from tax-inclusive prices
 */
export function calculateCartTotalsFromInclusive(
  items: Array<{ inclusivePrice: number; quantity: number }>
) {
  const total = items.reduce(
    (sum, item) => sum + round(item.inclusivePrice * item.quantity),
    0
  )
  const subtotal = round(total / (1 + TAX_RATE))
  const tax = round(total - subtotal)

  return { subtotal: round(subtotal), tax, total: round(total) }
}

/**
 * Get tax rate as percentage string
 */
export function getTaxRatePercentage(): string {
  return `${Math.round(TAX_RATE * 100)}%`
}
