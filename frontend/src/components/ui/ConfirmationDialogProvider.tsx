import { createContext, useContext, ReactNode } from 'react'
import { useConfirmationDialog, UseConfirmationDialogReturn } from '@/hooks/useConfirmationDialog'
import { ConfirmationDialog } from './ConfirmationDialog'

// Create context for confirmation dialog
const ConfirmationDialogContext = createContext<UseConfirmationDialogReturn | null>(null)

export interface ConfirmationDialogProviderProps {
  children: ReactNode
}

/**
 * ConfirmationDialogProvider - Provides confirmation dialog functionality throughout the app
 * Manages a single confirmation dialog instance that can be used from any component
 * Following React context patterns for global state management
 */
export const ConfirmationDialogProvider = ({ children }: ConfirmationDialogProviderProps) => {
  const confirmationDialog = useConfirmationDialog()

  const handleConfirm = async () => {
    if (!confirmationDialog.confirmationState.onConfirm) return

    try {
      confirmationDialog.setLoading(true)
      await confirmationDialog.confirmationState.onConfirm()
      confirmationDialog.closeConfirmation()
    } catch (error) {
      console.error('Confirmation action failed:', error)
      // Don't close the dialog on error, let the parent handle it
    } finally {
      confirmationDialog.setLoading(false)
    }
  }

  return (
    <ConfirmationDialogContext.Provider value={confirmationDialog}>
      {children}
      
      {/* Global confirmation dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.confirmationState.isOpen}
        onClose={confirmationDialog.closeConfirmation}
        onConfirm={handleConfirm}
        title={confirmationDialog.confirmationState.config?.title || ''}
        description={confirmationDialog.confirmationState.config?.description || ''}
        confirmText={confirmationDialog.confirmationState.config?.confirmText}
        cancelText={confirmationDialog.confirmationState.config?.cancelText}
        variant={confirmationDialog.confirmationState.config?.variant}
        icon={confirmationDialog.confirmationState.config?.icon}
        isLoading={confirmationDialog.confirmationState.isLoading}
      />
    </ConfirmationDialogContext.Provider>
  )
}

/**
 * Hook to access confirmation dialog functionality from any component
 * Must be used within a ConfirmationDialogProvider
 */
export const useConfirmation = (): UseConfirmationDialogReturn => {
  const context = useContext(ConfirmationDialogContext)
  
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationDialogProvider')
  }
  
  return context
}

// Re-export for convenience
export type { UseConfirmationDialogReturn as ConfirmationDialogApi }