import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getCurrentUser, validateUserOwnership } from './auth'
import {
  validateTimeConsistency,
  validateRouteGeometry,
  optimizeRouteGeometry,
} from './optimizerValidation'

// Get all routes for a specific optimization run
export const listByOptimization = query({
  args: { optimizationRunId: v.id('optimizationRuns') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Get optimization run to validate project ownership
    const optimizationRun = await ctx.db.get(args.optimizationRunId)
    if (!optimizationRun) {
      throw new Error('Optimization run not found')
    }

    // Get scenario to validate project ownership
    const scenario = await ctx.db.get(optimizationRun.scenarioId)
    if (!scenario) {
      throw new Error('Scenario not found')
    }

    // Validate user owns the project
    await validateUserOwnership(ctx, scenario.projectId, user._id)

    return await ctx.db
      .query('routes')
      .withIndex('by_optimization_run', q =>
        q.eq('optimizationRunId', args.optimizationRunId)
      )
      .collect()
  },
})

// Get all routes for a specific project
export const listByProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id)

    return await ctx.db
      .query('routes')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))
      .collect()
  },
})

// Get all routes for a specific dataset (via project)
export const listByDataset = query({
  args: { datasetId: v.id('datasets') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Get dataset to validate project ownership
    const dataset = await ctx.db.get(args.datasetId)
    if (!dataset) {
      throw new Error('Dataset not found')
    }

    // Validate user owns the project
    await validateUserOwnership(ctx, dataset.projectId, user._id)

    // For now, return routes by project since routes don't have direct dataset link
    return await ctx.db
      .query('routes')
      .withIndex('by_project', q => q.eq('projectId', dataset.projectId))
      .collect()
  },
})

// Get all routes for a specific vehicle
export const listByVehicle = query({
  args: { vehicleId: v.id('vehicles') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Get vehicle to validate project ownership
    const vehicle = await ctx.db.get(args.vehicleId)
    if (!vehicle) {
      throw new Error('Vehicle not found')
    }

    // Validate user owns the project
    await validateUserOwnership(ctx, vehicle.projectId, user._id)

    return await ctx.db
      .query('routes')
      .withIndex('by_vehicle', q => q.eq('vehicleId', args.vehicleId))
      .collect()
  },
})

// Get a single route by ID
export const getById = query({
  args: { id: v.id('routes') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    const route = await ctx.db.get(args.id)

    if (!route) {
      throw new Error('Route not found')
    }

    // Validate user owns the parent project
    if (route.projectId) {
      await validateUserOwnership(ctx, route.projectId, user._id)
    }

    return route
  },
})

// Store optimization results from VROOM solver
export const storeOptimizationResults = mutation({
  args: {
    optimizationRunId: v.id('optimizationRuns'),
    projectId: v.id('projects'),
    routes: v.array(
      v.object({
        vehicleId: v.optional(v.id('vehicles')),
        cost: v.optional(v.number()),
        distance: v.optional(v.number()),
        duration: v.optional(v.number()),
        waitingTime: v.optional(v.number()),
        serviceTime: v.optional(v.number()),
        setupTime: v.optional(v.number()),
        deliveries: v.optional(v.array(v.number())),
        pickups: v.optional(v.array(v.number())),
        priority: v.optional(v.number()),
        deliveryCount: v.optional(v.number()),
        violations: v.optional(
          v.array(
            v.object({
              type: v.string(),
              cause: v.string(),
              location: v.optional(v.string()),
              severity: v.optional(v.string()),
            })
          )
        ),
        geometry: v.optional(v.string()),
        geojson: v.optional(v.object({})),
        currencyCode: v.optional(v.string()),
        datasetName: v.optional(v.string()),
        datasetVersion: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    const now = Date.now()

    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id)

    // Get optimization run to validate it exists
    const optimizationRun = await ctx.db.get(args.optimizationRunId)
    if (!optimizationRun) {
      throw new Error('Optimization run not found')
    }

    // Clear existing routes for this optimization run
    const existingRoutes = await ctx.db
      .query('routes')
      .withIndex('by_optimization_run', q =>
        q.eq('optimizationRunId', args.optimizationRunId)
      )
      .collect()

    for (const route of existingRoutes) {
      await ctx.db.delete(route._id)
    }

    // Insert new routes
    const routeIds = []
    for (const routeData of args.routes) {
      // Validate time unit consistency (all times in seconds)
      validateTimeConsistency(routeData, 'route')

      // Validate and optimize route geometry
      if (routeData.geometry) {
        validateRouteGeometry(routeData.geometry)
        routeData.geometry = optimizeRouteGeometry(routeData.geometry)
      }

      const routeId = await ctx.db.insert('routes', {
        optimizationRunId: args.optimizationRunId,
        projectId: args.projectId,
        ...routeData,
        updatedAt: now,
      })
      routeIds.push(routeId)
    }

    return {
      storedCount: routeIds.length,
      routeIds,
    }
  },
})

// Update an existing route
export const update = mutation({
  args: {
    id: v.id('routes'),
    vehicleId: v.optional(v.id('vehicles')),
    cost: v.optional(v.number()),
    distance: v.optional(v.number()),
    duration: v.optional(v.number()),
    waitingTime: v.optional(v.number()),
    serviceTime: v.optional(v.number()),
    setupTime: v.optional(v.number()),
    deliveries: v.optional(v.array(v.number())),
    pickups: v.optional(v.array(v.number())),
    priority: v.optional(v.number()),
    deliveryCount: v.optional(v.number()),
    violations: v.optional(
      v.array(
        v.object({
          type: v.string(),
          cause: v.string(),
          location: v.optional(v.string()),
          severity: v.optional(v.string()),
        })
      )
    ),
    geometry: v.optional(v.string()),
    geojson: v.optional(v.object({})),
    currencyCode: v.optional(v.string()),
    datasetName: v.optional(v.string()),
    datasetVersion: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    const { id, ...updateData } = args

    const route = await ctx.db.get(id)
    if (!route) {
      throw new Error('Route not found')
    }

    // Validate user owns the parent project
    if (route.projectId) {
      await validateUserOwnership(ctx, route.projectId, user._id)
    }

    // If vehicle is being updated, validate it belongs to the project
    if (args.vehicleId && route.projectId) {
      const vehicle = await ctx.db.get(args.vehicleId)
      if (!vehicle || vehicle.projectId !== route.projectId) {
        throw new Error("Vehicle does not belong to the route's project")
      }
    }

    // Remove undefined values
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    )

    // Validate time unit consistency (all times in seconds)
    if (Object.keys(cleanUpdateData).length > 0) {
      validateTimeConsistency(cleanUpdateData, 'route')
    }

    // Validate and optimize route geometry if being updated
    if (
      cleanUpdateData.geometry &&
      typeof cleanUpdateData.geometry === 'string'
    ) {
      validateRouteGeometry(cleanUpdateData.geometry)
      const optimizedGeometry = optimizeRouteGeometry(cleanUpdateData.geometry)
      if (optimizedGeometry !== undefined) {
        cleanUpdateData.geometry = optimizedGeometry
      }
    }

    await ctx.db.patch(id, {
      ...cleanUpdateData,
      updatedAt: Date.now(),
    })

    return id
  },
})

// Delete a route
export const remove = mutation({
  args: { id: v.id('routes') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    const route = await ctx.db.get(args.id)
    if (!route) {
      throw new Error('Route not found')
    }

    // Validate user owns the parent project
    if (route.projectId) {
      await validateUserOwnership(ctx, route.projectId, user._id)
    }

    // Delete the route
    await ctx.db.delete(args.id)

    return args.id
  },
})

// Get route statistics for an optimization run
export const getStatsByOptimization = query({
  args: { optimizationRunId: v.id('optimizationRuns') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Get optimization run to validate project ownership
    const optimizationRun = await ctx.db.get(args.optimizationRunId)
    if (!optimizationRun) {
      throw new Error('Optimization run not found')
    }

    // Get scenario to validate project ownership
    const scenario = await ctx.db.get(optimizationRun.scenarioId)
    if (!scenario) {
      throw new Error('Scenario not found')
    }

    // Validate user owns the project
    await validateUserOwnership(ctx, scenario.projectId, user._id)

    const routes = await ctx.db
      .query('routes')
      .withIndex('by_optimization_run', q =>
        q.eq('optimizationRunId', args.optimizationRunId)
      )
      .collect()

    const stats = {
      totalRoutes: routes.length,
      totalCost: routes.reduce((sum, r) => sum + (r.cost || 0), 0),
      totalDistance: routes.reduce((sum, r) => sum + (r.distance || 0), 0),
      totalDuration: routes.reduce((sum, r) => sum + (r.duration || 0), 0),
      totalWaitingTime: routes.reduce(
        (sum, r) => sum + (r.waitingTime || 0),
        0
      ),
      totalServiceTime: routes.reduce(
        (sum, r) => sum + (r.serviceTime || 0),
        0
      ),
      totalSetupTime: routes.reduce((sum, r) => sum + (r.setupTime || 0), 0),
      totalDeliveries: routes.reduce(
        (sum, r) => sum + (r.deliveryCount || 0),
        0
      ),
      routesWithViolations: routes.filter(
        r => r.violations && r.violations.length > 0
      ).length,
      averageCostPerRoute:
        routes.length > 0
          ? routes.reduce((sum, r) => sum + (r.cost || 0), 0) / routes.length
          : 0,
      averageDistancePerRoute:
        routes.length > 0
          ? routes.reduce((sum, r) => sum + (r.distance || 0), 0) /
            routes.length
          : 0,
    }

    return stats
  },
})

// Bulk optimize route geometries for an optimization run
export const optimizeRouteGeometries = mutation({
  args: { optimizationRunId: v.id('optimizationRuns') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Get optimization run to validate project ownership
    const optimizationRun = await ctx.db.get(args.optimizationRunId)
    if (!optimizationRun) {
      throw new Error('Optimization run not found')
    }

    // Get scenario to validate project ownership
    const scenario = await ctx.db.get(optimizationRun.scenarioId)
    if (!scenario) {
      throw new Error('Scenario not found')
    }

    // Validate user owns the project
    await validateUserOwnership(ctx, scenario.projectId, user._id)

    const routes = await ctx.db
      .query('routes')
      .withIndex('by_optimization_run', q =>
        q.eq('optimizationRunId', args.optimizationRunId)
      )
      .collect()

    let optimizedCount = 0
    let errorCount = 0

    for (const route of routes) {
      try {
        if (route.geometry) {
          validateRouteGeometry(route.geometry)
          const optimizedGeometry = optimizeRouteGeometry(route.geometry)

          if (optimizedGeometry !== route.geometry) {
            await ctx.db.patch(route._id, {
              geometry: optimizedGeometry,
              updatedAt: Date.now(),
            })
            optimizedCount++
          }
        }
      } catch (error) {
        console.error(
          `Failed to optimize geometry for route ${route._id}:`,
          error
        )
        errorCount++
      }
    }

    return {
      totalRoutes: routes.length,
      optimizedCount,
      errorCount,
      skippedCount: routes.length - optimizedCount - errorCount,
    }
  },
})

// Get routes with filtering
export const listWithFilters = query({
  args: {
    projectId: v.id('projects'),
    optimizationRunId: v.optional(v.id('optimizationRuns')),
    vehicleId: v.optional(v.id('vehicles')),
    hasViolations: v.optional(v.boolean()),
    minCost: v.optional(v.number()),
    maxCost: v.optional(v.number()),
    minDistance: v.optional(v.number()),
    maxDistance: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id)

    const query = ctx.db
      .query('routes')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))

    const routes = await query.collect()

    // Apply filters
    let filteredRoutes = routes

    if (args.optimizationRunId) {
      filteredRoutes = filteredRoutes.filter(
        r => r.optimizationRunId === args.optimizationRunId
      )
    }

    if (args.vehicleId) {
      filteredRoutes = filteredRoutes.filter(
        r => r.vehicleId === args.vehicleId
      )
    }

    if (args.hasViolations !== undefined) {
      filteredRoutes = filteredRoutes.filter(r =>
        args.hasViolations
          ? r.violations && r.violations.length > 0
          : !r.violations || r.violations.length === 0
      )
    }

    if (args.minCost !== undefined) {
      filteredRoutes = filteredRoutes.filter(
        r => (r.cost || 0) >= args.minCost!
      )
    }

    if (args.maxCost !== undefined) {
      filteredRoutes = filteredRoutes.filter(
        r => (r.cost || 0) <= args.maxCost!
      )
    }

    if (args.minDistance !== undefined) {
      filteredRoutes = filteredRoutes.filter(
        r => (r.distance || 0) >= args.minDistance!
      )
    }

    if (args.maxDistance !== undefined) {
      filteredRoutes = filteredRoutes.filter(
        r => (r.distance || 0) <= args.maxDistance!
      )
    }

    // Sort by cost (ascending)
    filteredRoutes.sort((a, b) => (a.cost || 0) - (b.cost || 0))

    // Apply limit
    if (args.limit) {
      filteredRoutes = filteredRoutes.slice(0, args.limit)
    }

    return filteredRoutes
  },
})

// Export routes to VROOM format for further optimization
export const exportToVROOM = query({
  args: { optimizationRunId: v.id('optimizationRuns') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Get optimization run to validate project ownership
    const optimizationRun = await ctx.db.get(args.optimizationRunId)
    if (!optimizationRun) {
      throw new Error('Optimization run not found')
    }

    // Get scenario to validate project ownership
    const scenario = await ctx.db.get(optimizationRun.scenarioId)
    if (!scenario) {
      throw new Error('Scenario not found')
    }

    // Validate user owns the project
    await validateUserOwnership(ctx, scenario.projectId, user._id)

    const routes = await ctx.db
      .query('routes')
      .withIndex('by_optimization_run', q =>
        q.eq('optimizationRunId', args.optimizationRunId)
      )
      .collect()

    // Format routes for VROOM export
    const vroomRoutes = routes.map(route => ({
      vehicle: route.vehicleId,
      cost: route.cost,
      distance: route.distance,
      duration: route.duration,
      waiting_time: route.waitingTime,
      service: route.serviceTime,
      setup: route.setupTime,
      delivery: route.deliveries,
      pickup: route.pickups,
      priority: route.priority,
      violations: route.violations,
      geometry: route.geometry,
    }))

    return {
      routes: vroomRoutes,
      summary: {
        total_cost: routes.reduce((sum, r) => sum + (r.cost || 0), 0),
        total_distance: routes.reduce((sum, r) => sum + (r.distance || 0), 0),
        total_duration: routes.reduce((sum, r) => sum + (r.duration || 0), 0),
        total_routes: routes.length,
      },
    }
  },
})

// Calculate route efficiency metrics
export const getEfficiencyMetrics = query({
  args: { optimizationRunId: v.id('optimizationRuns') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Get optimization run to validate project ownership
    const optimizationRun = await ctx.db.get(args.optimizationRunId)
    if (!optimizationRun) {
      throw new Error('Optimization run not found')
    }

    // Get scenario to validate project ownership
    const scenario = await ctx.db.get(optimizationRun.scenarioId)
    if (!scenario) {
      throw new Error('Scenario not found')
    }

    // Validate user owns the project
    await validateUserOwnership(ctx, scenario.projectId, user._id)

    const routes = await ctx.db
      .query('routes')
      .withIndex('by_optimization_run', q =>
        q.eq('optimizationRunId', args.optimizationRunId)
      )
      .collect()

    if (routes.length === 0) {
      return {
        costEfficiency: 0,
        timeUtilization: 0,
        distanceEfficiency: 0,
        loadUtilization: 0,
        routeBalance: 0,
      }
    }

    const totalCost = routes.reduce((sum, r) => sum + (r.cost || 0), 0)
    const totalDuration = routes.reduce((sum, r) => sum + (r.duration || 0), 0)
    const totalServiceTime = routes.reduce(
      (sum, r) => sum + (r.serviceTime || 0),
      0
    )
    const totalWaitingTime = routes.reduce(
      (sum, r) => sum + (r.waitingTime || 0),
      0
    )
    const totalDistance = routes.reduce((sum, r) => sum + (r.distance || 0), 0)

    // Calculate efficiency metrics
    const timeUtilization =
      totalDuration > 0 ? (totalServiceTime / totalDuration) * 100 : 0
    const averageCost = totalCost / routes.length
    const averageDistance = totalDistance / routes.length

    // Cost efficiency (lower cost per distance is better)
    const costEfficiency = totalDistance > 0 ? totalCost / totalDistance : 0

    // Distance efficiency (ratio of service time to total time)
    const distanceEfficiency =
      totalDuration > 0
        ? ((totalDuration - totalWaitingTime) / totalDuration) * 100
        : 0

    // Route balance (how evenly distributed the workload is)
    const costVariance =
      routes.reduce((_, r) => Math.pow((r.cost || 0) - averageCost, 2), 0) /
      routes.length
    const routeBalance =
      costVariance > 0
        ? Math.max(0, 100 - (Math.sqrt(costVariance) / averageCost) * 100)
        : 100

    return {
      costEfficiency: Math.round(costEfficiency * 100) / 100,
      timeUtilization: Math.round(timeUtilization * 100) / 100,
      distanceEfficiency: Math.round(distanceEfficiency * 100) / 100,
      loadUtilization: 0, // Would need vehicle capacity data to calculate
      routeBalance: Math.round(routeBalance * 100) / 100,
      totalCost,
      totalDistance,
      totalDuration,
      averageCostPerRoute: Math.round(averageCost * 100) / 100,
      averageDistancePerRoute: Math.round(averageDistance * 100) / 100,
    }
  },
})
