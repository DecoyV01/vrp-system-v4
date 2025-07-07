# Testing Strategies for VRP System v4

## 🎯 Testing Pyramid for VRP

### 1. Unit Tests (70%)
**Focus**: Individual functions, hooks, utilities
**Speed**: Very fast (< 1ms)
**Scope**: Single component/function

```typescript
// Example: Pure function testing
describe('calculateDistance', () => {
  it('should calculate distance between coordinates', () => {
    const distance = calculateDistance(
      { lat: 40.7128, lon: -74.0060 },
      { lat: 41.8781, lon: -87.6298 }
    )
    expect(distance).toBeCloseTo(790.47, 2)
  })
})
```

### 2. Integration Tests (20%)
**Focus**: Component interactions, API integration
**Speed**: Medium (10-100ms)
**Scope**: Multiple components working together

```typescript
// Example: Hook + API integration
describe('Vehicle Data Integration', () => {
  it('should load and display vehicle data', async () => {
    render(<VehicleList datasetId="test_dataset" />)
    
    await waitFor(() => {
      expect(screen.getByText('Vehicle 1')).toBeInTheDocument()
    })
  })
})
```

### 3. E2E Tests (10%)
**Focus**: Complete user workflows
**Speed**: Slow (1-10s)
**Scope**: Full application flows

```typescript
// Example: Complete VRP workflow
test('User can create optimization scenario', async () => {
  await page.goto('/projects')
  await page.click('[data-testid=create-project]')
  await page.fill('[data-testid=project-name]', 'Test Project')
  // ... complete workflow
})
```

## 🧪 Testing Categories for VRP System

### Business Logic Tests
**Priority**: High
**Coverage**: 100%

- Vehicle capacity calculations
- Route optimization validation
- Time window constraints
- Job assignment logic

### Data Validation Tests  
**Priority**: High
**Coverage**: 100%

- Input sanitization
- Schema validation
- Constraint checking
- Error handling

### UI Component Tests
**Priority**: Medium
**Coverage**: 80%

- Component rendering
- User interactions
- State updates
- Props handling

### Integration Tests
**Priority**: Medium
**Coverage**: Key workflows

- Convex queries/mutations
- Real-time updates
- Error boundaries
- Authentication flows

## 🎯 Test Organization Strategy

### By Feature (Recommended)
```
tests/
├── vehicles/
│   ├── creation.test.ts
│   ├── validation.test.ts
│   └── optimization.test.ts
├── jobs/
│   ├── scheduling.test.ts
│   └── constraints.test.ts
└── routes/
    ├── calculation.test.ts
    └── display.test.ts
```

### Test Naming Convention
```typescript
// Pattern: [Function]_[Scenario]_[Expected]
describe('createVehicle', () => {
  it('should_createVehicle_whenValidData_thenReturnVehicleId', () => {})
  it('should_throwError_whenInvalidCapacity_thenRejectWithMessage', () => {})
})
```

## 📊 Coverage Targets

### Critical Functions (100%)
- Vehicle/Job CRUD operations
- Validation logic
- Optimization calculations
- Data transformations

### Business Logic (95%)
- Route planning algorithms
- Constraint checking
- Cost calculations
- Time window validation

### UI Components (80%)
- TableEditor interactions
- Form validations
- Modal behaviors
- Navigation flows

### Integration Points (90%)
- Convex function calls
- Real-time updates
- Error handling
- Authentication

## 🚀 Testing Tools by Layer

### Unit Tests
- **Vitest**: Fast test runner
- **Testing Library**: React component testing
- **Mock Service Worker**: API mocking

### Integration Tests  
- **Testing Library**: Component integration
- **Convex Testing**: Database integration
- **React Router**: Navigation testing

### E2E Tests
- **Playwright**: Browser automation
- **Convex Dev**: Real backend testing

## 🎨 Mock Strategies

### 1. Mock External Dependencies
```typescript
// Mock Convex client
vi.mock('convex/react', () => ({
  useQuery: vi.fn(() => mockData),
  useMutation: vi.fn(() => mockMutation)
}))
```

### 2. Use Test Doubles
```typescript
// Stub for optimization engine
const mockOptimizer = {
  solve: vi.fn().mockResolvedValue(mockRoutes)
}
```

### 3. Factory Functions
```typescript
// Consistent test data
const createMockVehicle = (overrides = {}) => ({
  capacity: [1000],
  startLat: 40.7128,
  ...overrides
})
```

## 📈 Testing Workflow

### Development Workflow
1. **Write failing test** (RED)
2. **Implement minimal code** (GREEN)  
3. **Refactor and optimize** (REFACTOR)
4. **Run full test suite**
5. **Check coverage report**

### CI/CD Integration
```bash
# Pre-commit hooks
npm run test:unit
npm run lint
npm run type-check

# CI Pipeline
npm run test:all
npm run test:coverage
npm run build
```

### Performance Monitoring
- Track test execution time
- Monitor coverage trends
- Identify slow tests
- Optimize test suite