# CLAUDE.md

This file provides essential guidance to Claude Code when working with this VRP System v4 codebase.

See @docs/architecture.md for complete system overview and @docs/development-workflow.md for detailed development commands.

## Project Overview

VRP System v4 is a production-ready Vehicle Routing Problem management system built as a monorepo with React frontend and Convex backend. The system manages a four-level hierarchy: **Projects → Scenarios → Datasets → Tables**.

### Technology Stack
- **Frontend**: React 18.3.1 + TypeScript + Vite + shadcn/ui + Tailwind CSS v4
- **Backend**: Convex serverless platform with real-time WebSocket database  
- **State**: Zustand (local) + Convex (server state with real-time sync)
- **Authentication**: Mock auth system (development-ready)

## Essential Commands

### Quick Start
```bash
npm run install:all              # Install all dependencies
npm run dev                      # Start frontend dev server (port 5173)
npm run dev:convex              # Start Convex backend in dev mode
npm run build                   # Build for production
```

### Frontend Quality Checks
```bash
npm run lint                    # ESLint check - ALWAYS run before commits
npm run type-check             # TypeScript validation
```

### Convex Backend
```bash
npx convex dev                 # Start development backend  
npx convex deploy              # Deploy to production
npx convex codegen             # Generate TypeScript types
```

## Core Architecture Patterns

### Database Schema
- **Hierarchy**: Projects → Scenarios → Datasets → Tables (vehicles, jobs, locations, routes)
- **Key Files**: @convex/schema.ts (502 lines, 58 indexes), @convex/validation.ts
- **Patterns**: projectId ownership, _creationTime + updatedAt timestamps

### Frontend Components  
- **Layout**: Dual sidebar pattern (Primary + Secondary sidebars)
- **Table Editing**: Inline cell editing with real-time Convex sync
- **Key Files**: @frontend/src/components/table-editor/TableEditor.tsx, @frontend/src/hooks/useVRPData.ts

## UAT Testing Framework

**Quick Commands** (Natural Language - Recommended):
```
"Run UAT for login flow"
"Execute UAT vehicle CRUD tests"  
"Test UAT error handling scenarios"
```

**Manual Alternative**:
```bash
cd uat/ && node hybrid-uat-executor.js login-flow
# Execute MCP tools, then: node hybrid-uat-executor.js complete <session-id>
```

- **Available Scenarios**: login-flow, vehicle-crud, error-handling
- **Framework**: VERA methodology (Verify, Execute, Record, Analyze)
- **Reports**: Auto-generated in @uat/reports/[session-id]/

See @docs/uat-quick-reference.md for complete UAT guide.

## Environment Configuration

### Production Environment
- **Backend**: https://mild-elephant-70.convex.cloud (70+ functions deployed)
- **Frontend**: Ready for Cloudflare Pages deployment

### MCP Server Setup (After Reboot)
```bash
cd C:\projects\vrp-system\v4
npx @modelcontextprotocol/server-convex  # Keep terminal open
```

## Key Development Guidelines

### Code Patterns
- Use established project conventions and four-level hierarchy
- Leverage comprehensive schema and validation systems  
- Prefer editing existing files over creating new ones
- Follow shadcn/ui component patterns and Tailwind CSS v4

### Testing
- **Frontend**: Run `npm run lint` and `npm run type-check`
- **UAT**: Use natural language UAT commands for integration testing
- **Backend**: Convex built-in validation and real-time error handling

### File Organization
- **Frontend**: @frontend/src/ with components/, hooks/, pages/, stores/
- **Backend**: @convex/ with separate files per entity (projects.ts, vehicles.ts, etc.)
- **Documentation**: @memory-bank/documentation/ with 9 organized categories

## Important Files Reference

- **@convex/schema.ts**: Complete VRP database schema and relationships
- **@frontend/src/components/table-editor/TableEditor.tsx**: Main table editing component  
- **@frontend/src/hooks/useVRPData.ts**: Comprehensive VRP data hooks (338 lines)
- **@docs/architecture.md**: Detailed system architecture
- **@docs/development-workflow.md**: Complete development commands and workflow
- **@docs/table-editor.md**: Table editor architecture and bulk operations
- **@DEPLOYMENT.md**: Production deployment instructions
- **@memory-bank/documentation/**: Comprehensive project documentation

## Development Best Practices

- NEVER proactively create documentation files unless explicitly requested
- ALWAYS prefer editing existing files to creating new ones
- Use the established project patterns and conventions
- Follow the four-level hierarchy: Projects → Scenarios → Datasets → Tables
- Leverage the comprehensive schema and validation systems