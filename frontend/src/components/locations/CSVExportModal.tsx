import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  Download, 
  FileText, 
  CheckCircle,
  Info
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Papa from 'papaparse'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface CSVExportModalProps {
  isOpen: boolean
  onClose: () => void
  locations: any[]
  selectedLocations: any[]
}

interface ExportOptions {
  scope: 'all' | 'selected'
  includeCoordinates: boolean
  includeUsageMetrics: boolean
  includeTimestamps: boolean
  includeOperationalData: boolean
  format: 'csv' | 'excel'
  filename: string
}

export const CSVExportModal = ({
  isOpen,
  onClose,
  locations,
  selectedLocations
}: CSVExportModalProps) => {
  const [options, setOptions] = useState<ExportOptions>({
    scope: selectedLocations.length > 0 ? 'selected' : 'all',
    includeCoordinates: true,
    includeUsageMetrics: false,
    includeTimestamps: false,
    includeOperationalData: true,
    format: 'csv',
    filename: `locations-export-${new Date().toISOString().split('T')[0]}`
  })
  const [isExporting, setIsExporting] = useState(false)
  const [exportComplete, setExportComplete] = useState(false)

  // Update option
  const updateOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }

  // Get data to export
  const getExportData = () => {
    return options.scope === 'selected' ? selectedLocations : locations
  }

  // Prepare data for export
  const prepareExportData = (data: any[]) => {
    return data.map(location => {
      const row: any = {
        name: location.name,
        description: location.description || '',
        location_type: location.locationType || '',
        address: location.address || '',
      }

      // Coordinates
      if (options.includeCoordinates) {
        row.latitude = location.locationLat || ''
        row.longitude = location.locationLon || ''
        row.geocode_quality = location.geocodeQuality || ''
        row.geocode_source = location.geocodeSource || ''
      }

      // Operational data
      if (options.includeOperationalData) {
        row.operating_hours = location.operatingHours || ''
        row.contact_info = location.contactInfo || ''
        row.timezone = location.timezone || ''
      }

      // Usage metrics
      if (options.includeUsageMetrics) {
        row.usage_count = location.usageCount || 0
        row.last_used_at = location.lastUsedAt ? new Date(location.lastUsedAt).toISOString() : ''
      }

      // Timestamps
      if (options.includeTimestamps) {
        row.created_at = new Date(location._creationTime).toISOString()
        row.updated_at = location.updatedAt ? new Date(location.updatedAt).toISOString() : ''
      }

      return row
    })
  }

  // Handle export
  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      const exportData = getExportData()
      if (exportData.length === 0) {
        toast.error('No locations to export')
        return
      }

      const preparedData = prepareExportData(exportData)
      
      // Generate CSV content
      const csv = Papa.unparse(preparedData, {
        header: true,
        skipEmptyLines: true
      })

      // Create and download file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `${options.filename}.${options.format}`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      
      setExportComplete(true)
      toast.success(`Exported ${exportData.length} location${exportData.length !== 1 ? 's' : ''} successfully`)
      
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export locations')
    } finally {
      setIsExporting(false)
    }
  }

  // Get preview of columns that will be exported
  const getExportColumns = () => {
    const columns = ['name', 'description', 'location_type', 'address']
    
    if (options.includeCoordinates) {
      columns.push('latitude', 'longitude', 'geocode_quality', 'geocode_source')
    }
    
    if (options.includeOperationalData) {
      columns.push('operating_hours', 'contact_info', 'timezone')
    }
    
    if (options.includeUsageMetrics) {
      columns.push('usage_count', 'last_used_at')
    }
    
    if (options.includeTimestamps) {
      columns.push('created_at', 'updated_at')
    }
    
    return columns
  }

  const exportData = getExportData()
  const exportColumns = getExportColumns()

  const handleClose = () => {
    if (!isExporting) {
      setExportComplete(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => !isExporting && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Locations
          </DialogTitle>
          <DialogDescription>
            Export location data to CSV format. Choose your export options below.
          </DialogDescription>
        </DialogHeader>

        {!exportComplete ? (
          <div className="space-y-6">
            {/* Export scope */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Export Scope</Label>
              <Select 
                value={options.scope} 
                onValueChange={(value: 'all' | 'selected') => updateOption('scope', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Locations ({locations.length} total)
                  </SelectItem>
                  <SelectItem 
                    value="selected" 
                    disabled={selectedLocations.length === 0}
                  >
                    Selected Locations ({selectedLocations.length} selected)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Data options */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Include Data</Label>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="coordinates"
                    checked={options.includeCoordinates}
                    onCheckedChange={(checked) => updateOption('includeCoordinates', checked as boolean)}
                  />
                  <Label htmlFor="coordinates" className="text-sm">
                    Coordinates and geocoding data
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="operational"
                    checked={options.includeOperationalData}
                    onCheckedChange={(checked) => updateOption('includeOperationalData', checked as boolean)}
                  />
                  <Label htmlFor="operational" className="text-sm">
                    Operational data (hours, contact info, timezone)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="usage"
                    checked={options.includeUsageMetrics}
                    onCheckedChange={(checked) => updateOption('includeUsageMetrics', checked as boolean)}
                  />
                  <Label htmlFor="usage" className="text-sm">
                    Usage metrics (usage count, last used)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="timestamps"
                    checked={options.includeTimestamps}
                    onCheckedChange={(checked) => updateOption('includeTimestamps', checked as boolean)}
                  />
                  <Label htmlFor="timestamps" className="text-sm">
                    Timestamps (created, updated)
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* File options */}
            <div className="space-y-3">
              <Label className="text-base font-medium">File Options</Label>
              
              <div>
                <Label htmlFor="filename" className="text-sm">Filename</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    id="filename"
                    type="text"
                    value={options.filename}
                    onChange={(e) => updateOption('filename', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Enter filename"
                  />
                  <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm">
                    .{options.format}
                  </div>
                </div>
              </div>
            </div>

            {/* Export preview */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Export Preview</h4>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Locations:</span> {exportData.length}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Columns:</span> {exportColumns.length}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {exportColumns.map(column => (
                    <Badge key={column} variant="outline" className="text-xs">
                      {column}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Warnings */}
            {exportData.length === 0 && (
              <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  No locations available for export. Please select locations or choose a different scope.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-medium mb-2">Export Complete</h3>
              <p className="text-gray-600">
                Successfully exported {exportData.length} location{exportData.length !== 1 ? 's' : ''} to {options.filename}.{options.format}
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg text-left">
              <h4 className="font-medium text-sm mb-2">Export Details:</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>File: {options.filename}.{options.format}</div>
                <div>Records: {exportData.length}</div>
                <div>Columns: {exportColumns.length}</div>
                <div>Generated: {new Date().toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {!exportComplete ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isExporting}>
                Cancel
              </Button>
              <Button 
                onClick={handleExport}
                disabled={isExporting || exportData.length === 0}
              >
                {isExporting ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export {exportData.length} Location{exportData.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleExport}>
                Export Again
              </Button>
              <Button onClick={handleClose}>
                Done
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}