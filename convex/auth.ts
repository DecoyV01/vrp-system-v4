import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// User profile table for storing additional user information
// Note: In a production app, you would typically use an external auth provider
// For now, we'll create a simple auth system with users table in schema

// Helper function to validate user ownership
export async function validateUserOwnership(ctx: any, projectId: string, userId?: string) {
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const project = await ctx.db.get(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  if (project.ownerId !== userId) {
    throw new Error("Access denied: User does not own this project");
  }

  return project;
}

// Helper function to get current user (mock implementation)
export async function getCurrentUser(ctx: any) {
  // In a real implementation, this would extract user info from auth token
  // For development purposes, we'll use a mock user
  return {
    _id: "user_mock_123",
    name: "Test User",
    email: "test@example.com",
  };
}

// Get current user profile
export const getCurrentUserProfile = query({
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

// Create a new user profile (simplified for development)
export const createUserProfile = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // In production, this would be called after successful auth
    const user = {
      _id: `user_${Date.now()}`,
      ...args,
      createdAt: Date.now(),
    };
    
    return user;
  },
});

// Validate user has access to project
export const validateProjectAccess = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    return await validateUserOwnership(ctx, args.projectId, user._id);
  },
});