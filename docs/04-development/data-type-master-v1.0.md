# Data Type Master - VRP System

**Document Version:** 1.0  
**Last Updated:** 2025-01-04  
**Status:** Active  
**Scope:** Optimization Engine to Convex Data Type Conversion Guide

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|----------|
| 1.0 | 2025-01-04 | System | Initial version - Generic optimization engine compatibility guide |
| 0.9 | 2025-01-04 | System | VROOM-specific version (deprecated) |

---

# Optimization Engine to Convex Data Type Conversion Guide

## 🚨 Critical Compatibility Issues & Solutions

*The following examples use VROOM API as reference, but apply to most optimization engines*

### 1. **❌ INTEGER-ONLY COSTS (Common Optimization Engine Limitation)**
**Issue**: Many optimization APIs (like VROOM) require all cost values to be integers
**Impact**: Cannot store decimal currency values directly
**Solution**: Store costs as **cents/pence** in Convex (multiply by 100)

```typescript
// ❌ WRONG - Many optimization engines will reject decimals
costFixed: v.number(),  // 50.75 → API error

// ✅ CORRECT - Store as integer cents
costFixed: v.number(),  // 5075 (represents $50.75)

// Conversion functions needed:
const toCents = (dollars: number) => Math.round(dollars * 100);
const toDollars = (cents: number) => cents / 100;
```

### 2. **❌ TIME FORMAT MISMATCH**
**Issue**: Convex uses milliseconds, many optimization engines require seconds
**Impact**: Direct values will be 1000x too large
**Solution**: Always convert in API layer

```typescript
// Convex stores milliseconds
timeWindowStart: v.number(),  // 1704067200000

// Optimization engine needs seconds
const vroomTimeWindow = [
  Math.floor(convexTime / 1000),  // Convert to seconds
  Math.floor(convexTimeEnd / 1000)
];
```

### 3. **❌ ID TYPE MISMATCH**
**Issue**: Convex uses string IDs, some optimization engines require numeric IDs
**Impact**: Cannot pass Convex IDs directly to optimization APIs
**Solution**: Create mapping tables or use numeric fields

```typescript
// Convex ID
id: v.id("vehicles"),  // "vhc_abc123def456"

// Optimization engine needs
optimizerVehicleId: v.number(),  // 1, 2, 3...

// Solution: Add optimizerId field to all optimization entities
vehicles: defineTable({
  optimizerId: v.number(),  // For optimization engine APIs
  // ... other fields
}).index("by_optimizer_id", ["optimizerId"])
```

### 4. **⚠️ PRIORITY RANGE DIFFERENCE**
**Issue**: Documentation shows 0-100, but some systems use 0-1000
**Impact**: Priority values might be scaled incorrectly
**Solution**: Verify with VROOM docs and normalize

```typescript
priority: v.optional(v.number()),  // Validate: 0-100 range
```

### 5. **⚠️ ARRAY LENGTH CONSTRAINTS**
**Issue**: Many optimization engines require capacity arrays to have exactly 3 elements
**Impact**: Variable-length arrays will cause errors
**Solution**: Enforce fixed-length arrays

```typescript
// ❌ WRONG - Variable length
capacity: v.array(v.number()),

// ✅ CORRECT - Fixed 3-element tuple (when Convex supports tuples)
// For now, validate in mutations:
capacity: v.array(v.number()),  // Validate length === 3 in code
```

## 📊 Complete Field Conversion Table

### Core Entities

| Optimization Field | Current Schema | Convex Type | Conversion Required | Notes |
|-------------|----------------|-------------|-------------------|--------|
| **VEHICLES** |
| `vehicle.id` | `id` | `v.id("vehicles")` + `optimizerId: v.number()` | ✅ ID mapping | Add numeric optimizerId field |
| `vehicle.start` | `startLon/startLat` | `startLon: v.optional(v.number())` | ✅ Array conversion | Combine to `[lon, lat]` |
| `vehicle.end` | `endLon/endLat` | `endLon: v.optional(v.number())` | ✅ Array conversion | Combine to `[lon, lat]` |
| `vehicle.capacity` | `capacity` | `v.optional(v.array(v.number()))` | ❌ Validation needed | Must be exactly 3 elements |
| `vehicle.skills` | `skills` | `v.optional(v.array(v.number()))` | ✅ Already numeric | Direct mapping |
| `vehicle.time_window` | `twStart/twEnd` | `twStart: v.optional(v.number())` | ✅ Time + Array | Seconds since midnight |
| `vehicle.costs.fixed` | `costFixed` | `v.optional(v.number())` | ⚠️ Integer only | Store as cents |
| `vehicle.costs.per_hour` | `costPerHour` | `v.optional(v.number())` | ⚠️ Integer only | Store as cents/hour |
| `vehicle.costs.per_km` | `costPerKm` | `v.optional(v.number())` | ⚠️ Integer only | Store as cents/km |
| `vehicle.max_distance` | `maxDistance` | `v.optional(v.number())` | ✅ Direct | Already in meters |
| `vehicle.max_travel_time` | `maxTravelTime` | `v.optional(v.number())` | ✅ Direct | Already in seconds |
| `vehicle.profile` | `profile` | `v.optional(v.string())` | ✅ Direct | "car", "truck", "bike" |
| **JOBS** |
| `job.id` | `id` | `v.id("jobs")` + `optimizerId: v.number()` | ✅ ID mapping | Add numeric optimizerId field |
| `job.location` | `locationLon/locationLat` | `locationLon: v.optional(v.number())` | ✅ Array conversion | Combine to `[lon, lat]` |
| `job.setup` | `setup` | `v.optional(v.number())` | ✅ Direct | Already in seconds |
| `job.service` | `service` | `v.optional(v.number())` | ✅ Direct | Already in seconds |
| `job.delivery` | `delivery` | `v.optional(v.array(v.number()))` | ❌ Validation needed | Must be 3 elements |
| `job.pickup` | `pickup` | `v.optional(v.array(v.number()))` | ❌ Validation needed | Must be 3 elements |
| `job.skills` | `skills` | `v.optional(v.array(v.number()))` | ✅ Already numeric | Direct mapping |
| `job.priority` | `priority` | `v.optional(v.number())` | ⚠️ Range check | Validate 0-100 |
| `job.time_windows` | `timeWindows` | `v.optional(v.array(v.object({start: v.number(), end: v.number()})))` | ✅ Time conversion | ms → seconds |
| **SHIPMENTS** |
| `shipment.id` | Missing | Add `optimizerId: v.number()` | ❌ Missing field | Need to add |
| `shipment.pickup` | `pickupLon/pickupLat` | Separate fields | ✅ Array conversion | Combine to `[lon, lat]` |
| `shipment.delivery` | `deliveryLon/deliveryLat` | Separate fields | ✅ Array conversion | Combine to `[lon, lat]` |
| `shipment.amount` | `amount` | `v.optional(v.array(v.number()))` | ❌ Validation needed | Must be 3 elements |
| `shipment.skills` | `skills` | `v.optional(v.array(v.number()))` | ✅ Already numeric | Direct mapping |
| `shipment.priority` | `priority` | `v.optional(v.number())` | ⚠️ Range check | Validate 0-100 |
| `shipment.pickup_setup` | `pickupSetup` | `v.optional(v.number())` | ✅ Direct | Already in seconds |
| `shipment.pickup_service` | `pickupService` | `v.optional(v.number())` | ✅ Direct | Already in seconds |
| `shipment.delivery_setup` | `deliverySetup` | `v.optional(v.number())` | ✅ Direct | Already in seconds |
| `shipment.delivery_service` | `deliveryService` | `v.optional(v.number())` | ✅ Direct | Already in seconds |
| `shipment.pickup_time_windows` | `pickupTimeWindows` | `v.optional(v.array(v.object({start: v.number(), end: v.number()})))` | ✅ Time conversion | ms → seconds |
| `shipment.delivery_time_windows` | `deliveryTimeWindows` | `v.optional(v.array(v.object({start: v.number(), end: v.number()})))` | ✅ Time conversion | ms → seconds |

## 🔧 Required Schema Updates

### 1. **Add VROOM ID Fields**
```typescript
// vehicles table
vehicles: defineTable({
  // Existing fields...
  vroomId: v.number(),  // ✅ ADD THIS for VROOM API
  // ...
}).index("by_vroom_id", ["vroomId"]),

// jobs table  
jobs: defineTable({
  // Existing fields...
  vroomId: v.number(),  // ✅ ADD THIS for VROOM API
  // ...
}).index("by_vroom_id", ["vroomId"]),

// shipments table (if implemented)
shipments: defineTable({
  // Existing fields...
  vroomId: v.number(),  // ✅ ADD THIS for VROOM API
  // ...
}).index("by_vroom_id", ["vroomId"]),
```

### 2. **Fix Time Window Storage**
```typescript
// Current schema has twStart/twEnd - keep but clarify units
vehicles: defineTable({
  // VROOM time windows (seconds since midnight)
  twStart: v.optional(v.number()),  // 25200 = 7:00 AM
  twEnd: v.optional(v.number()),    // 61200 = 5:00 PM
  // ...
}),
```

### 3. **Add Missing VROOM Fields**
```typescript
// Missing fields in current schema:
vehicles: defineTable({
  // Add these:
  breaks: v.optional(v.array(v.object({
    id: v.number(),
    time_windows: v.array(v.array(v.number())),
    service: v.optional(v.number()),
  }))),  // ✅ ADD for driver breaks
}),

// Route steps need more fields:
routeSteps: defineTable({
  // Add these:
  violations: v.optional(v.array(v.object({
    type: v.string(),
    cause: v.string(),
  }))),  // ✅ ADD for constraint violations
}),
```

### 4. **Enforce Capacity Validation**
```typescript
// In mutations, validate capacity arrays:
const validateCapacity = (capacity: number[]) => {
  if (capacity.length !== 3) {
    throw new Error("Capacity must have exactly 3 elements: [weight, volume, count]");
  }
  if (capacity.some(c => c < 0)) {
    throw new Error("Capacity values must be non-negative");
  }
};
```

## 🔄 Conversion Functions Required

### 1. **Convex → VROOM Converter**
```typescript
export const toVroomVehicle = (vehicle: Doc<"vehicles">) => ({
  id: vehicle.vroomId,
  start: [vehicle.startLon, vehicle.startLat],
  end: vehicle.endLon && vehicle.endLat 
    ? [vehicle.endLon, vehicle.endLat] 
    : undefined,
  capacity: vehicle.capacity,
  skills: vehicle.skills,
  time_window: vehicle.twStart && vehicle.twEnd
    ? [vehicle.twStart, vehicle.twEnd]  // Already in seconds
    : undefined,
  costs: {
    fixed: vehicle.costFixed || 0,
    per_hour: vehicle.costPerHour || 3600,  // VROOM default
    per_km: vehicle.costPerKm || 0,
  },
  max_distance: vehicle.maxDistance,
  max_travel_time: vehicle.maxTravelTime,
  profile: vehicle.profile,
});

export const toVroomJob = (job: Doc<"jobs">) => ({
  id: job.vroomId,
  location: [job.locationLon, job.locationLat],
  setup: job.setup,
  service: job.service,
  delivery: job.delivery,
  pickup: job.pickup,
  skills: job.skills,
  priority: job.priority,
  time_windows: job.timeWindows?.map(tw => [
    Math.floor(tw.start / 1000),  // ms → seconds
    Math.floor(tw.end / 1000),
  ]),
});
```

### 2. **VROOM → Convex Converter**
```typescript
export const fromVroomRoute = (route: VroomRoute, optimizationRunId: Id<"optimizationRuns">) => ({
  optimizationRunId,
  vehicleId: route.vehicle,  // This is the vroomId
  cost: route.cost,
  distance: route.distance,
  duration: route.duration,
  waitingTime: route.waiting_time,
  serviceTime: route.service,
  setupTime: route.setup,
  delivery: route.delivery,
  pickup: route.pickup,
  priority: route.priority,
  violations: route.violations,
  geometry: route.geometry,
});
```

## ⚠️ Critical Implementation Checklist

1. **[ ] Add vroomId fields** to vehicles, jobs, shipments tables
2. **[ ] Create ID mapping functions** for Convex ↔ VROOM conversion
3. **[ ] Implement cost conversion** (dollars ↔ cents)
4. **[ ] Add time conversion utilities** (milliseconds ↔ seconds)
5. **[ ] Validate array lengths** for capacity/delivery/pickup (must be 3)
6. **[ ] Validate priority range** (0-100)
7. **[ ] Store time windows correctly** (seconds since midnight for vehicles)
8. **[ ] Add missing VROOM fields** (breaks, violations, etc.)
9. **[ ] Create conversion layer** between Convex and VROOM formats
10. **[ ] Handle coordinate arrays** (separate fields ↔ [lon, lat])

## 🚀 Implementation Status

✅ **Completed:**
1. **Updated schema.ts** with optimizerId fields for vehicles, jobs, shipments
2. **Created conversion utilities** in `/convex/optimizerValidation.ts`
3. **Added validation functions** for optimization engine constraints
4. **Implemented generic naming** to support multiple optimization engines
5. **Removed deprecated createdAt fields** (use Convex `_creationTime`)

⏳ **Next Steps:**
1. **Test with actual optimization APIs** to verify compatibility
2. **Add support for additional engines** (OR-Tools, Gurobi, etc.)
3. **Document engine-specific constraints** as they are discovered
4. **Implement conversion layer** in optimization functions