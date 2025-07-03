import { Button } from '@/components/ui/button'
import { Plus, Settings } from 'lucide-react'

const ProjectsPage = () => {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-600">Manage your VRP projects and scenarios</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Create your first VRP project
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Get started by creating a new project. You can add scenarios, datasets, and manage your vehicle routing problems.
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ProjectsPage