import { useState, useMemo, useRef, useEffect } from 'react'
import type * as mapboxgl from 'mapbox-gl'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
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
  Map,
  MapPin,
  ChevronsUpDown,
  AlertTriangle,
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
import { LocationForm } from '@/components/locations/LocationForm'
import { cn } from '@/lib/utils'
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
import { logError, VRPErrorHandling } from '@/utils/errorHandling'

// Constants for SelectItem values
const NO_LOCATION_VALUE = '__no_location__'

// Helper functions for map functionality with location master support
const getCoordinates = (
  item: any,
  tableType: string,
  locations?: any[]
): [number, number] | null => {
  if (tableType === 'locations') {
    return item.locationLat &&
      item.locationLon &&
      typeof item.locationLat === 'number' &&
      typeof item.locationLon === 'number'
      ? [item.locationLon, item.locationLat]
      : null
  } else if (tableType === 'jobs') {
    // Try location reference first
    if (item.locationId && locations) {
      const location = locations.find(loc => loc._id === item.locationId)
      if (location?.locationLat && location?.locationLon) {
        return [location.locationLon, location.locationLat]
      }
    }
    // Fall back to legacy coordinates
    return item.locationLat &&
      item.locationLon &&
      typeof item.locationLat === 'number' &&
      typeof item.locationLon === 'number'
      ? [item.locationLon, item.locationLat]
      : null
  } else if (tableType === 'vehicles') {
    // Try start location reference first
    if (item.startLocationId && locations) {
      const location = locations.find(loc => loc._id === item.startLocationId)
      if (location?.locationLat && location?.locationLon) {
        return [location.locationLon, location.locationLat]
      }
    }
    // Fall back to legacy coordinates
    return item.startLat &&
      item.startLon &&
      typeof item.startLat === 'number' &&
      typeof item.startLon === 'number'
      ? [item.startLon, item.startLat]
      : null
  }
  return null
}

const calculateMapCenter = (
  data: any[],
  tableType: string,
  locations?: any[]
): [number, number] | null => {
  const validItems = data.filter(item =>
    getCoordinates(item, tableType, locations)
  )

  if (validItems.length === 0) {
    // No fallback coordinates - return null to indicate no valid center
    return null
  }

  // Calculate centroid of all valid coordinates
  let totalLat = 0
  let totalLon = 0

  validItems.forEach(item => {
    const coords = getCoordinates(item, tableType, locations)
    if (coords) {
      totalLon += coords[0]
      totalLat += coords[1]
    }
  })

  return [totalLon / validItems.length, totalLat / validItems.length]
}

// Simple map component for inline display
const SimpleMapView = ({
  data,
  tableType,
  locations,
}: {
  data: any[]
  tableType: string
  locations?: any[]
}) => {
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const initMap = async () => {
      try {
        const apiKey = import.meta.env.VITE_MAPBOX_TOKEN
        if (!apiKey) {
          setMapError('Mapbox API key not configured')
          return
        }

        // Dynamic import with proper typing
        const mapboxgl = await import('mapbox-gl')
        await import('mapbox-gl/dist/mapbox-gl.css')

        mapboxgl.default.accessToken = apiKey

        // Calculate initial center from data if available
        const center = calculateMapCenter(data, tableType, locations)

        mapRef.current = new mapboxgl.default.Map({
          container: mapContainerRef.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: center || [0, 0], // Use [0,0] as neutral fallback if no data
          zoom: center ? 10 : 2, // Lower zoom if no specific location
        })

        setIsMapLoaded(true)
        setMapError(null)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown map error'
        setMapError(`Failed to load map: ${errorMessage}`)
      }
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return

    const updateMarkers = async () => {
      try {
        // Clear existing markers
        const markers = (mapRef.current as any)._markers || []
        markers.forEach((marker: any) => marker.remove())
        ;(mapRef.current as any)._markers = []

        const validItems = data.filter(item =>
          getCoordinates(item, tableType, locations)
        )
        if (validItems.length === 0) return

        // Import mapbox-gl for marker creation
        const mapboxgl = await import('mapbox-gl')

        // Add markers
        const newMarkers: any[] = []
        validItems.forEach(item => {
          const coords = getCoordinates(item, tableType, locations)
          if (!coords) return

          const el = document.createElement('div')
          el.className =
            'w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-md cursor-pointer'

          const marker = new mapboxgl.default.Marker(el)
            .setLngLat(coords)
            .setPopup(
              new mapboxgl.default.Popup({ offset: 15 }).setHTML(`
                <div class="p-2 text-sm">
                  <strong>${item.name || item.description || 'Location'}</strong>
                  ${item.locationType ? `<br><span class="text-muted-foreground">${item.locationType}</span>` : ''}
                </div>
              `)
            )
            .addTo(mapRef.current!)

          newMarkers.push(marker)
        })
        ;(mapRef.current as any)._markers = newMarkers

        // Fit map bounds
        if (validItems.length > 0) {
          const bounds = new mapboxgl.default.LngLatBounds()
          validItems.forEach(item => {
            const coords = getCoordinates(item, tableType, locations)
            if (coords) bounds.extend(coords)
          })
          mapRef.current!.fitBounds(bounds, { padding: 50, maxZoom: 15 })
        }
      } catch (error) {
        logError(error, 'Map markers update')
        setMapError('Failed to update map markers')
      }
    }

    updateMarkers()
  }, [data, tableType, isMapLoaded])

  if (mapError) {
    return (
      <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">{mapError}</p>
      </div>
    )
  }

  return (
    <div className="h-64 rounded-lg overflow-hidden border">
      <div ref={mapContainerRef} className="w-full h-full" />
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      )}
    </div>
  )
}

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
            key: 'startLocationId',
            label: 'Start Location',
            type: 'location',
            required: false,
            legacy: ['startLat', 'startLon'],
          },
          {
            key: 'endLocationId',
            label: 'End Location',
            type: 'location',
            required: false,
            legacy: ['endLat', 'endLon'],
          },
          {
            key: 'capacity',
            label: 'Capacity',
            type: 'array',
            required: false,
          },
          { key: 'skills', label: 'Skills', type: 'array', required: false },
          {
            key: 'timeWindow',
            label: 'Time Window',
            type: 'array',
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
            key: 'locationId',
            label: 'Location',
            type: 'location',
            required: false,
            legacy: ['locationLat', 'locationLon'],
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

  // Map view state
  const [showMapView, setShowMapView] = useState(false)

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

  // Location update helper
  const handleLocationUpdate = async (updateData: any, tableType: string) => {
    try {
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
        default:
          break
      }
      toast.success('Location updated successfully')
    } catch (error) {
      logError(error, 'Location update')
      toast.error('Failed to update location')
    }
  }

  const handleCellClick = (
    rowIndex: number,
    colKey: string,
    currentValue: any
  ) => {
    const column = schema.columns.find(col => col.key === colKey)
    if (column?.type === 'location') {
      // For location types, we'll handle this in the render method
      setEditingCell({ row: rowIndex, col: colKey })
      return
    }
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
      case 'location':
        // For location fields, the value should be a location ID
        return value || null
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
      logError(error, 'Cell update')
      toast.error(VRPErrorHandling.table.update(error))
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
            // Don't set default coordinates - let user specify them
          })
          break
        case 'routes':
          // Routes creation not implemented yet
          toast.error('Route creation not implemented yet')
          return
      }

      toast.success(`${tableType.slice(0, -1)} created successfully`)
    } catch (error) {
      logError(error, `${tableType} creation`)
      toast.error(VRPErrorHandling.table.create(error))
    } finally {
      setIsCreating(false)
    }
  }

  const handleImport = async (
    data: any[],
    mappings: any[],
    locationResolutions?: { [key: string]: string }
  ) => {
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

          // Transform row data to use location references if needed
          const transformedRow = { ...row }

          // Apply location resolutions for jobs and vehicles
          if (
            locationResolutions &&
            (tableType === 'jobs' || tableType === 'vehicles')
          ) {
            // For jobs: replace coordinates with locationId if resolution exists
            if (tableType === 'jobs' && row.locationLat && row.locationLon) {
              const coordKey = `${row.locationLat},${row.locationLon}`
              if (locationResolutions[coordKey]) {
                transformedRow.locationId = locationResolutions[coordKey]
                // Remove coordinate fields when using location reference
                delete transformedRow.locationLat
                delete transformedRow.locationLon
              }
            }

            // For vehicles: replace start/end coordinates with location references
            if (tableType === 'vehicles') {
              if (row.startLat && row.startLon) {
                const startCoordKey = `${row.startLat},${row.startLon}`
                if (locationResolutions[startCoordKey]) {
                  transformedRow.startLocationId =
                    locationResolutions[startCoordKey]
                  delete transformedRow.startLat
                  delete transformedRow.startLon
                }
              }
              if (row.endLat && row.endLon) {
                const endCoordKey = `${row.endLat},${row.endLon}`
                if (locationResolutions[endCoordKey]) {
                  transformedRow.endLocationId =
                    locationResolutions[endCoordKey]
                  delete transformedRow.endLat
                  delete transformedRow.endLon
                }
              }
            }
          }

          switch (tableType) {
            case 'vehicles':
              await createVehicle({ ...baseData, ...transformedRow })
              break
            case 'jobs':
              await createJob({ ...baseData, ...transformedRow })
              break
            case 'locations':
              await createLocation({ ...baseData, ...transformedRow })
              break
            default:
              throw new Error(`Import not supported for ${tableType}`)
          }
          successCount++
        } catch (error) {
          logError(error, `${tableType} import row`)
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
      logError(error, `${tableType} bulk import`)
      toast.error('Import failed')
    }
  }

  // Location creation handler for import conflicts
  const handleCreateLocation = async (locationData: any) => {
    try {
      const result = await createLocation({
        projectId,
        scenarioId,
        datasetId,
        ...locationData,
      })
      toast.success(`Created location: ${locationData.name}`)
      return result
    } catch (error) {
      logError(error, 'Location creation during import')
      toast.error(`Failed to create location: ${locationData.name}`)
      throw error
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
      logError(error, `${tableType} deletion`)
      toast.error(VRPErrorHandling.table.delete(error))
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
      logError(error, `${tableType} bulk delete`)
      toast.error(VRPErrorHandling.table.bulkDelete(error))
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
          // Prepare update data (exclude system fields and relationship fields)
          const {
            _id,
            _creationTime,
            projectId,
            scenarioId,
            datasetId,
            optimizerId,
            updatedAt,
            ...updateData
          } = row

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
          logError(error, `${tableType} bulk edit row ${i + 1}`)
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
        if (errors.length > 0) {
          logError(
            new Error(errors.join('; ')),
            `${tableType} bulk edit errors`
          )
        }
      }

      // Clear selection after successful updates
      if (successCount > 0) {
        clearSelection()
      }
    } catch (error) {
      logError(error, `${tableType} bulk edit`)
      toast.error(VRPErrorHandling.table.bulkEdit(error))
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
      logError(error, 'VROOM optimization')
      toast.error(
        `Optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // Location display helper
  const getLocationDisplay = (locationId: Id<'locations'> | null) => {
    if (!locationId || !locations) return null
    return locations.find(loc => loc._id === locationId) || null
  }

  // Legacy coordinate migration helper
  const getLegacyCoordinates = (item: any, column: any) => {
    if (!column.legacy) return null
    const [latField, lonField] = column.legacy
    const lat = item[latField]
    const lon = item[lonField]
    if (lat && lon && typeof lat === 'number' && typeof lon === 'number') {
      return { lat, lon }
    }
    return null
  }

  // Validation helper for location fields
  const validateLocationField = (value: any, column: any, item: any) => {
    if (column.type !== 'location') return null

    // If no location ID but has legacy coordinates, show migration warning
    if (!value && getLegacyCoordinates(item, column)) {
      return 'Legacy coordinates detected - please select a location to replace them'
    }

    // If required and no value, show error
    if (column.required && !value) {
      return `${column.label} is required`
    }

    return null
  }

  const renderCellValue = (value: any, column: any, item?: any) => {
    if (value === undefined || value === null) {
      return <span className="text-muted-foreground italic">Empty</span>
    }

    // Handle location type fields
    if (column.type === 'location') {
      const location = getLocationDisplay(value)
      const legacyCoords = getLegacyCoordinates(item, column)
      const validationError = validateLocationField(value, column, item)

      if (!location && !legacyCoords) {
        return (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground italic">No location</span>
            {validationError && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
          </div>
        )
      }

      if (!location && legacyCoords) {
        return (
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="text-orange-700 text-sm">Legacy coordinates</span>
            <Badge variant="outline" className="text-xs font-mono">
              {legacyCoords.lat.toFixed(2)}, {legacyCoords.lon.toFixed(2)}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Needs location
            </Badge>
          </div>
        )
      }

      return (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{location.name}</span>
          {location.locationType && (
            <Badge variant="outline" className="text-xs">
              {location.locationType}
            </Badge>
          )}
          {location.locationLat && location.locationLon && (
            <span className="text-xs text-muted-foreground font-mono">
              ({location.locationLat.toFixed(2)},{' '}
              {location.locationLon.toFixed(2)})
            </span>
          )}
        </div>
      )
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
          <p className="text-sm text-muted-foreground">
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
          <Button
            onClick={addRow}
            size="sm"
            disabled={isCreating}
            className="bg-green-500 hover:bg-green-600 text-white"
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

          {/* Map View Toggle - Only show for location-related tables */}
          {(tableType === 'locations' ||
            tableType === 'jobs' ||
            tableType === 'vehicles') &&
            currentData.length > 0 && (
              <Button
                onClick={() => setShowMapView(!showMapView)}
                size="sm"
                variant={showMapView ? 'default' : 'outline'}
              >
                <Map className="w-4 h-4 mr-2" />
                {showMapView ? 'Table View' : 'Map View'}
              </Button>
            )}

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

      {/* Map View or Table View */}
      {showMapView ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Map View</h4>
            <p className="text-xs text-muted-foreground">
              {
                currentData.filter(
                  item => getCoordinates(item, tableType, locations) !== null
                ).length
              }{' '}
              items with coordinates
            </p>
          </div>
          <SimpleMapView
            data={currentData}
            tableType={tableType}
            locations={locations}
          />
        </div>
      ) : (
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
                    onCheckedChange={(checked, event) => {
                      if (event) {
                        event.stopPropagation()
                      }
                      if (checked) {
                        selectAll()
                      } else {
                        clearSelection()
                      }
                    }}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        e.stopPropagation()
                        if (selectionStatus.isAllSelected) {
                          clearSelection()
                        } else {
                          selectAll()
                        }
                      }
                    }}
                    aria-label={`Select all ${currentData.length} rows`}
                    aria-describedby={
                      selectionStatus.hasSelection
                        ? 'bulk-selection-status'
                        : undefined
                    }
                    className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    title={
                      selectionStatus.isAllSelected
                        ? 'Deselect all rows'
                        : 'Select all rows'
                    }
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
                        onCheckedChange={(checked, event) =>
                          toggleRowSelection(
                            item._id,
                            checked as boolean,
                            event
                          )
                        }
                        onClick={e => e.stopPropagation()}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleRowSelection(
                              item._id,
                              !isRowSelected(item._id),
                              e
                            )
                          }
                        }}
                        aria-label={`Select row ${rowIndex + 1}`}
                        className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      />
                    </TableCell>
                    {schema.columns.map(column => (
                      <TableCell
                        key={column.key}
                        className="relative min-w-[120px]"
                      >
                        {editingCell?.row === rowIndex &&
                        editingCell?.col === column.key ? (
                          column.type === 'location' ? (
                            <div className="flex items-center gap-2">
                              <Select
                                value={item[column.key] || NO_LOCATION_VALUE}
                                onValueChange={async locationId => {
                                  if (locationId === '__create_new__') {
                                    // Quick location creation with minimal data
                                    try {
                                      const quickLocation =
                                        await createLocation({
                                          projectId,
                                          scenarioId,
                                          datasetId,
                                          name: `Location ${Date.now()}`,
                                          locationType: 'customer',
                                        })

                                      const updateData: any = {
                                        id: item._id,
                                        [column.key]: quickLocation,
                                      }
                                      await handleLocationUpdate(
                                        updateData,
                                        tableType
                                      )
                                      toast.success(
                                        'Location created and assigned'
                                      )
                                    } catch (error) {
                                      logError(error, 'Quick location creation')
                                      toast.error('Failed to create location')
                                    }
                                    setEditingCell(null)
                                    return
                                  }

                                  const updateData: any = {
                                    id: item._id,
                                    [column.key]:
                                      locationId === NO_LOCATION_VALUE
                                        ? null
                                        : locationId,
                                  }
                                  handleLocationUpdate(updateData, tableType)
                                  setEditingCell(null)
                                }}
                              >
                                <SelectTrigger className="h-8 min-w-[200px]">
                                  <SelectValue placeholder="Select location..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={NO_LOCATION_VALUE}>
                                    No location
                                  </SelectItem>
                                  {(locations || []).map(location => (
                                    <SelectItem
                                      key={location._id}
                                      value={location._id}
                                    >
                                      <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                        <span>{location.name}</span>
                                        {location.locationType && (
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {location.locationType}
                                          </Badge>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="__create_new__">
                                    <div className="flex items-center gap-2 text-primary">
                                      <Plus className="w-4 h-4" />
                                      <span>Create New Location</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
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
                          )
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
                            {renderCellValue(item[column.key], column, item)}
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
      )}

      {currentData.length === 0 && !showMapView && (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Edit2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Start Building Your {tableType} Data
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Add rows and click on cells to edit them. Changes are automatically
            saved to your dataset.
          </p>
          <Button
            onClick={addRow}
            disabled={isCreating}
            className="bg-green-500 hover:bg-green-600 text-white"
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

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        tableType={tableType}
        existingData={currentData}
        onImport={handleImport}
        existingLocations={locations || []}
        onCreateLocation={handleCreateLocation}
      />

      {/* CSV Export Modal */}
      <CSVExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        tableType={tableType}
        data={currentData}
        selectedRows={getSelectedRows()}
        filteredData={currentData}
        existingLocations={locations || []}
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
