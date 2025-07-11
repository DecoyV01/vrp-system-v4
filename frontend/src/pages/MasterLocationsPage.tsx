import { useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  MapPin,
  Search,
  Filter,
  Plus,
  Grid3X3,
  Map as MapIcon,
  List,
  MoreHorizontal,
  Edit2,
  Trash2,
  Settings,
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'
import {
  useLocations,
  useLocationsByProject,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
  useProject,
  useDataset,
} from '@/hooks/useVRPData'
import type { Id } from '../../../../convex/_generated/dataModel'
import { LocationSearch } from '@/components/locations/LocationSearch'
import { LocationFilters } from '@/components/locations/LocationFilters'
import { LocationCard } from '@/components/locations/LocationCard'
import { LocationMap } from '@/components/locations/LocationMap'
import { LocationForm } from '@/components/locations/LocationForm'
import { LocationDeleteModal } from '@/components/locations/LocationDeleteModal'
import { BulkEditModal } from '@/components/locations/BulkEditModal'
import { CSVImportModal } from '@/components/locations/CSVImportModal'
import { CSVExportModal } from '@/components/locations/CSVExportModal'
import { useBulkSelection } from '@/components/table-editor/bulk-operations'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'

// Types for location filtering and search
interface LocationFilters {
  locationType?: string[]
  geocodeQuality?: string[]
  hasUsage?: boolean
  searchQuery?: string
}

interface MapViewport {
  latitude: number
  longitude: number
  zoom: number
}

const MasterLocationsPage = () => {
  const { projectId, datasetId } = useParams<{
    projectId: string
    datasetId?: string
  }>()
  const navigate = useNavigate()

  // Data hooks
  const project = useProject(projectId as Id<'projects'>)
  const dataset = useDataset(datasetId as Id<'datasets'>)
  const locations = datasetId
    ? useLocations(datasetId as Id<'datasets'>)
    : useLocationsByProject(projectId as Id<'projects'>)

  // Mutation hooks
  const createLocation = useCreateLocation()
  const updateLocation = useUpdateLocation()
  const deleteLocation = useDeleteLocation()

  // Local state
  const [viewMode, setViewMode] = useState<'map' | 'grid' | 'list'>('map')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<LocationFilters>({})
  const [selectedLocationId, setSelectedLocationId] =
    useState<Id<'locations'> | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingLocation, setEditingLocation] = useState<any>(null)
  const [deletingLocation, setDeletingLocation] = useState<any>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [mapViewport, setMapViewport] = useState<MapViewport>({
    latitude: 37.7749,
    longitude: -122.4194,
    zoom: 10,
  })

  // Filtered locations based on search and filters
  const filteredLocations = useMemo(() => {
    if (!locations) return []

    let filtered = [...locations]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        location =>
          location.name?.toLowerCase().includes(query) ||
          location.address?.toLowerCase().includes(query) ||
          location.description?.toLowerCase().includes(query) ||
          location.locationType?.toLowerCase().includes(query)
      )
    }

    // Location type filter
    if (filters.locationType && filters.locationType.length > 0) {
      filtered = filtered.filter(location =>
        filters.locationType!.includes(location.locationType || 'unknown')
      )
    }

    // Geocode quality filter
    if (filters.geocodeQuality && filters.geocodeQuality.length > 0) {
      filtered = filtered.filter(location =>
        filters.geocodeQuality!.includes(location.geocodeQuality || 'unknown')
      )
    }

    // Usage filter
    if (filters.hasUsage !== undefined) {
      filtered = filtered.filter(location =>
        filters.hasUsage
          ? (location.usageCount || 0) > 0
          : (location.usageCount || 0) === 0
      )
    }

    return filtered
  }, [locations, searchQuery, filters])

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
    data: filteredLocations,
    maxSelection: 1000,
    onSelectionChange: selectedIds => {
      console.log('Location selection changed:', selectedIds.length)
    },
  })

  // Get selected locations
  const getSelectedLocations = useCallback(() => {
    const selectedIds = getSelectedIds()
    return filteredLocations.filter(location =>
      selectedIds.includes(location._id)
    )
  }, [filteredLocations, getSelectedIds])

  // Create location handler
  const handleCreateLocation = useCallback(
    async (locationData: any) => {
      try {
        await createLocation({
          projectId: projectId as Id<'projects'>,
          datasetId: datasetId as Id<'datasets'>,
          ...locationData,
        })
        toast.success('Location created successfully')
        setShowCreateModal(false)
      } catch (error) {
        console.error('Failed to create location:', error)
        toast.error('Failed to create location')
      }
    },
    [createLocation, projectId, datasetId]
  )

  // Update location handler
  const handleUpdateLocation = useCallback(
    async (locationData: any) => {
      if (!editingLocation) return

      try {
        await updateLocation({
          id: editingLocation._id,
          ...locationData,
        })
        toast.success('Location updated successfully')
        setEditingLocation(null)
      } catch (error) {
        console.error('Failed to update location:', error)
        toast.error('Failed to update location')
      }
    },
    [updateLocation, editingLocation]
  )

  // Delete location handler
  const handleDeleteLocation = useCallback(async () => {
    if (!deletingLocation) return

    try {
      await deleteLocation({ id: deletingLocation._id })
      toast.success('Location deleted successfully')
      setDeletingLocation(null)
      setSelectedLocationId(null)
    } catch (error) {
      console.error('Failed to delete location:', error)
      toast.error('Failed to delete location')
    }
  }, [deleteLocation, deletingLocation])

  // Bulk operations handlers
  const handleBulkEdit = useCallback(() => {
    setShowBulkEditModal(true)
  }, [])

  const handleBulkDelete = useCallback(async () => {
    const selectedLocations = getSelectedLocations()
    if (selectedLocations.length === 0) return

    const confirmMessage = `Are you sure you want to delete ${selectedLocations.length} location${selectedLocations.length !== 1 ? 's' : ''}? This action cannot be undone.`

    if (!confirm(confirmMessage)) return

    try {
      for (const location of selectedLocations) {
        await deleteLocation({ id: location._id })
      }
      toast.success(
        `Deleted ${selectedLocations.length} location${selectedLocations.length !== 1 ? 's' : ''} successfully`
      )
      clearSelection()
    } catch (error) {
      console.error('Bulk delete failed:', error)
      toast.error('Failed to delete selected locations')
    }
  }, [getSelectedLocations, deleteLocation, clearSelection])

  // Loading state
  if (locations === undefined || project === undefined) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex items-center justify-center flex-1">
          <LoadingSpinner className="w-8 h-8" />
        </div>
      </div>
    )
  }

  const locationTypeOptions = [
    { value: 'depot', label: 'Depot' },
    { value: 'customer', label: 'Customer' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'distribution_center', label: 'Distribution Center' },
    { value: 'pickup_point', label: 'Pickup Point' },
    { value: 'delivery_point', label: 'Delivery Point' },
  ]

  const qualityOptions = [
    { value: 'exact', label: 'Exact' },
    { value: 'interpolated', label: 'Interpolated' },
    { value: 'approximate', label: 'Approximate' },
    { value: 'manual', label: 'Manual' },
  ]

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>{project.name}</span>
            {dataset && (
              <>
                <span>/</span>
                <span>{dataset.name}</span>
              </>
            )}
            <span>/</span>
            <span className="text-foreground font-medium">Locations</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            Master Locations
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage and visualize all locations ({filteredLocations.length} of{' '}
            {locations.length} locations)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <Tabs
            value={viewMode}
            onValueChange={value => setViewMode(value as any)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="map">
                <MapIcon className="w-4 h-4 mr-1" />
                Map
              </TabsTrigger>
              <TabsTrigger value="grid">
                <Grid3X3 className="w-4 h-4 mr-1" />
                Grid
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="w-4 h-4 mr-1" />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Separator orientation="vertical" className="h-6" />

          {/* Bulk Operations */}
          {selectionStatus.hasSelection && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectionStatus.selectedCount} selected
              </span>
              <Button variant="outline" size="sm" onClick={handleBulkEdit}>
                <Edit2 className="w-4 h-4 mr-2" />
                Bulk Edit
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
                Clear Selection
              </Button>
              <Separator orientation="vertical" className="h-6" />
            </>
          )}

          {/* Import/Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="w-4 h-4 mr-2" />
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowImportModal(true)}>
                Import CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowExportModal(true)}>
                Export CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Location
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-6 border-b border-border bg-muted">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <LocationSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search locations by name, address, or type..."
            />
          </div>
          <LocationFilters
            filters={filters}
            onFiltersChange={setFilters}
            locationTypeOptions={locationTypeOptions}
            qualityOptions={qualityOptions}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'map' && (
          <div className="h-full relative">
            <LocationMap
              locations={filteredLocations}
              selectedLocationId={selectedLocationId}
              onLocationSelect={setSelectedLocationId}
              onLocationCreate={(coordinates, address) => {
                // Open create modal with coordinates
                setShowCreateModal(true)
              }}
              viewport={mapViewport}
              onViewportChange={setMapViewport}
              showClusters={true}
              interactive={true}
            />

            {/* Selected location details sidebar */}
            {selectedLocationId && (
              <div className="absolute top-4 right-4 w-80 bg-background border border-border rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
                {(() => {
                  const selectedLocation = filteredLocations.find(
                    l => l._id === selectedLocationId
                  )
                  if (!selectedLocation) return null

                  return (
                    <LocationCard
                      location={selectedLocation}
                      isSelected={true}
                      onEdit={() => setEditingLocation(selectedLocation)}
                      onDelete={() => setDeletingLocation(selectedLocation)}
                      showUsageMetrics={true}
                    />
                  )
                })()}
              </div>
            )}
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="p-6 h-full overflow-y-auto">
            {filteredLocations.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No locations found
                </h3>
                <p className="text-muted-foreground mb-6">
                  {locations.length === 0
                    ? 'Get started by creating your first location'
                    : 'Try adjusting your search or filters'}
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Location
                </Button>
              </div>
            ) : (
              <>
                {/* Select All Checkbox */}
                <div className="flex items-center gap-2 mb-4 p-2 bg-muted rounded">
                  <Checkbox
                    checked={selectionStatus.isAllSelected}
                    onCheckedChange={checked => {
                      if (checked) {
                        selectAll()
                      } else {
                        clearSelection()
                      }
                    }}
                    aria-label="Select all locations"
                  />
                  <span className="text-sm text-muted-foreground">
                    Select all ({filteredLocations.length} locations)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredLocations.map(location => (
                    <div key={location._id} className="relative">
                      <Checkbox
                        checked={isRowSelected(location._id)}
                        onCheckedChange={checked =>
                          toggleRowSelection(location._id, checked as boolean)
                        }
                        className="absolute top-2 left-2 z-10"
                        aria-label={`Select ${location.name}`}
                      />
                      <LocationCard
                        location={location}
                        isSelected={selectedLocationId === location._id}
                        onSelect={() => setSelectedLocationId(location._id)}
                        onEdit={() => setEditingLocation(location)}
                        onDelete={() => setDeletingLocation(location)}
                        showUsageMetrics={true}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="p-6 h-full overflow-y-auto">
            {filteredLocations.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No locations found
                </h3>
                <p className="text-muted-foreground mb-6">
                  {locations.length === 0
                    ? 'Get started by creating your first location'
                    : 'Try adjusting your search or filters'}
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Location
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Header */}
                <div className="flex items-center gap-2 p-3 bg-muted rounded font-medium text-sm">
                  <Checkbox
                    checked={selectionStatus.isAllSelected}
                    onCheckedChange={checked => {
                      if (checked) {
                        selectAll()
                      } else {
                        clearSelection()
                      }
                    }}
                    aria-label="Select all locations"
                  />
                  <div className="flex-1 grid grid-cols-6 gap-4">
                    <span>Name</span>
                    <span>Type</span>
                    <span>Address</span>
                    <span>Coordinates</span>
                    <span>Quality</span>
                    <span>Usage</span>
                  </div>
                  <div className="w-16">Actions</div>
                </div>

                {/* Rows */}
                {filteredLocations.map(location => (
                  <div
                    key={location._id}
                    className={`flex items-center gap-2 p-3 border rounded hover:bg-muted cursor-pointer ${
                      selectedLocationId === location._id
                        ? 'bg-primary/5 border-primary/20'
                        : 'border-border'
                    }`}
                    onClick={() => setSelectedLocationId(location._id)}
                  >
                    <Checkbox
                      checked={isRowSelected(location._id)}
                      onCheckedChange={checked =>
                        toggleRowSelection(location._id, checked as boolean)
                      }
                      onClick={e => e.stopPropagation()}
                      aria-label={`Select ${location.name}`}
                    />
                    <div className="flex-1 grid grid-cols-6 gap-4 text-sm">
                      <span className="font-medium">{location.name}</span>
                      <Badge variant="outline" className="w-fit">
                        {location.locationType || 'Unknown'}
                      </Badge>
                      <span className="text-muted-foreground truncate">
                        {location.address || 'No address'}
                      </span>
                      <span className="text-muted-foreground font-mono text-xs">
                        {location.locationLat && location.locationLon
                          ? `${location.locationLat.toFixed(4)}, ${location.locationLon.toFixed(4)}`
                          : 'No coordinates'}
                      </span>
                      <Badge
                        variant={
                          location.geocodeQuality === 'exact'
                            ? 'default'
                            : 'secondary'
                        }
                        className="w-fit"
                      >
                        {location.geocodeQuality || 'Unknown'}
                      </Badge>
                      <span className="text-muted-foreground">
                        {location.usageCount || 0} uses
                      </span>
                    </div>
                    <div className="w-16 flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation()
                          setEditingLocation(location)
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation()
                          setDeletingLocation(location)
                        }}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <LocationForm
          mode="create"
          onSave={handleCreateLocation}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {editingLocation && (
        <LocationForm
          mode="edit"
          location={editingLocation}
          onSave={handleUpdateLocation}
          onCancel={() => setEditingLocation(null)}
        />
      )}

      {deletingLocation && (
        <LocationDeleteModal
          location={deletingLocation}
          isOpen={true}
          onConfirm={handleDeleteLocation}
          onCancel={() => setDeletingLocation(null)}
        />
      )}

      {showBulkEditModal && (
        <BulkEditModal
          isOpen={true}
          onClose={() => setShowBulkEditModal(false)}
          selectedLocations={getSelectedLocations()}
          onEditComplete={() => {
            setShowBulkEditModal(false)
            clearSelection()
          }}
        />
      )}

      {showImportModal && (
        <CSVImportModal
          isOpen={true}
          onClose={() => setShowImportModal(false)}
          onImport={() => setShowImportModal(false)}
          projectId={projectId as Id<'projects'>}
          datasetId={datasetId as Id<'datasets'>}
        />
      )}

      {showExportModal && (
        <CSVExportModal
          isOpen={true}
          onClose={() => setShowExportModal(false)}
          locations={filteredLocations}
          selectedLocations={getSelectedLocations()}
        />
      )}
    </div>
  )
}

export default MasterLocationsPage
