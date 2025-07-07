import { vi } from 'vitest'

// Zustand store mocks
export const mockSidebarStore = () => ({
  isCollapsed: false,
  toggle: vi.fn(),
  collapse: vi.fn(),
  expand: vi.fn()
})

// Convex hooks mocks
export const mockConvexHooks = () => ({
  useQuery: vi.fn(() => undefined),
  useMutation: vi.fn(() => vi.fn()),
  useConvex: vi.fn(() => ({
    query: vi.fn(),
    mutation: vi.fn()
  }))
})

// DOM API mocks
export const setupDOMMocks = () => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn()
    }))
  })
}