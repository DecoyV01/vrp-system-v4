import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, validateUserOwnership } from "./auth";

// Get all jobs for a specific dataset
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
      .query("jobs")
      .withIndex("by_dataset", (q) => q.eq("datasetId", args.datasetId))
      .collect();
  },
});

// Get all jobs for a specific project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id);
    
    return await ctx.db
      .query("jobs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// Get a single job by ID
export const getById = query({
  args: { id: v.id("jobs") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const job = await ctx.db.get(args.id);
    
    if (!job) {
      throw new Error("Job not found");
    }
    
    // Validate user owns the parent project
    await validateUserOwnership(ctx, job.projectId, user._id);
    
    return job;
  },
});

// Create a new job
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    scenarioId: v.optional(v.id("scenarios")),
    datasetId: v.optional(v.id("datasets")),
    locationId: v.optional(v.id("locations")),
    description: v.optional(v.string()),
    locationLon: v.optional(v.number()),
    locationLat: v.optional(v.number()),
    setup: v.optional(v.number()),
    service: v.optional(v.number()),
    delivery: v.optional(v.array(v.number())),
    pickup: v.optional(v.array(v.number())),
    skills: v.optional(v.array(v.number())),
    priority: v.optional(v.number()),
    timeWindows: v.optional(v.array(v.object({
      start: v.number(),
      end: v.number(),
    }))),
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
    
    // If location is provided, validate it belongs to the project
    if (args.locationId) {
      const location = await ctx.db.get(args.locationId);
      if (!location || location.projectId !== args.projectId) {
        throw new Error("Location does not belong to the specified project");
      }
    }
    
    const jobId = await ctx.db.insert("jobs", {
      ...args,
      updatedAt: now,
    });
    
    // Update dataset job count if dataset is specified
    if (args.datasetId) {
      const jobs = await ctx.db
        .query("jobs")
        .withIndex("by_dataset", (q) => q.eq("datasetId", args.datasetId))
        .collect();
      
      await ctx.db.patch(args.datasetId, {
        jobCount: jobs.length,
        updatedAt: now,
      });
    }
    
    return jobId;
  },
});

// Update an existing job
export const update = mutation({
  args: {
    id: v.id("jobs"),
    locationId: v.optional(v.id("locations")),
    description: v.optional(v.string()),
    locationLon: v.optional(v.number()),
    locationLat: v.optional(v.number()),
    setup: v.optional(v.number()),
    service: v.optional(v.number()),
    delivery: v.optional(v.array(v.number())),
    pickup: v.optional(v.array(v.number())),
    skills: v.optional(v.array(v.number())),
    priority: v.optional(v.number()),
    timeWindows: v.optional(v.array(v.object({
      start: v.number(),
      end: v.number(),
    }))),
    datasetName: v.optional(v.string()),
    datasetVersion: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const { id, ...updateData } = args;
    
    const job = await ctx.db.get(id);
    if (!job) {
      throw new Error("Job not found");
    }
    
    // Validate user owns the parent project
    await validateUserOwnership(ctx, job.projectId, user._id);
    
    // If location is being updated, validate it belongs to the project
    if (args.locationId) {
      const location = await ctx.db.get(args.locationId);
      if (!location || location.projectId !== job.projectId) {
        throw new Error("Location does not belong to the job's project");
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

// Delete a job
export const remove = mutation({
  args: { id: v.id("jobs") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    const job = await ctx.db.get(args.id);
    if (!job) {
      throw new Error("Job not found");
    }
    
    // Validate user owns the parent project
    await validateUserOwnership(ctx, job.projectId, user._id);
    
    const datasetId = job.datasetId;
    
    // Delete the job
    await ctx.db.delete(args.id);
    
    // Update dataset job count if dataset is specified
    if (datasetId) {
      const jobs = await ctx.db
        .query("jobs")
        .withIndex("by_dataset", (q) => q.eq("datasetId", datasetId))
        .collect();
      
      await ctx.db.patch(datasetId, {
        jobCount: jobs.length,
        updatedAt: Date.now(),
      });
    }
    
    return args.id;
  },
});

// Bulk import jobs from CSV-like data
export const bulkImport = mutation({
  args: {
    projectId: v.id("projects"),
    datasetId: v.optional(v.id("datasets")),
    scenarioId: v.optional(v.id("scenarios")),
    jobs: v.array(v.object({
      description: v.optional(v.string()),
      locationLon: v.optional(v.number()),
      locationLat: v.optional(v.number()),
      setup: v.optional(v.number()),
      service: v.optional(v.number()),
      delivery: v.optional(v.array(v.number())),
      pickup: v.optional(v.array(v.number())),
      skills: v.optional(v.array(v.number())),
      priority: v.optional(v.number()),
      timeWindows: v.optional(v.array(v.object({
        start: v.number(),
        end: v.number(),
      }))),
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
    
    // Clear existing jobs if requested
    if (args.clearExisting && args.datasetId) {
      const existingJobs = await ctx.db
        .query("jobs")
        .withIndex("by_dataset", (q) => q.eq("datasetId", args.datasetId))
        .collect();
      
      for (const job of existingJobs) {
        await ctx.db.delete(job._id);
      }
    }
    
    // Insert new jobs
    const jobIds = [];
    for (const jobData of args.jobs) {
      const jobId = await ctx.db.insert("jobs", {
        projectId: args.projectId,
        scenarioId: args.scenarioId,
        datasetId: args.datasetId,
        ...jobData,
        updatedAt: now,
      });
      jobIds.push(jobId);
    }
    
    // Update dataset job count if dataset is specified
    if (args.datasetId) {
      const jobs = await ctx.db
        .query("jobs")
        .withIndex("by_dataset", (q) => q.eq("datasetId", args.datasetId))
        .collect();
      
      await ctx.db.patch(args.datasetId, {
        jobCount: jobs.length,
        updatedAt: now,
      });
    }
    
    return {
      importedCount: jobIds.length,
      jobIds,
    };
  },
});

// Get jobs with filtering and pagination
export const listWithFilters = query({
  args: {
    projectId: v.id("projects"),
    datasetId: v.optional(v.id("datasets")),
    scenarioId: v.optional(v.id("scenarios")),
    priority: v.optional(v.number()),
    hasTimeWindows: v.optional(v.boolean()),
    hasDelivery: v.optional(v.boolean()),
    hasPickup: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // Validate user owns the project
    await validateUserOwnership(ctx, args.projectId, user._id);
    
    const query = ctx.db.query("jobs").withIndex("by_project", (q) => q.eq("projectId", args.projectId));
    
    const jobs = await query.collect();
    
    // Apply filters
    let filteredJobs = jobs;
    
    if (args.datasetId) {
      filteredJobs = filteredJobs.filter(j => j.datasetId === args.datasetId);
    }
    
    if (args.scenarioId) {
      filteredJobs = filteredJobs.filter(j => j.scenarioId === args.scenarioId);
    }
    
    if (args.priority !== undefined) {
      filteredJobs = filteredJobs.filter(j => j.priority === args.priority);
    }
    
    if (args.hasTimeWindows !== undefined) {
      filteredJobs = filteredJobs.filter(j => 
        args.hasTimeWindows ? (j.timeWindows && j.timeWindows.length > 0) : (!j.timeWindows || j.timeWindows.length === 0)
      );
    }
    
    if (args.hasDelivery !== undefined) {
      filteredJobs = filteredJobs.filter(j => 
        args.hasDelivery ? (j.delivery && j.delivery.length > 0) : (!j.delivery || j.delivery.length === 0)
      );
    }
    
    if (args.hasPickup !== undefined) {
      filteredJobs = filteredJobs.filter(j => 
        args.hasPickup ? (j.pickup && j.pickup.length > 0) : (!j.pickup || j.pickup.length === 0)
      );
    }
    
    // Apply limit
    if (args.limit) {
      filteredJobs = filteredJobs.slice(0, args.limit);
    }
    
    return filteredJobs;
  },
});

// Duplicate jobs within or across datasets
export const duplicate = mutation({
  args: {
    jobIds: v.array(v.id("jobs")),
    targetDatasetId: v.optional(v.id("datasets")),
    targetScenarioId: v.optional(v.id("scenarios")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const now = Date.now();
    
    const duplicatedIds = [];
    
    for (const jobId of args.jobIds) {
      const originalJob = await ctx.db.get(jobId);
      if (!originalJob) {
        continue;
      }
      
      // Validate user owns the parent project
      await validateUserOwnership(ctx, originalJob.projectId, user._id);
      
      // Create duplicated job
      const duplicatedId = await ctx.db.insert("jobs", {
        projectId: originalJob.projectId,
        scenarioId: args.targetScenarioId || originalJob.scenarioId,
        datasetId: args.targetDatasetId || originalJob.datasetId,
        locationId: originalJob.locationId,
        description: originalJob.description ? `${originalJob.description} (Copy)` : undefined,
        locationLon: originalJob.locationLon,
        locationLat: originalJob.locationLat,
        setup: originalJob.setup,
        service: originalJob.service,
        delivery: originalJob.delivery,
        pickup: originalJob.pickup,
        skills: originalJob.skills,
        priority: originalJob.priority,
        timeWindows: originalJob.timeWindows,
        datasetName: originalJob.datasetName,
        datasetVersion: originalJob.datasetVersion,
        updatedAt: now,
      });
      
      duplicatedIds.push(duplicatedId);
    }
    
    // Update dataset job count if target dataset is specified
    if (args.targetDatasetId) {
      const jobs = await ctx.db
        .query("jobs")
        .withIndex("by_dataset", (q) => q.eq("datasetId", args.targetDatasetId))
        .collect();
      
      await ctx.db.patch(args.targetDatasetId, {
        jobCount: jobs.length,
        updatedAt: now,
      });
    }
    
    return {
      duplicatedCount: duplicatedIds.length,
      jobIds: duplicatedIds,
    };
  },
});

// Get job statistics by dataset
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
    
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_dataset", (q) => q.eq("datasetId", args.datasetId))
      .collect();
    
    const stats = {
      totalJobs: jobs.length,
      jobsWithTimeWindows: jobs.filter(j => j.timeWindows && j.timeWindows.length > 0).length,
      jobsWithDelivery: jobs.filter(j => j.delivery && j.delivery.length > 0).length,
      jobsWithPickup: jobs.filter(j => j.pickup && j.pickup.length > 0).length,
      jobsWithSkills: jobs.filter(j => j.skills && j.skills.length > 0).length,
      averagePriority: jobs.filter(j => j.priority !== undefined).length > 0 
        ? jobs.filter(j => j.priority !== undefined).reduce((sum, j) => sum + j.priority!, 0) / jobs.filter(j => j.priority !== undefined).length 
        : 0,
      totalDeliveryQuantity: jobs.reduce((sum, j) => sum + (j.delivery?.reduce((s, d) => s + d, 0) || 0), 0),
      totalPickupQuantity: jobs.reduce((sum, j) => sum + (j.pickup?.reduce((s, p) => s + p, 0) || 0), 0),
    };
    
    return stats;
  },
});