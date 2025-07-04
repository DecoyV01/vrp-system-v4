import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Settings, MoreHorizontal, Database, Calendar, Archive } from 'lucide-react'
import { 
  useProject,
  useScenario, 
  useDatasets, 
  useCreateDataset, 
  useDeleteDataset,
  useScenarioStats 
} from '@/hooks/useVRPData'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useState } from 'react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Id } from '../convex/_generated/dataModel'

const DatasetCard = ({ 
  dataset, 
  projectId, 
  scenarioId 
}: { 
  dataset: any; 
  projectId: Id<"projects">; 
  scenarioId: Id<"scenarios"> 
}) => {
  const navigate = useNavigate()
  const deleteDataset = useDeleteDataset()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      return
    }
    
    try {
      setIsDeleting(true)
      await deleteDataset({ id: dataset._id })
      toast.success('Dataset deleted successfully')
    } catch (error) {
      console.error('Failed to delete dataset:', error)
      toast.error('Failed to delete dataset')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1" onClick={() => navigate(`/projects/${projectId}/scenarios/${scenarioId}/datasets/${dataset._id}`)}>
            <CardTitle className="text-lg mb-1 flex items-center gap-2">
              <Archive className="w-4 h-4" />
              {dataset.name} v{dataset.version || 1}
            </CardTitle>
            <CardDescription className="text-sm">
              {dataset.description || 'No description provided'}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/projects/${projectId}/scenarios/${scenarioId}/datasets/${dataset._id}`)}>
                Open
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                Clone
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>
              Created {formatDistanceToNow(new Date(dataset.createdAt), { addSuffix: true })}
            </span>
          </div>
          {dataset.status && (
            <Badge variant="outline">
              {dataset.status}
            </Badge>
          )}
        </div>
        
        {dataset.datasetType && (
          <div className="text-sm text-gray-600 mb-2">
            <strong>Type:</strong> {dataset.datasetType}
          </div>
        )}
        
        {dataset.entityCounts && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Vehicles:</span>
              <Badge variant="secondary">{dataset.entityCounts.vehicles || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Jobs:</span>
              <Badge variant="secondary">{dataset.entityCounts.jobs || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Locations:</span>
              <Badge variant="secondary">{dataset.entityCounts.locations || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Routes:</span>
              <Badge variant="secondary">{dataset.entityCounts.routes || 0}</Badge>
            </div>
          </div>
        )}
        
        {dataset.tags && dataset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {dataset.tags.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {dataset.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{dataset.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const ScenarioDetailPage = () => {
  const { projectId, scenarioId } = useParams<{ 
    projectId: Id<"projects">; 
    scenarioId: Id<"scenarios"> 
  }>()
  const navigate = useNavigate()
  const project = useProject(projectId)
  const scenario = useScenario(scenarioId)
  const datasets = useDatasets(scenarioId)
  const stats = useScenarioStats(scenarioId)
  const createDataset = useCreateDataset()
  const [isCreatingDataset, setIsCreatingDataset] = useState(false)

  const handleCreateDataset = async () => {
    if (!projectId || !scenarioId) return
    
    try {
      setIsCreatingDataset(true)
      await createDataset({
        projectId,
        scenarioId,
        name: `Dataset v${(datasets?.length || 0) + 1}`,
        description: 'A new dataset for this scenario',
        datasetType: 'working',
        version: (datasets?.length || 0) + 1
      })
      toast.success('Dataset created successfully')
    } catch (error) {
      console.error('Failed to create dataset:', error)
      toast.error('Failed to create dataset')
    } finally {
      setIsCreatingDataset(false)
    }
  }

  if (!projectId || !scenarioId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Scenario Not Found</h1>
          <p className="text-gray-600 mb-4">The requested scenario could not be found.</p>
          <Button onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  if (project === undefined || scenario === undefined || datasets === undefined) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Loading Scenario...</h1>
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
              onClick={() => navigate(`/projects/${projectId}`)}
              className="text-gray-500 hover:text-gray-700"
            >
              ← {project.name}
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">{scenario.name}</h1>
          </div>
          <p className="text-sm text-gray-600">
            {scenario.description || 'No description provided'}
          </p>
          
          {/* Scenario Stats */}
          {stats && (
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Archive className="w-4 h-4" />
                <span>{stats.datasetCount} dataset{stats.datasetCount !== 1 ? 's' : ''}</span>
              </div>
              {scenario.optimizationObjective && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Database className="w-4 h-4" />
                  <span>{scenario.optimizationObjective}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button 
            size="sm" 
            onClick={handleCreateDataset}
            disabled={isCreatingDataset}
          >
            {isCreatingDataset ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                New Dataset
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-6">
        {datasets.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Archive className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Create your first dataset
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Datasets contain the vehicles, jobs, and locations for your optimization scenarios. 
              Start by creating your first dataset.
            </p>
            <Button 
              onClick={handleCreateDataset}
              disabled={isCreatingDataset}
            >
              {isCreatingDataset ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Dataset
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Datasets</h2>
                <p className="text-sm text-gray-600">
                  Manage datasets for this scenario ({datasets.length} dataset{datasets.length !== 1 ? 's' : ''})
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {datasets.map((dataset) => (
                <DatasetCard 
                  key={dataset._id} 
                  dataset={dataset} 
                  projectId={projectId}
                  scenarioId={scenarioId}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ScenarioDetailPage