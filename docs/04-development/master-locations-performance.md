# Master Locations System - Performance Optimization Guide

**Version**: 1.0  
**Date**: July 10, 2025  
**Audience**: Developers, DevOps, Performance Engineers  

## Performance Targets

### System Requirements
- **Load Time**: <2 seconds for 10,000 locations
- **Map Rendering**: <1 second for clustered view
- **Search Response**: <300ms for filtered results
- **Bulk Operations**: 1,000 locations/minute processing
- **Memory Usage**: <500MB for 50,000 locations

## Frontend Optimization

### 1. Component Performance

#### Location List Virtualization
```typescript
// Use react-window for large datasets
import { FixedSizeList as List } from 'react-window'

const VirtualizedLocationList = ({ locations }: { locations: Location[] }) => {
  const Row = React.memo(({ index, style }: any) => (
    <div style={style}>
      <LocationCard location={locations[index]} />
    </div>
  ))
  
  return (
    <List
      height={600}
      itemCount={locations.length}
      itemSize={120}
      overscanCount={5} // Render 5 extra items
    >
      {Row}
    </List>
  )
}

// Performance monitoring
const PerformanceWrapper = ({ children, name }: any) => {
  useEffect(() => {
    performance.mark(`${name}-start`)
    return () => {
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)
    }
  }, [name])
  
  return children
}
```

#### Map Clustering Optimization
```typescript
// Efficient clustering with worker threads
const useClusteredLocations = (locations: Location[], viewport: MapViewport) => {
  return useMemo(() => {
    if (locations.length < 100) return locations
    
    const clusters = createClusters(locations, {
      radius: 50,
      maxZoom: viewport.zoom,
      algorithm: 'supercluster'
    })
    
    return clusters
  }, [locations, viewport.zoom])
}

// Dynamic clustering based on performance
const AdaptiveLocationMap = ({ locations }: { locations: Location[] }) => {
  const [clusterRadius, setClusterRadius] = useState(50)
  
  useEffect(() => {
    const startTime = performance.now()
    
    // Measure render time
    requestAnimationFrame(() => {
      const renderTime = performance.now() - startTime
      
      if (renderTime > 1000 && locations.length > 1000) {
        setClusterRadius(prev => Math.min(prev + 10, 100))
      } else if (renderTime < 500 && clusterRadius > 30) {
        setClusterRadius(prev => Math.max(prev - 10, 30))
      }
    })
  }, [locations.length, clusterRadius])
  
  return (
    <LocationMap 
      locations={locations}
      clusterRadius={clusterRadius}
    />
  )
}
```

### 2. State Management Optimization

#### Selective Updates
```typescript
// Optimize with selective re-renders
const useOptimizedLocations = (datasetId: string) => {
  const locations = useQuery(api.locations.listByDataset, { datasetId })
  
  // Memoize expensive computations
  const processedLocations = useMemo(() => {
    return locations?.map(location => ({
      ...location,
      displayName: formatLocationName(location),
      coordinates: [location.locationLon, location.locationLat] as [number, number],
      qualityScore: calculateQualityScore(location)
    }))
  }, [locations])
  
  return processedLocations
}

// Debounced search for better performance
const useDebouncedLocationSearch = (searchTerm: string, delay = 300) => {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm)
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), delay)
    return () => clearTimeout(timer)
  }, [searchTerm, delay])
  
  return useQuery(api.locations.search, 
    debouncedTerm ? { query: debouncedTerm } : 'skip'
  )
}
```

#### Efficient Bulk Selection
```typescript
// Optimize bulk selection with Set operations
const useBulkLocationSelection = (locations: Location[]) => {
  const [selectedIds, setSelectedIds] = useState(new Set<string>())
  
  const toggleSelection = useCallback((locationId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(locationId)) {
        newSet.delete(locationId)
      } else {
        newSet.add(locationId)
      }
      return newSet
    })
  }, [])
  
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(locations.map(loc => loc._id)))
  }, [locations])
  
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])
  
  return {
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    selectedCount: selectedIds.size
  }
}
```

### 3. Bundle Optimization

#### Code Splitting
```typescript
// Lazy load heavy components
const LocationMap = lazy(() => import('@/components/locations/LocationMap'))
const BulkEditModal = lazy(() => import('@/components/locations/BulkEditModal'))

const MasterLocationsPage = () => {
  return (
    <div>
      <Suspense fallback={<LocationMapSkeleton />}>
        <LocationMap />
      </Suspense>
      
      {showBulkEdit && (
        <Suspense fallback={<div>Loading...</div>}>
          <BulkEditModal />
        </Suspense>
      )}
    </div>
  )
}

// Dynamic imports for geocoding
const useGeocodingService = () => {
  const geocode = useCallback(async (address: string) => {
    const { geocodeAddress } = await import('@/lib/geocoding')
    return geocodeAddress(address)
  }, [])
  
  return { geocode }
}
```

## Backend Optimization

### 1. Database Query Optimization

#### Efficient Location Queries
```typescript
// Convex optimized queries
export const listLocationsByDatasetOptimized = query({
  args: { 
    datasetId: v.id('datasets'),
    limit: v.optional(v.number()),
    offset: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const { datasetId, limit = 100, offset = 0 } = args
    
    // Use database indexes efficiently
    return await ctx.db
      .query('locations')
      .withIndex('by_dataset', q => q.eq('datasetId', datasetId))
      .order('desc') // Use _creationTime for consistent ordering
      .skip(offset)
      .take(limit)
      .collect()
  }
})

// Spatial queries for map viewport
export const listLocationsInBounds = query({
  args: {
    datasetId: v.id('datasets'),
    bounds: v.object({
      north: v.number(),
      south: v.number(),
      east: v.number(),
      west: v.number()
    })
  },
  handler: async (ctx, args) => {
    const { datasetId, bounds } = args
    
    // Filter by geographic bounds for map performance
    const locations = await ctx.db
      .query('locations')
      .withIndex('by_dataset', q => q.eq('datasetId', datasetId))
      .filter(q => 
        q.and(
          q.gte(q.field('locationLat'), bounds.south),
          q.lte(q.field('locationLat'), bounds.north),
          q.gte(q.field('locationLon'), bounds.west),
          q.lte(q.field('locationLon'), bounds.east)
        )
      )
      .collect()
    
    return locations
  }
})
```

#### Batch Operations
```typescript
// Efficient bulk operations
export const bulkUpdateLocations = mutation({
  args: {
    updates: v.array(v.object({
      id: v.id('locations'),
      updates: v.object({
        name: v.optional(v.string()),
        locationType: v.optional(v.string()),
        // ... other fields
      })
    }))
  },
  handler: async (ctx, args) => {
    const results = []
    
    // Process in batches to avoid timeout
    for (const { id, updates } of args.updates) {
      try {
        const updated = await ctx.db.patch(id, {
          ...updates,
          updatedAt: Date.now()
        })
        results.push({ id, success: true })
      } catch (error) {
        results.push({ id, success: false, error: error.message })
      }
    }
    
    return results
  }
})
```

### 2. Caching Strategies

#### Redis Caching
```typescript
// Geocoding result caching
class GeocodingCache {
  private redis: Redis
  private ttl = 30 * 24 * 60 * 60 // 30 days
  
  async get(address: string): Promise<GeocodingResult | null> {
    const key = `geocode:${this.hashAddress(address)}`
    const cached = await this.redis.get(key)
    return cached ? JSON.parse(cached) : null
  }
  
  async set(address: string, result: GeocodingResult): Promise<void> {
    const key = `geocode:${this.hashAddress(address)}`
    await this.redis.setex(key, this.ttl, JSON.stringify(result))
  }
  
  private hashAddress(address: string): string {
    return crypto
      .createHash('md5')
      .update(address.toLowerCase().trim())
      .digest('hex')
  }
}

// Location metrics caching
const locationMetricsCache = new Map<string, any>()

export const getLocationMetrics = query({
  args: { datasetId: v.id('datasets') },
  handler: async (ctx, args) => {
    const cacheKey = `metrics:${args.datasetId}`
    
    // Check cache first
    if (locationMetricsCache.has(cacheKey)) {
      const cached = locationMetricsCache.get(cacheKey)
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes
        return cached.data
      }
    }
    
    // Calculate metrics
    const metrics = await calculateLocationMetrics(ctx, args.datasetId)
    
    // Cache results
    locationMetricsCache.set(cacheKey, {
      data: metrics,
      timestamp: Date.now()
    })
    
    return metrics
  }
})
```

### 3. Geocoding Optimization

#### Batch Geocoding
```typescript
// Efficient batch geocoding
class BatchGeocodingService {
  private queue: GeocodingRequest[] = []
  private batchSize = 25
  private delay = 1000 // 1 second between batches
  
  async geocode(address: string): Promise<GeocodingResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({ address, resolve, reject })
      this.processBatch()
    })
  }
  
  private async processBatch() {
    if (this.queue.length < this.batchSize) return
    
    const batch = this.queue.splice(0, this.batchSize)
    
    try {
      const results = await this.mapboxBatchGeocode(
        batch.map(req => req.address)
      )
      
      batch.forEach((req, index) => {
        req.resolve(results[index])
      })
    } catch (error) {
      batch.forEach(req => req.reject(error))
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, this.delay))
  }
  
  private async mapboxBatchGeocode(addresses: string[]): Promise<GeocodingResult[]> {
    // Implement Mapbox batch geocoding
    // Return array of results in same order as input
  }
}
```

## Memory Management

### 1. Large Dataset Handling

#### Memory-Efficient Data Structures
```typescript
// Use efficient data structures for large datasets
class LocationIndex {
  private spatialIndex: Map<string, Set<string>> = new Map()
  private nameIndex: Map<string, string[]> = new Map()
  
  addLocation(location: Location) {
    // Add to spatial grid
    const gridKey = this.getGridKey(location.locationLat!, location.locationLon!)
    if (!this.spatialIndex.has(gridKey)) {
      this.spatialIndex.set(gridKey, new Set())
    }
    this.spatialIndex.get(gridKey)!.add(location._id)
    
    // Add to name index
    const nameKey = location.name.toLowerCase()
    if (!this.nameIndex.has(nameKey)) {
      this.nameIndex.set(nameKey, [])
    }
    this.nameIndex.get(nameKey)!.push(location._id)
  }
  
  findNearby(lat: number, lon: number, radiusKm: number): string[] {
    // Efficient spatial lookup
    const centerGrid = this.getGridKey(lat, lon)
    const nearby = new Set<string>()
    
    // Check surrounding grid cells
    const gridRadius = Math.ceil(radiusKm / this.gridSize)
    for (let x = -gridRadius; x <= gridRadius; x++) {
      for (let y = -gridRadius; y <= gridRadius; y++) {
        const gridKey = this.getGridKey(lat + x * this.gridSize, lon + y * this.gridSize)
        const cell = this.spatialIndex.get(gridKey)
        if (cell) {
          cell.forEach(id => nearby.add(id))
        }
      }
    }
    
    return Array.from(nearby)
  }
  
  private getGridKey(lat: number, lon: number): string {
    const gridLat = Math.floor(lat / this.gridSize)
    const gridLon = Math.floor(lon / this.gridSize)
    return `${gridLat},${gridLon}`
  }
  
  private gridSize = 0.01 // ~1km resolution
}
```

### 2. Memory Leak Prevention

#### Component Cleanup
```typescript
// Proper cleanup patterns
const LocationMapComponent = () => {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  
  useEffect(() => {
    // Initialize map
    mapRef.current = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11'
    })
    
    return () => {
      // Cleanup map resources
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      
      // Cleanup markers
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current.clear()
    }
  }, [])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear any intervals, timeouts, subscriptions
      clearInterval(updateIntervalRef.current)
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])
}

// Memory monitoring
const useMemoryMonitoring = () => {
  useEffect(() => {
    const interval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        console.log('Memory usage:', {
          used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
          total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
          limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
        })
      }
    }, 30000) // Check every 30 seconds
    
    return () => clearInterval(interval)
  }, [])
}
```

## Monitoring and Metrics

### 1. Performance Metrics Collection

#### Frontend Metrics
```typescript
// Performance monitoring service
class LocationPerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  
  startTimer(operation: string): () => void {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      this.recordMetric(operation, duration)
    }
  }
  
  recordMetric(operation: string, value: number) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, [])
    }
    
    const values = this.metrics.get(operation)!
    values.push(value)
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }
  
  getAverageMetric(operation: string): number {
    const values = this.metrics.get(operation) || []
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }
  
  getPercentile(operation: string, percentile: number): number {
    const values = this.metrics.get(operation) || []
    const sorted = values.sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[index] || 0
  }
}

// Usage in components
const LocationComponent = () => {
  const monitor = usePerformanceMonitor()
  
  const handleLocationLoad = useCallback(async () => {
    const timer = monitor.startTimer('location-load')
    
    try {
      await loadLocations()
    } finally {
      timer()
    }
  }, [monitor])
  
  useEffect(() => {
    // Report metrics periodically
    const interval = setInterval(() => {
      const metrics = {
        avgLoadTime: monitor.getAverageMetric('location-load'),
        p95LoadTime: monitor.getPercentile('location-load', 95),
        avgRenderTime: monitor.getAverageMetric('location-render')
      }
      
      // Send to analytics
      analytics.track('location-performance', metrics)
    }, 60000) // Every minute
    
    return () => clearInterval(interval)
  }, [monitor])
}
```

### 2. Backend Metrics

#### Query Performance Tracking
```typescript
// Performance middleware for Convex functions
export const withPerformanceTracking = <T extends FunctionReference<"query" | "mutation">>(
  fn: T,
  operationName: string
) => {
  return async (ctx: any, args: any) => {
    const start = Date.now()
    
    try {
      const result = await fn(ctx, args)
      const duration = Date.now() - start
      
      // Log performance metrics
      console.log(`${operationName} completed in ${duration}ms`)
      
      // Store metrics for analysis
      await ctx.db.insert('performanceMetrics', {
        operation: operationName,
        duration,
        timestamp: start,
        success: true
      })
      
      return result
    } catch (error) {
      const duration = Date.now() - start
      
      await ctx.db.insert('performanceMetrics', {
        operation: operationName,
        duration,
        timestamp: start,
        success: false,
        error: error.message
      })
      
      throw error
    }
  }
}
```

## Load Testing

### 1. Frontend Load Testing

#### Synthetic Data Generation
```typescript
// Generate test data for performance testing
function generateTestLocations(count: number): Location[] {
  const locations: Location[] = []
  
  for (let i = 0; i < count; i++) {
    locations.push({
      _id: `test_location_${i}` as Id<'locations'>,
      name: `Test Location ${i}`,
      locationLat: 37.7749 + (Math.random() - 0.5) * 0.1,
      locationLon: -122.4194 + (Math.random() - 0.5) * 0.1,
      locationType: ['depot', 'customer', 'warehouse'][i % 3] as any,
      geocodeQuality: ['exact', 'interpolated', 'approximate'][i % 3] as any,
      usageCount: Math.floor(Math.random() * 100),
      _creationTime: Date.now() - Math.random() * 86400000,
      updatedAt: Date.now(),
      projectId: 'test_project' as Id<'projects'>
    })
  }
  
  return locations
}

// Performance test suite
describe('Location Performance Tests', () => {
  test('Map renders 10k locations under 2 seconds', async () => {
    const locations = generateTestLocations(10000)
    const start = performance.now()
    
    render(<LocationMap locations={locations} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('location-map')).toBeInTheDocument()
    })
    
    const renderTime = performance.now() - start
    expect(renderTime).toBeLessThan(2000)
  })
  
  test('Bulk selection handles 1k locations efficiently', () => {
    const locations = generateTestLocations(1000)
    
    const { selectAll } = renderHook(() => useBulkLocationSelection(locations))
    
    const start = performance.now()
    act(() => {
      selectAll()
    })
    const selectionTime = performance.now() - start
    
    expect(selectionTime).toBeLessThan(100)
  })
})
```

## Optimization Checklist

### Frontend Optimization
- [ ] Virtual scrolling for location lists >100 items
- [ ] Map clustering enabled for >100 locations
- [ ] Lazy loading for heavy components
- [ ] Debounced search with 300ms delay
- [ ] Memoized expensive calculations
- [ ] Efficient bulk selection with Set operations
- [ ] Code splitting for location modules
- [ ] Image optimization for location markers

### Backend Optimization  
- [ ] Database indexes on frequently queried fields
- [ ] Pagination for large datasets
- [ ] Batch operations for bulk updates
- [ ] Caching for geocoding results
- [ ] Rate limiting for external APIs
- [ ] Connection pooling for database
- [ ] Query optimization for spatial data
- [ ] Background processing for heavy operations

### Memory Management
- [ ] Proper cleanup of map resources
- [ ] Memory leak monitoring
- [ ] Efficient data structures for large datasets
- [ ] Regular garbage collection monitoring
- [ ] Component unmount cleanup
- [ ] Clear intervals and timeouts
- [ ] Remove event listeners

---

**Performance Target Achievement**: 95% of operations should meet performance targets  
**Monitoring**: Continuous performance monitoring with alerts  
**Review Cycle**: Monthly performance review and optimization