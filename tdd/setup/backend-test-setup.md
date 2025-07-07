# Backend Testing Setup - Convex Functions

## 🎯 Overview

Complete setup guide for testing Convex functions in VRP System v4 using Convex's built-in testing framework.

## 📦 Convex Testing Framework

Convex provides built-in testing capabilities:
```bash
# Run Convex tests
npx convex test

# Run tests in watch mode
npx convex test --watch

# Run specific test file
npx convex test vehicles.test.ts
```

## 📁 Test File Organization

```
convex/
├── vehicles.ts                 # Source function
├── vehicles.test.ts            # Test file
├── jobs.ts                     # Source function
├── jobs.test.ts               # Test file
└── __tests__/                 # Alternative test directory
    ├── validation.test.ts     # Validation tests
    └── helpers.ts             # Test utilities
```

## 🧪 Basic Test Structure

```typescript
// convex/vehicles.test.ts
import { test, expect } from 'convex/testing'
import { createVehicle, getVehicles } from './vehicles'
import { Id } from './_generated/dataModel'

test('createVehicle should create vehicle with valid data', async () => {
  const result = await createVehicle({
    projectId: 'project_123' as Id<'projects'>,
    datasetId: 'dataset_123' as Id<'datasets'>,
    capacity: [1000, 500],
    startLat: 40.7128,
    startLon: -74.0060,
    optimizerId: 'vehicle_1',
    description: 'Test Vehicle'
  })
  
  expect(result).toBeDefined()
  expect(result.capacity).toEqual([1000, 500])
  expect(result.optimizerId).toBe('vehicle_1')
})
```

## 🔧 Test Configuration

### convex.json Testing Configuration
```json
{
  "functions": "convex/",
  "testing": {
    "timeout": 5000,
    "verbose": true
  }
}
```

## 🎯 Testing Patterns for VRP System

### 1. CRUD Operations Testing
```typescript
test('vehicle CRUD operations', async () => {
  // Create
  const vehicle = await createVehicle(validVehicleData)
  expect(vehicle._id).toBeDefined()
  
  // Read
  const retrieved = await getVehicle(vehicle._id)
  expect(retrieved).toEqual(vehicle)
  
  // Update
  const updated = await updateVehicle(vehicle._id, { capacity: [2000] })
  expect(updated.capacity).toEqual([2000])
  
  // Delete
  await deleteVehicle(vehicle._id)
  const deleted = await getVehicle(vehicle._id)
  expect(deleted).toBeNull()
})
```

### 2. Validation Testing
```typescript
test('vehicle validation should reject invalid data', async () => {
  await expect(createVehicle({
    projectId: 'invalid_id',
    capacity: [-100], // Invalid negative capacity
    startLat: 200 // Invalid latitude
  })).rejects.toThrow('Invalid vehicle data')
})
```

### 3. Business Logic Testing
```typescript
test('vehicle capacity calculation', async () => {
  const vehicle = await createVehicle({
    capacity: [1000, 500, 200]
  })
  
  const totalCapacity = calculateTotalCapacity(vehicle)
  expect(totalCapacity).toBe(1700)
})
```

## 📊 Coverage and Reporting

Convex testing includes:
- **Execution Time**: Function performance metrics
- **Error Handling**: Exception testing
- **Database State**: Transaction rollbacks for isolation

## 🚀 Next Steps

1. Create test files for each Convex function
2. Follow TDD workflow: Red → Green → Refactor
3. Test error conditions and edge cases
4. Use descriptive test names
5. Group related tests with describe blocks