import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, validateUserOwnership } from "./auth";

// Get all vehicles for a specific dataset
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
      .query("vehicles")
      .withIndex("by_dataset", (q) => q.eq("datasetId", args.datasetId))
      .collect();
  },
});

// Get all vehicles for a specific project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id);
    
    return await ctx.db
      .query("vehicles")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// Get a single vehicle by ID
export const getById = query({
  args: { id: v.id("vehicles") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const vehicle = await ctx.db.get(args.id);
    
    if (!vehicle) {
      throw new Error("Vehicle not found");
    }
    
    // Validate user owns the parent project
    await validateUserOwnership(ctx, vehicle.projectId, user._id);
    
    return vehicle;
  },
});

// Create a new vehicle
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    scenarioId: v.optional(v.id("scenarios")),
    datasetId: v.optional(v.id("datasets")),
    description: v.optional(v.string()),
    profile: v.optional(v.string()),
    startLon: v.optional(v.number()),
    startLat: v.optional(v.number()),
    endLon: v.optional(v.number()),
    endLat: v.optional(v.number()),
    startLocationId: v.optional(v.id("locations")),
    endLocationId: v.optional(v.id("locations")),
    capacity: v.optional(v.array(v.number())),
    skills: v.optional(v.array(v.number())),
    twStart: v.optional(v.number()),
    twEnd: v.optional(v.number()),
    speedFactor: v.optional(v.number()),
    maxTasks: v.optional(v.number()),
    maxTravelTime: v.optional(v.number()),
    maxDistance: v.optional(v.number()),
    costFixed: v.optional(v.number()),
    costPerHour: v.optional(v.number()),
    costPerKm: v.optional(v.number()),
    datasetName: v.optional(v.string()),
    datasetVersion: v.optional(v.number()),
    optimizerId: v.optional(v.number()),
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
    
    const vehicleId = await ctx.db.insert("vehicles", {
      ...args,
      optimizerId: args.optimizerId || Math.floor(Math.random() * 1000000),
      updatedAt: now,
    });
    
    // Update dataset vehicle count if dataset is specified
    if (args.datasetId) {
      const vehicles = await ctx.db
        .query("vehicles")
        .withIndex("by_dataset", (q) => q.eq("datasetId", args.datasetId))
        .collect();
      
      await ctx.db.patch(args.datasetId, {
        vehicleCount: vehicles.length,
        updatedAt: now,
      });
    }
    
    return vehicleId;
  },
});

// Update an existing vehicle
export const update = mutation({
  args: {
    id: v.id("vehicles"),
    description: v.optional(v.string()),
    profile: v.optional(v.string()),
    startLon: v.optional(v.number()),
    startLat: v.optional(v.number()),
    endLon: v.optional(v.number()),
    endLat: v.optional(v.number()),
    startLocationId: v.optional(v.id("locations")),
    endLocationId: v.optional(v.id("locations")),
    capacity: v.optional(v.array(v.number())),
    skills: v.optional(v.array(v.number())),
    twStart: v.optional(v.number()),
    twEnd: v.optional(v.number()),
    speedFactor: v.optional(v.number()),
    maxTasks: v.optional(v.number()),
    maxTravelTime: v.optional(v.number()),
    maxDistance: v.optional(v.number()),
    costFixed: v.optional(v.number()),
    costPerHour: v.optional(v.number()),
    costPerKm: v.optional(v.number()),
    datasetName: v.optional(v.string()),
    datasetVersion: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const { id, ...updateData } = args;
    
    const vehicle = await ctx.db.get(id);
    if (!vehicle) {
      throw new Error("Vehicle not found");
    }
    
    // Validate user owns the parent project
    await validateUserOwnership(ctx, vehicle.projectId, user._id);
    
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

// Delete a vehicle
export const remove = mutation({
  args: { id: v.id("vehicles") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    const vehicle = await ctx.db.get(args.id);
    if (!vehicle) {
      throw new Error("Vehicle not found");
    }
    
    // Validate user owns the parent project
    await validateUserOwnership(ctx, vehicle.projectId, user._id);
    
    const datasetId = vehicle.datasetId;
    
    // Delete the vehicle
    await ctx.db.delete(args.id);
    
    // Update dataset vehicle count if dataset is specified
    if (datasetId) {
      const vehicles = await ctx.db
        .query("vehicles")
        .withIndex("by_dataset", (q) => q.eq("datasetId", datasetId))
        .collect();
      
      await ctx.db.patch(datasetId, {
        vehicleCount: vehicles.length,
        updatedAt: Date.now(),
      });
    }
    
    return args.id;
  },
});

// Bulk import vehicles from CSV-like data
export const bulkImport = mutation({
  args: {
    projectId: v.id("projects"),
    datasetId: v.optional(v.id("datasets")),
    scenarioId: v.optional(v.id("scenarios")),
    vehicles: v.array(v.object({
      description: v.optional(v.string()),
      profile: v.optional(v.string()),
      startLon: v.optional(v.number()),
      startLat: v.optional(v.number()),
      endLon: v.optional(v.number()),
      endLat: v.optional(v.number()),
      capacity: v.optional(v.array(v.number())),
      skills: v.optional(v.array(v.number())),
      twStart: v.optional(v.number()),
      twEnd: v.optional(v.number()),
      speedFactor: v.optional(v.number()),
      maxTasks: v.optional(v.number()),
      maxTravelTime: v.optional(v.number()),
      maxDistance: v.optional(v.number()),
      costFixed: v.optional(v.number()),
      costPerHour: v.optional(v.number()),
      costPerKm: v.optional(v.number()),
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
    
    // Clear existing vehicles if requested
    if (args.clearExisting && args.datasetId) {
      const existingVehicles = await ctx.db
        .query("vehicles")
        .withIndex("by_dataset", (q) => q.eq("datasetId", args.datasetId))
        .collect();
      
      for (const vehicle of existingVehicles) {
        await ctx.db.delete(vehicle._id);
      }
    }
    
    // Insert new vehicles
    const vehicleIds = [];
    for (const vehicleData of args.vehicles) {
      const vehicleId = await ctx.db.insert("vehicles", {
        projectId: args.projectId,
        scenarioId: args.scenarioId,
        datasetId: args.datasetId,
        ...vehicleData,
        updatedAt: now,
      });
      vehicleIds.push(vehicleId);
    }
    
    // Update dataset vehicle count if dataset is specified
    if (args.datasetId) {
      const vehicles = await ctx.db
        .query("vehicles")
        .withIndex("by_dataset", (q) => q.eq("datasetId", args.datasetId))
        .collect();
      
      await ctx.db.patch(args.datasetId, {
        vehicleCount: vehicles.length,
        updatedAt: now,
      });
    }
    
    return {
      importedCount: vehicleIds.length,
      vehicleIds,
    };
  },
});

// Get vehicles with filtering and pagination
export const listWithFilters = query({
  args: {
    projectId: v.id("projects"),
    datasetId: v.optional(v.id("datasets")),
    scenarioId: v.optional(v.id("scenarios")),
    profile: v.optional(v.string()),
    hasCapacity: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id);
    
    const query = ctx.db.query("vehicles").withIndex("by_project", (q) => q.eq("projectId", args.projectId));
    
    const vehicles = await query.collect();
    
    // Apply filters
    let filteredVehicles = vehicles;
    
    if (args.datasetId) {
      filteredVehicles = filteredVehicles.filter(v => v.datasetId === args.datasetId);
    }
    
    if (args.scenarioId) {
      filteredVehicles = filteredVehicles.filter(v => v.scenarioId === args.scenarioId);
    }
    
    if (args.profile) {
      filteredVehicles = filteredVehicles.filter(v => v.profile === args.profile);
    }
    
    if (args.hasCapacity !== undefined) {
      filteredVehicles = filteredVehicles.filter(v => 
        args.hasCapacity ? (v.capacity && v.capacity.length > 0) : (!v.capacity || v.capacity.length === 0)
      );
    }
    
    // Apply limit
    if (args.limit) {
      filteredVehicles = filteredVehicles.slice(0, args.limit);
    }
    
    return filteredVehicles;
  },
});

// Duplicate vehicles within or across datasets
export const duplicate = mutation({
  args: {
    vehicleIds: v.array(v.id("vehicles")),
    targetDatasetId: v.optional(v.id("datasets")),
    targetScenarioId: v.optional(v.id("scenarios")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const now = Date.now();
    
    const duplicatedIds = [];
    
    for (const vehicleId of args.vehicleIds) {
      const originalVehicle = await ctx.db.get(vehicleId);
      if (!originalVehicle) {
        continue;
      }
      
      // Validate user owns the parent project
      await validateUserOwnership(ctx, originalVehicle.projectId, user._id);
      
      // Create duplicated vehicle
      const duplicatedId = await ctx.db.insert("vehicles", {
        projectId: originalVehicle.projectId,
        scenarioId: args.targetScenarioId || originalVehicle.scenarioId,
        datasetId: args.targetDatasetId || originalVehicle.datasetId,
        description: originalVehicle.description ? `${originalVehicle.description} (Copy)` : undefined,
        profile: originalVehicle.profile,
        startLon: originalVehicle.startLon,
        startLat: originalVehicle.startLat,
        endLon: originalVehicle.endLon,
        endLat: originalVehicle.endLat,
        startLocationId: originalVehicle.startLocationId,
        endLocationId: originalVehicle.endLocationId,
        capacity: originalVehicle.capacity,
        skills: originalVehicle.skills,
        twStart: originalVehicle.twStart,
        twEnd: originalVehicle.twEnd,
        speedFactor: originalVehicle.speedFactor,
        maxTasks: originalVehicle.maxTasks,
        maxTravelTime: originalVehicle.maxTravelTime,
        maxDistance: originalVehicle.maxDistance,
        costFixed: originalVehicle.costFixed,
        costPerHour: originalVehicle.costPerHour,
        costPerKm: originalVehicle.costPerKm,
        datasetName: originalVehicle.datasetName,
        datasetVersion: originalVehicle.datasetVersion,
        updatedAt: now,
      });
      
      duplicatedIds.push(duplicatedId);
    }
    
    // Update dataset vehicle count if target dataset is specified
    if (args.targetDatasetId) {
      const vehicles = await ctx.db
        .query("vehicles")
        .withIndex("by_dataset", (q) => q.eq("datasetId", args.targetDatasetId))
        .collect();
      
      await ctx.db.patch(args.targetDatasetId, {
        vehicleCount: vehicles.length,
        updatedAt: now,
      });
    }
    
    return {
      duplicatedCount: duplicatedIds.length,
      vehicleIds: duplicatedIds,
    };
  },
});