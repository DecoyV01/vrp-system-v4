import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Edit2, Upload, Download, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { Id } from '../../../convex/_generated/dataModel'
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
  useDeleteLocation
} from '@/hooks/useVRPData'

interface TableEditorProps {
  datasetId: Id<"datasets">
  tableType: 'vehicles' | 'jobs' | 'locations' | 'routes'
  projectId: Id<"projects">
  scenarioId?: Id<"scenarios">
}


const getTableSchema = (tableType: string) => {
  switch (tableType) {
    case 'vehicles':
      return {
        columns: [
          { key: 'description', label: 'Description', type: 'string', required: false },
          { key: 'profile', label: 'Profile', type: 'string', required: false },
          { key: 'startLat', label: 'Start Latitude', type: 'number', required: false },
          { key: 'startLon', label: 'Start Longitude', type: 'number', required: false },
          { key: 'endLat', label: 'End Latitude', type: 'number', required: false },
          { key: 'endLon', label: 'End Longitude', type: 'number', required: false },
          { key: 'capacity', label: 'Capacity', type: 'array', required: false },
          { key: 'skills', label: 'Skills', type: 'array', required: false },
          { key: 'twStart', label: 'Time Window Start', type: 'number', required: false },
          { key: 'twEnd', label: 'Time Window End', type: 'number', required: false },
          { key: 'speedFactor', label: 'Speed Factor', type: 'number', required: false },
          { key: 'maxTasks', label: 'Max Tasks', type: 'number', required: false },
          { key: 'costFixed', label: 'Fixed Cost', type: 'number', required: false },
          { key: 'costPerHour', label: 'Cost per Hour', type: 'number', required: false },
          { key: 'costPerKm', label: 'Cost per Km', type: 'number', required: false }
        ]
      }
    case 'jobs':
      return {
        columns: [
          { key: 'description', label: 'Description', type: 'string', required: false },
          { key: 'pickup', label: 'Pickup', type: 'object', required: false },
          { key: 'delivery', label: 'Delivery', type: 'object', required: false },
          { key: 'service', label: 'Service Time', type: 'number', required: false },
          { key: 'amount', label: 'Amount', type: 'array', required: false },
          { key: 'skills', label: 'Skills', type: 'array', required: false },
          { key: 'priority', label: 'Priority', type: 'number', required: false },
          { key: 'timeWindows', label: 'Time Windows', type: 'array', required: false }
        ]
      }
    case 'locations':
      return {
        columns: [
          { key: 'id', label: 'Location ID', type: 'string', required: true },
          { key: 'latitude', label: 'Latitude', type: 'number', required: true },
          { key: 'longitude', label: 'Longitude', type: 'number', required: true },
          { key: 'address', label: 'Address', type: 'string', required: false },
          { key: 'city', label: 'City', type: 'string', required: false },
          { key: 'state', label: 'State', type: 'string', required: false },
          { key: 'postalCode', label: 'Postal Code', type: 'string', required: false },
          { key: 'country', label: 'Country', type: 'string', required: false }
        ]
      }
    case 'routes':
      return {
        columns: [
          { key: 'vehicleId', label: 'Vehicle ID', type: 'string', required: true },
          { key: 'type', label: 'Type', type: 'string', required: false },
          { key: 'locationId', label: 'Location ID', type: 'string', required: false },
          { key: 'jobId', label: 'Job ID', type: 'string', required: false },
          { key: 'service', label: 'Service Time', type: 'number', required: false },
          { key: 'waiting', label: 'Waiting Time', type: 'number', required: false },
          { key: 'arrivalTime', label: 'Arrival Time', type: 'number', required: false },
          { key: 'departureTime', label: 'Departure Time', type: 'number', required: false }
        ]
      }
    default:
      return { columns: [] }
  }
}

const TableEditor = ({ datasetId, tableType, projectId, scenarioId }: TableEditorProps) => {
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


  // Local state
  const [editingCell, setEditingCell] = useState<{row: number, col: string} | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Get current data based on table type
  const currentData = useMemo(() => {
    switch (tableType) {
      case 'vehicles': return vehicles || []
      case 'jobs': return jobs || []
      case 'locations': return locations || []
      case 'routes': return routes || []
      default: return []
    }
  }, [tableType, vehicles, jobs, locations, routes])

  const schema = getTableSchema(tableType)
  const isLoading = currentData === undefined

  const handleCellClick = (rowIndex: number, colKey: string, currentValue: any) => {
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
        [editingCell.col]: newValue 
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
        datasetId
      }

      switch (tableType) {
        case 'vehicles':
          await createVehicle({
            ...baseData,
            description: `Vehicle ${Date.now()}`
          })
          break
        case 'jobs':
          await createJob({
            ...baseData,
            description: `Job ${Date.now()}`
          })
          break
        case 'locations':
          await createLocation({
            ...baseData,
            name: `Location ${Date.now()}`,
            locationLat: 0,
            locationLon: 0
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

  const deleteRow = async (index: number) => {
    const item = currentData[index]
    if (!item?._id) return

    if (!confirm(`Are you sure you want to delete this ${tableType.slice(0, -1)}?`)) {
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
      return <Badge variant="secondary" className="text-xs">Object</Badge>
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            onClick={addRow} 
            size="sm"
            disabled={isCreating}
          >
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
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {schema.columns.map((column) => (
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
                <TableCell colSpan={schema.columns.length + 1} className="text-center py-8 text-muted-foreground">
                  No {tableType} yet. Click "Add Row" to get started.
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((item: any, rowIndex: number) => (
                <TableRow key={item._id || rowIndex}>
                  {schema.columns.map((column) => (
                    <TableCell key={column.key} className="relative min-w-[120px]">
                      {editingCell?.row === rowIndex && editingCell?.col === column.key ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
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
                          onClick={() => handleCellClick(rowIndex, column.key, item[column.key])}
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
            Add rows and click on cells to edit them. Changes are automatically saved to your dataset.
          </p>
          <Button 
            onClick={addRow}
            disabled={isCreating}
          >
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
    </div>
  )
}

export default TableEditor