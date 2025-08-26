import { useState, useEffect } from 'react'

/**
 * Hook that debounces a value by a specified delay
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 300ms)
 * @returns The debounced value
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set a timer to update the debounced value after the delay
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clear the timer if value changes or component unmounts
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}