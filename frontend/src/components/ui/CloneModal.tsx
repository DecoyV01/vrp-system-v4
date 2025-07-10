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
import { Checkbox } from '@/components/ui/checkbox'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Copy, AlertCircle, Database, Table } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import type { Id } from '../../../../convex/_generated/dataModel'

export interface CloneableDataset {
  id: Id<'datasets'>
  name: string
  version: number
  tableCount: {
    vehicles: number
    jobs: number
    locations: number
    routes: number
  }
}

export interface CloneModalData {
  id: Id<'scenarios'> | Id<'datasets'>
  name: string
  type: 'scenario' | 'dataset'
  parentId?: Id<'projects'> | Id<'scenarios'>
  // Enhanced data for selective cloning
  availableDatasets?: CloneableDataset[]
  availableTables?: {
    type: 'vehicles' | 'jobs' | 'locations' | 'routes'
    name: string
    count: number
  }[]
}

export interface CloneSelections {
  selectedDatasets?: Id<'datasets'>[]
  selectedTables?: ('vehicles' | 'jobs' | 'locations' | 'routes')[]
  includeData?: boolean
}

export interface CloneModalProps {
  isOpen: boolean
  onClose: () => void
  data: CloneModalData | null
  onClone: (newName: string, selections?: CloneSelections) => Promise<void>
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
  error = null,
}: CloneModalProps) => {
  const [newName, setNewName] = useState('')
  const [selectedDatasets, setSelectedDatasets] = useState<Id<'datasets'>[]>([])
  const [selectedTables, setSelectedTables] = useState<
    ('vehicles' | 'jobs' | 'locations' | 'routes')[]
  >([])
  const [includeData, setIncludeData] = useState(true)
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({})

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
          hour12: true,
        })

        return `${baseName} (copy ${timestamp})`
      }

      setNewName(generateDefaultName(data.name))

      // Initialize selections with all available items
      if (data.availableDatasets) {
        setSelectedDatasets(data.availableDatasets.map(d => d.id))
      }
      if (data.availableTables) {
        setSelectedTables(data.availableTables.map(t => t.type))
      }

      setIncludeData(true)
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
    } else if (
      data &&
      newName.trim().toLowerCase() === data.name.toLowerCase()
    ) {
      errors.name = 'New name must be different from the original'
    }

    // Validate selections when available
    if (
      data?.type === 'scenario' &&
      data.availableDatasets &&
      selectedDatasets.length === 0
    ) {
      errors.selection = 'Please select at least one dataset to clone'
    }

    if (
      data?.type === 'dataset' &&
      data.availableTables &&
      selectedTables.length === 0
    ) {
      errors.selection = 'Please select at least one table to clone'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleClone = async () => {
    if (!data || !validateForm()) return

    const selections: CloneSelections = {
      selectedDatasets: data.type === 'scenario' ? selectedDatasets : undefined,
      selectedTables: data.type === 'dataset' ? selectedTables : undefined,
      includeData,
    }

    try {
      await onClone(newName.trim(), selections)
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

  // Selection handlers
  const toggleDataset = (datasetId: Id<'datasets'>) => {
    setSelectedDatasets(prev =>
      prev.includes(datasetId)
        ? prev.filter(id => id !== datasetId)
        : [...prev, datasetId]
    )
    // Clear selection validation errors
    if (validationErrors.selection) {
      setValidationErrors(prev => {
        const { selection, ...rest } = prev
        return rest
      })
    }
  }

  const toggleTable = (
    tableType: 'vehicles' | 'jobs' | 'locations' | 'routes'
  ) => {
    setSelectedTables(prev =>
      prev.includes(tableType)
        ? prev.filter(type => type !== tableType)
        : [...prev, tableType]
    )
    // Clear selection validation errors
    if (validationErrors.selection) {
      setValidationErrors(prev => {
        const { selection, ...rest } = prev
        return rest
      })
    }
  }

  if (!data) return null

  const entityTypeDisplayName =
    data.type.charAt(0).toUpperCase() + data.type.slice(1)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Copy className="w-5 h-5" />
            Clone {entityTypeDisplayName}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Create a copy of "{data.name}" with a new name. All associated data
            will be duplicated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="selection">
                {data.type === 'scenario'
                  ? 'Dataset Selection'
                  : 'Table Selection'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clone-name" className="text-sm font-normal">
                  New {data.type} name *
                </Label>
                <Input
                  id="clone-name"
                  value={newName}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder={`Enter new ${data.type} name`}
                  disabled={isLoading}
                  className={validationErrors.name ? 'border-destructive' : ''}
                  autoFocus
                />
                {validationErrors.name && (
                  <p className="text-sm text-destructive">
                    {validationErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-data"
                    checked={includeData}
                    onCheckedChange={checked =>
                      setIncludeData(checked as boolean)
                    }
                  />
                  <Label htmlFor="include-data" className="text-sm">
                    Include all data and content
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  When enabled, all data will be copied. When disabled, only
                  structure will be cloned.
                </p>
              </div>

              {/* Clone operation summary */}
              <div className="rounded-lg bg-muted p-3 space-y-2">
                <h4 className="text-sm font-medium">Clone Summary:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• {entityTypeDisplayName} configuration and metadata</li>
                  {data.type === 'scenario' && (
                    <>
                      <li>• {selectedDatasets.length} dataset(s) selected</li>
                      <li>• Associated vehicles, jobs, and locations</li>
                    </>
                  )}
                  {data.type === 'dataset' && (
                    <>
                      <li>• {selectedTables.length} table(s) selected</li>
                      <li>• Table configurations and relationships</li>
                    </>
                  )}
                  <li>
                    • Data inclusion: {includeData ? 'Yes' : 'Structure only'}
                  </li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="selection" className="space-y-4">
              {data.type === 'scenario' && data.availableDatasets && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Select Datasets to Clone
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setSelectedDatasets(
                            data.availableDatasets?.map(d => d.id) || []
                          )
                        }
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDatasets([])}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2 max-h-48 overflow-y-auto">
                    {data.availableDatasets.map(dataset => (
                      <Card
                        key={dataset.id}
                        className={`cursor-pointer transition-colors ${
                          selectedDatasets.includes(dataset.id)
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleDataset(dataset.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={selectedDatasets.includes(dataset.id)}
                              onChange={() => {}} // Handled by card click
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Database className="w-4 h-4 text-muted-foreground" />
                                <p className="text-sm font-medium truncate">
                                  {dataset.name} v{dataset.version}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {dataset.tableCount.vehicles}V •{' '}
                                {dataset.tableCount.jobs}J •
                                {dataset.tableCount.locations}L •{' '}
                                {dataset.tableCount.routes}R
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {selectedDatasets.length === 0 && (
                    <Alert>
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        Please select at least one dataset to clone.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {data.type === 'dataset' && data.availableTables && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Select Tables to Clone
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setSelectedTables(
                            data.availableTables?.map(t => t.type) || []
                          )
                        }
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTables([])}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {data.availableTables.map(table => (
                      <Card
                        key={table.type}
                        className={`cursor-pointer transition-colors ${
                          selectedTables.includes(table.type)
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleTable(table.type)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={selectedTables.includes(table.type)}
                              onChange={() => {}} // Handled by card click
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Table className="w-4 h-4 text-muted-foreground" />
                                <p className="text-sm font-medium">
                                  {table.name}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {table.count} records
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {selectedTables.length === 0 && (
                    <Alert>
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        Please select at least one table to clone.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
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
            disabled={
              isLoading ||
              !newName.trim() ||
              Object.keys(validationErrors).length > 0
            }
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
