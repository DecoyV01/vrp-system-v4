# Master Locations System - Troubleshooting Guide

**Version**: 1.0  
**Date**: July 10, 2025  
**Audience**: Developers, Support Team, System Administrators  

## Quick Diagnostics

### Health Check Commands

```bash
# Check location data health
curl https://your-app.com/api/locations/health

# Verify geocoding service
curl https://your-app.com/api/geocode/test

# Database connectivity
npx convex logs --tail
```

## Common Issues and Solutions

### 1. Geocoding Problems

#### Issue: "Address not found" Error
```
Error: Geocoding failed for address "123 Main St"
Status: ADDRESS_NOT_FOUND
```

**Root Causes:**
- Incomplete or malformed address
- Mapbox API key issues
- Rate limiting exceeded
- Network connectivity problems

**Solutions:**
```typescript
// 1. Validate address format before geocoding
function validateAddress(address: string): boolean {
  const hasStreet = /\d+\s+\w+/.test(address)
  const hasCity = /,\s*\w+/.test(address)
  return hasStreet && hasCity
}

// 2. Implement fallback geocoding
async function geocodeWithFallback(address: string) {
  try {
    return await primaryGeocode(address)
  } catch (error) {
    // Try simplified address
    const simplified = simplifyAddress(address)
    return await primaryGeocode(simplified)
  }
}

// 3. Check API key configuration
console.log('Mapbox API Key:', process.env.VITE_MAPBOX_TOKEN?.slice(0, 10) + '...')
```

#### Issue: Poor Geocoding Quality
```
Warning: Location geocoded with low quality score (0.3)
Quality: approximate
Confidence: low
```

**Solutions:**
1. **Address Standardization:**
   ```typescript
   function standardizeAddress(address: string): string {
     return address
       .replace(/\bst\b/gi, 'Street')
       .replace(/\bave\b/gi, 'Avenue')
       .replace(/\bdr\b/gi, 'Drive')
       .trim()
   }
   ```

2. **Manual Review Process:**
   ```typescript
   if (geocodeResult.quality === 'approximate') {
     // Flag for manual review
     flagForManualReview(locationId, geocodeResult)
   }
   ```

3. **Quality Thresholds:**
   ```typescript
   const qualityThresholds = {
     exact: 1.0,
     interpolated: 0.8,
     approximate: 0.6,
     manual: 0.4
   }
   ```

### 2. Map Display Issues

#### Issue: Locations Not Showing on Map
```
Map loads but no location markers visible
Console: "0 locations rendered"
```

**Diagnostic Steps:**
```typescript
// 1. Check data loading
console.log('Locations loaded:', locations?.length)

// 2. Verify coordinates
locations?.forEach(loc => {
  if (!loc.locationLat || !loc.locationLon) {
    console.warn('Missing coordinates:', loc.name)
  }
})

// 3. Check map bounds
console.log('Map viewport:', mapViewport)
console.log('Location bounds:', calculateLocationBounds(locations))
```

**Solutions:**
```typescript
// 1. Auto-fit map to locations
useEffect(() => {
  if (locations?.length > 0) {
    const bounds = calculateLocationBounds(locations)
    setMapViewport(bounds)
  }
}, [locations])

// 2. Filter invalid coordinates
const validLocations = locations?.filter(loc => 
  loc.locationLat && loc.locationLon &&
  loc.locationLat >= -90 && loc.locationLat <= 90 &&
  loc.locationLon >= -180 && loc.locationLon <= 180
)

// 3. Debug marker rendering
const DebugMarker = ({ location }) => {
  console.log('Rendering marker:', location.name, location.locationLat, location.locationLon)
  return <Marker {...props} />
}
```

#### Issue: Map Performance Problems
```
Map becomes unresponsive with large datasets
Browser memory usage high
```

**Solutions:**
```typescript
// 1. Enable clustering
<LocationMap 
  locations={locations}
  clustering={{
    enabled: locations.length > 100,
    radius: 50,
    maxZoom: 15
  }}
/>

// 2. Implement viewport filtering
const visibleLocations = useMemo(() => {
  if (!mapViewport || locations.length < 1000) return locations
  
  return locations.filter(loc => 
    isLocationInBounds(loc, mapViewport.bounds)
  )
}, [locations, mapViewport])

// 3. Use React.memo for performance
const OptimizedLocationMarker = React.memo(LocationMarker)
```

### 3. Data Import/Export Issues

#### Issue: CSV Import Failures
```
Error: Import failed at row 15
Validation errors: Invalid coordinates
```

**Diagnostic Process:**
```typescript
// 1. Validate CSV structure
function validateCSVStructure(csvData: any[]) {
  const requiredFields = ['name']
  const optionalFields = ['address', 'locationLat', 'locationLon', 'locationType']
  
  return csvData.map((row, index) => {
    const errors = []
    
    // Check required fields
    requiredFields.forEach(field => {
      if (!row[field] || row[field].trim() === '') {
        errors.push(`Missing required field: ${field}`)
      }
    })
    
    // Validate coordinates if present
    if (row.locationLat || row.locationLon) {
      const lat = parseFloat(row.locationLat)
      const lon = parseFloat(row.locationLon)
      
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.push(`Invalid latitude: ${row.locationLat}`)
      }
      
      if (isNaN(lon) || lon < -180 || lon > 180) {
        errors.push(`Invalid longitude: ${row.locationLon}`)
      }
    }
    
    return { row: index + 1, errors }
  })
}

// 2. Batch processing for large imports
async function importLocationsInBatches(locations: any[], batchSize = 50) {
  const results = []
  
  for (let i = 0; i < locations.length; i += batchSize) {
    const batch = locations.slice(i, i + batchSize)
    
    try {
      const batchResults = await Promise.allSettled(
        batch.map(loc => createLocation(loc))
      )
      results.push(...batchResults)
    } catch (error) {
      console.error(`Batch ${i / batchSize + 1} failed:`, error)
    }
    
    // Add delay to prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return results
}
```

#### Issue: Duplicate Location Detection
```
Warning: Potential duplicate locations found
"Warehouse A" at (37.7749, -122.4194)
"Warehouse A" at (37.7750, -122.4195)
```

**Solutions:**
```typescript
// 1. Fuzzy name matching
import Fuse from 'fuse.js'

function findDuplicateLocations(locations: Location[]) {
  const fuse = new Fuse(locations, {
    keys: ['name'],
    threshold: 0.3 // Adjust sensitivity
  })
  
  const duplicates = []
  locations.forEach(location => {
    const matches = fuse.search(location.name)
    if (matches.length > 1) {
      duplicates.push({
        location,
        matches: matches.map(m => m.item)
      })
    }
  })
  
  return duplicates
}

// 2. Geographic proximity detection
function findNearbyLocations(location: Location, others: Location[], radiusKm = 0.1) {
  return others.filter(other => {
    if (other._id === location._id) return false
    
    const distance = calculateDistance(
      location.locationLat!, location.locationLon!,
      other.locationLat!, other.locationLon!
    )
    
    return distance <= radiusKm
  })
}

// 3. Duplicate resolution strategies
interface DuplicateResolutionStrategy {
  merge: (primary: Location, duplicates: Location[]) => Location
  delete: (duplicates: Location[]) => Promise<void>
  skip: () => void
}
```

### 4. Performance Issues

#### Issue: Slow Page Loading
```
Page load time: 8+ seconds
Location count: 5000+
Memory usage: High
```

**Optimization Strategies:**
```typescript
// 1. Implement pagination
function usePaginatedLocations(datasetId: string, pageSize = 100) {
  const [page, setPage] = useState(0)
  
  const locations = useQuery(api.locations.listPaginated, {
    datasetId,
    offset: page * pageSize,
    limit: pageSize
  })
  
  return { locations, page, setPage, hasMore: locations?.length === pageSize }
}

// 2. Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window'

function VirtualizedLocationList({ locations }: { locations: Location[] }) {
  const Row = ({ index, style }: any) => (
    <div style={style}>
      <LocationCard location={locations[index]} />
    </div>
  )
  
  return (
    <List
      height={600}
      itemCount={locations.length}
      itemSize={120}
      overscanCount={5}
    >
      {Row}
    </List>
  )
}

// 3. Memoization for expensive operations
const expensiveLocationProcessing = useMemo(() => {
  return locations?.map(location => ({
    ...location,
    distanceFromCenter: calculateDistanceFromCenter(location),
    usageMetrics: calculateUsageMetrics(location)
  }))
}, [locations])
```

#### Issue: Memory Leaks
```
Browser memory continuously increasing
Tab becomes unresponsive after extended use
```

**Solutions:**
```typescript
// 1. Cleanup subscriptions
useEffect(() => {
  const unsubscribe = subscribeToLocationUpdates(datasetId, (update) => {
    // Handle update
  })
  
  return () => {
    unsubscribe()
  }
}, [datasetId])

// 2. Cleanup map resources
useEffect(() => {
  return () => {
    if (mapRef.current) {
      mapRef.current.remove()
    }
  }
}, [])

// 3. Limit concurrent operations
const semaphore = new Semaphore(5) // Max 5 concurrent operations

async function processLocationsBatch(locations: Location[]) {
  return Promise.all(
    locations.map(async (location) => {
      await semaphore.acquire()
      try {
        return await processLocation(location)
      } finally {
        semaphore.release()
      }
    })
  )
}
```

### 5. Real-time Sync Issues

#### Issue: Location Updates Not Reflecting
```
Location updated in database but UI not refreshing
Real-time sync broken
```

**Diagnostic Steps:**
```typescript
// 1. Check Convex connection
useEffect(() => {
  const convex = useConvex()
  console.log('Convex connection status:', convex.connectionState())
}, [])

// 2. Verify subscription
const locations = useQuery(api.locations.listByDataset, { datasetId })
console.log('Query status:', locations === undefined ? 'loading' : 'loaded')

// 3. Test optimistic updates
const updateLocation = useMutation(api.locations.update)
const handleOptimisticUpdate = async (locationId: string, updates: any) => {
  // Optimistic update
  setLocations(prev => prev?.map(loc => 
    loc._id === locationId ? { ...loc, ...updates } : loc
  ))
  
  try {
    await updateLocation({ id: locationId, ...updates })
  } catch (error) {
    // Revert optimistic update
    setLocations(prev => prev?.map(loc => 
      loc._id === locationId ? originalLocation : loc
    ))
    throw error
  }
}
```

## Error Codes Reference

### Geocoding Errors
- `GEOCODE_001`: Invalid address format
- `GEOCODE_002`: API key missing or invalid  
- `GEOCODE_003`: Rate limit exceeded
- `GEOCODE_004`: Service unavailable
- `GEOCODE_005`: Low quality result

### Validation Errors
- `LOCATION_001`: Missing required field (name)
- `LOCATION_002`: Invalid coordinates
- `LOCATION_003`: Duplicate location name
- `LOCATION_004`: Invalid location type
- `LOCATION_005`: Address geocoding failed

### System Errors  
- `SYSTEM_001`: Database connection error
- `SYSTEM_002`: Real-time sync failure
- `SYSTEM_003`: Memory limit exceeded
- `SYSTEM_004`: Network timeout
- `SYSTEM_005`: Permission denied

## Monitoring and Logging

### Location System Metrics

```typescript
// Custom metrics collection
interface LocationMetrics {
  totalLocations: number
  geocodingSuccessRate: number
  avgGeocodeQuality: number
  mapRenderTime: number
  importSuccessRate: number
  apiResponseTime: number
}

function collectLocationMetrics(): LocationMetrics {
  return {
    totalLocations: locations?.length || 0,
    geocodingSuccessRate: calculateGeocodeSuccessRate(),
    avgGeocodeQuality: calculateAverageQuality(),
    mapRenderTime: performance.getEntriesByType('measure')
      .find(m => m.name === 'map-render')?.duration || 0,
    importSuccessRate: getImportSuccessRate(),
    apiResponseTime: getAverageApiResponseTime()
  }
}
```

### Health Check Endpoints

```typescript
// Location system health check
app.get('/api/locations/health', async (req, res) => {
  const checks = {
    database: await checkDatabaseConnection(),
    geocoding: await checkGeocodingService(),
    realtime: await checkRealtimeSync(),
    memory: process.memoryUsage(),
    locationCount: await getLocationCount()
  }
  
  const isHealthy = Object.values(checks).every(check => 
    typeof check === 'object' ? check.status === 'ok' : check
  )
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  })
})
```

## Escalation Procedures

### 1. Performance Issues
- **Severity**: High
- **Response Time**: 2 hours
- **Actions**: Scale infrastructure, optimize queries, implement caching

### 2. Data Integrity Issues
- **Severity**: Critical
- **Response Time**: 30 minutes  
- **Actions**: Stop writes, backup data, investigate corruption

### 3. Geocoding Service Outage
- **Severity**: Medium
- **Response Time**: 1 hour
- **Actions**: Enable fallback service, notify users, implement graceful degradation

### 4. Real-time Sync Failure
- **Severity**: Medium
- **Response Time**: 1 hour
- **Actions**: Restart sync service, verify WebSocket connections, manual data refresh

## Recovery Procedures

### Data Recovery
```bash
# Backup current state
npx convex export --output backup-$(date +%Y%m%d-%H%M%S).json

# Restore from backup
npx convex import backup-20250710-120000.json

# Verify data integrity
npx convex run locations:validateDataIntegrity
```

### Service Recovery
```bash
# Restart location services
pm2 restart location-service

# Clear cache
redis-cli FLUSHALL

# Rebuild search indexes
npx convex run locations:rebuildIndexes
```

---

**Emergency Contact**: support@vrp-system.com  
**Documentation**: https://docs.vrp-system.com/locations  
**Status Page**: https://status.vrp-system.com