import React, { useEffect } from 'react'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { ConvexReactClient } from 'convex/react'
import {
  handleAuthenticationError,
  isProviderTokenError,
} from '@/utils/authStateManager'

interface ConvexAuthWrapperProps {
  client: ConvexReactClient
  children: React.ReactNode
}

/**
 * Wrapper around ConvexAuthProvider that handles authentication errors gracefully
 * Specifically handles provider token mismatch errors by clearing auth state
 */
export const ConvexAuthWrapper: React.FC<ConvexAuthWrapperProps> = ({
  client,
  children,
}) => {
  useEffect(() => {
    // Listen for authentication errors in the console
    const originalConsoleError = console.error

    console.error = (...args) => {
      const errorMessage = args.join(' ')

      // Check if this is a provider token mismatch error
      if (isProviderTokenError(errorMessage)) {
        console.warn(
          'Detected authentication provider token mismatch, clearing auth state...'
        )
        handleAuthenticationError(errorMessage)
        return // Don't log the error normally since we're handling it
      }

      // Call original console.error for other errors
      originalConsoleError(...args)
    }

    // Cleanup on unmount
    return () => {
      console.error = originalConsoleError
    }
  }, [])

  return <ConvexAuthProvider client={client}>{children}</ConvexAuthProvider>
}
