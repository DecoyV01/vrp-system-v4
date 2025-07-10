# Master Locations System - Detailed Implementation Plan

**Version**: 1.0  
**Date**: January 10, 2025  
**Total Estimated Time**: 25 hours  
**Implementation Approach**: Multi-agent parallel development  

## Project Overview

This implementation plan breaks down the Master Locations System development into discrete, parallelizable tasks suitable for subagent execution. Each task is designed to be self-contained with clear inputs, outputs, and acceptance criteria.

## Architecture Decisions

### Technology Stack
- **Mapbox GL JS**: `@mapbox/mapbox-gl-js` with React wrapper `@mapbox/search-js-react`
- **Convex Patterns**: Reactive queries, real-time subscriptions, TypeScript-first
- **UI Framework**: shadcn/ui components extended with map-specific interfaces
- **State Management**: Zustand for local UI state + Convex for server state

### Development Principles
- **Convex Best Practices**: Leverage reactive queries, transactional mutations, built-in auth
- **Component Reusability**: Create composable map and location components
- **Real-time First**: Design for multi-user collaboration from the start
- **Performance Optimization**: Use proper indexing, clustering, and virtualization

## Phase 1: Backend Foundation (4 hours)

### Task 1.1: Location Validation Service Enhancement
**Assignable to**: Backend Specialist Agent  
**Duration**: 1 hour  
**Priority**: Critical Path  

**Objective**: Enhance location creation and import validation with geocoding quality checks

**Scope**:
- Extend existing `/convex/locations.ts` with validation enhancements
- Add geocoding quality scoring and validation
- Implement location deduplication logic
- Create validation utilities for import processes

**Specific Deliverables**:
```typescript
// File: /convex/locationValidation.ts
export const validateLocationData = mutation({
  args: {
    name: v.string(),
    address: v.optional(v.string()),
    coordinates: v.optional(v.array(v.number())),
    projectId: v.id('projects')
  },
  handler: async (ctx, args) => {
    // 1. Check for duplicate locations within project
    // 2. Validate coordinate bounds
    // 3. Score geocoding quality if address provided
    // 4. Return validation result with suggestions
  }
})

// Enhanced location creation with validation
export const createLocationWithValidation = mutation({
  // Implementation with full validation pipeline
})

// Bulk validation for import processes
export const validateLocationsBulk = mutation({
  // Process array of locations with deduplication
})
```

**Acceptance Criteria**:
- [ ] Duplicate detection works by name fuzzy matching (90% similarity threshold)
- [ ] Coordinate validation enforces proper lat/lon bounds
- [ ] Geocoding quality scoring (exact=1.0, interpolated=0.8, approximate=0.6, manual=0.4)
- [ ] Bulk validation processes 1000+ locations efficiently
- [ ] Validation errors provide actionable feedback

**Dependencies**: 
- Existing `/convex/locations.ts` functions
- `/convex/validation.ts` schema validation

**Files to Create**:
- `/convex/locationValidation.ts`

**Files to Modify**:
- `/convex/locations.ts` - Add validation calls to create/update functions

---

### Task 1.2: Location Cluster Management System
**Assignable to**: Backend Specialist Agent  
**Duration**: 1.5 hours  
**Priority**: Critical Path  

**Objective**: Implement comprehensive location clustering backend with multiple algorithms

**Scope**:
- Create complete cluster management system
- Implement automatic clustering algorithms (k-means, geographic proximity)
- Add cluster performance analytics
- Create cluster membership management

**Specific Deliverables**:
```typescript
// File: /convex/locationClusters.ts
export const createCluster = mutation({
  args: {
    projectId: v.id('projects'),
    name: v.string(),
    algorithm: v.union(v.literal('manual'), v.literal('kmeans'), v.literal('geographic')),
    config: v.object({
      maxRadius: v.optional(v.number()),
      minPoints: v.optional(v.number()),
      maxClusters: v.optional(v.number())
    })
  },
  handler: async (ctx, args) => {
    // Create cluster with initial configuration
  }
})

export const generateAutomaticClusters = action({
  args: {
    datasetId: v.id('datasets'),
    algorithm: v.union(v.literal('kmeans'), v.literal('geographic')),
    targetClusters: v.number()
  },
  handler: async (ctx, args) => {
    // Implement clustering algorithms
    // 1. K-means clustering for optimal grouping
    // 2. Geographic proximity clustering
    // 3. Return cluster suggestions with performance metrics
  }
})

export const getClusterAnalytics = query({
  args: { clusterId: v.id('locationClusters') },
  handler: async (ctx, args) => {
    // Return cluster performance metrics:
    // - Average travel time between cluster members
    // - Cluster density and efficiency score
    // - Route optimization potential
  }
})
```

**Acceptance Criteria**:
- [ ] Manual cluster creation and management works
- [ ] K-means clustering generates optimal location groups
- [ ] Geographic clustering groups by proximity radius
- [ ] Cluster analytics show meaningful performance metrics
- [ ] Cluster membership can be dynamically updated
- [ ] Cluster deletion validates no active usage

**Dependencies**: 
- Existing `/convex/locations.ts` for location data
- `/convex/schema.ts` locationClusters table definition

**Files to Create**:
- `/convex/locationClusters.ts`
- `/convex/clusteringAlgorithms.ts` (utility functions)

**Files to Modify**:
- `/convex/schema.ts` - Verify locationClusters table has all required fields

---

### Task 1.3: Location Usage Analytics System
**Assignable to**: Backend Analytics Agent  
**Duration**: 1.5 hours  
**Priority**: Medium  

**Objective**: Implement comprehensive location usage tracking and analytics

**Scope**:
- Track location usage across vehicles, jobs, shipments
- Calculate location performance metrics
- Generate usage analytics and reports
- Create location optimization recommendations

**Specific Deliverables**:
```typescript
// File: /convex/locationAnalytics.ts
export const trackLocationUsage = mutation({
  args: {
    locationId: v.id('locations'),
    entityType: v.union(v.literal('vehicle'), v.literal('job'), v.literal('shipment')),
    entityId: v.string(),
    usageType: v.string() // 'start', 'end', 'service', 'pickup', 'delivery'
  },
  handler: async (ctx, args) => {
    // Update location usage counters and last used timestamp
  }
})

export const getLocationUsageAnalytics = query({
  args: { 
    datasetId: v.id('datasets'),
    timeRange: v.optional(v.object({
      startDate: v.number(),
      endDate: v.number()
    }))
  },
  handler: async (ctx, args) => {
    // Return comprehensive usage analytics:
    // - Most/least used locations
    // - Usage patterns over time
    // - Location efficiency scores
    // - Optimization recommendations
  }
})

export const generateLocationPerformanceReport = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    // Generate detailed performance report:
    // - Location utilization rates
    // - Geographic coverage analysis
    // - Route efficiency by location
    // - Capacity utilization
  }
})
```

**Acceptance Criteria**:
- [ ] Usage tracking captures all location interactions
- [ ] Analytics show meaningful usage patterns and trends
- [ ] Performance reports identify optimization opportunities
- [ ] Data aggregation handles large datasets efficiently
- [ ] Historical usage data is preserved and queryable

**Dependencies**: 
- Existing entity tables (vehicles, jobs, shipments)
- `/convex/locations.ts` for location data

**Files to Create**:
- `/convex/locationAnalytics.ts`

**Files to Modify**:
- `/convex/vehicles.ts`, `/convex/jobs.ts`, `/convex/shipments.ts` - Add usage tracking calls

---

## Phase 2: Mapbox Integration (6 hours)

### Task 2.1: Mapbox Geocoding Service Integration
**Assignable to**: API Integration Specialist Agent  
**Duration**: 2.5 hours  
**Priority**: Critical Path  

**Objective**: Implement enterprise-grade geocoding service with Mapbox API

**Scope**:
- Create geocoding service wrapper for Mapbox APIs
- Implement forward and reverse geocoding
- Add batch geocoding capabilities
- Handle rate limiting and error management
- Implement geocoding result caching

**Specific Deliverables**:
```typescript
// File: /frontend/src/utils/geocoding.ts
export class MapboxGeocodingService {
  private apiKey: string
  private rateLimiter: RateLimiter
  private cache: GeocodingCache
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.rateLimiter = new RateLimiter(2500, 60000) // 2500 requests per minute
    this.cache = new GeocodingCache()
  }
  
  async geocodeAddress(address: string): Promise<GeocodingResult> {
    // 1. Check cache first
    // 2. Rate limit check
    // 3. Make Mapbox API call
    // 4. Cache result
    // 5. Return standardized result
  }
  
  async reverseGeocode(lat: number, lon: number): Promise<AddressResult> {
    // Reverse geocoding implementation
  }
  
  async batchGeocode(addresses: string[]): Promise<GeocodingResult[]> {
    // Batch processing with rate limiting
    // Process in chunks to respect API limits
  }
  
  async validateCoordinates(lat: number, lon: number): Promise<ValidationResult> {
    // Validate coordinates are in valid location
  }
}

// Convex action for server-side geocoding
// File: /convex/geocoding.ts
export const geocodeAddressAction = action({
  args: { address: v.string() },
  handler: async (ctx, args) => {
    // Server-side geocoding with API key security
  }
})
```

**Acceptance Criteria**:
- [ ] Forward geocoding converts addresses to coordinates with confidence scores
- [ ] Reverse geocoding converts coordinates to formatted addresses
- [ ] Batch geocoding processes up to 1000 addresses efficiently
- [ ] Rate limiting prevents API quota exceeded errors
- [ ] Caching reduces API calls for repeated requests
- [ ] Error handling provides meaningful feedback for failures
- [ ] Results include quality scores and component breakdown

**Dependencies**: 
- Mapbox account and API key configuration
- Environment variable setup for API keys

**Files to Create**:
- `/frontend/src/utils/geocoding.ts`
- `/convex/geocoding.ts`
- `/frontend/src/utils/rateLimiter.ts`
- `/frontend/src/utils/geocodingCache.ts`

---

### Task 2.2: Core Map Components Development
**Assignable to**: React/UI Specialist Agent  
**Duration**: 3.5 hours  
**Priority**: Critical Path  

**Objective**: Create reusable map components using Mapbox GL JS with React integration

**Scope**:
- Implement core map components with Mapbox GL JS
- Create location visualization and interaction components
- Add real-time updates via Convex subscriptions
- Implement clustering and performance optimization

**Specific Deliverables**:
```typescript
// File: /frontend/src/components/locations/LocationMap.tsx
interface LocationMapProps {
  locations: Location[]
  selectedLocationId?: Id<'locations'>
  onLocationSelect?: (locationId: Id<'locations'>) => void
  onLocationCreate?: (coordinates: [number, number]) => void
  showClusters?: boolean
  showRoutes?: boolean
  interactive?: boolean
  viewport?: MapViewport
  onViewportChange?: (viewport: MapViewport) => void
}

export const LocationMap: React.FC<LocationMapProps> = (props) => {
  // Implementation using Mapbox GL JS
  // Real-time location updates via Convex subscriptions
  // Clustering for performance with large datasets
  // Interactive features (click, drag, zoom)
}

// File: /frontend/src/components/locations/LocationPicker.tsx
interface LocationPickerProps {
  onLocationSelect: (coordinates: [number, number], address?: string) => void
  initialCoordinates?: [number, number]
  showAddressSearch?: boolean
  allowDragToMove?: boolean
}

export const LocationPicker: React.FC<LocationPickerProps> = (props) => {
  // Interactive coordinate selection with address search
  // Geocoding integration for address lookup
  // Drag-to-move functionality
}

// File: /frontend/src/components/locations/ClusterMap.tsx
interface ClusterMapProps {
  clusters: LocationCluster[]
  locations: Location[]
  onClusterSelect?: (clusterId: Id<'locationClusters'>) => void
  onClusterCreate?: (bounds: BoundingBox) => void
  showClusterMetrics?: boolean
}

export const ClusterMap: React.FC<ClusterMapProps> = (props) => {
  // Cluster visualization with metrics
  // Interactive cluster creation and editing
  // Performance analytics display
}
```

**Acceptance Criteria**:
- [ ] LocationMap displays all locations with proper clustering
- [ ] LocationPicker enables interactive coordinate selection
- [ ] ClusterMap visualizes location clusters with metrics
- [ ] Real-time updates work via Convex subscriptions
- [ ] Performance is optimized for 10,000+ locations
- [ ] Mobile-responsive touch interactions work
- [ ] Components are reusable and well-documented

**Dependencies**: 
- Mapbox GL JS library installation
- Geocoding service from Task 2.1
- Location data from existing Convex functions

**Files to Create**:
- `/frontend/src/components/locations/LocationMap.tsx`
- `/frontend/src/components/locations/LocationPicker.tsx`
- `/frontend/src/components/locations/ClusterMap.tsx`
- `/frontend/src/components/locations/MapControls.tsx`
- `/frontend/src/utils/mapboxUtils.ts`
- `/frontend/src/hooks/useMapbox.ts`

**Files to Modify**:
- `/frontend/package.json` - Add Mapbox dependencies

---

## Phase 3: Master Locations UI (8 hours)

### Task 3.1: Master Locations Page Development
**Assignable to**: React/UI Specialist Agent  
**Duration**: 3 hours  
**Priority**: Critical Path  

**Objective**: Create comprehensive master locations management interface

**Scope**:
- Build main locations page with hierarchical navigation
- Implement dual map/list view with synchronized selection
- Add advanced search and filtering capabilities
- Create bulk operations interface

**Specific Deliverables**:
```typescript
// File: /frontend/src/pages/LocationsPage.tsx
export const LocationsPage: React.FC = () => {
  const { projectId, datasetId } = useHierarchy()
  const locations = useLocations(datasetId)
  const clusters = useLocationClusters(datasetId)
  
  // State management for view mode, selection, filters
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'grid'>('map')
  const [selectedLocationIds, setSelectedLocationIds] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<LocationFilters>({})
  
  return (
    <div className="locations-page">
      <LocationsHeader />
      <div className="locations-content">
        <LocationsSidebar />
        <LocationsMainView />
      </div>
    </div>
  )
}

// File: /frontend/src/components/locations/LocationsHeader.tsx
export const LocationsHeader: React.FC = () => {
  // Breadcrumbs, search, view toggle, bulk actions
}

// File: /frontend/src/components/locations/LocationsSidebar.tsx
export const LocationsSidebar: React.FC = () => {
  // Filters, cluster management, analytics
}

// File: /frontend/src/components/locations/LocationsMainView.tsx
export const LocationsMainView: React.FC = () => {
  // Map view, list view, grid view switching
}
```

**Acceptance Criteria**:
- [ ] Page loads with proper hierarchical navigation (Projects > Datasets > Locations)
- [ ] Map and list/grid views are synchronized for selection
- [ ] Advanced search works across name, address, type, coordinates
- [ ] Filtering works by type, quality score, usage, clusters
- [ ] Bulk selection and operations interface is intuitive
- [ ] Real-time updates work when multiple users edit
- [ ] Mobile responsive design works on all screen sizes

**Dependencies**: 
- Map components from Task 2.2
- Location hooks from existing system
- Bulk operations components (Task 3.2)

**Files to Create**:
- `/frontend/src/pages/LocationsPage.tsx`
- `/frontend/src/components/locations/LocationsHeader.tsx`
- `/frontend/src/components/locations/LocationsSidebar.tsx`
- `/frontend/src/components/locations/LocationsMainView.tsx`
- `/frontend/src/components/locations/LocationSearch.tsx`
- `/frontend/src/components/locations/LocationFilters.tsx`

---

### Task 3.2: Location Management Components
**Assignable to**: React/UI Specialist Agent  
**Duration**: 3 hours  
**Priority**: High  

**Objective**: Build comprehensive location management UI components

**Scope**:
- Create location display and editing components
- Implement location creation and deletion workflows
- Add bulk editing capabilities
- Build import/export interfaces

**Specific Deliverables**:
```typescript
// File: /frontend/src/components/locations/LocationCard.tsx
interface LocationCardProps {
  location: Location
  isSelected?: boolean
  onSelect?: () => void
  onEdit?: () => void
  onDelete?: () => void
  showUsageMetrics?: boolean
}

export const LocationCard: React.FC<LocationCardProps> = (props) => {
  // Rich location display with:
  // - Location name, address, coordinates
  // - Usage metrics and quality score
  // - Quick actions (edit, delete, view on map)
  // - Cluster membership indicator
}

// File: /frontend/src/components/locations/LocationForm.tsx
interface LocationFormProps {
  location?: Partial<Location>
  onSave: (location: LocationData) => Promise<void>
  onCancel: () => void
  mode: 'create' | 'edit'
}

export const LocationForm: React.FC<LocationFormProps> = (props) => {
  // Comprehensive form with:
  // - Name and address fields with validation
  // - Integrated geocoding with address search
  // - Coordinate picker with map integration
  // - Location type and operational data
  // - Quality score display
}

// File: /frontend/src/components/locations/LocationDeleteModal.tsx
interface LocationDeleteModalProps {
  location: Location
  onConfirm: () => Promise<void>
  onCancel: () => void
  isOpen: boolean
}

export const LocationDeleteModal: React.FC<LocationDeleteModalProps> = (props) => {
  // Deletion confirmation with:
  // - Impact analysis (which entities use this location)
  // - Cascade warnings
  // - Alternative suggestions
  // - Force delete option for admins
}
```

**Acceptance Criteria**:
- [ ] LocationCard displays comprehensive location information with metrics
- [ ] LocationForm integrates geocoding for seamless address entry
- [ ] LocationDeleteModal shows impact analysis before deletion
- [ ] BulkEditModal enables efficient multi-location editing
- [ ] All forms include proper validation and error handling
- [ ] Components work with real-time updates from Convex

**Dependencies**: 
- Geocoding service from Task 2.1
- Map components for coordinate picking
- Location analytics from Task 1.3

**Files to Create**:
- `/frontend/src/components/locations/LocationCard.tsx`
- `/frontend/src/components/locations/LocationForm.tsx`
- `/frontend/src/components/locations/LocationDeleteModal.tsx`
- `/frontend/src/components/locations/BulkEditModal.tsx`
- `/frontend/src/components/locations/LocationImportWizard.tsx`

---

### Task 3.3: Advanced Location Features
**Assignable to**: React/UI Specialist Agent  
**Duration**: 2 hours  
**Priority**: Medium  

**Objective**: Implement advanced location management features and analytics

**Scope**:
- Add location quality scoring and validation UI
- Implement location templates and favorites
- Create location analytics dashboard
- Add location comparison tools

**Specific Deliverables**:
```typescript
// File: /frontend/src/components/locations/LocationAnalytics.tsx
export const LocationAnalytics: React.FC = () => {
  // Analytics dashboard with:
  // - Usage patterns and trends
  // - Quality score distribution
  // - Geographic coverage analysis
  // - Performance metrics
  // - Optimization recommendations
}

// File: /frontend/src/components/locations/LocationQualityScore.tsx
interface LocationQualityScoreProps {
  location: Location
  showDetails?: boolean
  allowReGeocoding?: boolean
}

export const LocationQualityScore: React.FC<LocationQualityScoreProps> = (props) => {
  // Quality score display with:
  // - Visual quality indicator (color-coded)
  // - Quality breakdown (source, confidence, accuracy)
  // - Re-geocoding action if quality is low
  // - Manual coordinate override option
}

// File: /frontend/src/components/locations/LocationTemplates.tsx
export const LocationTemplates: React.FC = () => {
  // Template management for:
  // - Common location types (depot, warehouse, customer)
  // - Pre-filled forms with default values
  // - Template sharing across projects
  // - Quick location creation from templates
}
```

**Acceptance Criteria**:
- [ ] Analytics provide meaningful insights into location usage
- [ ] Quality scoring is visually clear and actionable
- [ ] Templates accelerate location creation for common types
- [ ] Comparison tools help optimize location selection
- [ ] All features integrate seamlessly with existing workflows

**Dependencies**: 
- Analytics backend from Task 1.3
- Quality scoring from geocoding service

**Files to Create**:
- `/frontend/src/components/locations/LocationAnalytics.tsx`
- `/frontend/src/components/locations/LocationQualityScore.tsx`
- `/frontend/src/components/locations/LocationTemplates.tsx`
- `/frontend/src/components/locations/LocationComparison.tsx`

---

## Phase 4: Integration & Enhancement (4 hours)

### Task 4.1: TableEditor Enhancement for Location Master
**Assignable to**: React Integration Specialist Agent  
**Duration**: 2 hours  
**Priority**: Critical Path  

**Objective**: Enhance TableEditor to enforce location master references and improve UX

**Scope**:
- Modify vehicle, job, and shipment table editing to require location IDs
- Add location selection components for table cells
- Implement location validation on data entry
- Create location quick-create workflow from tables

**Specific Deliverables**:
```typescript
// File: /frontend/src/components/table-editor/LocationCellEditor.tsx
interface LocationCellEditorProps {
  value: Id<'locations'> | null
  onChange: (locationId: Id<'locations'>) => void
  projectId: Id<'projects'>
  allowCreate?: boolean
}

export const LocationCellEditor: React.FC<LocationCellEditorProps> = (props) => {
  // Custom cell editor for location fields with:
  // - Searchable dropdown of existing locations
  // - Map-based location picker
  // - Quick create new location option
  // - Location validation and quality display
}

// Enhanced TableEditor schema for location fields
const getEnhancedTableSchema = (tableType: string) => {
  switch (tableType) {
    case 'vehicles':
      return {
        columns: [
          {
            key: 'startLocationId',
            label: 'Start Location',
            type: 'location',
            required: true,
            editor: LocationCellEditor
          },
          {
            key: 'endLocationId', 
            label: 'End Location',
            type: 'location',
            required: true,
            editor: LocationCellEditor
          },
          // ... other columns
        ]
      }
    // Similar for jobs and shipments
  }
}
```

**Acceptance Criteria**:
- [ ] Vehicle table requires location IDs for start/end positions
- [ ] Job table requires location ID for service location
- [ ] Shipment table requires pickup and delivery location IDs
- [ ] Location cell editor provides intuitive selection experience
- [ ] Quick create workflow allows location creation without leaving table
- [ ] Validation prevents invalid location references
- [ ] Coordinate fields are read-only (show resolved coordinates from location)

**Dependencies**: 
- Existing TableEditor component
- Location selection components from Task 3.2
- Location validation from Task 1.1

**Files to Modify**:
- `/frontend/src/components/table-editor/TableEditor.tsx`

**Files to Create**:
- `/frontend/src/components/table-editor/LocationCellEditor.tsx`
- `/frontend/src/components/table-editor/QuickCreateLocation.tsx`

---

### Task 4.2: Import/Export Enhancement for Location Master
**Assignable to**: Data Processing Specialist Agent  
**Duration**: 2 hours  
**Priority**: High  

**Objective**: Enhance CSV import/export to handle location master requirements

**Scope**:
- Update import process to enforce location master references
- Add location creation workflow for missing locations during import
- Enhance export to include location usage data
- Create location-aware CSV templates

**Specific Deliverables**:
```typescript
// File: /frontend/src/components/table-editor/bulk-operations/import/LocationAwareImport.tsx
export const LocationAwareImport: React.FC = () => {
  // Enhanced import workflow:
  // 1. Parse CSV and identify location references
  // 2. Match existing locations by name/coordinates
  // 3. Show missing locations for creation
  // 4. Batch geocode new addresses
  // 5. Allow manual review and adjustment
  // 6. Import with proper location references
}

// File: /frontend/src/utils/locationImportUtils.ts
export class LocationImportProcessor {
  async processImportData(data: any[], tableType: string): Promise<ImportProcessingResult> {
    // Process import data with location validation:
    // - Extract location data from vehicles/jobs/shipments
    // - Match existing locations
    // - Prepare new locations for creation
    // - Generate location reference mapping
  }
  
  async createMissingLocations(locations: LocationData[]): Promise<Id<'locations'>[]> {
    // Batch create missing locations with geocoding
  }
}

// Enhanced CSV templates with location guidance
export const generateLocationAwareTemplate = (tableType: string) => {
  // Generate CSV templates that include:
  // - Location ID columns
  // - Example location data
  // - Import instructions
  // - Format specifications
}
```

**Acceptance Criteria**:
- [ ] Import process validates all location references before importing
- [ ] Missing locations can be created during import with geocoding
- [ ] Location matching works by name fuzzy matching and coordinate proximity
- [ ] Export includes location usage analytics and quality scores
- [ ] CSV templates guide users on location master requirements
- [ ] Batch operations handle large datasets efficiently (1000+ locations)

**Dependencies**: 
- Geocoding service from Task 2.1
- Location validation from Task 1.1
- Existing import/export infrastructure

**Files to Modify**:
- `/frontend/src/components/table-editor/bulk-operations/import/CSVImportModal.tsx`
- `/frontend/src/components/table-editor/bulk-operations/export/CSVExportModal.tsx`

**Files to Create**:
- `/frontend/src/components/table-editor/bulk-operations/import/LocationAwareImport.tsx`
- `/frontend/src/utils/locationImportUtils.ts`
- `/frontend/src/components/table-editor/bulk-operations/shared/LocationMatcher.tsx`

---

## Phase 5: Real-time Integration & Polish (3 hours)

### Task 5.1: Real-time Map Updates Implementation
**Assignable to**: Real-time Systems Specialist Agent  
**Duration**: 1.5 hours  
**Priority**: Medium  

**Objective**: Implement real-time map updates using Convex subscriptions

**Scope**:
- Add real-time location updates to all map components
- Implement optimistic updates for smooth UX
- Add conflict resolution for concurrent edits
- Optimize performance for large datasets

**Specific Deliverables**:
```typescript
// File: /frontend/src/hooks/useRealTimeLocations.ts
export const useRealTimeLocations = (datasetId: Id<'datasets'>) => {
  const locations = useQuery(api.locations.listByDataset, { datasetId })
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, Location>>(new Map())
  
  const updateLocationOptimistically = useCallback((locationId: string, changes: Partial<Location>) => {
    // Apply optimistic update immediately
    // Queue mutation for server sync
    // Handle conflict resolution
  }, [])
  
  return {
    locations: mergeOptimisticUpdates(locations, optimisticUpdates),
    updateLocationOptimistically,
    isLoading: locations === undefined
  }
}

// File: /frontend/src/utils/conflictResolution.ts
export class LocationConflictResolver {
  resolveConflict(localChanges: Partial<Location>, serverChanges: Partial<Location>): Location {
    // Implement conflict resolution strategies:
    // - Last-write-wins for simple fields
    // - Merge strategies for complex fields
    // - User notification for significant conflicts
  }
}
```

**Acceptance Criteria**:
- [ ] Map updates in real-time when locations are added/modified/deleted
- [ ] Optimistic updates provide immediate feedback
- [ ] Conflict resolution handles concurrent edits gracefully
- [ ] Performance remains smooth with 1000+ locations
- [ ] User indicators show when others are editing locations
- [ ] Network issues are handled with appropriate fallbacks

**Dependencies**: 
- Convex real-time subscriptions
- Map components from Task 2.2
- Location management components from Task 3.2

**Files to Create**:
- `/frontend/src/hooks/useRealTimeLocations.ts`
- `/frontend/src/hooks/useLocationPresence.ts`
- `/frontend/src/utils/conflictResolution.ts`
- `/frontend/src/utils/optimisticUpdates.ts`

---

### Task 5.2: Testing, Documentation & UAT Scenarios
**Assignable to**: QA/Documentation Specialist Agent  
**Duration**: 1.5 hours  
**Priority**: Low  

**Objective**: Create comprehensive testing and documentation for location workflows

**Scope**:
- Create UAT scenarios for location management workflows
- Write comprehensive user documentation
- Add performance testing for large datasets
- Create developer documentation for location APIs

**Specific Deliverables**:
```typescript
// File: /uat/scenarios/master-locations.cjs
module.exports = {
  name: 'Master Locations Management',
  description: 'Test comprehensive location management workflows',
  
  scenarios: [
    {
      name: 'location-crud',
      description: 'Create, read, update, delete locations with geocoding',
      steps: [
        // Comprehensive location CRUD testing
      ]
    },
    {
      name: 'location-clustering',
      description: 'Test automatic and manual location clustering',
      steps: [
        // Clustering workflow testing
      ]
    },
    {
      name: 'location-import',
      description: 'Test CSV import with location master enforcement',
      steps: [
        // Import workflow testing
      ]
    }
  ]
}

// Performance testing scripts
// File: /docs/performance/location-performance-tests.md
```

**Acceptance Criteria**:
- [ ] UAT scenarios cover all major location workflows
- [ ] User documentation is comprehensive and beginner-friendly
- [ ] Developer documentation covers all APIs and integration patterns
- [ ] Performance tests validate scalability targets
- [ ] All documentation is up-to-date and accurate

**Dependencies**: 
- Completed location system implementation
- Existing UAT framework

**Files to Create**:
- `/uat/scenarios/master-locations.cjs`
- `/docs/user-guides/location-management-guide.md`
- `/docs/developer/location-api-reference.md`
- `/docs/performance/location-performance-tests.md`

---

## Coordination & Dependencies

### Cross-Task Dependencies
1. **Geocoding Service** (Task 2.1) → **Map Components** (Task 2.2) → **Location Form** (Task 3.2)
2. **Location Validation** (Task 1.1) → **TableEditor Enhancement** (Task 4.1)
3. **Cluster Management** (Task 1.2) → **Cluster Map** (Task 2.2) → **Locations Page** (Task 3.1)
4. **All Backend Tasks** → **Frontend Components** → **Real-time Integration** (Task 5.1)

### Parallel Execution Strategy
- **Phase 1 & 2** can run in parallel (backend and Mapbox integration)
- **Task 2.1 & 2.2** can start after basic location validation is complete
- **Phase 3** requires completion of Phase 2 map components
- **Phase 4** can start once core UI is functional
- **Phase 5** integrates all previous work

### Communication Protocols
- **Daily Standups**: Coordinate cross-task dependencies
- **Shared Types**: Maintain consistent TypeScript interfaces across tasks
- **Testing Strategy**: Each task includes unit tests, integration testing in Phase 5
- **Code Reviews**: Cross-review between related tasks (backend/frontend pairs)

## Success Metrics

### Technical Metrics
- [ ] All location operations complete within performance targets
- [ ] Real-time updates propagate within 200ms
- [ ] System handles 50,000+ locations without degradation
- [ ] Geocoding accuracy > 95% for formatted addresses
- [ ] Import/export processes handle 10,000+ locations efficiently

### User Experience Metrics
- [ ] Location setup time reduced by 60% vs manual coordinate entry
- [ ] User adoption of map interface > 80%
- [ ] Location data quality (geocoding score > 0.7) for 95% of locations
- [ ] User satisfaction rating > 4.5/5 for location management interface

### Business Impact Metrics
- [ ] 90% of new entities use location master references
- [ ] 90% reduction in duplicate location records
- [ ] 15-25% improvement in route optimization accuracy
- [ ] 40% faster VRP problem setup time

## Risk Mitigation

### Technical Risks
- **Mapbox API Limits**: Implement comprehensive caching and rate limiting
- **Real-time Performance**: Use Convex best practices and proper indexing
- **Mobile Performance**: Optimize bundle size and implement lazy loading
- **Data Migration**: Implement gradual migration with rollback capability

### Delivery Risks
- **Task Dependencies**: Build buffer time into critical path tasks
- **Integration Complexity**: Start integration testing early and often
- **Scope Creep**: Maintain strict focus on core requirements
- **Quality Assurance**: Implement continuous testing throughout development

---

**Implementation Status Tracking**:
- [ ] Phase 1: Backend Foundation (4 hours)
- [ ] Phase 2: Mapbox Integration (6 hours)  
- [ ] Phase 3: Master Locations UI (8 hours)
- [ ] Phase 4: Integration & Enhancement (4 hours)
- [ ] Phase 5: Real-time Integration & Polish (3 hours)

**Total Estimated Effort**: 25 hours across 5 phases with parallel execution capability