import { useState, useCallback, useEffect } from 'react'
import type { Id } from '../convex/_generated/dataModel'

export type ModalType = 
  | 'edit-project' 
  | 'edit-scenario' 
  | 'edit-dataset'
  | 'delete-project'
  | 'delete-scenario' 
  | 'delete-dataset'
  | 'clone-scenario'
  | 'clone-dataset'
  | 'bulk-delete'
  | 'bulk-clone'

export interface ModalData {
  id?: Id<'projects'> | Id<'scenarios'> | Id<'datasets'>
  name?: string
  type?: 'project' | 'scenario' | 'dataset'
  parentId?: Id<'projects'> | Id<'scenarios'>
  selectedIds?: string[]
  cascadeInfo?: {
    childCount: number
    childType: string
    warnings: string[]
  }
}

export interface ModalState {
  isOpen: boolean
  type: ModalType | null
  data: ModalData | null
  isLoading: boolean
  error: string | null
}

export interface UseModalStateOptions {
  onSuccess?: (type: ModalType, data: ModalData) => void
  onError?: (type: ModalType, error: string) => void
  closeOnEscape?: boolean
  closeOnOverlayClick?: boolean
}

export interface UseModalStateReturn {
  // State
  modalState: ModalState
  
  // Actions
  openModal: (type: ModalType, data?: ModalData) => void
  closeModal: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  updateModalData: (data: Partial<ModalData>) => void
  
  // Helpers
  isModalOpen: (type?: ModalType) => boolean
  isAnyModalOpen: () => boolean
  getCurrentModalType: () => ModalType | null
  getCurrentModalData: () => ModalData | null
  
  // Workflow helpers
  openEditModal: (entityType: 'project' | 'scenario' | 'dataset', id: Id<any>, name: string) => void
  openDeleteModal: (entityType: 'project' | 'scenario' | 'dataset', id: Id<any>, name: string, cascadeInfo?: ModalData['cascadeInfo']) => void
  openCloneModal: (entityType: 'scenario' | 'dataset', id: Id<any>, name: string, parentId?: Id<any>) => void
  openBulkModal: (operation: 'delete' | 'clone', selectedIds: string[], entityType: 'scenario' | 'dataset') => void
}

/**
 * Custom hook for managing modal state and workflows
 * Provides type-safe modal management with loading states and error handling
 * Following React.dev patterns for state management and side effects
 */
export const useModalState = (options: UseModalStateOptions = {}): UseModalStateReturn => {
  const {
    onSuccess,
    onError,
    closeOnEscape = true,
    closeOnOverlayClick = true
  } = options

  // Core modal state
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: null,
    data: null,
    isLoading: false,
    error: null
  })

  // Open modal with type and optional data
  const openModal = useCallback((type: ModalType, data: ModalData = {}) => {
    setModalState({
      isOpen: true,
      type,
      data,
      isLoading: false,
      error: null
    })
  }, [])

  // Close modal and reset state
  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
      type: null,
      data: null,
      isLoading: false,
      error: null
    })
  }, [])

  // Set loading state for async operations
  const setLoading = useCallback((loading: boolean) => {
    setModalState(prev => ({
      ...prev,
      isLoading: loading,
      error: loading ? null : prev.error // Clear error when starting loading
    }))
  }, [])

  // Set error state
  const setError = useCallback((error: string | null) => {
    setModalState(prev => ({
      ...prev,
      error,
      isLoading: false // Stop loading when error occurs
    }))
    
    if (error && onError && modalState.type) {
      onError(modalState.type, error)
    }
  }, [onError, modalState.type])

  // Update modal data while keeping modal open
  const updateModalData = useCallback((data: Partial<ModalData>) => {
    setModalState(prev => ({
      ...prev,
      data: prev.data ? { ...prev.data, ...data } : data
    }))
  }, [])

  // Helper functions
  const isModalOpen = useCallback((type?: ModalType): boolean => {
    if (type) {
      return modalState.isOpen && modalState.type === type
    }
    return modalState.isOpen
  }, [modalState.isOpen, modalState.type])

  const isAnyModalOpen = useCallback((): boolean => {
    return modalState.isOpen
  }, [modalState.isOpen])

  const getCurrentModalType = useCallback((): ModalType | null => {
    return modalState.type
  }, [modalState.type])

  const getCurrentModalData = useCallback((): ModalData | null => {
    return modalState.data
  }, [modalState.data])

  // Workflow helper functions for common modal patterns
  const openEditModal = useCallback((
    entityType: 'project' | 'scenario' | 'dataset',
    id: Id<any>,
    name: string
  ) => {
    const modalType = `edit-${entityType}` as ModalType
    openModal(modalType, {
      id,
      name,
      type: entityType
    })
  }, [openModal])

  const openDeleteModal = useCallback((
    entityType: 'project' | 'scenario' | 'dataset',
    id: Id<any>,
    name: string,
    cascadeInfo?: ModalData['cascadeInfo']
  ) => {
    const modalType = `delete-${entityType}` as ModalType
    openModal(modalType, {
      id,
      name,
      type: entityType,
      cascadeInfo
    })
  }, [openModal])

  const openCloneModal = useCallback((
    entityType: 'scenario' | 'dataset',
    id: Id<any>,
    name: string,
    parentId?: Id<any>
  ) => {
    const modalType = `clone-${entityType}` as ModalType
    openModal(modalType, {
      id,
      name,
      type: entityType,
      parentId
    })
  }, [openModal])

  const openBulkModal = useCallback((
    operation: 'delete' | 'clone',
    selectedIds: string[],
    entityType: 'scenario' | 'dataset'
  ) => {
    const modalType = `bulk-${operation}` as ModalType
    openModal(modalType, {
      selectedIds,
      type: entityType
    })
  }, [openModal])

  // Keyboard event handling for ESC key
  useEffect(() => {
    if (!closeOnEscape || !modalState.isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !modalState.isLoading) {
        closeModal()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeOnEscape, modalState.isOpen, modalState.isLoading, closeModal])

  // Success callback trigger
  useEffect(() => {
    if (onSuccess && modalState.type && modalState.data && !modalState.isLoading && !modalState.error) {
      // Only trigger success if we're not currently in a loading or error state
      // This prevents multiple success calls during normal operation
    }
  }, [onSuccess, modalState.type, modalState.data, modalState.isLoading, modalState.error])

  return {
    // State
    modalState,
    
    // Actions
    openModal,
    closeModal,
    setLoading,
    setError,
    updateModalData,
    
    // Helpers
    isModalOpen,
    isAnyModalOpen,
    getCurrentModalType,
    getCurrentModalData,
    
    // Workflow helpers
    openEditModal,
    openDeleteModal,
    openCloneModal,
    openBulkModal
  }
}