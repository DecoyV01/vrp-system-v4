# Time Window Data Migration Strategy

## Overview
This document outlines the strategy for migrating existing time window data from the old object-based format to the new VROOM-compliant array-based format.

## Data Format Changes

### Old Format (Pre-VROOM Compliance)
```typescript
// Jobs
timeWindows: [
  {start: 1600419600, end: 1600423200},
  {start: 1600430000, end: 1600433600}
]

// Vehicles  
twStart: 1600416000,
twEnd: 1600430400

// Shipments
pickupTimeWindows: [
  {start: 1600419600, end: 1600423200}
],
deliveryTimeWindows: [
  {start: 1600425000, end: 1600428600}
]
```

### New Format (VROOM-Compliant)
```typescript
// Jobs
timeWindows: [
  [1600419600, 1600423200],
  [1600430000, 1600433600]
]

// Vehicles
timeWindow: [1600416000, 1600430400]

// Shipments
pickupTimeWindows: [
  [1600419600, 1600423200]
],
deliveryTimeWindows: [
  [1600425000, 1600428600]
]
```

## Migration Strategy

### Phase 1: Backward Compatibility Support
1. **Schema Coexistence**: Temporarily support both formats during migration
2. **API Layer Conversion**: Convert old format to new format at API boundaries
3. **Frontend Updates**: Update UI components to handle new format

### Phase 2: Data Transformation
1. **Batch Migration Script**: Create script to convert all existing records
2. **Validation**: Ensure all converted data maintains semantic correctness
3. **Rollback Plan**: Maintain backup of original data format

### Phase 3: Cleanup
1. **Remove Old Fields**: Remove deprecated twStart/twEnd fields from schema
2. **Update Documentation**: Update all documentation to reflect new format
3. **Testing**: Comprehensive testing of all time window functionality

## Implementation Details

### Migration Script Structure
```typescript
// convex/migrations/timeWindowMigration.ts
import { internalMutation } from './_generated/server'

export const migrateTimeWindows = internalMutation({
  handler: async (ctx) => {
    // Migrate vehicles
    await migrateVehicleTimeWindows(ctx)
    
    // Migrate jobs
    await migrateJobTimeWindows(ctx)
    
    // Migrate shipments
    await migrateShipmentTimeWindows(ctx)
  }
})

const migrateVehicleTimeWindows = async (ctx) => {
  const vehicles = await ctx.db.query('vehicles').collect()
  
  for (const vehicle of vehicles) {
    if (vehicle.twStart && vehicle.twEnd) {
      await ctx.db.patch(vehicle._id, {
        timeWindow: [vehicle.twStart, vehicle.twEnd],
        // Keep old fields temporarily for rollback
      })
    }
  }
}

const migrateJobTimeWindows = async (ctx) => {
  const jobs = await ctx.db.query('jobs').collect()
  
  for (const job of jobs) {
    if (job.timeWindows && job.timeWindows.length > 0) {
      // Convert [{start, end}] to [[start, end]]
      const newTimeWindows = job.timeWindows.map(tw => [tw.start, tw.end])
      
      await ctx.db.patch(job._id, {
        timeWindows: newTimeWindows
      })
    }
  }
}

const migrateShipmentTimeWindows = async (ctx) => {
  const shipments = await ctx.db.query('shipments').collect()
  
  for (const shipment of shipments) {
    const updates = {}
    
    if (shipment.pickupTimeWindows && shipment.pickupTimeWindows.length > 0) {
      updates.pickupTimeWindows = shipment.pickupTimeWindows.map(tw => [tw.start, tw.end])
    }
    
    if (shipment.deliveryTimeWindows && shipment.deliveryTimeWindows.length > 0) {
      updates.deliveryTimeWindows = shipment.deliveryTimeWindows.map(tw => [tw.start, tw.end])
    }
    
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(shipment._id, updates)
    }
  }
}
```

### Validation Functions
```typescript
// Validation to ensure successful migration
export const validateTimeWindowMigration = async (ctx) => {
  const vehicles = await ctx.db.query('vehicles').collect()
  const jobs = await ctx.db.query('jobs').collect()
  const shipments = await ctx.db.query('shipments').collect()
  
  // Check vehicles
  const vehicleErrors = vehicles.filter(v => 
    v.twStart && v.twEnd && (!v.timeWindow || v.timeWindow.length !== 2)
  )
  
  // Check jobs
  const jobErrors = jobs.filter(j => 
    j.timeWindows && j.timeWindows.some(tw => 
      !Array.isArray(tw) || tw.length !== 2
    )
  )
  
  // Check shipments
  const shipmentErrors = shipments.filter(s => 
    (s.pickupTimeWindows && s.pickupTimeWindows.some(tw => 
      !Array.isArray(tw) || tw.length !== 2
    )) ||
    (s.deliveryTimeWindows && s.deliveryTimeWindows.some(tw => 
      !Array.isArray(tw) || tw.length !== 2
    ))
  )
  
  return {
    vehicleErrors: vehicleErrors.length,
    jobErrors: jobErrors.length,
    shipmentErrors: shipmentErrors.length,
    totalErrors: vehicleErrors.length + jobErrors.length + shipmentErrors.length
  }
}
```

## Rollback Plan

### Emergency Rollback
```typescript
export const rollbackTimeWindowMigration = internalMutation({
  handler: async (ctx) => {
    // Rollback vehicles
    const vehicles = await ctx.db.query('vehicles').collect()
    for (const vehicle of vehicles) {
      if (vehicle.timeWindow && vehicle.twStart && vehicle.twEnd) {
        await ctx.db.patch(vehicle._id, {
          timeWindow: undefined, // Remove new field
          // Keep twStart/twEnd intact
        })
      }
    }
    
    // Rollback jobs - restore from backup if needed
    // Rollback shipments - restore from backup if needed
  }
})
```

## Testing Strategy

### Pre-Migration Testing
1. **Data Integrity Check**: Verify all existing time window data is valid
2. **Backup Creation**: Create full database backup before migration
3. **Migration Simulation**: Test migration on development environment

### Post-Migration Testing
1. **Data Validation**: Ensure all time windows are in correct format
2. **Functional Testing**: Test all CRUD operations with new format
3. **Integration Testing**: Verify VROOM API integration works correctly
4. **Performance Testing**: Ensure migration doesn't impact performance

## Migration Timeline

### Phase 1: Preparation (1-2 days)
- [x] Update schema with new time window formats
- [x] Update validation functions
- [x] Update CRUD operations
- [ ] Create migration scripts
- [ ] Test migration on development data

### Phase 2: Migration Execution (1 day)
- [ ] Create database backup
- [ ] Run migration scripts
- [ ] Validate migrated data
- [ ] Update frontend components

### Phase 3: Cleanup (1 day)
- [ ] Remove deprecated fields from schema
- [ ] Update documentation
- [ ] Complete integration testing
- [ ] Deploy to production

## Success Criteria

1. **Data Integrity**: All existing time window data successfully converted
2. **Functional Compatibility**: All time window operations work with new format
3. **VROOM Integration**: Full compatibility with VROOM API requirements
4. **Performance**: No degradation in query or mutation performance
5. **Zero Downtime**: Migration completed without service interruption

## Risk Mitigation

1. **Data Loss**: Complete backup before migration
2. **Format Errors**: Comprehensive validation and testing
3. **Rollback Issues**: Tested rollback procedures
4. **Performance Impact**: Staged migration with monitoring
5. **Integration Failures**: Extensive VROOM API testing

## Notes

- Migration should be performed during low-traffic periods
- Monitor system performance during and after migration
- Keep migration logs for audit purposes
- Update all documentation to reflect new format
- Train development team on new time window format