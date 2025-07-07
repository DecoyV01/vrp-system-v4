import { useState, useCallback, useEffect } from 'react'
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
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Copy, 
  Database, 
  Folder, 
  Calendar,
  Hash,
  User,
  RefreshCw
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TreeNode } from '@/hooks/useTreeNavigation'
import type { BulkOperationResult } from '@/hooks/useHierarchyOperations'

interface BulkCloneModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (namePrefix: string, namingStrategy: NamingStrategy) => Promise<BulkOperationResult>
  selectedNodes: TreeNode[]
  isCloning?: boolean
}

type NamingStrategy = 'timestamp' | 'incremental' | 'custom' | 'date' | 'user-prefix'

interface NamingPreview {
  originalName: string
  newName: string
  strategy: string
}

const BulkCloneModal = ({
  isOpen,
  onClose,
  onConfirm,
  selectedNodes,
  isCloning = false
}: BulkCloneModalProps) => {
  const [namePrefix, setNamePrefix] = useState('')
  const [namingStrategy, setNamingStrategy] = useState<NamingStrategy>('timestamp')
  const [customSuffix, setCustomSuffix] = useState('')
  const [previews, setPreviews] = useState<NamingPreview[]>([])
  const [cloneProgress, setCloneProgress] = useState<{
    current: number
    total: number
    currentItem: string
  } | null>(null)

  // Calculate type breakdown
  const typeBreakdown = selectedNodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Generate intelligent default prefix based on selection
  const generateDefaultPrefix = useCallback(() => {
    const hasOnlyScenarios = typeBreakdown.scenario && !typeBreakdown.dataset
    const hasOnlyDatasets = typeBreakdown.dataset && !typeBreakdown.scenario
    const hasMixed = typeBreakdown.scenario && typeBreakdown.dataset

    if (hasOnlyScenarios) {
      return selectedNodes.length === 1 ? 'Copy of' : 'Bulk Scenarios'
    } else if (hasOnlyDatasets) {
      return selectedNodes.length === 1 ? 'Copy of' : 'Bulk Datasets'
    } else if (hasMixed) {
      return 'Bulk Items'
    } else {
      return 'Copy of'
    }
  }, [selectedNodes, typeBreakdown])

  // Set initial prefix when modal opens
  useEffect(() => {
    if (isOpen && !namePrefix) {
      setNamePrefix(generateDefaultPrefix())
    }
  }, [isOpen, namePrefix, generateDefaultPrefix])

  // Generate naming previews based on strategy
  const generatePreviews = useCallback(() => {
    const now = new Date()
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const dateString = now.toISOString().slice(0, 10)
    const userName = 'Current User' // In real app, get from auth context

    const newPreviews: NamingPreview[] = selectedNodes.map((node, index) => {
      let newName = ''
      let strategy = ''

      switch (namingStrategy) {
        case 'timestamp':
          newName = `${namePrefix} ${node.name} ${timestamp}`
          strategy = 'Timestamp suffix'
          break
          
        case 'incremental':
          newName = `${namePrefix} ${node.name} ${(index + 1).toString().padStart(2, '0')}`
          strategy = 'Incremental numbers'
          break
          
        case 'date':
          newName = `${namePrefix} ${node.name} ${dateString}`
          strategy = 'Date suffix'
          break
          
        case 'user-prefix':
          newName = `${userName} - ${namePrefix} ${node.name}`
          strategy = 'User prefix'
          break
          
        case 'custom':
          newName = customSuffix 
            ? `${namePrefix} ${node.name} ${customSuffix}`
            : `${namePrefix} ${node.name}`
          strategy = 'Custom suffix'
          break
          
        default:
          newName = `${namePrefix} ${node.name}`
          strategy = 'Simple prefix'
      }

      return {
        originalName: node.name,
        newName: newName.trim(),
        strategy
      }
    })

    setPreviews(newPreviews)
  }, [selectedNodes, namePrefix, namingStrategy, customSuffix])

  // Update previews when parameters change
  useEffect(() => {
    generatePreviews()
  }, [generatePreviews])

  const handleConfirm = async () => {
    try {
      setCloneProgress({
        current: 0,
        total: selectedNodes.length,
        currentItem: selectedNodes[0]?.name || 'Unknown'
      })

      // Simulate progress updates during cloning
      const progressInterval = setInterval(() => {
        setCloneProgress(prev => {
          if (!prev || prev.current >= prev.total) return prev
          
          const newCurrent = prev.current + 1
          const currentNode = selectedNodes[newCurrent - 1]
          
          return {
            current: newCurrent,
            total: prev.total,
            currentItem: currentNode?.name || 'Completing...'
          }
        })
      }, 1200) // Slower for cloning operations

      // Execute the actual cloning
      const result = await onConfirm(namePrefix, namingStrategy)
      
      clearInterval(progressInterval)
      setCloneProgress(null)
      
      // Close modal on success
      if (result.success > 0) {
        onClose()
      }
    } catch (error) {
      console.error('Bulk clone failed:', error)
      setCloneProgress(null)
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

  const isFormValid = namePrefix.trim().length > 0 && 
                     (namingStrategy !== 'custom' || customSuffix.trim().length > 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-primary" />
            Bulk Clone Items
          </DialogTitle>
          <DialogDescription>
            Clone {selectedNodes.length} selected items with intelligent naming conventions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selection Summary */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Items to Clone</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(typeBreakdown).map(([type, count]) => (
                <Badge key={type} variant="outline" className="flex items-center gap-1">
                  {renderTypeIcon(type)}
                  {count} {type}{count !== 1 ? 's' : ''}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Naming Configuration */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Naming Configuration</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name Prefix */}
              <div className="space-y-2">
                <Label htmlFor="namePrefix">Name Prefix</Label>
                <div className="flex gap-2">
                  <Input
                    id="namePrefix"
                    value={namePrefix}
                    onChange={(e) => setNamePrefix(e.target.value)}
                    placeholder="Enter prefix..."
                    disabled={isCloning}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setNamePrefix(generateDefaultPrefix())}
                    disabled={isCloning}
                    title="Reset to smart default"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Naming Strategy */}
              <div className="space-y-2">
                <Label htmlFor="namingStrategy">Naming Strategy</Label>
                <Select value={namingStrategy} onValueChange={(value: NamingStrategy) => setNamingStrategy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="timestamp">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Timestamp Suffix
                      </div>
                    </SelectItem>
                    <SelectItem value="incremental">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Incremental Numbers
                      </div>
                    </SelectItem>
                    <SelectItem value="date">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Date Suffix
                      </div>
                    </SelectItem>
                    <SelectItem value="user-prefix">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        User Prefix
                      </div>
                    </SelectItem>
                    <SelectItem value="custom">
                      <div className="flex items-center gap-2">
                        <Copy className="w-4 h-4" />
                        Custom Suffix
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom Suffix Input */}
            {namingStrategy === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="customSuffix">Custom Suffix</Label>
                <Input
                  id="customSuffix"
                  value={customSuffix}
                  onChange={(e) => setCustomSuffix(e.target.value)}
                  placeholder="Enter custom suffix..."
                  disabled={isCloning}
                />
              </div>
            )}

            {/* Strategy Description */}
            <Alert>
              <AlertDescription>
                {namingStrategy === 'timestamp' && 'Adds current timestamp to each cloned item name'}
                {namingStrategy === 'incremental' && 'Adds sequential numbers (01, 02, 03...) to each cloned item'}
                {namingStrategy === 'date' && 'Adds current date (YYYY-MM-DD) to each cloned item name'}
                {namingStrategy === 'user-prefix' && 'Adds your username as a prefix to each cloned item'}
                {namingStrategy === 'custom' && 'Adds your custom suffix to each cloned item name'}
              </AlertDescription>
            </Alert>
          </div>

          <Separator />

          {/* Progress Tracking */}
          {cloneProgress && (
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Cloning items...</span>
                  <span>{cloneProgress.current} of {cloneProgress.total}</span>
                </div>
                
                <Progress 
                  value={(cloneProgress.current / cloneProgress.total) * 100} 
                  className="h-2"
                />
                
                <p className="text-xs text-muted-foreground">
                  Currently cloning: {cloneProgress.currentItem}
                </p>
              </div>
            </div>
          )}

          {/* Naming Preview */}
          {!cloneProgress && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Preview ({previews[0]?.strategy})</h4>
              
              <div className="max-h-64 overflow-y-auto border rounded p-3 bg-muted/30">
                {previews.map((preview, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {renderTypeIcon(selectedNodes[index].type)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate text-muted-foreground">
                          {preview.originalName}
                        </div>
                        <div className="text-sm font-medium truncate">
                          {preview.newName}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs ml-2">
                      {selectedNodes[index].type}
                    </Badge>
                  </div>
                ))}
              </div>

              {previews.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  Showing all {previews.length} items to be cloned
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isCloning || cloneProgress !== null}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!isFormValid || isCloning || cloneProgress !== null}
          >
            {isCloning || cloneProgress ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Cloning...
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Clone {selectedNodes.length} Items
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default BulkCloneModal