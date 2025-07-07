import { useAuthActions as useConvexAuthActions } from '@convex-dev/auth/react'
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
  const { signIn: convexSignIn, signOut: convexSignOut } =
    useConvexAuthActions()

  return {
    signIn: async (email: string, password: string) => {
      try {
        const result = await convexSignIn('password', {
          email,
          password,
          flow: 'signIn',
        })
        return { success: result?.redirect ? false : true }
      } catch (error: any) {
        console.error('Sign in error:', error)
        // Provide user-friendly error messages
        if (error.message?.includes('Invalid credentials')) {
          throw new Error('Invalid email or password. Please try again.')
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
        await convexSignOut()
        return { success: true }
      } catch (error) {
        console.error('Sign out error:', error)
        throw error
      }
    },
    signUp: async (email: string, password: string, name?: string) => {
      try {
        const result = await convexSignIn('password', {
          email,
          password,
          name: name || email.split('@')[0],
          flow: 'signUp',
        })
        return { success: result?.redirect ? false : true }
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
        if (error.message?.includes('Password must')) {
          throw new Error(error.message) // Keep specific password requirements
        }
        if (error.message?.includes('Server Error')) {
          throw new Error(
            'Account creation service is temporarily unavailable. Please try again later.'
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
  return useQuery(
    api.auth.validateProjectAccess,
    isAuthenticated && projectId ? { projectId: projectId as any } : 'skip'
  )
}
