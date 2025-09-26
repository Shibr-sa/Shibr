"use client"

import { CartProvider } from "@/contexts/cart-context"

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CartProvider>{children}</CartProvider>
}