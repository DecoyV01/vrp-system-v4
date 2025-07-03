import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Download, Upload, Settings } from 'lucide-react'

const TableEditorPage = () => {
  const { tableType } = useParams()

  // Mock data for demonstration - this will be replaced with real data from Convex in Phase 5
  const mockData = [
    { id: '1', name: 'Vehicle 1', capacity: 1000, startLocation: 'Depot A' },
    { id: '2', name: 'Vehicle 2', capacity: 1500, startLocation: 'Depot B' },
    { id: '3', name: 'Vehicle 3', capacity: 800, startLocation: 'Depot A' },
  ]

  const columns = ['ID', 'Name', 'Capacity', 'Start Location']

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 capitalize">
            {tableType || 'Table'} Editor
          </h1>
          <p className="text-sm text-gray-600">
            Manage your VRP data with advanced table editing capabilities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Row
          </Button>
        </div>
      </div>
      
      {/* Table Editor */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column} className="font-semibold">
                    {column}
                  </TableHead>
                ))}
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-sm">{row.id}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.capacity}</TableCell>
                  <TableCell>{row.startLocation}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Empty state for development */}
        <div className="mt-8 text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Advanced Table Editor Coming Soon
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Phase 5 will bring the advanced table editor with click-to-edit cells, 
            column management, and VRP-specific validations.
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add First Row
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TableEditorPage