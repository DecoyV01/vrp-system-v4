import { useState, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Plus,
  Trash2,
  Edit2,
  Upload,
  Download,
  X,
  Check,
  Play,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  useBulkSelection,
  TemplateDownload,
  CSVImportModal,
} from './bulk-operations'
import { CSVExportModal } from './bulk-operations/export/CSVExportModal'
import { BulkEditModal } from './bulk-operations/edit/BulkEditModal'
import type { Id } from '../../../../convex/_generated/dataModel'
import {
  useVehicles,
  useJobs,
  useLocations,
  useRoutes,
  useCreateVehicle,
  useCreateJob,
  useCreateLocation,
  useUpdateVehicle,
  useUpdateJob,
  useUpdateLocation,
  useUpdateRoute,
  useDeleteVehicle,
  useDeleteJob,
  useDeleteLocation,
  useOptimizationWorkflow,
} from '@/hooks/useVRPData'

interface TableEditorProps {
  datasetId: Id<'datasets'>
  tableType: 'vehicles' | 'jobs' | 'locations' | 'routes'
  projectId: Id<'projects'>
  scenarioId?: Id<'scenarios'>
}

const getTableSchema = (tableType: string) => {
  switch (tableType) {
    case 'vehicles':
      return {
        columns: [
          {
            key: 'description',
            label: 'Description',
            type: 'string',
            required: false,
          },
          { key: 'profile', label: 'Profile', type: 'string', required: false },
          {
            key: 'startLat',
            label: 'Start Latitude',
            type: 'number',
            required: false,
          },
          {
            key: 'startLon',
            label: 'Start Longitude',
            type: 'number',
            required: false,
          },
          {
            key: 'endLat',
            label: 'End Latitude',
            type: 'number',
            required: false,
          },
          {
            key: 'endLon',
            label: 'End Longitude',
            type: 'number',
            required: false,
          },
          {
            key: 'capacity',
            label: 'Capacity',
            type: 'array',
            required: false,
          },
          { key: 'skills', label: 'Skills', type: 'array', required: false },
          {
            key: 'twStart',
            label: 'Time Window Start',
            type: 'number',
            required: false,
          },
          {
            key: 'twEnd',
            label: 'Time Window End',
            type: 'number',
            required: false,
          },
          {
            key: 'speedFactor',
            label: 'Speed Factor',
            type: 'number',
            required: false,
          },
          {
            key: 'maxTasks',
            label: 'Max Tasks',
            type: 'number',
            required: false,
          },
          {
            key: 'costFixed',
            label: 'Fixed Cost',
            type: 'number',
            required: false,
          },
          {
            key: 'costPerHour',
            label: 'Cost per Hour',
            type: 'number',
            required: false,
          },
          {
            key: 'costPerKm',
            label: 'Cost per Km',
            type: 'number',
            required: false,
          },
        ],
      }
    case 'jobs':
      return {
        columns: [
          {
            key: 'description',
            label: 'Description',
            type: 'string',
            required: false,
          },
          {
            key: 'locationLat',
            label: 'Latitude',
            type: 'number',
            required: false,
          },
          {
            key: 'locationLon',
            label: 'Longitude',
            type: 'number',
            required: false,
          },
          {
            key: 'setup',
            label: 'Setup Time',
            type: 'number',
            required: false,
          },
          {
            key: 'service',
            label: 'Service Time',
            type: 'number',
            required: false,
          },
          {
            key: 'delivery',
            label: 'Delivery',
            type: 'array',
            required: false,
          },
          { key: 'pickup', label: 'Pickup', type: 'array', required: false },
          {
            key: 'priority',
            label: 'Priority',
            type: 'number',
            required: false,
          },
        ],
      }
    case 'locations':
      return {
        columns: [
          { key: 'name', label: 'Name', type: 'string', required: true },
          {
            key: 'locationLat',
            label: 'Latitude',
            type: 'number',
            required: false,
          },
          {
            key: 'locationLon',
            label: 'Longitude',
            type: 'number',
            required: false,
          },
          { key: 'address', label: 'Address', type: 'string', required: false },
          {
            key: 'description',
            label: 'Description',
            type: 'string',
            required: false,
          },
          {
            key: 'locationType',
            label: 'Type',
            type: 'string',
            required: false,
          },
          {
            key: 'operatingHours',
            label: 'Operating Hours',
            type: 'string',
            required: false,
          },
          {
            key: 'contactInfo',
            label: 'Contact Info',
            type: 'string',
            required: false,
          },
        ],
      }
    case 'routes':
      return {
        columns: [
          {
            key: 'vehicleId',
            label: 'Vehicle ID',
            type: 'string',
            required: true,
          },
          { key: 'type', label: 'Type', type: 'string', required: false },
          {
            key: 'locationId',
            label: 'Location ID',
            type: 'string',
            required: false,
          },
          { key: 'jobId', label: 'Job ID', type: 'string', required: false },
          {
            key: 'service',
            label: 'Service Time',
            type: 'number',
            required: false,
          },
          {
            key: 'waiting',
            label: 'Waiting Time',
            type: 'number',
            required: false,
          },
          {
            key: 'arrivalTime',
            label: 'Arrival Time',
            type: 'number',
            required: false,
          },
          {
            key: 'departureTime',
            label: 'Departure Time',
            type: 'number',
            required: false,
          },
        ],
      }
    default:
      return { columns: [] }
  }
}

const TableEditor = ({
  datasetId,
  tableType,
  projectId,
  scenarioId,
}: TableEditorProps) => {
  // Data fetching hooks
  const vehicles = useVehicles(datasetId)
  const jobs = useJobs(datasetId)
  const locations = useLocations(datasetId)
  const routes = useRoutes(datasetId)

  // Mutation hooks
  const createVehicle = useCreateVehicle()
  const createJob = useCreateJob()
  const createLocation = useCreateLocation()
  // const createRoute = useCreateRoute() // Not implemented yet

  const updateVehicle = useUpdateVehicle()
  const updateJob = useUpdateJob()
  const updateLocation = useUpdateLocation()
  const updateRoute = useUpdateRoute()

  const deleteVehicle = useDeleteVehicle()
  const deleteJob = useDeleteJob()
  const deleteLocation = useDeleteLocation()
  // const deleteRoute = useDeleteRoute() // Not implemented yet

  // Optimization workflow hook
  const optimizationWorkflow = useOptimizationWorkflow(scenarioId)

  // Local state
  const [editingCell, setEditingCell] = useState<{
    row: number
    col: string
  } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Bulk operations modal state
  const [showImportModal, setShowImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)

  // Bulk update state
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)
  const [bulkUpdateProgress, setBulkUpdateProgress] = useState({
    current: 0,
    total: 0,
  })

  // Get current data based on table type
  const currentData = useMemo(() => {
    switch (tableType) {
      case 'vehicles':
        return vehicles || []
      case 'jobs':
        return jobs || []
      case 'locations':
        return locations || []
      case 'routes':
        return routes || []
      default:
        return []
    }
  }, [tableType, vehicles, jobs, locations, routes])

  const schema = getTableSchema(tableType)
  const isLoading = currentData === undefined

  // Bulk selection functionality
  const {
    selectionState,
    selectionStatus,
    toggleRowSelection,
    selectAll,
    clearSelection,
    isRowSelected,
    getSelectedIds,
  } = useBulkSelection({
    data: currentData,
    maxSelection: 1000,
    onSelectionChange: selectedIds => {
      // Selection state managed by the hook
    },
  })

  // Helper function to get selected rows data
  const getSelectedRows = () => {
    const selectedIds = getSelectedIds()
    return currentData.filter(row => selectedIds.includes(row._id))
  }

  // Checkbox ref for indeterminate state
  const selectAllCheckboxRef = useRef<HTMLButtonElement>(null)

  const handleCellClick = (
    rowIndex: number,
    colKey: string,
    currentValue: any
  ) => {
    setEditingCell({ row: rowIndex, col: colKey })
    setEditValue(formatValueForEdit(currentValue))
  }

  const formatValueForEdit = (value: any): string => {
    if (value === undefined || value === null) return ''
    if (Array.isArray(value)) return JSON.stringify(value)
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  const parseEditValue = (value: string, type: string): any => {
    if (value === '') return undefined

    switch (type) {
      case 'number': {
        const num = parseFloat(value)
        return isNaN(num) ? undefined : num
      }
      case 'array':
        try {
          const parsed = JSON.parse(value)
          return Array.isArray(parsed) ? parsed : [value]
        } catch {
          return [value]
        }
      case 'object':
        try {
          return JSON.parse(value)
        } catch {
          return value
        }
      default:
        return value
    }
  }

  const handleCellSave = async () => {
    if (!editingCell) return

    const item = currentData[editingCell.row]
    const column = schema.columns.find(col => col.key === editingCell.col)

    if (!item || !column) return

    const newValue = parseEditValue(editValue, column.type)

    try {
      const updateData: any = {
        id: item._id,
        [editingCell.col]: newValue,
      }

      switch (tableType) {
        case 'vehicles':
          await updateVehicle(updateData)
          break
        case 'jobs':
          await updateJob(updateData)
          break
        case 'locations':
          await updateLocation(updateData)
          break
        case 'routes':
          await updateRoute()
          break
      }

      toast.success('Cell updated successfully')
    } catch (error) {
      console.error('Failed to update cell:', error)
      toast.error('Failed to update cell')
    }

    setEditingCell(null)
    setEditValue('')
  }

  const handleCellCancel = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const addRow = async () => {
    try {
      setIsCreating(true)

      const baseData = {
        projectId,
        scenarioId,
        datasetId,
      }

      switch (tableType) {
        case 'vehicles':
          await createVehicle({
            ...baseData,
            description: `Vehicle ${Date.now()}`,
          })
          break
        case 'jobs':
          await createJob({
            ...baseData,
            description: `Job ${Date.now()}`,
          })
          break
        case 'locations':
          await createLocation({
            ...baseData,
            name: `Location ${Date.now()}`,
            locationLat: 0,
            locationLon: 0,
          })
          break
        case 'routes':
          // Routes creation not implemented yet
          toast.error('Route creation not implemented yet')
          return
      }

      toast.success(`${tableType.slice(0, -1)} created successfully`)
    } catch (error) {
      console.error('Failed to create row:', error)
      toast.error(`Failed to create ${tableType.slice(0, -1)}`)
    } finally {
      setIsCreating(false)
    }
  }

  const handleImport = async (data: any[], mappings: any[]) => {
    try {
      let successCount = 0
      let errorCount = 0

      for (const row of data) {
        try {
          const baseData = {
            projectId,
            scenarioId,
            datasetId,
            optimizerId: Math.floor(Math.random() * 1000000), // Generate unique optimizer ID
          }

          switch (tableType) {
            case 'vehicles':
              await createVehicle({ ...baseData, ...row })
              break
            case 'jobs':
              await createJob({ ...baseData, ...row })
              break
            case 'locations':
              await createLocation({ ...baseData, ...row })
              break
            default:
              throw new Error(`Import not supported for ${tableType}`)
          }
          successCount++
        } catch (error) {
          console.error('Failed to import row:', error)
          errorCount++
        }
      }

      if (successCount > 0) {
        toast.success(
          `Successfully imported ${successCount} row${successCount !== 1 ? 's' : ''}`
        )
      }

      if (errorCount > 0) {
        toast.error(
          `Failed to import ${errorCount} row${errorCount !== 1 ? 's' : ''}`
        )
      }

      setShowImportModal(false)
    } catch (error) {
      console.error('Import failed:', error)
      toast.error('Import failed')
    }
  }

  const deleteRow = async (index: number) => {
    const item = currentData[index]
    if (!item?._id) return

    if (
      !confirm(
        `Are you sure you want to delete this ${tableType.slice(0, -1)}?`
      )
    ) {
      return
    }

    try {
      switch (tableType) {
        case 'vehicles':
          await deleteVehicle({ id: item._id as any })
          break
        case 'jobs':
          await deleteJob({ id: item._id as any })
          break
        case 'locations':
          await deleteLocation({ id: item._id as any })
          break
        case 'routes':
          // Routes deletion not implemented yet
          toast.error('Route deletion not implemented yet')
          return
      }

      toast.success(`${tableType.slice(0, -1)} deleted successfully`)
    } catch (error) {
      console.error('Failed to delete row:', error)
      toast.error(`Failed to delete ${tableType.slice(0, -1)}`)
    }
  }

  // Bulk delete handler
  const handleBulkDelete = async () => {
    const selectedIds = getSelectedIds()

    if (selectedIds.length === 0) return

    const confirmMessage = `Are you sure you want to delete ${selectedIds.length} ${tableType}? This action cannot be undone.`

    if (!confirm(confirmMessage)) return

    try {
      // Delete each selected item
      for (const id of selectedIds) {
        switch (tableType) {
          case 'vehicles':
            await deleteVehicle({ id: id as any })
            break
          case 'jobs':
            await deleteJob({ id: id as any })
            break
          case 'locations':
            await deleteLocation({ id: id as any })
            break
          case 'routes':
            toast.error('Route deletion not implemented yet')
            return
        }
      }

      clearSelection()
      toast.success(`Deleted ${selectedIds.length} ${tableType} successfully`)
    } catch (error) {
      console.error('Bulk delete failed:', error)
      toast.error('Failed to delete selected records')
    }
  }

  // Bulk update handler - saves changes to database
  const handleBulkEditComplete = async (updatedRows: any[]) => {
    if (updatedRows.length === 0) {
      toast.info('No changes to save')
      setShowBulkEditModal(false)
      return
    }

    setIsBulkUpdating(true)
    setBulkUpdateProgress({ current: 0, total: updatedRows.length })

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    try {
      // Process each updated row
      for (let i = 0; i < updatedRows.length; i++) {
        const row = updatedRows[i]

        try {
          // Prepare update data (exclude system fields)
          const { _id, _creationTime, ...updateData } = row

          // Call appropriate mutation based on table type
          switch (tableType) {
            case 'vehicles':
              await updateVehicle({ id: _id, ...updateData })
              break
            case 'jobs':
              await updateJob({ id: _id, ...updateData })
              break
            case 'locations':
              await updateLocation({ id: _id, ...updateData })
              break
            case 'routes':
              toast.error('Route updates not implemented yet')
              return
          }

          successCount++
        } catch (error) {
          errorCount++
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error'
          errors.push(`Row ${i + 1}: ${errorMessage}`)
          console.error(`Failed to update row ${i + 1}:`, error)
        }

        // Update progress
        setBulkUpdateProgress({ current: i + 1, total: updatedRows.length })

        // Small delay to prevent overwhelming the server
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      // Show results
      if (successCount > 0) {
        toast.success(
          `Successfully updated ${successCount} record${successCount !== 1 ? 's' : ''}`
        )
      }

      if (errorCount > 0) {
        toast.error(
          `Failed to update ${errorCount} record${errorCount !== 1 ? 's' : ''}. Check console for details.`
        )
        console.error('Bulk update errors:', errors)
      }

      // Clear selection after successful updates
      if (successCount > 0) {
        clearSelection()
      }
    } catch (error) {
      console.error('Bulk update failed:', error)
      toast.error('Bulk update failed')
    } finally {
      setIsBulkUpdating(false)
      setBulkUpdateProgress({ current: 0, total: 0 })
      setShowBulkEditModal(false)
    }
  }

  // Optimization handler
  const handleOptimization = async () => {
    if (!scenarioId) {
      toast.error('No scenario selected for optimization')
      return
    }

    if (optimizationWorkflow.isOptimizing) {
      toast.info('Optimization is already running')
      return
    }

    try {
      toast.info('Starting VROOM optimization...')

      const result = await optimizationWorkflow.runOptimization({
        scenarioId,
        datasetId,
        optimizationSettings: {
          algorithm: 'vroom',
          threads: 4,
          timeLimit: 300, // 5 minutes
        },
      })

      if (result.success) {
        toast.success(
          `Optimization completed! Generated ${result.routes} routes with ${result.unassigned} unassigned jobs.`
        )
      } else {
        toast.error('Optimization failed to complete')
      }
    } catch (error) {
      console.error('Optimization failed:', error)
      toast.error(
        `Optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  const renderCellValue = (value: any, column: any) => {
    if (value === undefined || value === null) {
      return <span className="text-muted-foreground italic">Empty</span>
    }

    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {String(item)}
            </Badge>
          ))}
        </div>
      )
    }

    if (typeof value === 'object') {
      return (
        <Badge variant="secondary" className="text-xs">
          Object
        </Badge>
      )
    }

    if (column.type === 'number' && typeof value === 'number') {
      return value.toLocaleString()
    }

    return String(value)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold capitalize">{tableType} Data</h3>
          <p className="text-sm text-gray-600">
            {currentData.length} {tableType} in this dataset
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Import/Export Section */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportModal(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportModal(true)}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <TemplateDownload tableType={tableType} />
          </div>

          {/* Separator */}
          <Separator orientation="vertical" className="h-6" />

          {/* Add Row */}
          <Button onClick={addRow} size="sm" disabled={isCreating}>
            {isCreating ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Row
              </>
            )}
          </Button>

          {/* Optimization Button - Only show if we have data and scenario */}
          {scenarioId && currentData.length > 0 && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <Button
                onClick={handleOptimization}
                size="sm"
                disabled={
                  optimizationWorkflow.isOptimizing ||
                  !optimizationWorkflow.canOptimize
                }
                variant={
                  optimizationWorkflow.hasCompleted ? 'default' : 'secondary'
                }
              >
                {optimizationWorkflow.isOptimizing ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Run Optimization
                  </>
                )}
              </Button>

              {/* Optimization Status */}
              {optimizationWorkflow.latestRun && (
                <div className="text-xs text-muted-foreground">
                  {optimizationWorkflow.hasCompleted && (
                    <span className="text-green-600">
                      ✓ Last run:{' '}
                      {optimizationWorkflow.latestRun.totalRoutes || 0} routes
                    </span>
                  )}
                  {optimizationWorkflow.hasFailed && (
                    <span className="text-red-600">
                      ✗ Failed:{' '}
                      {optimizationWorkflow.latestRun.errorMessage ||
                        'Unknown error'}
                    </span>
                  )}
                </div>
              )}
            </>
          )}

          {/* Bulk Operations Section - Only show when rows are selected */}
          {selectionStatus.hasSelection && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {selectionStatus.selectedCount} of{' '}
                  {selectionStatus.totalCount} selected
                  {selectionStatus.isMaxSelection && (
                    <span className="text-orange-600 ml-1">(max reached)</span>
                  )}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkEditModal(true)}
                    disabled={isBulkUpdating}
                  >
                    {isBulkUpdating ? (
                      <>
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                        Updating ({bulkUpdateProgress.current}/
                        {bulkUpdateProgress.total})
                      </>
                    ) : (
                      <>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Bulk Edit
                      </>
                    )}
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>

                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    <X className="w-4 h-4 mr-2" />
                    Clear Selection
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  ref={checkboxRef => {
                    if (checkboxRef && selectionStatus.isIndeterminate) {
                      checkboxRef.indeterminate = true
                    }
                  }}
                  checked={selectionStatus.isAllSelected}
                  onCheckedChange={checked => {
                    if (checked) {
                      selectAll()
                    } else {
                      clearSelection()
                    }
                  }}
                  aria-label="Select all rows"
                />
              </TableHead>
              {schema.columns.map(column => (
                <TableHead key={column.key} className="font-semibold">
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.required && (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {column.type}
                    </Badge>
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={schema.columns.length + 2}
                  className="text-center py-8 text-muted-foreground"
                >
                  No {tableType} yet. Click "Add Row" to get started.
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((item: any, rowIndex: number) => (
                <TableRow
                  key={item._id || rowIndex}
                  className={isRowSelected(item._id) ? 'bg-muted/50' : ''}
                >
                  <TableCell>
                    <Checkbox
                      checked={isRowSelected(item._id)}
                      onCheckedChange={checked =>
                        toggleRowSelection(item._id, checked as boolean)
                      }
                      aria-label={`Select row ${rowIndex + 1}`}
                    />
                  </TableCell>
                  {schema.columns.map(column => (
                    <TableCell
                      key={column.key}
                      className="relative min-w-[120px]"
                    >
                      {editingCell?.row === rowIndex &&
                      editingCell?.col === column.key ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleCellSave()
                              if (e.key === 'Escape') handleCellCancel()
                            }}
                            autoFocus
                            className="h-8"
                            placeholder={`Enter ${column.label.toLowerCase()}`}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCellSave}
                            className="h-8 w-8 p-0"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCellCancel}
                            className="h-8 w-8 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          onClick={() =>
                            handleCellClick(
                              rowIndex,
                              column.key,
                              item[column.key]
                            )
                          }
                          className="min-h-[32px] flex items-center cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2"
                        >
                          {renderCellValue(item[column.key], column)}
                        </div>
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRow(rowIndex)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {currentData.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Edit2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Start Building Your {tableType} Data
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Add rows and click on cells to edit them. Changes are automatically
            saved to your dataset.
          </p>
          <Button onClick={addRow} disabled={isCreating}>
            {isCreating ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add First Row
              </>
            )}
          </Button>
        </div>
      )}

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        tableType={tableType}
        existingData={currentData}
        onImport={handleImport}
      />

      {/* CSV Export Modal */}
      <CSVExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        tableType={tableType}
        data={currentData}
        selectedRows={getSelectedRows()}
        filteredData={currentData}
      />

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={showBulkEditModal}
        onClose={() => setShowBulkEditModal(false)}
        tableType={tableType}
        selectedRows={getSelectedRows()}
        onEditComplete={handleBulkEditComplete}
        availableFields={schema.columns.map(col => col.key)}
      />
    </div>
  )
}

export default TableEditor
