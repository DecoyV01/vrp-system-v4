import { defineSchema, defineTable } from 'convex/server'
import { authTables } from '@convex-dev/auth/server'
import { v } from 'convex/values'

export default defineSchema({
  // Authentication tables from Convex Auth
  ...authTables,
  // Projects - Core project entity
  projects: defineTable({
    // REQUIRED FIELDS (Not Nullable)
    name: v.string(), // ✅ Project name - always required
    ownerId: v.id('users'), // ✅ User ID from Convex Auth - required for ownership
    // NOTE: Use _creationTime instead of createdAt (auto-managed by Convex)
    updatedAt: v.number(), // ✅ Last update timestamp - required for audit

    // OPTIONAL FIELDS (Nullable)
    description: v.optional(v.string()), // ❓ Project description
    currency: v.optional(v.string()), // ❓ Currency code (USD, EUR, etc.)
    projectType: v.optional(v.string()), // ❓ Project classification
    industry: v.optional(v.string()), // ❓ Industry sector
    geographicRegion: v.optional(v.string()), // ❓ Operating region
    priority: v.optional(v.string()), // ❓ Project priority level
    estimatedVehicles: v.optional(v.number()), // ❓ Expected vehicle count
    estimatedJobs: v.optional(v.number()), // ❓ Expected job count
    planningHorizonDays: v.optional(v.number()), // ❓ Planning period length
    contactPerson: v.optional(v.string()), // ❓ Primary contact name
    contactEmail: v.optional(v.string()), // ❓ Contact email
    contactPhone: v.optional(v.string()), // ❓ Contact phone
    tags: v.optional(v.array(v.string())), // ❓ Project tags for filtering
    notes: v.optional(v.string()), // ❓ Additional notes
  })
    .index('by_owner', ['ownerId'])
    .index('by_updated_at', ['updatedAt']),

  // Scenarios - Project optimization scenarios
  scenarios: defineTable({
    // REQUIRED FIELDS (Not Nullable)
    projectId: v.id('projects'), // ✅ Parent project reference - required relationship
    name: v.string(), // ✅ Scenario name - always required
    // NOTE: Use _creationTime instead of createdAt (auto-managed by Convex)
    updatedAt: v.number(), // ✅ Last update timestamp - required for audit

    // OPTIONAL FIELDS (Nullable)
    description: v.optional(v.string()), // ❓ Scenario description
    startDate: v.optional(v.number()), // ❓ Scenario start date
    endDate: v.optional(v.number()), // ❓ Scenario end date
    planningHorizonDays: v.optional(v.number()), // ❓ Planning period override
    optimizationObjective: v.optional(v.string()), // ❓ Primary optimization goal
    optimizationParameters: v.optional(v.object({})), // ❓ Custom optimization settings
    status: v.optional(v.string()), // ❓ Current scenario status
    tags: v.optional(v.array(v.string())), // ❓ Scenario tags
    isActive: v.optional(v.boolean()), // ❓ Active scenario flag
    lastOptimizedAt: v.optional(v.number()), // ❓ Last optimization timestamp
    optimizationCount: v.optional(v.number()), // ❓ Number of optimizations run
  })
    .index('by_project', ['projectId'])
    .index('by_status', ['status']),

  // Datasets - Data collections for optimization
  datasets: defineTable({
    // REQUIRED FIELDS (Not Nullable)
    projectId: v.id('projects'), // ✅ Parent project reference - required relationship
    name: v.string(), // ✅ Dataset name - always required
    version: v.number(), // ✅ Dataset version number - required for versioning
    // NOTE: Use _creationTime instead of createdAt (auto-managed by Convex)
    updatedAt: v.number(), // ✅ Last update timestamp - required for audit

    // OPTIONAL FIELDS (Nullable)
    scenarioId: v.optional(v.id('scenarios')), // ❓ Optional scenario assignment
    description: v.optional(v.string()), // ❓ Dataset description
    status: v.optional(v.string()), // ❓ Dataset status (active, archived, etc.)
    createdFromDatasetId: v.optional(v.id('datasets')), // ❓ Source dataset for cloning
    isBaseline: v.optional(v.boolean()), // ❓ Baseline dataset flag
    tags: v.optional(v.array(v.string())), // ❓ Dataset tags
    vehicleCount: v.optional(v.number()), // ❓ Cached vehicle count
    jobCount: v.optional(v.number()), // ❓ Cached job count
    locationCount: v.optional(v.number()), // ❓ Cached location count
    optimizationRunCount: v.optional(v.number()), // ❓ Number of optimization runs
    optimizationCount: v.optional(v.number()), // ❓ Total optimization count
    lastOptimizationAt: v.optional(v.number()), // ❓ Last optimization timestamp
    datasetType: v.optional(v.string()), // ❓ Dataset type classification
    versionNote: v.optional(v.string()), // ❓ Version change notes
    entityCounts: v.optional(
      v.object({
        // ❓ Detailed entity counts
        jobs: v.number(), // Required if entityCounts exists
        vehicles: v.number(), // Required if entityCounts exists
        locations: v.number(), // Required if entityCounts exists
      })
    ),
    createdBy: v.optional(v.string()), // ❓ User who created the dataset
    archivedAt: v.optional(v.number()), // ❓ Archive timestamp
  })
    .index('by_project', ['projectId'])
    .index('by_scenario', ['scenarioId'])
    .index('by_status', ['status'])
    .index('by_version', ['projectId', 'version']),

  // Vehicles - Fleet vehicle definitions
  vehicles: defineTable({
    // REQUIRED FIELDS (Not Nullable)
    projectId: v.id('projects'), // ✅ Parent project reference - required relationship
    // NOTE: Use _creationTime instead of createdAt (auto-managed by Convex)
    updatedAt: v.number(), // ✅ Last update timestamp - required for audit
    optimizerId: v.optional(v.number()), // ❓ Numeric ID for optimization engines - temporarily optional for migration

    // OPTIONAL FIELDS (Nullable)
    scenarioId: v.optional(v.id('scenarios')), // ❓ Optional scenario assignment
    datasetId: v.optional(v.id('datasets')), // ❓ Optional dataset assignment
    description: v.optional(v.string()), // ❓ Vehicle description/name
    profile: v.optional(v.string()), // ❓ Vehicle profile (car, truck, bike)

    // Location coordinates (either coordinates or location references)
    startLon: v.optional(v.number()), // ❓ Starting longitude
    startLat: v.optional(v.number()), // ❓ Starting latitude
    endLon: v.optional(v.number()), // ❓ Ending longitude
    endLat: v.optional(v.number()), // ❓ Ending latitude
    startLocationId: v.optional(v.id('locations')), // ❓ Starting location reference
    endLocationId: v.optional(v.id('locations')), // ❓ Ending location reference

    // Vehicle capabilities
    capacity: v.optional(v.array(v.number())), // ❓ Multi-dimensional capacity array
    skills: v.optional(v.array(v.number())), // ❓ Vehicle skill IDs

    // Time windows and constraints
    twStart: v.optional(v.number()), // ❓ Time window start
    twEnd: v.optional(v.number()), // ❓ Time window end
    speedFactor: v.optional(v.number()), // ❓ Speed modification factor
    maxTasks: v.optional(v.number()), // ❓ Maximum tasks per route
    maxTravelTime: v.optional(v.number()), // ❓ Maximum travel time
    maxDistance: v.optional(v.number()), // ❓ Maximum distance

    // Cost structure
    costFixed: v.optional(v.number()), // ❓ Fixed cost per vehicle
    costPerHour: v.optional(v.number()), // ❓ Hourly operating cost
    costPerKm: v.optional(v.number()), // ❓ Distance-based cost

    // Dataset metadata
    datasetName: v.optional(v.string()), // ❓ Source dataset name
    datasetVersion: v.optional(v.number()), // ❓ Source dataset version
  })
    .index('by_project', ['projectId'])
    .index('by_scenario', ['scenarioId'])
    .index('by_dataset', ['datasetId'])
    .index('by_location', ['startLocationId'])
    .index('by_optimizer_id', ['optimizerId']), // Required for VROOM ID mapping

  // Jobs - Individual tasks/stops for vehicles
  jobs: defineTable({
    // REQUIRED FIELDS (Not Nullable)
    projectId: v.id('projects'), // ✅ Parent project reference - required relationship
    // NOTE: Use _creationTime instead of createdAt (auto-managed by Convex)
    updatedAt: v.number(), // ✅ Last update timestamp - required for audit
    optimizerId: v.optional(v.number()), // ❓ Numeric ID for optimization engines - temporarily optional for migration

    // OPTIONAL FIELDS (Nullable)
    scenarioId: v.optional(v.id('scenarios')), // ❓ Optional scenario assignment
    datasetId: v.optional(v.id('datasets')), // ❓ Optional dataset assignment
    locationId: v.optional(v.id('locations')), // ❓ Location reference
    description: v.optional(v.string()), // ❓ Job description

    // Location coordinates (alternative to locationId)
    locationLon: v.optional(v.number()), // ❓ Job longitude
    locationLat: v.optional(v.number()), // ❓ Job latitude

    // Time requirements
    setup: v.optional(v.number()), // ❓ Setup time (seconds)
    service: v.optional(v.number()), // ❓ Service time (seconds)

    // Capacity requirements
    delivery: v.optional(v.array(v.number())), // ❓ Delivery quantities
    pickup: v.optional(v.array(v.number())), // ❓ Pickup quantities

    // Job constraints
    skills: v.optional(v.array(v.number())), // ❓ Required skill IDs
    priority: v.optional(v.number()), // ❓ Job priority level
    timeWindows: v.optional(
      v.array(
        v.object({
          // ❓ Valid service time windows
          start: v.number(), // Required if timeWindows exists
          end: v.number(), // Required if timeWindows exists
        })
      )
    ),

    // Dataset metadata
    datasetName: v.optional(v.string()), // ❓ Source dataset name
    datasetVersion: v.optional(v.number()), // ❓ Source dataset version
  })
    .index('by_project', ['projectId'])
    .index('by_scenario', ['scenarioId'])
    .index('by_dataset', ['datasetId'])
    .index('by_location', ['locationId'])
    .index('by_priority', ['priority']) // Optimization engines typically require 0-100 priority range
    .index('by_optimizer_id', ['optimizerId']), // Required for optimization engine ID mapping

  // Locations - Geographic points of interest
  locations: defineTable({
    // REQUIRED FIELDS (Not Nullable)
    projectId: v.id('projects'), // ✅ Parent project reference - required relationship
    name: v.string(), // ✅ Location name - always required
    // NOTE: Use _creationTime instead of createdAt (auto-managed by Convex)
    updatedAt: v.number(), // ✅ Last update timestamp - required for audit

    // OPTIONAL FIELDS (Nullable)
    scenarioId: v.optional(v.id('scenarios')), // ❓ Optional scenario assignment
    datasetId: v.optional(v.id('datasets')), // ❓ Optional dataset assignment
    clusterId: v.optional(v.id('locationClusters')), // ❓ Location cluster assignment
    address: v.optional(v.string()), // ❓ Physical address
    description: v.optional(v.string()), // ❓ Location description
    locationLon: v.optional(v.number()), // ❓ Longitude coordinate
    locationLat: v.optional(v.number()), // ❓ Latitude coordinate
    locationType: v.optional(v.string()), // ❓ Type (depot, customer, warehouse)
    operatingHours: v.optional(v.string()), // ❓ Operating hours string
    contactInfo: v.optional(v.string()), // ❓ Contact information
    timezone: v.optional(v.string()), // ❓ Location timezone
    datasetName: v.optional(v.string()), // ❓ Source dataset name
    datasetVersion: v.optional(v.number()), // ❓ Source dataset version
  })
    .index('by_project', ['projectId'])
    .index('by_scenario', ['scenarioId'])
    .index('by_dataset', ['datasetId'])
    .index('by_cluster', ['clusterId'])
    .index('by_type', ['locationType'])
    .index('by_name', ['name']),

  // Routes (derived from Route Summaries and Steps)
  routes: defineTable({
    // REQUIRED FIELDS (Not Nullable)
    // NOTE: Use _creationTime instead of createdAt (auto-managed by Convex)
    updatedAt: v.number(), // ✅ Last update timestamp - required for audit

    // OPTIONAL FIELDS (Nullable) - Routes may be partial or in draft state
    optimizationRunId: v.optional(v.id('optimizationRuns')), // ❓ Parent optimization run
    vehicleId: v.optional(v.id('vehicles')), // ❓ Assigned vehicle
    projectId: v.optional(v.id('projects')), // ❓ Project reference

    // Route metrics
    cost: v.optional(v.number()), // ❓ Total route cost
    distance: v.optional(v.number()), // ❓ Total distance traveled
    duration: v.optional(v.number()), // ❓ Total route duration
    waitingTime: v.optional(v.number()), // ❓ Total waiting time
    serviceTime: v.optional(v.number()), // ❓ Total service time
    setupTime: v.optional(v.number()), // ❓ Total setup time

    // Route content summary
    deliveries: v.optional(v.array(v.number())), // ❓ Delivery quantities
    pickups: v.optional(v.array(v.number())), // ❓ Pickup quantities
    priority: v.optional(v.number()), // ❓ Route priority
    deliveryCount: v.optional(v.number()), // ❓ Number of deliveries

    // Route violations and geometry
    violations: v.optional(v.array(v.object({}))), // ❓ Constraint violations
    geometry: v.optional(v.string()), // ❓ Route geometry (WKT/GeoJSON)
    geojson: v.optional(v.object({})), // ❓ GeoJSON representation

    // Metadata
    currencyCode: v.optional(v.string()), // ❓ Currency for cost values
    datasetName: v.optional(v.string()), // ❓ Source dataset name
    datasetVersion: v.optional(v.number()), // ❓ Source dataset version
  })
    .index('by_optimization_run', ['optimizationRunId'])
    .index('by_vehicle', ['vehicleId'])
    .index('by_project', ['projectId']),

  // Shipments - Pickup and delivery pairs
  shipments: defineTable({
    // REQUIRED FIELDS (Not Nullable)
    projectId: v.id('projects'), // ✅ Parent project reference - required relationship
    optimizerId: v.optional(v.number()), // ❓ Numeric ID for optimization engines - temporarily optional for migration
    // NOTE: Use _creationTime instead of createdAt (auto-managed by Convex)
    updatedAt: v.number(), // ✅ Last update timestamp - required for audit

    // OPTIONAL FIELDS (Nullable)
    scenarioId: v.optional(v.id('scenarios')), // ❓ Optional scenario assignment
    datasetId: v.optional(v.id('datasets')), // ❓ Optional dataset assignment
    description: v.optional(v.string()), // ❓ Shipment description

    // Pickup location coordinates
    pickupLon: v.optional(v.number()), // ❓ Pickup longitude
    pickupLat: v.optional(v.number()), // ❓ Pickup latitude
    pickupLocationId: v.optional(v.id('locations')), // ❓ Pickup location reference

    // Delivery location coordinates
    deliveryLon: v.optional(v.number()), // ❓ Delivery longitude
    deliveryLat: v.optional(v.number()), // ❓ Delivery latitude
    deliveryLocationId: v.optional(v.id('locations')), // ❓ Delivery location reference

    // Capacity requirements (must be exactly 3 elements for VROOM)
    amount: v.optional(v.array(v.number())), // ❓ Shipment quantities [weight, volume, count]

    // Job constraints
    skills: v.optional(v.array(v.number())), // ❓ Required skill IDs
    priority: v.optional(v.number()), // ❓ Shipment priority (0-100 for VROOM)

    // Pickup timing
    pickupSetup: v.optional(v.number()), // ❓ Pickup setup time (seconds)
    pickupService: v.optional(v.number()), // ❓ Pickup service time (seconds)
    pickupTimeWindows: v.optional(
      v.array(
        v.object({
          // ❓ Pickup time windows
          start: v.number(), // Required if pickupTimeWindows exists
          end: v.number(), // Required if pickupTimeWindows exists
        })
      )
    ),

    // Delivery timing
    deliverySetup: v.optional(v.number()), // ❓ Delivery setup time (seconds)
    deliveryService: v.optional(v.number()), // ❓ Delivery service time (seconds)
    deliveryTimeWindows: v.optional(
      v.array(
        v.object({
          // ❓ Delivery time windows
          start: v.number(), // Required if deliveryTimeWindows exists
          end: v.number(), // Required if deliveryTimeWindows exists
        })
      )
    ),

    // Dataset metadata
    datasetName: v.optional(v.string()), // ❓ Source dataset name
    datasetVersion: v.optional(v.number()), // ❓ Source dataset version
  })
    .index('by_project', ['projectId'])
    .index('by_scenario', ['scenarioId'])
    .index('by_dataset', ['datasetId'])
    .index('by_pickup_location', ['pickupLocationId'])
    .index('by_delivery_location', ['deliveryLocationId'])
    .index('by_priority', ['priority'])
    .index('by_optimizer_id', ['optimizerId']),

  // Supporting Tables

  // Products - Items being transported
  products: defineTable({
    // REQUIRED FIELDS (Not Nullable)
    projectId: v.id('projects'), // ✅ Parent project reference - required relationship
    name: v.string(), // ✅ Product name - always required
    unitType: v.string(), // ✅ Unit of measurement - required for calculations
    // NOTE: Use _creationTime instead of createdAt (auto-managed by Convex)
    updatedAt: v.number(), // ✅ Last update timestamp - required for audit

    // OPTIONAL FIELDS (Nullable)
    category: v.optional(v.string()), // ❓ Product category
    weightPerUnitKg: v.optional(v.number()), // ❓ Weight per unit in kilograms
    volumePerUnitM3: v.optional(v.number()), // ❓ Volume per unit in cubic meters
    lengthCm: v.optional(v.number()), // ❓ Length in centimeters
    widthCm: v.optional(v.number()), // ❓ Width in centimeters
    heightCm: v.optional(v.number()), // ❓ Height in centimeters
    stackable: v.optional(v.boolean()), // ❓ Can be stacked flag
    requiresRefrigeration: v.optional(v.boolean()), // ❓ Refrigeration required flag
    hazmatClass: v.optional(v.string()), // ❓ Hazardous material classification
    handlingInstructions: v.optional(v.string()), // ❓ Special handling instructions
  })
    .index('by_project', ['projectId'])
    .index('by_category', ['category'])
    .index('by_name', ['name']),

  // Skills - Capabilities required for jobs or possessed by vehicles
  skills: defineTable({
    // REQUIRED FIELDS (Not Nullable)
    // NOTE: Use _creationTime instead of createdAt (auto-managed by Convex)
    updatedAt: v.number(), // ✅ Last update timestamp - required for audit

    // OPTIONAL FIELDS (Nullable) - Note: Skills can be global or project-specific
    projectId: v.optional(v.id('projects')), // ❓ Optional project scope (null = global skill)
    name: v.optional(v.string()), // ❓ Skill name
    description: v.optional(v.string()), // ❓ Skill description
    skillCode: v.optional(v.string()), // ❓ Unique skill code
    category: v.optional(v.string()), // ❓ Skill category
    subcategory: v.optional(v.string()), // ❓ Skill subcategory
    parentSkillId: v.optional(v.id('skills')), // ❓ Parent skill for hierarchy
    skillType: v.optional(v.string()), // ❓ Type of skill
    requiresCertification: v.optional(v.boolean()), // ❓ Certification required flag
    certificationAuthority: v.optional(v.string()), // ❓ Certifying authority
    certificationExpiryRequired: v.optional(v.boolean()), // ❓ Expiry tracking required
    optimizerSkillId: v.optional(v.number()), // ❓ Optimization engine skill ID
    isActive: v.optional(v.boolean()), // ❓ Active skill flag
  })
    .index('by_project', ['projectId'])
    .index('by_category', ['category'])
    .index('by_skill_code', ['skillCode'])
    .index('by_parent', ['parentSkillId']),

  // Optimization Run Settings - Configuration for optimization algorithms
  optimizationRunSettings: defineTable({
    // REQUIRED FIELDS (Not Nullable)
    datasetId: v.id('datasets'), // ✅ Target dataset - required relationship
    name: v.string(), // ✅ Settings name - always required
    algorithm: v.string(), // ✅ Algorithm type - required for execution
    optimizationEngine: v.string(), // ✅ Engine type (VROOM, OR-Tools) - required
    parameters: v.object({
      // ✅ Algorithm parameters - required object
      maxIterations: v.optional(v.number()), // ❓ Maximum iterations
      timeLimit: v.optional(v.number()), // ❓ Time limit in seconds
      vehicleBreaks: v.optional(v.boolean()), // ❓ Enable vehicle breaks
      trafficMatrix: v.optional(v.boolean()), // ❓ Use traffic matrix
      balanceRoutes: v.optional(v.boolean()), // ❓ Balance route loads
      minimizeVehicles: v.optional(v.boolean()), // ❓ Minimize vehicle count
      allowSplitDeliveries: v.optional(v.boolean()), // ❓ Allow split deliveries
    }),
    // NOTE: Use _creationTime instead of createdAt (auto-managed by Convex)
    updatedAt: v.number(), // ✅ Last update timestamp - required for audit

    // OPTIONAL FIELDS (Nullable)
    description: v.optional(v.string()), // ❓ Settings description
    constraints: v.optional(
      v.object({
        // ❓ Optimization constraints
        maxVehicleCapacity: v.optional(v.number()), // ❓ Maximum vehicle capacity
        maxRouteDistance: v.optional(v.number()), // ❓ Maximum route distance
        maxRouteDuration: v.optional(v.number()), // ❓ Maximum route duration
        enforceTimeWindows: v.optional(v.boolean()), // ❓ Enforce time windows
        enforceSkillMatching: v.optional(v.boolean()), // ❓ Enforce skill matching
      })
    ),
    objectives: v.optional(
      v.object({
        // ❓ Optimization objectives
        minimizeCost: v.optional(v.number()), // ❓ Cost minimization weight
        minimizeDistance: v.optional(v.number()), // ❓ Distance minimization weight
        minimizeDuration: v.optional(v.number()), // ❓ Duration minimization weight
        maximizeServiceLevel: v.optional(v.number()), // ❓ Service level weight
      })
    ),
    isDefault: v.optional(v.boolean()), // ❓ Default settings flag
    isActive: v.optional(v.boolean()), // ❓ Active settings flag
    createdBy: v.optional(v.string()), // ❓ User who created settings
  })
    .index('by_dataset', ['datasetId'])
    .index('by_algorithm', ['algorithm'])
    .index('by_default', ['isDefault'])
    .index('by_active', ['isActive']),

  // Optimization Runs - Results of optimization executions
  optimizationRuns: defineTable({
    // REQUIRED FIELDS (Not Nullable)
    scenarioId: v.id('scenarios'), // ✅ Parent scenario - required relationship
    timestamp: v.number(), // ✅ Run timestamp - required for tracking
    currencyCode: v.string(), // ✅ Currency for cost calculations - required
    algorithm: v.string(), // ✅ Algorithm used - required for reference
    durationMs: v.number(), // ✅ Execution duration - required for performance tracking
    settings: v.object({}), // ✅ Settings used - required for reproducibility
    optimizationEngine: v.string(), // ✅ Engine used - required for tracking
    optimizationParameters: v.object({}), // ✅ Parameters used - required for reproducibility

    // OPTIONAL FIELDS (Nullable)
    projectId: v.optional(v.id('projects')), // ❓ Optional project reference (derived from scenario)
    datasetId: v.optional(v.id('datasets')), // ❓ Optional dataset reference
    optimizationRunSettingsId: v.optional(v.id('optimizationRunSettings')), // ❓ Settings template used

    // Execution metadata
    computingTime: v.optional(v.number()), // ❓ Server computing time
    status: v.optional(v.string()), // ❓ Run status (success, failed, running)
    errorMessage: v.optional(v.string()), // ❓ Error details if failed

    // Result summary statistics
    totalCost: v.optional(v.number()), // ❓ Total optimization cost
    totalRoutes: v.optional(v.number()), // ❓ Number of routes generated
    totalUnassigned: v.optional(v.number()), // ❓ Number of unassigned tasks
    totalDistance: v.optional(v.number()), // ❓ Total distance traveled
    totalDuration: v.optional(v.number()), // ❓ Total route duration
    totalWaitingTime: v.optional(v.number()), // ❓ Total waiting time
    totalServiceTime: v.optional(v.number()), // ❓ Total service time
    totalSetupTime: v.optional(v.number()), // ❓ Total setup time
    totalVehicles: v.optional(v.number()), // ❓ Number of vehicles used
    totalJobs: v.optional(v.number()), // ❓ Number of jobs processed
    totalShipments: v.optional(v.number()), // ❓ Number of shipments processed

    // Raw data for debugging
    rawRequest: v.optional(v.object({})), // ❓ Original solver request
    rawResponse: v.optional(v.object({})), // ❓ Raw solver response

    // Dataset metadata
    datasetName: v.optional(v.string()), // ❓ Source dataset name
    datasetVersion: v.optional(v.number()), // ❓ Source dataset version
    createdBy: v.optional(v.string()), // ❓ User who initiated the run
  })
    .index('by_scenario', ['scenarioId'])
    .index('by_project', ['projectId'])
    .index('by_dataset', ['datasetId'])
    .index('by_settings', ['optimizationRunSettingsId'])
    .index('by_status', ['status'])
    .index('by_timestamp', ['timestamp']),

  // Supporting Tables
  locationClusterMembership: defineTable({
    locationId: v.id('locations'),
    clusterId: v.id('locationClusters'),
    // NOTE: Use _creationTime instead of createdAt (auto-managed by Convex)
    updatedAt: v.number(),
  })
    .index('by_location', ['locationId'])
    .index('by_cluster', ['clusterId']),

  locationClusters: defineTable({
    projectId: v.id('projects'),
    name: v.string(),
    description: v.optional(v.string()),
    centerLon: v.optional(v.number()),
    centerLat: v.optional(v.number()),
    radius: v.optional(v.number()),
    color: v.optional(v.string()),
    // NOTE: Use _creationTime instead of createdAt (auto-managed by Convex)
    updatedAt: v.number(),
  }).index('by_project', ['projectId']),

  projectUsers: defineTable({
    projectId: v.id('projects'),
    userId: v.string(),
    role: v.string(),
    permissions: v.optional(v.array(v.string())),
    invitedBy: v.optional(v.string()),
    invitedAt: v.optional(v.number()),
    joinedAt: v.optional(v.number()),
    status: v.optional(v.string()),
  })
    .index('by_project', ['projectId'])
    .index('by_user', ['userId'])
    .index('by_role', ['role']),

  // Keep the tasks table for now to avoid breaking existing functions
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
  }),
})
