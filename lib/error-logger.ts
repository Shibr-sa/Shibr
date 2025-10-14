/**
 * Centralized error logging utility for better debugging and monitoring
 */

export interface ErrorContext {
  userId?: string
  page?: string
  action?: string
  component?: string
  metadata?: Record<string, any>
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

class ErrorLogger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private logs: Array<{ timestamp: Date; level: LogLevel; message: string; data?: any }> = []
  private maxLogs = 100

  /**
   * Log an error with context
   */
  logError(error: Error | unknown, context?: ErrorContext): void {
    const timestamp = new Date()
    const errorData = this.formatError(error, context)

    // Always log to console in development
    if (this.isDevelopment) {
      console.error('🔴 Error Logger:', errorData)
    } else {
      // In production, still log but less verbose
      console.error(`Error: ${errorData.message}`, {
        context: context?.action || context?.component || 'Unknown',
        timestamp
      })
    }

    // Store in memory for debugging
    this.addToLogs(LogLevel.ERROR, errorData.message, errorData)

    // In production, you could send to a monitoring service here
    if (!this.isDevelopment) {
      this.sendToMonitoring(errorData)
    }
  }

  /**
   * Log a warning
   */
  logWarn(message: string, data?: any, context?: ErrorContext): void {
    const timestamp = new Date()

    if (this.isDevelopment) {
      console.warn('🟡 Warning:', message, { data, context, timestamp })
    }

    this.addToLogs(LogLevel.WARN, message, { data, context })
  }

  /**
   * Log info message
   */
  logInfo(message: string, data?: any, context?: ErrorContext): void {
    const timestamp = new Date()

    if (this.isDevelopment) {
      console.info('🔵 Info:', message, { data, context, timestamp })
    }

    this.addToLogs(LogLevel.INFO, message, { data, context })
  }

  /**
   * Log debug message (only in development)
   */
  logDebug(message: string, data?: any, context?: ErrorContext): void {
    if (!this.isDevelopment) return

    const timestamp = new Date()
    console.log('🟢 Debug:', message, { data, context, timestamp })

    this.addToLogs(LogLevel.DEBUG, message, { data, context })
  }

  /**
   * Log validation errors
   */
  logValidation(field: string, error: string, context?: ErrorContext): void {
    const message = `Validation failed for ${field}: ${error}`

    if (this.isDevelopment) {
      console.warn('⚠️ Validation:', message, { context })
    }

    this.addToLogs(LogLevel.WARN, message, { field, error, context })
  }

  /**
   * Log API/Convex errors
   */
  logApiError(operation: string, error: Error | unknown, context?: ErrorContext): void {
    const errorData = this.formatError(error, {
      ...context,
      action: `API: ${operation}`
    })

    if (this.isDevelopment) {
      console.error('🌐 API Error:', operation, errorData)
    } else {
      console.error(`API Error in ${operation}`)
    }

    this.addToLogs(LogLevel.ERROR, `API Error: ${operation}`, errorData)

    // Send to monitoring in production
    if (!this.isDevelopment) {
      this.sendToMonitoring({
        ...errorData,
        type: 'api_error',
        operation
      })
    }
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(count: number = 20): Array<any> {
    return this.logs.slice(-count)
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = []
  }

  /**
   * Format error for logging (with security considerations)
   */
  private formatError(error: Error | unknown, context?: ErrorContext): any {
    let errorData: any = {
      timestamp: new Date().toISOString(),
      context
    }

    if (error instanceof Error) {
      errorData = {
        ...errorData,
        message: this.sanitizeErrorMessage(error.message),
        name: error.name,
        // Only include stack trace in development
        ...(this.isDevelopment && { stack: error.stack }),
      }
    } else if (typeof error === 'string') {
      errorData.message = this.sanitizeErrorMessage(error)
    } else if (error && typeof error === 'object') {
      errorData = {
        ...errorData,
        message: 'message' in error ? this.sanitizeErrorMessage((error as any).message) : 'Unknown error',
        // Don't spread the entire error object in production
        ...(this.isDevelopment && error)
      }
    } else {
      errorData.message = 'Unknown error'
      if (this.isDevelopment) {
        errorData.raw = error
      }
    }

    return errorData
  }

  /**
   * Sanitize error messages to prevent information disclosure
   */
  private sanitizeErrorMessage(message: string): string {
    // Remove sensitive patterns from error messages
    const sensitivePatterns = [
      /\/Users\/[^/]+/g, // File paths with usernames
      /[a-zA-Z]:\\\\[^\\s]+/g, // Windows file paths
      /Bearer [A-Za-z0-9\-._~+\/]+=*/g, // Bearer tokens
      /[a-zA-Z0-9]{32,}/g, // API keys or tokens
      /password['\"]?\s*[:=]\s*['\"]?[^'\"]+['\"]?/gi, // Passwords
      /secret['\"]?\s*[:=]\s*['\"]?[^'\"]+['\"]?/gi, // Secrets
      /key['\"]?\s*[:=]\s*['\"]?[A-Za-z0-9+\/=]+['\"]?/gi, // Keys
    ]

    let sanitized = message
    for (const pattern of sensitivePatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]')
    }

    return sanitized
  }

  /**
   * Add log to memory
   */
  private addToLogs(level: LogLevel, message: string, data?: any): void {
    this.logs.push({
      timestamp: new Date(),
      level,
      message,
      data
    })

    // Keep only recent logs to prevent memory issues
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }

  /**
   * Send error to monitoring service (placeholder for future implementation)
   */
  private sendToMonitoring(errorData: any): void {
    // In production, you could send to services like:
    // - Sentry
    // - LogRocket
    // - Bugsnag
    // - Custom error tracking endpoint

    // For now, we'll just store in localStorage for debugging
    try {
      const errors = JSON.parse(localStorage.getItem('app_errors') || '[]')
      errors.push({
        ...errorData,
        timestamp: new Date().toISOString()
      })

      // Keep only last 50 errors
      const recentErrors = errors.slice(-50)
      localStorage.setItem('app_errors', JSON.stringify(recentErrors))
    } catch {
      // Silently fail if localStorage is not available
    }
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger()

// Export convenience functions
export const logError = (error: Error | unknown, context?: ErrorContext) =>
  errorLogger.logError(error, context)

export const logWarn = (message: string, data?: any, context?: ErrorContext) =>
  errorLogger.logWarn(message, data, context)

export const logInfo = (message: string, data?: any, context?: ErrorContext) =>
  errorLogger.logInfo(message, data, context)

export const logDebug = (message: string, data?: any, context?: ErrorContext) =>
  errorLogger.logDebug(message, data, context)

export const logValidation = (field: string, error: string, context?: ErrorContext) =>
  errorLogger.logValidation(field, error, context)

export const logApiError = (operation: string, error: Error | unknown, context?: ErrorContext) =>
  errorLogger.logApiError(operation, error, context)

// Export function to get logs (useful for debugging)
export const getErrorLogs = () => errorLogger.getRecentLogs()

// Export function to clear logs
export const clearErrorLogs = () => errorLogger.clearLogs()

// Make error logger available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__errorLogger = errorLogger
  console.log('🛠️ Error Logger initialized. Access via window.__errorLogger')
}