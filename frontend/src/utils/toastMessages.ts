import { toast } from 'sonner'

/**
 * Toast notification patterns for VRP system operations
 * Provides consistent, informative messaging for user actions
 * Following UX best practices for feedback and communication
 */

export interface ToastOptions {
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export interface BulkOperationResult {
  success: number
  failed: number
  total: number
  errors?: string[]
}

export const toastMessages = {
  // Success messages
  success: {
    // Entity CRUD operations
    created: (entityType: string, entityName?: string) => {
      const message = entityName 
        ? `${entityType} "${entityName}" created successfully`
        : `${entityType} created successfully`
      toast.success(message)
    },

    updated: (entityType: string, entityName?: string) => {
      const message = entityName
        ? `${entityType} "${entityName}" updated successfully`
        : `${entityType} updated successfully`
      toast.success(message)
    },

    deleted: (entityType: string, entityName?: string) => {
      const message = entityName
        ? `${entityType} "${entityName}" deleted successfully`
        : `${entityType} deleted successfully`
      toast.success(message)
    },

    cloned: (entityType: string, originalName?: string, newName?: string) => {
      const message = originalName && newName
        ? `${entityType} "${originalName}" cloned as "${newName}"`
        : `${entityType} cloned successfully`
      toast.success(message)
    },

    archived: (entityType: string, entityName?: string) => {
      const message = entityName
        ? `${entityType} "${entityName}" archived successfully`
        : `${entityType} archived successfully`
      toast.success(message)
    },

    restored: (entityType: string, entityName?: string) => {
      const message = entityName
        ? `${entityType} "${entityName}" restored successfully`
        : `${entityType} restored successfully`
      toast.success(message)
    },

    // Bulk operations
    bulkOperation: (result: BulkOperationResult, operation: string, entityType: string) => {
      if (result.failed === 0) {
        toast.success(`Successfully ${operation} ${result.success} ${entityType}${result.success !== 1 ? 's' : ''}`)
      } else if (result.success === 0) {
        toast.error(`Failed to ${operation} all ${result.total} ${entityType}${result.total !== 1 ? 's' : ''}`)
      } else {
        toast.success(`${operation} completed: ${result.success} successful, ${result.failed} failed`)
      }
    },

    // Data operations
    imported: (count: number, entityType: string, fileName?: string) => {
      const message = fileName
        ? `Successfully imported ${count} ${entityType}${count !== 1 ? 's' : ''} from ${fileName}`
        : `Successfully imported ${count} ${entityType}${count !== 1 ? 's' : ''}`
      toast.success(message)
    },

    exported: (count: number, entityType: string, fileName?: string) => {
      const message = fileName
        ? `Successfully exported ${count} ${entityType}${count !== 1 ? 's' : ''} to ${fileName}`
        : `Successfully exported ${count} ${entityType}${count !== 1 ? 's' : ''}`
      toast.success(message)
    },

    // Optimization operations
    optimizationCompleted: (routeCount: number, duration?: number) => {
      const message = duration
        ? `Optimization completed: ${routeCount} routes generated in ${duration}ms`
        : `Optimization completed: ${routeCount} routes generated`
      toast.success(message)
    },

    // Generic success
    generic: (message: string, options?: ToastOptions) => {
      toast.success(message, options)
    }
  },

  // Error messages
  error: {
    // Entity CRUD operations
    createFailed: (entityType: string, error?: string) => {
      const message = error
        ? `Failed to create ${entityType}: ${error}`
        : `Failed to create ${entityType}`
      toast.error(message)
    },

    updateFailed: (entityType: string, entityName?: string, error?: string) => {
      const baseMessage = entityName
        ? `Failed to update ${entityType} "${entityName}"`
        : `Failed to update ${entityType}`
      const message = error ? `${baseMessage}: ${error}` : baseMessage
      toast.error(message)
    },

    deleteFailed: (entityType: string, entityName?: string, error?: string) => {
      const baseMessage = entityName
        ? `Failed to delete ${entityType} "${entityName}"`
        : `Failed to delete ${entityType}`
      const message = error ? `${baseMessage}: ${error}` : baseMessage
      toast.error(message)
    },

    cloneFailed: (entityType: string, entityName?: string, error?: string) => {
      const baseMessage = entityName
        ? `Failed to clone ${entityType} "${entityName}"`
        : `Failed to clone ${entityType}`
      const message = error ? `${baseMessage}: ${error}` : baseMessage
      toast.error(message)
    },

    // Data operations
    importFailed: (entityType: string, fileName?: string, error?: string) => {
      const baseMessage = fileName
        ? `Failed to import ${entityType} from ${fileName}`
        : `Failed to import ${entityType}`
      const message = error ? `${baseMessage}: ${error}` : baseMessage
      toast.error(message)
    },

    exportFailed: (entityType: string, error?: string) => {
      const message = error
        ? `Failed to export ${entityType}: ${error}`
        : `Failed to export ${entityType}`
      toast.error(message)
    },

    // Validation errors
    validationFailed: (field: string, error: string) => {
      toast.error(`Validation error: ${field} - ${error}`)
    },

    // Network/API errors
    networkError: (operation?: string) => {
      const message = operation
        ? `Network error during ${operation}. Please check your connection and try again.`
        : 'Network error. Please check your connection and try again.'
      toast.error(message)
    },

    // Authorization errors
    unauthorized: (operation?: string) => {
      const message = operation
        ? `Not authorized to ${operation}. Please check your permissions.`
        : 'Not authorized. Please check your permissions.'
      toast.error(message)
    },

    // Generic error
    generic: (message: string, options?: ToastOptions) => {
      toast.error(message, options)
    }
  },

  // Warning messages
  warning: {
    // Data warnings
    dataIncomplete: (entityType: string, missingFields: string[]) => {
      const message = `${entityType} is missing required fields: ${missingFields.join(', ')}`
      toast.warning(message)
    },

    unsavedChanges: () => {
      toast.warning('You have unsaved changes that will be lost')
    },

    largeDataset: (count: number, entityType: string) => {
      toast.warning(`Large dataset detected: ${count} ${entityType}s. Performance may be affected.`)
    },

    // Operation warnings
    cascadeEffect: (entityType: string, affectedCount: number, affectedType: string) => {
      toast.warning(`Deleting this ${entityType} will also affect ${affectedCount} ${affectedType}${affectedCount !== 1 ? 's' : ''}`)
    },

    // Generic warning
    generic: (message: string, options?: ToastOptions) => {
      toast.warning(message, options)
    }
  },

  // Info messages
  info: {
    // Progress updates
    processing: (operation: string, entityType?: string) => {
      const message = entityType
        ? `${operation} ${entityType}...`
        : `${operation}...`
      toast.info(message, { duration: 2000 })
    },

    // Status updates
    statusChange: (entityType: string, entityName: string, status: string) => {
      toast.info(`${entityType} "${entityName}" status changed to ${status}`)
    },

    // Feature info
    featureInfo: (message: string) => {
      toast.info(message, { duration: 5000 })
    },

    // Generic info
    generic: (message: string, options?: ToastOptions) => {
      toast.info(message, options)
    }
  },

  // Loading states
  loading: {
    start: (operation: string, entityType?: string) => {
      const message = entityType
        ? `${operation} ${entityType}...`
        : `${operation}...`
      return toast.loading(message)
    },

    update: (toastId: string | number, message: string) => {
      toast.loading(message, { id: toastId })
    },

    success: (toastId: string | number, message: string) => {
      toast.success(message, { id: toastId })
    },

    error: (toastId: string | number, message: string) => {
      toast.error(message, { id: toastId })
    }
  }
}

// Helper functions for common patterns
export const showOperationResult = (
  operation: 'create' | 'update' | 'delete' | 'clone',
  entityType: string,
  success: boolean,
  entityName?: string,
  error?: string
) => {
  if (success) {
    switch (operation) {
      case 'create':
        toastMessages.success.created(entityType, entityName)
        break
      case 'update':
        toastMessages.success.updated(entityType, entityName)
        break
      case 'delete':
        toastMessages.success.deleted(entityType, entityName)
        break
      case 'clone':
        toastMessages.success.cloned(entityType, entityName)
        break
    }
  } else {
    switch (operation) {
      case 'create':
        toastMessages.error.createFailed(entityType, error)
        break
      case 'update':
        toastMessages.error.updateFailed(entityType, entityName, error)
        break
      case 'delete':
        toastMessages.error.deleteFailed(entityType, entityName, error)
        break
      case 'clone':
        toastMessages.error.cloneFailed(entityType, entityName, error)
        break
    }
  }
}

export const showBulkOperationResult = (
  operation: string,
  entityType: string,
  result: BulkOperationResult
) => {
  toastMessages.success.bulkOperation(result, operation, entityType)
  
  // Show detailed errors if any
  if (result.failed > 0 && result.errors?.length) {
    result.errors.forEach(error => {
      toastMessages.error.generic(error, { duration: 5000 })
    })
  }
}

export const showProgressToast = (operation: string, entityType?: string) => {
  return toastMessages.loading.start(operation, entityType)
}

export const updateProgressToast = (
  toastId: string | number,
  success: boolean,
  message: string
) => {
  if (success) {
    toastMessages.loading.success(toastId, message)
  } else {
    toastMessages.loading.error(toastId, message)
  }
}