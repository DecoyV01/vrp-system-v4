import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, validateUserOwnership } from "./auth";

// Get all scenarios for a specific project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id);
    
    return await ctx.db
      .query("scenarios")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// Get a single scenario by ID
export const getById = query({
  args: { id: v.id("scenarios") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const scenario = await ctx.db.get(args.id);
    
    if (!scenario) {
      throw new Error("Scenario not found");
    }
    
    // Validate user owns the parent project
    await validateUserOwnership(ctx, scenario.projectId, user._id);
    
    return scenario;
  },
});

// Create a new scenario
export const create = mutation({
  args: {
    projectId: v.id("projects"),
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
    const user = await getCurrentUser(ctx);
    const now = Date.now();
    
    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id);
    
    const scenarioId = await ctx.db.insert("scenarios", {
      ...args,
      createdAt: now,
      updatedAt: now,
      optimizationCount: 0,
    });
    
    return scenarioId;
  },
});

// Update an existing scenario
export const update = mutation({
  args: {
    id: v.id("scenarios"),
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
    const user = await getCurrentUser(ctx);
    const { id, ...updateData } = args;
    
    const scenario = await ctx.db.get(id);
    if (!scenario) {
      throw new Error("Scenario not found");
    }
    
    // Validate user owns the parent project
    await validateUserOwnership(ctx, scenario.projectId, user._id);
    
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

// Delete a scenario (also deletes all related data)
export const remove = mutation({
  args: { id: v.id("scenarios") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    const scenario = await ctx.db.get(args.id);
    if (!scenario) {
      throw new Error("Scenario not found");
    }
    
    // Validate user owns the parent project
    await validateUserOwnership(ctx, scenario.projectId, user._id);
    
    // Delete related datasets
    const datasets = await ctx.db
      .query("datasets")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.id))
      .collect();
    
    for (const dataset of datasets) {
      await ctx.db.delete(dataset._id);
    }
    
    // Delete related optimization runs
    const optimizationRuns = await ctx.db
      .query("optimizationRuns")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.id))
      .collect();
    
    for (const run of optimizationRuns) {
      await ctx.db.delete(run._id);
    }
    
    // Delete vehicles assigned to this scenario
    const vehicles = await ctx.db
      .query("vehicles")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.id))
      .collect();
    
    for (const vehicle of vehicles) {
      await ctx.db.delete(vehicle._id);
    }
    
    // Delete jobs assigned to this scenario
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.id))
      .collect();
    
    for (const job of jobs) {
      await ctx.db.delete(job._id);
    }
    
    // Delete locations assigned to this scenario
    const locations = await ctx.db
      .query("locations")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.id))
      .collect();
    
    for (const location of locations) {
      await ctx.db.delete(location._id);
    }
    
    // Finally delete the scenario itself
    await ctx.db.delete(args.id);
    
    return args.id;
  },
});

// Get scenario statistics
export const getStats = query({
  args: { id: v.id("scenarios") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    const scenario = await ctx.db.get(args.id);
    if (!scenario) {
      throw new Error("Scenario not found");
    }
    
    // Validate user owns the parent project
    await validateUserOwnership(ctx, scenario.projectId, user._id);
    
    // Count related entities
    const datasets = await ctx.db
      .query("datasets")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.id))
      .collect();
    
    const optimizationRuns = await ctx.db
      .query("optimizationRuns")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.id))
      .collect();
    
    const vehicles = await ctx.db
      .query("vehicles")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.id))
      .collect();
    
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.id))
      .collect();
    
    const locations = await ctx.db
      .query("locations")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.id))
      .collect();
    
    return {
      datasetCount: datasets.length,
      optimizationRunCount: optimizationRuns.length,
      vehicleCount: vehicles.length,
      jobCount: jobs.length,
      locationCount: locations.length,
      lastOptimizedAt: scenario.lastOptimizedAt,
      optimizationCount: scenario.optimizationCount || 0,
    };
  },
});

// Update optimization statistics
export const updateOptimizationStats = mutation({
  args: {
    id: v.id("scenarios"),
    incrementCount: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    const scenario = await ctx.db.get(args.id);
    if (!scenario) {
      throw new Error("Scenario not found");
    }
    
    // Validate user owns the parent project
    await validateUserOwnership(ctx, scenario.projectId, user._id);
    
    const now = Date.now();
    const updates: any = {
      lastOptimizedAt: now,
      updatedAt: now,
    };
    
    if (args.incrementCount) {
      updates.optimizationCount = (scenario.optimizationCount || 0) + 1;
    }
    
    await ctx.db.patch(args.id, updates);
    
    return args.id;
  },
});

// Clone a scenario
export const clone = mutation({
  args: {
    id: v.id("scenarios"),
    newName: v.string(),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    const originalScenario = await ctx.db.get(args.id);
    if (!originalScenario) {
      throw new Error("Scenario not found");
    }
    
    // Validate user owns the original scenario's project
    await validateUserOwnership(ctx, originalScenario.projectId, user._id);
    
    const targetProjectId = args.projectId || originalScenario.projectId;
    
    // If different project, validate user owns the target project too
    if (targetProjectId !== originalScenario.projectId) {
      await validateUserOwnership(ctx, targetProjectId, user._id);
    }
    
    const now = Date.now();
    
    // Create the cloned scenario
    const clonedScenarioId = await ctx.db.insert("scenarios", {
      projectId: targetProjectId,
      name: args.newName,
      description: originalScenario.description,
      startDate: originalScenario.startDate,
      endDate: originalScenario.endDate,
      planningHorizonDays: originalScenario.planningHorizonDays,
      optimizationObjective: originalScenario.optimizationObjective,
      optimizationParameters: originalScenario.optimizationParameters,
      status: "draft",
      tags: originalScenario.tags,
      isActive: false,
      createdAt: now,
      updatedAt: now,
      optimizationCount: 0,
    });
    
    return clonedScenarioId;
  },
});