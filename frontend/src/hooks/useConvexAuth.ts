import { useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'

// Current implementation uses the mock auth from Convex backend
// In the future, this will be replaced with proper Convex Auth

export const useCurrentUser = () => {
  const userProfile = useQuery(api.auth.getCurrentUserProfile)
  
  if (userProfile === undefined) {
    return {
      _id: undefined,
      email: undefined,
      name: undefined,
      isAuthenticated: false,
      isLoading: true,
    }
  }

  return {
    _id: userProfile._id,
    email: userProfile.email,
    name: userProfile.name,
    isAuthenticated: true,
    isLoading: false,
  }
}

export const useAuthActions = () => {
  return {
    signIn: async (email: string, _password: string) => {
      // For now, mock implementation since we're using mock auth in backend
      console.log('Sign in:', email)
      return { success: true }
    },
    signOut: async () => {
      // For now, mock implementation since we're using mock auth in backend
      console.log('Sign out')
      return { success: true }
    },
    signUp: async (email: string, _password: string) => {
      // For now, mock implementation since we're using mock auth in backend
      console.log('Sign up:', email)
      return { success: true }
    },
  }
}

export const useAuth = () => {
  const user = useCurrentUser()
  const actions = useAuthActions()
  
  return {
    user,
    ...actions,
  }
}

// Helper hook to check if user has access to a project
export const useProjectAccess = (projectId: string | undefined) => {
  return useQuery(
    api.auth.validateProjectAccess,
    projectId ? { projectId: projectId as any } : 'skip'
  )
}