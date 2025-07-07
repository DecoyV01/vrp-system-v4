import { useState, useCallback } from 'react'
import { LucideIcon, AlertTriangle, Trash2, Copy, Save, FileX, Archive, RefreshCw } from 'lucide-react'

export interface ConfirmationConfig {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'warning'
  icon?: LucideIcon
  requireConfirmation?: boolean
}

export interface ConfirmationState {
  isOpen: boolean
  config: ConfirmationConfig | null
  onConfirm: (() => void | Promise<void>) | null
  isLoading: boolean
}

export interface UseConfirmationDialogReturn {
  // State
  confirmationState: ConfirmationState
  
  // Actions
  openConfirmation: (config: ConfirmationConfig, onConfirm: () => void | Promise<void>) => void
  closeConfirmation: () => void
  setLoading: (loading: boolean) => void
  
  // Preset confirmation dialogs
  confirmDelete: (entityName: string, entityType: string, onConfirm: () => void | Promise<void>) => void
  confirmBulkDelete: (count: number, entityType: string, onConfirm: () => void | Promise<void>) => void
  confirmCascadeDelete: (entityName: string, entityType: string, cascadeInfo: string, onConfirm: () => void | Promise<void>) => void
  confirmClone: (entityName: string, entityType: string, onConfirm: () => void | Promise<void>) => void
  confirmSave: (hasChanges: boolean, onConfirm: () => void | Promise<void>) => void
  confirmDiscard: (hasChanges: boolean, onConfirm: () => void | Promise<void>) => void
  confirmArchive: (entityName: string, entityType: string, onConfirm: () => void | Promise<void>) => void
  confirmRestore: (entityName: string, entityType: string, onConfirm: () => void | Promise<void>) => void
}

/**
 * Custom hook for managing confirmation dialogs with preset patterns
 * Provides consistent messaging and behavior for common operations
 * Following React.dev patterns for state management and custom hooks
 */
export const useConfirmationDialog = (): UseConfirmationDialogReturn => {
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
    isOpen: false,
    config: null,
    onConfirm: null,
    isLoading: false
  })

  // Open confirmation dialog with custom config
  const openConfirmation = useCallback((config: ConfirmationConfig, onConfirm: () => void | Promise<void>) => {
    setConfirmationState({
      isOpen: true,
      config,
      onConfirm,
      isLoading: false
    })
  }, [])

  // Close confirmation dialog
  const closeConfirmation = useCallback(() => {
    setConfirmationState({
      isOpen: false,
      config: null,
      onConfirm: null,
      isLoading: false
    })
  }, [])

  // Set loading state
  const setLoading = useCallback((loading: boolean) => {
    setConfirmationState(prev => ({
      ...prev,
      isLoading: loading
    }))
  }, [])

  // Preset: Delete confirmation
  const confirmDelete = useCallback((entityName: string, entityType: string, onConfirm: () => void | Promise<void>) => {
    openConfirmation({
      title: `Delete ${entityType}`,
      description: `Are you sure you want to delete "${entityName}"? This action cannot be undone.`,
      confirmText: `Delete ${entityType}`,
      cancelText: 'Cancel',
      variant: 'destructive',
      icon: Trash2
    }, onConfirm)
  }, [openConfirmation])

  // Preset: Bulk delete confirmation
  const confirmBulkDelete = useCallback((count: number, entityType: string, onConfirm: () => void | Promise<void>) => {
    const plural = count !== 1 ? `${entityType}s` : entityType
    openConfirmation({
      title: `Delete ${count} ${plural}`,
      description: `Are you sure you want to delete ${count} ${plural}? This action cannot be undone and will affect all selected items.`,
      confirmText: `Delete ${count} ${plural}`,
      cancelText: 'Cancel',
      variant: 'destructive',
      icon: Trash2
    }, onConfirm)
  }, [openConfirmation])

  // Preset: Cascade delete confirmation
  const confirmCascadeDelete = useCallback((
    entityName: string, 
    entityType: string, 
    cascadeInfo: string, 
    onConfirm: () => void | Promise<void>
  ) => {
    openConfirmation({
      title: `Delete ${entityType}`,
      description: `Are you sure you want to delete "${entityName}"?\n\nWarning: This will also delete: ${cascadeInfo}\n\nThis action cannot be undone.`,
      confirmText: `Delete ${entityType}`,
      cancelText: 'Cancel',
      variant: 'destructive',
      icon: AlertTriangle
    }, onConfirm)
  }, [openConfirmation])

  // Preset: Clone confirmation
  const confirmClone = useCallback((entityName: string, entityType: string, onConfirm: () => void | Promise<void>) => {
    openConfirmation({
      title: `Clone ${entityType}`,
      description: `Create a copy of "${entityName}"? All associated data will be duplicated with a new name.`,
      confirmText: `Create Clone`,
      cancelText: 'Cancel',
      variant: 'default',
      icon: Copy
    }, onConfirm)
  }, [openConfirmation])

  // Preset: Save confirmation
  const confirmSave = useCallback((hasChanges: boolean, onConfirm: () => void | Promise<void>) => {
    if (!hasChanges) {
      onConfirm()
      return
    }
    
    openConfirmation({
      title: 'Save Changes',
      description: 'You have unsaved changes. Do you want to save them before continuing?',
      confirmText: 'Save Changes',
      cancelText: 'Cancel',
      variant: 'default',
      icon: Save
    }, onConfirm)
  }, [openConfirmation])

  // Preset: Discard changes confirmation
  const confirmDiscard = useCallback((hasChanges: boolean, onConfirm: () => void | Promise<void>) => {
    if (!hasChanges) {
      onConfirm()
      return
    }
    
    openConfirmation({
      title: 'Discard Changes',
      description: 'You have unsaved changes. Are you sure you want to discard them? This action cannot be undone.',
      confirmText: 'Discard Changes',
      cancelText: 'Keep Editing',
      variant: 'warning',
      icon: FileX
    }, onConfirm)
  }, [openConfirmation])

  // Preset: Archive confirmation
  const confirmArchive = useCallback((entityName: string, entityType: string, onConfirm: () => void | Promise<void>) => {
    openConfirmation({
      title: `Archive ${entityType}`,
      description: `Archive "${entityName}"? This will move it to archived items where it can be restored later.`,
      confirmText: `Archive ${entityType}`,
      cancelText: 'Cancel',
      variant: 'warning',
      icon: Archive
    }, onConfirm)
  }, [openConfirmation])

  // Preset: Restore confirmation
  const confirmRestore = useCallback((entityName: string, entityType: string, onConfirm: () => void | Promise<void>) => {
    openConfirmation({
      title: `Restore ${entityType}`,
      description: `Restore "${entityName}" from archive? This will make it active and available for use again.`,
      confirmText: `Restore ${entityType}`,
      cancelText: 'Cancel',
      variant: 'default',
      icon: RefreshCw
    }, onConfirm)
  }, [openConfirmation])

  return {
    // State
    confirmationState,
    
    // Actions
    openConfirmation,
    closeConfirmation,
    setLoading,
    
    // Preset confirmations
    confirmDelete,
    confirmBulkDelete,
    confirmCascadeDelete,
    confirmClone,
    confirmSave,
    confirmDiscard,
    confirmArchive,
    confirmRestore
  }
}