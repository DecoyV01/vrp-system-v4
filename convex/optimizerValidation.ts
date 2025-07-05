/**
 * Optimization Engine Validation Utilities
 * 
 * This file contains validation functions and conversion utilities for ensuring
 * data compatibility with various optimization engine APIs (VROOM, OR-Tools, etc.).
 * 
 * Common Optimization Engine Requirements:
 * - Many engines require integer cost values (no decimals)
 * - Priority values typically in range 0-100
 * - Capacity arrays often need exactly 3 elements [weight, volume, count]
 * - Time values usually in seconds (not milliseconds)
 * - Some engines require numeric IDs (not strings)
 */

import { Doc } from "./_generated/dataModel";

// ========== VALIDATION ERRORS ==========

export class OptimizerValidationError extends Error {
  constructor(message: string, public field?: string, public value?: any) {
    super(message);
    this.name = "OptimizerValidationError";
  }
}

// ========== CAPACITY VALIDATION ==========

/**
 * Validates that capacity array has exactly 3 elements for optimization engine compatibility
 * Most engines require capacity format: [weight, volume, count]
 */
export const validateCapacity = (capacity: number[], fieldName = "capacity"): void => {
  if (!Array.isArray(capacity)) {
    throw new OptimizerValidationError(`${fieldName} must be an array`, fieldName, capacity);
  }
  
  if (capacity.length !== 3) {
    throw new OptimizerValidationError(
      `${fieldName} must have exactly 3 elements [weight, volume, count], got ${capacity.length}`,
      fieldName,
      capacity
    );
  }
  
  if (capacity.some(c => typeof c !== "number" || c < 0)) {
    throw new OptimizerValidationError(
      `${fieldName} values must be non-negative numbers`,
      fieldName,
      capacity
    );
  }
};

// ========== PRIORITY VALIDATION ==========

/**
 * Validates that priority is in optimization engine compatible range (0-100)
 */
export const validatePriority = (priority: number, fieldName = "priority"): void => {
  if (typeof priority !== "number") {
    throw new OptimizerValidationError(`${fieldName} must be a number`, fieldName, priority);
  }
  
  if (priority < 0 || priority > 100) {
    throw new OptimizerValidationError(
      `${fieldName} must be between 0 and 100 for optimization engine compatibility, got ${priority}`,
      fieldName,
      priority
    );
  }
};

// ========== COST VALIDATION ==========

/**
 * Validates that cost value is an integer (common optimization engine requirement)
 * Store costs as cents to maintain precision while meeting integer requirements
 */
export const validateCost = (cost: number, fieldName = "cost"): void => {
  if (typeof cost !== "number") {
    throw new OptimizerValidationError(`${fieldName} must be a number`, fieldName, cost);
  }
  
  if (!Number.isInteger(cost)) {
    throw new OptimizerValidationError(
      `${fieldName} must be an integer for optimization engine compatibility. Store as cents/pence (multiply by 100)`,
      fieldName,
      cost
    );
  }
  
  if (cost < 0) {
    throw new OptimizerValidationError(`${fieldName} must be non-negative`, fieldName, cost);
  }
};

// ========== TIME CONVERSION UTILITIES ==========

/**
 * Converts Convex milliseconds to optimization engine seconds
 */
export const millisecondsToSeconds = (milliseconds: number): number => {
  return Math.floor(milliseconds / 1000);
};

/**
 * Converts optimization engine seconds to Convex milliseconds
 */
export const secondsToMilliseconds = (seconds: number): number => {
  return seconds * 1000;
};

/**
 * Validates and converts time windows from Convex format to optimization engine format
 */
export const convertTimeWindows = (
  timeWindows: Array<{ start: number; end: number }> | undefined
): Array<[number, number]> | undefined => {
  if (!timeWindows) return undefined;
  
  return timeWindows.map(tw => [
    millisecondsToSeconds(tw.start),
    millisecondsToSeconds(tw.end)
  ]);
};

// ========== COORDINATE CONVERSION ==========

/**
 * Converts separate longitude/latitude fields to optimization engine coordinate array
 */
export const coordsToArray = (lon?: number, lat?: number): [number, number] | undefined => {
  if (lon === undefined || lat === undefined) return undefined;
  return [lon, lat];
};

/**
 * Converts optimization engine coordinate array to separate longitude/latitude fields
 */
export const arrayToCoords = (coords?: [number, number]): { lon?: number; lat?: number } => {
  if (!coords) return {};
  return { lon: coords[0], lat: coords[1] };
};

// ========== ENTITY CONVERSION FUNCTIONS ==========

/**
 * Converts Convex vehicle to optimization engine format (e.g., VROOM)
 */
export const toOptimizerVehicle = (vehicle: Doc<"vehicles">) => {
  // Validate capacity if present
  if (vehicle.capacity) {
    validateCapacity(vehicle.capacity, "vehicle.capacity");
  }
  
  // Validate costs if present
  if (vehicle.costFixed !== undefined) {
    validateCost(vehicle.costFixed, "vehicle.costFixed");
  }
  if (vehicle.costPerHour !== undefined) {
    validateCost(vehicle.costPerHour, "vehicle.costPerHour");
  }
  if (vehicle.costPerKm !== undefined) {
    validateCost(vehicle.costPerKm, "vehicle.costPerKm");
  }
  
  return {
    id: vehicle.optimizerId,
    start: coordsToArray(vehicle.startLon, vehicle.startLat),
    end: coordsToArray(vehicle.endLon, vehicle.endLat),
    capacity: vehicle.capacity,
    skills: vehicle.skills,
    time_window: vehicle.twStart && vehicle.twEnd 
      ? [vehicle.twStart, vehicle.twEnd]  // Already in seconds
      : undefined,
    costs: {
      fixed: vehicle.costFixed || 0,
      per_hour: vehicle.costPerHour || 3600,  // Common default for optimization engines
      per_km: vehicle.costPerKm || 0,
    },
    max_distance: vehicle.maxDistance,
    max_travel_time: vehicle.maxTravelTime,
    profile: vehicle.profile,
  };
};

/**
 * Converts Convex job to optimization engine format (e.g., VROOM)
 */
export const toOptimizerJob = (job: Doc<"jobs">) => {
  // Validate delivery capacity if present
  if (job.delivery) {
    validateCapacity(job.delivery, "job.delivery");
  }
  
  // Validate pickup capacity if present
  if (job.pickup) {
    validateCapacity(job.pickup, "job.pickup");
  }
  
  // Validate priority if present
  if (job.priority !== undefined) {
    validatePriority(job.priority, "job.priority");
  }
  
  return {
    id: job.optimizerId,
    location: coordsToArray(job.locationLon, job.locationLat),
    setup: job.setup,
    service: job.service,
    delivery: job.delivery,
    pickup: job.pickup,
    skills: job.skills,
    priority: job.priority,
    time_windows: convertTimeWindows(job.timeWindows),
  };
};

/**
 * Converts Convex shipment to optimization engine format (e.g., VROOM)
 */
export const toOptimizerShipment = (shipment: Doc<"shipments">) => {
  // Validate amount capacity if present
  if (shipment.amount) {
    validateCapacity(shipment.amount, "shipment.amount");
  }
  
  // Validate priority if present
  if (shipment.priority !== undefined) {
    validatePriority(shipment.priority, "shipment.priority");
  }
  
  return {
    id: shipment.optimizerId,
    pickup: coordsToArray(shipment.pickupLon, shipment.pickupLat),
    delivery: coordsToArray(shipment.deliveryLon, shipment.deliveryLat),
    amount: shipment.amount,
    skills: shipment.skills,
    priority: shipment.priority,
    pickup_setup: shipment.pickupSetup,
    pickup_service: shipment.pickupService,
    pickup_time_windows: convertTimeWindows(shipment.pickupTimeWindows),
    delivery_setup: shipment.deliverySetup,
    delivery_service: shipment.deliveryService,
    delivery_time_windows: convertTimeWindows(shipment.deliveryTimeWindows),
  };
};

// ========== COST CONVERSION UTILITIES ==========

/**
 * Converts dollars to cents for VROOM integer cost requirement
 */
export const dollarsToCents = (dollars: number): number => {
  return Math.round(dollars * 100);
};

/**
 * Converts cents to dollars for display purposes
 */
export const centsToDollars = (cents: number): number => {
  return cents / 100;
};

/**
 * Validates and converts cost from dollars to cents
 */
export const validateAndConvertCost = (costDollars: number, fieldName: string): number => {
  if (typeof costDollars !== "number" || costDollars < 0) {
    throw new OptimizerValidationError(
      `${fieldName} must be a non-negative number`,
      fieldName,
      costDollars
    );
  }
  
  const costCents = dollarsToCents(costDollars);
  validateCost(costCents, fieldName);
  return costCents;
};

// ========== VROOM ID MANAGEMENT ==========

/**
 * Generates the next available optimizer ID for a given entity type
 * This ensures unique numeric IDs required by optimization engine APIs
 */
export const generateNextOptimizerId = async (
  ctx: any,
  entityType: "vehicles" | "jobs" | "shipments"
): Promise<number> => {
  // Query all entities of this type to find the highest optimizer ID
  const entities = await ctx.db.query(entityType).collect();
  
  const maxOptimizerId = entities.reduce((max, entity) => {
    return Math.max(max, entity.optimizerId || 0);
  }, 0);
  
  return maxOptimizerId + 1;
};