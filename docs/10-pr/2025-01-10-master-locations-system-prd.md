# Master Locations System - Product Requirements Document

**Version**: 1.0  
**Date**: January 10, 2025  
**Author**: VRP System v4 Development Team  
**Status**: Approved for Implementation  

## Executive Summary

The Master Locations System transforms the VRP System v4 into a location-centric platform where all geographic data is centrally managed, validated, and visualized. This system establishes locations as the single source of truth for all VRP entities (vehicles, jobs, shipments) while providing enterprise-grade geocoding capabilities and real-time map visualization.

### Business Value
- **Data Governance**: Centralized location management eliminates data inconsistencies and duplication
- **Operational Excellence**: Visual location management improves route planning accuracy by 15-25%
- **Scalability**: Enterprise-ready geocoding supports global VRP operations
- **User Experience**: Interactive map interface reduces location setup time by 60%

## Problem Statement

### Current Challenges
1. **Data Fragmentation**: Location data scattered across vehicles, jobs, and shipments tables
2. **Manual Coordinate Entry**: No automated address-to-coordinate conversion
3. **Limited Visualization**: Table-only interface lacks spatial context
4. **Data Quality Issues**: Inconsistent location data quality and validation
5. **Poor User Experience**: Complex location setup for non-technical users

### Business Impact
- **Increased Errors**: Manual coordinate entry leads to 8-12% routing inaccuracies
- **Time Waste**: Location setup takes 3-5 minutes per location manually
- **Poor Adoption**: Non-technical users struggle with coordinate-based systems
- **Optimization Failures**: Inconsistent location data reduces VRP solution quality

## Solution Overview

### Vision Statement
Create a comprehensive Master Locations System that serves as the geographic foundation for all VRP operations, featuring automated geocoding, visual location management, and real-time collaborative editing.

### Key Capabilities
1. **Centralized Location Master**: Single source of truth for all geographic data
2. **Enterprise Geocoding**: Automated address-to-coordinate conversion with Mapbox
3. **Interactive Map Interface**: Visual location management and route visualization
4. **Real-time Collaboration**: Multi-user location editing with live updates
5. **Advanced Analytics**: Location usage metrics and optimization insights

## Detailed Requirements

### 1. Master Locations Data Architecture

#### 1.1 Location Master Table Enhancement
**Requirement**: Establish locations table as the authoritative source for all geographic data

**Acceptance Criteria**:
- ✅ All vehicle start/end positions reference master locations via `locationId`
- ✅ All job locations reference master locations via `locationId`
- ✅ All shipment pickup/delivery locations reference master locations via `locationId`
- ✅ Coordinate fields in dependent tables are deprecated (read-only for migration)
- ✅ Location creation is mandatory before referencing in other entities

**Technical Specifications**:
```typescript
// Enhanced location schema
interface LocationMaster {
  _id: Id<'locations'>
  projectId: Id<'projects'>
  name: string // Required, unique within project
  
  // Geographic data (required)
  locationLat: number // -90 to 90
  locationLon: number // -180 to 180
  address?: string // Full formatted address
  
  // Geocoding metadata
  geocodeQuality?: 'exact' | 'interpolated' | 'approximate' | 'manual'
  geocodeSource?: 'mapbox' | 'manual' | 'import'
  geocodeTimestamp?: number
  
  // Operational data
  locationType: 'depot' | 'customer' | 'warehouse' | 'distribution_center' | 'pickup_point' | 'delivery_point'
  operatingHours?: string
  contactInfo?: string
  timezone?: string
  
  // Usage analytics
  usageCount?: number
  lastUsedAt?: number
  
  // Clustering
  clusterId?: Id<'locationClusters'>
  
  // Audit trail
  updatedAt: number
  _creationTime: number // Auto-managed by Convex
}
```

#### 1.2 Referential Integrity Enforcement
**Requirement**: Enforce strict referential integrity between locations and dependent entities

**Acceptance Criteria**:
- ✅ Vehicle creation fails if `startLocationId` or `endLocationId` reference non-existent locations
- ✅ Job creation fails if `locationId` references non-existent location
- ✅ Shipment creation fails if pickup/delivery location IDs are invalid
- ✅ Location deletion is blocked if referenced by vehicles, jobs, or shipments
- ✅ Cascade deletion warnings show impact analysis before location removal

**Technical Implementation**:
- Pre-mutation validation in Convex functions
- Database constraints through schema relationships
- Client-side validation for immediate feedback

### 2. Enterprise Geocoding Integration

#### 2.1 Mapbox Geocoding Service
**Requirement**: Integrate Mapbox Geocoding API for automated address-to-coordinate conversion

**Acceptance Criteria**:
- ✅ Forward geocoding: Address → Coordinates with confidence scores
- ✅ Reverse geocoding: Coordinates → Address with formatted output
- ✅ Batch geocoding: Process up to 1,000 addresses in single operation
- ✅ Rate limiting: Respect Mapbox API limits (2,500 requests/minute)
- ✅ Error handling: Graceful fallback for geocoding failures
- ✅ Caching: Store geocoding results to minimize API calls

**Technical Specifications**:
```typescript
interface GeocodingService {
  // Forward geocoding
  geocodeAddress(address: string): Promise<GeocodingResult>
  
  // Reverse geocoding
  reverseGeocode(lat: number, lon: number): Promise<AddressResult>
  
  // Batch operations
  batchGeocode(addresses: string[]): Promise<GeocodingResult[]>
  
  // Validation
  validateCoordinates(lat: number, lon: number): boolean
}

interface GeocodingResult {
  coordinates: [number, number] // [longitude, latitude]
  address: string
  confidence: 'exact' | 'interpolated' | 'approximate'
  components: {
    street?: string
    city?: string
    state?: string
    country?: string
    postalCode?: string
  }
}
```

#### 2.2 Geocoding Quality Management
**Requirement**: Implement geocoding quality scoring and validation

**Acceptance Criteria**:
- ✅ Quality scores: Exact (1.0), Interpolated (0.8), Approximate (0.6), Manual (0.4)
- ✅ Confidence thresholds: Warn users when geocoding confidence < 0.7
- ✅ Manual override: Allow users to manually adjust coordinates with quality downgrade
- ✅ Re-geocoding: Provide option to re-geocode low-quality locations
- ✅ Quality reporting: Dashboard showing location quality distribution

### 3. Interactive Map Interface

#### 3.1 Core Map Components
**Requirement**: Create reusable map components for location visualization and management

**Acceptance Criteria**:
- ✅ `LocationMap`: Display all locations with clustering and filtering
- ✅ `LocationPicker`: Interactive coordinate selection with address search
- ✅ `ClusterMap`: Visualize location clusters with management tools
- ✅ `RouteMap`: Show vehicle routes connecting locations
- ✅ Real-time updates: Live location changes via Convex subscriptions

**Technical Specifications**:
```typescript
// Core map component props
interface LocationMapProps {
  locations: Location[]
  selectedLocationId?: Id<'locations'>
  onLocationSelect?: (locationId: Id<'locations'>) => void
  onLocationCreate?: (coordinates: [number, number]) => void
  showClusters?: boolean
  showRoutes?: boolean
  interactive?: boolean
}

// Map clustering configuration
interface ClusterConfig {
  radius: number // Clustering radius in pixels
  maxZoom: number // Max zoom for clustering
  minPoints: number // Minimum points to form cluster
  algorithm: 'kmeans' | 'dbscan' | 'geographic'
}
```

#### 3.2 Map Interaction Features
**Requirement**: Provide intuitive map interactions for location management

**Acceptance Criteria**:
- ✅ Click to select locations with popup details
- ✅ Right-click to create new locations
- ✅ Drag to move location coordinates (with confirmation)
- ✅ Zoom-based clustering with smooth transitions
- ✅ Search and filter locations on map
- ✅ Measure distances between locations
- ✅ Mobile-responsive touch interactions

### 4. Master Locations Management UI

#### 4.1 Locations Page Architecture
**Requirement**: Create dedicated master locations management interface

**Acceptance Criteria**:
- ✅ Hierarchical navigation: Projects → Datasets → Locations
- ✅ Dual view: Map view and list/grid view with synchronized selection
- ✅ Advanced search: Text, address, coordinates, type, usage patterns
- ✅ Multi-level filtering: By type, quality, usage, clusters
- ✅ Bulk operations: Edit, delete, geocode, cluster management
- ✅ Real-time collaboration: Live updates when multiple users edit

**UI/UX Requirements**:
```typescript
// Page layout structure
interface LocationsPageLayout {
  header: {
    breadcrumbs: BreadcrumbTrail
    searchBar: GlobalLocationSearch
    viewToggle: 'map' | 'list' | 'grid'
    bulkActions: BulkActionToolbar
  }
  
  sidebar: {
    filters: LocationFilters
    clusters: ClusterManagement
    analytics: LocationMetrics
  }
  
  main: {
    mapView: LocationMap
    listView: LocationDataTable
    gridView: LocationCardGrid
  }
}
```

#### 4.2 Location Management Components
**Requirement**: Build comprehensive location management UI components

**Acceptance Criteria**:
- ✅ `LocationCard`: Rich location display with usage metrics and quick actions
- ✅ `LocationForm`: Create/edit form with integrated geocoding and validation
- ✅ `LocationDeleteModal`: Cascade impact analysis and confirmation
- ✅ `BulkEditModal`: Multi-location editing with batch operations
- ✅ `LocationImportWizard`: CSV import with geocoding and validation
- ✅ `LocationAnalytics`: Usage patterns and performance metrics

### 5. Location Clustering System

#### 5.1 Automatic Clustering
**Requirement**: Implement intelligent location clustering for optimization and visualization

**Acceptance Criteria**:
- ✅ Geographic clustering: Group nearby locations (configurable radius)
- ✅ Semantic clustering: Group by type, customer, or operational patterns
- ✅ Dynamic clustering: Auto-adjust clusters based on zoom level
- ✅ Manual clustering: Allow users to create and manage custom clusters
- ✅ Cluster analytics: Show cluster performance metrics and optimization suggestions

**Technical Implementation**:
```typescript
interface LocationCluster {
  _id: Id<'locationClusters'>
  projectId: Id<'projects'>
  name: string
  description?: string
  
  // Geographic properties
  centerLat: number
  centerLon: number
  radius: number // Meters
  boundingBox: {
    north: number
    south: number
    east: number
    west: number
  }
  
  // Cluster metadata
  algorithm: 'manual' | 'kmeans' | 'dbscan' | 'geographic'
  memberCount: number
  avgDistance: number
  
  // Visual properties
  color: string
  icon?: string
  
  // Performance metrics
  routeEfficiency?: number
  avgTravelTime?: number
  
  updatedAt: number
}
```

#### 5.2 Cluster Management
**Requirement**: Provide tools for cluster creation, modification, and optimization

**Acceptance Criteria**:
- ✅ Visual cluster creation: Draw clusters on map
- ✅ Cluster editing: Drag to resize, rename, change colors
- ✅ Member management: Add/remove locations from clusters
- ✅ Cluster optimization: Suggest optimal cluster configurations
- ✅ Performance analysis: Compare cluster configurations for efficiency

### 6. Data Import/Export Enhancement

#### 6.1 Location-Centric Import Process
**Requirement**: Enhance CSV import to enforce location master requirements

**Acceptance Criteria**:
- ✅ Location validation: Check for existing locations by name/coordinates
- ✅ Auto-geocoding: Automatically geocode addresses during import
- ✅ Duplicate detection: Identify and merge similar locations
- ✅ Validation reporting: Show geocoding results and quality scores
- ✅ Import templates: Provide location-aware CSV templates
- ✅ Batch processing: Handle large imports (10,000+ locations) efficiently

**Import Workflow**:
1. Upload CSV with location data
2. Auto-detect existing locations by name/coordinates (fuzzy matching)
3. Geocode new addresses using Mapbox API
4. Show preview with geocoding results and quality scores
5. Allow manual review and adjustment
6. Bulk create locations and link to imported entities

#### 6.2 Enhanced Export Capabilities
**Requirement**: Provide comprehensive location data export with usage analytics

**Acceptance Criteria**:
- ✅ Location master export: Full location data with metadata
- ✅ Usage analytics export: Location usage patterns and metrics
- ✅ Relationship export: Show which entities use each location
- ✅ Quality report export: Geocoding quality and validation results
- ✅ Custom field selection: Choose specific fields for export
- ✅ Multiple formats: CSV, Excel, GeoJSON for GIS integration

### 7. Real-time Collaboration Features

#### 7.1 Live Location Updates
**Requirement**: Enable real-time collaboration for location management

**Acceptance Criteria**:
- ✅ Live editing: Multiple users can edit locations simultaneously
- ✅ Conflict resolution: Handle concurrent edits with merge strategies
- ✅ Visual indicators: Show which locations are being edited by others
- ✅ Change notifications: Real-time alerts for location modifications
- ✅ Edit history: Track all location changes with timestamps and users
- ✅ Optimistic updates: Immediate UI updates with server reconciliation

**Technical Implementation**:
- Convex real-time subscriptions for live updates
- Optimistic updates with conflict resolution
- WebSocket connections for instant synchronization
- User presence indicators on map and list views

### 8. Performance Requirements

#### 8.1 Scalability Targets
**Requirement**: Support enterprise-scale location management

**Performance Targets**:
- ✅ **Location Count**: Support 50,000+ locations per project
- ✅ **Map Rendering**: Render 10,000+ locations with clustering in <2 seconds
- ✅ **Search Performance**: Location search results in <300ms
- ✅ **Geocoding Speed**: Batch geocode 1,000 addresses in <30 seconds
- ✅ **Real-time Updates**: Location changes propagate in <200ms
- ✅ **Import Performance**: Import 10,000 locations in <5 minutes

#### 8.2 User Experience Targets
**Requirement**: Ensure smooth user experience across all location operations

**UX Targets**:
- ✅ **Page Load Time**: Locations page loads in <2 seconds
- ✅ **Map Interactions**: Pan/zoom responds in <100ms
- ✅ **Search Responsiveness**: Instant search results as user types
- ✅ **Mobile Performance**: Full functionality on mobile devices
- ✅ **Offline Capability**: Basic viewing when connection is poor

## Technical Architecture

### 8.1 Convex Integration Patterns
**Best Practices Implementation**:

```typescript
// Reactive location queries
export const useLocations = (datasetId: Id<'datasets'>) => {
  const locations = useQuery(api.locations.listByDataset, { datasetId })
  
  // Real-time clustering updates
  const clusters = useQuery(api.locationClusters.listByDataset, { datasetId })
  
  // Usage analytics
  const analytics = useQuery(api.locations.getUsageAnalytics, { datasetId })
  
  return { locations, clusters, analytics }
}

// Transactional location operations
export const createLocationWithValidation = mutation({
  args: {
    name: v.string(),
    address: v.optional(v.string()),
    coordinates: v.optional(v.array(v.number())),
    // ... other fields
  },
  handler: async (ctx, args) => {
    // 1. Validate project ownership
    // 2. Check for duplicate locations
    // 3. Geocode address if needed
    // 4. Create location with quality score
    // 5. Update usage analytics
  }
})
```

### 8.2 Mapbox Integration Architecture
**Component Structure**:

```typescript
// Map component hierarchy
<LocationsPage>
  <LocationMap>
    <MapboxGLWrapper>
      <LocationMarkers />
      <LocationClusters />
      <RouteLines />
    </MapboxGLWrapper>
    <MapControls>
      <SearchBox />
      <LayerToggle />
      <ZoomControls />
    </MapControls>
  </LocationMap>
  <LocationSidebar>
    <LocationFilters />
    <LocationList />
  </LocationSidebar>
</LocationsPage>
```

### 8.3 State Management Strategy
**Zustand + Convex Pattern**:

```typescript
// Location state management
interface LocationStore {
  // UI state
  selectedLocationId: Id<'locations'> | null
  mapViewport: MapViewport
  activeFilters: LocationFilters
  
  // Bulk operations
  selectedLocationIds: Set<Id<'locations'>>
  bulkOperationMode: 'edit' | 'delete' | 'cluster' | null
  
  // Actions
  selectLocation: (id: Id<'locations'>) => void
  toggleLocationSelection: (id: Id<'locations'>) => void
  clearSelection: () => void
  setMapViewport: (viewport: MapViewport) => void
}
```

## Security & Compliance

### 9.1 Data Privacy
**Requirements**:
- ✅ Location data encryption at rest and in transit
- ✅ User access controls for location viewing and editing
- ✅ Audit trail for all location modifications
- ✅ GDPR compliance for location data handling
- ✅ Role-based permissions for location management

### 9.2 API Security
**Requirements**:
- ✅ Mapbox API key rotation and environment-based configuration
- ✅ Rate limiting to prevent API abuse
- ✅ Input validation and sanitization for all location data
- ✅ SQL injection prevention in location queries
- ✅ Cross-site scripting (XSS) protection in location forms

## Success Metrics

### 10.1 Adoption Metrics
- **Location Usage**: 90% of new entities use location master references
- **User Adoption**: 80% of users prefer map interface over table interface
- **Data Quality**: 95% of locations have geocoding quality > 0.7
- **Time Savings**: 60% reduction in location setup time

### 10.2 Technical Metrics
- **Performance**: All operations meet performance targets
- **Reliability**: 99.9% uptime for location services
- **Accuracy**: Geocoding accuracy > 95% for formatted addresses
- **Scalability**: Handle 50,000+ locations without performance degradation

### 10.3 Business Impact
- **Route Optimization**: 15-25% improvement in route efficiency
- **Data Consistency**: 90% reduction in duplicate location records
- **User Satisfaction**: >4.5/5 rating for location management interface
- **Operational Efficiency**: 40% faster VRP problem setup time

## Implementation Timeline

### Phase 1: Foundation (Week 1)
- Backend location validation enhancement
- Location cluster management system
- Basic geocoding integration

### Phase 2: Core Features (Week 2-3)
- Mapbox integration and map components
- Master locations page and management UI
- Import/export enhancement

### Phase 3: Advanced Features (Week 4)
- Real-time collaboration features
- Advanced analytics and clustering
- Performance optimization

### Phase 4: Polish & Launch (Week 5)
- Testing and quality assurance
- Documentation and training materials
- Production deployment and monitoring

## Risks & Mitigation

### 10.1 Technical Risks
- **Mapbox API Limits**: Implement caching and rate limiting
- **Performance with Large Datasets**: Use virtualization and clustering
- **Real-time Sync Complexity**: Leverage Convex built-in features
- **Mobile Performance**: Optimize bundle size and lazy loading

### 10.2 Business Risks
- **User Adoption**: Provide comprehensive training and migration support
- **Data Migration**: Implement gradual migration with rollback capability
- **Cost Escalation**: Monitor Mapbox usage and implement cost controls

## Conclusion

The Master Locations System represents a transformative enhancement to the VRP System v4, establishing location data as a first-class citizen with enterprise-grade management capabilities. By leveraging Convex's reactive architecture and Mapbox's geocoding excellence, this system will provide the foundation for accurate, efficient, and scalable vehicle routing optimization.

The implementation plan prioritizes user experience, data quality, and system performance while maintaining the flexibility to evolve with changing business requirements. Success will be measured not only by technical metrics but by the tangible improvement in operational efficiency and user satisfaction.

---

**Document Approval**:
- [ ] Product Owner: ___________________ Date: ___________
- [ ] Technical Lead: __________________ Date: ___________
- [ ] UI/UX Lead: ____________________ Date: ___________
- [ ] DevOps Lead: ___________________ Date: ___________