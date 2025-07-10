# Master Locations System - Developer Integration Guide

**Version**: 1.0  
**Date**: July 10, 2025  
**Audience**: Developers, Technical Teams  

## Overview

This guide provides technical documentation for integrating with the Master Locations System, including API usage, component integration, and best practices for developers working with location features.

## Architecture Overview

The Master Locations System follows a three-tier architecture:

```
Frontend (React)     ←→     Backend (Convex)     ←→     External APIs
├─ Location Components      ├─ Location Functions         ├─ Mapbox Geocoding
├─ Map Integration          ├─ Validation Schema          ├─ Geographic Services
├─ Bulk Operations          ├─ Real-time Queries          └─ Third-party APIs
└─ State Management         └─ Database Schema
```

## Quick Start

### 1. Using Location Components

```typescript
import { LocationMap, LocationCard, LocationForm } from '@/components/locations'
import { useLocations } from '@/hooks/useVRPData'

function MyLocationView({ datasetId }: { datasetId: Id<'datasets'> }) {
  const locations = useLocations(datasetId)
  
  return (
    <LocationMap 
      locations={locations || []}
      onLocationSelect={(id) => console.log('Selected:', id)}
      onLocationCreate={(coords) => console.log('Create at:', coords)}
    />
  )
}
```

### 2. Location Data Hooks

```typescript
// Basic location operations
const locations = useLocations(datasetId)
const createLocation = useCreateLocation()
const updateLocation = useUpdateLocation()
const deleteLocation = useDeleteLocation()

// Create new location
await createLocation({
  projectId,
  datasetId,
  name: 'New Warehouse',
  address: '123 Main St, City, State',
  locationType: 'warehouse'
})
```

## API Reference

### Location Schema

```typescript
interface Location {
  _id: Id<'locations'>
  projectId: Id<'projects'>
  datasetId?: Id<'datasets'>
  
  // Required fields
  name: string
  
  // Geographic data
  locationLat?: number
  locationLon?: number
  address?: string
  
  // Metadata
  locationType?: LocationType
  geocodeQuality?: 'exact' | 'interpolated' | 'approximate' | 'manual'
  geocodeSource?: 'mapbox' | 'manual' | 'import'
  
  // Analytics
  usageCount?: number
  lastUsedAt?: number
  
  // Timestamps
  updatedAt: number
  _creationTime: number
}

type LocationType = 
  | 'depot' 
  | 'customer' 
  | 'warehouse' 
  | 'distribution_center' 
  | 'pickup_point' 
  | 'delivery_point'
```

### Convex Functions

#### Queries

```typescript
// List locations by dataset
api.locations.listByDataset({ datasetId: Id<'datasets'> })

// List locations by project
api.locations.listByProject({ projectId: Id<'projects'> })

// Get single location
api.locations.getById({ id: Id<'locations'> })

// Search locations
api.locations.search({ 
  datasetId: Id<'datasets'>, 
  query: string,
  filters?: LocationFilters 
})
```

#### Mutations

```typescript
// Create location
api.locations.create({
  projectId: Id<'projects'>,
  datasetId?: Id<'datasets'>,
  name: string,
  address?: string,
  locationLat?: number,
  locationLon?: number,
  locationType?: LocationType
})

// Update location
api.locations.update({
  id: Id<'locations'>,
  name?: string,
  address?: string,
  locationLat?: number,
  locationLon?: number,
  // ... other fields
})

// Delete location
api.locations.remove({ id: Id<'locations'> })

// Bulk operations
api.locations.bulkImport({ 
  projectId: Id<'projects'>, 
  datasetId: Id<'datasets'>,
  locations: LocationImportData[] 
})
```

## Component Integration

### LocationMap Component

```typescript
interface LocationMapProps {
  locations: Location[]
  selectedLocationId?: Id<'locations'>
  onLocationSelect?: (locationId: Id<'locations'>) => void
  onLocationCreate?: (coordinates: [number, number], address?: string) => void
  viewport?: MapViewport
  onViewportChange?: (viewport: MapViewport) => void
  showClusters?: boolean
  interactive?: boolean
  className?: string
}

// Usage examples
<LocationMap
  locations={locations}
  selectedLocationId={selectedId}
  onLocationSelect={setSelectedId}
  onLocationCreate={(coords, address) => {
    // Handle new location creation
    openCreateModal({ coordinates: coords, address })
  }}
  showClusters={true}
  interactive={true}
/>
```

### LocationForm Component

```typescript
interface LocationFormProps {
  mode: 'create' | 'edit'
  location?: Location
  onSave: (locationData: LocationFormData) => Promise<void>
  onCancel: () => void
  initialCoordinates?: [number, number]
  initialAddress?: string
}

// Usage
<LocationForm
  mode="create"
  initialCoordinates={[37.7749, -122.4194]}
  onSave={async (data) => {
    await createLocation(data)
    toast.success('Location created')
  }}
  onCancel={() => setShowForm(false)}
/>
```

### LocationCard Component

```typescript
interface LocationCardProps {
  location: Location
  isSelected?: boolean
  onSelect?: () => void
  onEdit?: () => void
  onDelete?: () => void
  showUsageMetrics?: boolean
  className?: string
}
```

## Integration Patterns

### 1. Location References in Other Entities

```typescript
// Vehicle with location references
interface Vehicle {
  startLocationId?: Id<'locations'>
  endLocationId?: Id<'locations'>
  // ... other fields
}

// Job with location reference
interface Job {
  locationId?: Id<'locations'>
  // ... other fields
}

// Shipment with pickup/delivery locations
interface Shipment {
  pickupLocationId?: Id<'locations'>
  deliveryLocationId?: Id<'locations'>
  // ... other fields
}
```

### 2. Location Selection Components

```typescript
// Location picker for forms
function LocationPicker({ 
  value, 
  onChange, 
  datasetId 
}: {
  value?: Id<'locations'>
  onChange: (locationId: Id<'locations'>) => void
  datasetId: Id<'datasets'>
}) {
  const locations = useLocations(datasetId)
  
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select location..." />
      </SelectTrigger>
      <SelectContent>
        {locations?.map(location => (
          <SelectItem key={location._id} value={location._id}>
            {location.name} ({location.locationType})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

### 3. Geocoding Integration

```typescript
// Geocoding service integration
import { geocodeAddress, reverseGeocode } from '@/lib/geocoding'

// Forward geocoding
const result = await geocodeAddress('123 Main St, San Francisco, CA')
if (result.success) {
  const { coordinates, quality, address } = result
  // Use geocoded data
}

// Reverse geocoding
const address = await reverseGeocode(37.7749, -122.4194)
```

## State Management

### Location Store Pattern

```typescript
// Zustand store for location state
interface LocationStore {
  // UI state
  selectedLocationId: Id<'locations'> | null
  mapViewport: MapViewport
  activeFilters: LocationFilters
  viewMode: 'map' | 'grid' | 'list'
  
  // Bulk operations
  selectedLocationIds: Set<Id<'locations'>>
  bulkOperationMode: 'edit' | 'delete' | 'cluster' | null
  
  // Actions
  selectLocation: (id: Id<'locations'>) => void
  toggleLocationSelection: (id: Id<'locations'>) => void
  clearSelection: () => void
  setMapViewport: (viewport: MapViewport) => void
  setFilters: (filters: LocationFilters) => void
}

const useLocationStore = create<LocationStore>((set) => ({
  selectedLocationId: null,
  mapViewport: { latitude: 37.7749, longitude: -122.4194, zoom: 10 },
  activeFilters: {},
  viewMode: 'map',
  selectedLocationIds: new Set(),
  bulkOperationMode: null,
  
  selectLocation: (id) => set({ selectedLocationId: id }),
  toggleLocationSelection: (id) => set((state) => {
    const newSet = new Set(state.selectedLocationIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    return { selectedLocationIds: newSet }
  }),
  clearSelection: () => set({ selectedLocationIds: new Set() }),
  setMapViewport: (viewport) => set({ mapViewport: viewport }),
  setFilters: (filters) => set({ activeFilters: filters })
}))
```

## Real-time Subscriptions

### Location Updates

```typescript
// Subscribe to location changes
function useLocationSubscription(datasetId: Id<'datasets'>) {
  const locations = useQuery(api.locations.listByDataset, { datasetId })
  
  // Locations automatically update when changes occur
  useEffect(() => {
    if (locations) {
      console.log('Locations updated:', locations.length)
    }
  }, [locations])
  
  return locations
}

// Subscribe to specific location
function useLocationDetails(locationId: Id<'locations'>) {
  return useQuery(api.locations.getById, { id: locationId })
}
```

## Performance Optimization

### 1. Large Dataset Handling

```typescript
// Virtualized location list for performance
import { FixedSizeList as List } from 'react-window'

function VirtualizedLocationList({ locations }: { locations: Location[] }) {
  const Row = ({ index, style }: { index: number, style: any }) => (
    <div style={style}>
      <LocationCard location={locations[index]} />
    </div>
  )
  
  return (
    <List
      height={600}
      itemCount={locations.length}
      itemSize={120}
    >
      {Row}
    </List>
  )
}
```

### 2. Map Clustering

```typescript
// Efficient map clustering
function ClusteredLocationMap({ locations }: { locations: Location[] }) {
  const clusters = useMemo(() => {
    if (locations.length > 1000) {
      return createLocationClusters(locations, {
        radius: 60,
        maxZoom: 15,
        algorithm: 'kmeans'
      })
    }
    return locations
  }, [locations])
  
  return <LocationMap locations={clusters} showClusters={true} />
}
```

## Error Handling

### Location Operations

```typescript
// Robust error handling
async function createLocationWithErrorHandling(locationData: LocationCreateData) {
  try {
    const result = await createLocation(locationData)
    toast.success('Location created successfully')
    return result
  } catch (error) {
    if (error.message.includes('duplicate name')) {
      toast.error('Location name already exists')
    } else if (error.message.includes('invalid coordinates')) {
      toast.error('Invalid coordinates provided')
    } else if (error.message.includes('geocoding failed')) {
      toast.error('Could not geocode address')
    } else {
      toast.error('Failed to create location')
    }
    throw error
  }
}
```

## Testing Guidelines

### Component Testing

```typescript
// Location component tests
import { render, fireEvent } from '@testing-library/react'
import { LocationCard } from '@/components/locations/LocationCard'

test('LocationCard displays location information', () => {
  const location = {
    _id: 'loc_123',
    name: 'Test Location',
    locationType: 'warehouse',
    address: '123 Test St'
  }
  
  const { getByText } = render(
    <LocationCard location={location} />
  )
  
  expect(getByText('Test Location')).toBeInTheDocument()
  expect(getByText('warehouse')).toBeInTheDocument()
})
```

### Integration Testing

```typescript
// Location integration tests
test('Location creation flow', async () => {
  const user = userEvent.setup()
  
  render(<LocationPage datasetId="dataset_123" />)
  
  // Open create form
  await user.click(screen.getByText('Add Location'))
  
  // Fill form
  await user.type(screen.getByLabelText('Name'), 'Test Location')
  await user.type(screen.getByLabelText('Address'), '123 Test St')
  
  // Submit
  await user.click(screen.getByText('Save'))
  
  // Verify creation
  await waitFor(() => {
    expect(screen.getByText('Test Location')).toBeInTheDocument()
  })
})
```

## Best Practices

### 1. Location Data Validation

- Always validate coordinates before saving
- Use geocoding quality scores for data quality assessment
- Implement duplicate detection for location names
- Validate location type consistency

### 2. Performance Considerations

- Use clustering for maps with >100 locations
- Implement virtualization for large lists
- Cache geocoding results to reduce API calls
- Use debounced search for better UX

### 3. User Experience

- Provide visual feedback for async operations
- Show geocoding quality to users
- Implement progressive loading for large datasets
- Use optimistic updates where appropriate

### 4. Error Recovery

- Implement retry logic for failed geocoding
- Provide fallback options for network failures
- Cache data locally for offline scenarios
- Show meaningful error messages to users

---

**Last Updated**: July 10, 2025  
**Version**: 1.0  
**Next Review**: October 10, 2025