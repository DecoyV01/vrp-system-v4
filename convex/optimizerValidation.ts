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

import { Doc } from './_generated/dataModel'

// ========== VALIDATION ERRORS ==========

export class OptimizerValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: any
  ) {
    super(message)
    this.name = 'OptimizerValidationError'
  }
}

// ========== CAPACITY VALIDATION ==========

/**
 * Validates that capacity array has exactly 3 elements for optimization engine compatibility
 * Most engines require capacity format: [weight, volume, count]
 */
export const validateCapacity = (
  capacity: number[],
  fieldName = 'capacity'
): void => {
  if (!Array.isArray(capacity)) {
    throw new OptimizerValidationError(
      `${fieldName} must be an array`,
      fieldName,
      capacity
    )
  }

  if (capacity.length !== 3) {
    throw new OptimizerValidationError(
      `${fieldName} must have exactly 3 elements [weight, volume, count], got ${capacity.length}`,
      fieldName,
      capacity
    )
  }

  if (capacity.some(c => typeof c !== 'number' || c < 0)) {
    throw new OptimizerValidationError(
      `${fieldName} values must be non-negative numbers`,
      fieldName,
      capacity
    )
  }
}

// ========== PRIORITY VALIDATION ==========

/**
 * Validates that priority is in optimization engine compatible range (0-100)
 */
export const validatePriority = (
  priority: number,
  fieldName = 'priority'
): void => {
  if (typeof priority !== 'number') {
    throw new OptimizerValidationError(
      `${fieldName} must be a number`,
      fieldName,
      priority
    )
  }

  if (priority < 0 || priority > 100) {
    throw new OptimizerValidationError(
      `${fieldName} must be between 0 and 100 for optimization engine compatibility, got ${priority}`,
      fieldName,
      priority
    )
  }
}

// ========== COST VALIDATION ==========

/**
 * Validates that cost value is an integer (common optimization engine requirement)
 * Store costs as cents to maintain precision while meeting integer requirements
 */
export const validateCost = (cost: number, fieldName = 'cost'): void => {
  if (typeof cost !== 'number') {
    throw new OptimizerValidationError(
      `${fieldName} must be a number`,
      fieldName,
      cost
    )
  }

  if (!Number.isInteger(cost)) {
    throw new OptimizerValidationError(
      `${fieldName} must be an integer for optimization engine compatibility. Store as cents/pence (multiply by 100)`,
      fieldName,
      cost
    )
  }

  if (cost < 0) {
    throw new OptimizerValidationError(
      `${fieldName} must be non-negative`,
      fieldName,
      cost
    )
  }
}

// ========== TIME UNIT VALIDATION ==========

/**
 * Time unit constants for validation
 */
export const TimeUnit = {
  SECOND: 1,
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800,
} as const

/**
 * Validates that time value is in seconds and within reasonable bounds
 * All time fields in the system should be stored in seconds for optimization engine compatibility
 */
export const validateTimeInSeconds = (
  timeValue: number,
  fieldName: string
): void => {
  if (typeof timeValue !== 'number') {
    throw new OptimizerValidationError(
      `${fieldName} must be a number`,
      fieldName,
      timeValue
    )
  }

  if (!Number.isInteger(timeValue)) {
    throw new OptimizerValidationError(
      `${fieldName} must be an integer (seconds), got ${timeValue}`,
      fieldName,
      timeValue
    )
  }

  if (timeValue < 0) {
    throw new OptimizerValidationError(
      `${fieldName} must be non-negative`,
      fieldName,
      timeValue
    )
  }

  // Reasonable upper bound: 1 week (604800 seconds)
  if (timeValue > TimeUnit.WEEK) {
    throw new OptimizerValidationError(
      `${fieldName} exceeds maximum allowed time (1 week = ${TimeUnit.WEEK} seconds), got ${timeValue}`,
      fieldName,
      timeValue
    )
  }
}

/**
 * Validates time window array ensuring start < end and both are valid time values
 */
export const validateTimeWindow = (
  timeWindow: [number, number],
  fieldName: string
): void => {
  if (!Array.isArray(timeWindow) || timeWindow.length !== 2) {
    throw new OptimizerValidationError(
      `${fieldName} must be an array with exactly 2 elements [start, end]`,
      fieldName,
      timeWindow
    )
  }

  const [start, end] = timeWindow

  validateTimeInSeconds(start, `${fieldName}.start`)
  validateTimeInSeconds(end, `${fieldName}.end`)

  if (start >= end) {
    throw new OptimizerValidationError(
      `${fieldName} start time (${start}) must be less than end time (${end})`,
      fieldName,
      timeWindow
    )
  }
}

/**
 * Validates array of time windows in VROOM format ensuring no overlaps and all are valid
 * VROOM format: [[start1, end1], [start2, end2], ...]
 */
export const validateTimeWindows = (
  timeWindows: Array<Array<number>>,
  fieldName: string
): void => {
  if (!Array.isArray(timeWindows)) {
    throw new OptimizerValidationError(
      `${fieldName} must be an array`,
      fieldName,
      timeWindows
    )
  }

  if (timeWindows.length === 0) {
    return // Empty array is valid
  }

  // Validate each time window
  timeWindows.forEach((tw, index) => {
    if (!Array.isArray(tw) || tw.length !== 2) {
      throw new OptimizerValidationError(
        `${fieldName}[${index}] must be an array with exactly 2 elements [start, end]`,
        fieldName,
        tw
      )
    }

    const [start, end] = tw

    if (typeof start !== 'number' || typeof end !== 'number') {
      throw new OptimizerValidationError(
        `${fieldName}[${index}] start and end must be numbers`,
        fieldName,
        tw
      )
    }

    validateTimeInSeconds(start, `${fieldName}[${index}].start`)
    validateTimeInSeconds(end, `${fieldName}[${index}].end`)

    if (start >= end) {
      throw new OptimizerValidationError(
        `${fieldName}[${index}] start time (${start}) must be less than end time (${end})`,
        fieldName,
        tw
      )
    }
  })

  // Check for overlapping time windows
  const sortedWindows = [...timeWindows].sort((a, b) => a[0] - b[0])
  for (let i = 0; i < sortedWindows.length - 1; i++) {
    if (sortedWindows[i][1] > sortedWindows[i + 1][0]) {
      throw new OptimizerValidationError(
        `${fieldName} contains overlapping time windows: [${sortedWindows[i][0]}, ${sortedWindows[i][1]}] and [${sortedWindows[i + 1][0]}, ${sortedWindows[i + 1][1]}]`,
        fieldName,
        timeWindows
      )
    }
  }
}

/**
 * Validates service and setup time consistency
 */
export const validateServiceTimes = (
  setup: number | undefined,
  service: number | undefined,
  fieldPrefix: string
): void => {
  if (setup !== undefined) {
    validateTimeInSeconds(setup, `${fieldPrefix}.setup`)
  }

  if (service !== undefined) {
    validateTimeInSeconds(service, `${fieldPrefix}.service`)
  }

  // Validate that service time is reasonable compared to setup time
  if (setup !== undefined && service !== undefined) {
    if (setup > service && service > 0) {
      // Warning: setup time longer than service time is unusual but not invalid
      console.warn(
        `${fieldPrefix}: Setup time (${setup}s) is longer than service time (${service}s). This may indicate inconsistent time units.`
      )
    }
  }
}

/**
 * Validates vehicle time constraints (time windows, max travel time, etc.)
 */
export const validateVehicleTimeConstraints = (vehicle: {
  timeWindow?: Array<number>
  maxTravelTime?: number
  maxDistance?: number
  breaks?: Array<{
    id: number
    timeWindows: Array<Array<number>>
    service?: number
  }>
}): void => {
  // Validate vehicle time window (VROOM format: [start, end])
  if (vehicle.timeWindow !== undefined) {
    if (!Array.isArray(vehicle.timeWindow) || vehicle.timeWindow.length !== 2) {
      throw new OptimizerValidationError(
        'Vehicle time window must be an array with exactly 2 elements [start, end]',
        'vehicle.timeWindow',
        vehicle.timeWindow
      )
    }
    validateTimeWindow(
      vehicle.timeWindow as [number, number],
      'vehicle.timeWindow'
    )
  }

  // Validate max travel time
  if (vehicle.maxTravelTime !== undefined) {
    validateTimeInSeconds(vehicle.maxTravelTime, 'vehicle.maxTravelTime')
  }

  // Validate breaks
  if (vehicle.breaks) {
    vehicle.breaks.forEach((breakDef, index) => {
      if (typeof breakDef.id !== 'number') {
        throw new OptimizerValidationError(
          `vehicle.breaks[${index}].id must be a number`,
          `vehicle.breaks[${index}].id`,
          breakDef.id
        )
      }

      if (breakDef.service !== undefined) {
        validateTimeInSeconds(
          breakDef.service,
          `vehicle.breaks[${index}].service`
        )
      }

      if (breakDef.timeWindows) {
        breakDef.timeWindows.forEach((tw, twIndex) => {
          if (!Array.isArray(tw) || tw.length !== 2) {
            throw new OptimizerValidationError(
              `vehicle.breaks[${index}].timeWindows[${twIndex}] must be an array with exactly 2 elements [start, end]`,
              `vehicle.breaks[${index}].timeWindows[${twIndex}]`,
              tw
            )
          }
          validateTimeWindow(
            tw as [number, number],
            `vehicle.breaks[${index}].timeWindows[${twIndex}]`
          )
        })
      }
    })
  }
}

/**
 * Validates all time-related fields for consistency across the system
 */
export const validateTimeConsistency = (
  entity: any,
  entityType: string
): void => {
  switch (entityType) {
    case 'vehicle':
      validateVehicleTimeConstraints(entity)
      break

    case 'job':
      validateServiceTimes(entity.setup, entity.service, 'job')
      if (entity.timeWindows) {
        validateTimeWindows(entity.timeWindows, 'job.timeWindows')
      }
      break

    case 'shipment':
      validateServiceTimes(
        entity.pickupSetup,
        entity.pickupService,
        'shipment.pickup'
      )
      validateServiceTimes(
        entity.deliverySetup,
        entity.deliveryService,
        'shipment.delivery'
      )
      if (entity.pickupTimeWindows) {
        validateTimeWindows(
          entity.pickupTimeWindows,
          'shipment.pickupTimeWindows'
        )
      }
      if (entity.deliveryTimeWindows) {
        validateTimeWindows(
          entity.deliveryTimeWindows,
          'shipment.deliveryTimeWindows'
        )
      }
      break

    case 'route':
      if (entity.duration !== undefined) {
        validateTimeInSeconds(entity.duration, 'route.duration')
      }
      if (entity.waitingTime !== undefined) {
        validateTimeInSeconds(entity.waitingTime, 'route.waitingTime')
      }
      if (entity.serviceTime !== undefined) {
        validateTimeInSeconds(entity.serviceTime, 'route.serviceTime')
      }
      if (entity.setupTime !== undefined) {
        validateTimeInSeconds(entity.setupTime, 'route.setupTime')
      }
      break

    default:
      throw new OptimizerValidationError(
        `Unknown entity type for time validation: ${entityType}`,
        'entityType',
        entityType
      )
  }
}

// ========== TIME CONVERSION UTILITIES ==========

/**
 * Converts Convex milliseconds to optimization engine seconds
 */
export const millisecondsToSeconds = (milliseconds: number): number => {
  return Math.floor(milliseconds / 1000)
}

/**
 * Converts optimization engine seconds to Convex milliseconds
 */
export const secondsToMilliseconds = (seconds: number): number => {
  return seconds * 1000
}

/**
 * Validates and converts time windows from VROOM format to optimization engine format
 * Input is already in VROOM format: [[start, end], [start2, end2]]
 * This function ensures the format is correct and optionally converts time units
 */
export const convertTimeWindows = (
  timeWindows: Array<Array<number>> | undefined
): Array<[number, number]> | undefined => {
  if (!timeWindows) return undefined

  // Validate format and convert to tuple format
  return timeWindows.map(tw => {
    if (!Array.isArray(tw) || tw.length !== 2) {
      throw new OptimizerValidationError(
        'Time window must be an array with exactly 2 elements [start, end]',
        'timeWindows',
        tw
      )
    }
    return [tw[0], tw[1]] as [number, number]
  })
}

// ========== COORDINATE CONVERSION ==========

/**
 * Converts separate longitude/latitude fields to optimization engine coordinate array
 */
export const coordsToArray = (
  lon?: number,
  lat?: number
): [number, number] | undefined => {
  if (lon === undefined || lat === undefined) return undefined
  return [lon, lat]
}

/**
 * Converts optimization engine coordinate array to separate longitude/latitude fields
 */
export const arrayToCoords = (
  coords?: [number, number]
): { lon?: number; lat?: number } => {
  if (!coords) return {}
  return { lon: coords[0], lat: coords[1] }
}

// ========== ROUTE GEOMETRY OPTIMIZATION ==========

/**
 * Validates and optimizes route geometry for optimization engine compatibility
 */
export const validateRouteGeometry = (geometry: string | undefined): void => {
  if (!geometry) return

  // Check for valid geometry formats
  if (geometry.length > 100000) {
    throw new OptimizerValidationError(
      'Route geometry exceeds maximum size limit (100KB)',
      'geometry',
      geometry.length
    )
  }

  // Validate common geometry formats
  const isWKT = geometry.trim().toUpperCase().startsWith('LINESTRING')
  const isGeoJSON = geometry.trim().startsWith('{')

  if (!isWKT && !isGeoJSON) {
    throw new OptimizerValidationError(
      'Route geometry must be in WKT (LINESTRING) or GeoJSON format',
      'geometry',
      geometry.substring(0, 100)
    )
  }

  // Additional validation for GeoJSON
  if (isGeoJSON) {
    try {
      const parsed = JSON.parse(geometry)
      if (!parsed.type || !parsed.coordinates) {
        throw new OptimizerValidationError(
          'Invalid GeoJSON geometry structure',
          'geometry',
          geometry.substring(0, 100)
        )
      }
    } catch (error) {
      throw new OptimizerValidationError(
        'Invalid GeoJSON format in route geometry',
        'geometry',
        geometry.substring(0, 100)
      )
    }
  }
}

/**
 * Optimizes route geometry by simplifying coordinates and reducing precision
 */
export const optimizeRouteGeometry = (
  geometry: string | undefined
): string | undefined => {
  if (!geometry) return undefined

  // Validate first
  validateRouteGeometry(geometry)

  try {
    if (geometry.trim().startsWith('{')) {
      // GeoJSON optimization
      const parsed = JSON.parse(geometry)

      if (parsed.type === 'LineString' && parsed.coordinates) {
        // Simplify coordinates by reducing precision to 6 decimal places
        const optimizedCoordinates = parsed.coordinates.map(
          (coord: number[]) => [
            Math.round(coord[0] * 1000000) / 1000000,
            Math.round(coord[1] * 1000000) / 1000000,
          ]
        )

        // Douglas-Peucker-like simplification for large coordinate arrays
        const simplifiedCoordinates =
          optimizedCoordinates.length > 100
            ? simplifyCoordinates(optimizedCoordinates, 0.00001)
            : optimizedCoordinates

        return JSON.stringify({
          ...parsed,
          coordinates: simplifiedCoordinates,
        })
      }
    } else if (geometry.trim().toUpperCase().startsWith('LINESTRING')) {
      // WKT optimization - extract coordinates and optimize
      const coordsMatch = geometry.match(/LINESTRING\s*\(([^)]+)\)/i)
      if (coordsMatch) {
        const coordsStr = coordsMatch[1]
        const coords = coordsStr.split(',').map(coord => {
          const [x, y] = coord.trim().split(/\s+/)
          return [
            Math.round(parseFloat(x) * 1000000) / 1000000,
            Math.round(parseFloat(y) * 1000000) / 1000000,
          ]
        })

        // Simplify if too many coordinates
        const simplifiedCoords =
          coords.length > 100 ? simplifyCoordinates(coords, 0.00001) : coords

        return `LINESTRING(${simplifiedCoords.map(c => `${c[0]} ${c[1]}`).join(', ')})`
      }
    }
  } catch (error) {
    console.warn('Failed to optimize route geometry:', error)
    return geometry // Return original if optimization fails
  }

  return geometry
}

/**
 * Simplified Douglas-Peucker algorithm for coordinate reduction
 */
const simplifyCoordinates = (
  coordinates: number[][],
  tolerance: number
): number[][] => {
  if (coordinates.length <= 2) return coordinates

  // Find the point with maximum distance from the line between first and last points
  let maxDistance = 0
  let maxIndex = 0

  const start = coordinates[0]
  const end = coordinates[coordinates.length - 1]

  for (let i = 1; i < coordinates.length - 1; i++) {
    const distance = perpendicularDistance(coordinates[i], start, end)
    if (distance > maxDistance) {
      maxDistance = distance
      maxIndex = i
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const left = simplifyCoordinates(
      coordinates.slice(0, maxIndex + 1),
      tolerance
    )
    const right = simplifyCoordinates(coordinates.slice(maxIndex), tolerance)

    // Concatenate arrays, removing duplicate point
    return [...left.slice(0, -1), ...right]
  }

  // If max distance is within tolerance, return only endpoints
  return [start, end]
}

/**
 * Calculate perpendicular distance from point to line
 */
const perpendicularDistance = (
  point: number[],
  lineStart: number[],
  lineEnd: number[]
): number => {
  const [x, y] = point
  const [x1, y1] = lineStart
  const [x2, y2] = lineEnd

  const A = x - x1
  const B = y - y1
  const C = x2 - x1
  const D = y2 - y1

  const dot = A * C + B * D
  const lenSq = C * C + D * D

  if (lenSq === 0) return Math.sqrt(A * A + B * B)

  const param = dot / lenSq

  let xx: number, yy: number

  if (param < 0) {
    xx = x1
    yy = y1
  } else if (param > 1) {
    xx = x2
    yy = y2
  } else {
    xx = x1 + param * C
    yy = y1 + param * D
  }

  const dx = x - xx
  const dy = y - yy

  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Converts route geometry to optimization engine format
 */
export const convertGeometryForOptimizer = (
  geometry: string | undefined
): any => {
  if (!geometry) return undefined

  try {
    // Optimize geometry first
    const optimized = optimizeRouteGeometry(geometry)
    if (!optimized) return undefined

    // Convert to format expected by optimization engines
    if (optimized.trim().startsWith('{')) {
      // GeoJSON format
      const parsed = JSON.parse(optimized)
      return {
        type: 'geojson',
        data: parsed,
      }
    } else {
      // WKT format
      return {
        type: 'wkt',
        data: optimized,
      }
    }
  } catch (error) {
    console.warn('Failed to convert geometry for optimizer:', error)
    return undefined
  }
}

// ========== ENTITY CONVERSION FUNCTIONS ==========

/**
 * Converts Convex vehicle to optimization engine format (e.g., VROOM)
 */
export const toOptimizerVehicle = (vehicle: Doc<'vehicles'>) => {
  // Validate capacity if present
  if (vehicle.capacity) {
    validateCapacity(vehicle.capacity, 'vehicle.capacity')
  }

  // Validate costs if present
  if (vehicle.costFixed !== undefined) {
    validateCost(vehicle.costFixed, 'vehicle.costFixed')
  }
  if (vehicle.costPerHour !== undefined) {
    validateCost(vehicle.costPerHour, 'vehicle.costPerHour')
  }
  if (vehicle.costPerKm !== undefined) {
    validateCost(vehicle.costPerKm, 'vehicle.costPerKm')
  }

  return {
    id: vehicle.optimizerId,
    start: coordsToArray(vehicle.startLon, vehicle.startLat),
    end: coordsToArray(vehicle.endLon, vehicle.endLat),
    capacity: vehicle.capacity,
    skills: vehicle.skills,
    time_window: vehicle.timeWindow, // Already in VROOM format [start, end]
    costs: {
      fixed: vehicle.costFixed || 0,
      per_hour: vehicle.costPerHour || 3600, // Common default for optimization engines
      per_km: vehicle.costPerKm || 0,
    },
    max_distance: vehicle.maxDistance,
    max_travel_time: vehicle.maxTravelTime,
    profile: vehicle.profile,
  }
}

/**
 * Converts Convex job to optimization engine format (e.g., VROOM)
 */
export const toOptimizerJob = (job: Doc<'jobs'>) => {
  // Validate delivery capacity if present
  if (job.delivery) {
    validateCapacity(job.delivery, 'job.delivery')
  }

  // Validate pickup capacity if present
  if (job.pickup) {
    validateCapacity(job.pickup, 'job.pickup')
  }

  // Validate priority if present
  if (job.priority !== undefined) {
    validatePriority(job.priority, 'job.priority')
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
    time_windows: job.timeWindows, // Already in VROOM format [[start, end]]
  }
}

/**
 * Converts Convex shipment to optimization engine format (e.g., VROOM)
 */
export const toOptimizerShipment = (shipment: Doc<'shipments'>) => {
  // Validate amount capacity if present
  if (shipment.amount) {
    validateCapacity(shipment.amount, 'shipment.amount')
  }

  // Validate priority if present
  if (shipment.priority !== undefined) {
    validatePriority(shipment.priority, 'shipment.priority')
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
    pickup_time_windows: shipment.pickupTimeWindows, // Already in VROOM format [[start, end]]
    delivery_setup: shipment.deliverySetup,
    delivery_service: shipment.deliveryService,
    delivery_time_windows: shipment.deliveryTimeWindows, // Already in VROOM format [[start, end]]
  }
}

// ========== COST CONVERSION UTILITIES ==========

/**
 * Converts dollars to cents for VROOM integer cost requirement
 */
export const dollarsToCents = (dollars: number): number => {
  return Math.round(dollars * 100)
}

/**
 * Converts cents to dollars for display purposes
 */
export const centsToDollars = (cents: number): number => {
  return cents / 100
}

/**
 * Validates and converts cost from dollars to cents
 */
export const validateAndConvertCost = (
  costDollars: number,
  fieldName: string
): number => {
  if (typeof costDollars !== 'number' || costDollars < 0) {
    throw new OptimizerValidationError(
      `${fieldName} must be a non-negative number`,
      fieldName,
      costDollars
    )
  }

  const costCents = dollarsToCents(costDollars)
  validateCost(costCents, fieldName)
  return costCents
}

// ========== VROOM ID MANAGEMENT ==========

/**
 * Generates the next available optimizer ID for a given entity type
 * This ensures unique numeric IDs required by optimization engine APIs
 */
export const generateNextOptimizerId = async (
  ctx: any,
  entityType: 'vehicles' | 'jobs' | 'shipments'
): Promise<number> => {
  // Query all entities of this type to find the highest optimizer ID
  const entities = await ctx.db.query(entityType).collect()

  const maxOptimizerId = entities.reduce((max: number, entity: any) => {
    return Math.max(max, entity.optimizerId || 0)
  }, 0)

  return maxOptimizerId + 1
}
