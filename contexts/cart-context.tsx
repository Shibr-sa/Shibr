"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { Id } from "@/convex/_generated/dataModel"

interface CartItem {
  productId: Id<"products">
  name: string
  price: number
  quantity: number
  maxQuantity?: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void
  removeItem: (productId: Id<"products">) => void
  updateQuantity: (productId: Id<"products">, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  storeSlug: string | null
  setStoreSlug: (slug: string) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [storeSlug, setStoreSlug] = useState<string | null>(null)

  // Load cart from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCart = sessionStorage.getItem("cart")
      const savedSlug = sessionStorage.getItem("cartStoreSlug")

      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart))
        } catch (error) {
          console.error("Failed to parse saved cart:", error)
        }
      }

      if (savedSlug) {
        setStoreSlug(savedSlug)
      }
    }
  }, [])

  // Save cart to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("cart", JSON.stringify(items))
    }
  }, [items])

  // Save store slug to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined" && storeSlug) {
      sessionStorage.setItem("cartStoreSlug", storeSlug)
    }
  }, [storeSlug])

  const addItem = (newItem: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.productId === newItem.productId)

      if (existingItem) {
        // Update quantity if item already exists
        return prevItems.map(item =>
          item.productId === newItem.productId
            ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
            : item
        )
      } else {
        // Add new item
        return [...prevItems, { ...newItem, quantity: newItem.quantity || 1 }]
      }
    })
  }

  const removeItem = (productId: Id<"products">) => {
    setItems(prevItems => prevItems.filter(item => item.productId !== productId))
  }

  const updateQuantity = (productId: Id<"products">, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
    } else {
      setItems(prevItems =>
        prevItems.map(item =>
          item.productId === productId
            ? { ...item, quantity: Math.min(quantity, item.maxQuantity || quantity) }
            : item
        )
      )
    }
  }

  const clearCart = () => {
    setItems([])
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("cart")
      sessionStorage.removeItem("cartStoreSlug")
    }
    setStoreSlug(null)
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        storeSlug,
        setStoreSlug,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}