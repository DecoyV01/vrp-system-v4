# Frontend Testing Setup - VRP System v4

## 🎯 Overview

Complete setup guide for frontend testing using **Vitest** + **React Testing Library** for the VRP System v4 React application.

## 📦 Dependencies Installation

```bash
cd frontend

# Core testing dependencies
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# Additional utilities
npm install --save-dev @vitest/ui happy-dom @types/testing-library__jest-dom
```

## ⚙️ Configuration Files

### 1. Vitest Configuration (`frontend/vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.git'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/pages': path.resolve(__dirname, './src/pages')
    }
  }
})
```

### 2. Test Setup File (`frontend/src/test/setup.ts`)

```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Convex client
vi.mock('@/lib/convex', () => ({
  convex: {
    query: vi.fn(),
    mutation: vi.fn()
  }
}))

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
    useLocation: () => ({ pathname: '/' })
  }
})

// Mock zustand stores
vi.mock('@/stores/useSidebarStore', () => ({
  useSidebarStore: () => ({
    isCollapsed: false,
    toggle: vi.fn(),
    collapse: vi.fn(),
    expand: vi.fn()
  })
}))

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})
```

### 3. TypeScript Configuration Update (`frontend/tsconfig.json`)

Add to `compilerOptions`:
```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

## 📝 Package.json Scripts

Add to `frontend/package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run"
  }
}
```

## 🧪 Test Utilities

### Custom Render Function (`frontend/src/test/test-utils.tsx`)

```typescript
import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ConvexProvider } from 'convex/react'
import { convex } from '@/lib/convex'

// Mock providers wrapper
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <ConvexProvider client={convex}>
        {children}
      </ConvexProvider>
    </BrowserRouter>
  )
}

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

### Mock Data Factory (`frontend/src/test/mock-data.ts`)

```typescript
import type { Id } from '../../convex/_generated/dataModel'

export const createMockProject = (overrides = {}) => ({
  _id: 'project_123' as Id<'projects'>,
  _creationTime: Date.now(),
  name: 'Test Project',
  description: 'Test project description',
  userId: 'user_123',
  updatedAt: Date.now(),
  ...overrides
})

export const createMockVehicle = (overrides = {}) => ({
  _id: 'vehicle_123' as Id<'vehicles'>,
  _creationTime: Date.now(),
  projectId: 'project_123' as Id<'projects'>,
  datasetId: 'dataset_123' as Id<'datasets'>,
  capacity: [1000, 500],
  startLat: 40.7128,
  startLon: -74.0060,
  description: 'Test Vehicle',
  optimizerId: 'vehicle_1',
  updatedAt: Date.now(),
  ...overrides
})

export const createMockJob = (overrides = {}) => ({
  _id: 'job_123' as Id<'jobs'>,
  _creationTime: Date.now(),
  projectId: 'project_123' as Id<'projects'>,
  datasetId: 'dataset_123' as Id<'datasets'>,
  locationId: 'location_123',
  delivery: [100, 50],
  service: 300,
  timeWindows: [[28800, 32400]],
  description: 'Test Job',
  optimizerId: 'job_1',
  updatedAt: Date.now(),
  ...overrides
})
```

## 🏃‍♂️ Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests once (CI mode)
npm run test:run
```

## 📊 Coverage Configuration

Vitest will generate coverage reports in `frontend/coverage/`:
- **HTML Report**: `coverage/index.html`
- **JSON Report**: `coverage/coverage.json`
- **Text Summary**: Console output

## 🎯 Next Steps

1. Create test files following the pattern: `ComponentName.test.tsx`
2. Place tests next to source files or in `__tests__` folders
3. Use the custom render function for component tests
4. Use mock data factory for consistent test data
5. Follow TDD workflow: Red → Green → Refactor

## 📚 Testing Patterns

### Component Testing
```typescript
import { render, screen, fireEvent } from '@/test/test-utils'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })
})
```

### Hook Testing
```typescript
import { renderHook, act } from '@testing-library/react'
import { useVehicleStatus } from '@/hooks/useVRPData'

describe('useVehicleStatus', () => {
  it('should calculate vehicle statistics', () => {
    const { result } = renderHook(() => useVehicleStatus('dataset_123'))
    
    expect(result.current.isLoading).toBe(true)
  })
})
```