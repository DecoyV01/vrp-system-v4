import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  Settings,
  Truck,
  MapPin,
  Briefcase,
  Route,
  Calendar,
  Archive,
  Plus,
  MoreVertical,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import {
  useProject,
  useScenario,
  useDataset,
  useVehicles,
  useJobs,
  useLocations,
  useRoutes,
  useDatasetStats,
  useTableManagement,
} from '@/hooks/useVRPData'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { formatDistanceToNow } from 'date-fns'
import type { Id } from '../../../convex/_generated/dataModel'

const TableCard = ({
  title,
  description,
  icon,
  count,
  projectId,
  scenarioId,
  datasetId,
  tableType,
  isActive = true,
  onToggleStatus,
  onDeleteTable,
}: {
  title: string
  description: string
  icon: React.ReactNode
  count: number | undefined
  projectId: Id<'projects'>
  scenarioId: Id<'scenarios'>
  datasetId: Id<'datasets'>
  tableType: 'vehicles' | 'jobs' | 'locations' | 'routes'
  isActive?: boolean
  onToggleStatus?: (tableType: string, currentStatus: boolean) => void
  onDeleteTable?: (tableType: string) => void
}) => {
  const navigate = useNavigate()

  const handleCardClick = () => {
    if (isActive) {
      navigate(
        `/projects/${projectId}/scenarios/${scenarioId}/datasets/${datasetId}/${tableType}`
      )
    }
  }

  const handleToggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleStatus?.(tableType, isActive)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDeleteTable?.(tableType)
  }

  return (
    <Card
      className={`hover:shadow-md transition-shadow ${isActive ? 'cursor-pointer' : 'opacity-60'}`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            {title}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleToggleStatus}>
                {isActive ? (
                  <>
                    <ToggleLeft className="mr-2 h-4 w-4" />
                    Deactivate Table
                  </>
                ) : (
                  <>
                    <ToggleRight className="mr-2 h-4 w-4" />
                    Activate Table
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Table
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <span className="text-xl font-semibold text-foreground">
            {count !== undefined ? count : '...'}
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {count !== undefined
                ? `${count} item${count !== 1 ? 's' : ''}`
                : 'Loading...'}
            </Badge>
            <Badge
              variant={isActive ? 'default' : 'outline'}
              className="text-sm"
            >
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const DatasetDetailPage = () => {
  const { projectId, scenarioId, datasetId } = useParams<{
    projectId: Id<'projects'>
    scenarioId: Id<'scenarios'>
    datasetId: Id<'datasets'>
  }>()
  const navigate = useNavigate()
  const project = useProject(projectId)
  const scenario = useScenario(scenarioId)
  const dataset = useDataset(datasetId)
  const vehicles = useVehicles(datasetId)
  const jobs = useJobs(datasetId)
  const locations = useLocations(datasetId)
  const routes = useRoutes(datasetId)
  const stats = useDatasetStats(datasetId)

  // Table management using custom hook
  const { tableStatuses, toggleTableStatus, createTable, deleteTable } =
    useTableManagement(datasetId)
  const [showCreateTable, setShowCreateTable] = useState(false)

  // Table management handlers
  const handleToggleTableStatus = async (
    tableType: string,
    currentStatus: boolean
  ) => {
    try {
      await toggleTableStatus(tableType, currentStatus)
      toast.success(
        `${tableType} table ${!currentStatus ? 'activated' : 'deactivated'}`
      )
    } catch (error) {
      toast.error(`Failed to update ${tableType} table status`)
      console.error('Table status toggle failed:', error)
    }
  }

  const handleDeleteTable = async (tableType: string) => {
    try {
      const confirmed = confirm(
        `Are you sure you want to delete the ${tableType} table? This will remove all data and cannot be undone.`
      )
      if (!confirmed) return

      await deleteTable(tableType)
      toast.success(`${tableType} table deleted successfully`)
    } catch (error) {
      toast.error(`Failed to delete ${tableType} table`)
      console.error('Table deletion failed:', error)
    }
  }

  const handleCreateTable = async (
    tableType: 'vehicles' | 'jobs' | 'locations' | 'routes'
  ) => {
    try {
      await createTable(tableType)
      toast.success(`${tableType} table created successfully`)
      setShowCreateTable(false)
    } catch (error) {
      toast.error(`Failed to create ${tableType} table`)
      console.error('Table creation failed:', error)
    }
  }

  if (!projectId || !scenarioId || !datasetId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Dataset Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The requested dataset could not be found.
          </p>
          <Button onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  if (
    project === undefined ||
    scenario === undefined ||
    dataset === undefined
  ) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Loading Dataset...
            </h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner className="w-8 h-8" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                navigate(`/projects/${projectId}/scenarios/${scenarioId}`)
              }
              className="text-muted-foreground hover:text-foreground"
            >
              ← {scenario.name}
            </Button>
            <h1 className="text-xl font-semibold text-foreground">
              {dataset.name} v{dataset.version || 1}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {dataset.description || 'No description provided'}
          </p>

          {/* Dataset Info */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                Created{' '}
                {formatDistanceToNow(new Date(dataset._creationTime), {
                  addSuffix: true,
                })}
              </span>
            </div>
            {dataset.datasetType && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Archive className="w-4 h-4" />
                <span>{dataset.datasetType}</span>
              </div>
            )}
            {dataset.status && (
              <Badge variant="outline">{dataset.status}</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(
                `/projects/${projectId}/scenarios/${scenarioId}/datasets/${datasetId}/locations`
              )
            }
          >
            <MapPin className="w-4 h-4 mr-2" />
            Master Locations
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Manage Tables
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setShowCreateTable(!showCreateTable)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {showCreateTable ? 'Hide' : 'Show'} Table Creation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Data Tables
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage the core VRP data for this dataset. Click on any table to
            view and edit the data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <TableCard
            title="Vehicles"
            description="Fleet vehicles with capacity and constraints"
            icon={<Truck className="w-5 h-5" />}
            count={vehicles?.length}
            projectId={projectId}
            scenarioId={scenarioId}
            datasetId={datasetId}
            tableType="vehicles"
            isActive={tableStatuses.vehicles}
            onToggleStatus={handleToggleTableStatus}
            onDeleteTable={handleDeleteTable}
          />

          <TableCard
            title="Jobs"
            description="Delivery and pickup tasks"
            icon={<Briefcase className="w-5 h-5" />}
            count={jobs?.length}
            projectId={projectId}
            scenarioId={scenarioId}
            datasetId={datasetId}
            tableType="jobs"
            isActive={tableStatuses.jobs}
            onToggleStatus={handleToggleTableStatus}
            onDeleteTable={handleDeleteTable}
          />

          <TableCard
            title="Locations"
            description="Geographic locations and addresses"
            icon={<MapPin className="w-5 h-5" />}
            count={locations?.length}
            projectId={projectId}
            scenarioId={scenarioId}
            datasetId={datasetId}
            tableType="locations"
            isActive={tableStatuses.locations}
            onToggleStatus={handleToggleTableStatus}
            onDeleteTable={handleDeleteTable}
          />

          <TableCard
            title="Routes"
            description="Optimized routes and solutions"
            icon={<Route className="w-5 h-5" />}
            count={routes?.length}
            projectId={projectId}
            scenarioId={scenarioId}
            datasetId={datasetId}
            tableType="routes"
            isActive={tableStatuses.routes}
            onToggleStatus={handleToggleTableStatus}
            onDeleteTable={handleDeleteTable}
          />

          {/* Create Table Card - Only show when enabled */}
          {showCreateTable && (
            <Card className="border-dashed border-2 hover:shadow-md transition-shadow">
              <CardContent className="pt-6 text-center">
                <Plus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Create New Table</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Add additional table types to this dataset
                </p>
                <div className="space-y-2">
                  {(['vehicles', 'jobs', 'locations', 'routes'] as const).map(
                    tableType => (
                      <Button
                        key={tableType}
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleCreateTable(tableType)}
                      >
                        Create {tableType} table
                      </Button>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Dataset Summary */}
        {stats && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Dataset Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Vehicles
                      </p>
                      <p className="text-xl font-semibold">
                        {stats.vehicleCount}
                      </p>
                    </div>
                    <Truck className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Jobs
                      </p>
                      <p className="text-xl font-semibold">{stats.jobCount}</p>
                    </div>
                    <Briefcase className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Locations
                      </p>
                      <p className="text-xl font-semibold">
                        {stats.locationCount}
                      </p>
                    </div>
                    <MapPin className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Routes
                      </p>
                      <p className="text-xl font-semibold">
                        {stats.routeCount || 0}
                      </p>
                    </div>
                    <Route className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DatasetDetailPage
