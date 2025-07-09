import { useParams, useNavigate } from 'react-router-dom'
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
  Settings,
  Truck,
  MapPin,
  Briefcase,
  Route,
  Calendar,
  Archive,
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
}: {
  title: string
  description: string
  icon: React.ReactNode
  count: number | undefined
  projectId: Id<'projects'>
  scenarioId: Id<'scenarios'>
  datasetId: Id<'datasets'>
  tableType: 'vehicles' | 'jobs' | 'locations' | 'routes'
}) => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(
      `/projects/${projectId}/scenarios/${scenarioId}/datasets/${datasetId}/${tableType}`
    )
  }

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg mb-1 flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-900">
            {count !== undefined ? count : '...'}
          </span>
          <Badge variant="secondary">
            {count !== undefined
              ? `${count} item${count !== 1 ? 's' : ''}`
              : 'Loading...'}
          </Badge>
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

  if (!projectId || !scenarioId || !datasetId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Dataset Not Found</h1>
          <p className="text-gray-600 mb-4">
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
            <h1 className="text-2xl font-bold text-gray-900">
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
              className="text-gray-500 hover:text-gray-700"
            >
              ← {scenario.name}
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              {dataset.name} v{dataset.version || 1}
            </h1>
          </div>
          <p className="text-sm text-gray-600">
            {dataset.description || 'No description provided'}
          </p>

          {/* Dataset Info */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>
                Created{' '}
                {formatDistanceToNow(new Date(dataset._creationTime), {
                  addSuffix: true,
                })}
              </span>
            </div>
            {dataset.datasetType && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
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
          <Button variant="outline" size="sm" disabled>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Data Tables
          </h2>
          <p className="text-sm text-gray-600">
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
          />
        </div>

        {/* Dataset Summary */}
        {stats && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Dataset Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Vehicles</p>
                      <p className="text-2xl font-bold">{stats.vehicleCount}</p>
                    </div>
                    <Truck className="w-8 h-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Jobs</p>
                      <p className="text-2xl font-bold">{stats.jobCount}</p>
                    </div>
                    <Briefcase className="w-8 h-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Locations</p>
                      <p className="text-2xl font-bold">
                        {stats.locationCount}
                      </p>
                    </div>
                    <MapPin className="w-8 h-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Routes</p>
                      <p className="text-2xl font-bold">
                        {stats.routeCount || 0}
                      </p>
                    </div>
                    <Route className="w-8 h-8 text-gray-400" />
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
