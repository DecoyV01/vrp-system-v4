# VRP Project Management Web App - Detailed Implementation Plan

**Project**: VRP System v4 (Convex Project: vrp-system-v4/modest-bat-713)
**Stack**: Convex Backend + React Frontend + Cloudflare Pages
**Architecture**: Four-level hierarchy with dual sidebar navigation and advanced table editor

---

## Phase 1: Project Setup & Infrastructure

### Task 1.1: Initialize Frontend Structure
- [ ] Create new React project with Vite + TypeScript in current directory
- [ ] Connect to existing Convex project "vrp-system-v4/modest-bat-713"
- [ ] Set up Git repository with proper .gitignore
- [ ] Configure package.json with all required dependencies
- [ ] Set up ESLint + Prettier configuration
- [ ] Create basic folder structure (src/, public/)

### Task 1.2: Configure Development Environment
- [ ] Install and configure Tailwind CSS
- [ ] Set up shadcn/ui with components.json
- [ ] Configure Vite build settings for production
- [ ] Set up environment variables for development/production
- [ ] Verify Convex CLI connection to existing project
- [ ] Configure TypeScript for both frontend and backend

### Task 1.3: Design System Foundation
- [ ] Create Tailwind config with custom color palette
- [ ] Set up design tokens (spacing, typography, colors)
- [ ] Create base CSS utilities and components
- [ ] Import Lucide React icons
- [ ] Set up Sonner for toast notifications

**Dependencies**:
```json
{
  "convex": "^1.16.0",
  "react": "^18.3.1",
  "@radix-ui/react-*": "latest",
  "tailwindcss": "^3.4.0",
  "lucide-react": "^0.441.0",
  "sonner": "^1.0.0",
  "react-hook-form": "^7.53.0",
  "zod": "^3.23.8",
  "react-router-dom": "^6.26.1",
  "zustand": "^4.5.5"
}
```

---

## Phase 2: Backend Development (Convex)

### Task 2.1: Database Schema Implementation (From convex-database-schema.md)
- [ ] Create schema.ts with complete VRP schema:
  - [ ] **Projects**: Root entities with user ownership
    ```typescript
    projects: defineTable({
      name: v.string(),                    // ✅ Required
      ownerId: v.string(),                 // ✅ Required - Convex Auth user ID
      createdAt: v.number(),               // ✅ Required
      updatedAt: v.number(),               // ✅ Required
      description: v.optional(v.string()), // ❓ Nullable
      currency: v.optional(v.string()),    // ❓ Nullable
      // ... all fields from schema
    }).index("by_owner", ["ownerId"])
    ```
  - [ ] **Scenarios**: Project children with optimization parameters
    ```typescript
    scenarios: defineTable({
      projectId: v.id("projects"),         // ✅ Required relationship
      name: v.string(),                    // ✅ Required
      createdAt: v.number(),               // ✅ Required
      updatedAt: v.number(),               // ✅ Required
      description: v.optional(v.string()), // ❓ Nullable
      optimizationParameters: v.optional(v.object({})), // ❓ Nullable
      // ... all fields from schema
    }).index("by_project", ["projectId"])
    ```
  - [ ] **Datasets**: Scenario children with versioning
    ```typescript
    datasets: defineTable({
      projectId: v.id("projects"),         // ✅ Required
      scenarioId: v.optional(v.id("scenarios")), // ❓ Nullable relationship
      name: v.string(),                    // ✅ Required
      version: v.number(),                 // ✅ Required
      createdAt: v.number(),               // ✅ Required
      // ... all fields from schema
    }).index("by_scenario", ["scenarioId"])
    ```
  - [ ] **Vehicles**: Vehicle fleet data
    ```typescript
    vehicles: defineTable({
      datasetId: v.id("datasets"),         // ✅ Required
      vehicleId: v.string(),               // ✅ Required
      startLocationId: v.optional(v.id("locations")), // ❓ Nullable
      endLocationId: v.optional(v.id("locations")),   // ❓ Nullable
      capacityWeight: v.optional(v.number()),         // ❓ Nullable
      capacityVolume: v.optional(v.number()),         // ❓ Nullable
      // ... all fields from schema
    }).index("by_dataset", ["datasetId"])
    ```
  - [ ] **Jobs**: Pickup/delivery tasks
    ```typescript
    jobs: defineTable({
      datasetId: v.id("datasets"),         // ✅ Required
      jobId: v.string(),                   // ✅ Required
      locationId: v.optional(v.id("locations")), // ❓ Nullable
      serviceTime: v.optional(v.number()), // ❓ Nullable
      timeWindowStart: v.optional(v.number()), // ❓ Nullable
      timeWindowEnd: v.optional(v.number()),   // ❓ Nullable
      // ... all fields from schema
    }).index("by_dataset", ["datasetId"])
    ```
  - [ ] **Locations**: Geographic points
    ```typescript
    locations: defineTable({
      datasetId: v.id("datasets"),         // ✅ Required
      locationId: v.string(),              // ✅ Required
      latitude: v.number(),                // ✅ Required
      longitude: v.number(),               // ✅ Required
      address: v.optional(v.string()),     // ❓ Nullable
      city: v.optional(v.string()),        // ❓ Nullable
      // ... all fields from schema
    }).index("by_dataset", ["datasetId"])
    ```
  - [ ] **Routes**: Optimization results
    ```typescript
    routes: defineTable({
      datasetId: v.id("datasets"),         // ✅ Required
      vehicleId: v.string(),               // ✅ Required
      jobId: v.string(),                   // ✅ Required
      sequence: v.number(),                // ✅ Required
      arrivalTime: v.optional(v.number()), // ❓ Nullable
      departureTime: v.optional(v.number()), // ❓ Nullable
      // ... all fields from schema
    }).index("by_dataset", ["datasetId"])
    ```

- [ ] Define proper indexes for efficient queries:
  - [ ] by_owner, by_project, by_scenario, by_dataset
  - [ ] by_created_at, by_updated_at for temporal queries
  - [ ] by_status for filtering active/inactive records

### Task 2.2: Convex Authentication Setup
- [ ] Configure Convex Auth in existing project
- [ ] Create user table for profile management
- [ ] Implement authentication functions using Convex Auth
- [ ] Set up user session management
- [ ] Create authentication middleware for protected routes
- [ ] Implement user profile management

### Task 2.3: Core CRUD Functions
- [ ] **Projects module** (`convex/projects.ts`):
  ```typescript
  export const list = query({
    handler: async (ctx) => {
      const user = await getCurrentUser(ctx);
      return await ctx.db.query("projects")
        .withIndex("by_owner", q => q.eq("ownerId", user._id))
        .collect();
    }
  });
  
  export const create = mutation({
    args: { name: v.string(), description: v.optional(v.string()) },
    handler: async (ctx, args) => {
      const user = await getCurrentUser(ctx);
      return await ctx.db.insert("projects", {
        ...args,
        ownerId: user._id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  });
  ```
  - [ ] `list()` - Get user's projects with nullable fields
  - [ ] `create()` - Create new project with validation
  - [ ] `update()` - Update project details including nullable fields
  - [ ] `delete()` - Delete project (with cascade to scenarios)
  - [ ] `getById()` - Get project by ID with all relationships

- [ ] **Scenarios module** (`convex/scenarios.ts`):
  - [ ] `listByProject()` - Get scenarios for project
  - [ ] `create()` - Create new scenario with optimization parameters
  - [ ] `update()` - Update scenario including nullable optimization settings
  - [ ] `delete()` - Delete scenario (cascade to datasets)

- [ ] **Datasets module** (`convex/datasets.ts`):
  - [ ] `listByScenario()` - Get datasets for scenario
  - [ ] `create()` - Create new dataset with versioning
  - [ ] `update()` - Update dataset with nullable fields
  - [ ] `delete()` - Delete dataset (cascade to data tables)

- [ ] **Vehicles module** (`convex/vehicles.ts`):
  - [ ] `listByDataset()` - Get vehicles with nullable capacity fields
  - [ ] `create()` - Create vehicle with capacity constraints
  - [ ] `bulkImport()` - CSV import functionality
  - [ ] `update()` - Update vehicle data
  - [ ] `delete()` - Delete vehicle

- [ ] **Jobs module** (`convex/jobs.ts`):
  - [ ] `listByDataset()` - Get jobs with nullable timing fields
  - [ ] `create()` - Create job with pickup/delivery data
  - [ ] `update()` - Update job including nullable fields
  - [ ] `delete()` - Delete job

- [ ] **Locations module** (`convex/locations.ts`):
  - [ ] `listByDataset()` - Get locations with nullable address fields
  - [ ] `create()` - Create location with coordinates
  - [ ] `update()` - Update location data
  - [ ] `delete()` - Delete location

- [ ] **Routes module** (`convex/routes.ts`):
  - [ ] `listByOptimization()` - Get routes with nullable actual_* fields
  - [ ] `storeOptimizationResults()` - Store VROOM solver results
  - [ ] `update()` - Update route data
  - [ ] `delete()` - Delete route

### Task 2.4: Advanced Backend Features
- [ ] Implement data validation with Zod schemas matching VRP schema
- [ ] Create bulk operations for vehicle/job/location data
- [ ] Set up file upload/download actions for CSV import/export
- [ ] Implement search and filtering functions across all entities
- [ ] Create audit trail functionality with proper timestamps
- [ ] Add data export functions (CSV, JSON) for VRP data

---

## Phase 3: Frontend Setup & Core Components

### Task 3.1: Project Architecture
- [ ] Set up React Router v6 with protected routes
- [ ] Create Convex provider and client configuration for existing project
- [ ] Set up global state management with Zustand
- [ ] Create custom hooks for Convex VRP data
- [ ] Implement error boundaries and loading states

### Task 3.2: Layout Components
- [ ] Create MainLayout component with dual sidebars:
  ```typescript
  // src/components/layout/MainLayout.tsx
  <div className="flex h-screen bg-gray-50">
    <PrimarySidebar />
    <SecondarySidebar />
    <MainContent />
  </div>
  ```
- [ ] Implement responsive layout system
- [ ] Create Header component with user menu
- [ ] Build PrimarySidebar with navigation
- [ ] Build SecondarySidebar for hierarchy tree
- [ ] Create MainContent area with proper sizing

### Task 3.3: Basic UI Components
- [ ] Install and configure shadcn/ui components:
  - [ ] Button, Input, Label
  - [ ] Dialog, Sheet, Popover
  - [ ] Table, Checkbox, Select
  - [ ] Toast, Loading spinners
  - [ ] Icons from Lucide React
- [ ] Create custom components:
  - [ ] LoadingSpinner
  - [ ] ErrorMessage
  - [ ] ConfirmDialog
  - [ ] ContextMenu

---

## Phase 4: Navigation System Implementation

### Task 4.1: Primary Sidebar
- [ ] Create PrimarySidebar component with clean design:
  ```typescript
  // src/components/layout/PrimarySidebar.tsx
  const menuItems = [
    { id: 'projects', label: 'Projects', icon: FolderIcon, path: '/projects' }
  ];
  ```
- [ ] Implement Projects menu item with icon
- [ ] Add hover and active states
- [ ] Create user profile section with Convex Auth integration
- [ ] Add expandable menu structure for future items
- [ ] Implement keyboard navigation

### Task 4.2: Secondary Sidebar (Hierarchy Tree)
- [ ] Create HierarchyTree component for 4-level structure:
  ```typescript
  // src/components/layout/SecondarySidebar.tsx
  interface TreeNode {
    id: string;
    type: 'project' | 'scenario' | 'dataset' | 'table';
    name: string;
    children?: TreeNode[];
    expanded?: boolean;
  }
  ```
- [ ] Implement expandable tree nodes:
  - [ ] 📁 Project nodes with expand/collapse
  - [ ] └── 📋 Scenario child nodes
  - [ ] └──── 📊 Dataset child nodes
  - [ ] └────── 📋 Table leaf nodes (vehicles, jobs, locations, routes)
- [ ] Add chevron icons for expand/collapse
- [ ] Implement context menus for CRUD operations
- [ ] Add search/filter functionality
- [ ] Create drag-and-drop for reorganization

### Task 4.3: Navigation Logic
- [ ] Implement tree state management with Zustand
- [ ] Create navigation handlers for tree selection
- [ ] Add URL routing for deep linking to specific tables
- [ ] Implement breadcrumb navigation
- [ ] Create keyboard shortcuts for navigation
- [ ] Add tree node caching for performance

---

## Phase 5: Table Editor Development

### Task 5.1: Core Table Editor
- [ ] Create TableEditor main component for VRP data tables:
  ```typescript
  // src/components/table-editor/TableEditor.tsx
  interface TableEditorProps {
    datasetId: string;
    tableType: 'vehicles' | 'jobs' | 'locations' | 'routes';
  }
  ```
- [ ] Implement virtual scrolling for large datasets
- [ ] Create editable cell components:
  - [ ] TextCell for string fields (name, description)
  - [ ] NumberCell for capacity, coordinates, timing
  - [ ] DateCell for time windows and scheduling
  - [ ] BooleanCell for flags and status
  - [ ] SelectCell for foreign key relationships
- [ ] Add click-to-edit functionality
- [ ] Implement cell navigation with keyboard

### Task 5.2: Column Management
- [ ] Create column header components
- [ ] Implement add/remove column functionality
- [ ] Add inline column renaming
- [ ] Create column reordering with drag-and-drop
- [ ] Implement column data type specification
- [ ] Add column validation rules for VRP constraints
- [ ] Create column context menus

### Task 5.3: Row Operations
- [ ] Implement add/remove row functionality
- [ ] Create row selection (single/multi)
- [ ] Add bulk operations for selected rows
- [ ] Implement row insertion at specific positions
- [ ] Add row context menus
- [ ] Create row numbering and headers

### Task 5.4: Advanced Editor Features
- [ ] Implement copy/paste functionality
- [ ] Add undo/redo with action history
- [ ] Create auto-save with optimistic updates (built into Convex)
- [ ] Implement range selection
- [ ] Add keyboard shortcuts (Ctrl+C, Ctrl+V, etc.)
- [ ] Create data validation for VRP constraints
- [ ] Add cell formatting options

### Task 5.5: VRP-Specific Features
- [ ] Implement location coordinate validation
- [ ] Add capacity constraint validation for vehicles
- [ ] Create time window validation for jobs
- [ ] Implement address geocoding integration
- [ ] Add route visualization capabilities
- [ ] Create optimization parameter editors

---

## Phase 6: Authentication & User Management (Convex Auth)

### Task 6.1: Convex Authentication UI
- [ ] Create login/signup pages using Convex Auth:
  ```typescript
  // src/pages/auth/LoginPage.tsx
  const signIn = useAuthActions().signIn;
  ```
- [ ] Implement email/password authentication
- [ ] Add OAuth providers (Google, GitHub) via Convex Auth
- [ ] Create user profile management with Convex Auth
- [ ] Implement logout functionality
- [ ] Add authentication status indicators

### Task 6.2: Convex Authorization System
- [ ] Implement user ownership validation for projects
- [ ] Create permission checks for CRUD operations
- [ ] Add project access control
- [ ] Implement user session management with Convex Auth
- [ ] Create user invitation system
- [ ] Add audit logging for security

---

## Phase 7: UI/UX Polish

### Task 7.1: Visual Design
- [ ] Implement consistent hover states
- [ ] Add focus management for accessibility
- [ ] Create loading skeletons for all components
- [ ] Add smooth transitions and animations
- [ ] Implement dark/light theme support
- [ ] Create responsive breakpoints

### Task 7.2: User Experience
- [ ] Add keyboard shortcuts documentation
- [ ] Implement onboarding tutorial
- [ ] Create contextual help tooltips
- [ ] Add empty states and placeholders
- [ ] Implement search highlighting
- [ ] Create data export/import wizards for VRP data

### Task 7.3: Performance Optimization
- [ ] Implement virtual scrolling for large tables
- [ ] Add memoization for expensive calculations
- [ ] Optimize bundle size with code splitting
- [ ] Implement lazy loading for components
- [ ] Add caching strategies for frequently accessed data
- [ ] Optimize images and assets

---

## Phase 8: Testing & Quality Assurance

### Task 8.1: Unit Testing
- [ ] Set up Vitest testing framework
- [ ] Create tests for all utility functions
- [ ] Test Convex functions with convex-test
- [ ] Add component testing with React Testing Library
- [ ] Create mock VRP data and fixtures
- [ ] Implement test coverage reporting

### Task 8.2: Integration Testing
- [ ] Test complete user workflows
- [ ] Verify Convex real-time functionality (built-in)
- [ ] Test Convex Auth flows
- [ ] Validate CRUD operations for VRP entities
- [ ] Test responsive design
- [ ] Verify accessibility compliance

### Task 8.3: End-to-End Testing (Browser MCP)
- [ ] Set up Browser MCP for E2E testing
- [ ] Create critical path test scenarios
- [ ] Test VRP data management workflows
- [ ] Verify data persistence across sessions
- [ ] Test error handling and recovery
- [ ] Performance testing with large VRP datasets

---

## Phase 9: Deployment & DevOps

### Task 9.1: Convex Backend Deployment
- [ ] Configure production environment for existing project "vrp-system-v4/modest-bat-713"
- [ ] Set up environment variables for VRP system
- [ ] Deploy backend functions to Convex Cloud
- [ ] Configure database indexes for production
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies

### Task 9.2: Frontend Deployment (Cloudflare Pages)
- [ ] Configure Cloudflare Pages project
- [ ] Set up GitHub integration for auto-deployment
- [ ] Configure build settings and environment variables
- [ ] Set up custom domain and SSL
- [ ] Configure caching and CDN settings
- [ ] Implement preview deployments

---

## File Structure

```
/convex/                          # Backend (existing project)
├── schema.ts                     # Complete VRP schema
├── auth.ts                       # Convex Auth configuration
├── projects.ts                   # Project CRUD functions
├── scenarios.ts                  # Scenario CRUD functions
├── datasets.ts                   # Dataset CRUD functions
├── vehicles.ts                   # Vehicle data functions
├── jobs.ts                       # Job data functions
├── locations.ts                  # Location data functions
├── routes.ts                     # Route data functions
└── _generated/                   # Auto-generated files

/src/                            # React frontend
├── components/
│   ├── layout/
│   │   ├── MainLayout.tsx       # Main app layout
│   │   ├── PrimarySidebar.tsx   # Projects navigation
│   │   └── SecondarySidebar.tsx # Hierarchy tree
│   ├── table-editor/
│   │   ├── TableEditor.tsx      # Main table editor
│   │   ├── TableRow.tsx         # Editable rows
│   │   ├── TableCell.tsx        # Editable cells
│   │   └── ColumnHeader.tsx     # Column management
│   ├── ui/                      # shadcn/ui components
│   └── auth/                    # Authentication components
├── pages/
│   ├── ProjectsPage.tsx         # Projects management
│   ├── TableEditorPage.tsx      # Table editing interface
│   └── auth/                    # Login/signup pages
├── hooks/
│   ├── useConvexAuth.ts         # Authentication hooks
│   ├── useVRPData.ts            # VRP data hooks
│   └── useHierarchy.ts          # Tree navigation hooks
├── lib/
│   ├── convex.ts                # Convex client setup
│   └── utils.ts                 # Utility functions
├── App.tsx                      # Main app component
└── main.tsx                     # Entry point

/                                # Root files
├── package.json                 # Dependencies
├── convex.json                  # Convex config (existing)
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind CSS config
├── components.json             # shadcn/ui config
└── README.md                   # Project documentation
```

---

## Technology Stack

### Backend: Convex Platform
- **Database**: Convex document database with real-time subscriptions
- **Authentication**: Convex Auth with OAuth support
- **Functions**: TypeScript queries, mutations, actions
- **Real-time**: Built-in live queries and optimistic updates
- **File Storage**: Built-in file upload/download

### Frontend: React + shadcn/ui
- **Framework**: React 18 + TypeScript + Vite
- **UI Library**: shadcn/ui + Tailwind CSS + Radix UI
- **State Management**: Convex hooks + Zustand for local state
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

### Hosting & Deployment
- **Backend**: Convex Cloud (existing project: vrp-system-v4/modest-bat-713)
- **Frontend**: Cloudflare Pages with GitHub integration
- **Domain**: Custom domain with SSL
- **CI/CD**: Automatic deployment on git push

---

## Key Features

### 🏗️ Four-Level Hierarchy
```
User → Projects → Scenarios → Datasets → Tables
├── Project Management (CRUD operations)
├── Scenario Planning (optimization parameters)
├── Dataset Versioning (data management)
└── Table Data Management (vehicles, jobs, locations, routes)
```

### 🎯 Dual Sidebar Navigation
- **Primary Sidebar**: Clean, minimal navigation with Projects menu
- **Secondary Sidebar**: Expandable tree showing full hierarchy
- **Real-time Updates**: Tree reflects data changes instantly (Convex built-in)

### 📊 Advanced Table Editor
- **Click-to-Edit**: Double-click cells with proper data type handling
- **Column Management**: Add/remove/rename columns dynamically
- **Row Operations**: Full CRUD with keyboard navigation
- **VRP-Specific**: Validation for coordinates, capacities, time windows
- **Auto-save**: Optimistic updates with Convex real-time sync

### 🎨 Professional Design
- **Modern UI**: shadcn/ui + Tailwind CSS
- **Responsive**: Desktop, tablet, mobile layouts
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Virtual scrolling, lazy loading, memoization

---

## Timeline Estimate: 6-8 Weeks

- **Phase 1-2**: 2 weeks (Setup + Backend with existing Convex project)
- **Phase 3-4**: 2 weeks (Frontend + Navigation)
- **Phase 5**: 2 weeks (Table Editor for VRP data)
- **Phase 6**: 1 week (Convex Auth integration)
- **Phase 7-8**: 2 weeks (Polish + Testing)
- **Phase 9**: 1 week (Deployment)

---

## Success Metrics

- [ ] **Performance**: Sub-200ms response times for all operations
- [ ] **Reliability**: 99.9% uptime with Convex Cloud
- [ ] **Responsive**: Works on all screen sizes (desktop, tablet, mobile)
- [ ] **Accessible**: WCAG 2.1 AA compliance
- [ ] **Scalable**: Support for large VRP datasets (1000+ vehicles/jobs)
- [ ] **Functional**: Complete CSV import/export for VRP data
- [ ] **Real-time**: Instant data synchronization across all clients

---

## Next Steps

1. **Phase 1**: Start with project setup and dependencies
2. **Connect**: Verify connection to existing Convex project "vrp-system-v4/modest-bat-713"
3. **Schema**: Implement complete VRP schema from convex-database-schema.md
4. **Frontend**: Build React app with dual sidebar navigation
5. **Editor**: Create advanced table editor for VRP data management

This plan provides a comprehensive roadmap for building a professional-grade VRP project management web application using modern full-stack technologies with Convex as the backend platform.