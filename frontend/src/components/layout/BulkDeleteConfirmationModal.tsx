import { useState, useCallback } from 'react'
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
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, Trash2, Database, Folder } from 'lucide-react'
import type { TreeNode } from '@/hooks/useTreeNavigation'
import type { BulkOperationResult } from '@/hooks/useHierarchyOperations'

interface BulkDeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<BulkOperationResult>
  selectedNodes: TreeNode[]
  isDeleting?: boolean
}

interface CascadeAnalysis {
  totalImpact: number
  byType: {
    scenarios: number
    datasets: number
    vehicles: number
    jobs: number
    locations: number
  }
  warnings: string[]
}

const BulkDeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  selectedNodes,
  isDeleting = false
}: BulkDeleteConfirmationModalProps) => {
  const [confirmationText, setConfirmationText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [cascadeAnalysis, setCascadeAnalysis] = useState<CascadeAnalysis | null>(null)
  const [deleteProgress, setDeleteProgress] = useState<{
    current: number
    total: number
    currentItem: string
  } | null>(null)

  // Calculate type breakdown
  const typeBreakdown = selectedNodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Generate confirmation text requirement
  const confirmationRequired = `DELETE ${selectedNodes.length} ITEMS`
  const isConfirmationValid = confirmationText === confirmationRequired

  // Simulate cascade analysis (in real implementation, this would call the backend)
  const analyzeCascadeImpact = useCallback(async () => {
    setIsAnalyzing(true)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock cascade analysis based on selected nodes
      const mockAnalysis: CascadeAnalysis = {
        totalImpact: selectedNodes.length * 15, // Simulated cascade multiplier
        byType: {
          scenarios: typeBreakdown.scenario || 0,
          datasets: typeBreakdown.dataset || 0,
          vehicles: (typeBreakdown.scenario || 0) * 8 + (typeBreakdown.dataset || 0) * 5,
          jobs: (typeBreakdown.scenario || 0) * 12 + (typeBreakdown.dataset || 0) * 8,
          locations: (typeBreakdown.scenario || 0) * 6 + (typeBreakdown.dataset || 0) * 4
        },
        warnings: [
          'This action cannot be undone',
          'All data in selected items will be permanently deleted',
          `Deleting ${selectedNodes.length} items will cascade to delete related data`,
          'Consider exporting data before deletion if needed'
        ]
      }
      
      setCascadeAnalysis(mockAnalysis)
    } catch (error) {
      console.error('Failed to analyze cascade impact:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [selectedNodes, typeBreakdown])

  // Start cascade analysis when modal opens
  useState(() => {
    if (isOpen && !cascadeAnalysis && !isAnalyzing) {
      analyzeCascadeImpact()
    }
  })

  const handleConfirm = async () => {
    try {
      setDeleteProgress({
        current: 0,
        total: selectedNodes.length,
        currentItem: selectedNodes[0]?.name || 'Unknown'
      })

      // Simulate progress updates during deletion
      const progressInterval = setInterval(() => {
        setDeleteProgress(prev => {
          if (!prev || prev.current >= prev.total) return prev
          
          const newCurrent = prev.current + 1
          const currentNode = selectedNodes[newCurrent - 1]
          
          return {
            current: newCurrent,
            total: prev.total,
            currentItem: currentNode?.name || 'Completing...'
          }
        })
      }, 800)

      // Execute the actual deletion
      const result = await onConfirm()
      
      clearInterval(progressInterval)
      setDeleteProgress(null)
      
      // Close modal on success
      if (result.success > 0) {
        onClose()
      }
    } catch (error) {
      console.error('Bulk delete failed:', error)
      setDeleteProgress(null)
    }
  }

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'scenario':
        return <Database className="w-4 h-4" />
      case 'dataset':
        return <Folder className="w-4 h-4" />
      default:
        return <Folder className="w-4 h-4" />
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Confirm Bulk Deletion
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to permanently delete {selectedNodes.length} items. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6">
          {/* Selection Summary */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Items to Delete</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(typeBreakdown).map(([type, count]) => (
                <Badge key={type} variant="outline" className="flex items-center gap-1">
                  {renderTypeIcon(type)}
                  {count} {type}{count !== 1 ? 's' : ''}
                </Badge>
              ))}
            </div>
            
            {/* List of selected items */}
            <div className="max-h-32 overflow-y-auto border rounded p-2 bg-muted/30">
              {selectedNodes.map((node, index) => (
                <div key={node.id} className="text-xs flex items-center gap-2 py-1">
                  {renderTypeIcon(node.type)}
                  <span className="truncate">{node.name}</span>
                  <Badge variant="secondary" className="text-xs">{node.type}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Cascade Impact Analysis */}
          {isAnalyzing && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <LoadingSpinner className="w-4 h-4" />
                <span className="text-sm">Analyzing cascade impact...</span>
              </div>
            </div>
          )}

          {cascadeAnalysis && (
            <div className="space-y-4">
              <Separator />
              
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Cascade Impact Analysis
                </h4>
                
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>Total Impact:</strong> {cascadeAnalysis.totalImpact} related items will be deleted
                  </AlertDescription>
                </Alert>

                {/* Detailed breakdown */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium mb-2">Direct Deletions:</p>
                    <ul className="space-y-1">
                      {cascadeAnalysis.byType.scenarios > 0 && (
                        <li>{cascadeAnalysis.byType.scenarios} scenarios</li>
                      )}
                      {cascadeAnalysis.byType.datasets > 0 && (
                        <li>{cascadeAnalysis.byType.datasets} datasets</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-medium mb-2">Cascade Deletions:</p>
                    <ul className="space-y-1">
                      {cascadeAnalysis.byType.vehicles > 0 && (
                        <li>{cascadeAnalysis.byType.vehicles} vehicles</li>
                      )}
                      {cascadeAnalysis.byType.jobs > 0 && (
                        <li>{cascadeAnalysis.byType.jobs} jobs</li>
                      )}
                      {cascadeAnalysis.byType.locations > 0 && (
                        <li>{cascadeAnalysis.byType.locations} locations</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Warnings */}
                <div className="space-y-2">
                  {cascadeAnalysis.warnings.map((warning, index) => (
                    <Alert key={index} className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-800 text-sm">
                        {warning}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Progress Tracking */}
          {deleteProgress && (
            <div className="space-y-3">
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Deleting items...</span>
                  <span>{deleteProgress.current} of {deleteProgress.total}</span>
                </div>
                
                <Progress 
                  value={(deleteProgress.current / deleteProgress.total) * 100} 
                  className="h-2"
                />
                
                <p className="text-xs text-muted-foreground">
                  Currently deleting: {deleteProgress.currentItem}
                </p>
              </div>
            </div>
          )}

          {/* Confirmation Input */}
          {cascadeAnalysis && !deleteProgress && (
            <div className="space-y-3">
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="confirmation" className="text-sm font-medium">
                  Type <code className="bg-muted px-1 rounded">{confirmationRequired}</code> to confirm deletion:
                </Label>
                <Input
                  id="confirmation"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder={confirmationRequired}
                  className={isConfirmationValid ? 'border-green-500' : ''}
                  disabled={isDeleting}
                />
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isDeleting || deleteProgress !== null}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmationValid || isDeleting || !cascadeAnalysis || deleteProgress !== null}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting || deleteProgress ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete {selectedNodes.length} Items
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default BulkDeleteConfirmationModal