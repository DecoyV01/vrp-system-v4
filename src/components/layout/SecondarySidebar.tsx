import { ChevronRight, Folder, Database, Table } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TreeNode {
  id: string
  type: 'project' | 'scenario' | 'dataset' | 'table'
  name: string
  children?: TreeNode[]
  expanded?: boolean
}

// Mock data for demonstration
const mockTreeData: TreeNode[] = [
  {
    id: '1',
    type: 'project',
    name: 'Sample VRP Project',
    expanded: true,
    children: [
      {
        id: '2',
        type: 'scenario',
        name: 'Scenario 1',
        expanded: true,
        children: [
          {
            id: '3',
            type: 'dataset',
            name: 'Dataset v1.0',
            expanded: true,
            children: [
              { id: '4', type: 'table', name: 'Vehicles' },
              { id: '5', type: 'table', name: 'Jobs' },
              { id: '6', type: 'table', name: 'Locations' },
              { id: '7', type: 'table', name: 'Routes' },
            ]
          }
        ]
      }
    ]
  }
]

const TreeNodeComponent = ({ node, level = 0 }: { node: TreeNode; level?: number }) => {
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

  return (
    <div>
      <div 
        className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded cursor-pointer"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {node.children && (
          <ChevronRight 
            className={`w-4 h-4 transition-transform ${node.expanded ? 'rotate-90' : ''}`}
          />
        )}
        {getIcon()}
        <span className="text-sm truncate">{node.name}</span>
      </div>
      {node.expanded && node.children && (
        <div>
          {node.children.map((child) => (
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
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">VRP Projects</h2>
      </div>
      
      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {mockTreeData.map((node) => (
          <TreeNodeComponent key={node.id} node={node} />
        ))}
      </div>
      
      {/* Actions */}
      <div className="p-4 border-t border-gray-200">
        <Button size="sm" className="w-full">
          New Project
        </Button>
      </div>
    </div>
  )
}

export default SecondarySidebar