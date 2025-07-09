import { v } from 'convex/values'
import { mutation, query, action } from './_generated/server'
import { api } from './_generated/api'
import { getCurrentUser, validateUserOwnership } from './auth'

// Get all scenarios for a specific project
export const listByProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id)

    return await ctx.db
      .query('scenarios')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))
      .collect()
  },
})

// Get a single scenario by ID
export const getById = query({
  args: { id: v.id('scenarios') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    const scenario = await ctx.db.get(args.id)

    if (!scenario) {
      throw new Error('Scenario not found')
    }

    // Validate user owns the parent project
    await validateUserOwnership(ctx, scenario.projectId, user._id)

    return scenario
  },
})

// Create a new scenario
export const create = mutation({
  args: {
    projectId: v.id('projects'),
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    planningHorizonDays: v.optional(v.number()),
    optimizationObjective: v.optional(v.string()),
    optimizationParameters: v.optional(v.object({})),
    status: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    const now = Date.now()

    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id)

    const scenarioId = await ctx.db.insert('scenarios', {
      ...args,
      updatedAt: now,
      optimizationCount: 0,
    })

    return scenarioId
  },
})

// Update an existing scenario
export const update = mutation({
  args: {
    id: v.id('scenarios'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    planningHorizonDays: v.optional(v.number()),
    optimizationObjective: v.optional(v.string()),
    optimizationParameters: v.optional(v.object({})),
    status: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    const { id, ...updateData } = args

    const scenario = await ctx.db.get(id)
    if (!scenario) {
      throw new Error('Scenario not found')
    }

    // Validate user owns the parent project
    await validateUserOwnership(ctx, scenario.projectId, user._id)

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

// Delete a scenario (also deletes all related data)
export const remove = mutation({
  args: { id: v.id('scenarios') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    const scenario = await ctx.db.get(args.id)
    if (!scenario) {
      throw new Error('Scenario not found')
    }

    // Validate user owns the parent project
    await validateUserOwnership(ctx, scenario.projectId, user._id)

    // Delete related datasets
    const datasets = await ctx.db
      .query('datasets')
      .withIndex('by_scenario', q => q.eq('scenarioId', args.id))
      .collect()

    for (const dataset of datasets) {
      await ctx.db.delete(dataset._id)
    }

    // Delete related optimization runs
    const optimizationRuns = await ctx.db
      .query('optimizationRuns')
      .withIndex('by_scenario', q => q.eq('scenarioId', args.id))
      .collect()

    for (const run of optimizationRuns) {
      await ctx.db.delete(run._id)
    }

    // Delete vehicles assigned to this scenario
    const vehicles = await ctx.db
      .query('vehicles')
      .withIndex('by_scenario', q => q.eq('scenarioId', args.id))
      .collect()

    for (const vehicle of vehicles) {
      await ctx.db.delete(vehicle._id)
    }

    // Delete jobs assigned to this scenario
    const jobs = await ctx.db
      .query('jobs')
      .withIndex('by_scenario', q => q.eq('scenarioId', args.id))
      .collect()

    for (const job of jobs) {
      await ctx.db.delete(job._id)
    }

    // Delete locations assigned to this scenario
    const locations = await ctx.db
      .query('locations')
      .withIndex('by_scenario', q => q.eq('scenarioId', args.id))
      .collect()

    for (const location of locations) {
      await ctx.db.delete(location._id)
    }

    // Finally delete the scenario itself
    await ctx.db.delete(args.id)

    return args.id
  },
})

// Get scenario statistics
export const getStats = query({
  args: { id: v.id('scenarios') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    const scenario = await ctx.db.get(args.id)
    if (!scenario) {
      throw new Error('Scenario not found')
    }

    // Validate user owns the parent project
    await validateUserOwnership(ctx, scenario.projectId, user._id)

    // Count related entities
    const datasets = await ctx.db
      .query('datasets')
      .withIndex('by_scenario', q => q.eq('scenarioId', args.id))
      .collect()

    const optimizationRuns = await ctx.db
      .query('optimizationRuns')
      .withIndex('by_scenario', q => q.eq('scenarioId', args.id))
      .collect()

    const vehicles = await ctx.db
      .query('vehicles')
      .withIndex('by_scenario', q => q.eq('scenarioId', args.id))
      .collect()

    const jobs = await ctx.db
      .query('jobs')
      .withIndex('by_scenario', q => q.eq('scenarioId', args.id))
      .collect()

    const locations = await ctx.db
      .query('locations')
      .withIndex('by_scenario', q => q.eq('scenarioId', args.id))
      .collect()

    return {
      datasetCount: datasets.length,
      optimizationRunCount: optimizationRuns.length,
      vehicleCount: vehicles.length,
      jobCount: jobs.length,
      locationCount: locations.length,
      lastOptimizedAt: scenario.lastOptimizedAt,
      optimizationCount: scenario.optimizationCount || 0,
    }
  },
})

// Update optimization statistics
export const updateOptimizationStats = mutation({
  args: {
    id: v.id('scenarios'),
    incrementCount: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    const scenario = await ctx.db.get(args.id)
    if (!scenario) {
      throw new Error('Scenario not found')
    }

    // Validate user owns the parent project
    await validateUserOwnership(ctx, scenario.projectId, user._id)

    const now = Date.now()
    const updates: any = {
      lastOptimizedAt: now,
      updatedAt: now,
    }

    if (args.incrementCount) {
      updates.optimizationCount = (scenario.optimizationCount || 0) + 1
    }

    await ctx.db.patch(args.id, updates)

    return args.id
  },
})

// Clone a scenario
export const clone = mutation({
  args: {
    id: v.id('scenarios'),
    newName: v.string(),
    projectId: v.optional(v.id('projects')),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    const originalScenario = await ctx.db.get(args.id)
    if (!originalScenario) {
      throw new Error('Scenario not found')
    }

    // Validate user owns the original scenario's project
    await validateUserOwnership(ctx, originalScenario.projectId, user._id)

    const targetProjectId = args.projectId || originalScenario.projectId

    // If different project, validate user owns the target project too
    if (targetProjectId !== originalScenario.projectId) {
      await validateUserOwnership(ctx, targetProjectId, user._id)
    }

    const now = Date.now()

    // Create the cloned scenario
    const clonedScenarioId = await ctx.db.insert('scenarios', {
      projectId: targetProjectId,
      name: args.newName,
      description: originalScenario.description,
      startDate: originalScenario.startDate,
      endDate: originalScenario.endDate,
      planningHorizonDays: originalScenario.planningHorizonDays,
      optimizationObjective: originalScenario.optimizationObjective,
      optimizationParameters: originalScenario.optimizationParameters,
      status: 'draft',
      tags: originalScenario.tags,
      isActive: false,
      updatedAt: now,
      optimizationCount: 0,
    })

    return clonedScenarioId
  },
})

// =============================================================================
// OPTIMIZATION RUNS - CRUD OPERATIONS
// =============================================================================

// List optimization runs for a scenario
export const listOptimizationRuns = query({
  args: { scenarioId: v.id('scenarios') },
  handler: async (ctx, { scenarioId }) => {
    const user = await getCurrentUser(ctx)

    // Get scenario to validate project ownership
    const scenario = await ctx.db.get(scenarioId)
    if (!scenario) {
      throw new Error('Scenario not found')
    }

    // Validate user owns the project
    await validateUserOwnership(ctx, scenario.projectId, user._id)

    return await ctx.db
      .query('optimizationRuns')
      .withIndex('by_scenario', q => q.eq('scenarioId', scenarioId))
      .order('desc')
      .collect()
  },
})

// Get optimization run by ID
export const getOptimizationRun = query({
  args: { id: v.id('optimizationRuns') },
  handler: async (ctx, { id }) => {
    const user = await getCurrentUser(ctx)
    const run = await ctx.db.get(id)

    if (!run) {
      throw new Error('Optimization run not found')
    }

    // Get scenario to validate project ownership
    const scenario = await ctx.db.get(run.scenarioId)
    if (!scenario) {
      throw new Error('Scenario not found')
    }

    // Validate user owns the project
    await validateUserOwnership(ctx, scenario.projectId, user._id)

    return run
  },
})

// Get latest optimization run for a scenario
export const getLatestOptimizationRun = query({
  args: { scenarioId: v.id('scenarios') },
  handler: async (ctx, { scenarioId }) => {
    const user = await getCurrentUser(ctx)

    // Get scenario to validate project ownership
    const scenario = await ctx.db.get(scenarioId)
    if (!scenario) {
      throw new Error('Scenario not found')
    }

    // Validate user owns the project
    await validateUserOwnership(ctx, scenario.projectId, user._id)

    return await ctx.db
      .query('optimizationRuns')
      .withIndex('by_scenario', q => q.eq('scenarioId', scenarioId))
      .order('desc')
      .first()
  },
})

// Create optimization run
export const createOptimizationRun = mutation({
  args: {
    scenarioId: v.id('scenarios'),
    datasetId: v.optional(v.id('datasets')),
    algorithm: v.string(),
    optimizationEngine: v.string(),
    settings: v.object({}),
    optimizationParameters: v.object({}),
    currencyCode: v.string(),
    datasetName: v.optional(v.string()),
    datasetVersion: v.optional(v.number()),
    optimizationRunSettingsId: v.optional(v.id('optimizationRunSettings')),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Get scenario to validate project ownership and get projectId
    const scenario = await ctx.db.get(args.scenarioId)
    if (!scenario) {
      throw new Error('Scenario not found')
    }

    // Validate user owns the project
    await validateUserOwnership(ctx, scenario.projectId, user._id)

    const now = Date.now()

    return await ctx.db.insert('optimizationRuns', {
      ...args,
      projectId: scenario.projectId,
      timestamp: now,
      durationMs: 0,
      status: 'running',
    })
  },
})

// Update optimization run status
export const updateOptimizationRunStatus = mutation({
  args: {
    id: v.id('optimizationRuns'),
    status: v.string(),
    errorMessage: v.optional(v.string()),
    durationMs: v.optional(v.number()),
  },
  handler: async (ctx, { id, status, errorMessage, durationMs }) => {
    const user = await getCurrentUser(ctx)
    const run = await ctx.db.get(id)

    if (!run) {
      throw new Error('Optimization run not found')
    }

    // Get scenario to validate project ownership
    const scenario = await ctx.db.get(run.scenarioId)
    if (!scenario) {
      throw new Error('Scenario not found')
    }

    // Validate user owns the project
    await validateUserOwnership(ctx, scenario.projectId, user._id)

    const updates: any = {
      status,
    }

    if (errorMessage !== undefined) {
      updates.errorMessage = errorMessage
    }

    if (durationMs !== undefined) {
      updates.durationMs = durationMs
    }

    return await ctx.db.patch(id, updates)
  },
})

// Update optimization run results
export const updateOptimizationRunResults = mutation({
  args: {
    id: v.id('optimizationRuns'),
    totalCost: v.optional(v.number()),
    totalRoutes: v.optional(v.number()),
    totalUnassigned: v.optional(v.number()),
    totalDistance: v.optional(v.number()),
    totalDuration: v.optional(v.number()),
    totalWaitingTime: v.optional(v.number()),
    totalServiceTime: v.optional(v.number()),
    totalSetupTime: v.optional(v.number()),
    totalVehicles: v.optional(v.number()),
    totalJobs: v.optional(v.number()),
    totalShipments: v.optional(v.number()),
    computingTime: v.optional(v.number()),
    rawRequest: v.optional(v.object({})),
    rawResponse: v.optional(v.object({})),
  },
  handler: async (ctx, { id, ...results }) => {
    const user = await getCurrentUser(ctx)
    const run = await ctx.db.get(id)

    if (!run) {
      throw new Error('Optimization run not found')
    }

    // Get scenario to validate project ownership
    const scenario = await ctx.db.get(run.scenarioId)
    if (!scenario) {
      throw new Error('Scenario not found')
    }

    // Validate user owns the project
    await validateUserOwnership(ctx, scenario.projectId, user._id)

    return await ctx.db.patch(id, {
      ...results,
    })
  },
})

// =============================================================================
// VROOM OPTIMIZATION ACTION
// =============================================================================

// Run VROOM optimization via FastAPI
export const runVROOMOptimization = action({
  args: {
    scenarioId: v.id('scenarios'),
    datasetId: v.id('datasets'),
    optimizationSettings: v.optional(
      v.object({
        algorithm: v.optional(v.string()),
        maxIterations: v.optional(v.number()),
        timeLimit: v.optional(v.number()),
        threads: v.optional(v.number()),
      })
    ),
  },
  handler: async (
    ctx,
    { scenarioId, datasetId, optimizationSettings = {} }
  ) => {
    const startTime = Date.now()

    try {
      // Get scenario and validate ownership via query
      const scenario = await ctx.runQuery(api.scenarios.getById, {
        id: scenarioId,
      })
      if (!scenario) {
        throw new Error('Scenario not found')
      }

      // Get dataset and validate it belongs to the scenario
      const dataset = await ctx.runQuery(api.datasets.getById, {
        id: datasetId,
      })
      if (!dataset) {
        throw new Error('Dataset not found')
      }

      if (
        dataset.scenarioId !== scenarioId &&
        dataset.projectId !== scenario.projectId
      ) {
        throw new Error('Dataset does not belong to this scenario or project')
      }

      // Get VRP data for optimization
      const vehicles = await ctx.runQuery(api.vehicles.listByDataset, {
        datasetId,
      })
      const jobs = await ctx.runQuery(api.jobs.listByDataset, { datasetId })
      const shipments: any[] = [] // Shipments not implemented yet

      if (!vehicles || vehicles.length === 0) {
        throw new Error('No vehicles found in dataset')
      }

      if (!jobs || jobs.length === 0) {
        throw new Error('No jobs found in dataset')
      }

      // Create optimization run record
      const optimizationRunId = await ctx.runMutation(
        api.scenarios.createOptimizationRun,
        {
          scenarioId,
          datasetId,
          algorithm: optimizationSettings.algorithm || 'vroom',
          optimizationEngine: 'vroom',
          settings: optimizationSettings,
          optimizationParameters: optimizationSettings,
          currencyCode: 'USD',
          datasetName: dataset.name,
          datasetVersion: dataset.version,
        }
      )

      // Convert data to VROOM format using existing validation utilities
      const vroomVehicles = vehicles
        .filter((v: any) => v.optimizerId)
        .map((vehicle: any) => ({
          id: vehicle.optimizerId,
          start:
            vehicle.startLon && vehicle.startLat
              ? [vehicle.startLon, vehicle.startLat]
              : [0, 0],
          end:
            vehicle.endLon && vehicle.endLat
              ? [vehicle.endLon, vehicle.endLat]
              : undefined,
          capacity: vehicle.capacity || [1000, 1000, 1000],
          skills: vehicle.skills || [],
          time_window: vehicle.timeWindow || [0, 86400],
          costs: {
            fixed: vehicle.costFixed || 0,
            per_hour: vehicle.costPerHour || 3600,
            per_km: vehicle.costPerKm || 100,
          },
          max_distance: vehicle.maxDistance,
          max_travel_time: vehicle.maxTravelTime,
          profile: vehicle.profile || 'car',
        }))

      const vroomJobs = jobs
        .filter((j: any) => j.optimizerId)
        .map((job: any) => ({
          id: job.optimizerId,
          location:
            job.locationLon && job.locationLat
              ? [job.locationLon, job.locationLat]
              : [0, 0],
          setup: job.setup || 0,
          service: job.service || 300,
          delivery: job.delivery || [0, 0, 0],
          pickup: job.pickup || [0, 0, 0],
          skills: job.skills || [],
          priority: job.priority || 100,
          time_windows: job.timeWindows || [],
        }))

      // Prepare VROOM request
      const vroomRequest = {
        vehicles: vroomVehicles,
        jobs: vroomJobs,
        shipments: shipments || [],
        options: {
          g: true,
          threads: optimizationSettings.threads || 4,
          useMatrix: false,
          ...optimizationSettings,
        },
        // Enhanced context for FastAPI
        scenarioId,
        datasetId,
        datasetName: dataset.name,
        datasetVersion: dataset.version,
        projectId: scenario.projectId,
      }

      console.log(
        `Starting VROOM optimization: ${vroomVehicles.length} vehicles, ${vroomJobs.length} jobs`
      )

      // Call FastAPI optimization endpoint
      const fastApiUrl = process.env.FASTAPI_URL || 'http://34.78.147.27:8000'
      const response = await fetch(`${fastApiUrl}/api/v1/optimization/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vroomRequest),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`FastAPI error ${response.status}: ${errorText}`)
      }

      const vroomResult = await response.json()
      const endTime = Date.now()
      const durationMs = endTime - startTime

      // Check VROOM response code
      if (vroomResult.code !== 0) {
        await ctx.runMutation(api.scenarios.updateOptimizationRunStatus, {
          id: optimizationRunId,
          status: 'error',
          errorMessage: vroomResult.error || 'VROOM optimization failed',
          durationMs,
        })
        throw new Error(`VROOM error: ${vroomResult.error || 'Unknown error'}`)
      }

      // Extract results from VROOM response
      const summary = vroomResult.summary || {}
      const routes = vroomResult.routes || []

      // Update optimization run with results
      await ctx.runMutation(api.scenarios.updateOptimizationRunResults, {
        id: optimizationRunId,
        totalCost: summary.cost || 0,
        totalRoutes: routes.length,
        totalUnassigned: (vroomResult.unassigned || []).length,
        totalDistance: summary.distance || 0,
        totalDuration: summary.duration || 0,
        totalWaitingTime: summary.waiting_time || 0,
        totalServiceTime: summary.service || 0,
        totalSetupTime: summary.setup || 0,
        totalVehicles: vroomVehicles.length,
        totalJobs: vroomJobs.length,
        totalShipments: (shipments || []).length,
        computingTime: summary.computing_times?.total || durationMs,
        rawRequest: vroomRequest,
        rawResponse: vroomResult,
      })

      // Store route results
      if (routes.length > 0) {
        const routeData = routes.map(route => ({
          vehicleId: vehicles.find(v => v.optimizerId === route.vehicle)?._id,
          cost: route.cost || 0,
          distance: route.distance || 0,
          duration: route.duration || 0,
          waitingTime: route.waiting_time || 0,
          serviceTime: route.service || 0,
          setupTime: route.setup || 0,
          deliveries: route.delivery || [],
          pickups: route.pickup || [],
          priority: route.priority || 0,
          violations: route.violations || [],
          geometry: route.geometry,
          geojson: route.geojson,
          currencyCode: 'USD',
          datasetName: dataset.name,
          datasetVersion: dataset.version,
        }))

        await ctx.runMutation(api.routes.storeOptimizationResults, {
          optimizationRunId,
          projectId: scenario.projectId,
          routes: routeData,
        })
      }

      // Update optimization run status to completed
      await ctx.runMutation(api.scenarios.updateOptimizationRunStatus, {
        id: optimizationRunId,
        status: 'completed',
        durationMs,
      })

      // Update scenario optimization statistics
      await ctx.runMutation(api.scenarios.updateOptimizationStats, {
        id: scenarioId,
        incrementCount: true,
      })

      console.log(
        `VROOM optimization completed: ${routes.length} routes, ${durationMs}ms`
      )

      return {
        optimizationRunId,
        success: true,
        routes: routes.length,
        unassigned: (vroomResult.unassigned || []).length,
        totalCost: summary.cost || 0,
        totalDistance: summary.distance || 0,
        totalDuration: summary.duration || 0,
        computingTime: summary.computing_times?.total || durationMs,
        durationMs,
      }
    } catch (error) {
      const durationMs = Date.now() - startTime
      console.error('VROOM optimization failed:', error)

      // Update optimization run status to error if run was created
      try {
        // Try to find the run by scenario and timestamp to update status
        const recentRuns = await ctx.runQuery(
          api.scenarios.listOptimizationRuns,
          { scenarioId }
        )
        const recentRun = recentRuns.find(
          r =>
            r.status === 'running' && Math.abs(r.timestamp - startTime) < 5000 // Within 5 seconds
        )

        if (recentRun) {
          await ctx.runMutation(api.scenarios.updateOptimizationRunStatus, {
            id: recentRun._id,
            status: 'error',
            errorMessage:
              error instanceof Error ? error.message : String(error),
            durationMs,
          })
        }
      } catch (updateError) {
        console.error('Failed to update optimization run status:', updateError)
      }

      throw new Error(
        `Optimization failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  },
})
