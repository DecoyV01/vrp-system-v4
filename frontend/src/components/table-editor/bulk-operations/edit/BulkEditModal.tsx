import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Edit3, 
  X, 
  CheckCircle2,
  AlertCircle,
  Settings,
  Save
} from 'lucide-react'
import { BulkEditForm } from './BulkEditForm'
import { useBulkEdit } from '../hooks/useBulkEdit'
import type { VRPTableType } from '../types/shared.types'
import type { BulkEditOptions, BulkEditOperation } from '../types/bulk-edit.types'

interface BulkEditModalProps {
  isOpen: boolean
  onClose: () => void
  tableType: VRPTableType
  selectedRows: any[]
  onEditComplete: (updatedRows: any[]) => void
  availableFields: string[]
  className?: string
}

export function BulkEditModal({
  isOpen,
  onClose,
  tableType,
  selectedRows,
  onEditComplete,
  availableFields,
  className
}: BulkEditModalProps) {
  const [currentView, setCurrentView] = useState<'form' | 'preview' | 'progress' | 'complete'>('form')
  const [editOperations, setEditOperations] = useState<BulkEditOperation[]>([])
  const [editOptions, setEditOptions] = useState<BulkEditOptions>({
    mode: 'update',
    updateExisting: true,
    preserveEmpty: false,
    validationLevel: 'strict'
  })

  const { 
    editState, 
    startBulkEdit, 
    cancelEdit, 
    resetEdit, 
    isEditing, 
    isCompleted, 
    hasError 
  } = useBulkEdit()

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentView('form')
      setEditOperations([])
      resetEdit()
    }
  }, [isOpen, resetEdit])

  // Update view based on edit state
  useEffect(() => {
    if (isEditing) {
      setCurrentView('progress')
    } else if (isCompleted) {
      setCurrentView('complete')
    } else if (hasError) {
      setCurrentView('form')
    }
  }, [isEditing, isCompleted, hasError])

  const handleOperationsChange = (operations: BulkEditOperation[]) => {
    setEditOperations(operations)
  }

  const handleOptionsChange = (options: BulkEditOptions) => {
    setEditOptions(options)
  }

  const handlePreview = () => {
    if (editOperations.length === 0) {
      alert('Please add at least one edit operation')
      return
    }
    setCurrentView('preview')
  }

  const handleStartEdit = async () => {
    try {
      await startBulkEdit(selectedRows, editOperations, editOptions, tableType)
    } catch (error) {
      console.error('Bulk edit failed:', error)
    }
  }

  const handleComplete = () => {
    if (editState.updatedRows) {
      onEditComplete(editState.updatedRows)
    }
    onClose()
  }

  const handleCancel = () => {
    if (isEditing) {
      cancelEdit()
    }
    onClose()
  }

  const renderContent = () => {
    switch (currentView) {
      case 'form':
        return (
          <BulkEditForm
            operations={editOperations}
            options={editOptions}
            onOperationsChange={handleOperationsChange}
            onOptionsChange={handleOptionsChange}
            availableFields={availableFields}
            selectedRowsCount={selectedRows.length}
            onPreview={handlePreview}
            isValid={editOperations.length > 0}
          />
        )

      case 'preview':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold mb-4">Edit Preview</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Records to edit:</span>
                  <span className="font-semibold">{selectedRows.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Operations:</span>
                  <span className="font-semibold">{editOperations.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Mode:</span>
                  <span className="font-semibold capitalize">{editOptions.mode}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Operations Summary:</h4>
              {editOperations.map((operation, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{operation.field}</span>
                      <span className="text-muted-foreground ml-2">
                        {operation.operation === 'set' && 'Set to'}
                        {operation.operation === 'increment' && 'Increment by'}
                        {operation.operation === 'multiply' && 'Multiply by'}
                        {operation.operation === 'append' && 'Append'}
                        {operation.operation === 'prepend' && 'Prepend'}
                      </span>
                    </div>
                    <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                      {String(operation.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setCurrentView('form')}>
                Back to Edit
              </Button>
              <Button onClick={handleStartEdit} className="gap-2">
                <Save className="h-4 w-4" />
                Apply Changes
              </Button>
            </div>
          </div>
        )

      case 'progress':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="p-4 bg-primary/10 rounded-lg inline-block mb-4">
                <Edit3 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Applying Changes</h3>
              <p className="text-muted-foreground">
                Please wait while we update your records...
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>{editState.progress.current}/{editState.progress.total}</span>
                </div>
                <Progress 
                  value={editState.progress.total > 0 ? (editState.progress.current / editState.progress.total) * 100 : 0}
                  className="h-2"
                />
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                {editState.progress.message}
              </div>
            </div>

            <div className="flex justify-center">
              <Button variant="outline" onClick={handleCancel}>
                Cancel Edit
              </Button>
            </div>
          </div>
        )

      case 'complete':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="p-4 bg-green-100 rounded-lg inline-block mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Changes Applied</h3>
              <p className="text-muted-foreground">
                Your bulk edit has been completed successfully
              </p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Records updated:</span>
                  <span className="ml-2 font-semibold">{editState.progress.current}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Operations:</span>
                  <span className="ml-2 font-semibold">{editOperations.length}</span>
                </div>
              </div>
            </div>

            {hasError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {editState.progress.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleComplete}>
                Apply to Table
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${className}`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                {currentView === 'form' && <Settings className="h-5 w-5 text-primary" />}
                {currentView === 'preview' && <Edit3 className="h-5 w-5 text-primary" />}
                {currentView === 'progress' && <Edit3 className="h-5 w-5 text-primary" />}
                {currentView === 'complete' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </div>
              <div>
                <DialogTitle>
                  {currentView === 'form' && 'Bulk Edit Records'}
                  {currentView === 'preview' && 'Review Changes'}
                  {currentView === 'progress' && 'Applying Changes'}
                  {currentView === 'complete' && 'Edit Complete'}
                </DialogTitle>
                <DialogDescription>
                  {currentView === 'form' && `Configure bulk edit operations for ${selectedRows.length} ${tableType} records`}
                  {currentView === 'preview' && 'Review your changes before applying them'}
                  {currentView === 'progress' && 'Please wait while we update your records'}
                  {currentView === 'complete' && 'Your bulk edit has been completed successfully'}
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="py-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}