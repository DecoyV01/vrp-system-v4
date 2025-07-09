import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getCurrentUser, validateUserOwnership } from './auth'
import {
  validateCapacity,
  validateTimeConsistency,
} from './optimizerValidation'

// Get all shipments for a specific dataset
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

    return await ctx.db
      .query('shipments')
      .withIndex('by_dataset', q => q.eq('datasetId', args.datasetId))
      .collect()
  },
})

// Get all shipments for a specific project
export const listByProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id)

    return await ctx.db
      .query('shipments')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))
      .collect()
  },
})

// Get all shipments for a specific scenario
export const listByScenario = query({
  args: { scenarioId: v.id('scenarios') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Get scenario to validate project ownership
    const scenario = await ctx.db.get(args.scenarioId)
    if (!scenario) {
      throw new Error('Scenario not found')
    }

    // Validate user owns the project
    await validateUserOwnership(ctx, scenario.projectId, user._id)

    return await ctx.db
      .query('shipments')
      .withIndex('by_scenario', q => q.eq('scenarioId', args.scenarioId))
      .collect()
  },
})

// Get a single shipment by ID
export const getById = query({
  args: { id: v.id('shipments') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    const shipment = await ctx.db.get(args.id)

    if (!shipment) {
      throw new Error('Shipment not found')
    }

    // Validate user owns the parent project
    await validateUserOwnership(ctx, shipment.projectId, user._id)

    return shipment
  },
})

// Create a new shipment
export const create = mutation({
  args: {
    projectId: v.id('projects'),
    scenarioId: v.optional(v.id('scenarios')),
    datasetId: v.optional(v.id('datasets')),
    description: v.optional(v.string()),

    // Pickup location
    pickupLon: v.optional(v.number()),
    pickupLat: v.optional(v.number()),
    pickupLocationId: v.optional(v.id('locations')),

    // Delivery location
    deliveryLon: v.optional(v.number()),
    deliveryLat: v.optional(v.number()),
    deliveryLocationId: v.optional(v.id('locations')),

    // Capacity and constraints
    amount: v.optional(v.array(v.number())),
    skills: v.optional(v.array(v.number())),
    priority: v.optional(v.number()),

    // Pickup timing
    pickupSetup: v.optional(v.number()),
    pickupService: v.optional(v.number()),
    pickupTimeWindows: v.optional(v.array(v.array(v.number()))),

    // Delivery timing
    deliverySetup: v.optional(v.number()),
    deliveryService: v.optional(v.number()),
    deliveryTimeWindows: v.optional(v.array(v.array(v.number()))),

    // Metadata
    datasetName: v.optional(v.string()),
    datasetVersion: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    const now = Date.now()

    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id)

    // If scenario is provided, validate it belongs to the project
    if (args.scenarioId) {
      const scenario = await ctx.db.get(args.scenarioId)
      if (!scenario || scenario.projectId !== args.projectId) {
        throw new Error('Scenario does not belong to the specified project')
      }
    }

    // If dataset is provided, validate it belongs to the project
    if (args.datasetId) {
      const dataset = await ctx.db.get(args.datasetId)
      if (!dataset || dataset.projectId !== args.projectId) {
        throw new Error('Dataset does not belong to the specified project')
      }
    }

    // If pickup location is provided, validate it belongs to the project
    if (args.pickupLocationId) {
      const location = await ctx.db.get(args.pickupLocationId)
      if (!location || location.projectId !== args.projectId) {
        throw new Error(
          'Pickup location does not belong to the specified project'
        )
      }
    }

    // If delivery location is provided, validate it belongs to the project
    if (args.deliveryLocationId) {
      const location = await ctx.db.get(args.deliveryLocationId)
      if (!location || location.projectId !== args.projectId) {
        throw new Error(
          'Delivery location does not belong to the specified project'
        )
      }
    }

    // Validate amount array (must be exactly 3 elements for VROOM compatibility)
    if (args.amount !== undefined) {
      validateCapacity(args.amount, 'amount')
    }

    // Validate priority range (0-100 for VROOM compatibility)
    if (
      args.priority !== undefined &&
      (args.priority < 0 || args.priority > 100)
    ) {
      throw new Error('Priority must be between 0 and 100')
    }

    // Validate time unit consistency (all times in seconds)
    validateTimeConsistency(args, 'shipment')

    const shipmentId = await ctx.db.insert('shipments', {
      ...args,
      optimizerId: Math.floor(Math.random() * 1000000), // Generate unique optimizer ID
      updatedAt: now,
    })

    return shipmentId
  },
})

// Update an existing shipment
export const update = mutation({
  args: {
    id: v.id('shipments'),
    description: v.optional(v.string()),

    // Pickup location
    pickupLon: v.optional(v.number()),
    pickupLat: v.optional(v.number()),
    pickupLocationId: v.optional(v.id('locations')),

    // Delivery location
    deliveryLon: v.optional(v.number()),
    deliveryLat: v.optional(v.number()),
    deliveryLocationId: v.optional(v.id('locations')),

    // Capacity and constraints
    amount: v.optional(v.array(v.number())),
    skills: v.optional(v.array(v.number())),
    priority: v.optional(v.number()),

    // Pickup timing
    pickupSetup: v.optional(v.number()),
    pickupService: v.optional(v.number()),
    pickupTimeWindows: v.optional(v.array(v.array(v.number()))),

    // Delivery timing
    deliverySetup: v.optional(v.number()),
    deliveryService: v.optional(v.number()),
    deliveryTimeWindows: v.optional(v.array(v.array(v.number()))),

    // Metadata
    datasetName: v.optional(v.string()),
    datasetVersion: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    const { id, ...updateData } = args

    const shipment = await ctx.db.get(id)
    if (!shipment) {
      throw new Error('Shipment not found')
    }

    // Validate user owns the parent project
    await validateUserOwnership(ctx, shipment.projectId, user._id)

    // If pickup location is being updated, validate it belongs to the project
    if (args.pickupLocationId) {
      const location = await ctx.db.get(args.pickupLocationId)
      if (!location || location.projectId !== shipment.projectId) {
        throw new Error(
          "Pickup location does not belong to the shipment's project"
        )
      }
    }

    // If delivery location is being updated, validate it belongs to the project
    if (args.deliveryLocationId) {
      const location = await ctx.db.get(args.deliveryLocationId)
      if (!location || location.projectId !== shipment.projectId) {
        throw new Error(
          "Delivery location does not belong to the shipment's project"
        )
      }
    }

    // Remove undefined values and validate arrays
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    )

    // Validate amount array (must be exactly 3 elements for VROOM compatibility)
    if (cleanUpdateData.amount !== undefined) {
      validateCapacity(cleanUpdateData.amount, 'amount')
    }

    // Validate priority range (0-100 for VROOM compatibility)
    if (
      cleanUpdateData.priority !== undefined &&
      (cleanUpdateData.priority < 0 || cleanUpdateData.priority > 100)
    ) {
      throw new Error('Priority must be between 0 and 100')
    }

    // Validate time unit consistency (all times in seconds)
    validateTimeConsistency(cleanUpdateData, 'shipment')

    await ctx.db.patch(id, {
      ...cleanUpdateData,
      updatedAt: Date.now(),
    })

    return id
  },
})

// Delete a shipment
export const remove = mutation({
  args: { id: v.id('shipments') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    const shipment = await ctx.db.get(args.id)
    if (!shipment) {
      throw new Error('Shipment not found')
    }

    // Validate user owns the parent project
    await validateUserOwnership(ctx, shipment.projectId, user._id)

    // Delete the shipment
    await ctx.db.delete(args.id)

    return args.id
  },
})

// Bulk import shipments from CSV-like data
export const bulkImport = mutation({
  args: {
    projectId: v.id('projects'),
    datasetId: v.optional(v.id('datasets')),
    scenarioId: v.optional(v.id('scenarios')),
    shipments: v.array(
      v.object({
        description: v.optional(v.string()),

        // Pickup location
        pickupLon: v.optional(v.number()),
        pickupLat: v.optional(v.number()),
        pickupLocationId: v.optional(v.id('locations')),

        // Delivery location
        deliveryLon: v.optional(v.number()),
        deliveryLat: v.optional(v.number()),
        deliveryLocationId: v.optional(v.id('locations')),

        // Capacity and constraints
        amount: v.optional(v.array(v.number())),
        skills: v.optional(v.array(v.number())),
        priority: v.optional(v.number()),

        // Pickup timing
        pickupSetup: v.optional(v.number()),
        pickupService: v.optional(v.number()),
        pickupTimeWindows: v.optional(
          v.array(
            v.object({
              start: v.number(),
              end: v.number(),
            })
          )
        ),

        // Delivery timing
        deliverySetup: v.optional(v.number()),
        deliveryService: v.optional(v.number()),
        deliveryTimeWindows: v.optional(
          v.array(
            v.object({
              start: v.number(),
              end: v.number(),
            })
          )
        ),
      })
    ),
    clearExisting: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    const now = Date.now()

    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id)

    // If dataset is provided, validate it belongs to the project
    if (args.datasetId) {
      const dataset = await ctx.db.get(args.datasetId)
      if (!dataset || dataset.projectId !== args.projectId) {
        throw new Error('Dataset does not belong to the specified project')
      }
    }

    // Clear existing shipments if requested
    if (args.clearExisting && args.datasetId) {
      const existingShipments = await ctx.db
        .query('shipments')
        .withIndex('by_dataset', q => q.eq('datasetId', args.datasetId))
        .collect()

      for (const shipment of existingShipments) {
        await ctx.db.delete(shipment._id)
      }
    }

    // Insert new shipments
    const shipmentIds = []
    for (const shipmentData of args.shipments) {
      // Validate amount array (must be exactly 3 elements for VROOM compatibility)
      if (shipmentData.amount !== undefined) {
        validateCapacity(shipmentData.amount, 'amount')
      }

      // Validate priority range (0-100 for VROOM compatibility)
      if (
        shipmentData.priority !== undefined &&
        (shipmentData.priority < 0 || shipmentData.priority > 100)
      ) {
        throw new Error('Priority must be between 0 and 100')
      }

      // Validate time unit consistency (all times in seconds)
      validateTimeConsistency(shipmentData, 'shipment')

      const shipmentId = await ctx.db.insert('shipments', {
        projectId: args.projectId,
        scenarioId: args.scenarioId,
        datasetId: args.datasetId,
        ...shipmentData,
        optimizerId: Math.floor(Math.random() * 1000000), // Generate unique optimizer ID
        updatedAt: now,
      })
      shipmentIds.push(shipmentId)
    }

    return {
      importedCount: shipmentIds.length,
      shipmentIds,
    }
  },
})

// Get shipments with filtering and pagination
export const listWithFilters = query({
  args: {
    projectId: v.id('projects'),
    datasetId: v.optional(v.id('datasets')),
    scenarioId: v.optional(v.id('scenarios')),
    priority: v.optional(v.number()),
    hasPickupTimeWindows: v.optional(v.boolean()),
    hasDeliveryTimeWindows: v.optional(v.boolean()),
    hasAmount: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id)

    const query = ctx.db
      .query('shipments')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))

    const shipments = await query.collect()

    // Apply filters
    let filteredShipments = shipments

    if (args.datasetId) {
      filteredShipments = filteredShipments.filter(
        s => s.datasetId === args.datasetId
      )
    }

    if (args.scenarioId) {
      filteredShipments = filteredShipments.filter(
        s => s.scenarioId === args.scenarioId
      )
    }

    if (args.priority !== undefined) {
      filteredShipments = filteredShipments.filter(
        s => s.priority === args.priority
      )
    }

    if (args.hasPickupTimeWindows !== undefined) {
      filteredShipments = filteredShipments.filter(s =>
        args.hasPickupTimeWindows
          ? s.pickupTimeWindows && s.pickupTimeWindows.length > 0
          : !s.pickupTimeWindows || s.pickupTimeWindows.length === 0
      )
    }

    if (args.hasDeliveryTimeWindows !== undefined) {
      filteredShipments = filteredShipments.filter(s =>
        args.hasDeliveryTimeWindows
          ? s.deliveryTimeWindows && s.deliveryTimeWindows.length > 0
          : !s.deliveryTimeWindows || s.deliveryTimeWindows.length === 0
      )
    }

    if (args.hasAmount !== undefined) {
      filteredShipments = filteredShipments.filter(s =>
        args.hasAmount
          ? s.amount && s.amount.length > 0
          : !s.amount || s.amount.length === 0
      )
    }

    // Apply limit
    if (args.limit) {
      filteredShipments = filteredShipments.slice(0, args.limit)
    }

    return filteredShipments
  },
})

// Get shipment statistics by dataset
export const getStatsByDataset = query({
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

    const shipments = await ctx.db
      .query('shipments')
      .withIndex('by_dataset', q => q.eq('datasetId', args.datasetId))
      .collect()

    const stats = {
      totalShipments: shipments.length,
      shipmentsWithPickupTimeWindows: shipments.filter(
        s => s.pickupTimeWindows && s.pickupTimeWindows.length > 0
      ).length,
      shipmentsWithDeliveryTimeWindows: shipments.filter(
        s => s.deliveryTimeWindows && s.deliveryTimeWindows.length > 0
      ).length,
      shipmentsWithAmount: shipments.filter(
        s => s.amount && s.amount.length > 0
      ).length,
      shipmentsWithSkills: shipments.filter(
        s => s.skills && s.skills.length > 0
      ).length,
      averagePriority:
        shipments.filter(s => s.priority !== undefined).length > 0
          ? shipments
              .filter(s => s.priority !== undefined)
              .reduce((sum, s) => sum + s.priority!, 0) /
            shipments.filter(s => s.priority !== undefined).length
          : 0,
      totalAmount: shipments.reduce(
        (sum, s) => sum + (s.amount?.reduce((s, a) => s + a, 0) || 0),
        0
      ),
      averagePickupServiceTime:
        shipments.filter(s => s.pickupService !== undefined).length > 0
          ? shipments
              .filter(s => s.pickupService !== undefined)
              .reduce((sum, s) => sum + s.pickupService!, 0) /
            shipments.filter(s => s.pickupService !== undefined).length
          : 0,
      averageDeliveryServiceTime:
        shipments.filter(s => s.deliveryService !== undefined).length > 0
          ? shipments
              .filter(s => s.deliveryService !== undefined)
              .reduce((sum, s) => sum + s.deliveryService!, 0) /
            shipments.filter(s => s.deliveryService !== undefined).length
          : 0,
    }

    return stats
  },
})
