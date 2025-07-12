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
  GEOCODING: {
    FORWARD: 'geocode address',
    REVERSE: 'reverse geocode',
    VALIDATE: 'validate coordinates',
    BATCH: 'batch geocode',
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

// =============================================================================
// GEOCODING TYPES AND INTERFACES
// =============================================================================

export interface GeocodingResult {
  coordinates: [number, number] // [longitude, latitude]
  address: string
  confidence: 'exact' | 'interpolated' | 'approximate'
  components: {
    street?: string
    city?: string
    state?: string
    country?: string
    postalCode?: string
  }
}

export interface AddressResult {
  address: string
  components: GeocodingResult['components']
}

// =============================================================================
// GEOCODING SERVICE
// =============================================================================

/**
 * Mapbox Geocoding Service integrated with error handling
 */
export class MapboxGeocodingService {
  private apiKey: string
  private cache = new Map<string, { result: any; timestamp: number }>()
  private baseUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places'
  private cacheMaxAge = 24 * 60 * 60 * 1000 // 24 hours
  private defaultCountry = 'za' // South Africa ISO code

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Mapbox API key is required')
    }
    this.apiKey = apiKey
  }

  async geocodeAddress(address: string): Promise<GeocodingResult> {
    if (!address?.trim()) {
      throw new Error('Address is required for geocoding')
    }

    const cacheKey = `forward:${address.toLowerCase().trim()}`
    const cached = this.getCachedResult(cacheKey)
    if (cached) return cached

    try {
      const encodedAddress = encodeURIComponent(address.trim())
      const url = `${this.baseUrl}/${encodedAddress}.json?access_token=${this.apiKey}&limit=1&country=${this.defaultCountry}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`)
      }

      const data = await response.json()
      if (!data.features || data.features.length === 0) {
        throw new Error('No geocoding results found')
      }

      const feature = data.features[0]
      const [lon, lat] = feature.center

      const result: GeocodingResult = {
        coordinates: [lon, lat],
        address: feature.place_name || address,
        confidence: this.mapConfidence(feature.relevance || 0),
        components: this.extractComponents(feature),
      }

      this.setCachedResult(cacheKey, result)
      return result
    } catch (error) {
      logError(error, ErrorContexts.GEOCODING.FORWARD)
      throw error
    }
  }

  async reverseGeocode(lat: number, lon: number): Promise<AddressResult> {
    if (!this.isValidCoordinate(lat, lon)) {
      throw new Error('Invalid coordinates provided')
    }

    const cacheKey = `reverse:${lat.toFixed(5)},${lon.toFixed(5)}`
    const cached = this.getCachedResult(cacheKey)
    if (cached) return cached

    try {
      const url = `${this.baseUrl}/${lon},${lat}.json?access_token=${this.apiKey}&limit=1`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`)
      }

      const data = await response.json()
      if (!data.features || data.features.length === 0) {
        throw new Error('No address found for coordinates')
      }

      const feature = data.features[0]
      const result: AddressResult = {
        address: feature.place_name || `${lat}, ${lon}`,
        components: this.extractComponents(feature),
      }

      this.setCachedResult(cacheKey, result)
      return result
    } catch (error) {
      logError(error, ErrorContexts.GEOCODING.REVERSE)
      throw error
    }
  }

  validateCoordinates(
    lat: number,
    lon: number
  ): { isValid: boolean; errorMessage?: string } {
    if (!this.isValidCoordinate(lat, lon)) {
      return {
        isValid: false,
        errorMessage:
          'Coordinates must be valid: latitude (-90 to 90), longitude (-180 to 180)',
      }
    }
    return { isValid: true }
  }

  private getCachedResult(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > this.cacheMaxAge) {
      this.cache.delete(key)
      return null
    }

    return cached.result
  }

  private setCachedResult(key: string, result: any): void {
    this.cache.set(key, { result, timestamp: Date.now() })
  }

  private isValidCoordinate(lat: number, lon: number): boolean {
    return (
      typeof lat === 'number' &&
      typeof lon === 'number' &&
      !isNaN(lat) &&
      !isNaN(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180
    )
  }

  private mapConfidence(relevance: number): GeocodingResult['confidence'] {
    if (relevance >= 0.9) return 'exact'
    if (relevance >= 0.7) return 'interpolated'
    return 'approximate'
  }

  private extractComponents(feature: any): GeocodingResult['components'] {
    const components: GeocodingResult['components'] = {}

    if (feature.context) {
      for (const context of feature.context) {
        const id = context.id || ''
        if (id.startsWith('postcode.')) components.postalCode = context.text
        else if (id.startsWith('place.')) components.city = context.text
        else if (id.startsWith('region.')) components.state = context.text
        else if (id.startsWith('country.')) components.country = context.text
      }
    }

    if (feature.address && feature.text) {
      components.street = `${feature.address} ${feature.text}`
    } else if (feature.text) {
      components.street = feature.text
    }

    return components
  }
}

// Singleton geocoding service instance
let geocodingService: MapboxGeocodingService | null = null

export const getGeocodingService = (): MapboxGeocodingService => {
  if (!geocodingService) {
    const apiKey = import.meta.env.VITE_MAPBOX_TOKEN
    if (!apiKey) {
      throw new Error('VITE_MAPBOX_TOKEN environment variable is not set')
    }
    geocodingService = new MapboxGeocodingService(apiKey)
  }
  return geocodingService
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

  geocoding: {
    forward: (error: unknown) =>
      parseErrorMessage(error, {
        context: ErrorContexts.GEOCODING.FORWARD,
        fallbackMessage:
          'Failed to find coordinates for address. Please check the address and try again.',
      }),
    reverse: (error: unknown) =>
      parseErrorMessage(error, {
        context: ErrorContexts.GEOCODING.REVERSE,
        fallbackMessage:
          'Failed to find address for coordinates. Please try again.',
      }),
    validate: (error: unknown) =>
      parseErrorMessage(error, {
        context: ErrorContexts.GEOCODING.VALIDATE,
        fallbackMessage:
          'Invalid coordinates provided. Please check latitude and longitude values.',
      }),
    batch: (error: unknown) =>
      parseErrorMessage(error, {
        context: ErrorContexts.GEOCODING.BATCH,
        fallbackMessage: 'Failed to process batch geocoding. Please try again.',
      }),
  },
}

// =============================================================================
// LOCATION PICKER UTILITY
// =============================================================================

/**
 * Simple location picker for map interactions
 */
export const LocationPickerUtils = {
  /**
   * Create a simple map click handler for location selection
   */
  createLocationHandler: (
    onLocationSelect: (coords: [number, number], address?: string) => void
  ) => {
    return async (event: any) => {
      const { lng, lat } = event.lngLat || event

      try {
        const geocodingService = getGeocodingService()
        const result = await geocodingService.reverseGeocode(lat, lng)
        onLocationSelect([lng, lat], result.address)
      } catch (error) {
        console.warn('Reverse geocoding failed:', error)
        onLocationSelect([lng, lat], `${lat.toFixed(6)}, ${lng.toFixed(6)}`)
      }
    }
  },

  /**
   * Validate coordinates for location creation
   */
  validateCoordinates: (lat: number, lng: number): boolean => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  },

  /**
   * Format coordinates for display
   */
  formatCoordinates: (lat: number, lng: number): string => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  },
}
