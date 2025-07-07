import { useState } from 'react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { AlertTriangle, Trash2, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Id } from '../convex/_generated/dataModel'

export interface CascadeInfo {
  childCount: number
  childType: string
  warnings: string[]
  affectedEntities: {
    scenarios?: number
    datasets?: number
    vehicles?: number
    jobs?: number
    locations?: number
  }
}

export interface DeleteConfirmationData {
  id: Id<'projects'> | Id<'scenarios'> | Id<'datasets'>
  name: string
  type: 'project' | 'scenario' | 'dataset'
  cascadeInfo?: CascadeInfo
}

export interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  data: DeleteConfirmationData | null
  onConfirm: () => Promise<void>
  isLoading?: boolean
  error?: string | null
  requireNameConfirmation?: boolean
}

/**
 * DeleteConfirmationModal - Reusable modal for confirming deletion of entities
 * Includes cascade warning and optional name confirmation for destructive operations
 * Following shadcn/ui v4 AlertDialog patterns with proper accessibility
 */
export const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  data,
  onConfirm,
  isLoading = false,
  error = null,
  requireNameConfirmation = true
}: DeleteConfirmationModalProps) => {
  const [confirmationName, setConfirmationName] = useState('')
  const [isNameValid, setIsNameValid] = useState(false)

  // Validate confirmation name
  const handleNameChange = (value: string) => {
    setConfirmationName(value)
    setIsNameValid(data ? value.toLowerCase() === data.name.toLowerCase() : false)
  }

  const handleConfirm = async () => {
    if (requireNameConfirmation && !isNameValid) return
    
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      // Error handling is managed by parent component
      console.error('Delete failed:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (!requireNameConfirmation || isNameValid)) {
      e.preventDefault()
      handleConfirm()
    }
  }

  if (!data) return null

  const entityTypeDisplayName = data.type.charAt(0).toUpperCase() + data.type.slice(1)
  const hasCascadeWarnings = data.cascadeInfo && data.cascadeInfo.childCount > 0

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent 
        className="sm:max-w-lg"
        onKeyDown={handleKeyDown}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Trash2 className="w-5 h-5 text-destructive" />
            Delete {entityTypeDisplayName}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <strong className="font-normal text-foreground">"{data.name}"</strong>? 
                This action cannot be undone.
              </p>

              {/* Cascade warnings */}
              {hasCascadeWarnings && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-normal">
                        <strong>Warning:</strong> This will also delete:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {data.cascadeInfo?.affectedEntities?.scenarios && (
                          <Badge variant="destructive" className="text-xs">
                            {data.cascadeInfo.affectedEntities.scenarios} scenario{data.cascadeInfo.affectedEntities.scenarios !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {data.cascadeInfo?.affectedEntities?.datasets && (
                          <Badge variant="destructive" className="text-xs">
                            {data.cascadeInfo.affectedEntities.datasets} dataset{data.cascadeInfo.affectedEntities.datasets !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {data.cascadeInfo?.affectedEntities?.vehicles && (
                          <Badge variant="destructive" className="text-xs">
                            {data.cascadeInfo.affectedEntities.vehicles} vehicle{data.cascadeInfo.affectedEntities.vehicles !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {data.cascadeInfo?.affectedEntities?.jobs && (
                          <Badge variant="destructive" className="text-xs">
                            {data.cascadeInfo.affectedEntities.jobs} job{data.cascadeInfo.affectedEntities.jobs !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {data.cascadeInfo?.affectedEntities?.locations && (
                          <Badge variant="destructive" className="text-xs">
                            {data.cascadeInfo.affectedEntities.locations} location{data.cascadeInfo.affectedEntities.locations !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      {data.cascadeInfo?.warnings?.map((warning, index) => (
                        <p key={index} className="text-xs text-muted-foreground">
                          {warning}
                        </p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Error display */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Name confirmation */}
              {requireNameConfirmation && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="confirm-name" className="text-sm font-normal">
                    Type <code className="text-xs bg-muted px-1 py-0.5 rounded">{data.name}</code> to confirm deletion:
                  </Label>
                  <Input
                    id="confirm-name"
                    value={confirmationName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder={data.name}
                    disabled={isLoading}
                    className={confirmationName && !isNameValid ? 'border-destructive' : ''}
                    autoFocus
                  />
                  {confirmationName && !isNameValid && (
                    <p className="text-xs text-destructive">
                      Name does not match. Please type "{data.name}" exactly.
                    </p>
                  )}
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading || (requireNameConfirmation && !isNameValid)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete {entityTypeDisplayName}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}