import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowLeft, Database, Table as TableIcon } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import TableEditor from '@/components/table-editor/TableEditor'
import { useProject, useScenario, useDataset } from '@/hooks/useVRPData'
import type { Id } from '../../../convex/_generated/dataModel'

const TableEditorPage = () => {
  const { projectId, scenarioId, datasetId, tableType } = useParams()
  const navigate = useNavigate()

  // Validate and type the URL parameters
  const validTableTypes = ['vehicles', 'jobs', 'locations', 'routes'] as const
  const isValidTableType = (
    type: string | undefined
  ): type is (typeof validTableTypes)[number] => {
    return type !== undefined && validTableTypes.includes(type as any)
  }

  // Fetch data for breadcrumb and validation
  const project = useProject(projectId as Id<'projects'>)
  const scenario = useScenario(scenarioId as Id<'scenarios'>)
  const dataset = useDataset(datasetId as Id<'datasets'>)

  // Validate parameters
  if (!projectId || !scenarioId || !datasetId || !isValidTableType(tableType)) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center justify-center flex-1">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <TableIcon className="w-5 h-5" />
                Invalid Parameters
              </CardTitle>
              <CardDescription>
                The table editor URL is missing required parameters.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Expected format:
                /projects/[projectId]/scenarios/[scenarioId]/datasets/[datasetId]/[tableType]
              </p>
              <Button onClick={() => navigate('/projects')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Loading state
  if (
    project === undefined ||
    scenario === undefined ||
    dataset === undefined
  ) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center justify-center flex-1">
          <LoadingSpinner className="w-8 h-8" />
        </div>
      </div>
    )
  }

  // Error state - data not found
  if (!project || !scenario || !dataset) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center justify-center flex-1">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Database className="w-5 h-5" />
                Data Not Found
              </CardTitle>
              <CardDescription>
                The requested project, scenario, or dataset could not be found.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/projects')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const handleBreadcrumbNav = (path: string) => {
    navigate(path)
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleBreadcrumbNav('/projects')}
            className="h-auto p-0 text-blue-600 hover:text-blue-800"
          >
            Projects
          </Button>
          <span>/</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleBreadcrumbNav(`/projects/${projectId}`)}
            className="h-auto p-0 text-blue-600 hover:text-blue-800"
          >
            {project.name}
          </Button>
          <span>/</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              handleBreadcrumbNav(
                `/projects/${projectId}/scenarios/${scenarioId}`
              )
            }
            className="h-auto p-0 text-blue-600 hover:text-blue-800"
          >
            {scenario.name}
          </Button>
          <span>/</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              handleBreadcrumbNav(
                `/projects/${projectId}/scenarios/${scenarioId}/datasets/${datasetId}`
              )
            }
            className="h-auto p-0 text-blue-600 hover:text-blue-800"
          >
            {dataset.name} v{dataset.version}
          </Button>
          <span>/</span>
          <span className="capitalize font-medium">{tableType}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 capitalize flex items-center gap-2">
              <TableIcon className="w-6 h-6" />
              {tableType} Editor
            </h1>
            <p className="text-sm text-gray-600">
              Manage {tableType} data for {dataset.name} v{dataset.version}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline">{project.name}</Badge>
            <Badge variant="outline">{scenario.name}</Badge>
            <Badge variant="secondary">
              {dataset.name} v{dataset.version}
            </Badge>
          </div>
        </div>
      </div>

      {/* Table Editor */}
      <div className="flex-1 p-6 overflow-auto">
        <TableEditor
          datasetId={datasetId as Id<'datasets'>}
          tableType={tableType}
          projectId={projectId as Id<'projects'>}
          scenarioId={scenarioId as Id<'scenarios'>}
        />
      </div>
    </div>
  )
}

export default TableEditorPage
