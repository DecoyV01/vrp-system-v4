import { useState } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  Download, 
  Settings, 
  Columns, 
  Filter,
  Database,
  FileSpreadsheet,
  Braces
} from 'lucide-react'
import type { BulkExportOptions } from '../types/bulk-export.types'

interface ExportOptionsFormProps {
  options: BulkExportOptions
  onOptionsChange: (options: BulkExportOptions) => void
  availableColumns: string[]
  selectedRowsCount: number
  totalRowsCount: number
  filteredRowsCount: number
  onStartExport: () => void
  isExporting: boolean
  className?: string
}

export function ExportOptionsForm({
  options,
  onOptionsChange,
  availableColumns,
  selectedRowsCount,
  totalRowsCount,
  filteredRowsCount,
  onStartExport,
  isExporting,
  className
}: ExportOptionsFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleScopeChange = (scope: 'all' | 'filtered' | 'selected') => {
    onOptionsChange({ ...options, scope })
  }

  const handleFormatChange = (format: 'csv' | 'excel' | 'json') => {
    onOptionsChange({ ...options, format })
  }

  const handleColumnToggle = (column: string, checked: boolean) => {
    const selectedColumns = checked
      ? [...options.selectedColumns, column]
      : options.selectedColumns.filter(col => col !== column)
    
    onOptionsChange({ ...options, selectedColumns })
  }

  const handleSelectAllColumns = () => {
    onOptionsChange({ ...options, selectedColumns: availableColumns })
  }

  const handleDeselectAllColumns = () => {
    onOptionsChange({ ...options, selectedColumns: [] })
  }

  const getScopeRowCount = () => {
    switch (options.scope) {
      case 'all': return totalRowsCount
      case 'filtered': return filteredRowsCount
      case 'selected': return selectedRowsCount
      default: return 0
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv': return <FileText className="h-4 w-4" />
      case 'excel': return <FileSpreadsheet className="h-4 w-4" />
      case 'json': return <Braces className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Export Scope */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Export Scope</CardTitle>
          </div>
          <CardDescription>
            Choose which records to include in the export
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                options.scope === 'all' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-muted-foreground/50'
              }`}
              onClick={() => handleScopeChange('all')}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">All Records</span>
                <Badge variant="outline">{totalRowsCount}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Export all records in the table
              </p>
            </div>

            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                options.scope === 'filtered' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-muted-foreground/50'
              }`}
              onClick={() => handleScopeChange('filtered')}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Filtered Records</span>
                <Badge variant="outline">{filteredRowsCount}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Export only filtered records
              </p>
            </div>

            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                options.scope === 'selected' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-muted-foreground/50'
              } ${selectedRowsCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => selectedRowsCount > 0 && handleScopeChange('selected')}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Selected Records</span>
                <Badge variant="outline">{selectedRowsCount}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Export only selected records
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Format */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Export Format</CardTitle>
          </div>
          <CardDescription>
            Choose the output format for your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                options.format === 'csv' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-muted-foreground/50'
              }`}
              onClick={() => handleFormatChange('csv')}
            >
              <div className="flex items-center gap-2 mb-2">
                {getFormatIcon('csv')}
                <span className="font-medium">CSV</span>
                <Badge variant="secondary">Standard</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Comma-separated values, universal format
              </p>
            </div>

            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                options.format === 'excel' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-muted-foreground/50'
              }`}
              onClick={() => handleFormatChange('excel')}
            >
              <div className="flex items-center gap-2 mb-2">
                {getFormatIcon('excel')}
                <span className="font-medium">Excel CSV</span>
                <Badge variant="secondary">Formatted</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Excel-compatible with formatted dates
              </p>
            </div>

            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                options.format === 'json' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-muted-foreground/50'
              }`}
              onClick={() => handleFormatChange('json')}
            >
              <div className="flex items-center gap-2 mb-2">
                {getFormatIcon('json')}
                <span className="font-medium">JSON</span>
                <Badge variant="secondary">Structured</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                JavaScript Object Notation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>Advanced Options</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </Button>
          </div>
          <CardDescription>
            Customize the export behavior and output
          </CardDescription>
        </CardHeader>
        {showAdvanced && (
          <CardContent>
            <div className="space-y-6">
              {/* Filename */}
              <div className="space-y-2">
                <Label htmlFor="filename">Custom Filename</Label>
                <Input
                  id="filename"
                  placeholder="Leave empty for auto-generated filename"
                  value={options.filename || ''}
                  onChange={(e) => onOptionsChange({ ...options, filename: e.target.value })}
                />
              </div>

              {/* System Fields */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="include-system-fields">Include System Fields</Label>
                    <p className="text-sm text-muted-foreground">
                      Include _creationTime and updatedAt fields
                    </p>
                  </div>
                  <Switch
                    id="include-system-fields"
                    checked={options.includeSystemFields}
                    onCheckedChange={(checked) => 
                      onOptionsChange({ ...options, includeSystemFields: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="include-convex-ids">Include Convex IDs</Label>
                    <p className="text-sm text-muted-foreground">
                      Include internal _id fields
                    </p>
                  </div>
                  <Switch
                    id="include-convex-ids"
                    checked={options.includeConvexIds}
                    onCheckedChange={(checked) => 
                      onOptionsChange({ ...options, includeConvexIds: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="compression">Enable Compression</Label>
                    <p className="text-sm text-muted-foreground">
                      Compress large exports (ZIP format)
                    </p>
                  </div>
                  <Switch
                    id="compression"
                    checked={options.compression}
                    onCheckedChange={(checked) => 
                      onOptionsChange({ ...options, compression: checked })
                    }
                  />
                </div>
              </div>

              {/* Column Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Columns className="h-4 w-4" />
                    <Label>Column Selection</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleSelectAllColumns}
                    >
                      Select All
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleDeselectAllColumns}
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {availableColumns.map((column) => (
                    <div key={column} className="flex items-center space-x-2">
                      <Checkbox
                        id={`column-${column}`}
                        checked={options.selectedColumns.length === 0 || options.selectedColumns.includes(column)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            // If currently all columns are selected (selectedColumns is empty), initialize with all columns first
                            if (options.selectedColumns.length === 0) {
                              const allExceptThis = availableColumns.filter(col => col !== column)
                              onOptionsChange({ ...options, selectedColumns: [...allExceptThis, column] })
                            } else {
                              // Add this column
                              handleColumnToggle(column, true)
                            }
                          } else {
                            // If currently all columns are selected (selectedColumns is empty), initialize with all except this one
                            if (options.selectedColumns.length === 0) {
                              const allExceptThis = availableColumns.filter(col => col !== column)
                              onOptionsChange({ ...options, selectedColumns: allExceptThis })
                            } else {
                              // Remove this column
                              handleColumnToggle(column, false)
                            }
                          }
                        }}
                      />
                      <Label 
                        htmlFor={`column-${column}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {column}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Export Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>Export Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Records:</span>
              <span className="ml-2 font-semibold">{getScopeRowCount()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Format:</span>
              <span className="ml-2 font-semibold">{options.format.toUpperCase()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Columns:</span>
              <span className="ml-2 font-semibold">
                {options.selectedColumns.length === 0 ? availableColumns.length : options.selectedColumns.length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Size:</span>
              <span className="ml-2 font-semibold">~{Math.round(getScopeRowCount() * 100 / 1024)}KB</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Ready to export {getScopeRowCount()} records
        </div>
        <Button 
          onClick={onStartExport}
          disabled={isExporting || getScopeRowCount() === 0}
          className="gap-2"
        >
          {isExporting ? (
            <>Exporting...</>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Start Export
            </>
          )}
        </Button>
      </div>
    </div>
  )
}