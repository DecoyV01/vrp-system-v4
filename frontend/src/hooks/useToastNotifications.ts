import { useCallback } from 'react'
import { toastMessages, showOperationResult, showBulkOperationResult, showProgressToast, updateProgressToast } from '@/utils/toastMessages'
import type { BulkOperationResult } from '@/utils/toastMessages'

export interface UseToastNotificationsReturn {
  // Entity operations
  notifyEntityCreated: (entityType: string, entityName?: string) => void
  notifyEntityUpdated: (entityType: string, entityName?: string) => void
  notifyEntityDeleted: (entityType: string, entityName?: string) => void
  notifyEntityCloned: (entityType: string, originalName?: string, newName?: string) => void
  
  // Operation results
  notifyOperationResult: (
    operation: 'create' | 'update' | 'delete' | 'clone',
    entityType: string,
    success: boolean,
    entityName?: string,
    error?: string
  ) => void
  
  // Bulk operations
  notifyBulkOperation: (operation: string, entityType: string, result: BulkOperationResult) => void
  
  // Data operations
  notifyImportResult: (count: number, entityType: string, fileName?: string) => void
  notifyExportResult: (count: number, entityType: string, fileName?: string) => void
  notifyImportError: (entityType: string, fileName?: string, error?: string) => void
  notifyExportError: (entityType: string, error?: string) => void
  
  // Validation and errors
  notifyValidationError: (field: string, error: string) => void
  notifyNetworkError: (operation?: string) => void
  notifyUnauthorized: (operation?: string) => void
  
  // Warnings
  notifyUnsavedChanges: () => void
  notifyDataIncomplete: (entityType: string, missingFields: string[]) => void
  notifyCascadeEffect: (entityType: string, affectedCount: number, affectedType: string) => void
  
  // Progress tracking
  startProgress: (operation: string, entityType?: string) => string | number
  updateProgress: (toastId: string | number, success: boolean, message: string) => void
  
  // Generic notifications
  notifySuccess: (message: string) => void
  notifyError: (message: string) => void
  notifyWarning: (message: string) => void
  notifyInfo: (message: string) => void
}

/**
 * Custom hook for toast notifications throughout the VRP application
 * Provides consistent, context-aware messaging for all user operations
 * Following React.dev patterns for custom hooks and side effects
 */
export const useToastNotifications = (): UseToastNotificationsReturn => {
  // Entity operation notifications
  const notifyEntityCreated = useCallback((entityType: string, entityName?: string) => {
    toastMessages.success.created(entityType, entityName)
  }, [])

  const notifyEntityUpdated = useCallback((entityType: string, entityName?: string) => {
    toastMessages.success.updated(entityType, entityName)
  }, [])

  const notifyEntityDeleted = useCallback((entityType: string, entityName?: string) => {
    toastMessages.success.deleted(entityType, entityName)
  }, [])

  const notifyEntityCloned = useCallback((entityType: string, originalName?: string, newName?: string) => {
    toastMessages.success.cloned(entityType, originalName, newName)
  }, [])

  // Operation result notification
  const notifyOperationResult = useCallback((
    operation: 'create' | 'update' | 'delete' | 'clone',
    entityType: string,
    success: boolean,
    entityName?: string,
    error?: string
  ) => {
    showOperationResult(operation, entityType, success, entityName, error)
  }, [])

  // Bulk operation notifications
  const notifyBulkOperation = useCallback((
    operation: string,
    entityType: string,
    result: BulkOperationResult
  ) => {
    showBulkOperationResult(operation, entityType, result)
  }, [])

  // Data operation notifications
  const notifyImportResult = useCallback((count: number, entityType: string, fileName?: string) => {
    toastMessages.success.imported(count, entityType, fileName)
  }, [])

  const notifyExportResult = useCallback((count: number, entityType: string, fileName?: string) => {
    toastMessages.success.exported(count, entityType, fileName)
  }, [])

  const notifyImportError = useCallback((entityType: string, fileName?: string, error?: string) => {
    toastMessages.error.importFailed(entityType, fileName, error)
  }, [])

  const notifyExportError = useCallback((entityType: string, error?: string) => {
    toastMessages.error.exportFailed(entityType, error)
  }, [])

  // Validation and error notifications
  const notifyValidationError = useCallback((field: string, error: string) => {
    toastMessages.error.validationFailed(field, error)
  }, [])

  const notifyNetworkError = useCallback((operation?: string) => {
    toastMessages.error.networkError(operation)
  }, [])

  const notifyUnauthorized = useCallback((operation?: string) => {
    toastMessages.error.unauthorized(operation)
  }, [])

  // Warning notifications
  const notifyUnsavedChanges = useCallback(() => {
    toastMessages.warning.unsavedChanges()
  }, [])

  const notifyDataIncomplete = useCallback((entityType: string, missingFields: string[]) => {
    toastMessages.warning.dataIncomplete(entityType, missingFields)
  }, [])

  const notifyCascadeEffect = useCallback((
    entityType: string,
    affectedCount: number,
    affectedType: string
  ) => {
    toastMessages.warning.cascadeEffect(entityType, affectedCount, affectedType)
  }, [])

  // Progress tracking
  const startProgress = useCallback((operation: string, entityType?: string) => {
    return showProgressToast(operation, entityType)
  }, [])

  const updateProgress = useCallback((
    toastId: string | number,
    success: boolean,
    message: string
  ) => {
    updateProgressToast(toastId, success, message)
  }, [])

  // Generic notifications
  const notifySuccess = useCallback((message: string) => {
    toastMessages.success.generic(message)
  }, [])

  const notifyError = useCallback((message: string) => {
    toastMessages.error.generic(message)
  }, [])

  const notifyWarning = useCallback((message: string) => {
    toastMessages.warning.generic(message)
  }, [])

  const notifyInfo = useCallback((message: string) => {
    toastMessages.info.generic(message)
  }, [])

  return {
    // Entity operations
    notifyEntityCreated,
    notifyEntityUpdated,
    notifyEntityDeleted,
    notifyEntityCloned,
    
    // Operation results
    notifyOperationResult,
    
    // Bulk operations
    notifyBulkOperation,
    
    // Data operations
    notifyImportResult,
    notifyExportResult,
    notifyImportError,
    notifyExportError,
    
    // Validation and errors
    notifyValidationError,
    notifyNetworkError,
    notifyUnauthorized,
    
    // Warnings
    notifyUnsavedChanges,
    notifyDataIncomplete,
    notifyCascadeEffect,
    
    // Progress tracking
    startProgress,
    updateProgress,
    
    // Generic notifications
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo
  }
}