/**
 * Convex-compatible logger for backend functions
 *
 * Convex logs automatically go to `bunx convex logs`
 * This wrapper provides structured logging with prefixes
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

class ConvexLogger {
  /**
   * Log debug message (development tracking)
   */
  debug(message: string, data?: any): void {
    console.log(`[${LogLevel.DEBUG}] ${message}`, data ? JSON.stringify(data, null, 2) : '')
  }

  /**
   * Log info message (important workflow steps)
   */
  info(message: string, data?: any): void {
    console.log(`[${LogLevel.INFO}] ${message}`, data ? JSON.stringify(data, null, 2) : '')
  }

  /**
   * Log warning
   */
  warn(message: string, data?: any): void {
    console.warn(`[${LogLevel.WARN}] ${message}`, data ? JSON.stringify(data, null, 2) : '')
  }

  /**
   * Log error
   */
  error(message: string, error?: any, data?: any): void {
    console.error(`[${LogLevel.ERROR}] ${message}`, {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
      ...data,
    })
  }
}

// Export singleton instance
export const logger = new ConvexLogger()
