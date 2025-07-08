import { convexAuth, getAuthUserId } from '@convex-dev/auth/server'
import { Password } from '@convex-dev/auth/providers/Password'
import { query, mutation } from './_generated/server'

// Password authentication using Convex Auth
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
})

export const getCurrentUserProfile = query({
  handler: async ctx => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return null
    }

    // With Convex Auth, user data is stored in auth tables
    // We need to get the user from the auth system
    const user = await ctx.db.get(userId)
    return user
  },
})

// Create or update user profile information
export const createUserProfile = mutation({
  handler: async (ctx, args: { name?: string; email?: string }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('Not authenticated')
    }

    // Get existing user record
    const existingUser = await ctx.db.get(userId)
    if (existingUser) {
      // Update existing user
      await ctx.db.patch(userId, {
        name: args.name || existingUser.name,
        email: args.email || existingUser.email,
        updatedAt: Date.now(),
      })
    }

    return { success: true }
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
