import { createContext, useContext, ReactNode } from 'react'
import { useModalState, UseModalStateReturn } from '@/hooks/useModalState'

interface ModalProviderProps {
  children: ReactNode
}

const ModalContext = createContext<UseModalStateReturn | undefined>(undefined)

/**
 * ModalProvider - Provides shared modal state across the entire application
 * Fixes the issue where SecondarySidebar and ModalManager had separate modal state instances
 */
export const ModalProvider = ({ children }: ModalProviderProps) => {
  const modalState = useModalState({
    closeOnEscape: true,
    closeOnOverlayClick: true,
  })

  return (
    <ModalContext.Provider value={modalState}>{children}</ModalContext.Provider>
  )
}

/**
 * useModal - Hook to access shared modal state
 * Replaces direct useModalState() calls in components
 */
export const useModal = (): UseModalStateReturn => {
  const context = useContext(ModalContext)
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}
