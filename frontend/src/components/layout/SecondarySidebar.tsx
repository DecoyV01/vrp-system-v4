import { ChevronRight, ChevronLeft, Folder, Database, Table, Plus, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { 
  useHierarchy, 
  useTreeData, 
  useProjectScenarios, 
  useScenarioDatasets,
  getNodeUrl,
  type TreeNode 
} from '@/hooks/useHierarchy'
import { useCreateProject } from '@/hooks/useVRPData'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'
import useSidebarStore from '@/stores/useSidebarStore'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const TreeNodeComponent = ({ node, level = 0 }: { node: TreeNode; level?: number }) => {
  const navigate = useNavigate()
  const { toggleNode, setSelectedNode, selectedNode } = useHierarchy()
  const isSelected = selectedNode?.id === node.id

  // Get child data based on node type
  const scenarios = useProjectScenarios(
    node.type === 'project' ? node.realId as any : undefined
  )
  const datasets = useScenarioDatasets(
    node.type === 'scenario' ? node.realId as any : undefined,
    node.metadata?.projectId
  )

  const getIcon = () => {
    switch (node.type) {
      case 'project':
        return <Folder className="w-4 h-4" />
      case 'scenario':
        return <Database className="w-4 h-4" />
      case 'dataset':
        return <Database className="w-4 h-4" />
      case 'table':
        return <Table className="w-4 h-4" />
      default:
        return <Folder className="w-4 h-4" />
    }
  }

  const handleClick = () => {
    setSelectedNode(node)
    
    // Toggle expansion for non-leaf nodes
    if (node.type !== 'table') {
      toggleNode(node.id)
    }
    
    // Navigate to the appropriate URL
    const url = getNodeUrl(node)
    navigate(url)
  }

  const getChildren = () => {
    if (node.type === 'project' && node.expanded) {
      return scenarios
    } else if (node.type === 'scenario' && node.expanded) {
      return datasets
    } else if (node.type === 'dataset' && node.expanded) {
      return node.children // Table nodes are static
    }
    return []
  }

  const children = getChildren()
  const hasChildren = (node.type === 'project' && scenarios?.length > 0) ||
                     (node.type === 'scenario' && datasets?.length > 0) ||
                     (node.type === 'dataset' && node.children && node.children.length > 0)

  return (
    <div>
      <div 
        className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer group ${
          isSelected 
            ? 'bg-accent text-accent-foreground' 
            : 'hover:bg-muted text-foreground'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {hasChildren && (
          <ChevronRight 
            className={`w-4 h-4 transition-transform ${node.expanded ? 'rotate-90' : ''}`}
          />
        )}
        {!hasChildren && <div className="w-4" />}
        {getIcon()}
        <span className="text-sm truncate flex-1">{node.name}</span>
        
        {/* Context menu for certain node types */}
        {(node.type === 'project' || node.type === 'scenario' || node.type === 'dataset') && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      {node.expanded && children && children.length > 0 && (
        <div>
          {children.map((child) => (
            <TreeNodeComponent 
              key={child.id} 
              node={child} 
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  )
}

const SecondarySidebar = () => {
  const treeData = useTreeData()
  const createProject = useCreateProject()
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const { secondary, toggleSecondary } = useSidebarStore()

  const handleCreateProject = async () => {
    try {
      setIsCreatingProject(true)
      await createProject({
        name: `New Project ${Date.now()}`,
        description: 'A new VRP project'
      })
      toast.success('Project created successfully')
    } catch (error) {
      console.error('Failed to create project:', error)
      toast.error('Failed to create project')
    } finally {
      setIsCreatingProject(false)
    }
  }

  // Show toggle button when collapsed
  if (secondary.collapsed) {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 left-2 z-10 w-8 h-8 p-0 bg-background border border-border shadow-sm hover:bg-muted"
          onClick={toggleSecondary}
          title="Show projects sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  if (treeData === undefined) {
    return (
      <div className="w-64 bg-background border-r border-border flex flex-col transition-all duration-150 ease-out">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">VRP Projects</h2>
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 hover:bg-muted"
            onClick={toggleSecondary}
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 bg-background border-r border-border flex flex-col transition-all duration-150 ease-out">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">VRP Projects</h2>
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0 hover:bg-muted"
          onClick={toggleSecondary}
          title="Collapse sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {treeData.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm mt-8">
            <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No projects yet.</p>
            <p>Create your first project to get started.</p>
          </div>
        ) : (
          treeData.map((node) => (
            <TreeNodeComponent key={node.id} node={node} />
          ))
        )}
      </div>
      
      {/* Actions */}
      <div className="p-4 border-t border-border">
        <Button 
          size="sm" 
          className="w-full"
          onClick={handleCreateProject}
          disabled={isCreatingProject}
        >
          {isCreatingProject ? (
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
  )
}

export default SecondarySidebar