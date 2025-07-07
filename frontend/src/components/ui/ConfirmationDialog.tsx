import { ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { LucideIcon } from 'lucide-react'

export interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string | ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'warning'
  icon?: LucideIcon
  isLoading?: boolean
  disabled?: boolean
}

/**
 * ConfirmationDialog - Generic reusable confirmation dialog component
 * Provides consistent messaging patterns and behavior across the application
 * Following shadcn/ui v4 AlertDialog patterns with design system compliance
 */
export const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  icon: Icon,
  isLoading = false,
  disabled = false
}: ConfirmationDialogProps) => {
  const handleConfirm = async () => {
    try {
      await onConfirm()
    } catch (error) {
      // Error handling should be managed by parent component
      console.error('Confirmation action failed:', error)
    }
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          iconColor: 'text-destructive',
          buttonClass: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
        }
      case 'warning':
        return {
          iconColor: 'text-orange-600',
          buttonClass: 'bg-orange-600 text-white hover:bg-orange-700'
        }
      default:
        return {
          iconColor: 'text-primary',
          buttonClass: 'bg-primary text-primary-foreground hover:bg-primary/90'
        }
    }
  }

  const variantStyles = getVariantStyles()

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-lg font-semibold">
            {Icon && <Icon className={`w-5 h-5 ${variantStyles.iconColor}`} />}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            {typeof description === 'string' ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : (
              <div className="text-sm text-muted-foreground">{description}</div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading || disabled}
            className={variantStyles.buttonClass}
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}