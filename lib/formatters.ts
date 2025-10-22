/**
 * Formatting utilities for consistent string handling across the application.
 * IMPORTANT: All numbers use English/Western numerals (0-9) regardless of language.
 * IMPORTANT: All dates use Gregorian calendar only, no Hijri dates.
 */

import { format as dateFnsFormat } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'

/**
 * Format currency with SAR symbol
 * Always uses English numerals (0-9) regardless of language
 * Always displays exactly 2 decimal places (e.g., 180.00, 207.50)
 * @param amount - The amount to format
 * @param language - Current language for currency symbol placement
 * @returns Formatted currency string with English numbers and 2 decimal places
 */
export const formatCurrency = (amount: number, language: 'ar' | 'en' = 'en'): string => {
  // Round to 2 decimal places first to avoid floating point issues
  const rounded = Math.round(amount * 100) / 100

  // Always use en-US locale to ensure English numerals
  // Force exactly 2 decimal places for consistency
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded)

  // Place currency symbol based on language preference
  return language === 'ar' ? `${formatted} ر.س` : `SAR ${formatted}`
}

/**
 * Format number with thousand separators
 * Always uses English numerals (0-9) regardless of language
 * @param num - The number to format
 * @returns Formatted number string with English numerals
 */
export const formatNumber = (num: number): string => {
  // Always use en-US locale to ensure English numerals
  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Format percentage with optional sign
 * Always uses English numerals
 * @param value - The percentage value
 * @param showSign - Whether to show + sign for positive values
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, showSign = true): string => {
  const sign = showSign && value > 0 ? '+' : ''
  // Use toFixed to ensure English numerals
  return `${sign}${Math.abs(value).toFixed(1)}%`
}

/**
 * Format date using Gregorian calendar only
 * Uses date-fns for consistent formatting
 * @param date - Date to format (Date object, ISO string, or timestamp)
 * @param language - Language for month names
 * @param formatType - Format type (short, long, or custom)
 * @returns Formatted date string with English numerals
 */
export const formatDate = (
  date: Date | string | number,
  language: 'ar' | 'en' = 'en',
  formatType: 'short' | 'long' | 'full' = 'short'
): string => {
  const d = typeof date === 'number' ? new Date(date) :
            typeof date === 'string' ? new Date(date) : date
  
  // Define format patterns (always showing English numerals)
  let pattern: string
  switch (formatType) {
    case 'full':
      pattern = 'd MMMM yyyy' // e.g., "15 January 2024" or "15 يناير 2024"
      break
    case 'long':
      pattern = 'd MMM yyyy' // e.g., "15 Jan 2024" or "15 يناير 2024"
      break
    case 'short':
    default:
      pattern = 'dd/MM/yyyy' // e.g., "15/01/2024"
  }
  
  // Use date-fns format with appropriate locale for month names only
  // Numbers will always be in English
  return dateFnsFormat(d, pattern, {
    locale: language === 'ar' ? ar : enUS,
  })
}

/**
 * Format time in 12-hour format with AM/PM
 * Always uses English numerals
 * @param date - Date object or ISO string
 * @param language - Language for AM/PM text
 * @returns Formatted time string
 */
export const formatTime = (date: Date | string, language: 'ar' | 'en' = 'en'): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  
  // Format with English numerals
  const formatted = dateFnsFormat(d, 'h:mm a', { locale: enUS })
  
  // Optionally translate AM/PM for Arabic
  if (language === 'ar') {
    return formatted
      .replace('AM', 'ص')
      .replace('PM', 'م')
  }
  
  return formatted
}

/**
 * Format date and time together
 * @param date - Date to format
 * @param language - Language preference
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: Date | string, language: 'ar' | 'en' = 'en'): string => {
  const formattedDate = formatDate(date, language, 'short')
  const formattedTime = formatTime(date, language)
  
  return language === 'ar' 
    ? `${formattedDate} - ${formattedTime}`
    : `${formattedDate} at ${formattedTime}`
}

/**
 * Format relative time (e.g., "2 hours ago")
 * Always uses English numerals
 * @param date - Date to compare with now
 * @param language - Language for text
 * @returns Relative time string
 */
export const formatRelativeTime = (date: Date | string, language: 'ar' | 'en' = 'en'): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)
  
  const units = [
    { value: 31536000, unit: language === 'ar' ? 'سنة' : 'year' },
    { value: 2592000, unit: language === 'ar' ? 'شهر' : 'month' },
    { value: 604800, unit: language === 'ar' ? 'أسبوع' : 'week' },
    { value: 86400, unit: language === 'ar' ? 'يوم' : 'day' },
    { value: 3600, unit: language === 'ar' ? 'ساعة' : 'hour' },
    { value: 60, unit: language === 'ar' ? 'دقيقة' : 'minute' },
  ]
  
  for (const { value, unit } of units) {
    const count = Math.floor(diffInSeconds / value)
    if (count >= 1) {
      // Always use English numerals
      const countStr = count.toString()
      
      if (language === 'ar') {
        if (count === 1) return `منذ ${unit}`
        if (count === 2) return `منذ ${unit}ين`
        if (count > 2 && count < 11) return `منذ ${countStr} ${unit}ات`
        return `منذ ${countStr} ${unit}`
      } else {
        return count === 1 ? `${countStr} ${unit} ago` : `${countStr} ${unit}s ago`
      }
    }
  }
  
  return language === 'ar' ? 'الآن' : 'just now'
}

/**
 * Format duration between two dates
 * @param startDate - Start date
 * @param endDate - End date
 * @param language - Language preference
 * @returns Duration string with English numerals
 */
export const formatDuration = (
  startDate: Date | string | number,
  endDate: Date | string | number,
  language: 'ar' | 'en' = 'en'
): string => {
  const start = typeof startDate === 'number' ? new Date(startDate) :
                typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'number' ? new Date(endDate) :
              typeof endDate === 'string' ? new Date(endDate) : endDate
  
  const diffInDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays < 30) {
    const days = diffInDays.toString()
    if (language === 'ar') {
      if (diffInDays === 1) return 'يوم واحد'
      if (diffInDays === 2) return 'يومين'
      if (diffInDays > 2 && diffInDays < 11) return `${days} أيام`
      return `${days} يوم`
    }
    return diffInDays === 1 ? '1 day' : `${days} days`
  }
  
  const months = Math.ceil(diffInDays / 30)
  const monthsStr = months.toString()
  
  if (language === 'ar') {
    if (months === 1) return 'شهر واحد'
    if (months === 2) return 'شهرين'
    if (months > 2 && months < 11) return `${monthsStr} شهور`
    return `${monthsStr} شهر`
  }
  
  return months === 1 ? '1 month' : `${monthsStr} months`
}

/**
 * Format name initials (always in uppercase English)
 * @param name - Full name
 * @returns Initials in uppercase English letters
 */
export const formatInitials = (name: string): string => {
  if (!name) return ''
  
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return ''
  
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

/**
 * Format phone number for display
 * @param phone - Phone number string
 * @returns Formatted phone number with English numerals
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '')
  
  // Format as Saudi phone number (05XX XXX XXXX)
  if (cleaned.length === 10 && cleaned.startsWith('05')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
  }
  
  // Return as-is if not matching expected format
  return phone
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add (default: '...')
 * @returns Truncated text
 */
export const truncateText = (
  text: string,
  maxLength: number,
  suffix: string = '...'
): string => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength - suffix.length) + suffix
}

/**
 * Format file size in human-readable format
 * Always uses English numerals
 * @param bytes - File size in bytes
 * @param language - Language for units
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number, language: 'ar' | 'en' = 'en'): string => {
  const units = language === 'ar' 
    ? ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت']
    : ['B', 'KB', 'MB', 'GB']
  
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  // Always use English numerals with toFixed
  const formatted = size.toFixed(unitIndex === 0 ? 0 : 1)
  return `${formatted} ${units[unitIndex]}`
}