/**
 * Confirmation message templates for VRP system operations
 * Provides consistent, user-friendly messaging across the application
 * Following UX best practices for destructive and important actions
 */

export interface CascadeDeleteInfo {
  scenarios?: number
  datasets?: number
  vehicles?: number
  jobs?: number
  locations?: number
  routes?: number
}

export const confirmationMessages = {
  // Project operations
  project: {
    delete: (projectName: string, cascadeInfo?: CascadeDeleteInfo) => ({
      title: 'Delete Project',
      description: cascadeInfo ? 
        `Are you sure you want to delete project "${projectName}"? This will permanently delete:\n\n` +
        (cascadeInfo.scenarios ? `• ${cascadeInfo.scenarios} scenario${cascadeInfo.scenarios !== 1 ? 's' : ''}\n` : '') +
        (cascadeInfo.datasets ? `• ${cascadeInfo.datasets} dataset${cascadeInfo.datasets !== 1 ? 's' : ''}\n` : '') +
        (cascadeInfo.vehicles ? `• ${cascadeInfo.vehicles} vehicle${cascadeInfo.vehicles !== 1 ? 's' : ''}\n` : '') +
        (cascadeInfo.jobs ? `• ${cascadeInfo.jobs} job${cascadeInfo.jobs !== 1 ? 's' : ''}\n` : '') +
        (cascadeInfo.locations ? `• ${cascadeInfo.locations} location${cascadeInfo.locations !== 1 ? 's' : ''}\n` : '') +
        `\nThis action cannot be undone. All data associated with this project will be permanently lost.`
        : `Are you sure you want to delete project "${projectName}"? This action cannot be undone.`,
      confirmText: 'Delete Project',
      variant: 'destructive' as const
    }),
    
    archive: (projectName: string) => ({
      title: 'Archive Project',
      description: `Archive project "${projectName}"? Archived projects are hidden from the main view but can be restored later. All associated scenarios and data will remain intact.`,
      confirmText: 'Archive Project',
      variant: 'warning' as const
    })
  },

  // Scenario operations
  scenario: {
    delete: (scenarioName: string, cascadeInfo?: CascadeDeleteInfo) => ({
      title: 'Delete Scenario',
      description: cascadeInfo ? 
        `Are you sure you want to delete scenario "${scenarioName}"? This will also delete:\n\n` +
        (cascadeInfo.datasets ? `• ${cascadeInfo.datasets} dataset${cascadeInfo.datasets !== 1 ? 's' : ''}\n` : '') +
        (cascadeInfo.vehicles ? `• ${cascadeInfo.vehicles} vehicle${cascadeInfo.vehicles !== 1 ? 's' : ''}\n` : '') +
        (cascadeInfo.jobs ? `• ${cascadeInfo.jobs} job${cascadeInfo.jobs !== 1 ? 's' : ''}\n` : '') +
        (cascadeInfo.locations ? `• ${cascadeInfo.locations} location${cascadeInfo.locations !== 1 ? 's' : ''}\n` : '') +
        `\nThis action cannot be undone.`
        : `Are you sure you want to delete scenario "${scenarioName}"? This action cannot be undone.`,
      confirmText: 'Delete Scenario',
      variant: 'destructive' as const
    }),

    clone: (scenarioName: string) => ({
      title: 'Clone Scenario',
      description: `Create a copy of scenario "${scenarioName}"? The clone will include all datasets, vehicles, jobs, and locations from the original scenario. You can customize the name and settings after cloning.`,
      confirmText: 'Create Clone',
      variant: 'default' as const
    })
  },

  // Dataset operations
  dataset: {
    delete: (datasetName: string, cascadeInfo?: CascadeDeleteInfo) => ({
      title: 'Delete Dataset',
      description: cascadeInfo ? 
        `Are you sure you want to delete dataset "${datasetName}"? This will permanently delete all data including:\n\n` +
        (cascadeInfo.vehicles ? `• ${cascadeInfo.vehicles} vehicle${cascadeInfo.vehicles !== 1 ? 's' : ''}\n` : '') +
        (cascadeInfo.jobs ? `• ${cascadeInfo.jobs} job${cascadeInfo.jobs !== 1 ? 's' : ''}\n` : '') +
        (cascadeInfo.locations ? `• ${cascadeInfo.locations} location${cascadeInfo.locations !== 1 ? 's' : ''}\n` : '') +
        (cascadeInfo.routes ? `• ${cascadeInfo.routes} optimized route${cascadeInfo.routes !== 1 ? 's' : ''}\n` : '') +
        `\nThis action cannot be undone.`
        : `Are you sure you want to delete dataset "${datasetName}"? This will permanently delete all vehicles, jobs, locations, and routes in this dataset.`,
      confirmText: 'Delete Dataset',
      variant: 'destructive' as const
    }),

    clone: (datasetName: string) => ({
      title: 'Clone Dataset',
      description: `Create a copy of dataset "${datasetName}"? The clone will include all vehicles, jobs, locations, and their configurations. Optimization results will not be copied.`,
      confirmText: 'Create Clone',
      variant: 'default' as const
    })
  },

  // Bulk operations
  bulk: {
    delete: (count: number, entityType: string) => ({
      title: `Delete ${count} ${entityType}${count !== 1 ? 's' : ''}`,
      description: `Are you sure you want to delete ${count} selected ${entityType}${count !== 1 ? 's' : ''}? This action cannot be undone and may affect related data.`,
      confirmText: `Delete ${count} ${entityType}${count !== 1 ? 's' : ''}`,
      variant: 'destructive' as const
    }),

    clone: (count: number, entityType: string) => ({
      title: `Clone ${count} ${entityType}${count !== 1 ? 's' : ''}`,
      description: `Create copies of ${count} selected ${entityType}${count !== 1 ? 's' : ''}? Each clone will be created with a unique name and all associated data will be duplicated.`,
      confirmText: `Create ${count} Clone${count !== 1 ? 's' : ''}`,
      variant: 'default' as const
    }),

    archive: (count: number, entityType: string) => ({
      title: `Archive ${count} ${entityType}${count !== 1 ? 's' : ''}`,
      description: `Archive ${count} selected ${entityType}${count !== 1 ? 's' : ''}? Archived items will be hidden from the main view but can be restored later.`,
      confirmText: `Archive ${count} ${entityType}${count !== 1 ? 's' : ''}`,
      variant: 'warning' as const
    })
  },

  // Data operations
  data: {
    unsavedChanges: () => ({
      title: 'Unsaved Changes',
      description: 'You have unsaved changes that will be lost. Are you sure you want to continue without saving?',
      confirmText: 'Discard Changes',
      variant: 'warning' as const
    }),

    importReplace: (fileName: string) => ({
      title: 'Replace Existing Data',
      description: `Importing "${fileName}" will replace all existing data in this dataset. Are you sure you want to continue? This action cannot be undone.`,
      confirmText: 'Replace Data',
      variant: 'warning' as const
    }),

    clearAll: (entityType: string) => ({
      title: `Clear All ${entityType}`,
      description: `Remove all ${entityType.toLowerCase()} from this dataset? This action cannot be undone.`,
      confirmText: `Clear All ${entityType}`,
      variant: 'destructive' as const
    })
  },

  // Optimization operations
  optimization: {
    overwriteResults: () => ({
      title: 'Overwrite Optimization Results',
      description: 'Running a new optimization will replace the current results. Previous routes and schedules will be lost. Continue with optimization?',
      confirmText: 'Run Optimization',
      variant: 'warning' as const
    }),

    resetOptimization: () => ({
      title: 'Reset Optimization',
      description: 'This will clear all optimization results including routes, schedules, and performance metrics. Are you sure you want to continue?',
      confirmText: 'Reset Results',
      variant: 'destructive' as const
    })
  }
}

// Helper function to get cascade delete message with dynamic data
export const getCascadeDeleteMessage = (
  entityType: 'project' | 'scenario' | 'dataset',
  entityName: string,
  cascadeInfo: CascadeDeleteInfo
) => {
  switch (entityType) {
    case 'project':
      return confirmationMessages.project.delete(entityName, cascadeInfo)
    case 'scenario':
      return confirmationMessages.scenario.delete(entityName, cascadeInfo)
    case 'dataset':
      return confirmationMessages.dataset.delete(entityName, cascadeInfo)
    default:
      throw new Error(`Unknown entity type: ${entityType}`)
  }
}