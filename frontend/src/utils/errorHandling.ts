/**
 * Centralized error handling utility for consistent error messages
 * throughout the authentication and VRP system
 */

export interface ErrorHandlingOptions {
  context?: string
  fallbackMessage?: string
  includeOriginalMessage?: boolean
}

/**
 * Parse and format error messages for better user experience
 */
export function parseErrorMessage(
  error: unknown,
  options: ErrorHandlingOptions = {}
): string {
  const {
    context = 'operation',
    fallbackMessage = `Failed to complete ${context}`,
    includeOriginalMessage = false,
  } = options

  // Handle null/undefined errors
  if (!error) {
    return fallbackMessage
  }

  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    // Authentication-specific errors
    if (
      message.includes('invalid login credentials') ||
      message.includes('user not found')
    ) {
      return 'Invalid email or password. Please check your credentials and try again.'
    }

    if (
      message.includes('email already exists') ||
      message.includes('already registered')
    ) {
      return 'This email is already registered. Try signing in instead.'
    }

    if (
      message.includes('unauthorized') ||
      message.includes('permission denied')
    ) {
      return 'Permission denied. Please sign in again.'
    }

    // Network-related errors
    if (
      message.includes('network') ||
      message.includes('fetch failed') ||
      message.includes('connection')
    ) {
      return 'Network error. Please check your connection and try again.'
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return `Request timed out. Please try again.`
    }

    // Server-related errors
    if (
      message.includes('server error') ||
      message.includes('internal server')
    ) {
      return 'Server error. Please try again in a few moments.'
    }

    if (message.includes('not found')) {
      return `${context} not found. It may have been deleted or moved.`
    }

    // Rate limiting
    if (
      message.includes('rate limit') ||
      message.includes('too many requests')
    ) {
      return 'Too many requests. Please wait a moment before trying again.'
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return includeOriginalMessage
        ? error.message
        : 'Invalid input. Please check your data and try again.'
    }

    // Return original message if it's user-friendly, otherwise use fallback
    if (includeOriginalMessage || isUserFriendlyMessage(error.message)) {
      return error.message
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error
  }

  // Handle structured errors (like from APIs)
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as any

    if (errorObj.message) {
      return parseErrorMessage(errorObj.message, options)
    }

    if (errorObj.error) {
      return parseErrorMessage(errorObj.error, options)
    }

    if (
      errorObj.errors &&
      Array.isArray(errorObj.errors) &&
      errorObj.errors.length > 0
    ) {
      return errorObj.errors[0].message || errorObj.errors[0]
    }
  }

  return fallbackMessage
}

/**
 * Check if an error message is user-friendly (doesn't contain technical details)
 */
function isUserFriendlyMessage(message: string): boolean {
  const technicalTerms = [
    'stack trace',
    'internal error',
    'undefined',
    'null',
    'function',
    'object',
    'promise',
    'async',
    'await',
    'throw',
    'catch',
    'try',
    'debug',
    'trace',
  ]

  const lowerMessage = message.toLowerCase()
  return !technicalTerms.some(term => lowerMessage.includes(term))
}

/**
 * Get context-specific error messages for common operations
 */
export const ErrorContexts = {
  AUTHENTICATION: {
    SIGN_IN: 'sign in',
    SIGN_UP: 'create account',
    SIGN_OUT: 'sign out',
    RESET_PASSWORD: 'reset password',
  },
  PROJECT: {
    CREATE: 'create project',
    UPDATE: 'update project',
    DELETE: 'delete project',
    LOAD: 'load project',
  },
  SCENARIO: {
    CREATE: 'create scenario',
    UPDATE: 'update scenario',
    DELETE: 'delete scenario',
    LOAD: 'load scenario',
  },
  DATASET: {
    CREATE: 'create dataset',
    UPDATE: 'update dataset',
    DELETE: 'delete dataset',
    LOAD: 'load dataset',
    IMPORT: 'import data',
    EXPORT: 'export data',
  },
  TABLE: {
    CREATE: 'create row',
    UPDATE: 'update row',
    DELETE: 'delete row',
    LOAD: 'load table data',
    BULK_EDIT: 'bulk edit',
    BULK_DELETE: 'bulk delete',
  },
} as const

/**
 * Log error details for debugging while showing user-friendly messages
 */
export function logError(
  error: unknown,
  context: string,
  additionalInfo?: any
) {
  console.error(`[${context}] Error:`, error)
  if (additionalInfo) {
    console.error(`[${context}] Additional info:`, additionalInfo)
  }

  // In development, also log stack trace if available
  if (
    process.env.NODE_ENV === 'development' &&
    error instanceof Error &&
    error.stack
  ) {
    console.error(`[${context}] Stack trace:`, error.stack)
  }
}

/**
 * Retry wrapper with exponential backoff for handling transient errors
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  context: string = 'operation'
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // Don't retry on certain error types
      if (error instanceof Error) {
        const message = error.message.toLowerCase()
        if (
          message.includes('unauthorized') ||
          message.includes('permission denied') ||
          message.includes('not found') ||
          message.includes('validation')
        ) {
          throw error
        }
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        logError(error, `${context} (final attempt)`)
        throw error
      }

      // Wait before retrying with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1)
      logError(
        error,
        `${context} (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms`
      )
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Common error handling patterns for authentication
 */
export const AuthErrorHandling = {
  signIn: (error: unknown) =>
    parseErrorMessage(error, {
      context: ErrorContexts.AUTHENTICATION.SIGN_IN,
      fallbackMessage: 'Failed to sign in. Please try again.',
    }),

  signUp: (error: unknown) =>
    parseErrorMessage(error, {
      context: ErrorContexts.AUTHENTICATION.SIGN_UP,
      fallbackMessage: 'Failed to create account. Please try again.',
    }),

  signOut: (error: unknown) =>
    parseErrorMessage(error, {
      context: ErrorContexts.AUTHENTICATION.SIGN_OUT,
      fallbackMessage: 'Failed to sign out. Please try again.',
    }),
}

/**
 * Common error handling patterns for VRP operations
 */
export const VRPErrorHandling = {
  project: {
    create: (error: unknown) =>
      parseErrorMessage(error, {
        context: ErrorContexts.PROJECT.CREATE,
        fallbackMessage: 'Failed to create project. Please try again.',
      }),
    update: (error: unknown) =>
      parseErrorMessage(error, {
        context: ErrorContexts.PROJECT.UPDATE,
        fallbackMessage: 'Failed to update project. Please try again.',
      }),
    delete: (error: unknown) =>
      parseErrorMessage(error, {
        context: ErrorContexts.PROJECT.DELETE,
        fallbackMessage: 'Failed to delete project. Please try again.',
      }),
  },

  table: {
    create: (error: unknown) =>
      parseErrorMessage(error, {
        context: ErrorContexts.TABLE.CREATE,
        fallbackMessage: 'Failed to create row. Please try again.',
      }),
    update: (error: unknown) =>
      parseErrorMessage(error, {
        context: ErrorContexts.TABLE.UPDATE,
        fallbackMessage: 'Failed to update row. Please try again.',
      }),
    delete: (error: unknown) =>
      parseErrorMessage(error, {
        context: ErrorContexts.TABLE.DELETE,
        fallbackMessage: 'Failed to delete row. Please try again.',
      }),
    bulkEdit: (error: unknown) =>
      parseErrorMessage(error, {
        context: ErrorContexts.TABLE.BULK_EDIT,
        fallbackMessage: 'Failed to bulk edit. Please try again.',
      }),
    bulkDelete: (error: unknown) =>
      parseErrorMessage(error, {
        context: ErrorContexts.TABLE.BULK_DELETE,
        fallbackMessage: 'Failed to bulk delete. Please try again.',
      }),
  },
}
