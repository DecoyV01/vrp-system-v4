import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Settings, Folder, Calendar, MoreHorizontal } from 'lucide-react'
import {
  useProjects,
  useCreateProject,
  useDeleteProject,
  useProjectStats,
} from '@/hooks/useVRPData'
import { useCurrentUser } from '@/hooks/useConvexAuth'
import { Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useState } from 'react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const ProjectCard = ({ project }: { project: any }) => {
  const navigate = useNavigate()
  const stats = useProjectStats(project._id)
  const deleteProject = useDeleteProject()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this project? This action cannot be undone.'
      )
    ) {
      return
    }

    try {
      setIsDeleting(true)
      await deleteProject({ id: project._id })
      toast.success('Project deleted successfully')
    } catch (error) {
      console.error('Failed to delete project:', error)
      toast.error('Failed to delete project')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div
            className="flex-1"
            onClick={() => navigate(`/projects/${project._id}`)}
          >
            <CardTitle className="text-lg mb-1">{project.name}</CardTitle>
            <CardDescription className="text-sm">
              {project.description || 'No description provided'}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => navigate(`/projects/${project._id}`)}
              >
                Open
              </DropdownMenuItem>
              <DropdownMenuItem disabled>Edit</DropdownMenuItem>
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
              Created{' '}
              {formatDistanceToNow(new Date(project.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Scenarios</span>
              <Badge variant="secondary">{stats.scenarioCount}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Datasets</span>
              <Badge variant="secondary">{stats.datasetCount}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Vehicles</span>
              <Badge variant="secondary">{stats.vehicleCount}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Jobs</span>
              <Badge variant="secondary">{stats.jobCount}</Badge>
            </div>
          </div>
        )}

        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {project.tags.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {project.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{project.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const ProjectsPage = () => {
  const { isAuthenticated, isLoading: authLoading } = useCurrentUser()
  const projects = useProjects()
  const createProject = useCreateProject()
  const [isCreating, setIsCreating] = useState(false)

  // Add auth check before rendering
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  const handleCreateProject = async () => {
    try {
      setIsCreating(true)
      await createProject({
        name: `New Project ${Date.now()}`,
        description: 'A new VRP project',
        currency: 'USD',
        priority: 'medium',
      })
      toast.success('Project created successfully')
    } catch (error) {
      console.error('Failed to create project:', error)
      toast.error('Failed to create project')
    } finally {
      setIsCreating(false)
    }
  }

  if (authLoading || projects === undefined) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-sm text-gray-600">
              Manage your VRP projects and scenarios
            </p>
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-600">
            Manage your VRP projects and scenarios ({projects.length} project
            {projects.length !== 1 ? 's' : ''})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button size="sm" onClick={handleCreateProject} disabled={isCreating}>
            {isCreating ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Folder className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Create your first VRP project
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Get started by creating a new project. You can add scenarios,
              datasets, and manage your vehicle routing problems.
            </p>
            <Button onClick={handleCreateProject} disabled={isCreating}>
              {isCreating ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectsPage
