# Development Workflow

## Quick Start Commands

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

### Frontend Commands (cd frontend/)
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
```

## Environment Configuration

### Development Environment
- **Name**: `mild-elephant-70` (development)
- **URL**: Generated automatically by Convex dev server
- **Usage**: Local development and testing

### Production Environment  
- **Name**: `mild-elephant-70` (production)
- **URL**: https://mild-elephant-70.convex.cloud
- **Usage**: Live production deployment with 70+ functions

### MCP Server Setup (After Reboot)
When starting work after laptop reboot:
```bash
# Navigate to project directory
cd C:\projects\vrp-system\v4

# Start Convex MCP server for Claude integration
npx @modelcontextprotocol/server-convex

# Keep this terminal open while working with Claude
```

## Development Workflow

1. **Initial Setup**: Run `npm run install:all`
2. **Development**: Use `npm run dev:convex` and `npm run dev:frontend`
3. **Backend Changes**: Auto-deploy to development environment
4. **Frontend Changes**: Require manual build and deployment
5. **Testing**: Run linting with `npm run lint`
6. **Deployment**: See @DEPLOYMENT.md for production deployment

## Code Patterns and Conventions

### Convex Backend
- Use convex/schema.ts for comprehensive VRP data model
- Separate files per entity (projects.ts, vehicles.ts, jobs.ts, etc.)
- Input validation in convex/validation.ts
- Four-level hierarchy with denormalized projectId fields
- Timestamps: _creationTime (automatic) + updatedAt (manual)

### Frontend
- Use shadcn/ui components from frontend/src/components/ui/
- Dual sidebar pattern (PrimarySidebar + SecondarySidebar)
- Custom hooks in frontend/src/hooks/ using Convex React client
- Zustand for local state, Convex for server state
- Tailwind CSS v4 with OKLCH color system

## Important Files Reference

- **convex/schema.ts**: Complete VRP database schema (502 lines, 58 indexes)
- **convex/validation.ts**: Input validation utilities
- **frontend/src/components/table-editor/TableEditor.tsx**: Main table editing component
- **frontend/src/hooks/useVRPData.ts**: Comprehensive VRP data hooks (338 lines)
- **memory-bank/documentation/04-development/**: Development guides and best practices