import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
  Download,
  MapPin,
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { toast } from 'sonner'
import type { Id } from '../../../../../convex/_generated/dataModel'

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: () => void
  projectId: Id<'projects'>
  datasetId?: Id<'datasets'>
}

interface ParsedLocation {
  name: string
  address?: string
  description?: string
  locationLat?: number
  locationLon?: number
  locationType?: string
  operatingHours?: string
  contactInfo?: string
  timezone?: string
  geocodeQuality?: string
  errors: string[]
}

interface ImportStats {
  total: number
  valid: number
  invalid: number
  duplicates: number
}

export const CSVImportModal = ({
  isOpen,
  onClose,
  onImport,
  projectId,
  datasetId,
}: CSVImportModalProps) => {
  const [step, setStep] = useState<
    'upload' | 'preview' | 'processing' | 'complete'
  >('upload')
  const [csvData, setCsvData] = useState<any[]>([])
  const [parsedLocations, setParsedLocations] = useState<ParsedLocation[]>([])
  const [importStats, setImportStats] = useState<ImportStats>({
    total: 0,
    valid: 0,
    invalid: 0,
    duplicates: 0,
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [processProgress, setProcessProgress] = useState(0)
  const [importResults, setImportResults] = useState<{
    success: number
    failed: number
    errors: string[]
  } | null>(null)

  // Handle file drop/upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }

    Papa.parse(file, {
      complete: results => {
        if (results.errors.length > 0) {
          toast.error('Failed to parse CSV file')
          console.error('CSV parse errors:', results.errors)
          return
        }

        setCsvData(results.data as any[])
        parseAndValidateLocations(results.data as any[])
        setStep('preview')
      },
      header: true,
      skipEmptyLines: true,
      transformHeader: header =>
        header.trim().toLowerCase().replace(/\s+/g, '_'),
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
  })

  // Parse and validate locations from CSV data
  const parseAndValidateLocations = (data: any[]) => {
    const locations: ParsedLocation[] = []
    const stats: ImportStats = {
      total: data.length,
      valid: 0,
      invalid: 0,
      duplicates: 0,
    }

    data.forEach((row, index) => {
      const location: ParsedLocation = {
        name: row.name || row.location_name || '',
        address: row.address || '',
        description: row.description || '',
        locationType: row.location_type || row.type || 'customer',
        operatingHours: row.operating_hours || row.hours || '',
        contactInfo: row.contact_info || row.contact || '',
        timezone: row.timezone || '',
        errors: [],
      }

      // Validate required fields
      if (!location.name.trim()) {
        location.errors.push('Location name is required')
      }

      // Parse coordinates
      if (row.latitude || row.lat) {
        const lat = parseFloat(row.latitude || row.lat)
        if (!isNaN(lat) && lat >= -90 && lat <= 90) {
          location.locationLat = lat
        } else {
          location.errors.push('Invalid latitude value')
        }
      }

      if (row.longitude || row.lon || row.lng) {
        const lon = parseFloat(row.longitude || row.lon || row.lng)
        if (!isNaN(lon) && lon >= -180 && lon <= 180) {
          location.locationLon = lon
        } else {
          location.errors.push('Invalid longitude value')
        }
      }

      // Set geocode quality
      if (location.locationLat && location.locationLon) {
        location.geocodeQuality = 'manual'
      }

      // Validate location type
      const validTypes = [
        'depot',
        'customer',
        'warehouse',
        'distribution_center',
        'pickup_point',
        'delivery_point',
      ]
      if (
        location.locationType &&
        !validTypes.includes(location.locationType)
      ) {
        location.errors.push(`Invalid location type: ${location.locationType}`)
      }

      // Count as valid if no errors
      if (location.errors.length === 0) {
        stats.valid++
      } else {
        stats.invalid++
      }

      locations.push(location)
    })

    // Check for duplicates by name
    const nameMap = new Map<string, number>()
    locations.forEach(location => {
      const name = location.name.toLowerCase().trim()
      if (nameMap.has(name)) {
        const count = nameMap.get(name)! + 1
        nameMap.set(name, count)
        if (count === 2) {
          stats.duplicates += 2 // Count both original and duplicate
        } else {
          stats.duplicates++
        }
        location.errors.push(`Duplicate name: ${location.name}`)
      } else {
        nameMap.set(name, 1)
      }
    })

    setParsedLocations(locations)
    setImportStats(stats)
  }

  // Handle import process
  const handleImport = async () => {
    const validLocations = parsedLocations.filter(
      loc => loc.errors.length === 0
    )

    if (validLocations.length === 0) {
      toast.error('No valid locations to import')
      return
    }

    setStep('processing')
    setIsProcessing(true)
    setProcessProgress(0)

    try {
      let successCount = 0
      let failedCount = 0
      const errors: string[] = []

      // Process locations in batches
      for (let i = 0; i < validLocations.length; i++) {
        const location = validLocations[i]

        try {
          // Mock location creation (in real app, this would call the create mutation)
          await new Promise(resolve => setTimeout(resolve, 100)) // Simulate API call

          successCount++
        } catch (error) {
          failedCount++
          errors.push(
            `Failed to create ${location.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }

        // Update progress
        setProcessProgress(Math.round(((i + 1) / validLocations.length) * 100))
      }

      setImportResults({ success: successCount, failed: failedCount, errors })
      setStep('complete')

      if (successCount > 0) {
        toast.success(
          `Successfully imported ${successCount} location${successCount !== 1 ? 's' : ''}`
        )
      }

      if (failedCount > 0) {
        toast.error(
          `Failed to import ${failedCount} location${failedCount !== 1 ? 's' : ''}`
        )
      }
    } catch (error) {
      console.error('Import process failed:', error)
      toast.error('Import process failed')
      setStep('preview')
    } finally {
      setIsProcessing(false)
    }
  }

  // Download template CSV
  const downloadTemplate = () => {
    const template = [
      {
        name: 'Example Depot',
        address: '123 Main St, San Francisco, CA 94105',
        description: 'Main distribution center',
        latitude: '37.7749',
        longitude: '-122.4194',
        location_type: 'depot',
        operating_hours: 'Mon-Fri 8:00-18:00',
        contact_info: 'depot@example.com',
        timezone: 'America/Los_Angeles',
      },
      {
        name: 'Customer Location A',
        address: '456 Oak Ave, San Francisco, CA 94102',
        description: 'Regular customer',
        latitude: '37.7849',
        longitude: '-122.4094',
        location_type: 'customer',
        operating_hours: 'Mon-Fri 9:00-17:00',
        contact_info: '(555) 123-4567',
        timezone: 'America/Los_Angeles',
      },
    ]

    const csv = Papa.unparse(template)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'locations-template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleClose = () => {
    if (!isProcessing) {
      setStep('upload')
      setCsvData([])
      setParsedLocations([])
      setImportStats({ total: 0, valid: 0, invalid: 0, duplicates: 0 })
      setImportResults(null)
      setProcessProgress(0)
      onClose()
    }
  }

  const handleComplete = () => {
    handleClose()
    onImport()
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => !isProcessing && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Locations from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import locations.
            {step === 'upload' &&
              'Download the template for the correct format.'}
            {step === 'preview' && 'Review the parsed data before importing.'}
            {step === 'processing' && 'Processing your locations...'}
            {step === 'complete' && 'Import completed!'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            {/* Download template */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm">Need a template?</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Download our CSV template with example data and correct
                    column headers.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>

            {/* File upload area */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              {isDragActive ? (
                <p className="text-lg font-medium text-primary">
                  Drop the CSV file here...
                </p>
              ) : (
                <>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drag & drop a CSV file here, or click to select
                  </p>
                  <p className="text-sm text-gray-600">
                    Supports .csv files with location data
                  </p>
                </>
              )}
            </div>

            {/* Expected columns */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">
                Expected CSV Columns:
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-medium">name*</span> - Location name
                  (required)
                </div>
                <div>
                  <span className="font-medium">address</span> - Street address
                </div>
                <div>
                  <span className="font-medium">latitude</span> - Latitude
                  coordinate
                </div>
                <div>
                  <span className="font-medium">longitude</span> - Longitude
                  coordinate
                </div>
                <div>
                  <span className="font-medium">location_type</span> - Type
                  (depot, customer, etc.)
                </div>
                <div>
                  <span className="font-medium">description</span> - Description
                </div>
                <div>
                  <span className="font-medium">operating_hours</span> -
                  Operating hours
                </div>
                <div>
                  <span className="font-medium">contact_info</span> - Contact
                  information
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">* Required field</p>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            {/* Import statistics */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded">
                <div className="text-2xl font-bold text-foreground">
                  {importStats.total}
                </div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">
                  {importStats.valid}
                </div>
                <div className="text-xs text-gray-600">Valid</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded">
                <div className="text-2xl font-bold text-red-600">
                  {importStats.invalid}
                </div>
                <div className="text-xs text-gray-600">Invalid</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded">
                <div className="text-2xl font-bold text-yellow-600">
                  {importStats.duplicates}
                </div>
                <div className="text-xs text-gray-600">Duplicates</div>
              </div>
            </div>

            {/* Preview table */}
            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 border-b">Status</th>
                    <th className="text-left p-3 border-b">Name</th>
                    <th className="text-left p-3 border-b">Address</th>
                    <th className="text-left p-3 border-b">Type</th>
                    <th className="text-left p-3 border-b">Coordinates</th>
                    <th className="text-left p-3 border-b">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedLocations.map((location, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3">
                        {location.errors.length === 0 ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </td>
                      <td className="p-3 font-medium">
                        {location.name || 'Missing name'}
                      </td>
                      <td className="p-3 text-gray-600 max-w-48 truncate">
                        {location.address || 'No address'}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">
                          {location.locationType}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {location.locationLat && location.locationLon
                          ? `${location.locationLat.toFixed(4)}, ${location.locationLon.toFixed(4)}`
                          : 'No coordinates'}
                      </td>
                      <td className="p-3">
                        {location.errors.length > 0 && (
                          <div className="space-y-1">
                            {location.errors.map((error, errorIndex) => (
                              <div
                                key={errorIndex}
                                className="text-xs text-red-600"
                              >
                                {error}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Importing Locations</h3>
              <p className="text-gray-600 mb-4">
                Processing {importStats.valid} valid location
                {importStats.valid !== 1 ? 's' : ''}...
              </p>
              <Progress
                value={processProgress}
                className="w-full max-w-md mx-auto"
              />
              <p className="text-sm text-gray-500 mt-2">
                {processProgress}% complete
              </p>
            </div>
          </div>
        )}

        {step === 'complete' && importResults && (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Import Complete</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {importResults.success}
                </div>
                <div className="text-sm text-gray-600">
                  Successfully Imported
                </div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {importResults.failed}
                </div>
                <div className="text-sm text-gray-600">Failed to Import</div>
              </div>
            </div>

            {importResults.errors.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-sm text-red-800 mb-2">
                  Import Errors:
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {importResults.errors.map((error, index) => (
                    <div key={index} className="text-xs text-red-700">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 'upload' && <Button onClick={handleClose}>Cancel</Button>}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={importStats.valid === 0}>
                Import {importStats.valid} Location
                {importStats.valid !== 1 ? 's' : ''}
              </Button>
            </>
          )}

          {step === 'processing' && (
            <Button disabled>
              <LoadingSpinner className="w-4 h-4 mr-2" />
              Processing...
            </Button>
          )}

          {step === 'complete' && (
            <Button onClick={handleComplete}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
