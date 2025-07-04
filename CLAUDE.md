# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VRP System v4 is a production-ready Vehicle Routing Problem (VRP) management system built as a monorepo with React frontend and Convex backend. The system manages a four-level hierarchy: Projects → Scenarios → Datasets → Tables (vehicles, jobs, locations, etc.).

## Architecture

### Monorepo Structure
- **Root**: Project configuration and scripts
- **frontend/**: React app with Vite + TypeScript + Tailwind CSS v4
- **convex/**: Serverless backend with 70+ functions and 49 database indexes
- **memory-bank/**: Documentation and development guides

### Technology Stack
- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS v4, React Router v6
- **Backend**: Convex platform with real-time database and serverless functions
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

### File Organization
- **Convex Functions**: One file per entity type with CRUD operations
- **React Components**: Grouped by feature in frontend/src/components/
- **Pages**: Route components in frontend/src/pages/
- **Hooks**: Data fetching and state logic in frontend/src/hooks/
- **Types**: Generated automatically by Convex in convex/_generated/

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
- Required fields: projectId (for ownership), updatedAt (for audit), optimizerId (for optimization engines)
- Optional fields: Extensive nullable fields for flexibility
- Indexes: Efficient queries with by_project, by_optimizer_id patterns
- Timestamps: _creationTime (auto) + updatedAt (manual)

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

## Important Files to Reference

- **convex/schema.ts**: Complete VRP database schema and relationships
- **convex/validation.ts**: Input validation utilities
- **convex/optimizerValidation.ts**: Optimization engine compatibility validation
- **frontend/src/components/layout/**: Dual sidebar navigation system
- **frontend/src/hooks/**: Data fetching patterns and Convex integration
- **memory-bank/documentation/04-development/**: Development guides and best practices
- **memory-bank/documentation/04-development/data-type-master-v1.0.md**: Optimization engine data type conversion guide
- **DEPLOYMENT.md**: Production deployment instructions and configuration