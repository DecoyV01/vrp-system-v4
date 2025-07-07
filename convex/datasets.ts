import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, validateUserOwnership } from "./auth";

// Get all datasets for a specific project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id);
    
    return await ctx.db
      .query("datasets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// Get all datasets for a specific scenario
export const listByScenario = query({
  args: { scenarioId: v.id("scenarios") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // Get scenario to validate project ownership
    const scenario = await ctx.db.get(args.scenarioId);
    if (!scenario) {
      throw new Error("Scenario not found");
    }
    
    // Validate user owns the project
    await validateUserOwnership(ctx, scenario.projectId, user._id);
    
    return await ctx.db
      .query("datasets")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.scenarioId))
      .collect();
  },
});

// Get a single dataset by ID
export const getById = query({
  args: { id: v.id("datasets") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const dataset = await ctx.db.get(args.id);
    
    if (!dataset) {
      throw new Error("Dataset not found");
    }
    
    // Validate user owns the parent project
    await validateUserOwnership(ctx, dataset.projectId, user._id);
    
    return dataset;
  },
});

// Create a new dataset
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    scenarioId: v.optional(v.id("scenarios")),
    name: v.string(),
    version: v.optional(v.number()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    createdFromDatasetId: v.optional(v.id("datasets")),
    isBaseline: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    datasetType: v.optional(v.string()),
    versionNote: v.optional(v.string()),
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
    
    // Auto-increment version if not provided
    let version = args.version;
    if (!version) {
      const existingDatasets = await ctx.db
        .query("datasets")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect();
      
      const maxVersion = Math.max(0, ...existingDatasets.map(d => d.version));
      version = maxVersion + 1;
    }
    
    const datasetId = await ctx.db.insert("datasets", {
      ...args,
      version,
      updatedAt: now,
      createdBy: user._id,
      vehicleCount: 0,
      jobCount: 0,
      locationCount: 0,
      optimizationRunCount: 0,
      optimizationCount: 0,
      entityCounts: {
        vehicles: 0,
        jobs: 0,
        locations: 0,
      },
    });
    
    return datasetId;
  },
});

// Update an existing dataset
export const update = mutation({
  args: {
    id: v.id("datasets"),
    name: v.optional(v.string()),
    scenarioId: v.optional(v.id("scenarios")),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    isBaseline: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    datasetType: v.optional(v.string()),
    versionNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const { id, ...updateData } = args;
    
    const dataset = await ctx.db.get(id);
    if (!dataset) {
      throw new Error("Dataset not found");
    }
    
    // Validate user owns the parent project
    await validateUserOwnership(ctx, dataset.projectId, user._id);
    
    // If scenario is being updated, validate it belongs to the project
    if (args.scenarioId) {
      const scenario = await ctx.db.get(args.scenarioId);
      if (!scenario || scenario.projectId !== dataset.projectId) {
        throw new Error("Scenario does not belong to the dataset's project");
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

// Delete a dataset (also deletes all related data)
export const remove = mutation({
  args: { id: v.id("datasets") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    const dataset = await ctx.db.get(args.id);
    if (!dataset) {
      throw new Error("Dataset not found");
    }
    
    // Validate user owns the parent project
    await validateUserOwnership(ctx, dataset.projectId, user._id);
    
    // Delete related vehicles
    const vehicles = await ctx.db
      .query("vehicles")
      .withIndex("by_dataset", (q) => q.eq("datasetId", args.id))
      .collect();
    
    for (const vehicle of vehicles) {
      await ctx.db.delete(vehicle._id);
    }
    
    // Delete related jobs
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_dataset", (q) => q.eq("datasetId", args.id))
      .collect();
    
    for (const job of jobs) {
      await ctx.db.delete(job._id);
    }
    
    // Delete related locations
    const locations = await ctx.db
      .query("locations")
      .withIndex("by_dataset", (q) => q.eq("datasetId", args.id))
      .collect();
    
    for (const location of locations) {
      await ctx.db.delete(location._id);
    }
    
    // Delete related optimization run settings
    const optimizationSettings = await ctx.db
      .query("optimizationRunSettings")
      .withIndex("by_dataset", (q) => q.eq("datasetId", args.id))
      .collect();
    
    for (const settings of optimizationSettings) {
      await ctx.db.delete(settings._id);
    }
    
    // Delete related optimization runs
    const optimizationRuns = await ctx.db
      .query("optimizationRuns")
      .withIndex("by_dataset", (q) => q.eq("datasetId", args.id))
      .collect();
    
    for (const run of optimizationRuns) {
      await ctx.db.delete(run._id);
    }
    
    // Finally delete the dataset itself
    await ctx.db.delete(args.id);
    
    return args.id;
  },
});

// Get dataset statistics
export const getStats = query({
  args: { id: v.id("datasets") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    const dataset = await ctx.db.get(args.id);
    if (!dataset) {
      throw new Error("Dataset not found");
    }
    
    // Validate user owns the parent project
    await validateUserOwnership(ctx, dataset.projectId, user._id);
    
    // Count related entities
    const vehicles = await ctx.db
      .query("vehicles")
      .withIndex("by_dataset", (q) => q.eq("datasetId", args.id))
      .collect();
    
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_dataset", (q) => q.eq("datasetId", args.id))
      .collect();
    
    const locations = await ctx.db
      .query("locations")
      .withIndex("by_dataset", (q) => q.eq("datasetId", args.id))
      .collect();
    
    const optimizationRuns = await ctx.db
      .query("optimizationRuns")
      .withIndex("by_dataset", (q) => q.eq("datasetId", args.id))
      .collect();
    
    const routes = await ctx.db
      .query("routes")
      .withIndex("by_project", (q) => q.eq("projectId", dataset.projectId))
      .collect();
    
    return {
      vehicleCount: vehicles.length,
      jobCount: jobs.length,
      locationCount: locations.length,
      optimizationRunCount: optimizationRuns.length,
      routeCount: routes.length,
      lastOptimizationAt: dataset.lastOptimizationAt,
      entityCounts: {
        vehicles: vehicles.length,
        jobs: jobs.length,
        locations: locations.length,
      },
    };
  },
});

// Update entity counts (called when entities are added/removed)
export const updateEntityCounts = mutation({
  args: {
    id: v.id("datasets"),
    vehicleCount: v.optional(v.number()),
    jobCount: v.optional(v.number()),
    locationCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const { id, ...counts } = args;
    
    const dataset = await ctx.db.get(id);
    if (!dataset) {
      throw new Error("Dataset not found");
    }
    
    // Validate user owns the parent project
    await validateUserOwnership(ctx, dataset.projectId, user._id);
    
    // Update counts and entity counts object
    const updates: any = {
      updatedAt: Date.now(),
    };
    
    if (counts.vehicleCount !== undefined) {
      updates.vehicleCount = counts.vehicleCount;
    }
    if (counts.jobCount !== undefined) {
      updates.jobCount = counts.jobCount;
    }
    if (counts.locationCount !== undefined) {
      updates.locationCount = counts.locationCount;
    }
    
    // Update the entityCounts object
    const currentEntityCounts = dataset.entityCounts || { vehicles: 0, jobs: 0, locations: 0 };
    updates.entityCounts = {
      vehicles: counts.vehicleCount ?? currentEntityCounts.vehicles,
      jobs: counts.jobCount ?? currentEntityCounts.jobs,
      locations: counts.locationCount ?? currentEntityCounts.locations,
    };
    
    await ctx.db.patch(id, updates);
    
    return id;
  },
});

// Clone a dataset
export const clone = mutation({
  args: {
    id: v.id("datasets"),
    newName: v.string(),
    newVersion: v.optional(v.number()),
    scenarioId: v.optional(v.id("scenarios")),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    const originalDataset = await ctx.db.get(args.id);
    if (!originalDataset) {
      throw new Error("Dataset not found");
    }
    
    // Validate user owns the original dataset's project
    await validateUserOwnership(ctx, originalDataset.projectId, user._id);
    
    const targetProjectId = args.projectId || originalDataset.projectId;
    
    // If different project, validate user owns the target project too
    if (targetProjectId !== originalDataset.projectId) {
      await validateUserOwnership(ctx, targetProjectId, user._id);
    }
    
    // Auto-increment version if not provided
    let version = args.newVersion;
    if (!version) {
      const existingDatasets = await ctx.db
        .query("datasets")
        .withIndex("by_project", (q) => q.eq("projectId", targetProjectId))
        .collect();
      
      const maxVersion = Math.max(0, ...existingDatasets.map(d => d.version));
      version = maxVersion + 1;
    }
    
    const now = Date.now();
    
    // Create the cloned dataset
    const clonedDatasetId = await ctx.db.insert("datasets", {
      projectId: targetProjectId,
      scenarioId: args.scenarioId,
      name: args.newName,
      version,
      description: originalDataset.description,
      status: "draft",
      createdFromDatasetId: args.id,
      isBaseline: false,
      tags: originalDataset.tags,
      datasetType: originalDataset.datasetType,
      versionNote: `Cloned from ${originalDataset.name} v${originalDataset.version}`,
      updatedAt: now,
      createdBy: user._id,
      vehicleCount: 0,
      jobCount: 0,
      locationCount: 0,
      optimizationRunCount: 0,
      optimizationCount: 0,
      entityCounts: {
        vehicles: 0,
        jobs: 0,
        locations: 0,
      },
    });
    
    return clonedDatasetId;
  },
});

// Archive a dataset
export const archive = mutation({
  args: { id: v.id("datasets") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    const dataset = await ctx.db.get(args.id);
    if (!dataset) {
      throw new Error("Dataset not found");
    }
    
    // Validate user owns the parent project
    await validateUserOwnership(ctx, dataset.projectId, user._id);
    
    await ctx.db.patch(args.id, {
      status: "archived",
      archivedAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return args.id;
  },
});

