# Master Locations Migration Guide

**Version**: 1.0  
**Date**: July 10, 2025  
**Audience**: Developers, Database Administrators, System Operators  

## Migration Overview

This guide covers migrating from a coordinate-based system to the Master Locations System, where location data is centralized and managed through a dedicated locations table with referential integrity.

### Migration Goals

- **Centralize Location Data**: Move from scattered coordinates to master location records
- **Eliminate Duplication**: Consolidate duplicate location data across tables
- **Improve Data Quality**: Implement geocoding and validation for all locations
- **Maintain Referential Integrity**: Ensure all entities properly reference location master
- **Zero Downtime**: Execute migration without service interruption

## Pre-Migration Assessment

### 1. Data Audit

```typescript
// Audit existing coordinate data
export const auditCoordinateData = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const vehicles = await ctx.db
      .query('vehicles')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))
      .collect()
      
    const jobs = await ctx.db
      .query('jobs')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))
      .collect()
      
    const shipments = await ctx.db
      .query('shipments')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))
      .collect()
    
    // Analyze coordinate distribution
    const vehicleCoords = vehicles.flatMap(v => [
      { lat: v.startLat, lon: v.startLon, type: 'vehicle_start', id: v._id },
      { lat: v.endLat, lon: v.endLon, type: 'vehicle_end', id: v._id }
    ]).filter(c => c.lat && c.lon)
    
    const jobCoords = jobs.map(j => ({
      lat: j.locationLat,
      lon: j.locationLon,
      type: 'job',
      id: j._id
    })).filter(c => c.lat && c.lon)
    
    const shipmentCoords = shipments.flatMap(s => [
      { lat: s.pickupLat, lon: s.pickupLon, type: 'shipment_pickup', id: s._id },
      { lat: s.deliveryLat, lon: s.deliveryLon, type: 'shipment_delivery', id: s._id }
    ]).filter(c => c.lat && c.lon)
    
    const allCoords = [...vehicleCoords, ...jobCoords, ...shipmentCoords]
    
    // Find potential duplicates
    const duplicateGroups = findDuplicateCoordinates(allCoords, 0.001) // ~100m radius
    
    return {
      totalCoordinates: allCoords.length,
      vehicleCoordinates: vehicleCoords.length,
      jobCoordinates: jobCoords.length,
      shipmentCoordinates: shipmentCoords.length,
      duplicateGroups: duplicateGroups.length,
      duplicateCoordinates: duplicateGroups.reduce((sum, group) => sum + group.length, 0)
    }
  }
})

function findDuplicateCoordinates(coordinates: any[], radiusKm: number) {
  const groups: any[][] = []
  const processed = new Set<string>()
  
  coordinates.forEach(coord => {
    if (processed.has(coord.id)) return
    
    const group = coordinates.filter(other => {
      if (processed.has(other.id)) return false
      
      const distance = calculateDistance(
        coord.lat, coord.lon,
        other.lat, other.lon
      )
      
      return distance <= radiusKm
    })
    
    if (group.length > 1) {
      groups.push(group)
      group.forEach(c => processed.add(c.id))
    }
  })
  
  return groups
}
```

### 2. Migration Planning

#### Phase 1: Preparation (Week 1)
- [ ] Audit existing coordinate data
- [ ] Identify duplicate locations
- [ ] Create migration scripts
- [ ] Set up staging environment
- [ ] Prepare rollback procedures

#### Phase 2: Location Master Creation (Week 2)
- [ ] Create unique location records
- [ ] Geocode addresses where available
- [ ] Validate coordinate data
- [ ] Establish location naming conventions
- [ ] Create location clusters

#### Phase 3: Reference Migration (Week 3)
- [ ] Update vehicle references
- [ ] Update job references  
- [ ] Update shipment references
- [ ] Validate referential integrity
- [ ] Test application functionality

#### Phase 4: Cleanup & Optimization (Week 4)
- [ ] Remove deprecated coordinate fields
- [ ] Optimize database indexes
- [ ] Update application code
- [ ] Performance testing
- [ ] Documentation updates

## Migration Implementation

### 1. Location Master Creation

#### Extract Unique Locations
```typescript
export const extractUniqueLocations = mutation({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const coordinates = await extractAllCoordinates(ctx, args.projectId)
    
    // Group nearby coordinates (within 100m)
    const locationGroups = clusterCoordinates(coordinates, 0.1) // 100m radius
    
    const locations = []
    for (const group of locationGroups) {
      // Calculate centroid
      const centroid = calculateCentroid(group)
      
      // Generate location name
      const name = await generateLocationName(ctx, centroid, group)
      
      // Determine location type based on usage
      const locationType = determineLocationType(group)
      
      // Create location record
      const locationId = await ctx.db.insert('locations', {
        projectId: args.projectId,
        name,
        locationLat: centroid.lat,
        locationLon: centroid.lon,
        locationType,
        geocodeQuality: 'manual',
        geocodeSource: 'migration',
        usageCount: group.length,
        updatedAt: Date.now()
      })
      
      locations.push({
        locationId,
        originalCoordinates: group
      })
    }
    
    return locations
  }
})

async function generateLocationName(
  ctx: any, 
  centroid: { lat: number, lon: number }, 
  group: any[]
): Promise<string> {
  // Try reverse geocoding first
  try {
    const address = await reverseGeocode(centroid.lat, centroid.lon)
    if (address) {
      return formatLocationName(address)
    }
  } catch (error) {
    console.warn('Reverse geocoding failed:', error)
  }
  
  // Fallback to coordinate-based naming
  const types = group.map(c => c.type)
  const predominantType = findMostCommon(types)
  
  return `${predominantType}_${centroid.lat.toFixed(4)}_${centroid.lon.toFixed(4)}`
}

function determineLocationType(group: any[]): string {
  const typeFrequency = group.reduce((acc, coord) => {
    const baseType = coord.type.split('_')[0] // vehicle, job, shipment
    acc[baseType] = (acc[baseType] || 0) + 1
    return acc
  }, {})
  
  const mostCommon = Object.keys(typeFrequency).reduce((a, b) => 
    typeFrequency[a] > typeFrequency[b] ? a : b
  )
  
  // Map to location types
  const typeMapping = {
    vehicle: 'depot',
    job: 'customer',
    shipment: 'warehouse'
  }
  
  return typeMapping[mostCommon] || 'unknown'
}
```

#### Geocoding Enhancement
```typescript
export const enhanceLocationGeocoding = mutation({
  args: { 
    locationIds: v.array(v.id('locations')),
    batchSize: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 25
    const results = []
    
    for (let i = 0; i < args.locationIds.length; i += batchSize) {
      const batch = args.locationIds.slice(i, i + batchSize)
      
      const batchResults = await Promise.allSettled(
        batch.map(async (locationId) => {
          const location = await ctx.db.get(locationId)
          if (!location) return { id: locationId, status: 'not_found' }
          
          try {
            // Reverse geocode to get address
            const address = await reverseGeocode(
              location.locationLat!,
              location.locationLon!
            )
            
            // Update location with address and quality
            await ctx.db.patch(locationId, {
              address: address?.formatted,
              geocodeQuality: 'interpolated',
              geocodeSource: 'mapbox',
              geocodeTimestamp: Date.now(),
              updatedAt: Date.now()
            })
            
            return { id: locationId, status: 'success', address }
          } catch (error) {
            return { id: locationId, status: 'error', error: error.message }
          }
        })
      )
      
      results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : r.reason))
      
      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    return results
  }
})
```

### 2. Reference Migration

#### Vehicle Reference Migration
```typescript
export const migrateVehicleReferences = mutation({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const vehicles = await ctx.db
      .query('vehicles')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))
      .collect()
    
    const migrationResults = []
    
    for (const vehicle of vehicles) {
      const updates: any = { updatedAt: Date.now() }
      
      // Find start location
      if (vehicle.startLat && vehicle.startLon) {
        const startLocation = await findNearestLocation(
          ctx, 
          args.projectId, 
          vehicle.startLat, 
          vehicle.startLon
        )
        if (startLocation) {
          updates.startLocationId = startLocation._id
        }
      }
      
      // Find end location
      if (vehicle.endLat && vehicle.endLon) {
        const endLocation = await findNearestLocation(
          ctx,
          args.projectId,
          vehicle.endLat,
          vehicle.endLon
        )
        if (endLocation) {
          updates.endLocationId = endLocation._id
        }
      }
      
      if (Object.keys(updates).length > 1) { // More than just updatedAt
        await ctx.db.patch(vehicle._id, updates)
        migrationResults.push({
          vehicleId: vehicle._id,
          startLocationId: updates.startLocationId,
          endLocationId: updates.endLocationId,
          status: 'success'
        })
      } else {
        migrationResults.push({
          vehicleId: vehicle._id,
          status: 'no_coordinates'
        })
      }
    }
    
    return migrationResults
  }
})

async function findNearestLocation(
  ctx: any,
  projectId: string,
  lat: number,
  lon: number,
  maxDistanceKm = 0.1
) {
  const locations = await ctx.db
    .query('locations')
    .withIndex('by_project', q => q.eq('projectId', projectId))
    .collect()
  
  let nearest = null
  let minDistance = Infinity
  
  for (const location of locations) {
    if (!location.locationLat || !location.locationLon) continue
    
    const distance = calculateDistance(
      lat, lon,
      location.locationLat, location.locationLon
    )
    
    if (distance < minDistance && distance <= maxDistanceKm) {
      minDistance = distance
      nearest = location
    }
  }
  
  return nearest
}
```

#### Job Reference Migration
```typescript
export const migrateJobReferences = mutation({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const jobs = await ctx.db
      .query('jobs')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))
      .collect()
    
    const migrationResults = []
    
    for (const job of jobs) {
      if (!job.locationLat || !job.locationLon) {
        migrationResults.push({
          jobId: job._id,
          status: 'no_coordinates'
        })
        continue
      }
      
      const location = await findNearestLocation(
        ctx,
        args.projectId,
        job.locationLat,
        job.locationLon
      )
      
      if (location) {
        await ctx.db.patch(job._id, {
          locationId: location._id,
          updatedAt: Date.now()
        })
        
        migrationResults.push({
          jobId: job._id,
          locationId: location._id,
          status: 'success'
        })
      } else {
        migrationResults.push({
          jobId: job._id,
          status: 'no_matching_location'
        })
      }
    }
    
    return migrationResults
  }
})
```

### 3. Data Validation

#### Migration Validation
```typescript
export const validateMigration = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const validationResults = {
      vehicles: { total: 0, migrated: 0, issues: [] },
      jobs: { total: 0, migrated: 0, issues: [] },
      shipments: { total: 0, migrated: 0, issues: [] },
      locations: { total: 0, valid: 0, issues: [] }
    }
    
    // Validate vehicles
    const vehicles = await ctx.db
      .query('vehicles')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))
      .collect()
    
    validationResults.vehicles.total = vehicles.length
    
    for (const vehicle of vehicles) {
      let migrated = true
      
      // Check start location
      if (vehicle.startLat && vehicle.startLon && !vehicle.startLocationId) {
        validationResults.vehicles.issues.push({
          vehicleId: vehicle._id,
          issue: 'Missing start location reference'
        })
        migrated = false
      }
      
      // Check end location
      if (vehicle.endLat && vehicle.endLon && !vehicle.endLocationId) {
        validationResults.vehicles.issues.push({
          vehicleId: vehicle._id,
          issue: 'Missing end location reference'
        })
        migrated = false
      }
      
      // Validate location references exist
      if (vehicle.startLocationId) {
        const startLocation = await ctx.db.get(vehicle.startLocationId)
        if (!startLocation) {
          validationResults.vehicles.issues.push({
            vehicleId: vehicle._id,
            issue: 'Invalid start location reference'
          })
          migrated = false
        }
      }
      
      if (migrated) {
        validationResults.vehicles.migrated++
      }
    }
    
    // Validate jobs (similar pattern)
    // Validate shipments (similar pattern)
    // Validate locations
    
    return validationResults
  }
})
```

## Migration Scripts

### 1. Complete Migration Script

```typescript
// Complete migration orchestrator
export const executeMigration = mutation({
  args: { 
    projectId: v.id('projects'),
    dryRun: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun || false
    const migrationLog = []
    
    try {
      // Phase 1: Create location master
      migrationLog.push('Starting location master creation...')
      const locations = await extractUniqueLocations(ctx, { projectId: args.projectId })
      migrationLog.push(`Created ${locations.length} location records`)
      
      if (!dryRun) {
        // Phase 2: Enhance with geocoding
        migrationLog.push('Enhancing locations with geocoding...')
        const locationIds = locations.map(l => l.locationId)
        await enhanceLocationGeocoding(ctx, { locationIds })
        migrationLog.push('Geocoding enhancement completed')
        
        // Phase 3: Migrate references
        migrationLog.push('Migrating vehicle references...')
        const vehicleResults = await migrateVehicleReferences(ctx, { projectId: args.projectId })
        migrationLog.push(`Migrated ${vehicleResults.filter(r => r.status === 'success').length} vehicles`)
        
        migrationLog.push('Migrating job references...')
        const jobResults = await migrateJobReferences(ctx, { projectId: args.projectId })
        migrationLog.push(`Migrated ${jobResults.filter(r => r.status === 'success').length} jobs`)
        
        // Phase 4: Validate migration
        migrationLog.push('Validating migration...')
        const validation = await validateMigration(ctx, { projectId: args.projectId })
        migrationLog.push('Validation completed')
        
        return {
          success: true,
          migrationLog,
          validation,
          locations: locations.length
        }
      } else {
        migrationLog.push('Dry run completed - no changes made')
        return {
          success: true,
          dryRun: true,
          migrationLog,
          estimatedLocations: locations.length
        }
      }
    } catch (error) {
      migrationLog.push(`Migration failed: ${error.message}`)
      return {
        success: false,
        migrationLog,
        error: error.message
      }
    }
  }
})
```

### 2. Rollback Procedures

```typescript
// Migration rollback
export const rollbackMigration = mutation({
  args: { 
    projectId: v.id('projects'),
    backupTimestamp: v.number()
  },
  handler: async (ctx, args) => {
    const rollbackLog = []
    
    try {
      // Step 1: Remove location references
      rollbackLog.push('Removing location references from vehicles...')
      const vehicles = await ctx.db
        .query('vehicles')
        .withIndex('by_project', q => q.eq('projectId', args.projectId))
        .collect()
      
      for (const vehicle of vehicles) {
        if (vehicle.startLocationId || vehicle.endLocationId) {
          await ctx.db.patch(vehicle._id, {
            startLocationId: undefined,
            endLocationId: undefined,
            updatedAt: Date.now()
          })
        }
      }
      
      // Step 2: Remove job location references
      rollbackLog.push('Removing location references from jobs...')
      const jobs = await ctx.db
        .query('jobs')
        .withIndex('by_project', q => q.eq('projectId', args.projectId))
        .collect()
      
      for (const job of jobs) {
        if (job.locationId) {
          await ctx.db.patch(job._id, {
            locationId: undefined,
            updatedAt: Date.now()
          })
        }
      }
      
      // Step 3: Delete created locations
      rollbackLog.push('Deleting created locations...')
      const locations = await ctx.db
        .query('locations')
        .withIndex('by_project', q => q.eq('projectId', args.projectId))
        .filter(q => q.gte(q.field('_creationTime'), args.backupTimestamp))
        .collect()
      
      for (const location of locations) {
        await ctx.db.delete(location._id)
      }
      
      rollbackLog.push(`Rollback completed. Removed ${locations.length} locations`)
      
      return {
        success: true,
        rollbackLog,
        removedLocations: locations.length
      }
    } catch (error) {
      rollbackLog.push(`Rollback failed: ${error.message}`)
      return {
        success: false,
        rollbackLog,
        error: error.message
      }
    }
  }
})
```

## Post-Migration Tasks

### 1. Code Updates

#### Update Component Imports
```typescript
// Before migration
import { VehicleForm } from '@/components/vehicles/VehicleForm'

// After migration
import { VehicleForm } from '@/components/vehicles/VehicleForm'
import { LocationPicker } from '@/components/locations/LocationPicker'

// Updated vehicle form
function VehicleForm({ vehicle, onSave }: VehicleFormProps) {
  return (
    <form>
      {/* Replace coordinate inputs with location pickers */}
      <LocationPicker
        label="Start Location"
        value={vehicle.startLocationId}
        onChange={(locationId) => setVehicle(prev => ({ ...prev, startLocationId: locationId }))}
        datasetId={datasetId}
      />
      
      <LocationPicker
        label="End Location"
        value={vehicle.endLocationId}
        onChange={(locationId) => setVehicle(prev => ({ ...prev, endLocationId: locationId }))}
        datasetId={datasetId}
      />
    </form>
  )
}
```

#### Update API Calls
```typescript
// Before migration
const vehicle = {
  description: 'Delivery Van',
  startLat: 37.7749,
  startLon: -122.4194,
  endLat: 37.7849,
  endLon: -122.4094
}

// After migration
const vehicle = {
  description: 'Delivery Van',
  startLocationId: 'location_123',
  endLocationId: 'location_456'
}
```

### 2. Database Cleanup

#### Remove Deprecated Fields
```typescript
export const cleanupDeprecatedFields = mutation({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    // Note: Convex doesn't support dropping fields directly
    // This would be handled at the application level by not using the fields
    
    const cleanupLog = []
    
    // Update application to ignore deprecated coordinate fields
    cleanupLog.push('Deprecated coordinate fields are now ignored by application')
    cleanupLog.push('Fields will be cleaned up in next schema migration')
    
    return {
      success: true,
      cleanupLog
    }
  }
})
```

### 3. Performance Optimization

#### Update Indexes
```typescript
// Add new indexes for location references
export default defineSchema({
  vehicles: defineTable({
    // ... existing fields
    startLocationId: v.optional(v.id('locations')),
    endLocationId: v.optional(v.id('locations')),
  })
    .index('by_start_location', ['startLocationId'])
    .index('by_end_location', ['endLocationId']),
    
  jobs: defineTable({
    // ... existing fields
    locationId: v.optional(v.id('locations')),
  })
    .index('by_location', ['locationId']),
    
  locations: defineTable({
    // ... location fields
  })
    .index('by_project', ['projectId'])
    .index('by_type', ['locationType'])
    .index('by_usage', ['usageCount'])
})
```

## Testing and Validation

### 1. Migration Testing Checklist

- [ ] **Dry Run Execution**: Test migration without making changes
- [ ] **Data Integrity**: Verify all references are correctly established
- [ ] **Performance Testing**: Ensure application performance after migration
- [ ] **User Acceptance Testing**: Test UI functionality with new location system
- [ ] **Rollback Testing**: Verify rollback procedures work correctly
- [ ] **API Testing**: Test all API endpoints with new data structure
- [ ] **Integration Testing**: Test integration with external systems

### 2. Validation Queries

```sql
-- Validate location coverage
SELECT 
  COUNT(*) as total_vehicles,
  COUNT(startLocationId) as vehicles_with_start,
  COUNT(endLocationId) as vehicles_with_end
FROM vehicles 
WHERE projectId = 'project_123';

-- Check for orphaned references
SELECT v._id 
FROM vehicles v 
LEFT JOIN locations l ON v.startLocationId = l._id 
WHERE v.startLocationId IS NOT NULL AND l._id IS NULL;

-- Validate location usage
SELECT 
  l.name,
  l.usageCount,
  (SELECT COUNT(*) FROM vehicles WHERE startLocationId = l._id OR endLocationId = l._id) +
  (SELECT COUNT(*) FROM jobs WHERE locationId = l._id) as actual_usage
FROM locations l
WHERE actual_usage != l.usageCount;
```

## Monitoring and Alerts

### 1. Migration Monitoring

```typescript
// Migration progress monitoring
export const getMigrationProgress = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const vehicles = await ctx.db.query('vehicles')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))
      .collect()
      
    const jobs = await ctx.db.query('jobs')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))
      .collect()
      
    const locations = await ctx.db.query('locations')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))
      .collect()
    
    return {
      vehicles: {
        total: vehicles.length,
        withStartLocation: vehicles.filter(v => v.startLocationId).length,
        withEndLocation: vehicles.filter(v => v.endLocationId).length
      },
      jobs: {
        total: jobs.length,
        withLocation: jobs.filter(j => j.locationId).length
      },
      locations: {
        total: locations.length,
        geocoded: locations.filter(l => l.geocodeQuality !== 'manual').length
      }
    }
  }
})
```

### 2. Health Checks

```typescript
// Post-migration health check
export const postMigrationHealthCheck = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const issues = []
    
    // Check for orphaned references
    const orphanedVehicles = await findOrphanedVehicleReferences(ctx, args.projectId)
    if (orphanedVehicles.length > 0) {
      issues.push({
        type: 'orphaned_references',
        entity: 'vehicles',
        count: orphanedVehicles.length
      })
    }
    
    // Check for missing coordinates
    const locationsWithoutCoords = await ctx.db
      .query('locations')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))
      .filter(q => q.or(
        q.eq(q.field('locationLat'), undefined),
        q.eq(q.field('locationLon'), undefined)
      ))
      .collect()
      
    if (locationsWithoutCoords.length > 0) {
      issues.push({
        type: 'missing_coordinates',
        entity: 'locations',
        count: locationsWithoutCoords.length
      })
    }
    
    return {
      healthy: issues.length === 0,
      issues
    }
  }
})
```

---

**Migration Support**: migration-support@vrp-system.com  
**Emergency Rollback**: Available 24/7 during migration window  
**Documentation**: https://docs.vrp-system.com/migration