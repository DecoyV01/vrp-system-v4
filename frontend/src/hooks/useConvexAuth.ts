import { useConvexAuth } from 'convex/react'
import { useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import { useEffect, useState } from 'react'

// Current implementation uses the official Convex Auth
export const useCurrentUser = () => {
  const userProfile = useQuery(api.auth.getCurrentUserProfile)

  // Determine authentication state based on userProfile
  const isAuthenticated = userProfile !== undefined && userProfile !== null
  const isLoading = userProfile === undefined

  const userState = {
    isAuthenticated,
    isLoading,
    _id: userProfile?._id,
    email: userProfile?.email,
    name: userProfile?.name,
  }

  // Update UAT health check with auth state
  useEffect(() => {
    if (import.meta.env.DEV && (window as any).__UAT_HEALTH__) {
      ;(window as any).__convexAuthState = {
        isAuthenticated: userState.isAuthenticated,
        isLoading: userState.isLoading,
      }

      if ((window as any).__UAT_HEALTH__.logAction) {
        ;(window as any).__UAT_HEALTH__.logAction('auth_state_change', {
          isAuthenticated: userState.isAuthenticated,
          isLoading: userState.isLoading,
        })
      }
    }
  }, [userState.isAuthenticated, userState.isLoading])

  return userState
}

export const useVRPAuthActions = () => {
  return {
    signIn: async (email: string, password: string) => {
      try {
        // Call our JWT authentication endpoint
        const response = await fetch(
          `${import.meta.env.VITE_CONVEX_URL.replace('.convex.cloud', '.convex.site')}/jwt-login`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              password,
              flow: 'signIn',
            }),
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Authentication failed')
        }

        const { token, user } = await response.json()

        // Note: Client auth will be set when app initializes with stored token

        // Store token in localStorage for persistence
        localStorage.setItem('convex-auth-token', token)
        localStorage.setItem('convex-user', JSON.stringify(user))

        return { success: true, user }
      } catch (error: any) {
        console.error('Sign in error:', error)
        // Provide user-friendly error messages
        if (error.message?.includes('Invalid credentials')) {
          throw new Error('Invalid email or password. Please try again.')
        }
        if (error.message?.includes('ConvexError')) {
          // Extract the actual error message from ConvexError format
          const match = error.message.match(/ConvexError: (.+)/)
          if (match) {
            throw new Error(match[1])
          }
        }
        if (error.message?.includes('Server Error')) {
          throw new Error(
            'Authentication service is temporarily unavailable. Please try again later.'
          )
        }
        if (error.message?.includes('Network')) {
          throw new Error(
            'Network connection error. Please check your internet connection.'
          )
        }
        throw new Error(
          error.message || 'Failed to sign in. Please check your credentials.'
        )
      }
    },
    signOut: async () => {
      try {
        // Clear local storage
        localStorage.removeItem('convex-auth-token')
        localStorage.removeItem('convex-user')

        return { success: true }
      } catch (error) {
        console.error('Sign out error:', error)
        throw error
      }
    },
    signUp: async (email: string, password: string, name?: string) => {
      try {
        // Call our JWT authentication endpoint
        const response = await fetch(
          `${import.meta.env.VITE_CONVEX_URL.replace('.convex.cloud', '.convex.site')}/jwt-login`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              password,
              name: name || email.split('@')[0],
              flow: 'signUp',
            }),
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Account creation failed')
        }

        const { token, user } = await response.json()

        // Store token in localStorage for persistence
        localStorage.setItem('convex-auth-token', token)
        localStorage.setItem('convex-user', JSON.stringify(user))

        return { success: true, user }
      } catch (error: any) {
        console.error('Sign up error:', error)
        // Provide user-friendly error messages
        if (
          error.message?.includes('already exists') ||
          error.message?.includes('already registered')
        ) {
          throw new Error(
            'An account with this email already exists. Please sign in instead.'
          )
        }
        if (error.message?.includes('Network')) {
          throw new Error(
            'Network connection error. Please check your internet connection.'
          )
        }
        throw new Error(
          error.message || 'Failed to create account. Please try again.'
        )
      }
    },
  }
}

export const useAuth = () => {
  const user = useCurrentUser()
  const actions = useVRPAuthActions()

  return {
    user,
    ...actions,
  }
}

// Helper hook to check if user has access to a project
export const useProjectAccess = (projectId: string | undefined) => {
  const { isAuthenticated } = useCurrentUser()
  // Note: Project access validation moved to backend functions
  // Each project query now validates access internally
  return { hasAccess: isAuthenticated, isLoading: false }
}
