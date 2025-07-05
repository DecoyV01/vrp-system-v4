import { useQuery, useMutation } from 'convex/react'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import { useEffect } from 'react'

// =============================================================================
// PROJECT HOOKS
// =============================================================================

export const useProjects = () => {
  const projects = useQuery(api.projects.list)
  
  // Update UAT health check with projects load state
  useEffect(() => {
    if (import.meta.env.DEV && (window as any).__UAT_HEALTH__) {
      if (projects === undefined) {
        (window as any).__UAT_HEALTH__.setLoadState('projects', 'loading')
      } else if (projects === null) {
        (window as any).__UAT_HEALTH__.setLoadState('projects', 'error')
      } else {
        (window as any).__UAT_HEALTH__.setLoadState('projects', 'success')
      }
    }
  }, [projects])
  
  return projects
}

export const useProject = (projectId: Id<"projects"> | undefined) => {
  return useQuery(
    api.projects.getById,
    projectId ? { id: projectId } : 'skip'
  )
}

export const useProjectStats = (projectId: Id<"projects"> | undefined) => {
  return useQuery(
    api.projects.getStats,
    projectId ? { id: projectId } : 'skip'
  )
}

export const useCreateProject = () => {
  return useMutation(api.projects.create)
}

export const useUpdateProject = () => {
  return useMutation(api.projects.update)
}

export const useDeleteProject = () => {
  return useMutation(api.projects.remove)
}

export const useSearchProjects = (query: string) => {
  return useQuery(
    api.projects.search,
    query ? { query } : 'skip'
  )
}

// =============================================================================
// SCENARIO HOOKS
// =============================================================================

export const useScenarios = (projectId: Id<"projects"> | undefined) => {
  const scenarios = useQuery(
    api.scenarios.listByProject,
    projectId ? { projectId } : 'skip'
  )
  
  // Update UAT health check with scenarios load state
  useEffect(() => {
    if (import.meta.env.DEV && (window as any).__UAT_HEALTH__) {
      if (scenarios === undefined) {
        (window as any).__UAT_HEALTH__.setLoadState('scenarios', 'loading')
      } else if (scenarios === null) {
        (window as any).__UAT_HEALTH__.setLoadState('scenarios', 'error')
      } else {
        (window as any).__UAT_HEALTH__.setLoadState('scenarios', 'success')
      }
    }
  }, [scenarios])
  
  return scenarios
}

export const useScenario = (scenarioId: Id<"scenarios"> | undefined) => {
  return useQuery(
    api.scenarios.getById,
    scenarioId ? { id: scenarioId } : 'skip'
  )
}

export const useScenarioStats = (scenarioId: Id<"scenarios"> | undefined) => {
  return useQuery(
    api.scenarios.getStats,
    scenarioId ? { id: scenarioId } : 'skip'
  )
}

export const useCreateScenario = () => {
  return useMutation(api.scenarios.create)
}

export const useUpdateScenario = () => {
  return useMutation(api.scenarios.update)
}

export const useDeleteScenario = () => {
  return useMutation(api.scenarios.remove)
}

export const useCloneScenario = () => {
  return useMutation(api.scenarios.clone)
}

// =============================================================================
// DATASET HOOKS
// =============================================================================

export const useDatasets = (scenarioId: Id<"scenarios"> | undefined) => {
  const datasets = useQuery(
    api.datasets.listByScenario,
    scenarioId ? { scenarioId } : 'skip'
  )
  
  // Update UAT health check with datasets load state
  useEffect(() => {
    if (import.meta.env.DEV && (window as any).__UAT_HEALTH__) {
      if (datasets === undefined) {
        (window as any).__UAT_HEALTH__.setLoadState('datasets', 'loading')
      } else if (datasets === null) {
        (window as any).__UAT_HEALTH__.setLoadState('datasets', 'error')
      } else {
        (window as any).__UAT_HEALTH__.setLoadState('datasets', 'success')
      }
    }
  }, [datasets])
  
  return datasets
}

export const useDatasetsByProject = (projectId: Id<"projects"> | undefined) => {
  return useQuery(
    api.datasets.listByProject,
    projectId ? { projectId } : 'skip'
  )
}

export const useDataset = (datasetId: Id<"datasets"> | undefined) => {
  return useQuery(
    api.datasets.getById,
    datasetId ? { id: datasetId } : 'skip'
  )
}

export const useDatasetStats = (datasetId: Id<"datasets"> | undefined) => {
  return useQuery(
    api.datasets.getStats,
    datasetId ? { id: datasetId } : 'skip'
  )
}

export const useCreateDataset = () => {
  return useMutation(api.datasets.create)
}

export const useUpdateDataset = () => {
  return useMutation(api.datasets.update)
}

export const useDeleteDataset = () => {
  return useMutation(api.datasets.remove)
}

export const useCloneDataset = () => {
  return useMutation(api.datasets.clone)
}

export const useArchiveDataset = () => {
  return useMutation(api.datasets.archive)
}

// =============================================================================
// VEHICLE HOOKS
// =============================================================================

export const useVehicles = (datasetId: Id<"datasets"> | undefined) => {
  const vehicles = useQuery(
    api.vehicles.listByDataset,
    datasetId ? { datasetId } : 'skip'
  )
  
  // Update UAT health check with vehicles load state
  useEffect(() => {
    if (import.meta.env.DEV && (window as any).__UAT_HEALTH__) {
      if (vehicles === undefined) {
        (window as any).__UAT_HEALTH__.setLoadState('vehicles', 'loading')
      } else if (vehicles === null) {
        (window as any).__UAT_HEALTH__.setLoadState('vehicles', 'error')
      } else {
        (window as any).__UAT_HEALTH__.setLoadState('vehicles', 'success')
      }
    }
  }, [vehicles])
  
  return vehicles
}

export const useVehiclesByProject = (projectId: Id<"projects"> | undefined) => {
  return useQuery(
    api.vehicles.listByProject,
    projectId ? { projectId } : 'skip'
  )
}

export const useVehicle = (vehicleId: Id<"vehicles"> | undefined) => {
  return useQuery(
    api.vehicles.getById,
    vehicleId ? { id: vehicleId } : 'skip'
  )
}

export const useCreateVehicle = () => {
  return useMutation(api.vehicles.create)
}

export const useUpdateVehicle = () => {
  return useMutation(api.vehicles.update)
}

export const useDeleteVehicle = () => {
  return useMutation(api.vehicles.remove)
}

export const useBulkImportVehicles = () => {
  return useMutation(api.vehicles.bulkImport)
}

export const useDuplicateVehicles = () => {
  return useMutation(api.vehicles.duplicate)
}

// =============================================================================
// JOB HOOKS
// =============================================================================

export const useJobs = (datasetId: Id<"datasets"> | undefined) => {
  const jobs = useQuery(
    api.jobs.listByDataset,
    datasetId ? { datasetId } : 'skip'
  )
  
  // Update UAT health check with jobs load state
  useEffect(() => {
    if (import.meta.env.DEV && (window as any).__UAT_HEALTH__) {
      if (jobs === undefined) {
        (window as any).__UAT_HEALTH__.setLoadState('jobs', 'loading')
      } else if (jobs === null) {
        (window as any).__UAT_HEALTH__.setLoadState('jobs', 'error')
      } else {
        (window as any).__UAT_HEALTH__.setLoadState('jobs', 'success')
      }
    }
  }, [jobs])
  
  return jobs
}

export const useJobsByProject = (projectId: Id<"projects"> | undefined) => {
  return useQuery(
    api.jobs.listByProject,
    projectId ? { projectId } : 'skip'
  )
}

export const useJob = (jobId: Id<"jobs"> | undefined) => {
  return useQuery(
    api.jobs.getById,
    jobId ? { id: jobId } : 'skip'
  )
}

export const useCreateJob = () => {
  return useMutation(api.jobs.create)
}

export const useUpdateJob = () => {
  return useMutation(api.jobs.update)
}

export const useDeleteJob = () => {
  return useMutation(api.jobs.remove)
}

export const useBulkImportJobs = () => {
  return useMutation(api.jobs.bulkImport)
}

// =============================================================================
// LOCATION HOOKS
// =============================================================================

export const useLocations = (datasetId: Id<"datasets"> | undefined) => {
  return useQuery(
    api.locations.listByDataset,
    datasetId ? { datasetId } : 'skip'
  )
}

export const useLocationsByProject = (projectId: Id<"projects"> | undefined) => {
  return useQuery(
    api.locations.listByProject,
    projectId ? { projectId } : 'skip'
  )
}

export const useLocation = (locationId: Id<"locations"> | undefined) => {
  return useQuery(
    api.locations.getById,
    locationId ? { id: locationId } : 'skip'
  )
}

export const useCreateLocation = () => {
  return useMutation(api.locations.create)
}

export const useUpdateLocation = () => {
  return useMutation(api.locations.update)
}

export const useDeleteLocation = () => {
  return useMutation(api.locations.remove)
}

export const useBulkImportLocations = () => {
  return useMutation(api.locations.bulkImport)
}

// =============================================================================
// ROUTE HOOKS
// =============================================================================

export const useRoutes = (datasetId: Id<"datasets"> | undefined) => {
  return useQuery(
    api.routes.listByDataset,
    datasetId ? { datasetId } : 'skip'
  )
}

export const useRoutesByProject = (projectId: Id<"projects"> | undefined) => {
  return useQuery(
    api.routes.listByProject,
    projectId ? { projectId } : 'skip'
  )
}

export const useRoute = (routeId: Id<"routes"> | undefined) => {
  return useQuery(
    api.routes.getById,
    routeId ? { id: routeId } : 'skip'
  )
}

export const useCreateRoute = () => {
  // Note: Route creation not implemented in backend yet
  return async () => {
    throw new Error('Route creation not implemented yet')
  }
}

export const useUpdateRoute = () => {
  // Note: Route update not implemented in backend yet
  return async () => {
    throw new Error('Route update not implemented yet')
  }
}

export const useDeleteRoute = () => {
  // Note: Route deletion not implemented in backend yet
  return async () => {
    throw new Error('Route deletion not implemented yet')
  }
}

export const useStoreOptimizationResults = () => {
  return useMutation(api.routes.storeOptimizationResults)
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

// Combined hook for getting all VRP data for a dataset
export const useVRPDataset = (datasetId: Id<"datasets"> | undefined) => {
  const dataset = useDataset(datasetId)
  const vehicles = useVehicles(datasetId)
  const jobs = useJobs(datasetId)
  const locations = useLocations(datasetId)
  const routes = useRoutes(datasetId)
  const stats = useDatasetStats(datasetId)

  return {
    dataset,
    vehicles,
    jobs,
    locations,
    routes,
    stats,
    isLoading: dataset === undefined || vehicles === undefined || jobs === undefined || locations === undefined || routes === undefined
  }
}