// Authentication state management utilities

/**
 * Clears all authentication-related storage to force fresh authentication
 * This helps resolve token compatibility issues after provider configuration changes
 */
export const clearAuthState = (): void => {
  try {
    // Clear localStorage
    localStorage.clear()

    // Clear sessionStorage
    sessionStorage.clear()

    // Clear IndexedDB Convex data (async, but don't wait)
    if ('indexedDB' in window) {
      // Clear Convex-related IndexedDB databases
      indexedDB
        .databases?.()
        .then(databases => {
          databases.forEach(db => {
            if (db.name?.includes('convex') || db.name?.includes('auth')) {
              indexedDB.deleteDatabase(db.name)
            }
          })
        })
        .catch(console.warn)
    }

    console.log('Authentication state cleared successfully')
  } catch (error) {
    console.warn('Failed to clear some authentication state:', error)
  }
}

/**
 * Handles authentication errors by clearing state and redirecting to login
 */
export const handleAuthenticationError = (error?: any): void => {
  console.warn('Authentication error occurred:', error)

  // Clear authentication state
  clearAuthState()

  // Redirect to login page
  window.location.href = '/auth/login'
}

/**
 * Check if current error is related to provider token mismatch
 */
export const isProviderTokenError = (error?: any): boolean => {
  const message = error?.message || error?.toString() || ''
  return message.includes('No auth provider found matching the given token')
}
