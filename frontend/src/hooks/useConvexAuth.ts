import { useAuthActions as useConvexAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useConvexAuth as useConvexAuthHook } from "@convex-dev/auth/react";
import { api } from '../convex/_generated/api';
import { useEffect } from 'react';

// Current implementation uses the official Convex Auth
export const useCurrentUser = () => {
  const { isAuthenticated, isLoading } = useConvexAuthHook();
  const userProfile = useQuery(api.auth.getCurrentUserProfile);
  
  const userState = {
    isAuthenticated,
    isLoading,
    _id: userProfile?._id,
    email: userProfile?.email,
    name: userProfile?.name,
  };

  // Update UAT health check with auth state
  useEffect(() => {
    if (import.meta.env.DEV && (window as any).__UAT_HEALTH__) {
      (window as any).__convexAuthState = {
        isAuthenticated: userState.isAuthenticated,
        isLoading: userState.isLoading
      };
      
      if ((window as any).__UAT_HEALTH__.logAction) {
        (window as any).__UAT_HEALTH__.logAction('auth_state_change', {
          isAuthenticated: userState.isAuthenticated,
          isLoading: userState.isLoading,
        });
      }
    }
  }, [userState.isAuthenticated, userState.isLoading]);

  return userState;
}

export const useVRPAuthActions = () => {
  const { signIn: convexSignIn, signOut: convexSignOut } = useConvexAuthActions();
  
  return {
    signIn: async (email: string, password: string) => {
      try {
        const result = await convexSignIn("password", { email, password, flow: "signIn" });
        return { success: result?.redirect ? false : true };
      } catch (error) {
        console.error('Sign in error:', error);
        throw error;
      }
    },
    signOut: async () => {
      try {
        await convexSignOut();
        return { success: true };
      } catch (error) {
        console.error('Sign out error:', error);
        throw error;
      }
    },
    signUp: async (email: string, password: string, name?: string) => {
      try {
        const result = await convexSignIn("password", { 
          email, 
          password, 
          name: name || email.split('@')[0],
          flow: "signUp" 
        });
        return { success: result?.redirect ? false : true };
      } catch (error) {
        console.error('Sign up error:', error);
        throw error;
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
  const { isAuthenticated } = useConvexAuthHook();
  return useQuery(
    api.auth.validateProjectAccess,
    isAuthenticated && projectId ? { projectId: projectId as any } : 'skip'
  )
}