# Table Editor Architecture

## Current Implementation

The TableEditor component (`frontend/src/components/table-editor/TableEditor.tsx`) provides:

### Core Features
- **Inline Cell Editing**: Click-to-edit functionality with type validation
- **Schema-Driven Columns**: Dynamic column rendering based on VRP table schemas
- **Real-time Updates**: Automatic synchronization via Convex WebSocket connections
- **CRUD Operations**: Create, update, delete operations per table type
- **Type Safety**: Full TypeScript integration with generated Convex types

### Supported Table Types
- **vehicles**: Fleet definitions with capacity and constraints
- **jobs**: Individual tasks/stops with time windows and requirements
- **locations**: Geographic points with coordinates and metadata
- **routes**: Optimization results and route summaries (read-only)

## Current Limitations

- **Import/Export**: CSV import/export buttons are disabled (lines 352-359)
- **Bulk Operations**: No multi-row selection or bulk editing capabilities
- **Large Datasets**: No pagination or virtual scrolling optimization

## Planned Enhancements

Implementation roadmap for bulk editing features:

1. **CSV Import/Export**: Leverage Convex file storage APIs with PapaParse
2. **Bulk Selection**: Multi-row selection with checkbox interface
3. **Bulk Editing**: Modal-based bulk field updates with validation
4. **Performance**: Pagination and virtual scrolling for large datasets
5. **Real-time Sync**: Maintain Convex automatic synchronization

## Data Flow Architecture

```
Frontend TableEditor ←→ Custom Hooks ←→ Convex Functions ←→ Database
     ↑                      ↑                ↑              ↑
  User Actions         Zustand Store    Mutations/Queries  Schema (502 lines)
  Cell Editing         Real-time        Validation         58 Indexes
  Bulk Operations      WebSocket        Transactions       Hierarchical Relations
  (Planned)            Updates          Error Handling     User Ownership
```

## Implementation Patterns

- **Component Pattern**: Feature-based organization with shadcn/ui components
- **Data Pattern**: Custom hooks (useVRPData.ts - 338 lines) centralize all VRP operations
- **State Pattern**: Zustand for local state, Convex real-time for server state
- **Routing Pattern**: Hierarchical navigation matching data structure
- **Error Pattern**: Comprehensive error boundaries and loading states
- **Type Pattern**: Full TypeScript with generated Convex types

## Bulk Operations System

The table editor includes a comprehensive bulk operations system in:
`frontend/src/components/table-editor/bulk-operations/`

### Structure
```
bulk-operations/
├── import/          # CSV import with validation
├── export/          # CSV/Excel export options
├── edit/            # Bulk editing functionality
├── hooks/           # Performance optimization hooks
├── shared/          # Reusable components
├── types/           # TypeScript definitions
├── utils/           # Data processing utilities
└── workers/         # Web workers for performance
```

## Key Files

- **TableEditor.tsx**: Main table editing component (504 lines)
- **useVRPData.ts**: Comprehensive VRP data hooks (338 lines)
- **convex/schema.ts**: Database schema with table definitions
- **bulk-operations/**: Complete bulk editing system

## Detailed Implementation Guide

See: @memory-bank/documentation/09-library/convex-frontend-table-editing-capabilities.md