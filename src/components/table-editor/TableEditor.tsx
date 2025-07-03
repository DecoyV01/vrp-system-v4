import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Edit2 } from 'lucide-react'

interface TableEditorProps {
  datasetId: string
  tableType: 'vehicles' | 'jobs' | 'locations' | 'routes'
}

interface TableRow {
  id: string
  [key: string]: string | number | boolean | undefined
}

const TableEditor = ({ datasetId: _datasetId, tableType }: TableEditorProps) => {
  const [data, setData] = useState<TableRow[]>([])
  const [editingCell, setEditingCell] = useState<{row: number, col: string} | null>(null)
  const [editValue, setEditValue] = useState('')

  // Mock column definitions based on table type
  const getColumns = () => {
    switch (tableType) {
      case 'vehicles':
        return ['vehicleId', 'capacity', 'startLocation', 'endLocation']
      case 'jobs':
        return ['jobId', 'locationId', 'serviceTime', 'timeWindowStart', 'timeWindowEnd']
      case 'locations':
        return ['locationId', 'latitude', 'longitude', 'address', 'city']
      case 'routes':
        return ['vehicleId', 'jobId', 'sequence', 'arrivalTime', 'departureTime']
      default:
        return ['id', 'name', 'value']
    }
  }

  const columns = getColumns()

  const handleCellClick = (rowIndex: number, colKey: string, currentValue: string | number | boolean | undefined) => {
    setEditingCell({ row: rowIndex, col: colKey })
    setEditValue(String(currentValue || ''))
  }

  const handleCellSave = () => {
    if (editingCell) {
      const newData = [...data]
      if (newData[editingCell.row]) {
        newData[editingCell.row][editingCell.col] = editValue
        setData(newData)
      }
      setEditingCell(null)
      setEditValue('')
    }
  }

  const handleCellCancel = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const addRow = () => {
    const newRow: TableRow = { id: Date.now().toString() }
    columns.forEach(col => {
      newRow[col] = ''
    })
    setData([...data, newRow])
  }

  const deleteRow = (index: number) => {
    const newData = data.filter((_, i) => i !== index)
    setData(newData)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold capitalize">{tableType} Data</h3>
        <Button onClick={addRow} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Row
        </Button>
      </div>

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
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">
                  No data yet. Click "Add Row" to get started.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => (
                <TableRow key={row.id}>
                  {columns.map((column) => (
                    <TableCell key={column} className="relative">
                      {editingCell?.row === rowIndex && editingCell?.col === column ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCellSave()
                              if (e.key === 'Escape') handleCellCancel()
                            }}
                            onBlur={handleCellSave}
                            autoFocus
                            className="h-8"
                          />
                        </div>
                      ) : (
                        <div
                          onClick={() => handleCellClick(rowIndex, column, row[column])}
                          className="min-h-[32px] flex items-center cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2"
                        >
                          {row[column] || (
                            <span className="text-muted-foreground italic">Click to edit</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRow(rowIndex)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Edit2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Start Building Your {tableType} Data
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Add rows and click on cells to edit them. This table will support advanced
            features like validation and real-time sync in Phase 5.
          </p>
          <Button onClick={addRow}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Row
          </Button>
        </div>
      )}
    </div>
  )
}

export default TableEditor