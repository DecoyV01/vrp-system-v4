# VRP System v4 - API Specifications

## Document Information
- **Version**: 1.0
- **Last Updated**: 2025-07-06
- **Status**: Production Ready
- **API Type**: Convex Serverless Functions (Queries & Mutations)

## 1. Overview

The VRP System v4 provides a comprehensive API through Convex serverless functions, implementing a four-level hierarchy: **Projects → Scenarios → Datasets → Tables** (vehicles, jobs, locations, routes). All functions use TypeScript with complete type safety and real-time WebSocket synchronization.

## 2. Authentication & Authorization

### 2.1 Authentication Pattern

```typescript
// Current user retrieval (all functions use this pattern)
const user = await getCurrentUser(ctx);
// Returns: { _id: string, name: string, email: string }
```

### 2.2 Authorization Model

- **User Ownership**: All data scoped to project owners with strict validation
- **Cross-User Isolation**: Users can only access data they own
- **Hierarchical Validation**: Child entities inherit parent ownership rules

```typescript
// Standard ownership validation pattern
await validateUserOwnership(ctx, projectId, user._id);
// Throws: "Project not found" | "Access denied: User does not own this project"
```

## 3. Core API Functions

### 3.1 Projects API (`projects.ts`)

#### `projects.list` - Query
**Purpose**: Get all projects for current user
```typescript
// Request
query({
  handler: async (ctx) => // No parameters
})

// Response
Project[] // Array of user's projects

// Authentication: Required
// Authorization: Returns only user-owned projects
```

#### `projects.getById` - Query
**Purpose**: Get single project by ID
```typescript
// Request
query({
  args: { id: v.id("projects") }
})

// Response
Project | throws Error

// Errors:
// - "Project not found"
// - "Access denied: User does not own this project"
```

#### `projects.create` - Mutation
**Purpose**: Create new project
```typescript
// Request
mutation({
  args: {
    name: v.string(),                      // Required, 1-100 chars
    description?: v.string(),              // Optional, max 1000 chars
    currency?: v.string(),                 // Optional, 3 chars (USD, EUR)
    projectType?: v.string(),              // Optional, max 50 chars
    industry?: v.string(),                 // Optional, max 50 chars
    geographicRegion?: v.string(),         // Optional, max 100 chars
    priority?: "low" | "medium" | "high" | "critical",
    estimatedVehicles?: v.number(),        // Optional, >= 0
    estimatedJobs?: v.number(),            // Optional, >= 0
    planningHorizonDays?: v.number(),      // Optional, 1-365 days
    contactPerson?: v.string(),            // Optional, max 100 chars
    contactEmail?: v.string(),             // Optional, valid email
    contactPhone?: v.string(),             // Optional, max 20 chars
    tags?: v.array(v.string()),            // Optional, max 10 tags, 50 chars each
    notes?: v.string()                     // Optional, max 2000 chars
  }
})

// Response
Id<"projects"> // Created project ID

// Side Effects:
// - Sets ownerId to current user
// - Sets createdAt and updatedAt timestamps
// - Applies comprehensive Zod validation
```

#### `projects.update` - Mutation
**Purpose**: Update existing project
```typescript
// Request: Project ID + any of the create fields (all optional)
// Response: Id<"projects"> - Updated project ID
// Authorization: Must own project
// Side Effects: Updates updatedAt timestamp, filters undefined values
```

#### `projects.remove` - Mutation
**Purpose**: Delete project and all related data
```typescript
// Request
mutation({
  args: { id: v.id("projects") }
})

// Response
Id<"projects"> // Deleted project ID

// Side Effects: CASCADING DELETE of:
// - All scenarios
// - All datasets  
// - All vehicles
// - All jobs
// - All locations
// - All products
// - All project-specific skills
// - All project users
```

#### `projects.getStats` - Query
**Purpose**: Get project statistics
```typescript
// Response
{
  scenarioCount: number,
  datasetCount: number,
  vehicleCount: number,
  jobCount: number,
  locationCount: number
}
```

### 3.2 Scenarios API (`scenarios.ts`)

#### `scenarios.create` - Mutation
**Purpose**: Create optimization scenario
```typescript
// Request
mutation({
  args: {
    projectId: v.id("projects"),           // Required
    name: v.string(),                      // Required, 1-100 chars
    description?: v.string(),              // Optional, max 1000 chars
    startDate?: v.number(),                // Optional, timestamp
    endDate?: v.number(),                  // Optional, must be > startDate
    planningHorizonDays?: v.number(),      // Optional, 1-365 days
    optimizationObjective?: "minimize_cost" | "minimize_distance" | 
                           "minimize_duration" | "maximize_service_level",
    optimizationParameters?: v.object({}),
    status?: "draft" | "active" | "completed" | "archived",
    tags?: v.array(v.string()),            // Optional, max 10 tags
    isActive?: v.boolean()
  }
})

// Response
Id<"scenarios"> // Created scenario ID

// Validation:
// - endDate must be after startDate if both provided
// - projectId must be owned by user

// Side Effects:
// - Sets optimizationCount to 0
// - Sets createdAt and updatedAt timestamps
```

#### `scenarios.clone` - Mutation
**Purpose**: Clone existing scenario
```typescript
// Request
mutation({
  args: {
    id: v.id("scenarios"),
    newName: v.string(),
    projectId?: v.id("projects")           // Optional, defaults to same project
  }
})

// Response
Id<"scenarios"> // Cloned scenario ID

// Side Effects:
// - Creates new scenario with status "draft"
// - Sets isActive to false
// - Sets optimizationCount to 0
```

### 3.3 Datasets API (`datasets.ts`)

#### `datasets.create` - Mutation
**Purpose**: Create versioned dataset
```typescript
// Request
mutation({
  args: {
    projectId: v.id("projects"),           // Required
    scenarioId?: v.id("scenarios"),        // Optional
    name: v.string(),                      // Required, 1-100 chars
    version?: v.number(),                  // Optional, auto-incremented
    description?: v.string(),              // Optional, max 1000 chars
    status?: "draft" | "active" | "archived",
    createdFromDatasetId?: v.id("datasets"), // Optional, for cloning
    isBaseline?: v.boolean(),
    tags?: v.array(v.string()),            // Optional, max 10 tags
    datasetType?: "baseline" | "variant" | "test" | "production",
    versionNote?: v.string()               // Optional, max 500 chars
  }
})

// Response
Id<"datasets"> // Created dataset ID

// Side Effects:
// - Auto-increments version number within project
// - Initializes all entity counts to 0
// - Validates scenario belongs to same project
```

#### `datasets.updateEntityCounts` - Mutation
**Purpose**: Update cached entity counts
```typescript
// Request
mutation({
  args: {
    id: v.id("datasets"),
    vehicleCount?: v.number(),
    jobCount?: v.number(),
    locationCount?: v.number()
  }
})

// Side Effects:
// - Updates individual count fields
// - Updates entityCounts object
// - Updates updatedAt timestamp
```

### 3.4 Vehicles API (`vehicles.ts`)

#### `vehicles.create` - Mutation
**Purpose**: Define vehicle in fleet
```typescript
// Request
mutation({
  args: {
    projectId: v.id("projects"),           // Required
    scenarioId?: v.id("scenarios"),
    datasetId?: v.id("datasets"),
    description?: v.string(),              // Optional, max 200 chars
    profile?: "car" | "truck" | "van" | "bike" | "walking" | "motorcycle",
    
    // Location coordinates OR location references
    startLon?: v.number(),                 // Optional, -180 to 180
    startLat?: v.number(),                 // Optional, -90 to 90
    endLon?: v.number(),                   // Optional, -180 to 180  
    endLat?: v.number(),                   // Optional, -90 to 90
    startLocationId?: v.id("locations"),
    endLocationId?: v.id("locations"),
    
    // Vehicle capabilities
    capacity?: v.array(v.number()),        // Optional, max 10 dimensions, >= 0
    skills?: v.array(v.number()),          // Optional, max 50 skills, >= 0
    
    // Time constraints
    twStart?: v.number(),                  // Optional, seconds >= 0
    twEnd?: v.number(),                    // Optional, seconds > twStart
    speedFactor?: v.number(),              // Optional, 0.1 to 10
    maxTasks?: v.number(),                 // Optional, 1 to 1000
    maxTravelTime?: v.number(),            // Optional, seconds >= 0
    maxDistance?: v.number(),              // Optional, meters >= 0
    
    // Cost structure
    costFixed?: v.number(),                // Optional, >= 0
    costPerHour?: v.number(),              // Optional, >= 0
    costPerKm?: v.number(),                // Optional, >= 0
    
    optimizerId?: v.number()               // Optional, auto-generated
  }
})

// Response
Id<"vehicles"> // Created vehicle ID

// Validation Rules:
// - Both lon/lat coordinates must be provided together
// - twEnd must be greater than twStart
// - Scenario/dataset must belong to same project
// - All numeric constraints enforced

// Side Effects:
// - Generates random optimizerId if not provided
// - Updates dataset vehicle count
// - Sets updatedAt timestamp
```

#### `vehicles.bulkImport` - Mutation
**Purpose**: Import multiple vehicles from CSV
```typescript
// Request
mutation({
  args: {
    projectId: v.id("projects"),           // Required
    datasetId?: v.id("datasets"),
    scenarioId?: v.id("scenarios"),
    vehicles: v.array(VehicleData),        // Array of vehicle objects
    clearExisting?: v.boolean()            // Optional, clears existing first
  }
})

// Response
{
  importedCount: number,
  vehicleIds: Id<"vehicles">[]
}

// Side Effects:
// - Optionally clears existing vehicles
// - Updates dataset vehicle count
// - Validates all vehicles before importing any
```

### 3.5 Jobs API (`jobs.ts`)

#### `jobs.create` - Mutation
**Purpose**: Define job/task for optimization
```typescript
// Request
mutation({
  args: {
    projectId: v.id("projects"),           // Required
    scenarioId?: v.id("scenarios"),
    datasetId?: v.id("datasets"),
    locationId?: v.id("locations"),
    description?: v.string(),              // Optional, max 200 chars
    
    // Location coordinates (alternative to locationId)
    locationLon?: v.number(),              // Optional, -180 to 180
    locationLat?: v.number(),              // Optional, -90 to 90
    
    // Time requirements
    setup?: v.number(),                    // Optional, seconds >= 0
    service?: v.number(),                  // Optional, seconds >= 0
    
    // Capacity requirements
    delivery?: v.array(v.number()),        // Optional, max 10 dimensions, >= 0
    pickup?: v.array(v.number()),          // Optional, max 10 dimensions, >= 0
    
    // Job constraints
    skills?: v.array(v.number()),          // Optional, max 50 skills, >= 0
    priority?: v.number(),                 // Optional, 0 to 100
    timeWindows?: v.array(v.object({       // Optional, max 5 windows
      start: v.number(),                   // Required, seconds >= 0
      end: v.number()                      // Required, seconds > start
    }))
  }
})

// Response
Id<"jobs"> // Created job ID

// Validation Rules:
// - Both lon/lat coordinates must be provided together
// - Time window ends must be after starts
// - Location/scenario/dataset must belong to same project

// Side Effects:
// - Generates auto-incremented optimizerId
// - Updates dataset job count
// - Sets updatedAt timestamp
```

#### `jobs.getStatsByDataset` - Query
**Purpose**: Get job statistics for dataset
```typescript
// Response
{
  totalJobs: number,
  jobsWithTimeWindows: number,
  jobsWithDelivery: number,
  jobsWithPickup: number,
  jobsWithSkills: number,
  averagePriority: number,
  totalDeliveryQuantity: number,
  totalPickupQuantity: number
}
```

### 3.6 Locations API (`locations.ts`)

#### `locations.create` - Mutation
**Purpose**: Define geographic location
```typescript
// Request
mutation({
  args: {
    projectId: v.id("projects"),           // Required
    scenarioId?: v.id("scenarios"),
    datasetId?: v.id("datasets"),
    clusterId?: v.id("locationClusters"),
    name: v.string(),                      // Required, 1-100 chars
    address?: v.string(),                  // Optional, max 300 chars
    description?: v.string(),              // Optional, max 1000 chars
    locationLon?: v.number(),              // Optional, -180 to 180
    locationLat?: v.number(),              // Optional, -90 to 90
    locationType?: "depot" | "customer" | "warehouse" | 
                   "distribution_center" | "pickup_point" | "delivery_point",
    operatingHours?: v.string(),           // Optional, max 100 chars
    contactInfo?: v.string(),              // Optional, max 200 chars
    timezone?: v.string()                  // Optional, max 50 chars
  }
})

// Response
Id<"locations"> // Created location ID

// Side Effects:
// - Updates dataset location count
// - Sets updatedAt timestamp
```

#### `locations.findNearby` - Query
**Purpose**: Find locations within radius
```typescript
// Request
query({
  args: {
    projectId: v.id("projects"),           // Required
    lon: v.number(),                       // Required, search center
    lat: v.number(),                       // Required, search center
    radiusKm?: v.number(),                 // Optional, default 10km
    limit?: v.number()
  }
})

// Response
Array<Location & { distanceKm: number }> // Sorted by distance

// Algorithm: Uses Haversine formula for distance calculation
```

### 3.7 Routes API (`routes.ts`)

#### `routes.storeOptimizationResults` - Mutation
**Purpose**: Store optimization results from solver
```typescript
// Request
mutation({
  args: {
    optimizationRunId: v.id("optimizationRuns"), // Required
    projectId: v.id("projects"),           // Required
    routes: v.array(v.object({
      vehicleId?: v.id("vehicles"),
      cost?: v.number(),                   // Optional, >= 0
      distance?: v.number(),               // Optional, >= 0 (meters)
      duration?: v.number(),               // Optional, >= 0 (seconds)
      waitingTime?: v.number(),            // Optional, >= 0 (seconds)
      serviceTime?: v.number(),            // Optional, >= 0 (seconds)
      setupTime?: v.number(),              // Optional, >= 0 (seconds)
      deliveries?: v.array(v.number()),    // Optional, >= 0 quantities
      pickups?: v.array(v.number()),       // Optional, >= 0 quantities
      priority?: v.number(),               // Optional, 0-100
      deliveryCount?: v.number(),          // Optional, >= 0
      violations?: v.array(v.object({})),  // Optional, constraint violations
      geometry?: v.string(),               // Optional, WKT/GeoJSON, max 10000 chars
      geojson?: v.object({}),              // Optional, GeoJSON object
      currencyCode?: v.string()            // Optional, 3 characters
    }))
  }
})

// Response
{
  storedCount: number,
  routeIds: Id<"routes">[]
}

// Side Effects:
// - Clears existing routes for optimization run first
// - Validates vehicle belongs to same project
```

#### `routes.getEfficiencyMetrics` - Query
**Purpose**: Calculate route performance metrics
```typescript
// Response
{
  costEfficiency: number,                // Cost per distance ratio
  timeUtilization: number,               // % service time vs total time
  distanceEfficiency: number,            // % active time vs total time
  loadUtilization: number,               // Always 0 (needs capacity data)
  routeBalance: number,                  // Workload distribution evenness
  totalCost: number,
  totalDistance: number,
  totalDuration: number,
  averageCostPerRoute: number,
  averageDistancePerRoute: number
}
```

## 4. Validation Framework

### 4.1 Input Validation (Zod Schemas)

All functions use comprehensive Zod validation schemas:

```typescript
// Example: Vehicle validation
const vehicleCreateSchema = z.object({
  description: z.string().max(200).optional(),
  profile: z.enum(["car", "truck", "van", "bike", "walking", "motorcycle"]).optional(),
  startLon: z.number().min(-180).max(180).optional(),
  startLat: z.number().min(-90).max(90).optional(),
  capacity: z.array(z.number().min(0)).max(10).optional(),
  skills: z.array(z.number().int().min(0)).max(50).optional(),
  twStart: z.number().int().min(0).optional(),
  twEnd: z.number().int().min(0).optional(),
  // ... additional fields
}).refine(data => {
  // Custom validation logic
  if (data.twStart !== undefined && data.twEnd !== undefined) {
    return data.twEnd > data.twStart;
  }
  return true;
}, {
  message: "Time window end must be after start",
  path: ["twEnd"]
});
```

### 4.2 VRP Constraints

```typescript
const vrpConstraints = {
  maxVehiclesPerDataset: 1000,
  maxJobsPerDataset: 10000,
  maxLocationsPerDataset: 5000,
  maxCapacityDimensions: 10,
  maxSkillsPerEntity: 50,
  maxTimeWindowsPerJob: 5,
  maxTagsPerEntity: 10
};
```

### 4.3 Bulk Validation

Functions for validating arrays of data:

```typescript
// Example: Bulk vehicle validation
function validateVehiclesBulk(vehicles: any[]) {
  return vehicles.map((vehicle, index) => {
    try {
      return { data: validateVehicle(vehicle), index, valid: true };
    } catch (error) {
      return { 
        error: error instanceof z.ZodError ? error.errors : error, 
        index, 
        valid: false 
      };
    }
  });
}
```

## 5. Optimization Engine Integration

### 5.1 Validation Functions

```typescript
// Capacity validation for VROOM compatibility
validateCapacity(capacity: number[]): void
// Throws: OptimizerValidationError if not exactly 3 elements

// Priority validation for optimization engines
validatePriority(priority: number): void  
// Throws: OptimizerValidationError if not 0-100

// Cost validation for optimization engines
validateCost(cost: number): void
// Throws: OptimizerValidationError if not integer
```

### 5.2 Conversion Functions

```typescript
// Entity converters
toOptimizerVehicle(vehicle: Vehicle): VROOMVehicle
toOptimizerJob(job: Job): VROOMJob
toOptimizerShipment(shipment: Shipment): VROOMShipment

// Time converters
millisecondsToSeconds(ms: number): number
secondsToMilliseconds(s: number): number
convertTimeWindows(windows: TimeWindow[]): VROOMTimeWindow[]

// Cost converters (for integer requirements)
dollarsToCents(dollars: number): number
centsToDollars(cents: number): number
validateAndConvertCost(cost: number, field: string): number

// Coordinate converters
coordsToArray(lon: number, lat: number): [number, number]
arrayToCoords(coords: [number, number]): {lon: number, lat: number}

// ID management
generateNextOptimizerId(ctx: Context, entityType: string): Promise<number>
```

## 6. Error Handling

### 6.1 Authentication Errors

```typescript
// Standard authentication error responses
{
  error: "User not authenticated",
  code: 401
}

{
  error: "Access denied: User does not own this project", 
  code: 403
}
```

### 6.2 Validation Errors

```typescript
// Zod validation errors (example)
{
  error: "Validation failed",
  details: [
    {
      path: ["name"],
      message: "Project name is required"
    },
    {
      path: ["twEnd"], 
      message: "Time window end must be after start"
    }
  ]
}
```

### 6.3 Referential Integrity Errors

```typescript
// Foreign key constraint violations
{
  error: "Cannot delete location: 3 vehicles reference this location",
  referencingEntities: ["vehicle_123", "vehicle_456", "vehicle_789"]
}

{
  error: "Cannot delete location: 5 jobs reference this location", 
  referencingEntities: ["job_abc", "job_def", "job_ghi", "job_jkl", "job_mno"]
}
```

### 6.4 Optimization Engine Errors

```typescript
// OptimizerValidationError examples
{
  error: "OptimizerValidationError",
  message: "Capacity array must have exactly 3 elements [weight, volume, count], got 2",
  field: "capacity",
  value: [100, 50]
}

{
  error: "OptimizerValidationError",
  message: "Priority must be between 0 and 100 for optimization engine compatibility, got 150",
  field: "priority", 
  value: 150
}
```

## 7. Database Performance

### 7.1 Optimized Indexes (58 Total)

**Primary Access Patterns:**
```sql
-- User data isolation
by_owner(ownerId)                    -- All user projects

-- Hierarchical relationships  
by_project(projectId)                -- All entities by project
by_scenario(scenarioId)              -- Entities by scenario
by_dataset(datasetId)                -- Entities by dataset

-- Performance optimizations
by_updated_at(updatedAt)             -- Chronological queries
by_status(status)                    -- Status filtering
by_priority(priority)                -- Priority-based queries

-- Optimization engine support
by_optimizer_id(optimizerId)         -- External system mapping
by_location(locationId)              -- Geographic relationships
by_vehicle(vehicleId)                -- Route assignments
```

**Specialized Indexes:**
```sql
-- Search and filtering
by_name(name)                        -- Location name search
by_type(locationType)                -- Location type filtering  
by_skill_code(skillCode)             -- Skill lookups
by_category(category)                -- Product/skill categories

-- Relationships
by_cluster(clusterId)                -- Location cluster membership
by_parent(parentSkillId)             -- Skill hierarchies
by_optimization_run(optimizationRunId) -- Route results

-- System monitoring
by_timestamp(timestamp)              -- Optimization run chronology
by_algorithm(algorithm)              -- Algorithm performance tracking
```

## 8. Real-time Capabilities

### 8.1 WebSocket Synchronization

All mutations automatically trigger real-time updates:

```typescript
// Client subscription pattern
const projects = useQuery(api.projects.list);
// Automatically re-executes when any project changes

const project = useQuery(api.projects.getById, { id: projectId });
// Automatically updates when this specific project changes
```

### 8.2 Optimistic Updates

```typescript
// Client-side optimistic update pattern
const createProject = useMutation(api.projects.create);

// Optimistically show the project immediately
const handleCreate = async (projectData) => {
  const tempProject = { ...projectData, _id: "temp", _creationTime: Date.now() };
  setOptimisticProjects(prev => [...prev, tempProject]);
  
  try {
    const projectId = await createProject(projectData);
    // Real data automatically replaces optimistic data
  } catch (error) {
    // Remove optimistic data on error
    setOptimisticProjects(prev => prev.filter(p => p._id !== "temp"));
  }
};
```

## 9. Production Configuration

### 9.1 Environment Details

- **Development**: `mild-elephant-70` (development environment)
- **Production**: `mild-elephant-70` (production environment)  
- **Production URL**: https://mild-elephant-70.convex.cloud
- **Functions Deployed**: 70+ functions across 12 TypeScript modules
- **Database Indexes**: 58 optimized indexes for query performance

### 9.2 Performance Characteristics

- **Function Cold Start**: < 100ms (optimized TypeScript functions)
- **Database Queries**: < 50ms (properly indexed queries)
- **Real-time Updates**: < 1 second delivery via WebSocket
- **Bulk Operations**: Support for 1000+ entities per operation
- **Concurrent Users**: Horizontal auto-scaling via Convex platform

### 9.3 Monitoring and Observability

- **Function Performance**: Automatic execution time tracking
- **Database Metrics**: Query performance and index utilization
- **Real-time Connections**: WebSocket connection health monitoring  
- **Error Tracking**: Automatic error detection and logging
- **Usage Analytics**: Function call frequency and patterns

## 10. Integration Points

### 10.1 Claude Code MCP Integration

The API supports direct integration with Claude Code via Model Context Protocol:

```typescript
// MCP server commands for direct database access
npx @modelcontextprotocol/server-convex

// Enables Claude to:
// - Query database directly
// - Execute mutations 
// - Monitor real-time changes
// - Generate reports
// - Validate data integrity
```

### 10.2 External Optimization Engines

```typescript
// VROOM integration example
const vroomRequest = {
  vehicles: vehicles.map(toOptimizerVehicle),
  jobs: jobs.map(toOptimizerJob),
  shipments: shipments.map(toOptimizerShipment),
  options: {
    g: true,  // Return geometry
    c: 3      // Use 3D capacity 
  }
};

const vroomResponse = await fetch('/solve', {
  method: 'POST',
  body: JSON.stringify(vroomRequest)
});

// Store results back to Convex
await routes.storeOptimizationResults({
  optimizationRunId,
  projectId,
  routes: vroomResponse.routes
});
```

## Summary

The VRP System v4 API provides:

- **Complete CRUD operations** for all VRP entities with hierarchical organization
- **Type-safe function signatures** with comprehensive Zod validation
- **Real-time synchronization** via WebSocket with optimistic updates
- **Optimization engine integration** with validation and conversion utilities
- **Advanced querying capabilities** with 58 optimized database indexes
- **Robust error handling** with specific error types and field-level validation
- **Production-ready performance** with horizontal auto-scaling
- **Comprehensive monitoring** with built-in observability tools

The API is designed for scalability, type safety, and seamless integration with modern VRP optimization workflows while maintaining real-time reactivity and data consistency.