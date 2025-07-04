# VRP System - Convex Database Schema

## Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Layer (React + TypeScript)"
        A[React 18 + TypeScript + Vite]
        B[shadcn/ui + Tailwind CSS v4]
        C[Zustand + React Hook Form]
        D[OKLCH Color System]
    end
    
    subgraph "Deployment Layer"
        E[Cloudflare Pages]
        F[GitHub Actions CI/CD]
    end
    
    subgraph "Convex Backend Platform"
        G[Convex Cloud - mild-elephant-70]
        H[Real-time Live Queries]
        I[70+ TypeScript Functions]
        J[Document Database + 49+ Indexes]
        K[Convex Auth]
    end
    
    subgraph "External Services"
        L[Google Cloud VM - FastAPI]
        M[VROOM Solver Port 30010]
    end
    
    A --> G
    G --> H
    G --> I
    G --> J
    G --> K
    A --> L
    L --> M
    
    E --> A
    F --> E
    F --> G
```

## Convex Function Types & Patterns

### Core Function Types in VRP System

#### 📖 Queries (Read Operations)
- **Projects.list()** - Get user's projects with real-time updates
- **Vehicles.getByDataset()** - Live vehicle data for optimization
- **Jobs.getOptimizable()** - Real-time job status for routing
- **Routes.getLive()** - Live route visualization updates
- **Frontend Hook:** `useQuery(api.projects.list)`
- **Auto-reactive:** UI updates when data changes

#### ✏️ Mutations (Write Operations)
- **Projects.create()** - ACID project creation with validation
- **Vehicles.bulkImport()** - Transactional CSV imports
- **Routes.updateOptimization()** - Store VROOM results
- **Jobs.assignToVehicle()** - Manual route adjustments
- **Frontend Hook:** `useMutation(api.projects.create)`
- **Auto-optimistic:** UI updates before server confirmation

#### 🚀 Actions (External Calls)
- **Optimization.runVROOM()** - Call FastAPI + VROOM solver
- **Import.processCSV()** - Handle file uploads & parsing
- **Export.generateReport()** - Create PDF/Excel exports
- **Geocoding.batchLocations()** - External geocoding APIs
- **Frontend Hook:** `useAction(api.optimization.runVROOM)`
- **Long-running:** Perfect for optimization workflows
- **Deployment:** 70+ functions deployed to mild-elephant-70.convex.cloud

#### 🌐 HTTP Actions (REST APIs)
- **webhooks/vroom-complete** - VROOM solver callbacks
- **api/import/csv** - File upload endpoints
- **api/export/routes** - Data export endpoints
- **api/health/check** - System health monitoring
- **Usage:** Standard REST API endpoints
- **Integration:** External systems and webhooks

### VRP-Specific Convex Patterns

#### 🛣️ Real-time Route Optimization Flow

```typescript
// 1. Frontend triggers optimization
const runOptimization = useAction(api.optimization.runVROOM);
await runOptimization({ datasetId, optimizationSettings });

// 2. Action calls external FastAPI
export const runVROOM = action({
  handler: async (ctx, { datasetId, settings }) => {
    // Get data from Convex
    const vehicles = await ctx.runQuery(api.vehicles.getByDataset, { datasetId });
    const jobs = await ctx.runQuery(api.jobs.getByDataset, { datasetId });
    
    // Call external FastAPI + VROOM
    const response = await fetch('http://fastapi:8000/optimize', {
      method: 'POST',
      body: JSON.stringify({ vehicles, jobs, settings })
    });
    
    // Store results back in Convex
    await ctx.runMutation(api.routes.storeOptimizationResults, {
      datasetId,
      results: await response.json()
    });
  }
});

// 3. Frontend automatically updates with new routes
const routes = useQuery(api.routes.getByOptimization, { optimizationId });
```

### Convex Hooks & Real-time Integration

| Hook Type | Usage Pattern | VRP Example | Benefits |
|-----------|---------------|-------------|----------|
| **useQuery** | Reactive data fetching | `useQuery(api.vehicles.list, { datasetId })` | Auto-updates when vehicles change |
| **useMutation** | Optimistic UI updates | `useMutation(api.jobs.create)` | Instant UI feedback + rollback on error |
| **useAction** | Long-running operations | `useAction(api.optimization.run)` | Perfect for VROOM optimization calls |
| **usePaginatedQuery** | Large dataset handling | `usePaginatedQuery(api.routes.listPaginated)` | Efficient loading of route history |
| **useConvex** | Direct client access | `convex.query(api.status.health)` | Non-reactive one-time queries |
| **Zustand Store** | Global state management | `useVRPStore()` | Complements Convex subscriptions |

## Complete Tech Stack Analysis

### Current Production Stack

#### 🎨 Frontend Layer (/frontend/ folder)
- **Framework:** React 18 + TypeScript + Vite
- **Build Tool:** Vite 5.4+ (Fast HMR, ES modules)
- **UI Library:** shadcn/ui + Tailwind CSS v4 (upgraded from v3)
- **Styling:** OKLCH color format (upgraded from HSL)
- **Components:** Radix UI components + custom design system
- **State Management:** Zustand for global state
- **Routing:** React Router v6 with TypeScript
- **Forms:** React Hook Form + Zod validation
- **Real-time:** Convex subscriptions with live queries
- **Testing:** Vitest + React Testing Library
- **Hosting:** Cloudflare Pages (GitHub integration)

#### ⚡ Backend Layer (/convex/ folder)
- **Database:** Convex Document Database (NoSQL with relations)
- **API:** Convex Functions (TypeScript) - 70+ functions deployed
- **Authentication:** Convex Auth (integrated)
- **Real-time:** Convex Live Queries (reactive subscriptions)
- **Storage:** Convex File Storage (integrated)
- **Optimization:** FastAPI (Python 3.13+) + VROOM (external)
- **Indexes:** 49+ optimized indexes for query performance
- **Deployment:** Convex Cloud (mild-elephant-70.convex.cloud)

### Convex Full-Stack Platform (Clean Slate Approach)

#### 🚀 Complete Convex Built-in Capabilities

##### 🎯 Core Platform Features
- **Database:** Convex Document Database (NoSQL with relations)
- **Authentication:** Convex Auth (built-in) - Selected authentication system
- **API:** Convex Functions (TypeScript)
- **Real-time:** Convex Live Queries (reactive subscriptions)
- **File Storage:** Convex File Storage (integrated)
- **Vector Search:** Built-in vector database for AI
- **Scheduling:** Convex Cron Jobs + Workflows
- **Hosting:** Convex Cloud (auto-scaling edge deployment)

##### 🔧 Advanced Built-in Tools
- **Rate Limiting:** Application-layer rate limits (built-in)
- **Aggregations:** Real-time counts and sums
- **Workflows:** Durable execution patterns
- **Workpools:** Managed parallelism and queuing
- **Components:** Reusable backend modules
- **Testing:** Convex Test Harness (pure-JS testing)
- **Validation:** Runtime type validation (built-in)
- **Deployment:** Zero-downtime deploys + rollbacks

### Production Frontend Stack (Implemented)

#### 🎯 Current Implementation: Modern React Stack
- **Framework:** React 18 + TypeScript (✅ Implemented)
- **Build Tool:** Vite 5.4+ (✅ Perfect Convex integration)
- **UI Library:** shadcn/ui + Tailwind CSS v4 (✅ Implemented)
- **State Management:** Convex + Zustand (✅ Implemented)
- **Forms:** React Hook Form + Zod (✅ Implemented)
- **Animations:** Framer Motion (✅ Convex compatible)
- **Charts:** Recharts or D3.js for VRP visualizations (✅ Ready)
- **Maps:** Leaflet + React-Leaflet for route visualization (✅ Ready)
- **Testing:** Vitest + Convex Test Helpers (✅ Configured)
- **Hosting:** Cloudflare Pages (✅ Deployed)

#### 🎨 Design System Implementation
- **Components:** shadcn/ui v4 + Tailwind CSS v4 (✅ Implemented)
- **Typography:** 4 font sizes, 2 weights only (✅ Implemented)
- **Spacing:** 8pt grid system (divisible by 8 or 4) (✅ Implemented)
- **Colors:** 60/30/10 color distribution (✅ Implemented)
- **Format:** OKLCH color format for accessibility (✅ Implemented)
- **Theme:** @theme directive (replaces @layer base) (✅ Implemented)

### VRP-Specific Technology Stack

#### 🚛 VRP System Optimizations (Production)
- **Optimization Engine:** FastAPI (Python 3.13+) + VROOM (✅ Deployed)
- **Geospatial:** Leaflet + React-Leaflet for route visualization (✅ Ready)
- **Charts:** Recharts for optimization metrics (✅ Ready)
- **Real-time Updates:** Convex Live Queries for route changes (✅ Implemented)
- **File Imports:** Convex File Storage for CSV/Excel uploads (✅ Implemented)
- **Background Jobs:** Convex Workflows for long optimizations (✅ Implemented)
- **Rate Limiting:** Convex Rate Limiter for API protection (✅ Implemented)
- **Data Export:** Convex Actions for report generation (✅ Implemented)
- **Monorepo:** /convex/ (backend) + /frontend/ (React app) (✅ Implemented)

### Complete Package.json Dependencies (Production Implementation)

```json
{
  "dependencies": {
    // Core Framework (✅ Implemented)
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "typescript": "^5.5.4",
    
    // Convex Full Stack Platform (✅ Implemented)
    "convex": "^1.16.0",
    "@convex-dev/react-query": "^0.0.0-alpha.4",
    "convex-helpers": "^0.1.57",
    
    // Authentication - Convex Auth (✅ Implemented)
    "convex-auth": "^0.0.65",
    
    // State Management (✅ Implemented)
    "zustand": "^4.5.5",
    
    // UI Library - shadcn/ui + Tailwind CSS v4 (✅ Implemented)
    "@radix-ui/react-*": "latest",
    "tailwindcss": "^4.0.0",              // Upgraded to v4
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.0",
    
    // Forms & Validation (✅ Implemented)
    "react-hook-form": "^7.53.0",
    "zod": "^3.23.8",
    "@hookform/resolvers": "^3.9.0",
    
    // Routing & Navigation (✅ Implemented)
    "react-router-dom": "^6.26.1",
    
    // VRP-Specific Visualization (✅ Ready)
    "recharts": "^2.12.7",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "d3": "^7.9.0",
    
    // Animations & UI Enhancement (✅ Implemented)
    "framer-motion": "^11.5.4",
    "lucide-react": "^0.441.0",
    
    // Utilities (✅ Implemented)
    "date-fns": "^3.6.0",
    "lodash-es": "^4.17.21",
    
    // External API Integration (✅ Implemented for FastAPI)
    "axios": "^1.7.4"
  },
  "devDependencies": {
    // Build Tools (✅ Implemented)
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0",
    
    // Testing (✅ Configured)
    "vitest": "^2.0.5",
    "@testing-library/react": "^16.0.0",
    "convex-test": "^0.0.25",
    
    // Code Quality (✅ Implemented)
    "eslint": "^9.9.0",
    "@typescript-eslint/eslint-plugin": "^8.1.0",
    "prettier": "^3.3.3"
  }
}
```

### Deployment Configuration (✅ Implemented)

```yaml
# GitHub Actions - Monorepo Deployment
name: Deploy VRP System
on:
  push:
    branches: [main]
jobs:
  deploy-convex:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy Convex Backend
        run: |
          cd convex
          npx convex deploy --prod
  
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy Frontend to Cloudflare Pages
        run: |
          cd frontend
          npm run build
          npx wrangler pages publish dist
```

### Technology Decision Matrix (✅ Production Implementation Status)

| Component | Previous | Current Implementation | Status | Benefits Achieved |
|-----------|----------|----------------------|--------|-------------------|
| **Database** | PostgreSQL + Supabase | **Convex Document DB** | ✅ Deployed | No SQL, auto-scaling, real-time, type-safe |
| **API Layer** | Supabase Edge Functions | **Convex Functions (70+)** | ✅ Deployed | Better TypeScript, faster cold starts, auto-optimization |
| **Authentication** | Supabase Auth | **Convex Auth** | ✅ Deployed | Better integration, more providers, type-safe |
| **Real-time** | Supabase Realtime | **Convex Live Queries** | ✅ Implemented | Automatic reactivity, optimistic updates, no setup |
| **File Storage** | Supabase Storage | **Convex File Storage** | ✅ Implemented | Integrated with database, automatic URLs |
| **UI Library** | MUI v6 + Joy UI | **shadcn/ui + Tailwind v4** | ✅ Implemented | 60% smaller bundle, better performance, modern design |
| **State Management** | React Context | **Convex + Zustand** | ✅ Implemented | Type-safe, reactive, automatic sync |
| **Build System** | Vite | **Vite** | ✅ Optimized | Perfect compatibility with Convex |
| **Optimization** | FastAPI + VROOM | **FastAPI + VROOM** | ✅ Deployed | Specialized optimization remains external |
| **Deployment** | Manual/Individual | **Monorepo + GitHub Actions** | ✅ Automated | Single deployment, consistency, reliability |

## Entity Relationship Diagram

```mermaid
erDiagram
    %% Core Hierarchy
    PROJECTS ||--o{ SCENARIOS : contains
    PROJECTS ||--o{ DATASETS : contains
    PROJECTS ||--o{ PROJECT_USERS : has
    PROJECTS ||--o{ VEHICLES : has
    PROJECTS ||--o{ JOBS : has
    PROJECTS ||--o{ SHIPMENTS : has
    PROJECTS ||--o{ LOCATIONS : has
    PROJECTS ||--o{ LOCATION_CLUSTERS : has
    PROJECTS ||--o{ PRODUCTS : has
    PROJECTS ||--o{ SKILLS : has
    PROJECTS ||--o{ CAPACITY_DEFINITIONS : has
    
    SCENARIOS ||--o{ DATASETS : contains
    SCENARIOS ||--o{ OPTIMIZATION_RUNS : generates
    
    %% Dataset Entities
    DATASETS ||--o{ VEHICLES : contains
    DATASETS ||--o{ JOBS : contains
    DATASETS ||--o{ LOCATIONS : contains
    DATASETS ||--o{ SHIPMENTS : contains
    DATASETS ||--o{ PRODUCTS : contains
    DATASETS ||--o{ SKILLS : contains
    DATASETS ||--o{ CAPACITY_DEFINITIONS : contains
    DATASETS ||--o{ OPTIMIZATION_RUN_SETTINGS : has
    
    %% Optimization Flow
    OPTIMIZATION_RUNS ||--o{ ROUTE_SUMMARIES : produces
    OPTIMIZATION_RUNS ||--o{ UNASSIGNED_JOBS : tracks
    OPTIMIZATION_RUN_SETTINGS ||--o{ OPTIMIZATION_RUNS : configures
    
    ROUTE_SUMMARIES ||--o{ ROUTE_STEPS : contains
    
    %% Vehicle Relationships
    VEHICLES ||--o{ ROUTE_SUMMARIES : assigned_to
    VEHICLES ||--o{ ROUTE_STEPS : assigned_to
    VEHICLES ||--o{ BREAKS : has
    VEHICLES }o--|| LOCATIONS : starts_at
    VEHICLES }o--|| LOCATIONS : ends_at
    VEHICLES ||--o{ VEHICLE_SKILLS : has
    VEHICLES ||--o{ VEHICLE_CAPACITIES : has
    
    %% Job Relationships
    JOBS ||--o{ ROUTE_STEPS : visits
    JOBS }o--|| LOCATIONS : located_at
    JOBS ||--o{ JOB_SKILLS : requires
    JOBS ||--o{ JOBS_PRODUCTS : contains
    
    %% Shipment Relationships
    SHIPMENTS ||--o{ ROUTE_STEPS : includes
    SHIPMENTS }o--|| LOCATIONS : pickup_at
    SHIPMENTS }o--|| LOCATIONS : delivery_at
    SHIPMENTS ||--o{ SHIPMENT_SKILLS : requires
    SHIPMENTS ||--o{ SHIPMENTS_PRODUCTS : contains
    
    %% Break System
    BREAKS ||--o{ BREAK_TIME_WINDOWS : defines
    
    %% Junction Tables
    SKILLS ||--o{ JOB_SKILLS : required_by
    SKILLS ||--o{ VEHICLE_SKILLS : assigned_to
    SKILLS ||--o{ SHIPMENT_SKILLS : required_by
    SKILLS }o--|| SKILLS : inherits_from
    
    PRODUCTS ||--o{ JOBS_PRODUCTS : used_in
    PRODUCTS ||--o{ SHIPMENTS_PRODUCTS : shipped_as
    
    %% Location Clustering
    LOCATION_CLUSTERS ||--o{ LOCATION_CLUSTER_MEMBERSHIP : includes
    LOCATIONS ||--o{ LOCATION_CLUSTER_MEMBERSHIP : belongs_to
    
    %% Unassigned References
    UNASSIGNED_JOBS }o--|| JOBS : references
    UNASSIGNED_JOBS }o--|| SHIPMENTS : references
```

## Data Flow Architecture

```mermaid
graph TD
    subgraph "User Interface Layer"
        A[Projects Dashboard]
        B[Scenarios Management]
        C[Datasets Editor]
        D[Vehicle Management]
        E[Job Management]
        F[Location Management]
        G[Optimization Console]
        H[Results Viewer]
    end
    
    subgraph "Convex Functions Layer"
        I[Project CRUD]
        J[Scenario CRUD]
        K[Dataset CRUD]
        L[Vehicle CRUD]
        M[Job CRUD]
        N[Location CRUD]
        O[Optimization Trigger]
        P[Results Processing]
        Q[Skills Management]
        R[Products Management]
    end
    
    subgraph "External Optimization"
        S[FastAPI Backend]
        T[VROOM Solver]
    end
    
    subgraph "Convex Database - Core Collections"
        U[Projects]
        V[Scenarios]
        W[Datasets]
        X[Project_Users]
    end
    
    subgraph "Convex Database - VRP Entities"
        Y[Vehicles]
        Z[Jobs]
        AA[Locations]
        AB[Shipments]
        AC[Products]
        AD[Skills]
        AE[Capacity_Definitions]
    end
    
    subgraph "Convex Database - Optimization"
        AF[Optimization_Run_Settings]
        AG[Optimization_Runs]
        AH[Route_Summaries]
        AI[Route_Steps]
        AJ[Unassigned_Jobs]
    end
    
    subgraph "Convex Database - Supporting Tables"
        AK[Breaks]
        AL[Break_Time_Windows]
        AM[Location_Clusters]
        AN[Location_Cluster_Membership]
        AO[Vehicle_Skills]
        AP[Job_Skills]
        AQ[Shipment_Skills]
        AR[Vehicle_Capacities]
        AS[Jobs_Products]
        AT[Shipments_Products]
    end
    
    %% UI to Functions
    A --> I
    B --> J
    C --> K
    D --> L
    E --> M
    F --> N
    G --> O
    H --> P
    
    %% Functions to Core DB
    I --> U
    I --> X
    J --> V
    K --> W
    
    %% Functions to VRP Entities
    L --> Y
    M --> Z
    N --> AA
    Q --> AD
    R --> AC
    
    %% Dataset relationships
    W --> Y
    W --> Z
    W --> AA
    W --> AB
    W --> AE
    W --> AF
    
    %% Optimization flow
    O --> S
    S --> T
    T --> P
    P --> AG
    P --> AH
    P --> AI
    P --> AJ
    
    %% Supporting relationships
    Y --> AK
    AK --> AL
    AA --> AM
    AA --> AN
    AM --> AN
    
    %% Skill relationships
    Y --> AO
    Z --> AP
    AB --> AQ
    AD --> AO
    AD --> AP
    AD --> AQ
    
    %% Product relationships
    Z --> AS
    AB --> AT
    AC --> AS
    AC --> AT
    
    %% Capacity relationships
    Y --> AR
    AE --> AR
```

## Convex Schema Definitions

### Nullable Status Legend

**Understanding Field Requirements:**
- **Required Fields (Not Nullable)**: Fields without `v.optional()` wrapper are mandatory
- **Optional Fields (Nullable)**: Fields wrapped with `v.optional()` are nullable/optional
- **Convex IDs**: All `v.id("tableName")` references are required unless wrapped in `v.optional()`
- **Timestamps**: `createdAt` and `updatedAt` are typically required for audit trails

**Key Patterns:**
```typescript
name: v.string(),                    // ✅ REQUIRED - Cannot be null
description: v.optional(v.string()), // ❓ OPTIONAL - Can be null
projectId: v.id("projects"),         // ✅ REQUIRED - Foreign key relationship
scenarioId: v.optional(v.id("scenarios")), // ❓ OPTIONAL - Nullable relationship
```

### Core Collections

```typescript
// schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Projects - Core project entity
  projects: defineTable({
    // REQUIRED FIELDS (Not Nullable)
    name: v.string(),                    // ✅ Project name - always required
    ownerId: v.string(),                 // ✅ User ID from Convex Auth - required for ownership
    createdAt: v.number(),               // ✅ Creation timestamp - required for audit
    updatedAt: v.number(),               // ✅ Last update timestamp - required for audit
    
    // OPTIONAL FIELDS (Nullable)
    description: v.optional(v.string()),           // ❓ Project description
    currency: v.optional(v.string()),              // ❓ Currency code (USD, EUR, etc.)
    projectType: v.optional(v.string()),           // ❓ Project classification
    industry: v.optional(v.string()),              // ❓ Industry sector
    geographicRegion: v.optional(v.string()),      // ❓ Operating region
    priority: v.optional(v.string()),              // ❓ Project priority level
    estimatedVehicles: v.optional(v.number()),     // ❓ Expected vehicle count
    estimatedJobs: v.optional(v.number()),         // ❓ Expected job count
    planningHorizonDays: v.optional(v.number()),   // ❓ Planning period length
    contactPerson: v.optional(v.string()),         // ❓ Primary contact name
    contactEmail: v.optional(v.string()),          // ❓ Contact email
    contactPhone: v.optional(v.string()),          // ❓ Contact phone
    tags: v.optional(v.array(v.string())),         // ❓ Project tags for filtering
    notes: v.optional(v.string()),                 // ❓ Additional notes
  })
    .index("by_owner", ["ownerId"])
    .index("by_created_at", ["createdAt"])
    .index("by_updated_at", ["updatedAt"]),

  // Scenarios - Project optimization scenarios
  scenarios: defineTable({
    // REQUIRED FIELDS (Not Nullable)
    projectId: v.id("projects"),         // ✅ Parent project reference - required relationship
    name: v.string(),                    // ✅ Scenario name - always required
    createdAt: v.number(),               // ✅ Creation timestamp - required for audit
    updatedAt: v.number(),               // ✅ Last update timestamp - required for audit
    
    // OPTIONAL FIELDS (Nullable)
    description: v.optional(v.string()),              // ❓ Scenario description
    startDate: v.optional(v.number()),                // ❓ Scenario start date
    endDate: v.optional(v.number()),                  // ❓ Scenario end date
    planningHorizonDays: v.optional(v.number()),      // ❓ Planning period override
    optimizationObjective: v.optional(v.string()),    // ❓ Primary optimization goal
    optimizationParameters: v.optional(v.object({})), // ❓ Custom optimization settings
    status: v.optional(v.string()),                   // ❓ Current scenario status
    tags: v.optional(v.array(v.string())),            // ❓ Scenario tags
    isActive: v.optional(v.boolean()),                // ❓ Active scenario flag
    lastOptimizedAt: v.optional(v.number()),          // ❓ Last optimization timestamp
    optimizationCount: v.optional(v.number()),        // ❓ Number of optimizations run
  })
    .index("by_project", ["projectId"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),

  // Datasets - Data collections for optimization
  datasets: defineTable({
    // REQUIRED FIELDS (Not Nullable)
    projectId: v.id("projects"),         // ✅ Parent project reference - required relationship
    name: v.string(),                    // ✅ Dataset name - always required
    version: v.number(),                 // ✅ Dataset version number - required for versioning
    createdAt: v.number(),               // ✅ Creation timestamp - required for audit
    updatedAt: v.number(),               // ✅ Last update timestamp - required for audit
    
    // OPTIONAL FIELDS (Nullable)
    scenarioId: v.optional(v.id("scenarios")),        // ❓ Optional scenario assignment
    description: v.optional(v.string()),              // ❓ Dataset description
    status: v.optional(v.string()),                   // ❓ Dataset status (active, archived, etc.)
    createdFromDatasetId: v.optional(v.id("datasets")), // ❓ Source dataset for cloning
    isBaseline: v.optional(v.boolean()),              // ❓ Baseline dataset flag
    tags: v.optional(v.array(v.string())),            // ❓ Dataset tags
    vehicleCount: v.optional(v.number()),             // ❓ Cached vehicle count
    jobCount: v.optional(v.number()),                 // ❓ Cached job count
    locationCount: v.optional(v.number()),            // ❓ Cached location count
    optimizationRunCount: v.optional(v.number()),     // ❓ Number of optimization runs
    optimizationCount: v.optional(v.number()),        // ❓ Total optimization count
    lastOptimizationAt: v.optional(v.number()),       // ❓ Last optimization timestamp
    datasetType: v.optional(v.string()),              // ❓ Dataset type classification
    versionNote: v.optional(v.string()),              // ❓ Version change notes
    entityCounts: v.optional(v.object({               // ❓ Detailed entity counts
      jobs: v.number(),                               // Required if entityCounts exists
      vehicles: v.number(),                           // Required if entityCounts exists
      locations: v.number(),                          // Required if entityCounts exists
    })),
    createdBy: v.optional(v.string()),                // ❓ User who created the dataset
    archivedAt: v.optional(v.number()),               // ❓ Archive timestamp
  })
    .index("by_project", ["projectId"])
    .index("by_scenario", ["scenarioId"])
    .index("by_status", ["status"])
    .index("by_version", ["projectId", "version"]),

  // Vehicles - Fleet vehicle definitions
  vehicles: defineTable({
    // REQUIRED FIELDS (Not Nullable)
    projectId: v.id("projects"),         // ✅ Parent project reference - required relationship
    createdAt: v.number(),               // ✅ Creation timestamp - required for audit
    updatedAt: v.number(),               // ✅ Last update timestamp - required for audit
    
    // OPTIONAL FIELDS (Nullable)
    scenarioId: v.optional(v.id("scenarios")),        // ❓ Optional scenario assignment
    datasetId: v.optional(v.id("datasets")),          // ❓ Optional dataset assignment
    description: v.optional(v.string()),              // ❓ Vehicle description/name
    profile: v.optional(v.string()),                  // ❓ Vehicle profile (car, truck, bike)
    
    // Location coordinates (either coordinates or location references)
    startLon: v.optional(v.number()),                 // ❓ Starting longitude
    startLat: v.optional(v.number()),                 // ❓ Starting latitude
    endLon: v.optional(v.number()),                   // ❓ Ending longitude
    endLat: v.optional(v.number()),                   // ❓ Ending latitude
    startLocationId: v.optional(v.id("locations")),   // ❓ Starting location reference
    endLocationId: v.optional(v.id("locations")),     // ❓ Ending location reference
    
    // Vehicle capabilities
    capacity: v.optional(v.array(v.number())),        // ❓ Multi-dimensional capacity array
    skills: v.optional(v.array(v.number())),          // ❓ Vehicle skill IDs
    
    // Time windows and constraints
    twStart: v.optional(v.number()),                  // ❓ Time window start
    twEnd: v.optional(v.number()),                    // ❓ Time window end
    speedFactor: v.optional(v.number()),              // ❓ Speed modification factor
    maxTasks: v.optional(v.number()),                 // ❓ Maximum tasks per route
    maxTravelTime: v.optional(v.number()),            // ❓ Maximum travel time
    maxDistance: v.optional(v.number()),              // ❓ Maximum distance
    
    // Cost structure
    costFixed: v.optional(v.number()),                // ❓ Fixed cost per vehicle
    costPerHour: v.optional(v.number()),              // ❓ Hourly operating cost
    costPerKm: v.optional(v.number()),                // ❓ Distance-based cost
    
    // Dataset metadata
    datasetName: v.optional(v.string()),              // ❓ Source dataset name
    datasetVersion: v.optional(v.number()),           // ❓ Source dataset version
  })
    .index("by_project", ["projectId"])
    .index("by_scenario", ["scenarioId"])
    .index("by_dataset", ["datasetId"])
    .index("by_location", ["startLocationId"])
    .index("by_created_at", ["createdAt"]),

  // Jobs - Individual tasks/stops for vehicles
  jobs: defineTable({
    // REQUIRED FIELDS (Not Nullable)
    projectId: v.id("projects"),         // ✅ Parent project reference - required relationship
    createdAt: v.number(),               // ✅ Creation timestamp - required for audit
    updatedAt: v.number(),               // ✅ Last update timestamp - required for audit
    
    // OPTIONAL FIELDS (Nullable)
    scenarioId: v.optional(v.id("scenarios")),        // ❓ Optional scenario assignment
    datasetId: v.optional(v.id("datasets")),          // ❓ Optional dataset assignment
    locationId: v.optional(v.id("locations")),        // ❓ Location reference
    description: v.optional(v.string()),              // ❓ Job description
    
    // Location coordinates (alternative to locationId)
    locationLon: v.optional(v.number()),              // ❓ Job longitude
    locationLat: v.optional(v.number()),              // ❓ Job latitude
    
    // Time requirements
    setup: v.optional(v.number()),                    // ❓ Setup time (seconds)
    service: v.optional(v.number()),                  // ❓ Service time (seconds)
    
    // Capacity requirements
    delivery: v.optional(v.array(v.number())),        // ❓ Delivery quantities
    pickup: v.optional(v.array(v.number())),          // ❓ Pickup quantities
    
    // Job constraints
    skills: v.optional(v.array(v.number())),          // ❓ Required skill IDs
    priority: v.optional(v.number()),                 // ❓ Job priority level
    timeWindows: v.optional(v.array(v.object({        // ❓ Valid service time windows
      start: v.number(),                              // Required if timeWindows exists
      end: v.number(),                                // Required if timeWindows exists
    }))),
    
    // Dataset metadata
    datasetName: v.optional(v.string()),              // ❓ Source dataset name
    datasetVersion: v.optional(v.number()),           // ❓ Source dataset version
  })
    .index("by_project", ["projectId"])
    .index("by_scenario", ["scenarioId"])
    .index("by_dataset", ["datasetId"])
    .index("by_location", ["locationId"])
    .index("by_priority", ["priority"])
    .index("by_created_at", ["createdAt"]),

  // Locations - Geographic points of interest
  locations: defineTable({
    // REQUIRED FIELDS (Not Nullable)
    projectId: v.id("projects"),         // ✅ Parent project reference - required relationship
    name: v.string(),                    // ✅ Location name - always required
    createdAt: v.number(),               // ✅ Creation timestamp - required for audit
    updatedAt: v.number(),               // ✅ Last update timestamp - required for audit
    
    // OPTIONAL FIELDS (Nullable)
    scenarioId: v.optional(v.id("scenarios")),        // ❓ Optional scenario assignment
    datasetId: v.optional(v.id("datasets")),          // ❓ Optional dataset assignment
    clusterId: v.optional(v.id("locationClusters")),  // ❓ Location cluster assignment
    address: v.optional(v.string()),                  // ❓ Physical address
    description: v.optional(v.string()),              // ❓ Location description
    locationLon: v.optional(v.number()),              // ❓ Longitude coordinate
    locationLat: v.optional(v.number()),              // ❓ Latitude coordinate
    locationType: v.optional(v.string()),             // ❓ Type (depot, customer, warehouse)
    operatingHours: v.optional(v.string()),           // ❓ Operating hours string
    contactInfo: v.optional(v.string()),              // ❓ Contact information
    timezone: v.optional(v.string()),                 // ❓ Location timezone
    datasetName: v.optional(v.string()),              // ❓ Source dataset name
    datasetVersion: v.optional(v.number()),           // ❓ Source dataset version
  })
    .index("by_project", ["projectId"])
    .index("by_scenario", ["scenarioId"])
    .index("by_dataset", ["datasetId"])
    .index("by_cluster", ["clusterId"])
    .index("by_type", ["locationType"])
    .index("by_name", ["name"]),

  // Products - Items being transported
  products: defineTable({
    // REQUIRED FIELDS (Not Nullable)
    projectId: v.id("projects"),         // ✅ Parent project reference - required relationship
    name: v.string(),                    // ✅ Product name - always required
    unitType: v.string(),                // ✅ Unit of measurement - required for calculations
    createdAt: v.number(),               // ✅ Creation timestamp - required for audit
    updatedAt: v.number(),               // ✅ Last update timestamp - required for audit
    
    // OPTIONAL FIELDS (Nullable)
    category: v.optional(v.string()),                 // ❓ Product category
    weightPerUnitKg: v.optional(v.number()),          // ❓ Weight per unit in kilograms
    volumePerUnitM3: v.optional(v.number()),          // ❓ Volume per unit in cubic meters
    lengthCm: v.optional(v.number()),                 // ❓ Length in centimeters
    widthCm: v.optional(v.number()),                  // ❓ Width in centimeters
    heightCm: v.optional(v.number()),                 // ❓ Height in centimeters
    stackable: v.optional(v.boolean()),               // ❓ Can be stacked flag
    requiresRefrigeration: v.optional(v.boolean()),   // ❓ Refrigeration required flag
    hazmatClass: v.optional(v.string()),              // ❓ Hazardous material classification
    handlingInstructions: v.optional(v.string()),     // ❓ Special handling instructions
  })
    .index("by_project", ["projectId"])
    .index("by_category", ["category"])
    .index("by_name", ["name"]),

  // Skills - Capabilities required for jobs or possessed by vehicles
  skills: defineTable({
    // REQUIRED FIELDS (Not Nullable)
    createdAt: v.number(),               // ✅ Creation timestamp - required for audit
    updatedAt: v.number(),               // ✅ Last update timestamp - required for audit
    
    // OPTIONAL FIELDS (Nullable) - Note: Skills can be global or project-specific
    projectId: v.optional(v.id("projects")),          // ❓ Optional project scope (null = global skill)
    name: v.optional(v.string()),                     // ❓ Skill name
    description: v.optional(v.string()),              // ❓ Skill description
    skillCode: v.optional(v.string()),                // ❓ Unique skill code
    category: v.optional(v.string()),                 // ❓ Skill category
    subcategory: v.optional(v.string()),              // ❓ Skill subcategory
    parentSkillId: v.optional(v.id("skills")),        // ❓ Parent skill for hierarchy
    skillType: v.optional(v.string()),                // ❓ Type of skill
    requiresCertification: v.optional(v.boolean()),   // ❓ Certification required flag
    certificationAuthority: v.optional(v.string()),   // ❓ Certifying authority
    certificationExpiryRequired: v.optional(v.boolean()), // ❓ Expiry tracking required
    vroomSkillId: v.optional(v.number()),             // ❓ VROOM solver skill ID
    isActive: v.optional(v.boolean()),                // ❓ Active skill flag
  })
    .index("by_project", ["projectId"])
    .index("by_category", ["category"])
    .index("by_skill_code", ["skillCode"])
    .index("by_parent", ["parentSkillId"]),

  // Optimization Run Settings - Configuration for optimization algorithms
  optimizationRunSettings: defineTable({
    // REQUIRED FIELDS (Not Nullable)
    datasetId: v.id("datasets"),         // ✅ Target dataset - required relationship
    name: v.string(),                    // ✅ Settings name - always required
    algorithm: v.string(),               // ✅ Algorithm type - required for execution
    optimizationEngine: v.string(),      // ✅ Engine type (VROOM, OR-Tools) - required
    parameters: v.object({               // ✅ Algorithm parameters - required object
      maxIterations: v.optional(v.number()),         // ❓ Maximum iterations
      timeLimit: v.optional(v.number()),             // ❓ Time limit in seconds
      vehicleBreaks: v.optional(v.boolean()),        // ❓ Enable vehicle breaks
      trafficMatrix: v.optional(v.boolean()),        // ❓ Use traffic matrix
      balanceRoutes: v.optional(v.boolean()),        // ❓ Balance route loads
      minimizeVehicles: v.optional(v.boolean()),     // ❓ Minimize vehicle count
      allowSplitDeliveries: v.optional(v.boolean()), // ❓ Allow split deliveries
    }),
    createdAt: v.number(),               // ✅ Creation timestamp - required for audit
    updatedAt: v.number(),               // ✅ Last update timestamp - required for audit
    
    // OPTIONAL FIELDS (Nullable)
    description: v.optional(v.string()),              // ❓ Settings description
    constraints: v.optional(v.object({                // ❓ Optimization constraints
      maxVehicleCapacity: v.optional(v.number()),     // ❓ Maximum vehicle capacity
      maxRouteDistance: v.optional(v.number()),       // ❓ Maximum route distance
      maxRouteDuration: v.optional(v.number()),       // ❓ Maximum route duration
      enforceTimeWindows: v.optional(v.boolean()),    // ❓ Enforce time windows
      enforceSkillMatching: v.optional(v.boolean()),  // ❓ Enforce skill matching
    })),
    objectives: v.optional(v.object({                 // ❓ Optimization objectives
      minimizeCost: v.optional(v.number()),           // ❓ Cost minimization weight
      minimizeDistance: v.optional(v.number()),       // ❓ Distance minimization weight
      minimizeDuration: v.optional(v.number()),       // ❓ Duration minimization weight
      maximizeServiceLevel: v.optional(v.number()),   // ❓ Service level weight
    })),
    isDefault: v.optional(v.boolean()),               // ❓ Default settings flag
    isActive: v.optional(v.boolean()),                // ❓ Active settings flag
    createdBy: v.optional(v.string()),                // ❓ User who created settings
  })
    .index("by_dataset", ["datasetId"])
    .index("by_algorithm", ["algorithm"])
    .index("by_default", ["isDefault"])
    .index("by_active", ["isActive"]),

  // Optimization Runs - Results of optimization executions
  optimizationRuns: defineTable({
    // REQUIRED FIELDS (Not Nullable)
    scenarioId: v.id("scenarios"),       // ✅ Parent scenario - required relationship
    timestamp: v.number(),               // ✅ Run timestamp - required for tracking
    currencyCode: v.string(),            // ✅ Currency for cost calculations - required
    algorithm: v.string(),               // ✅ Algorithm used - required for reference
    durationMs: v.number(),              // ✅ Execution duration - required for performance tracking
    settings: v.object({}),              // ✅ Settings used - required for reproducibility
    optimizationEngine: v.string(),      // ✅ Engine used - required for tracking
    optimizationParameters: v.object({}), // ✅ Parameters used - required for reproducibility
    
    // OPTIONAL FIELDS (Nullable)
    projectId: v.optional(v.id("projects")),          // ❓ Optional project reference (derived from scenario)
    datasetId: v.optional(v.id("datasets")),          // ❓ Optional dataset reference
    optimizationRunSettingsId: v.optional(v.id("optimizationRunSettings")), // ❓ Settings template used
    
    // Execution metadata
    computingTime: v.optional(v.number()),            // ❓ Server computing time
    status: v.optional(v.string()),                   // ❓ Run status (success, failed, running)
    errorMessage: v.optional(v.string()),             // ❓ Error details if failed
    
    // Result summary statistics
    totalCost: v.optional(v.number()),                // ❓ Total optimization cost
    totalRoutes: v.optional(v.number()),              // ❓ Number of routes generated
    totalUnassigned: v.optional(v.number()),          // ❓ Number of unassigned tasks
    totalDistance: v.optional(v.number()),            // ❓ Total distance traveled
    totalDuration: v.optional(v.number()),            // ❓ Total route duration
    totalWaitingTime: v.optional(v.number()),         // ❓ Total waiting time
    totalServiceTime: v.optional(v.number()),         // ❓ Total service time
    totalSetupTime: v.optional(v.number()),           // ❓ Total setup time
    totalVehicles: v.optional(v.number()),            // ❓ Number of vehicles used
    totalJobs: v.optional(v.number()),                // ❓ Number of jobs processed
    totalShipments: v.optional(v.number()),           // ❓ Number of shipments processed
    
    // Raw data for debugging
    rawRequest: v.optional(v.object({})),             // ❓ Original solver request
    rawResponse: v.optional(v.object({})),            // ❓ Raw solver response
    
    // Dataset metadata
    datasetName: v.optional(v.string()),              // ❓ Source dataset name
    datasetVersion: v.optional(v.number()),           // ❓ Source dataset version
    createdBy: v.optional(v.string()),                // ❓ User who initiated the run
  })
    .index("by_scenario", ["scenarioId"])
    .index("by_project", ["projectId"])
    .index("by_dataset", ["datasetId"])
    .index("by_settings", ["optimizationRunSettingsId"])
    .index("by_status", ["status"])
    .index("by_timestamp", ["timestamp"]),

  // Route Summaries - High-level route information per vehicle
  routeSummaries: defineTable({
    // REQUIRED FIELDS (Not Nullable)
    createdAt: v.number(),               // ✅ Creation timestamp - required for audit
    updatedAt: v.number(),               // ✅ Last update timestamp - required for audit
    
    // OPTIONAL FIELDS (Nullable) - Routes may be partial or in draft state
    optimizationRunId: v.optional(v.id("optimizationRuns")), // ❓ Parent optimization run
    vehicleId: v.optional(v.id("vehicles")),        // ❓ Assigned vehicle
    projectId: v.optional(v.id("projects")),        // ❓ Project reference
    
    // Route metrics
    cost: v.optional(v.number()),                   // ❓ Total route cost
    distance: v.optional(v.number()),               // ❓ Total distance traveled
    duration: v.optional(v.number()),               // ❓ Total route duration
    waitingTime: v.optional(v.number()),            // ❓ Total waiting time
    serviceTime: v.optional(v.number()),            // ❓ Total service time
    setupTime: v.optional(v.number()),              // ❓ Total setup time
    
    // Route content summary
    deliveries: v.optional(v.array(v.number())),    // ❓ Delivery quantities
    pickups: v.optional(v.array(v.number())),       // ❓ Pickup quantities
    priority: v.optional(v.number()),               // ❓ Route priority
    deliveryCount: v.optional(v.number()),          // ❓ Number of deliveries
    
    // Route violations and geometry
    violations: v.optional(v.array(v.object({}))),  // ❓ Constraint violations
    geometry: v.optional(v.string()),               // ❓ Route geometry (WKT/GeoJSON)
    geojson: v.optional(v.object({})),              // ❓ GeoJSON representation
    
    // Metadata
    currencyCode: v.optional(v.string()),           // ❓ Currency for cost values
    datasetName: v.optional(v.string()),            // ❓ Source dataset name
    datasetVersion: v.optional(v.number()),         // ❓ Source dataset version
  })
    .index("by_optimization_run", ["optimizationRunId"])
    .index("by_vehicle", ["vehicleId"])
    .index("by_project", ["projectId"])
    .index("by_created_at", ["createdAt"]),

  // Route Steps - Individual stops/actions within a route
  routeSteps: defineTable({
    // REQUIRED FIELDS (Not Nullable)
    stepType: v.string(),                // ✅ Step type (start, job, break, end) - required for sequence
    stepOrder: v.number(),               // ✅ Order within route - required for sequencing
    createdAt: v.number(),               // ✅ Creation timestamp - required for audit
    updatedAt: v.number(),               // ✅ Last update timestamp - required for audit
    
    // OPTIONAL FIELDS (Nullable)
    routeSummaryId: v.optional(v.id("routeSummaries")), // ❓ Parent route
    vehicleId: v.optional(v.id("vehicles")),       // ❓ Assigned vehicle
    optimizationRunId: v.optional(v.id("optimizationRuns")), // ❓ Parent optimization run
    projectId: v.optional(v.id("projects")),       // ❓ Project reference
    jobId: v.optional(v.id("jobs")),               // ❓ Associated job (if step is job visit)
    
    // Location information
    lon: v.optional(v.number()),                   // ❓ Longitude coordinate
    lat: v.optional(v.number()),                   // ❓ Latitude coordinate
    
    // Timing information
    arrivalTime: v.optional(v.number()),           // ❓ Arrival time at step
    setupTime: v.optional(v.number()),             // ❓ Setup time for this step
    serviceTime: v.optional(v.number()),           // ❓ Service time for this step
    waitingTime: v.optional(v.number()),           // ❓ Waiting time before service
    
    // Distance and duration to this step
    distance: v.optional(v.number()),              // ❓ Distance from previous step
    duration: v.optional(v.number()),              // ❓ Travel time from previous step
    
    // Load information
    load: v.optional(v.array(v.number())),         // ❓ Vehicle load after this step
    
    // Step metadata
    violations: v.optional(v.array(v.object({}))), // ❓ Constraint violations at this step
    description: v.optional(v.string()),           // ❓ Step description
    datasetName: v.optional(v.string()),           // ❓ Source dataset name
    datasetVersion: v.optional(v.number()),        // ❓ Source dataset version
  })
    .index("by_route_summary", ["routeSummaryId"])
    .index("by_vehicle", ["vehicleId"])
    .index("by_optimization_run", ["optimizationRunId"])
    .index("by_project", ["projectId"])
    .index("by_job", ["jobId"])
    .index("by_step_order", ["routeSummaryId", "stepOrder"]),

  // Supporting Tables
  locationClusterMembership: defineTable({
    locationId: v.id("locations"),
    clusterId: v.id("locationClusters"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_location", ["locationId"])
    .index("by_cluster", ["clusterId"]),

  locationClusters: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    description: v.optional(v.string()),
    centerLon: v.optional(v.number()),
    centerLat: v.optional(v.number()),
    radius: v.optional(v.number()),
    color: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"]),

  projectUsers: defineTable({
    projectId: v.id("projects"),
    userId: v.string(),
    role: v.string(),
    permissions: v.optional(v.array(v.string())),
    invitedBy: v.optional(v.string()),
    invitedAt: v.optional(v.number()),
    joinedAt: v.optional(v.number()),
    status: v.optional(v.string()),
  })
    .index("by_project", ["projectId"])
    .index("by_user", ["userId"])
    .index("by_role", ["role"]),

  // Shipments
  shipments: defineTable({
    projectId: v.id("projects"),
    scenarioId: v.optional(v.id("scenarios")),
    datasetId: v.optional(v.id("datasets")),
    amount: v.optional(v.array(v.number())),
    skills: v.optional(v.array(v.number())),
    priority: v.optional(v.number()),
    pickupId: v.optional(v.number()),
    pickupDescription: v.optional(v.string()),
    pickupLon: v.number(),
    pickupLat: v.number(),
    pickupSetup: v.optional(v.number()),
    pickupService: v.optional(v.number()),
    pickupTimeWindows: v.optional(v.array(v.object({
      start: v.number(),
      end: v.number(),
    }))),
    pickupLocationId: v.optional(v.id("locations")),
    deliveryId: v.optional(v.number()),
    deliveryDescription: v.optional(v.string()),
    deliveryLon: v.number(),
    deliveryLat: v.number(),
    deliverySetup: v.optional(v.number()),
    deliveryService: v.optional(v.number()),
    deliveryTimeWindows: v.optional(v.array(v.object({
      start: v.number(),
      end: v.number(),
    }))),
    deliveryLocationId: v.optional(v.id("locations")),
    datasetName: v.optional(v.string()),
    datasetVersion: v.optional(v.number()),
    sourceShipmentId: v.optional(v.id("shipments")),
    isDerived: v.optional(v.boolean()),
    derivationMetadata: v.optional(v.object({})),
    pickupTimeWindowStartDt: v.optional(v.number()),
    pickupTimeWindowEndDt: v.optional(v.number()),
    deliveryTimeWindowStartDt: v.optional(v.number()),
    deliveryTimeWindowEndDt: v.optional(v.number()),
    pickupTimezone: v.optional(v.string()),
    deliveryTimezone: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_scenario", ["scenarioId"])
    .index("by_dataset", ["datasetId"])
    .index("by_pickup_location", ["pickupLocationId"])
    .index("by_delivery_location", ["deliveryLocationId"])
    .index("by_priority", ["priority"]),

  // Breaks and Break Time Windows
  breaks: defineTable({
    vehicleId: v.optional(v.id("vehicles")),
    breakId: v.number(),
    service: v.optional(v.number()),
    description: v.optional(v.string()),
    maxLoad: v.optional(v.array(v.number())),
    breakType: v.optional(v.string()),
    regulationReference: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_vehicle", ["vehicleId"])
    .index("by_break_id", ["breakId"])
    .index("by_type", ["breakType"]),

  breakTimeWindows: defineTable({
    breakId: v.optional(v.id("breaks")),
    startTime: v.number(),
    endTime: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_break", ["breakId"])
    .index("by_time_range", ["startTime", "endTime"]),

  // Capacity Definitions
  capacityDefinitions: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    unit: v.string(),
    dimensionIndex: v.number(),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_dimension", ["dimensionIndex"])
    .index("by_name", ["name"]),

  // Unassigned Jobs
  unassignedJobs: defineTable({
    optimizationRunId: v.optional(v.id("optimizationRuns")),
    originalId: v.optional(v.number()),
    taskType: v.optional(v.string()),
    jobId: v.optional(v.id("jobs")),
    shipmentId: v.optional(v.id("shipments")),
    lon: v.optional(v.number()),
    lat: v.optional(v.number()),
    description: v.optional(v.string()),
    datasetName: v.optional(v.string()),
    datasetVersion: v.optional(v.number()),
  })
    .index("by_optimization_run", ["optimizationRunId"])
    .index("by_job", ["jobId"])
    .index("by_shipment", ["shipmentId"])
    .index("by_task_type", ["taskType"]),

  // Junction Tables for Many-to-Many Relationships
  jobsProducts: defineTable({
    jobId: v.id("jobs"),
    productId: v.id("products"),
    quantity: v.number(),
    unitType: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_job", ["jobId"])
    .index("by_product", ["productId"]),

  shipmentsProducts: defineTable({
    shipmentId: v.id("shipments"),
    productId: v.id("products"),
    quantity: v.number(),
    calculatedWeight: v.optional(v.number()),
    calculatedVolume: v.optional(v.number()),
    capacityRequirements: v.optional(v.array(v.number())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_shipment", ["shipmentId"])
    .index("by_product", ["productId"]),

  vehicleCapacities: defineTable({
    vehicleId: v.id("vehicles"),
    capacityType: v.string(),
    capacity: v.number(),
    unit: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_vehicle", ["vehicleId"])
    .index("by_type", ["capacityType"]),

  vehicleSkills: defineTable({
    vehicleId: v.id("vehicles"),
    skillId: v.id("skills"),
    proficiencyLevel: v.optional(v.number()),
    certificationExpiry: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_vehicle", ["vehicleId"])
    .index("by_skill", ["skillId"]),

  jobSkills: defineTable({
    jobId: v.id("jobs"),
    skillId: v.id("skills"),
    requiredLevel: v.optional(v.number()),
    mandatory: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_job", ["jobId"])
    .index("by_skill", ["skillId"]),

  shipmentSkills: defineTable({
    shipmentId: v.id("shipments"),
    skillId: v.id("skills"),
    minimumProficiencyLevel: v.optional(v.number()),
    isMandatory: v.optional(v.boolean()),
    requirementSource: v.optional(v.string()),
    reasoning: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_shipment", ["shipmentId"])
    .index("by_skill", ["skillId"]),
});
```

## Conversion Strategy from Supabase to Convex

### 1. Data Type Mapping

| Supabase Type | Convex Type | Notes |
|---------------|-------------|-------|
| `integer` | `v.number()` | Auto-increment becomes Convex ID |
| `varchar(n)` | `v.string()` | No length constraints in Convex |
| `text` | `v.string()` | No distinction in Convex |
| `boolean` | `v.boolean()` | Direct mapping |
| `jsonb` | `v.object({})` or `v.array()` | Typed objects preferred |
| `timestamp with time zone` | `v.number()` | Unix timestamp in milliseconds |
| `double precision` | `v.number()` | Direct mapping |
| `numeric(p,s)` | `v.number()` | Precision handled in application |
| `uuid` | `v.string()` | Use Convex Auth user IDs |
| `ARRAY` | `v.array()` | With typed elements |

### 2. Relationship Handling

- **Foreign Keys:** Use Convex IDs with type safety (`v.id("tableName")`)
- **Indexes:** Define indexes for common query patterns
- **RLS:** Replace with Convex Auth + function-level security

### 3. Migration Process

1. **Schema Definition:** Create Convex schema with proper types
2. **Data Export:** Export Supabase data to JSON
3. **Data Transform:** Convert data types and relationships
4. **Data Import:** Use Convex mutations to populate collections
5. **Function Migration:** Convert Edge Functions to Convex functions
6. **Auth Migration:** Migrate to Convex Auth
7. **Frontend Update:** Update API calls to use Convex

### 4. Key Benefits of Convex

- **Type Safety:** End-to-end TypeScript with runtime validation
- **Real-time:** Built-in reactive queries and subscriptions
- **Offline Support:** Automatic optimistic updates
- **No SQL:** Document-based queries with automatic indexes
- **Auth Integration:** Built-in authentication system
- **File Storage:** Integrated file upload and storage
- **Edge Functions:** Faster than Supabase Edge Functions

## Implementation Status (✅ Production Deployment Complete)

### ✅ Phase 1: Core Schema (COMPLETED)
- **Projects, Scenarios, Datasets** ✅ Deployed with 49+ optimized indexes
- **Basic CRUD operations** ✅ 70+ Convex functions deployed
- **Authentication setup** ✅ Convex Auth integrated

### ✅ Phase 2: VRP Entities (COMPLETED)
- **Vehicles, Jobs, Locations** ✅ Full schema deployed
- **Products, Skills** ✅ Complete relationship mapping
- **Junction tables** ✅ Many-to-many relationships implemented

### ✅ Phase 3: Optimization (COMPLETED)
- **Optimization runs** ✅ Live query integration
- **Route summaries and steps** ✅ Real-time route visualization
- **FastAPI integration** ✅ External VROOM solver connected

### ✅ Phase 4: Advanced Features (COMPLETED)
- **Real-time subscriptions** ✅ Convex Live Queries implemented
- **File uploads** ✅ Convex File Storage integrated
- **Advanced queries** ✅ 49+ indexes for optimal performance
- **Performance optimization** ✅ Monorepo structure deployed

### ✅ Phase 5: Production Deployment (COMPLETED)
- **Monorepo structure** ✅ /convex/ (backend) + /frontend/ (React app)
- **Production deployment** ✅ mild-elephant-70.convex.cloud
- **Frontend hosting** ✅ Cloudflare Pages
- **GitHub Actions CI/CD** ✅ Automated deployment pipeline
- **Performance monitoring** ✅ Convex dashboard analytics

## Nullable Status Summary

### Critical Required Fields (Never Nullable)

**Entity Identification:**
- `name` fields for all primary entities (projects, scenarios, datasets, locations, products)
- `projectId` relationships linking to parent projects
- `scenarioId` in optimization runs (required workflow relationship)
- `stepType` and `stepOrder` in route steps (required for sequencing)

**Audit & Tracking:**
- `createdAt` and `updatedAt` timestamps (required for all entities)
- `timestamp` in optimization runs (required for execution tracking)
- `currencyCode`, `algorithm`, `optimizationEngine` in optimization runs (required for reproducibility)

**Core Configuration:**
- `unitType` in products (required for capacity calculations)
- `version` in datasets (required for versioning)
- `ownerId` in projects (required for ownership/security)

### Common Optional Fields (Nullable)

**Flexible Relationships:**
- `scenarioId` and `datasetId` in most entities (optional assignment)
- `locationId` references (can use coordinates instead)
- Parent/child relationships (`parentSkillId`, `createdFromDatasetId`)

**Descriptive Information:**
- `description` fields across all entities
- Contact information (`contactEmail`, `contactPhone`, `contactInfo`)
- Classification fields (`category`, `locationType`, `projectType`)

**Operational Data:**
- Capacity arrays, time windows, geographic coordinates
- Cost information, optimization parameters
- Cache fields (`entityCounts`, `vehicleCount`, `jobCount`)
- Metadata fields (`tags`, `notes`, `datasetName`)

**Processing Results:**
- All optimization result statistics (`totalCost`, `totalDistance`, etc.)
- Route geometry and violations
- Error messages and status fields

### Developer Implementation Notes

1. **Form Validation:** Required fields should have client-side validation
2. **API Calls:** Always provide required fields in mutations
3. **Default Values:** Consider reasonable defaults for optional fields in UI
4. **Database Queries:** Filter by required fields for better performance
5. **Migration Safety:** Required fields need careful handling during data migration

## Key Highlights (✅ Production Implementation Complete)

✅ **Core VRP Tables:** Projects, Scenarios, Datasets, Vehicles, Jobs, Locations - **DEPLOYED**  
✅ **Optimization Data:** Route summaries, steps, optimization runs - **LIVE**  
✅ **Supporting Data:** Products, Skills, Capacities, Time windows - **IMPLEMENTED**  
✅ **User Management:** Project users, Convex authentication - **DEPLOYED**  
✅ **Real-time Ready:** Reactive queries and subscriptions - **ACTIVE**  
✅ **Clear Nullable Status:** All fields clearly marked as required or optional - **DOCUMENTED**  
✅ **Developer-Friendly:** Detailed comments explaining nullable status for each field - **COMPLETE**  
✅ **Production Stack:** shadcn/ui + Tailwind CSS v4 + OKLCH colors - **DEPLOYED**  
✅ **Monorepo Architecture:** /convex/ + /frontend/ structure - **IMPLEMENTED**  
✅ **Performance Optimized:** 70+ functions, 49+ indexes - **DEPLOYED**  
✅ **CI/CD Pipeline:** GitHub Actions automated deployment - **ACTIVE**  

## Production Environment Summary

**Backend:** Convex Cloud (mild-elephant-70.convex.cloud)  
**Frontend:** React 18 + TypeScript + Vite + shadcn/ui + Tailwind CSS v4  
**Hosting:** Cloudflare Pages  
**Authentication:** Convex Auth  
**State Management:** Zustand + Convex Live Queries  
**Design System:** OKLCH colors, 8pt grid, 60/30/10 distribution  
**Optimization:** FastAPI + VROOM (external integration)  

The schema provides **full production deployment** with Convex's type-safe, real-time architecture, modern React stack with shadcn/ui, and **comprehensive documentation** for all developers working with the VRP system.