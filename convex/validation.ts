import { z } from "zod";

// Project validation schemas
export const projectCreateSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Project name too long"),
  description: z.string().max(1000, "Description too long").optional(),
  currency: z.string().length(3, "Currency must be 3 characters").optional(),
  projectType: z.string().max(50, "Project type too long").optional(),
  industry: z.string().max(50, "Industry too long").optional(),
  geographicRegion: z.string().max(100, "Geographic region too long").optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  estimatedVehicles: z.number().int().min(0, "Estimated vehicles must be non-negative").optional(),
  estimatedJobs: z.number().int().min(0, "Estimated jobs must be non-negative").optional(),
  planningHorizonDays: z.number().int().min(1, "Planning horizon must be at least 1 day").max(365, "Planning horizon too long").optional(),
  contactPerson: z.string().max(100, "Contact person name too long").optional(),
  contactEmail: z.string().email("Invalid email format").optional(),
  contactPhone: z.string().max(20, "Phone number too long").optional(),
  tags: z.array(z.string().max(50, "Tag too long")).max(10, "Too many tags").optional(),
  notes: z.string().max(2000, "Notes too long").optional(),
});

// Scenario validation schemas
export const scenarioCreateSchema = z.object({
  name: z.string().min(1, "Scenario name is required").max(100, "Scenario name too long"),
  description: z.string().max(1000, "Description too long").optional(),
  startDate: z.number().int().min(0, "Invalid start date").optional(),
  endDate: z.number().int().min(0, "Invalid end date").optional(),
  planningHorizonDays: z.number().int().min(1, "Planning horizon must be at least 1 day").max(365, "Planning horizon too long").optional(),
  optimizationObjective: z.enum(["minimize_cost", "minimize_distance", "minimize_duration", "maximize_service_level"]).optional(),
  optimizationParameters: z.record(z.any()).optional(),
  status: z.enum(["draft", "active", "completed", "archived"]).optional(),
  tags: z.array(z.string().max(50, "Tag too long")).max(10, "Too many tags").optional(),
  isActive: z.boolean().optional(),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return data.endDate > data.startDate;
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

// Dataset validation schemas
export const datasetCreateSchema = z.object({
  name: z.string().min(1, "Dataset name is required").max(100, "Dataset name too long"),
  version: z.number().int().min(1, "Version must be at least 1").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  isBaseline: z.boolean().optional(),
  tags: z.array(z.string().max(50, "Tag too long")).max(10, "Too many tags").optional(),
  datasetType: z.enum(["baseline", "variant", "test", "production"]).optional(),
  versionNote: z.string().max(500, "Version note too long").optional(),
});

// Vehicle validation schemas
export const vehicleCreateSchema = z.object({
  description: z.string().max(200, "Description too long").optional(),
  profile: z.enum(["car", "truck", "van", "bike", "walking", "motorcycle"]).optional(),
  startLon: z.number().min(-180, "Invalid longitude").max(180, "Invalid longitude").optional(),
  startLat: z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude").optional(),
  endLon: z.number().min(-180, "Invalid longitude").max(180, "Invalid longitude").optional(),
  endLat: z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude").optional(),
  capacity: z.array(z.number().min(0, "Capacity must be non-negative")).max(10, "Too many capacity dimensions").optional(),
  skills: z.array(z.number().int().min(0, "Skill ID must be non-negative")).max(50, "Too many skills").optional(),
  twStart: z.number().int().min(0, "Time window start must be non-negative").optional(),
  twEnd: z.number().int().min(0, "Time window end must be non-negative").optional(),
  speedFactor: z.number().min(0.1, "Speed factor too low").max(10, "Speed factor too high").optional(),
  maxTasks: z.number().int().min(1, "Max tasks must be at least 1").max(1000, "Max tasks too high").optional(),
  maxTravelTime: z.number().int().min(0, "Max travel time must be non-negative").optional(),
  maxDistance: z.number().min(0, "Max distance must be non-negative").optional(),
  costFixed: z.number().min(0, "Fixed cost must be non-negative").optional(),
  costPerHour: z.number().min(0, "Hourly cost must be non-negative").optional(),
  costPerKm: z.number().min(0, "Per-km cost must be non-negative").optional(),
  datasetName: z.string().max(100, "Dataset name too long").optional(),
  datasetVersion: z.number().int().min(1, "Dataset version must be at least 1").optional(),
}).refine(data => {
  if (data.twStart !== undefined && data.twEnd !== undefined) {
    return data.twEnd > data.twStart;
  }
  return true;
}, {
  message: "Time window end must be after start",
  path: ["twEnd"],
}).refine(data => {
  if (data.startLon !== undefined && data.startLat !== undefined) {
    return true; // Both coordinates provided
  }
  if (data.startLon === undefined && data.startLat === undefined) {
    return true; // Neither coordinate provided
  }
  return false; // Only one coordinate provided
}, {
  message: "Both longitude and latitude must be provided together",
  path: ["startLon"],
});

// Job validation schemas
export const jobCreateSchema = z.object({
  description: z.string().max(200, "Description too long").optional(),
  locationLon: z.number().min(-180, "Invalid longitude").max(180, "Invalid longitude").optional(),
  locationLat: z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude").optional(),
  setup: z.number().int().min(0, "Setup time must be non-negative").optional(),
  service: z.number().int().min(0, "Service time must be non-negative").optional(),
  delivery: z.array(z.number().min(0, "Delivery quantity must be non-negative")).max(10, "Too many delivery dimensions").optional(),
  pickup: z.array(z.number().min(0, "Pickup quantity must be non-negative")).max(10, "Too many pickup dimensions").optional(),
  skills: z.array(z.number().int().min(0, "Skill ID must be non-negative")).max(50, "Too many skills").optional(),
  priority: z.number().int().min(0, "Priority must be non-negative").max(100, "Priority too high").optional(),
  timeWindows: z.array(z.object({
    start: z.number().int().min(0, "Time window start must be non-negative"),
    end: z.number().int().min(0, "Time window end must be non-negative"),
  }).refine(tw => tw.end > tw.start, "Time window end must be after start")).max(5, "Too many time windows").optional(),
  datasetName: z.string().max(100, "Dataset name too long").optional(),
  datasetVersion: z.number().int().min(1, "Dataset version must be at least 1").optional(),
}).refine(data => {
  if (data.locationLon !== undefined && data.locationLat !== undefined) {
    return true; // Both coordinates provided
  }
  if (data.locationLon === undefined && data.locationLat === undefined) {
    return true; // Neither coordinate provided
  }
  return false; // Only one coordinate provided
}, {
  message: "Both longitude and latitude must be provided together",
  path: ["locationLon"],
});

// Location validation schemas
export const locationCreateSchema = z.object({
  name: z.string().min(1, "Location name is required").max(100, "Location name too long"),
  address: z.string().max(300, "Address too long").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  locationLon: z.number().min(-180, "Invalid longitude").max(180, "Invalid longitude").optional(),
  locationLat: z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude").optional(),
  locationType: z.enum(["depot", "customer", "warehouse", "distribution_center", "pickup_point", "delivery_point"]).optional(),
  operatingHours: z.string().max(100, "Operating hours too long").optional(),
  contactInfo: z.string().max(200, "Contact info too long").optional(),
  timezone: z.string().max(50, "Timezone too long").optional(),
  datasetName: z.string().max(100, "Dataset name too long").optional(),
  datasetVersion: z.number().int().min(1, "Dataset version must be at least 1").optional(),
}).refine(data => {
  if (data.locationLon !== undefined && data.locationLat !== undefined) {
    return true; // Both coordinates provided
  }
  if (data.locationLon === undefined && data.locationLat === undefined) {
    return true; // Neither coordinate provided
  }
  return false; // Only one coordinate provided
}, {
  message: "Both longitude and latitude must be provided together",
  path: ["locationLon"],
});

// Route validation schemas
export const routeCreateSchema = z.object({
  cost: z.number().min(0, "Cost must be non-negative").optional(),
  distance: z.number().min(0, "Distance must be non-negative").optional(),
  duration: z.number().int().min(0, "Duration must be non-negative").optional(),
  waitingTime: z.number().int().min(0, "Waiting time must be non-negative").optional(),
  serviceTime: z.number().int().min(0, "Service time must be non-negative").optional(),
  setupTime: z.number().int().min(0, "Setup time must be non-negative").optional(),
  deliveries: z.array(z.number().min(0, "Delivery quantity must be non-negative")).max(10, "Too many delivery dimensions").optional(),
  pickups: z.array(z.number().min(0, "Pickup quantity must be non-negative")).max(10, "Too many pickup dimensions").optional(),
  priority: z.number().int().min(0, "Priority must be non-negative").max(100, "Priority too high").optional(),
  deliveryCount: z.number().int().min(0, "Delivery count must be non-negative").optional(),
  violations: z.array(z.record(z.any())).optional(),
  geometry: z.string().max(10000, "Geometry too large").optional(),
  geojson: z.record(z.any()).optional(),
  currencyCode: z.string().length(3, "Currency code must be 3 characters").optional(),
  datasetName: z.string().max(100, "Dataset name too long").optional(),
  datasetVersion: z.number().int().min(1, "Dataset version must be at least 1").optional(),
});

// Validation helper functions
export function validateProject(data: any) {
  return projectCreateSchema.parse(data);
}

export function validateScenario(data: any) {
  return scenarioCreateSchema.parse(data);
}

export function validateDataset(data: any) {
  return datasetCreateSchema.parse(data);
}

export function validateVehicle(data: any) {
  return vehicleCreateSchema.parse(data);
}

export function validateJob(data: any) {
  return jobCreateSchema.parse(data);
}

export function validateLocation(data: any) {
  return locationCreateSchema.parse(data);
}

export function validateRoute(data: any) {
  return routeCreateSchema.parse(data);
}

// Bulk validation for CSV imports
export function validateVehiclesBulk(vehicles: any[]) {
  return vehicles.map((vehicle, index) => {
    try {
      return { data: validateVehicle(vehicle), index, valid: true };
    } catch (error) {
      return { error: error instanceof z.ZodError ? error.errors : error, index, valid: false };
    }
  });
}

export function validateJobsBulk(jobs: any[]) {
  return jobs.map((job, index) => {
    try {
      return { data: validateJob(job), index, valid: true };
    } catch (error) {
      return { error: error instanceof z.ZodError ? error.errors : error, index, valid: false };
    }
  });
}

export function validateLocationsBulk(locations: any[]) {
  return locations.map((location, index) => {
    try {
      return { data: validateLocation(location), index, valid: true };
    } catch (error) {
      return { error: error instanceof z.ZodError ? error.errors : error, index, valid: false };
    }
  });
}

// VRP-specific validation rules
export const vrpConstraints = {
  maxVehiclesPerDataset: 1000,
  maxJobsPerDataset: 10000,
  maxLocationsPerDataset: 5000,
  maxCapacityDimensions: 10,
  maxSkillsPerEntity: 50,
  maxTimeWindowsPerJob: 5,
  maxTagsPerEntity: 10,
  
  // Coordinate validation
  isValidCoordinate: (lon: number, lat: number) => {
    return lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90;
  },
  
  // Time validation (seconds since midnight)
  isValidTimeOfDay: (time: number) => {
    return time >= 0 && time < 86400; // 24 * 60 * 60 seconds
  },
  
  // Distance validation (meters)
  isValidDistance: (distance: number) => {
    return distance >= 0 && distance <= 100000000; // 100,000 km max
  },
  
  // Duration validation (seconds)
  isValidDuration: (duration: number) => {
    return duration >= 0 && duration <= 604800; // 1 week max
  },
};

export default {
  validateProject,
  validateScenario,
  validateDataset,
  validateVehicle,
  validateJob,
  validateLocation,
  validateRoute,
  validateVehiclesBulk,
  validateJobsBulk,
  validateLocationsBulk,
  vrpConstraints,
};