import type { Id } from '../../convex/_generated/dataModel'

// Mock data factory for consistent test data
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