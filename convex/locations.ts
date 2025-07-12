import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getCurrentUser, validateUserOwnership } from './auth'

// Location validation utilities
const validateLocationCoordinates = (lat?: number, lon?: number) => {
  if (lat !== undefined && (lat < -90 || lat > 90)) {
    throw new Error('Latitude must be between -90 and 90')
  }
  if (lon !== undefined && (lon < -180 || lon > 180)) {
    throw new Error('Longitude must be between -180 and 180')
  }
}

const calculateGeocodingQuality = (
  address?: string,
  coordinates?: [number, number],
  source?: string
): { quality?: string; source?: string } => {
  if (source === 'manual' || (!address && coordinates)) {
    return { quality: 'manual', source: 'manual' }
  }
  if (address && coordinates && source === 'mapbox') {
    return { quality: 'exact', source: 'mapbox' }
  }
  if (address && coordinates) {
    return { quality: 'interpolated', source: 'import' }
  }
  return {}
}

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Check for duplicate locations within a project
const checkForDuplicates = async (
  ctx: any,
  projectId: string,
  name: string,
  coordinates?: [number, number]
) => {
  const existingLocations = await ctx.db
    .query('locations')
    .withIndex('by_project', (q: any) => q.eq('projectId', projectId))
    .collect()

  return existingLocations.filter((loc: any) => {
    // Check for exact name match (case insensitive)
    if (loc.name.toLowerCase() === name.toLowerCase()) {
      return true
    }

    // Check for coordinate proximity (within 100 meters)
    if (coordinates && loc.locationLat && loc.locationLon) {
      const distance = calculateDistance(
        coordinates[1],
        coordinates[0],
        loc.locationLat,
        loc.locationLon
      )
      return distance < 0.1 // 100 meters
    }

    return false
  })
}

// Get all locations for a specific dataset
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
      .query('locations')
      .withIndex('by_dataset', q => q.eq('datasetId', args.datasetId))
      .collect()
  },
})

// Get all locations for a specific project
export const listByProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id)

    return await ctx.db
      .query('locations')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))
      .collect()
  },
})

// Get a single location by ID
export const getById = query({
  args: { id: v.id('locations') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    const location = await ctx.db.get(args.id)

    if (!location) {
      throw new Error('Location not found')
    }

    // Validate user owns the parent project
    await validateUserOwnership(ctx, location.projectId, user._id)

    return location
  },
})

// Create a new location
export const create = mutation({
  args: {
    projectId: v.id('projects'),
    scenarioId: v.optional(v.id('scenarios')),
    datasetId: v.optional(v.id('datasets')),
    clusterId: v.optional(v.id('locationClusters')),
    name: v.string(),
    address: v.optional(v.string()),
    description: v.optional(v.string()),
    locationLon: v.optional(v.number()),
    locationLat: v.optional(v.number()),
    locationType: v.optional(v.string()),
    operatingHours: v.optional(v.string()),
    contactInfo: v.optional(v.string()),
    timezone: v.optional(v.string()),
    datasetName: v.optional(v.string()),
    datasetVersion: v.optional(v.number()),
    geocodeQuality: v.optional(v.string()),
    geocodeSource: v.optional(v.string()),
    geocodeTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    const now = Date.now()

    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id)

    // Validate coordinates if provided
    validateLocationCoordinates(args.locationLat, args.locationLon)

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

    // If cluster is provided, validate it belongs to the project
    if (args.clusterId) {
      const cluster = await ctx.db.get(args.clusterId)
      if (!cluster || cluster.projectId !== args.projectId) {
        throw new Error(
          'Location cluster does not belong to the specified project'
        )
      }
    }

    // Calculate geocoding quality and source
    const geocodingMeta = calculateGeocodingQuality(
      args.address,
      args.locationLat && args.locationLon
        ? [args.locationLon, args.locationLat]
        : undefined,
      'manual'
    )

    const locationId = await ctx.db.insert('locations', {
      ...args,
      geocodeQuality: geocodingMeta.quality,
      geocodeSource: geocodingMeta.source,
      geocodeTimestamp: geocodingMeta.quality ? now : undefined,
      usageCount: 0,
      updatedAt: now,
    })

    // Update dataset location count if dataset is specified
    if (args.datasetId) {
      const locations = await ctx.db
        .query('locations')
        .withIndex('by_dataset', q => q.eq('datasetId', args.datasetId))
        .collect()

      await ctx.db.patch(args.datasetId, {
        locationCount: locations.length,
        updatedAt: now,
      })
    }

    return locationId
  },
})

// Update an existing location
export const update = mutation({
  args: {
    id: v.id('locations'),
    name: v.optional(v.string()),
    clusterId: v.optional(v.id('locationClusters')),
    address: v.optional(v.string()),
    description: v.optional(v.string()),
    locationLon: v.optional(v.number()),
    locationLat: v.optional(v.number()),
    locationType: v.optional(v.string()),
    operatingHours: v.optional(v.string()),
    contactInfo: v.optional(v.string()),
    timezone: v.optional(v.string()),
    datasetName: v.optional(v.string()),
    datasetVersion: v.optional(v.number()),
    geocodeQuality: v.optional(v.string()),
    geocodeSource: v.optional(v.string()),
    geocodeTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    const { id, ...updateData } = args

    const location = await ctx.db.get(id)
    if (!location) {
      throw new Error('Location not found')
    }

    // Validate user owns the parent project
    await validateUserOwnership(ctx, location.projectId, user._id)

    // Validate coordinates if being updated
    if (args.locationLat !== undefined || args.locationLon !== undefined) {
      validateLocationCoordinates(args.locationLat, args.locationLon)
    }

    // If cluster is being updated, validate it belongs to the project
    if (args.clusterId) {
      const cluster = await ctx.db.get(args.clusterId)
      if (!cluster || cluster.projectId !== location.projectId) {
        throw new Error(
          "Location cluster does not belong to the location's project"
        )
      }
    }

    // Remove undefined values
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    )

    // Update geocoding metadata if coordinates or address changed
    let geocodingUpdate = {}
    if (
      args.locationLat !== undefined ||
      args.locationLon !== undefined ||
      args.address !== undefined
    ) {
      const geocodingMeta = calculateGeocodingQuality(
        args.address || location.address,
        args.locationLat && args.locationLon
          ? [args.locationLon, args.locationLat]
          : undefined,
        'manual'
      )
      geocodingUpdate = {
        geocodeQuality: geocodingMeta.quality,
        geocodeSource: geocodingMeta.source,
        geocodeTimestamp: geocodingMeta.quality ? Date.now() : undefined,
      }
    }

    await ctx.db.patch(id, {
      ...cleanUpdateData,
      ...geocodingUpdate,
      updatedAt: Date.now(),
    })

    return id
  },
})

// Delete a location
export const remove = mutation({
  args: { id: v.id('locations') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    const location = await ctx.db.get(args.id)
    if (!location) {
      throw new Error('Location not found')
    }

    // Validate user owns the parent project
    await validateUserOwnership(ctx, location.projectId, user._id)

    const datasetId = location.datasetId

    // Check if location is referenced by vehicles
    const vehiclesUsingLocation = await ctx.db
      .query('vehicles')
      .withIndex('by_location', q => q.eq('startLocationId', args.id))
      .collect()

    if (vehiclesUsingLocation.length > 0) {
      throw new Error(
        `Cannot delete location: ${vehiclesUsingLocation.length} vehicles reference this location as start location`
      )
    }

    // Check if location is referenced by jobs
    const jobsUsingLocation = await ctx.db
      .query('jobs')
      .withIndex('by_location', q => q.eq('locationId', args.id))
      .collect()

    if (jobsUsingLocation.length > 0) {
      throw new Error(
        `Cannot delete location: ${jobsUsingLocation.length} jobs reference this location`
      )
    }

    // Remove from location clusters
    const clusterMemberships = await ctx.db
      .query('locationClusterMembership')
      .withIndex('by_location', q => q.eq('locationId', args.id))
      .collect()

    for (const membership of clusterMemberships) {
      await ctx.db.delete(membership._id)
    }

    // Delete the location
    await ctx.db.delete(args.id)

    // Update dataset location count if dataset is specified
    if (datasetId) {
      const locations = await ctx.db
        .query('locations')
        .withIndex('by_dataset', q => q.eq('datasetId', datasetId))
        .collect()

      await ctx.db.patch(datasetId, {
        locationCount: locations.length,
        updatedAt: Date.now(),
      })
    }

    return args.id
  },
})

// Bulk import locations from CSV-like data
export const bulkImport = mutation({
  args: {
    projectId: v.id('projects'),
    datasetId: v.optional(v.id('datasets')),
    scenarioId: v.optional(v.id('scenarios')),
    locations: v.array(
      v.object({
        name: v.string(),
        address: v.optional(v.string()),
        description: v.optional(v.string()),
        locationLon: v.optional(v.number()),
        locationLat: v.optional(v.number()),
        locationType: v.optional(v.string()),
        operatingHours: v.optional(v.string()),
        contactInfo: v.optional(v.string()),
        timezone: v.optional(v.string()),
        geocodeQuality: v.optional(v.string()),
        geocodeSource: v.optional(v.string()),
        geocodeTimestamp: v.optional(v.number()),
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

    // Clear existing locations if requested
    if (args.clearExisting && args.datasetId) {
      const existingLocations = await ctx.db
        .query('locations')
        .withIndex('by_dataset', q => q.eq('datasetId', args.datasetId))
        .collect()

      for (const location of existingLocations) {
        await ctx.db.delete(location._id)
      }
    }

    // Insert new locations
    const locationIds = []
    for (const locationData of args.locations) {
      const locationId = await ctx.db.insert('locations', {
        projectId: args.projectId,
        scenarioId: args.scenarioId,
        datasetId: args.datasetId,
        ...locationData,
        updatedAt: now,
      })
      locationIds.push(locationId)
    }

    // Update dataset location count if dataset is specified
    if (args.datasetId) {
      const locations = await ctx.db
        .query('locations')
        .withIndex('by_dataset', q => q.eq('datasetId', args.datasetId))
        .collect()

      await ctx.db.patch(args.datasetId, {
        locationCount: locations.length,
        updatedAt: now,
      })
    }

    return {
      importedCount: locationIds.length,
      locationIds,
    }
  },
})

// Get locations with filtering and pagination
export const listWithFilters = query({
  args: {
    projectId: v.id('projects'),
    datasetId: v.optional(v.id('datasets')),
    scenarioId: v.optional(v.id('scenarios')),
    locationType: v.optional(v.string()),
    clusterId: v.optional(v.id('locationClusters')),
    hasCoordinates: v.optional(v.boolean()),
    searchName: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id)

    const query = ctx.db
      .query('locations')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))

    const locations = await query.collect()

    // Apply filters
    let filteredLocations = locations

    if (args.datasetId) {
      filteredLocations = filteredLocations.filter(
        l => l.datasetId === args.datasetId
      )
    }

    if (args.scenarioId) {
      filteredLocations = filteredLocations.filter(
        l => l.scenarioId === args.scenarioId
      )
    }

    if (args.locationType) {
      filteredLocations = filteredLocations.filter(
        l => l.locationType === args.locationType
      )
    }

    if (args.clusterId) {
      filteredLocations = filteredLocations.filter(
        l => l.clusterId === args.clusterId
      )
    }

    if (args.hasCoordinates !== undefined) {
      filteredLocations = filteredLocations.filter(l =>
        args.hasCoordinates
          ? l.locationLon !== undefined && l.locationLat !== undefined
          : l.locationLon === undefined || l.locationLat === undefined
      )
    }

    if (args.searchName) {
      const searchTerm = args.searchName.toLowerCase()
      filteredLocations = filteredLocations.filter(
        l =>
          l.name.toLowerCase().includes(searchTerm) ||
          (l.address && l.address.toLowerCase().includes(searchTerm)) ||
          (l.description && l.description.toLowerCase().includes(searchTerm))
      )
    }

    // Apply limit
    if (args.limit) {
      filteredLocations = filteredLocations.slice(0, args.limit)
    }

    return filteredLocations
  },
})

// Duplicate locations within or across datasets
export const duplicate = mutation({
  args: {
    locationIds: v.array(v.id('locations')),
    targetDatasetId: v.optional(v.id('datasets')),
    targetScenarioId: v.optional(v.id('scenarios')),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    const now = Date.now()

    const duplicatedIds = []

    for (const locationId of args.locationIds) {
      const originalLocation = await ctx.db.get(locationId)
      if (!originalLocation) {
        continue
      }

      // Validate user owns the parent project
      await validateUserOwnership(ctx, originalLocation.projectId, user._id)

      // Create duplicated location
      const duplicatedId = await ctx.db.insert('locations', {
        projectId: originalLocation.projectId,
        scenarioId: args.targetScenarioId || originalLocation.scenarioId,
        datasetId: args.targetDatasetId || originalLocation.datasetId,
        name: `${originalLocation.name} (Copy)`,
        address: originalLocation.address,
        description: originalLocation.description,
        locationLon: originalLocation.locationLon,
        locationLat: originalLocation.locationLat,
        locationType: originalLocation.locationType,
        operatingHours: originalLocation.operatingHours,
        contactInfo: originalLocation.contactInfo,
        timezone: originalLocation.timezone,
        datasetName: originalLocation.datasetName,
        datasetVersion: originalLocation.datasetVersion,
        updatedAt: now,
      })

      duplicatedIds.push(duplicatedId)
    }

    // Update dataset location count if target dataset is specified
    if (args.targetDatasetId) {
      const locations = await ctx.db
        .query('locations')
        .withIndex('by_dataset', q => q.eq('datasetId', args.targetDatasetId))
        .collect()

      await ctx.db.patch(args.targetDatasetId, {
        locationCount: locations.length,
        updatedAt: now,
      })
    }

    return {
      duplicatedCount: duplicatedIds.length,
      locationIds: duplicatedIds,
    }
  },
})

// Get location statistics by dataset
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

    const locations = await ctx.db
      .query('locations')
      .withIndex('by_dataset', q => q.eq('datasetId', args.datasetId))
      .collect()

    const locationTypes = locations.reduce(
      (acc, l) => {
        const type = l.locationType || 'unknown'
        acc[type] = (acc[type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const stats = {
      totalLocations: locations.length,
      locationsWithCoordinates: locations.filter(
        l => l.locationLon !== undefined && l.locationLat !== undefined
      ).length,
      locationsWithAddress: locations.filter(l => l.address).length,
      locationsWithOperatingHours: locations.filter(l => l.operatingHours)
        .length,
      locationsByType: locationTypes,
      clusteredLocations: locations.filter(l => l.clusterId).length,
    }

    return stats
  },
})

// Search locations by coordinates (find nearby locations)
export const findNearby = query({
  args: {
    projectId: v.id('projects'),
    lon: v.number(),
    lat: v.number(),
    radiusKm: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id)

    const locations = await ctx.db
      .query('locations')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))
      .collect()

    const radiusKm = args.radiusKm || 10 // Default 10km radius
    const locationsWithDistance = locations
      .filter(l => l.locationLon !== undefined && l.locationLat !== undefined)
      .map(location => {
        // Simple distance calculation (Haversine formula)
        const R = 6371 // Earth's radius in kilometers
        const dLat = ((location.locationLat! - args.lat) * Math.PI) / 180
        const dLon = ((location.locationLon! - args.lon) * Math.PI) / 180
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((args.lat * Math.PI) / 180) *
            Math.cos((location.locationLat! * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = R * c

        return {
          ...location,
          distanceKm: distance,
        }
      })
      .filter(l => l.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)

    // Apply limit
    if (args.limit) {
      return locationsWithDistance.slice(0, args.limit)
    }

    return locationsWithDistance
  },
})

// Validate location data with duplicate checking and quality scoring
export const validateLocationData = mutation({
  args: {
    projectId: v.id('projects'),
    name: v.string(),
    address: v.optional(v.string()),
    coordinates: v.optional(v.array(v.number())),
    checkDuplicates: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id)

    const validationResult = {
      isValid: true,
      warnings: [] as string[],
      errors: [] as string[],
      quality: undefined as string | undefined,
      source: undefined as string | undefined,
      duplicates: [] as any[],
    }

    // Validate coordinates if provided
    if (args.coordinates && args.coordinates.length >= 2) {
      try {
        validateLocationCoordinates(args.coordinates[1], args.coordinates[0]) // lat, lon
      } catch (error) {
        validationResult.errors.push((error as Error).message)
        validationResult.isValid = false
      }
    }

    // Calculate quality score
    const geocodingMeta = calculateGeocodingQuality(
      args.address,
      args.coordinates && args.coordinates.length >= 2
        ? [args.coordinates[0], args.coordinates[1]]
        : undefined,
      'manual'
    )
    validationResult.quality = geocodingMeta.quality
    validationResult.source = geocodingMeta.source

    // Check for duplicates if requested
    if (args.checkDuplicates !== false) {
      const duplicates = await checkForDuplicates(
        ctx,
        args.projectId,
        args.name,
        args.coordinates && args.coordinates.length >= 2
          ? [args.coordinates[0], args.coordinates[1]]
          : undefined
      )

      if (duplicates.length > 0) {
        validationResult.duplicates = duplicates
        validationResult.warnings.push(
          `Found ${duplicates.length} potential duplicate location(s)`
        )
      }
    }

    // Add quality warnings
    if (validationResult.quality === 'manual' && !args.coordinates) {
      validationResult.warnings.push(
        'Location has no coordinates - consider adding coordinates for better routing accuracy'
      )
    }

    if (!args.address && args.coordinates) {
      validationResult.warnings.push(
        'Location has coordinates but no address - consider adding an address for better context'
      )
    }

    return validationResult
  },
})

// ============================================================================
// LOCATION USAGE ANALYTICS AND PERFORMANCE METRICS
// ============================================================================

// Track location usage when entities reference locations
export const trackLocationUsage = mutation({
  args: {
    locationId: v.id('locations'),
    entityType: v.union(
      v.literal('vehicle'),
      v.literal('job'),
      v.literal('shipment')
    ),
    entityId: v.string(),
    usageType: v.string(), // 'start', 'end', 'service', 'pickup', 'delivery'
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    const location = await ctx.db.get(args.locationId)
    if (!location) {
      throw new Error('Location not found')
    }

    // Validate user owns the parent project
    await validateUserOwnership(ctx, location.projectId, user._id)

    // Update location usage counters
    await ctx.db.patch(args.locationId, {
      usageCount: (location.usageCount || 0) + 1,
      lastUsedAt: Date.now(),
      updatedAt: Date.now(),
    })

    return args.locationId
  },
})

// Get comprehensive location usage analytics for a dataset
export const getLocationUsageAnalytics = query({
  args: {
    datasetId: v.id('datasets'),
    timeRange: v.optional(
      v.object({
        startDate: v.number(),
        endDate: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Get dataset to validate project ownership
    const dataset = await ctx.db.get(args.datasetId)
    if (!dataset) {
      throw new Error('Dataset not found')
    }

    // Validate user owns the project
    await validateUserOwnership(ctx, dataset.projectId, user._id)

    const locations = await ctx.db
      .query('locations')
      .withIndex('by_dataset', q => q.eq('datasetId', args.datasetId))
      .collect()

    // Get related entities for usage analysis
    const vehicles = await ctx.db
      .query('vehicles')
      .withIndex('by_dataset', q => q.eq('datasetId', args.datasetId))
      .collect()

    const jobs = await ctx.db
      .query('jobs')
      .withIndex('by_dataset', q => q.eq('datasetId', args.datasetId))
      .collect()

    const shipments = await ctx.db
      .query('shipments')
      .withIndex('by_dataset', q => q.eq('datasetId', args.datasetId))
      .collect()

    // Calculate usage statistics
    const locationUsageMap = new Map<string, number>()
    const locationTypeUsage = new Map<string, number>()

    // Count vehicle references
    vehicles.forEach(vehicle => {
      if (vehicle.startLocationId) {
        locationUsageMap.set(
          vehicle.startLocationId,
          (locationUsageMap.get(vehicle.startLocationId) || 0) + 1
        )
      }
      if (vehicle.endLocationId) {
        locationUsageMap.set(
          vehicle.endLocationId,
          (locationUsageMap.get(vehicle.endLocationId) || 0) + 1
        )
      }
    })

    // Count job references
    jobs.forEach(job => {
      if (job.locationId) {
        locationUsageMap.set(
          job.locationId,
          (locationUsageMap.get(job.locationId) || 0) + 1
        )
      }
    })

    // Count shipment references
    shipments.forEach(shipment => {
      if (shipment.pickupLocationId) {
        locationUsageMap.set(
          shipment.pickupLocationId,
          (locationUsageMap.get(shipment.pickupLocationId) || 0) + 1
        )
      }
      if (shipment.deliveryLocationId) {
        locationUsageMap.set(
          shipment.deliveryLocationId,
          (locationUsageMap.get(shipment.deliveryLocationId) || 0) + 1
        )
      }
    })

    // Calculate location type usage
    locations.forEach(location => {
      const type = location.locationType || 'unknown'
      locationTypeUsage.set(type, (locationTypeUsage.get(type) || 0) + 1)
    })

    // Find most and least used locations
    const sortedByUsage = locations
      .map(location => ({
        ...location,
        actualUsage: locationUsageMap.get(location._id) || 0,
      }))
      .sort((a, b) => b.actualUsage - a.actualUsage)

    const mostUsedLocations = sortedByUsage.slice(0, 10)
    const leastUsedLocations = sortedByUsage
      .filter(l => l.actualUsage === 0)
      .slice(0, 10)

    // Calculate efficiency metrics
    const totalLocations = locations.length
    const usedLocations = sortedByUsage.filter(l => l.actualUsage > 0).length
    const utilizationRate =
      totalLocations > 0 ? usedLocations / totalLocations : 0

    // Quality distribution
    const qualityDistribution = locations.reduce(
      (acc, location) => {
        const quality = location.geocodeQuality || 'unknown'
        acc[quality] = (acc[quality] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      summary: {
        totalLocations,
        usedLocations,
        unusedLocations: totalLocations - usedLocations,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        avgUsagePerLocation:
          totalLocations > 0
            ? Math.round(
                (sortedByUsage.reduce((sum, l) => sum + l.actualUsage, 0) /
                  totalLocations) *
                  100
              ) / 100
            : 0,
      },
      usage: {
        mostUsedLocations: mostUsedLocations.slice(0, 5),
        leastUsedLocations,
        locationTypeUsage: Object.fromEntries(locationTypeUsage),
      },
      quality: {
        distribution: qualityDistribution,
        locationsWithCoordinates: locations.filter(
          l => l.locationLon !== undefined && l.locationLat !== undefined
        ).length,
        locationsWithAddress: locations.filter(l => l.address).length,
      },
      optimization: {
        unusedLocationIds: leastUsedLocations.map(l => l._id),
        highUsageLocationIds: mostUsedLocations.slice(0, 5).map(l => l._id),
        duplicateCandidates: [], // Could implement duplicate detection here
      },
    }
  },
})

// Generate detailed location performance report for a project
export const generateLocationPerformanceReport = query({
  args: {
    projectId: v.id('projects'),
    includeGeoAnalysis: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id)

    const locations = await ctx.db
      .query('locations')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))
      .collect()

    const datasets = await ctx.db
      .query('datasets')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))
      .collect()

    // Collect usage data across all datasets
    let totalVehicleReferences = 0
    let totalJobReferences = 0
    let totalShipmentReferences = 0

    for (const dataset of datasets) {
      const vehicles = await ctx.db
        .query('vehicles')
        .withIndex('by_dataset', q => q.eq('datasetId', dataset._id))
        .collect()

      const jobs = await ctx.db
        .query('jobs')
        .withIndex('by_dataset', q => q.eq('datasetId', dataset._id))
        .collect()

      const shipments = await ctx.db
        .query('shipments')
        .withIndex('by_dataset', q => q.eq('datasetId', dataset._id))
        .collect()

      totalVehicleReferences += vehicles.length * 2 // start + end locations
      totalJobReferences += jobs.filter(j => j.locationId).length
      totalShipmentReferences +=
        shipments.filter(s => s.pickupLocationId).length +
        shipments.filter(s => s.deliveryLocationId).length
    }

    // Geographic coverage analysis
    let geographicAnalysis = null
    if (args.includeGeoAnalysis && locations.length > 0) {
      const locationsWithCoords = locations.filter(
        l => l.locationLon !== undefined && l.locationLat !== undefined
      )

      if (locationsWithCoords.length > 0) {
        const lats = locationsWithCoords.map(l => l.locationLat!)
        const lons = locationsWithCoords.map(l => l.locationLon!)

        const bounds = {
          north: Math.max(...lats),
          south: Math.min(...lats),
          east: Math.max(...lons),
          west: Math.min(...lons),
        }

        const latSpan = bounds.north - bounds.south
        const lonSpan = bounds.east - bounds.west

        // Calculate approximate coverage area
        const coverageAreaKm2 = latSpan * lonSpan * 111 * 111 // Rough km² conversion

        geographicAnalysis = {
          bounds,
          coverageAreaKm2: Math.round(coverageAreaKm2 * 100) / 100,
          locationDensity:
            coverageAreaKm2 > 0
              ? Math.round(
                  (locationsWithCoords.length / coverageAreaKm2) * 100
                ) / 100
              : 0,
          centerPoint: {
            lat: (bounds.north + bounds.south) / 2,
            lon: (bounds.east + bounds.west) / 2,
          },
        }
      }
    }

    // Performance metrics
    const totalReferences =
      totalVehicleReferences + totalJobReferences + totalShipmentReferences

    return {
      projectId: args.projectId,
      generatedAt: Date.now(),
      summary: {
        totalLocations: locations.length,
        totalDatasets: datasets.length,
        totalEntityReferences: totalReferences,
        avgReferencesPerLocation:
          locations.length > 0
            ? Math.round((totalReferences / locations.length) * 100) / 100
            : 0,
      },
      qualityMetrics: {
        locationsWithCoordinates: locations.filter(
          l => l.locationLon !== undefined && l.locationLat !== undefined
        ).length,
        locationsWithAddress: locations.filter(l => l.address).length,
        locationsWithOperatingHours: locations.filter(l => l.operatingHours)
          .length,
        geocodingQualityDistribution: locations.reduce(
          (acc, location) => {
            const quality = location.geocodeQuality || 'unknown'
            acc[quality] = (acc[quality] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        ),
      },
      usageMetrics: {
        vehicleReferences: totalVehicleReferences,
        jobReferences: totalJobReferences,
        shipmentReferences: totalShipmentReferences,
        locationsByType: locations.reduce(
          (acc, location) => {
            const type = location.locationType || 'unknown'
            acc[type] = (acc[type] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        ),
      },
      geographicAnalysis,
      recommendations: generateOptimizationRecommendations(
        locations,
        totalReferences
      ),
    }
  },
})

// Get location efficiency metrics for optimization insights
export const getLocationEfficiencyMetrics = query({
  args: {
    datasetId: v.id('datasets'),
    includeDistanceAnalysis: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Get dataset to validate project ownership
    const dataset = await ctx.db.get(args.datasetId)
    if (!dataset) {
      throw new Error('Dataset not found')
    }

    // Validate user owns the project
    await validateUserOwnership(ctx, dataset.projectId, user._id)

    const locations = await ctx.db
      .query('locations')
      .withIndex('by_dataset', q => q.eq('datasetId', args.datasetId))
      .collect()

    if (locations.length === 0) {
      return {
        summary: { totalLocations: 0, analysisAvailable: false },
        efficiency: {},
        recommendations: [],
      }
    }

    const locationsWithCoords = locations.filter(
      l => l.locationLon !== undefined && l.locationLat !== undefined
    )

    // Distance analysis if requested and we have coordinates
    let distanceAnalysis = null
    if (args.includeDistanceAnalysis && locationsWithCoords.length > 1) {
      const distances: number[] = []

      // Calculate pairwise distances for efficiency analysis
      for (let i = 0; i < locationsWithCoords.length; i++) {
        for (let j = i + 1; j < locationsWithCoords.length; j++) {
          const loc1 = locationsWithCoords[i]
          const loc2 = locationsWithCoords[j]
          const distance = calculateDistance(
            loc1.locationLat!,
            loc1.locationLon!,
            loc2.locationLat!,
            loc2.locationLon!
          )
          distances.push(distance)
        }
      }

      if (distances.length > 0) {
        distances.sort((a, b) => a - b)
        const avgDistance =
          distances.reduce((sum, d) => sum + d, 0) / distances.length
        const medianDistance = distances[Math.floor(distances.length / 2)]

        distanceAnalysis = {
          avgDistance: Math.round(avgDistance * 100) / 100,
          medianDistance: Math.round(medianDistance * 100) / 100,
          minDistance: Math.round(distances[0] * 100) / 100,
          maxDistance: Math.round(distances[distances.length - 1] * 100) / 100,
          totalPairs: distances.length,
        }
      }
    }

    // Efficiency scoring
    const efficiencyScores = locations.map(location => {
      let score = 0
      let maxScore = 0

      // Quality score component (0-25 points)
      maxScore += 25
      if (location.geocodeQuality === 'exact') score += 25
      else if (location.geocodeQuality === 'interpolated') score += 20
      else if (location.geocodeQuality === 'approximate') score += 15
      else if (location.geocodeQuality === 'manual') score += 10

      // Address completeness (0-20 points)
      maxScore += 20
      if (location.address) score += 20

      // Coordinate precision (0-15 points)
      maxScore += 15
      if (
        location.locationLon !== undefined &&
        location.locationLat !== undefined
      )
        score += 15

      // Operational data completeness (0-25 points)
      maxScore += 25
      if (location.operatingHours) score += 10
      if (location.contactInfo) score += 10
      if (location.locationType) score += 5

      // Usage frequency (0-15 points)
      maxScore += 15
      const usage = location.usageCount || 0
      if (usage > 10) score += 15
      else if (usage > 5) score += 10
      else if (usage > 1) score += 5

      return {
        locationId: location._id,
        score: Math.round((score / maxScore) * 100),
        components: {
          quality: location.geocodeQuality || 'unknown',
          hasAddress: !!location.address,
          hasCoordinates:
            location.locationLon !== undefined &&
            location.locationLat !== undefined,
          hasOperatingHours: !!location.operatingHours,
          usage: usage,
        },
      }
    })

    const avgEfficiencyScore =
      efficiencyScores.length > 0
        ? Math.round(
            (efficiencyScores.reduce((sum, s) => sum + s.score, 0) /
              efficiencyScores.length) *
              100
          ) / 100
        : 0

    return {
      summary: {
        totalLocations: locations.length,
        locationsWithCoordinates: locationsWithCoords.length,
        avgEfficiencyScore,
        analysisAvailable: true,
      },
      efficiency: {
        scores: efficiencyScores.sort((a, b) => b.score - a.score),
        distribution: efficiencyScores.reduce(
          (acc, s) => {
            if (s.score >= 80) acc.excellent++
            else if (s.score >= 60) acc.good++
            else if (s.score >= 40) acc.fair++
            else acc.poor++
            return acc
          },
          { excellent: 0, good: 0, fair: 0, poor: 0 }
        ),
      },
      distanceAnalysis,
      recommendations: generateEfficiencyRecommendations(
        efficiencyScores,
        distanceAnalysis
      ),
    }
  },
})

// Helper function to generate optimization recommendations
function generateOptimizationRecommendations(
  locations: any[],
  totalReferences: number
): string[] {
  const recommendations: string[] = []

  // Quality recommendations
  const lowQualityCount = locations.filter(
    l => !l.geocodeQuality || l.geocodeQuality === 'manual'
  ).length

  if (lowQualityCount > 0) {
    recommendations.push(
      `Consider re-geocoding ${lowQualityCount} locations with missing or manual quality scores`
    )
  }

  // Coordinate recommendations
  const missingCoordsCount = locations.filter(
    l => l.locationLon === undefined || l.locationLat === undefined
  ).length

  if (missingCoordsCount > 0) {
    recommendations.push(
      `Add coordinates to ${missingCoordsCount} locations for improved routing accuracy`
    )
  }

  // Usage recommendations
  if (locations.length > 0 && totalReferences === 0) {
    recommendations.push(
      'No entity references found - consider linking vehicles, jobs, or shipments to locations'
    )
  }

  // Address completeness
  const missingAddressCount = locations.filter(l => !l.address).length
  if (missingAddressCount > locations.length * 0.3) {
    recommendations.push(
      `Consider adding addresses to ${missingAddressCount} locations for better context`
    )
  }

  return recommendations
}

// Helper function to generate efficiency recommendations
function generateEfficiencyRecommendations(
  efficiencyScores: any[],
  distanceAnalysis: any
): string[] {
  const recommendations: string[] = []

  // Low efficiency locations
  const lowEfficiencyCount = efficiencyScores.filter(s => s.score < 50).length
  if (lowEfficiencyCount > 0) {
    recommendations.push(
      `${lowEfficiencyCount} locations have efficiency scores below 50% - consider improving data quality`
    )
  }

  // Distance-based recommendations
  if (distanceAnalysis && distanceAnalysis.maxDistance > 100) {
    recommendations.push(
      `Some locations are >100km apart - consider creating regional clusters for better optimization`
    )
  }

  if (distanceAnalysis && distanceAnalysis.minDistance < 0.1) {
    recommendations.push(
      `Some locations are very close (<100m) - check for potential duplicates`
    )
  }

  return recommendations
}

// ============================================================================
// LOCATION CLUSTER MANAGEMENT
// ============================================================================

// Get all clusters for a specific project with member counts
export const getLocationClusters = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id)

    const clusters = await ctx.db
      .query('locationClusters')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))
      .collect()

    // Get member counts for each cluster
    const clustersWithCounts = []
    for (const cluster of clusters) {
      const memberCount = await ctx.db
        .query('locations')
        .withIndex('by_cluster', q => q.eq('clusterId', cluster._id))
        .collect()

      clustersWithCounts.push({
        ...cluster,
        memberCount: memberCount.length,
      })
    }

    return clustersWithCounts
  },
})

// Create a new location cluster
export const createLocationCluster = mutation({
  args: {
    projectId: v.id('projects'),
    name: v.string(),
    description: v.optional(v.string()),
    centerLon: v.optional(v.number()),
    centerLat: v.optional(v.number()),
    radius: v.optional(v.number()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    const now = Date.now()

    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id)

    // Validate coordinates if provided
    if (args.centerLat !== undefined) {
      validateLocationCoordinates(args.centerLat, args.centerLon)
    }

    // Validate radius
    if (args.radius !== undefined && args.radius <= 0) {
      throw new Error('Radius must be greater than 0')
    }

    return await ctx.db.insert('locationClusters', {
      projectId: args.projectId,
      name: args.name,
      description: args.description,
      centerLon: args.centerLon,
      centerLat: args.centerLat,
      radius: args.radius || 5000, // Default 5km radius
      color: args.color || '#3B82F6', // Default blue color
      updatedAt: now,
    })
  },
})

// Update a location cluster
export const updateLocationCluster = mutation({
  args: {
    id: v.id('locationClusters'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    centerLon: v.optional(v.number()),
    centerLat: v.optional(v.number()),
    radius: v.optional(v.number()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    const { id, ...updateData } = args

    const cluster = await ctx.db.get(id)
    if (!cluster) {
      throw new Error('Cluster not found')
    }

    // Validate user owns the parent project
    await validateUserOwnership(ctx, cluster.projectId, user._id)

    // Validate coordinates if being updated
    if (args.centerLat !== undefined) {
      validateLocationCoordinates(args.centerLat, args.centerLon)
    }

    // Validate radius
    if (args.radius !== undefined && args.radius <= 0) {
      throw new Error('Radius must be greater than 0')
    }

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

// Delete a location cluster
export const removeLocationCluster = mutation({
  args: { id: v.id('locationClusters') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    const cluster = await ctx.db.get(args.id)
    if (!cluster) {
      throw new Error('Cluster not found')
    }

    // Validate user owns the parent project
    await validateUserOwnership(ctx, cluster.projectId, user._id)

    // Remove cluster reference from all locations
    const locations = await ctx.db
      .query('locations')
      .withIndex('by_cluster', q => q.eq('clusterId', args.id))
      .collect()

    for (const location of locations) {
      await ctx.db.patch(location._id, {
        clusterId: undefined,
        updatedAt: Date.now(),
      })
    }

    // Remove all cluster memberships
    const memberships = await ctx.db
      .query('locationClusterMembership')
      .withIndex('by_cluster', q => q.eq('clusterId', args.id))
      .collect()

    for (const membership of memberships) {
      await ctx.db.delete(membership._id)
    }

    // Delete the cluster
    await ctx.db.delete(args.id)

    return args.id
  },
})

// Add locations to a cluster
export const addLocationsToCluster = mutation({
  args: {
    clusterId: v.id('locationClusters'),
    locationIds: v.array(v.id('locations')),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    const now = Date.now()

    const cluster = await ctx.db.get(args.clusterId)
    if (!cluster) {
      throw new Error('Cluster not found')
    }

    // Validate user owns the parent project
    await validateUserOwnership(ctx, cluster.projectId, user._id)

    const addedLocations = []

    for (const locationId of args.locationIds) {
      const location = await ctx.db.get(locationId)
      if (!location) continue

      // Validate location belongs to the same project
      if (location.projectId !== cluster.projectId) {
        throw new Error(
          `Location ${locationId} does not belong to the same project as the cluster`
        )
      }

      // Update location with cluster reference
      await ctx.db.patch(locationId, {
        clusterId: args.clusterId,
        updatedAt: now,
      })

      // Create cluster membership record if it doesn't exist
      const existingMembership = await ctx.db
        .query('locationClusterMembership')
        .withIndex('by_location', q => q.eq('locationId', locationId))
        .filter(q => q.eq(q.field('clusterId'), args.clusterId))
        .first()

      if (!existingMembership) {
        await ctx.db.insert('locationClusterMembership', {
          locationId,
          clusterId: args.clusterId,
          updatedAt: now,
        })
      }

      addedLocations.push(locationId)
    }

    return {
      addedCount: addedLocations.length,
      addedLocations,
    }
  },
})

// Get cluster analytics
export const getClusterAnalytics = query({
  args: { clusterId: v.id('locationClusters') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    const cluster = await ctx.db.get(args.clusterId)
    if (!cluster) {
      throw new Error('Cluster not found')
    }

    // Validate user owns the parent project
    await validateUserOwnership(ctx, cluster.projectId, user._id)

    // Get cluster members
    const members = await ctx.db
      .query('locations')
      .withIndex('by_cluster', q => q.eq('clusterId', args.clusterId))
      .collect()

    if (members.length === 0) {
      return {
        clusterId: args.clusterId,
        memberCount: 0,
        averageDistance: 0,
        maxDistance: 0,
        density: 0,
        coverage: 0,
        efficiency: 0,
      }
    }

    // Calculate distances from cluster center
    const distances = members
      .filter(m => m.locationLat !== undefined && m.locationLon !== undefined)
      .map(member => {
        if (!cluster.centerLat || !cluster.centerLon) return 0

        return calculateDistance(
          cluster.centerLat,
          cluster.centerLon,
          member.locationLat!,
          member.locationLon!
        )
      })

    const averageDistance =
      distances.length > 0
        ? distances.reduce((sum, d) => sum + d, 0) / distances.length
        : 0

    const maxDistance = distances.length > 0 ? Math.max(...distances) : 0

    // Calculate cluster density (locations per square km)
    const clusterRadius = cluster.radius || 5000 // meters
    const clusterAreaKm2 = Math.PI * Math.pow(clusterRadius / 1000, 2)
    const density = members.length / clusterAreaKm2

    // Calculate coverage (percentage of locations within radius)
    const locationsWithinRadius = distances.filter(
      d => d <= clusterRadius / 1000
    ).length
    const coverage =
      distances.length > 0
        ? (locationsWithinRadius / distances.length) * 100
        : 0

    // Calculate efficiency score
    const radiusKm = clusterRadius / 1000
    const efficiency =
      radiusKm > 0 ? Math.max(0, 100 - (averageDistance / radiusKm) * 100) : 0

    return {
      clusterId: args.clusterId,
      memberCount: members.length,
      averageDistance: Math.round(averageDistance * 100) / 100,
      maxDistance: Math.round(maxDistance * 100) / 100,
      density: Math.round(density * 100) / 100,
      coverage: Math.round(coverage * 100) / 100,
      efficiency: Math.round(efficiency * 100) / 100,
      locationTypes: members.reduce(
        (acc, member) => {
          const type = member.locationType || 'unknown'
          acc[type] = (acc[type] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      ),
    }
  },
})
