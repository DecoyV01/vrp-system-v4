// Placeholder VRP Data Hooks for Phase 1
// These will be implemented in Phase 2 when the Convex backend schema is created

// Mock data types for development (will be used in Phase 2)
// type MockProject = {
//   _id: string
//   name: string
//   description?: string
//   ownerId: string
//   createdAt: number
//   updatedAt: number
// }

// type MockScenario = {
//   _id: string
//   projectId: string
//   name: string
//   description?: string
//   createdAt: number
//   updatedAt: number
// }

// type MockDataset = {
//   _id: string
//   scenarioId: string
//   name: string
//   version: number
//   createdAt: number
// }

// Project hooks (mock implementations)
export const useProjects = () => {
  // Mock data for development - replace with real Convex query in Phase 2
  return []
}

export const useProject = (_projectId: string) => {
  // Mock implementation - replace with real Convex query in Phase 2
  return null
}

export const useCreateProject = () => {
  return async (args: { name: string; description?: string }) => {
    // Mock implementation - replace with real Convex mutation in Phase 2
    console.log('Mock create project:', args)
    return Promise.resolve({ _id: 'mock-id' })
  }
}

export const useUpdateProject = () => {
  return async (args: { projectId: string; name?: string; description?: string }) => {
    // Mock implementation - replace with real Convex mutation in Phase 2
    console.log('Mock update project:', args)
    return Promise.resolve()
  }
}

export const useDeleteProject = () => {
  return async (args: { projectId: string }) => {
    // Mock implementation - replace with real Convex mutation in Phase 2
    console.log('Mock delete project:', args)
    return Promise.resolve()
  }
}

// Scenarios hooks (mock implementations)
export const useScenarios = (_projectId: string) => {
  // Mock implementation - replace with real Convex query in Phase 2
  return []
}

export const useCreateScenario = () => {
  return async (args: { projectId: string; name: string; description?: string }) => {
    console.log('Mock create scenario:', args)
    return Promise.resolve({ _id: 'mock-id' })
  }
}

export const useUpdateScenario = () => {
  return async (args: { scenarioId: string; name?: string; description?: string }) => {
    console.log('Mock update scenario:', args)
    return Promise.resolve()
  }
}

export const useDeleteScenario = () => {
  return async (args: { scenarioId: string }) => {
    console.log('Mock delete scenario:', args)
    return Promise.resolve()
  }
}

// Datasets hooks (mock implementations)
export const useDatasets = (_scenarioId: string) => {
  // Mock implementation - replace with real Convex query in Phase 2
  return []
}

export const useCreateDataset = () => {
  return async (args: { scenarioId: string; name: string; version: number }) => {
    console.log('Mock create dataset:', args)
    return Promise.resolve({ _id: 'mock-id' })
  }
}

export const useUpdateDataset = () => {
  return async (args: { datasetId: string; name?: string }) => {
    console.log('Mock update dataset:', args)
    return Promise.resolve()
  }
}

export const useDeleteDataset = () => {
  return async (args: { datasetId: string }) => {
    console.log('Mock delete dataset:', args)
    return Promise.resolve()
  }
}

// VRP Data hooks (mock implementations)
export const useVehicles = (_datasetId: string) => {
  // Mock implementation - replace with real Convex query in Phase 2
  return []
}

export const useJobs = (_datasetId: string) => {
  // Mock implementation - replace with real Convex query in Phase 2
  return []
}

export const useLocations = (_datasetId: string) => {
  // Mock implementation - replace with real Convex query in Phase 2
  return []
}

export const useRoutes = (_datasetId: string) => {
  // Mock implementation - replace with real Convex query in Phase 2
  return []
}