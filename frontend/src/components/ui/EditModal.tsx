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
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Id } from '../../../convex/_generated/dataModel'

export interface EditModalData {
  id: Id<'projects'> | Id<'scenarios'> | Id<'datasets'>
  name: string
  description?: string
  type: 'project' | 'scenario' | 'dataset'
}

export interface EditModalProps {
  isOpen: boolean
  onClose: () => void
  data: EditModalData | null
  onSave: (updatedData: Partial<EditModalData>) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

/**
 * EditModal - Reusable modal for editing project, scenario, and dataset entities
 * Following shadcn/ui v4 patterns with proper accessibility and design system compliance
 */
export const EditModal = ({ 
  isOpen, 
  onClose, 
  data, 
  onSave, 
  isLoading = false, 
  error = null 
}: EditModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens with new data
  useEffect(() => {
    if (data) {
      setFormData({
        name: data.name || '',
        description: data.description || ''
      })
      setValidationErrors({})
    }
  }, [data])

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Name must be 100 characters or less'
    }
    
    if (formData.description && formData.description.length > 1000) {
      errors.description = 'Description must be 1000 characters or less'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!data || !validateForm()) return
    
    try {
      await onSave({
        id: data.id,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      })
      onClose()
    } catch (error) {
      // Error handling is managed by parent component
      console.error('Save failed:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSave()
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
          <DialogTitle className="text-lg font-semibold">
            Edit {entityTypeDisplayName}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Update the name and description for this {data.type}.
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
            <Label htmlFor="edit-name" className="text-sm font-normal">
              Name *
            </Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={`Enter ${data.type} name`}
              disabled={isLoading}
              className={validationErrors.name ? 'border-destructive' : ''}
              autoFocus
            />
            {validationErrors.name && (
              <p className="text-sm text-destructive">{validationErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description" className="text-sm font-normal">
              Description
            </Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={`Enter ${data.type} description (optional)`}
              disabled={isLoading}
              className={validationErrors.description ? 'border-destructive' : ''}
              rows={3}
            />
            {validationErrors.description && (
              <p className="text-sm text-destructive">{validationErrors.description}</p>
            )}
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
            onClick={handleSave}
            disabled={isLoading || Object.keys(validationErrors).length > 0}
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}