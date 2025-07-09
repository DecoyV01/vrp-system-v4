# VRP System v4 Architecture

## System Overview

VRP System v4 is a production-ready Vehicle Routing Problem management system built as a monorepo with React frontend and Convex backend.

### Core Hierarchy
Projects → Scenarios → Datasets → Tables (vehicles, jobs, locations, etc.)

## Technology Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.3.1  
- **Styling**: Tailwind CSS v4.1.11 with OKLCH color system
- **UI Components**: shadcn/ui (15 components)
- **Routing**: React Router v6.26.1
- **State Management**: Zustand (local) + Convex (server state with real-time sync)

### Backend
- **Platform**: Convex serverless backend
- **Database**: Real-time WebSocket database with 58 indexes
- **Functions**: 70+ serverless functions across 12 TypeScript files
- **Authentication**: Convex Auth with JWT (production-ready)

### Deployment
- **Backend**: Convex Cloud (https://mild-elephant-70.convex.cloud)
- **Frontend**: Cloudflare Pages ready
- **Build Output**: 445KB bundle, 134KB gzipped

## Monorepo Structure

```
├── frontend/           # React app (36 TypeScript files)
├── convex/            # Serverless backend (12 TypeScript files)
├── memory-bank/       # Structured documentation (9 categories)
├── uat/              # UAT testing framework
└── dist/             # Build output
```

## Database Schema

### Core Entities
- **projects**: Top-level container with user ownership
- **scenarios**: Optimization scenarios within projects  
- **datasets**: Versioned data collections for optimization
- **vehicles**: Fleet definitions with capacity and constraints
- **jobs**: Individual tasks/stops with time windows
- **locations**: Geographic points with coordinates
- **routes**: Optimization results and route summaries

### Patterns
- **Required fields**: projectId, updatedAt, optimizerId
- **Indexes**: 58 total with by_project, by_optimizer_id, by_dataset patterns
- **Timestamps**: _creationTime (auto) + updatedAt (manual)
- **Relations**: Four-level hierarchy with denormalized projectId fields

## Key Architecture Patterns

### Frontend Patterns
- **Component Organization**: Feature-based with shadcn/ui components
- **Layout System**: Dual sidebar pattern (Primary + Secondary)
- **Data Fetching**: Custom hooks using Convex React client
- **Table Editing**: Inline cell editing with real-time updates

### Backend Patterns
- **Schema Design**: Comprehensive VRP data model (convex/schema.ts - 502 lines)
- **Function Organization**: Separate files per entity type
- **Authentication**: Convex Auth with JWT-based sessions
- **Validation**: Input validation with optimization engine compatibility
- **Real-time**: WebSocket connections for live updates

## Performance Considerations

- Database queries use proper indexes for all filtering
- Real-time updates via Convex WebSocket connections  
- Optimization engine compatibility (VROOM, OR-Tools, etc.)
- Component-level state management with Zustand
- TypeScript integration with generated Convex types

## Security

- User-based project ownership and access control
- All backend functions validate user ownership before data access
- Production headers configured for XSS protection and HSTS
- JWT-based authentication with secure key management

For detailed authentication architecture, see [Authentication Architecture](./authentication-architecture.md).