import { Password } from '@convex-dev/auth/providers/Password'
import { convexAuth } from '@convex-dev/auth/server'
import { DataModel } from './_generated/dataModel'
import { query } from './_generated/server'
import { v, ConvexError } from 'convex/values'

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password<DataModel>({
      id: 'password', // Explicit provider ID to match frontend calls
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
        }
      },
      validatePasswordRequirements(password: string) {
        if (!password || password.length < 8) {
          throw new ConvexError('Password must be at least 8 characters long')
        }
        if (!/(?=.*[a-z])/.test(password)) {
          throw new ConvexError(
            'Password must contain at least one lowercase letter'
          )
        }
        if (!/(?=.*[A-Z])/.test(password)) {
          throw new ConvexError(
            'Password must contain at least one uppercase letter'
          )
        }
        if (!/(?=.*\d)/.test(password)) {
          throw new ConvexError('Password must contain at least one number')
        }
      },
    }),
  ],
  // Add debug logging for authentication issues
  debug: process.env.AUTH_LOG_LEVEL === 'DEBUG',
})

// Helper function to get current user (for backward compatibility)
export async function getCurrentUser(ctx: any) {
  const userId = await auth.getUserId(ctx)
  if (!userId) {
    return null // Return null for unauthenticated users
  }
  const user = await ctx.db.get(userId)
  if (!user) {
    return null // Return null if user not found
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

// Get current user profile using the new auth system
export const getCurrentUserProfile = query({
  args: {},
  handler: async ctx => {
    const userId = await auth.getUserId(ctx)
    if (!userId) {
      return null
    }

    const user = await ctx.db.get(userId)
    return user
      ? {
          _id: user._id,
          email: user.email,
          name: user.name,
        }
      : null
  },
})

// Validate user has access to project using the new auth system
export const validateProjectAccess = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) {
      throw new Error('User not authenticated')
    }

    return await validateUserOwnership(ctx, args.projectId, userId)
  },
})
