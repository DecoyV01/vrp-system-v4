# TDD Red-Green-Refactor Workflow

## 🎯 The TDD Cycle

### 🔴 RED: Write a Failing Test
1. **Write the test first** - before any implementation code
2. **Make it specific** - test one behavior at a time
3. **Run the test** - it should fail (red)
4. **Verify failure reason** - ensure it fails for the right reason

### 🟢 GREEN: Make the Test Pass
1. **Write minimal code** - just enough to make the test pass
2. **Don't worry about perfection** - focus on making it work
3. **Run the test** - it should pass (green)
4. **Don't add extra functionality** - resist the urge to over-engineer

### 🔄 REFACTOR: Improve the Code
1. **Clean up the code** - improve structure, naming, performance
2. **Keep tests green** - all tests must continue passing
3. **Remove duplication** - DRY principle
4. **Improve readability** - make code self-documenting

## 📋 VRP System TDD Examples

### Example 1: Vehicle Creation

#### 🔴 RED - Write Failing Test
```typescript
describe('createVehicle', () => {
  it('should create vehicle with capacity', async () => {
    const vehicle = await createVehicle(ctx, {
      projectId: 'proj_1',
      capacity: [1000],
      optimizerId: 'v1'
    })
    
    expect(vehicle.capacity).toEqual([1000])
  })
})
```

#### 🟢 GREEN - Minimal Implementation
```typescript
export const createVehicle = mutation({
  args: { projectId: v.string(), capacity: v.array(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db.insert('vehicles', {
      ...args,
      updatedAt: Date.now()
    })
  }
})
```

#### 🔄 REFACTOR - Improve Code
```typescript
export const createVehicle = mutation({
  args: vehicleInsertSchema,
  handler: async (ctx, args) => {
    validateVehicleData(args)
    
    return await ctx.db.insert('vehicles', {
      ...args,
      updatedAt: Date.now()
    })
  }
})
```

### Example 2: Hook Testing

#### 🔴 RED - Write Failing Test
```typescript
it('should calculate vehicle utilization', () => {
  const { result } = renderHook(() => useVehicleStatus())
  
  expect(result.current.averageUtilization).toBe(75)
})
```

#### 🟢 GREEN - Minimal Implementation
```typescript
export const useVehicleStatus = () => {
  return { averageUtilization: 75 }
}
```

#### 🔄 REFACTOR - Real Implementation
```typescript
export const useVehicleStatus = (datasetId: string) => {
  const vehicles = useVehicles(datasetId)
  
  const averageUtilization = useMemo(() => {
    if (!vehicles?.length) return 0
    const total = vehicles.reduce((sum, v) => sum + calculateUtilization(v), 0)
    return Math.round(total / vehicles.length)
  }, [vehicles])
  
  return { averageUtilization }
}
```

## 🎯 TDD Best Practices for VRP System

### 1. Start Small
- Test one behavior at a time
- Use descriptive test names
- Keep test setup minimal

### 2. Test Behavior, Not Implementation
```typescript
// ❌ Testing implementation
expect(createVehicle).toHaveBeenCalledWith(expect.any(Object))

// ✅ Testing behavior  
expect(result.capacity).toEqual([1000])
```

### 3. Use AAA Pattern
```typescript
it('should validate vehicle capacity', () => {
  // Arrange
  const invalidVehicle = { capacity: [-100] }
  
  // Act & Assert
  expect(() => validateVehicle(invalidVehicle)).toThrow('Invalid capacity')
})
```

### 4. Keep Tests Independent
- Each test should run in isolation
- Use fresh data for each test
- Clean up after tests

## 🚀 TDD Workflow Commands

```bash
# 1. Run tests in watch mode
npm run test:watch

# 2. Write failing test
# 3. Run tests (should fail)
npm run test

# 4. Write minimal implementation
# 5. Run tests (should pass)
npm run test

# 6. Refactor code
# 7. Run tests (should still pass)
npm run test

# 8. Repeat cycle
```

## 📈 Benefits of TDD for VRP System

1. **Confidence**: Tests ensure code works as expected
2. **Design**: Writing tests first improves API design
3. **Documentation**: Tests serve as living documentation
4. **Regression**: Prevents breaking existing functionality
5. **Refactoring**: Safe to improve code with test coverage