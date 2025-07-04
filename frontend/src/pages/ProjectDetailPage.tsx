import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Settings, MoreHorizontal, Database, Calendar, Users } from 'lucide-react'
import { 
  useProject, 
  useScenarios, 
  useCreateScenario, 
  useDeleteScenario,
  useProjectStats 
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

const ScenarioCard = ({ scenario, projectId }: { scenario: any; projectId: Id<"projects"> }) => {
  const navigate = useNavigate()
  const deleteScenario = useDeleteScenario()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this scenario? This action cannot be undone.')) {
      return
    }
    
    try {
      setIsDeleting(true)
      await deleteScenario({ id: scenario._id })
      toast.success('Scenario deleted successfully')
    } catch (error) {
      console.error('Failed to delete scenario:', error)
      toast.error('Failed to delete scenario')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1" onClick={() => navigate(`/projects/${projectId}/scenarios/${scenario._id}`)}>
            <CardTitle className="text-lg mb-1 flex items-center gap-2">
              <Database className="w-4 h-4" />
              {scenario.name}
            </CardTitle>
            <CardDescription className="text-sm">
              {scenario.description || 'No description provided'}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/projects/${projectId}/scenarios/${scenario._id}`)}>
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
              Created {formatDistanceToNow(new Date(scenario.createdAt), { addSuffix: true })}
            </span>
          </div>
          {scenario.status && (
            <Badge variant="outline">
              {scenario.status}
            </Badge>
          )}
        </div>
        
        {scenario.optimizationObjective && (
          <div className="text-sm text-gray-600 mb-2">
            <strong>Objective:</strong> {scenario.optimizationObjective}
          </div>
        )}
        
        {scenario.tags && scenario.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {scenario.tags.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {scenario.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{scenario.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: Id<"projects"> }>()
  const navigate = useNavigate()
  const project = useProject(projectId)
  const scenarios = useScenarios(projectId)
  const stats = useProjectStats(projectId)
  const createScenario = useCreateScenario()
  const [isCreatingScenario, setIsCreatingScenario] = useState(false)

  const handleCreateScenario = async () => {
    if (!projectId) return
    
    try {
      setIsCreatingScenario(true)
      await createScenario({
        projectId,
        name: `New Scenario ${Date.now()}`,
        description: 'A new optimization scenario',
        optimizationObjective: 'minimize_total_cost'
      })
      toast.success('Scenario created successfully')
    } catch (error) {
      console.error('Failed to create scenario:', error)
      toast.error('Failed to create scenario')
    } finally {
      setIsCreatingScenario(false)
    }
  }

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
          <p className="text-gray-600 mb-4">The requested project could not be found.</p>
          <Button onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  if (project === undefined || scenarios === undefined) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Loading Project...</h1>
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
              onClick={() => navigate('/projects')}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Projects
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          </div>
          <p className="text-sm text-gray-600">
            {project.description || 'No description provided'}
          </p>
          
          {/* Project Stats */}
          {stats && (
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Database className="w-4 h-4" />
                <span>{stats.scenarioCount} scenario{stats.scenarioCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>{stats.vehicleCount} vehicle{stats.vehicleCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{stats.jobCount} job{stats.jobCount !== 1 ? 's' : ''}</span>
              </div>
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
            onClick={handleCreateScenario}
            disabled={isCreatingScenario}
          >
            {isCreatingScenario ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                New Scenario
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-6">
        {scenarios.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Create your first scenario
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Scenarios help you test different optimization parameters and compare results. 
              Start by creating your first scenario.
            </p>
            <Button 
              onClick={handleCreateScenario}
              disabled={isCreatingScenario}
            >
              {isCreatingScenario ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Scenario
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Scenarios</h2>
                <p className="text-sm text-gray-600">
                  Manage optimization scenarios for this project ({scenarios.length} scenario{scenarios.length !== 1 ? 's' : ''})
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scenarios.map((scenario) => (
                <ScenarioCard 
                  key={scenario._id} 
                  scenario={scenario} 
                  projectId={projectId}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ProjectDetailPage