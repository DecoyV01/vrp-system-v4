import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getCurrentUser, validateUserOwnership } from './auth'

// Get all projects for the current user
export const list = query({
  handler: async ctx => {
    const user = await getCurrentUser(ctx)
    if (!user) {
      return [] // Return empty array if not authenticated
    }
    return await ctx.db
      .query('projects')
      .withIndex('by_owner', q => q.eq('ownerId', user._id))
      .collect()
  },
})

// Get a single project by ID
export const getById = query({
  args: { id: v.id('projects') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) {
      return null // Return null if not authenticated
    }

    const project = await ctx.db.get(args.id)

    if (!project) {
      throw new Error('Project not found')
    }

    // Validate user ownership
    if (project.ownerId !== user._id) {
      throw new Error('Access denied: User does not own this project')
    }

    return project
  },
})

// Create a new project
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    currency: v.optional(v.string()),
    projectType: v.optional(v.string()),
    industry: v.optional(v.string()),
    geographicRegion: v.optional(v.string()),
    priority: v.optional(v.string()),
    estimatedVehicles: v.optional(v.number()),
    estimatedJobs: v.optional(v.number()),
    planningHorizonDays: v.optional(v.number()),
    contactPerson: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    const now = Date.now()

    const projectId = await ctx.db.insert('projects', {
      ...args,
      ownerId: user._id,
      updatedAt: now,
    })

    return projectId
  },
})

// Update an existing project
export const update = mutation({
  args: {
    id: v.id('projects'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    currency: v.optional(v.string()),
    projectType: v.optional(v.string()),
    industry: v.optional(v.string()),
    geographicRegion: v.optional(v.string()),
    priority: v.optional(v.string()),
    estimatedVehicles: v.optional(v.number()),
    estimatedJobs: v.optional(v.number()),
    planningHorizonDays: v.optional(v.number()),
    contactPerson: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    const { id, ...updateData } = args

    // Validate user ownership
    await validateUserOwnership(ctx, id, user._id)

    // Remove undefined values
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    )

    await ctx.db.patch(id, {
      ...cleanUpdateData,
      updatedAt: Date.now(),
    })

    return id
  },
})

// Delete a project (also deletes all related data)
export const remove = mutation({
  args: { id: v.id('projects') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Validate user ownership
    await validateUserOwnership(ctx, args.id, user._id)

    // Delete related scenarios first
    const scenarios = await ctx.db
      .query('scenarios')
      .withIndex('by_project', q => q.eq('projectId', args.id))
      .collect()

    for (const scenario of scenarios) {
      await ctx.db.delete(scenario._id)
    }

    // Delete related datasets
    const datasets = await ctx.db
      .query('datasets')
      .withIndex('by_project', q => q.eq('projectId', args.id))
      .collect()

    for (const dataset of datasets) {
      await ctx.db.delete(dataset._id)
    }

    // Delete related vehicles
    const vehicles = await ctx.db
      .query('vehicles')
      .withIndex('by_project', q => q.eq('projectId', args.id))
      .collect()

    for (const vehicle of vehicles) {
      await ctx.db.delete(vehicle._id)
    }

    // Delete related jobs
    const jobs = await ctx.db
      .query('jobs')
      .withIndex('by_project', q => q.eq('projectId', args.id))
      .collect()

    for (const job of jobs) {
      await ctx.db.delete(job._id)
    }

    // Delete related locations
    const locations = await ctx.db
      .query('locations')
      .withIndex('by_project', q => q.eq('projectId', args.id))
      .collect()

    for (const location of locations) {
      await ctx.db.delete(location._id)
    }

    // Delete related products
    const products = await ctx.db
      .query('products')
      .withIndex('by_project', q => q.eq('projectId', args.id))
      .collect()

    for (const product of products) {
      await ctx.db.delete(product._id)
    }

    // Delete related skills (project-specific ones only)
    const skills = await ctx.db
      .query('skills')
      .withIndex('by_project', q => q.eq('projectId', args.id))
      .collect()

    for (const skill of skills) {
      await ctx.db.delete(skill._id)
    }

    // Delete project users
    const projectUsers = await ctx.db
      .query('projectUsers')
      .withIndex('by_project', q => q.eq('projectId', args.id))
      .collect()

    for (const projectUser of projectUsers) {
      await ctx.db.delete(projectUser._id)
    }

    // Finally delete the project itself
    await ctx.db.delete(args.id)

    return args.id
  },
})

// Get project statistics
export const getStats = query({
  args: { id: v.id('projects') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) {
      return null // Return null if not authenticated
    }

    // Validate user ownership
    await validateUserOwnership(ctx, args.id, user._id)

    // Count related entities
    const scenarios = await ctx.db
      .query('scenarios')
      .withIndex('by_project', q => q.eq('projectId', args.id))
      .collect()

    const datasets = await ctx.db
      .query('datasets')
      .withIndex('by_project', q => q.eq('projectId', args.id))
      .collect()

    const vehicles = await ctx.db
      .query('vehicles')
      .withIndex('by_project', q => q.eq('projectId', args.id))
      .collect()

    const jobs = await ctx.db
      .query('jobs')
      .withIndex('by_project', q => q.eq('projectId', args.id))
      .collect()

    const locations = await ctx.db
      .query('locations')
      .withIndex('by_project', q => q.eq('projectId', args.id))
      .collect()

    return {
      scenarioCount: scenarios.length,
      datasetCount: datasets.length,
      vehicleCount: vehicles.length,
      jobCount: jobs.length,
      locationCount: locations.length,
    }
  },
})

// Search projects by name or description
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) {
      return [] // Return empty array if not authenticated
    }

    const projects = await ctx.db
      .query('projects')
      .withIndex('by_owner', q => q.eq('ownerId', user._id))
      .collect()

    const lowercaseQuery = args.query.toLowerCase()

    return projects.filter(
      project =>
        project.name.toLowerCase().includes(lowercaseQuery) ||
        (project.description &&
          project.description.toLowerCase().includes(lowercaseQuery))
    )
  },
})
