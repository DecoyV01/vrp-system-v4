import { convexAuth, getAuthUserId } from '@convex-dev/auth/server'
import { query } from './_generated/server'

// JWT/OIDC authentication configured via auth.config.ts
// This setup works with the OIDC provider configured in the dashboard
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [], // Empty - JWT validation handled by auth.config.ts
})

export const getCurrentUserProfile = query({
  handler: async ctx => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      // For development: return mock user when no auth
      // In production, this should return null
      return {
        _id: 'mock_user_id' as any,
        email: 'test@example.com',
        name: 'Test User',
        _creationTime: Date.now(),
      }
    }
    const user = await ctx.db.get(userId)
    if (!user) {
      return null
    }
    return user
  },
})

// Helper function for backward compatibility with existing backend functions
export async function getCurrentUser(ctx: any) {
  const userId = await getAuthUserId(ctx)
  if (!userId) {
    return null
  }
  const user = await ctx.db.get(userId)
  if (!user) {
    return null
  }
  return user
}

// Helper function to validate user ownership for projects
export async function validateUserOwnership(
  ctx: any,
  projectId: string,
  userId?: string
) {
  if (!userId) {
    throw new Error('User not authenticated')
  }

  const project = await ctx.db.get(projectId)
  if (!project) {
    throw new Error('Project not found')
  }

  if (project.ownerId !== userId) {
    throw new Error('Access denied: User does not own this project')
  }

  return project
}

// Development helper to debug JWT claims
export const debugJWTClaims = query({
  handler: async ctx => {
    const userId = await getAuthUserId(ctx)
    const authInfo = {
      userId,
      hasAuth: !!userId,
      environment: {
        siteUrl: process.env.SITE_URL,
        authLogLevel: process.env.AUTH_LOG_LEVEL,
      },
      timestamp: Date.now(),
    }

    console.log('Auth Debug Info:', authInfo)
    return authInfo
  },
})
