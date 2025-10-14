/**
 * Security-focused error response utilities
 * Prevents information disclosure in production
 */

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Error codes for client consumption
 */
export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',

  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // File errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',

  // Payment errors
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  INVALID_PAYMENT_METHOD = 'INVALID_PAYMENT_METHOD',
}

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  success: false
  error: {
    code: ErrorCode
    message: string
    details?: any // Only included in development
  }
}

/**
 * Create a safe error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: any
): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    error: {
      code,
      message: sanitizeErrorMessage(message),
    }
  }

  // Only include details in development
  if (isDevelopment && details) {
    response.error.details = details
  }

  return response
}

/**
 * Sanitize error messages for production
 */
function sanitizeErrorMessage(message: string): string {
  if (isDevelopment) {
    return message
  }

  // Map detailed errors to generic messages in production
  const errorMap: Record<string, string> = {
    // Database errors
    'duplicate key error': 'Resource already exists',
    'document not found': 'Resource not found',
    'connection refused': 'Service temporarily unavailable',

    // Authentication errors
    'invalid token': 'Authentication failed',
    'token expired': 'Session expired',
    'user not found': 'Invalid credentials',

    // File errors
    'file size exceeded': 'File too large',
    'unsupported file type': 'Invalid file type',

    // Generic patterns
    'cannot read property': 'An error occurred',
    'undefined is not': 'An error occurred',
    'null is not': 'An error occurred',
  }

  // Check if message contains any sensitive patterns
  const lowercaseMessage = message.toLowerCase()
  for (const [pattern, replacement] of Object.entries(errorMap)) {
    if (lowercaseMessage.includes(pattern)) {
      return replacement
    }
  }

  // Remove any file paths, stack traces, or sensitive data
  const sensitivePatterns = [
    /at .+:\d+:\d+/g, // Stack trace lines
    /\/[^\s]+\.(ts|js|tsx|jsx)/g, // File paths
    /\b[A-Z][a-z]+Error\b/g, // Error types
    /line \d+/gi, // Line numbers
    /column \d+/gi, // Column numbers
  ]

  let sanitized = message
  for (const pattern of sensitivePatterns) {
    sanitized = sanitized.replace(pattern, '')
  }

  // If message is too technical, return generic message
  if (sanitized.length > 100 || sanitized.includes('stack') || sanitized.includes('trace')) {
    return 'An unexpected error occurred. Please try again later.'
  }

  return sanitized.trim()
}

/**
 * Map HTTP status codes to error codes
 */
export function getErrorCodeFromStatus(status: number): ErrorCode {
  const statusMap: Record<number, ErrorCode> = {
    400: ErrorCode.INVALID_INPUT,
    401: ErrorCode.UNAUTHORIZED,
    403: ErrorCode.FORBIDDEN,
    404: ErrorCode.NOT_FOUND,
    409: ErrorCode.RESOURCE_CONFLICT,
    429: ErrorCode.RATE_LIMIT_EXCEEDED,
    500: ErrorCode.INTERNAL_ERROR,
    503: ErrorCode.SERVICE_UNAVAILABLE,
  }

  return statusMap[status] || ErrorCode.INTERNAL_ERROR
}

/**
 * Create HTTP error response
 */
export function createHttpErrorResponse(
  status: number,
  message?: string
): Response {
  const errorCode = getErrorCodeFromStatus(status)
  const errorMessage = message || getDefaultErrorMessage(errorCode)

  const response = createErrorResponse(errorCode, errorMessage)

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * Get default error message for error code
 */
function getDefaultErrorMessage(code: ErrorCode): string {
  const messages: Record<ErrorCode, string> = {
    [ErrorCode.UNAUTHORIZED]: 'Authentication required',
    [ErrorCode.FORBIDDEN]: 'Access denied',
    [ErrorCode.INVALID_CREDENTIALS]: 'Invalid credentials',
    [ErrorCode.SESSION_EXPIRED]: 'Session expired. Please sign in again.',
    [ErrorCode.VALIDATION_ERROR]: 'Invalid input provided',
    [ErrorCode.INVALID_INPUT]: 'Invalid input provided',
    [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field missing',
    [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
    [ErrorCode.NOT_FOUND]: 'Resource not found',
    [ErrorCode.RESOURCE_CONFLICT]: 'Resource conflict',
    [ErrorCode.INTERNAL_ERROR]: 'An error occurred. Please try again.',
    [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
    [ErrorCode.FILE_TOO_LARGE]: 'File size exceeds limit',
    [ErrorCode.INVALID_FILE_TYPE]: 'Invalid file type',
    [ErrorCode.UPLOAD_FAILED]: 'File upload failed',
    [ErrorCode.PAYMENT_FAILED]: 'Payment processing failed',
    [ErrorCode.INVALID_PAYMENT_METHOD]: 'Invalid payment method',
  }

  return messages[code] || 'An error occurred'
}