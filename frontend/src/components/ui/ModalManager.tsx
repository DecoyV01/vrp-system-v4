import { useModalState } from '@/hooks/useModalState'
import { useHierarchyOperations } from '@/hooks/useHierarchyOperations'
import { useToastNotifications } from '@/hooks/useToastNotifications'
import { useConfirmation } from './ConfirmationDialogProvider'
import { EditModal } from './EditModal'
import { DeleteConfirmationModal } from './DeleteConfirmationModal'
import { CloneModal } from './CloneModal'
import { confirmationMessages, getCascadeDeleteMessage } from '@/utils/confirmationMessages'
import { 
  useProject, 
  useScenario, 
  useDataset 
} from '@/hooks/useVRPData'
import type { Id } from '../convex/_generated/dataModel'

export interface ModalManagerProps {
  // Optional callbacks for custom handling
  onEditSuccess?: (entityType: string, entityId: string) => void
  onDeleteSuccess?: (entityType: string, entityId: string) => void
  onCloneSuccess?: (entityType: string, newEntityId?: string) => void
}

/**
 * ModalManager - Central component for managing all hierarchy operation modals
 * Orchestrates the modal state and operations using custom hooks
 * Following React.dev patterns for component composition and state management
 */
export const ModalManager = ({
  onEditSuccess,
  onDeleteSuccess,
  onCloneSuccess
}: ModalManagerProps) => {
  const {
    modalState,
    closeModal,
    setLoading,
    setError
  } = useModalState()

  // Fetch current entity data for editing
  const currentProject = useProject(
    modalState.isOpen && modalState.type === 'edit-project' && modalState.data?.id
      ? modalState.data.id as Id<'projects'>
      : undefined
  )
  
  const currentScenario = useScenario(
    modalState.isOpen && modalState.type === 'edit-scenario' && modalState.data?.id
      ? modalState.data.id as Id<'scenarios'>
      : undefined
  )
  
  const currentDataset = useDataset(
    modalState.isOpen && modalState.type === 'edit-dataset' && modalState.data?.id
      ? modalState.data.id as Id<'datasets'>
      : undefined
  )

  const {
    updateEntity,
    deleteEntity,
    cloneEntity,
    isUpdating,
    isDeleting,
    isCloning
  } = useHierarchyOperations()

  const {
    confirmDelete,
    confirmClone,
    confirmSave
  } = useConfirmation()

  const {
    notifyOperationResult,
    startProgress,
    updateProgress
  } = useToastNotifications()

  // Edit modal handlers
  const handleEditSave = async (updatedData: any) => {
    if (!modalState.data?.type || !modalState.data?.id) return

    const performSave = async () => {
      const entityType = modalState.data.type
      const entityName = updatedData.name || modalState.data.name
      const toastId = startProgress('Updating', entityType)

      try {
        setLoading(true)
        await updateEntity(modalState.data.type, {
          id: modalState.data.id,
          ...updatedData
        })
        
        updateProgress(toastId, true, `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} "${entityName}" updated successfully`)
        onEditSuccess?.(modalState.data.type, modalState.data.id)
        closeModal()
      } catch (error) {
        const message = error instanceof Error ? error.message : `Failed to update ${entityType}`
        updateProgress(toastId, false, message)
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    // For now, save directly. In the future, we could add change detection
    // and use confirmSave for unsaved changes confirmation
    await performSave()
  }

  // Delete modal handlers
  const handleDeleteConfirm = async () => {
    if (!modalState.data?.type || !modalState.data?.id) return

    const entityType = modalState.data.type
    const entityName = modalState.data.name
    const toastId = startProgress('Deleting', entityType)

    try {
      setLoading(true)
      await deleteEntity(
        modalState.data.type,
        modalState.data.id,
        { skipCascadeCheck: true } // Already handled in modal display
      )
      
      updateProgress(toastId, true, `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} "${entityName}" deleted successfully`)
      onDeleteSuccess?.(modalState.data.type, modalState.data.id)
      closeModal()
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to delete ${entityType}`
      updateProgress(toastId, false, message)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  // Clone modal handlers
  const handleClone = async (newName: string) => {
    if (!modalState.data?.type || !modalState.data?.id || !modalState.data?.parentId) return

    const performClone = async () => {
      const entityType = modalState.data.type
      const originalName = modalState.data.name
      const toastId = startProgress('Cloning', entityType)

      try {
        setLoading(true)
        await cloneEntity(
          modalState.data.type as 'scenario' | 'dataset',
          modalState.data.id,
          newName,
          modalState.data.parentId
        )
        
        updateProgress(toastId, true, `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} "${originalName}" cloned as "${newName}"`)
        onCloneSuccess?.(modalState.data.type)
        closeModal()
      } catch (error) {
        const message = error instanceof Error ? error.message : `Failed to clone ${entityType}`
        updateProgress(toastId, false, message)
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    // Use confirmation dialog for clone operations
    const entityName = modalState.data.name || 'Unknown'
    const entityType = modalState.data.type
    
    if (entityType === 'scenario') {
      const message = confirmationMessages.scenario.clone(entityName)
      confirmClone(entityName, entityType, performClone)
    } else if (entityType === 'dataset') {
      const message = confirmationMessages.dataset.clone(entityName)
      confirmClone(entityName, entityType, performClone)
    } else {
      // Fallback for direct clone
      await performClone()
    }
  }

  // Get current entity data for editing
  const getCurrentEntityData = () => {
    if (!modalState.data?.type || !modalState.data?.id) return null
    
    let currentEntity = null
    switch (modalState.data.type) {
      case 'project':
        currentEntity = currentProject
        break
      case 'scenario':
        currentEntity = currentScenario
        break
      case 'dataset':
        currentEntity = currentDataset
        break
    }
    
    if (!currentEntity) return null
    
    return {
      id: modalState.data.id,
      name: currentEntity.name || '',
      description: currentEntity.description || '',
      type: modalState.data.type
    }
  }

  return (
    <>
      {/* Edit Modal */}
      <EditModal
        isOpen={modalState.isOpen && modalState.type?.startsWith('edit-') === true}
        onClose={closeModal}
        data={getCurrentEntityData()}
        onSave={handleEditSave}
        isLoading={isUpdating || modalState.isLoading}
        error={modalState.error}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={modalState.isOpen && modalState.type?.startsWith('delete-') === true}
        onClose={closeModal}
        data={modalState.data ? {
          id: modalState.data.id!,
          name: modalState.data.name!,
          type: modalState.data.type!,
          cascadeInfo: modalState.data.cascadeInfo
        } : null}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting || modalState.isLoading}
        error={modalState.error}
        requireNameConfirmation={true}
      />

      {/* Clone Modal */}
      <CloneModal
        isOpen={modalState.isOpen && modalState.type?.startsWith('clone-') === true}
        onClose={closeModal}
        data={modalState.data ? {
          id: modalState.data.id! as Id<'scenarios'> | Id<'datasets'>,
          name: modalState.data.name!,
          type: modalState.data.type! as 'scenario' | 'dataset',
          parentId: modalState.data.parentId
        } : null}
        onClone={handleClone}
        isLoading={isCloning || modalState.isLoading}
        error={modalState.error}
      />
    </>
  )
}

// Export hook for components to access modal functionality
export const useModalManager = () => {
  const modalState = useModalState()
  
  return {
    ...modalState,
    // Convenience methods for opening modals
    openEditModal: modalState.openEditModal,
    openDeleteModal: modalState.openDeleteModal,
    openCloneModal: modalState.openCloneModal
  }
}