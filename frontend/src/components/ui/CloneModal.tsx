import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Copy, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Id } from '../../../convex/_generated/dataModel'

export interface CloneModalData {
  id: Id<'scenarios'> | Id<'datasets'>
  name: string
  type: 'scenario' | 'dataset'
  parentId?: Id<'projects'> | Id<'scenarios'>
}

export interface CloneModalProps {
  isOpen: boolean
  onClose: () => void
  data: CloneModalData | null
  onClone: (newName: string) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

/**
 * CloneModal - Reusable modal for cloning scenarios and datasets
 * Provides smart name generation with user customization
 * Following shadcn/ui v4 patterns with proper accessibility and design system compliance
 */
export const CloneModal = ({
  isOpen,
  onClose,
  data,
  onClone,
  isLoading = false,
  error = null
}: CloneModalProps) => {
  const [newName, setNewName] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Generate smart default name when modal opens
  useEffect(() => {
    if (data && isOpen) {
      const generateDefaultName = (originalName: string): string => {
        const copyPattern = /^(.+?)(?:\s+\(copy(?:\s+\d+)?\))?$/i
        const match = originalName.match(copyPattern)
        const baseName = match ? match[1] : originalName
        
        // Generate name with current timestamp for uniqueness
        const timestamp = new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
        
        return `${baseName} (copy ${timestamp})`
      }

      setNewName(generateDefaultName(data.name))
      setValidationErrors({})
    }
  }, [data, isOpen])

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!newName.trim()) {
      errors.name = 'Name is required'
    } else if (newName.trim().length > 100) {
      errors.name = 'Name must be 100 characters or less'
    } else if (data && newName.trim().toLowerCase() === data.name.toLowerCase()) {
      errors.name = 'New name must be different from the original'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleClone = async () => {
    if (!data || !validateForm()) return
    
    try {
      await onClone(newName.trim())
      onClose()
    } catch (error) {
      // Error handling is managed by parent component
      console.error('Clone failed:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleClone()
    }
  }

  const handleNameChange = (value: string) => {
    setNewName(value)
    // Clear validation errors on change
    if (validationErrors.name) {
      setValidationErrors({})
    }
  }

  if (!data) return null

  const entityTypeDisplayName = data.type.charAt(0).toUpperCase() + data.type.slice(1)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Copy className="w-5 h-5" />
            Clone {entityTypeDisplayName}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Create a copy of "{data.name}" with a new name. All associated data will be duplicated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="clone-name" className="text-sm font-normal">
              New {data.type} name *
            </Label>
            <Input
              id="clone-name"
              value={newName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={`Enter new ${data.type} name`}
              disabled={isLoading}
              className={validationErrors.name ? 'border-destructive' : ''}
              autoFocus
            />
            {validationErrors.name && (
              <p className="text-sm text-destructive">{validationErrors.name}</p>
            )}
            <p className="text-xs text-muted-foreground">
              The clone will include all data from the original {data.type}.
            </p>
          </div>

          {/* Clone operation details */}
          <div className="rounded-lg bg-muted p-3 space-y-2">
            <h4 className="text-sm font-normal">What will be cloned:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• {entityTypeDisplayName} configuration and metadata</li>
              {data.type === 'scenario' && (
                <>
                  <li>• All datasets within this scenario</li>
                  <li>• Associated vehicles, jobs, and locations</li>
                </>
              )}
              {data.type === 'dataset' && (
                <>
                  <li>• All vehicles, jobs, and locations in this dataset</li>
                  <li>• Table configurations and relationships</li>
                </>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="sm:mr-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleClone}
            disabled={isLoading || !newName.trim() || Object.keys(validationErrors).length > 0}
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Cloning...
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Create Clone
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}