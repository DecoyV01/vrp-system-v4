# VRP System v4 - System Architecture

## Document Information
- **Version**: 1.0
- **Last Updated**: 2025-07-06
- **Status**: Production Ready
- **Architecture Type**: Monorepo with Serverless Backend

## 1. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            VRP System v4 Architecture                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │   Mobile Apps   │    │  External APIs  │
│                 │    │   (Future)      │    │ (Optimization)  │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    Cloudflare CDN       │
                    │   (Frontend Delivery)   │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   React Frontend App    │
                    │  - Vite Build System    │
                    │  - TypeScript           │
                    │  - Tailwind CSS v4     │
                    │  - shadcn/ui Components │
                    │  - Zustand (Local State)│
                    └────────────┬────────────┘
                                 │
                         WebSocket + HTTP/2
                                 │
                    ┌────────────▼────────────┐
                    │   Convex Platform       │
                    │  ┌─────────────────────┐│
                    │  │  API Gateway        ││
                    │  │  - Authentication   ││
                    │  │  - Rate Limiting    ││
                    │  │  - Request Routing  ││
                    │  └─────────────────────┘│
                    │  ┌─────────────────────┐│
                    │  │  Serverless         ││
                    │  │  Functions Layer    ││
                    │  │  - 70+ Functions    ││
                    │  │  - TypeScript       ││
                    │  │  - Auto-scaling     ││
                    │  └─────────────────────┘│
                    │  ┌─────────────────────┐│
                    │  │  Real-time Database ││
                    │  │  - Document-based   ││
                    │  │  - 58 Indexes       ││
                    │  │  - WebSocket Sync   ││
                    │  │  - ACID Compliance  ││
                    │  └─────────────────────┘│
                    └─────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   External Integrations │
                    │  - Optimization Engines │
                    │    (VROOM, OR-Tools)    │
                    │  - Geocoding Services   │
                    │  - Map Services         │
                    └─────────────────────────┘
```

## 2. System Components

### 2.1 Frontend Architecture (React SPA)

#### 2.1.1 Technology Stack
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.3.1 for fast development and optimized builds
- **Styling**: Tailwind CSS v4 with OKLCH color system
- **UI Library**: shadcn/ui (15 components) for consistent design
- **Routing**: React Router v6.26.1 for client-side navigation
- **State Management**: 
  - Zustand for local application state
  - Convex React client for server state with real-time sync

#### 2.1.2 Component Architecture
```
frontend/src/
├── components/
│   ├── auth/              # Authentication components
│   ├── layout/            # Layout system
│   │   ├── MainLayout.tsx     # Dual sidebar wrapper
│   │   ├── PrimarySidebar.tsx # Main navigation
│   │   └── SecondarySidebar.tsx # Context-sensitive nav
│   ├── table-editor/      # Data editing components
│   │   ├── TableEditor.tsx    # Main table component (504 lines)
│   │   └── bulk-operations/   # Bulk editing system
│   └── ui/                # shadcn/ui base components
├── hooks/                 # Custom React hooks
│   ├── useVRPData.ts      # VRP data operations (338 lines)
│   ├── useHierarchy.ts    # Navigation state management
│   └── useConvexAuth.ts   # Authentication hooks
├── pages/                 # Route components
│   ├── ProjectsPage.tsx
│   ├── ProjectDetailPage.tsx
│   ├── ScenarioDetailPage.tsx
│   ├── DatasetDetailPage.tsx
│   └── TableEditorPage.tsx
└── stores/                # Zustand state stores
    └── useSidebarStore.ts
```

#### 2.1.3 Data Flow Pattern
```
User Interaction → Component → Hook → Convex Mutation/Query → Database
                                  ↓
Real-time Updates ← WebSocket ← Convex Platform ← Database Changes
```

### 2.2 Backend Architecture (Convex Serverless)

#### 2.2.1 Convex Platform Features
- **Serverless Functions**: 70+ TypeScript functions across 12 files
- **Real-time Database**: Document-based with 58 performance indexes
- **WebSocket Sync**: Automatic real-time updates to all connected clients
- **Authentication**: Built-in user management and session handling
- **Automatic Scaling**: Zero-configuration horizontal scaling
- **ACID Transactions**: Consistent data operations

#### 2.2.2 Function Organization
```
convex/
├── projects.ts         # Project CRUD operations
├── scenarios.ts        # Scenario management
├── datasets.ts         # Dataset versioning
├── vehicles.ts         # Vehicle fleet management
├── jobs.ts            # Job/task management
├── locations.ts       # Location management
├── routes.ts          # Route optimization results
├── tasks.ts           # Task management
├── auth.ts            # Authentication utilities
├── validation.ts      # Input validation with Zod
├── optimizerValidation.ts # Optimization engine compatibility
└── schema.ts          # Database schema (502 lines)
```

#### 2.2.3 Database Schema Architecture
```
Projects (Root Level)
├── Scenarios (Optimization scenarios)
│   └── Datasets (Versioned data collections)
│       ├── Vehicles (Fleet definitions)
│       ├── Jobs (Tasks/stops)
│       ├── Locations (Geographic points)
│       └── Routes (Optimization results)
└── Direct Entity Relationships
    ├── All entities linked to projectId
    ├── Hierarchical navigation
    └── Cross-cutting concerns (search, reporting)
```

## 3. Integration Architecture

### 3.1 External System Integrations

#### 3.1.1 Optimization Engines
```
VRP System ←→ HTTP/REST API ←→ Optimization Engines
│                              ├── VROOM (Vehicle Routing)
│                              ├── OR-Tools (Constraint Programming)
│                              └── Custom Algorithms
├── Data Transform Layer
│   ├── VRP → VROOM Format
│   ├── VROOM → VRP Format
│   └── Validation & Error Handling
└── Results Processing
    ├── Route Visualization
    ├── Metrics Calculation
    └── Violation Detection
```

#### 3.1.2 Claude Code Integration
```
Claude Code ←→ MCP Protocol ←→ Convex MCP Server
│                             ├── Database Queries
│                             ├── Function Execution
│                             └── Real-time Monitoring
└── UAT Framework
    ├── Automated Testing
    ├── Browser Automation
    └── Report Generation
```

### 3.2 Development Toolchain Integration

#### 3.2.1 Build and Deployment Pipeline
```
Developer ←→ Git Repository ←→ CI/CD Pipeline
│                            ├── ESLint + TypeScript
│                            ├── Unit Tests
│                            └── Build Optimization
└── Deployment Targets
    ├── Convex Cloud (Backend)
    ├── Cloudflare Pages (Frontend)
    └── Development Environment
```

## 4. Data Architecture

### 4.1 Database Design Principles

#### 4.1.1 Document Structure
- **Hierarchical Relationships**: Projects → Scenarios → Datasets → Tables
- **Denormalized Design**: projectId included in all entities for fast ownership queries
- **Version Control**: Datasets support versioning with incremental version numbers
- **Audit Trail**: All entities include createdAt and updatedAt timestamps

#### 4.1.2 Index Strategy (58 Total Indexes)
```sql
-- Ownership and Security
by_owner(ownerId)                    -- Fast user data retrieval
by_project(projectId)                -- Entity grouping by project

-- Performance Optimizations  
by_updated_at(updatedAt)             -- Recent items first
by_status(status)                    -- Filter by entity status
by_priority(priority)                -- Sort by importance

-- Optimization Engine Support
by_optimizer_id(optimizerId)         -- External system mapping
by_location(locationId)              -- Geographic relationships
by_dataset(datasetId)                -- Dataset entity grouping
```

### 4.2 Data Consistency Model

#### 4.2.1 ACID Compliance
- **Atomicity**: All operations complete or rollback entirely
- **Consistency**: All validation rules enforced at database level
- **Isolation**: Concurrent operations don't interfere
- **Durability**: Committed changes persist through failures

#### 4.2.2 Real-time Synchronization
```
Database Change → Convex Platform → WebSocket → All Connected Clients
                     ↓
               Change Detection → Optimistic Updates → Conflict Resolution
```

## 5. Security Architecture

### 5.1 Authentication and Authorization

#### 5.1.1 Authentication Flow
```
User Login → Convex Auth → JWT Token → Session Management
                ↓
          User Context → Function Calls → Ownership Validation
```

#### 5.1.2 Data Access Control
- **User Isolation**: All data filtered by ownerId
- **Function-Level Security**: Every mutation/query validates user ownership
- **Project-Level Permissions**: All entities require project ownership
- **Audit Logging**: All data modifications tracked with user context

### 5.2 Data Protection

#### 5.2.1 Input Validation
- **Schema Validation**: Zod schemas for all input parameters
- **Type Safety**: TypeScript enforcement at compile and runtime
- **Sanitization**: Input cleaning and validation before database storage
- **Rate Limiting**: Built-in Convex platform protections

#### 5.2.2 Network Security
- **HTTPS Only**: All communications encrypted in transit
- **CORS Protection**: Restricted cross-origin requests
- **XSS Prevention**: Content Security Policy headers
- **HSTS**: HTTP Strict Transport Security enforcement

## 6. Performance Architecture

### 6.1 Frontend Performance

#### 6.1.1 Optimization Strategies
- **Code Splitting**: Route-based lazy loading with React Router
- **Bundle Optimization**: Vite tree shaking and minification (445KB bundle, 134KB gzipped)
- **Component Memoization**: React.memo and useMemo for expensive operations
- **Virtual Scrolling**: Planned for large dataset tables
- **Image Optimization**: Lazy loading and responsive images

#### 6.1.2 Real-time Performance
- **WebSocket Efficiency**: Convex optimized real-time protocol
- **State Reconciliation**: Optimistic updates with server reconciliation
- **Debounced Operations**: Input debouncing for search and filters
- **Cache Management**: Convex intelligent client-side caching

### 6.2 Backend Performance

#### 6.2.1 Serverless Scaling
- **Auto-scaling**: Convex automatic function scaling based on demand
- **Cold Start Optimization**: Optimized function initialization
- **Connection Pooling**: Database connection optimization
- **Resource Allocation**: Dynamic resource allocation per function

#### 6.2.2 Database Performance
- **Index Optimization**: 58 strategic indexes for common query patterns
- **Query Optimization**: Efficient query patterns with proper filtering
- **Batch Operations**: Bulk processing for large data operations
- **Caching Strategy**: Multi-level caching with invalidation

## 7. Deployment Architecture

### 7.1 Production Environment

#### 7.1.1 Convex Cloud Deployment
- **Backend URL**: https://mild-elephant-70.convex.cloud
- **Function Count**: 70+ deployed serverless functions
- **Geographic Distribution**: Global edge deployment
- **Monitoring**: Built-in observability and alerting

#### 7.1.2 Frontend Deployment
- **Platform**: Cloudflare Pages (planned)
- **CDN**: Global content delivery network
- **Build Process**: Vite production optimization
- **Cache Strategy**: Aggressive caching with cache busting

### 7.2 Development Environment

#### 7.2.1 Local Development
- **Frontend**: Vite dev server (localhost:5173)
- **Backend**: Convex dev environment with live reload
- **Database**: Shared development database instance
- **Hot Reload**: Full-stack development with instant updates

## 8. Monitoring and Observability

### 8.1 Application Monitoring

#### 8.1.1 Convex Platform Monitoring
- **Function Performance**: Execution time and success rates
- **Database Metrics**: Query performance and index utilization
- **Real-time Connections**: WebSocket connection health
- **Error Tracking**: Automatic error detection and alerting

#### 8.1.2 Frontend Monitoring
- **User Experience**: Core Web Vitals tracking
- **Error Boundary**: React error catching and reporting
- **Performance Metrics**: Load times and interaction responsiveness
- **Usage Analytics**: User behavior and feature adoption

### 8.2 Health Checks

#### 8.2.1 System Health Monitoring
- **Database Connectivity**: Connection pool health
- **Function Availability**: Critical function response times
- **External Integration**: Optimization engine connectivity
- **Resource Utilization**: Memory and CPU usage tracking

## 9. Disaster Recovery and Business Continuity

### 9.1 Backup and Recovery

#### 9.1.1 Data Backup
- **Frequency**: Automatic backups every 15 minutes
- **Retention**: 30-day backup retention policy
- **Recovery Testing**: Monthly recovery procedure testing
- **Geographic Redundancy**: Multi-region backup storage

#### 9.1.2 Recovery Procedures
- **RTO Target**: 1 hour maximum recovery time
- **RPO Target**: 15 minutes maximum data loss
- **Failover Process**: Automatic failover for database issues
- **Communication Plan**: User notification and status updates