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
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => { success: boolean; message?: string; quantityAdded?: number }
  removeItem: (productId: Id<"products">) => void
  updateQuantity: (productId: Id<"products">, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  getItemQuantity: (productId: Id<"products">) => number
  branchId: string | null
  setBranchId: (id: string) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [branchId, setBranchId] = useState<string | null>(null)

  // Load cart from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCart = sessionStorage.getItem("cart")
      const savedBranchId = sessionStorage.getItem("cartBranchId")

      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart))
        } catch (error) {
          console.error("Failed to parse saved cart:", error)
        }
      }

      if (savedBranchId) {
        setBranchId(savedBranchId)
      }
    }
  }, [])

  // Save cart to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("cart", JSON.stringify(items))
    }
  }, [items])

  // Save branch ID to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined" && branchId) {
      sessionStorage.setItem("cartBranchId", branchId)
    }
  }, [branchId])

  const addItem = (newItem: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    const existingItem = items.find(item => item.productId === newItem.productId)
    const currentQuantity = existingItem?.quantity || 0
    const requestedQuantity = newItem.quantity || 1
    const maxQuantity = newItem.maxQuantity || Infinity

    // Check if adding would exceed limit
    if (currentQuantity + requestedQuantity > maxQuantity) {
      const canAdd = maxQuantity - currentQuantity
      if (canAdd <= 0) {
        return {
          success: false,
          message: `Maximum quantity (${maxQuantity}) already in cart`,
          quantityAdded: 0
        }
      }
      // Only add what's possible
      const actualQuantityToAdd = canAdd

      setItems(prevItems => {
        if (existingItem) {
          return prevItems.map(item =>
            item.productId === newItem.productId
              ? { ...item, quantity: item.quantity + actualQuantityToAdd }
              : item
          )
        } else {
          return [...prevItems, { ...newItem, quantity: actualQuantityToAdd }]
        }
      })

      return {
        success: true,
        message: `Only ${actualQuantityToAdd} added (maximum ${maxQuantity} allowed)`,
        quantityAdded: actualQuantityToAdd
      }
    }

    // Normal add - within limits
    setItems(prevItems => {
      if (existingItem) {
        return prevItems.map(item =>
          item.productId === newItem.productId
            ? { ...item, quantity: item.quantity + requestedQuantity }
            : item
        )
      } else {
        return [...prevItems, { ...newItem, quantity: requestedQuantity }]
      }
    })

    return {
      success: true,
      quantityAdded: requestedQuantity
    }
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
      sessionStorage.removeItem("cartBranchId")
    }
    setBranchId(null)
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getItemQuantity = (productId: Id<"products">) => {
    const item = items.find(item => item.productId === productId)
    return item?.quantity || 0
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
        getItemQuantity,
        branchId,
        setBranchId,
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