import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Migration function to clean up legacy createdAt fields from all tables
export const cleanupLegacyData = mutation({
  args: {},
  handler: async (ctx) => {
    const results = {
      projects: 0,
      scenarios: 0,
      datasets: 0,
      jobs: 0,
      locations: 0,
      vehicles: 0,
      routes: 0,
    };

    // Clean up projects table
    const projects = await ctx.db.query("projects").collect();
    for (const project of projects) {
      if ((project as any).createdAt !== undefined) {
        const { createdAt, ...cleanProject } = project as any;
        await ctx.db.replace(project._id, cleanProject);
        results.projects++;
      }
    }

    // Clean up scenarios table
    const scenarios = await ctx.db.query("scenarios").collect();
    for (const scenario of scenarios) {
      if ((scenario as any).createdAt !== undefined) {
        const { createdAt, ...cleanScenario } = scenario as any;
        await ctx.db.replace(scenario._id, cleanScenario);
        results.scenarios++;
      }
    }

    // Clean up datasets table
    const datasets = await ctx.db.query("datasets").collect();
    for (const dataset of datasets) {
      if ((dataset as any).createdAt !== undefined) {
        const { createdAt, ...cleanDataset } = dataset as any;
        await ctx.db.replace(dataset._id, cleanDataset);
        results.datasets++;
      }
    }

    // Clean up jobs table
    const jobs = await ctx.db.query("jobs").collect();
    for (const job of jobs) {
      if ((job as any).createdAt !== undefined) {
        const { createdAt, ...cleanJob } = job as any;
        await ctx.db.replace(job._id, cleanJob);
        results.jobs++;
      }
    }

    // Clean up locations table
    const locations = await ctx.db.query("locations").collect();
    for (const location of locations) {
      if ((location as any).createdAt !== undefined) {
        const { createdAt, ...cleanLocation } = location as any;
        await ctx.db.replace(location._id, cleanLocation);
        results.locations++;
      }
    }

    // Clean up vehicles table
    const vehicles = await ctx.db.query("vehicles").collect();
    for (const vehicle of vehicles) {
      if ((vehicle as any).createdAt !== undefined) {
        const { createdAt, ...cleanVehicle } = vehicle as any;
        await ctx.db.replace(vehicle._id, cleanVehicle);
        results.vehicles++;
      }
    }

    // Clean up routes table
    const routes = await ctx.db.query("routes").collect();
    for (const route of routes) {
      if ((route as any).createdAt !== undefined) {
        const { createdAt, ...cleanRoute } = route as any;
        await ctx.db.replace(route._id, cleanRoute);
        results.routes++;
      }
    }

    return results;
  },
});

// Migration function to add missing optimizerId fields
export const addMissingOptimizerIds = mutation({
  args: {},
  handler: async (ctx) => {
    const results = {
      jobs: 0,
      vehicles: 0,
      shipments: 0,
    };

    // Add optimizerId to jobs
    const jobs = await ctx.db.query("jobs").collect();
    for (const job of jobs) {
      if ((job as any).optimizerId === undefined) {
        await ctx.db.patch(job._id, { 
          optimizerId: Math.floor(Math.random() * 1000000) 
        });
        results.jobs++;
      }
    }

    // Add optimizerId to vehicles
    const vehicles = await ctx.db.query("vehicles").collect();
    for (const vehicle of vehicles) {
      if ((vehicle as any).optimizerId === undefined) {
        await ctx.db.patch(vehicle._id, { 
          optimizerId: Math.floor(Math.random() * 1000000) 
        });
        results.vehicles++;
      }
    }

    // Add optimizerId to shipments if table exists
    try {
      const shipments = await ctx.db.query("shipments").collect();
      for (const shipment of shipments) {
        if ((shipment as any).optimizerId === undefined) {
          await ctx.db.patch(shipment._id, { 
            optimizerId: Math.floor(Math.random() * 1000000) 
          });
          results.shipments++;
        }
      }
    } catch (error) {
      // Shipments table might not exist yet
    }

    return results;
  },
});