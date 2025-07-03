import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, validateUserOwnership } from "./auth";

// Get all locations for a specific dataset
export const listByDataset = query({
  args: { datasetId: v.id("datasets") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // Get dataset to validate project ownership
    const dataset = await ctx.db.get(args.datasetId);
    if (!dataset) {
      throw new Error("Dataset not found");
    }
    
    // Validate user owns the project
    await validateUserOwnership(ctx, dataset.projectId, user._id);
    
    return await ctx.db
      .query("locations")
      .withIndex("by_dataset", (q) => q.eq("datasetId", args.datasetId))
      .collect();
  },
});

// Get all locations for a specific project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id);
    
    return await ctx.db
      .query("locations")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// Get a single location by ID
export const getById = query({
  args: { id: v.id("locations") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const location = await ctx.db.get(args.id);
    
    if (!location) {
      throw new Error("Location not found");
    }
    
    // Validate user owns the parent project
    await validateUserOwnership(ctx, location.projectId, user._id);
    
    return location;
  },
});

// Create a new location
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    scenarioId: v.optional(v.id("scenarios")),
    datasetId: v.optional(v.id("datasets")),
    clusterId: v.optional(v.id("locationClusters")),
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
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const now = Date.now();
    
    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id);
    
    // If scenario is provided, validate it belongs to the project
    if (args.scenarioId) {
      const scenario = await ctx.db.get(args.scenarioId);
      if (!scenario || scenario.projectId !== args.projectId) {
        throw new Error("Scenario does not belong to the specified project");
      }
    }
    
    // If dataset is provided, validate it belongs to the project
    if (args.datasetId) {
      const dataset = await ctx.db.get(args.datasetId);
      if (!dataset || dataset.projectId !== args.projectId) {
        throw new Error("Dataset does not belong to the specified project");
      }
    }
    
    // If cluster is provided, validate it belongs to the project
    if (args.clusterId) {
      const cluster = await ctx.db.get(args.clusterId);
      if (!cluster || cluster.projectId !== args.projectId) {
        throw new Error("Location cluster does not belong to the specified project");
      }
    }
    
    const locationId = await ctx.db.insert("locations", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
    
    // Update dataset location count if dataset is specified
    if (args.datasetId) {
      const locations = await ctx.db
        .query("locations")
        .withIndex("by_dataset", (q) => q.eq("datasetId", args.datasetId))
        .collect();
      
      await ctx.db.patch(args.datasetId, {
        locationCount: locations.length,
        updatedAt: now,
      });
    }
    
    return locationId;
  },
});

// Update an existing location
export const update = mutation({
  args: {
    id: v.id("locations"),
    name: v.optional(v.string()),
    clusterId: v.optional(v.id("locationClusters")),
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
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const { id, ...updateData } = args;
    
    const location = await ctx.db.get(id);
    if (!location) {
      throw new Error("Location not found");
    }
    
    // Validate user owns the parent project
    await validateUserOwnership(ctx, location.projectId, user._id);
    
    // If cluster is being updated, validate it belongs to the project
    if (args.clusterId) {
      const cluster = await ctx.db.get(args.clusterId);
      if (!cluster || cluster.projectId !== location.projectId) {
        throw new Error("Location cluster does not belong to the location's project");
      }
    }
    
    // Remove undefined values
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );
    
    await ctx.db.patch(id, {
      ...cleanUpdateData,
      updatedAt: Date.now(),
    });
    
    return id;
  },
});

// Delete a location
export const remove = mutation({
  args: { id: v.id("locations") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    const location = await ctx.db.get(args.id);
    if (!location) {
      throw new Error("Location not found");
    }
    
    // Validate user owns the parent project
    await validateUserOwnership(ctx, location.projectId, user._id);
    
    const datasetId = location.datasetId;
    
    // Check if location is referenced by vehicles
    const vehiclesUsingLocation = await ctx.db
      .query("vehicles")
      .withIndex("by_location", (q) => q.eq("startLocationId", args.id))
      .collect();
    
    if (vehiclesUsingLocation.length > 0) {
      throw new Error(`Cannot delete location: ${vehiclesUsingLocation.length} vehicles reference this location as start location`);
    }
    
    // Check if location is referenced by jobs
    const jobsUsingLocation = await ctx.db
      .query("jobs")
      .withIndex("by_location", (q) => q.eq("locationId", args.id))
      .collect();
    
    if (jobsUsingLocation.length > 0) {
      throw new Error(`Cannot delete location: ${jobsUsingLocation.length} jobs reference this location`);
    }
    
    // Remove from location clusters
    const clusterMemberships = await ctx.db
      .query("locationClusterMembership")
      .withIndex("by_location", (q) => q.eq("locationId", args.id))
      .collect();
    
    for (const membership of clusterMemberships) {
      await ctx.db.delete(membership._id);
    }
    
    // Delete the location
    await ctx.db.delete(args.id);
    
    // Update dataset location count if dataset is specified
    if (datasetId) {
      const locations = await ctx.db
        .query("locations")
        .withIndex("by_dataset", (q) => q.eq("datasetId", datasetId))
        .collect();
      
      await ctx.db.patch(datasetId, {
        locationCount: locations.length,
        updatedAt: Date.now(),
      });
    }
    
    return args.id;
  },
});

// Bulk import locations from CSV-like data
export const bulkImport = mutation({
  args: {
    projectId: v.id("projects"),
    datasetId: v.optional(v.id("datasets")),
    scenarioId: v.optional(v.id("scenarios")),
    locations: v.array(v.object({
      name: v.string(),
      address: v.optional(v.string()),
      description: v.optional(v.string()),
      locationLon: v.optional(v.number()),
      locationLat: v.optional(v.number()),
      locationType: v.optional(v.string()),
      operatingHours: v.optional(v.string()),
      contactInfo: v.optional(v.string()),
      timezone: v.optional(v.string()),
    })),
    clearExisting: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const now = Date.now();
    
    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id);
    
    // If dataset is provided, validate it belongs to the project
    if (args.datasetId) {
      const dataset = await ctx.db.get(args.datasetId);
      if (!dataset || dataset.projectId !== args.projectId) {
        throw new Error("Dataset does not belong to the specified project");
      }
    }
    
    // Clear existing locations if requested
    if (args.clearExisting && args.datasetId) {
      const existingLocations = await ctx.db
        .query("locations")
        .withIndex("by_dataset", (q) => q.eq("datasetId", args.datasetId))
        .collect();
      
      for (const location of existingLocations) {
        await ctx.db.delete(location._id);
      }
    }
    
    // Insert new locations
    const locationIds = [];
    for (const locationData of args.locations) {
      const locationId = await ctx.db.insert("locations", {
        projectId: args.projectId,
        scenarioId: args.scenarioId,
        datasetId: args.datasetId,
        ...locationData,
        createdAt: now,
        updatedAt: now,
      });
      locationIds.push(locationId);
    }
    
    // Update dataset location count if dataset is specified
    if (args.datasetId) {
      const locations = await ctx.db
        .query("locations")
        .withIndex("by_dataset", (q) => q.eq("datasetId", args.datasetId))
        .collect();
      
      await ctx.db.patch(args.datasetId, {
        locationCount: locations.length,
        updatedAt: now,
      });
    }
    
    return {
      importedCount: locationIds.length,
      locationIds,
    };
  },
});

// Get locations with filtering and pagination
export const listWithFilters = query({
  args: {
    projectId: v.id("projects"),
    datasetId: v.optional(v.id("datasets")),
    scenarioId: v.optional(v.id("scenarios")),
    locationType: v.optional(v.string()),
    clusterId: v.optional(v.id("locationClusters")),
    hasCoordinates: v.optional(v.boolean()),
    searchName: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id);
    
    const query = ctx.db.query("locations").withIndex("by_project", (q) => q.eq("projectId", args.projectId));
    
    const locations = await query.collect();
    
    // Apply filters
    let filteredLocations = locations;
    
    if (args.datasetId) {
      filteredLocations = filteredLocations.filter(l => l.datasetId === args.datasetId);
    }
    
    if (args.scenarioId) {
      filteredLocations = filteredLocations.filter(l => l.scenarioId === args.scenarioId);
    }
    
    if (args.locationType) {
      filteredLocations = filteredLocations.filter(l => l.locationType === args.locationType);
    }
    
    if (args.clusterId) {
      filteredLocations = filteredLocations.filter(l => l.clusterId === args.clusterId);
    }
    
    if (args.hasCoordinates !== undefined) {
      filteredLocations = filteredLocations.filter(l => 
        args.hasCoordinates 
          ? (l.locationLon !== undefined && l.locationLat !== undefined) 
          : (l.locationLon === undefined || l.locationLat === undefined)
      );
    }
    
    if (args.searchName) {
      const searchTerm = args.searchName.toLowerCase();
      filteredLocations = filteredLocations.filter(l => 
        l.name.toLowerCase().includes(searchTerm) ||
        (l.address && l.address.toLowerCase().includes(searchTerm)) ||
        (l.description && l.description.toLowerCase().includes(searchTerm))
      );
    }
    
    // Apply limit
    if (args.limit) {
      filteredLocations = filteredLocations.slice(0, args.limit);
    }
    
    return filteredLocations;
  },
});

// Duplicate locations within or across datasets
export const duplicate = mutation({
  args: {
    locationIds: v.array(v.id("locations")),
    targetDatasetId: v.optional(v.id("datasets")),
    targetScenarioId: v.optional(v.id("scenarios")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const now = Date.now();
    
    const duplicatedIds = [];
    
    for (const locationId of args.locationIds) {
      const originalLocation = await ctx.db.get(locationId);
      if (!originalLocation) {
        continue;
      }
      
      // Validate user owns the parent project
      await validateUserOwnership(ctx, originalLocation.projectId, user._id);
      
      // Create duplicated location
      const duplicatedId = await ctx.db.insert("locations", {
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
        createdAt: now,
        updatedAt: now,
      });
      
      duplicatedIds.push(duplicatedId);
    }
    
    // Update dataset location count if target dataset is specified
    if (args.targetDatasetId) {
      const locations = await ctx.db
        .query("locations")
        .withIndex("by_dataset", (q) => q.eq("datasetId", args.targetDatasetId))
        .collect();
      
      await ctx.db.patch(args.targetDatasetId, {
        locationCount: locations.length,
        updatedAt: now,
      });
    }
    
    return {
      duplicatedCount: duplicatedIds.length,
      locationIds: duplicatedIds,
    };
  },
});

// Get location statistics by dataset
export const getStatsByDataset = query({
  args: { datasetId: v.id("datasets") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // Get dataset to validate project ownership
    const dataset = await ctx.db.get(args.datasetId);
    if (!dataset) {
      throw new Error("Dataset not found");
    }
    
    // Validate user owns the project
    await validateUserOwnership(ctx, dataset.projectId, user._id);
    
    const locations = await ctx.db
      .query("locations")
      .withIndex("by_dataset", (q) => q.eq("datasetId", args.datasetId))
      .collect();
    
    const locationTypes = locations.reduce((acc, l) => {
      const type = l.locationType || "unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const stats = {
      totalLocations: locations.length,
      locationsWithCoordinates: locations.filter(l => l.locationLon !== undefined && l.locationLat !== undefined).length,
      locationsWithAddress: locations.filter(l => l.address).length,
      locationsWithOperatingHours: locations.filter(l => l.operatingHours).length,
      locationsByType: locationTypes,
      clusteredLocations: locations.filter(l => l.clusterId).length,
    };
    
    return stats;
  },
});

// Search locations by coordinates (find nearby locations)
export const findNearby = query({
  args: {
    projectId: v.id("projects"),
    lon: v.number(),
    lat: v.number(),
    radiusKm: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id);
    
    const locations = await ctx.db
      .query("locations")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    
    const radiusKm = args.radiusKm || 10; // Default 10km radius
    const locationsWithDistance = locations
      .filter(l => l.locationLon !== undefined && l.locationLat !== undefined)
      .map(location => {
        // Simple distance calculation (Haversine formula)
        const R = 6371; // Earth's radius in kilometers
        const dLat = (location.locationLat! - args.lat) * Math.PI / 180;
        const dLon = (location.locationLon! - args.lon) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(args.lat * Math.PI / 180) * Math.cos(location.locationLat! * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return {
          ...location,
          distanceKm: distance,
        };
      })
      .filter(l => l.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
    
    // Apply limit
    if (args.limit) {
      return locationsWithDistance.slice(0, args.limit);
    }
    
    return locationsWithDistance;
  },
});