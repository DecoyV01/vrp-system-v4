# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VRP System v4 is a production-ready Vehicle Routing Problem (VRP) management system built as a monorepo with React frontend and Convex backend. The system manages a four-level hierarchy: Projects → Scenarios → Datasets → Tables (vehicles, jobs, locations, etc.).

## Architecture

### Monorepo Structure
- **Root**: Project coordination with npm scripts managing frontend + backend
- **frontend/**: React app (36 TypeScript files) with Vite + TypeScript + Tailwind CSS v4
- **convex/**: Serverless backend (12 TypeScript files) with 70+ functions and 58 database indexes
- **memory-bank/**: Structured documentation system with 9 organized categories
- **dist/**: Build output (445KB bundle, 134KB gzipped)

### Technology Stack
- **Frontend**: React 18.3.1, TypeScript, Vite 5.3.1, shadcn/ui (15 components), Tailwind CSS v4.1.11, React Router v6.26.1
- **Backend**: Convex platform with real-time WebSocket database and serverless functions
- **State Management**: Zustand for local state, Convex for server state with real-time sync
- **Authentication**: Mock auth system (development-ready)
- **Deployment**: Convex Cloud (backend), Cloudflare Pages (frontend)

## Development Commands

### Root Level Commands
```bash
# Install all dependencies (root + frontend)
npm run install:all

# Development (defaults to frontend)
npm run dev                    # Start frontend dev server
npm run dev:frontend          # Start frontend dev server (port 5173)
npm run dev:convex            # Start Convex backend in dev mode

# Production builds
npm run build                 # Build frontend for production
npm run build:frontend        # Build frontend 
npm run build:convex          # Build Convex backend

# Cleanup
npm run clean                 # Remove all node_modules and dist folders
```

### Frontend-Specific Commands (cd frontend/)
```bash
# Linting and formatting
npm run lint                  # ESLint check
npm run lint:fix             # ESLint auto-fix
npm run format               # Prettier format
npm run format:check         # Prettier check
npm run type-check           # TypeScript type checking

# Development
npm run dev                  # Vite dev server
npm run build                # Production build
npm run preview              # Preview production build
```

### Convex Backend Commands
```bash
# Development and deployment
npx convex dev               # Start development backend
npx convex deploy            # Deploy to production
npx convex deploy --prod     # Explicit production deployment

# Schema and functions
npx convex codegen           # Generate TypeScript types
npx convex functions         # List deployed functions
npx convex logs --tail       # Monitor real-time logs

# Environment management
npx convex env set KEY "value"         # Set environment variable
npx convex env set KEY "value" --prod  # Set for production

# MCP Server startup (run in new terminal after laptop reboot)
npx @modelcontextprotocol/server-convex # Start Convex MCP server
```

## Convex Environment Configuration

### Development Environment
- **Name**: `mild-elephant-70` (development)
- **URL**: Generated automatically by Convex dev server
- **Usage**: Local development and testing

### Production Environment  
- **Name**: `mild-elephant-70` (production)
- **URL**: https://mild-elephant-70.convex.cloud
- **Usage**: Live production deployment with 70+ functions

### MCP Server Setup (After Reboot)
When starting work after laptop reboot, open a new terminal and run:
```bash
# Navigate to project directory
cd C:\projects\vrp-system\v4

# Start Convex MCP server for Claude integration
npx @modelcontextprotocol/server-convex

# Keep this terminal open while working with Claude
# The MCP server enables Claude to interact with Convex directly
```

## Code Patterns and Conventions

### Convex Backend Patterns
- **Schema Design**: Use convex/schema.ts (502 lines) with comprehensive VRP data model
- **Function Organization**: Separate files per entity (projects.ts, vehicles.ts, jobs.ts, etc.)
- **Authentication**: Use Convex Auth - check convex/auth.ts for current implementation
- **Validation**: Input validation in convex/validation.ts
- **Database Relations**: Four-level hierarchy with denormalized projectId fields
- **Timestamps**: Use _creationTime (automatic) + updatedAt (manual)

### Frontend Patterns
- **Components**: Use shadcn/ui components from frontend/src/components/ui/
- **Layout**: Dual sidebar pattern (PrimarySidebar + SecondarySidebar)
- **Data Fetching**: Custom hooks in frontend/src/hooks/ using Convex React client
- **State Management**: Zustand for local state, Convex for server state
- **Styling**: Tailwind CSS v4 with OKLCH color system
- **Table Editing**: TableEditor component with inline cell editing and real-time updates

### File Organization

#### Frontend Structure (frontend/src/)
```
components/
├── auth/                    # Authentication components (placeholder)
├── layout/                  # Layout system
│   ├── MainLayout.tsx          # Main layout wrapper with dual sidebar
│   ├── PrimarySidebar.tsx      # Collapsible primary navigation
│   └── SecondarySidebar.tsx    # Context-sensitive secondary nav
├── table-editor/            # Data table editing functionality
│   └── TableEditor.tsx         # Main table editing component (504 lines)
└── ui/                      # shadcn/ui components (15 components)

pages/
├── ProjectsPage.tsx         # Project listing/management
├── ProjectDetailPage.tsx    # Project overview with scenarios
├── ScenarioDetailPage.tsx   # Scenario details with datasets
├── DatasetDetailPage.tsx    # Dataset management with tables
├── TableEditorPage.tsx      # Table editing interface
└── auth/LoginPage.tsx       # Authentication page

hooks/
├── useVRPData.ts           # Comprehensive VRP data hooks (338 lines)
├── useHierarchy.ts         # Hierarchical navigation state
├── useConvexAuth.ts        # Authentication hooks
├── useResponsive.ts        # Responsive design hooks
└── useSidebarStore.ts      # Sidebar state management (Zustand)
```

#### Backend Structure (convex/)
```
projects.ts          # Project CRUD operations
scenarios.ts         # Scenario management
datasets.ts          # Dataset versioning
vehicles.ts          # Vehicle fleet management
jobs.ts             # Job/task management
locations.ts        # Location management
routes.ts           # Route optimization results
tasks.ts            # Task management
auth.ts             # Authentication utilities
validation.ts       # Input validation
optimizerValidation.ts # Optimizer compatibility
schema.ts           # Database schema (502 lines, 58 indexes)
```

#### Documentation Structure (memory-bank/documentation/)
```
01-getting-started/  # Setup and quick start guides
02-architecture/     # System design documents
03-integration/      # API and integration docs
04-development/      # Development guidelines and patterns
05-operations/       # Deployment and operations
06-security/         # Security documentation
07-archives/         # Deprecated documents
08-plans/            # Future roadmaps and plans
09-library/          # Reference materials
```

## Database Schema

The VRP system uses a comprehensive schema (convex/schema.ts) with these core entities:
- **projects**: Top-level container with user ownership
- **scenarios**: Optimization scenarios within projects  
- **datasets**: Versioned data collections for optimization
- **vehicles**: Fleet definitions with capacity and constraints
- **jobs**: Individual tasks/stops with time windows
- **locations**: Geographic points with coordinates
- **routes**: Optimization results and route summaries

All entities follow consistent patterns:
- **Required fields**: projectId (for ownership), updatedAt (for audit), optimizerId (for optimization engines)
- **Optional fields**: Extensive nullable fields for VRP flexibility (58 total indexes)
- **Indexes**: Efficient queries with by_project, by_optimizer_id, by_dataset patterns
- **Timestamps**: _creationTime (auto) + updatedAt (manual)
- **Hierarchical Relations**: Four-level hierarchy with denormalized projectId fields

## Key Development Considerations

### Performance
- Database queries use proper indexes for all filtering operations
- Real-time updates via Convex WebSocket connections
- Optimization engine compatibility (VROOM, OR-Tools, etc.)

### Security
- User-based project ownership and access control
- All backend functions validate user ownership before data access
- Production headers configured for XSS protection and HSTS

### Testing
- Frontend: ESLint + TypeScript checking (run `npm run lint`)
- Backend: Convex built-in validation and error handling
- Schema: Optimization engine validation in convex/optimizerValidation.ts

## Deployment

### Production Environment
- **Backend**: https://mild-elephant-70.convex.cloud (70+ functions deployed)
- **Frontend**: Ready for Cloudflare Pages deployment
- **Build Command**: npm run build (outputs to dist/)
- **Environment Variables**: VITE_CONVEX_URL points to production backend

### Development Workflow
1. Run `npm run install:all` for initial setup
2. Use `npm run dev:convex` and `npm run dev:frontend` for development
3. Backend changes auto-deploy to development environment
4. Frontend changes require manual build and deployment

## Table Editor Architecture

### Current Implementation
The TableEditor component (`frontend/src/components/table-editor/TableEditor.tsx`) provides:
- **Inline Cell Editing**: Click-to-edit functionality with type validation
- **Schema-Driven Columns**: Dynamic column rendering based on VRP table schemas
- **Real-time Updates**: Automatic synchronization via Convex WebSocket connections
- **CRUD Operations**: Create, update, delete operations per table type
- **Type Safety**: Full TypeScript integration with generated Convex types

### Current Limitations
- **Import/Export**: CSV import/export buttons are disabled (lines 352-359)
- **Bulk Operations**: No multi-row selection or bulk editing capabilities
- **Large Datasets**: No pagination or virtual scrolling optimization

### Planned Enhancements
Implementation roadmap for bulk editing features:
1. **CSV Import/Export**: Leverage Convex file storage APIs with PapaParse
2. **Bulk Selection**: Multi-row selection with checkbox interface
3. **Bulk Editing**: Modal-based bulk field updates with validation
4. **Performance**: Pagination and virtual scrolling for large datasets
5. **Real-time Sync**: Maintain Convex automatic synchronization

### Table Types Supported
- **vehicles**: Fleet definitions with capacity and constraints
- **jobs**: Individual tasks/stops with time windows and requirements
- **locations**: Geographic points with coordinates and metadata
- **routes**: Optimization results and route summaries (read-only)

### Data Flow Architecture
```
Frontend TableEditor ←→ Custom Hooks ←→ Convex Functions ←→ Database
     ↑                      ↑                ↑              ↑
  User Actions         Zustand Store    Mutations/Queries  Schema (502 lines)
  Cell Editing         Real-time        Validation         58 Indexes
  Bulk Operations      WebSocket        Transactions       Hierarchical Relations
  (Planned)            Updates          Error Handling     User Ownership
```

### Implementation Patterns
- **Component Pattern**: Feature-based organization with shadcn/ui components
- **Data Pattern**: Custom hooks (useVRPData.ts - 338 lines) centralize all VRP operations
- **State Pattern**: Zustand for local state, Convex real-time for server state
- **Routing Pattern**: Hierarchical navigation matching data structure
- **Error Pattern**: Comprehensive error boundaries and loading states
- **Type Pattern**: Full TypeScript with generated Convex types

## Important Files to Reference

- **convex/schema.ts**: Complete VRP database schema and relationships
- **convex/validation.ts**: Input validation utilities
- **convex/optimizerValidation.ts**: Optimization engine compatibility validation
- **frontend/src/components/table-editor/TableEditor.tsx**: Main table editing component
- **frontend/src/components/layout/**: Dual sidebar navigation system
- **frontend/src/hooks/**: Data fetching patterns and Convex integration
- **memory-bank/documentation/09-library/convex-frontend-table-editing-capabilities.md**: Bulk editing implementation guide
- **memory-bank/documentation/04-development/**: Development guides and best practices
- **memory-bank/documentation/04-development/data-type-master-v1.0.md**: Optimization engine data type conversion guide
- **DEPLOYMENT.md**: Production deployment instructions and configuration

## UAT Testing Framework

**🛑 MANDATORY: DO NOT use Browser MCP tools directly - you MUST use the UAT framework by running `node uat-test-runner.cjs` commands from the `uat/` directory as documented in `/UAT-TESTING-INSTRUCTIONS.md` and `uat/RUN-UAT-TESTS.md`.**

For all User Acceptance Testing (UAT) activities, Claude Code must follow the comprehensive UAT framework located in the `uat/` directory. This includes:

- **UAT Commands**: Use the prescribed Node.js CLI commands for all testing activities (e.g., `node uat-test-runner.cjs crud project create --debug`)
- **Test Scenarios**: Follow the established multi-step scenario creation and execution patterns in `uat/scenarios/`
- **VERA Methodology**: Implement Verify, Execute, Record, Analyze testing approach through the framework
- **Browser Integration**: The UAT framework handles all Browser MCP integration - never call Browser MCP tools directly
- **Reporting**: Use the built-in reporting system for test results and screenshots

**References**: 
- **MUST READ FIRST**: `/UAT-TESTING-INSTRUCTIONS.md` - Mandatory UAT framework usage guide
- **Quick Start**: `uat/RUN-UAT-TESTS.md` - How to run UAT tests correctly
- **Complete Guide**: `uat/CLAUDE.md` - Full UAT framework documentation