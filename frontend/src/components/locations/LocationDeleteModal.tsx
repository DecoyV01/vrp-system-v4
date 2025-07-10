import { useState, useEffect } from 'react'
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
import { 
  AlertTriangle, 
  MapPin, 
  Truck, 
  Package, 
  Route,
  Info
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface LocationDeleteModalProps {
  location: any
  isOpen: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
}

interface UsageAnalysis {
  vehicleCount: number
  jobCount: number
  shipmentCount: number
  canDelete: boolean
  warnings: string[]
}

export const LocationDeleteModal = ({
  location,
  isOpen,
  onConfirm,
  onCancel
}: LocationDeleteModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [usageAnalysis, setUsageAnalysis] = useState<UsageAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Mock function to analyze location usage
  const analyzeLocationUsage = async (locationId: string): Promise<UsageAnalysis> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock usage analysis (in real app, this would query the database)
    const mockUsage = {
      vehicleCount: Math.floor(Math.random() * 5),
      jobCount: Math.floor(Math.random() * 10),
      shipmentCount: Math.floor(Math.random() * 8),
      canDelete: true,
      warnings: []
    }
    
    // Add warnings based on usage
    if (mockUsage.vehicleCount > 0) {
      mockUsage.warnings.push(`${mockUsage.vehicleCount} vehicle${mockUsage.vehicleCount !== 1 ? 's' : ''} reference this location`)
      mockUsage.canDelete = false
    }
    
    if (mockUsage.jobCount > 0) {
      mockUsage.warnings.push(`${mockUsage.jobCount} job${mockUsage.jobCount !== 1 ? 's' : ''} reference this location`)
      mockUsage.canDelete = false
    }
    
    if (mockUsage.shipmentCount > 0) {
      mockUsage.warnings.push(`${mockUsage.shipmentCount} shipment${mockUsage.shipmentCount !== 1 ? 's' : ''} reference this location`)
      mockUsage.canDelete = false
    }
    
    return mockUsage
  }

  // Analyze usage when modal opens
  useEffect(() => {
    if (isOpen && location) {
      setIsAnalyzing(true)
      analyzeLocationUsage(location._id)
        .then(setUsageAnalysis)
        .catch(error => {
          console.error('Failed to analyze location usage:', error)
          setUsageAnalysis({
            vehicleCount: 0,
            jobCount: 0,
            shipmentCount: 0,
            canDelete: true,
            warnings: ['Failed to analyze usage. Proceed with caution.']
          })
        })
        .finally(() => setIsAnalyzing(false))
    }
  }, [isOpen, location])

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
    } catch (error) {
      console.error('Delete failed:', error)
      // Error handling is done in parent component
    } finally {
      setIsDeleting(false)
    }
  }

  if (!location) return null

  return (
    <Dialog open={isOpen} onOpenChange={() => !isDeleting && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Delete Location
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{location.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {/* Location Details */}
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{location.name}</h4>
                {location.address && (
                  <p className="text-xs text-gray-600 mt-1">{location.address}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {location.locationType && (
                    <Badge variant="outline" className="text-xs">
                      {location.locationType.replace('_', ' ')}
                    </Badge>
                  )}
                  {location.geocodeQuality && (
                    <Badge variant="secondary" className="text-xs">
                      {location.geocodeQuality}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Usage Analysis */}
          {isAnalyzing ? (
            <div className="flex items-center justify-center py-4">
              <LoadingSpinner className="w-5 h-5 mr-2" />
              <span className="text-sm text-gray-600">Analyzing location usage...</span>
            </div>
          ) : usageAnalysis ? (
            <div className="space-y-3">
              {/* Usage Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-blue-50 rounded">
                  <Truck className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <div className="text-sm font-medium">{usageAnalysis.vehicleCount}</div>
                  <div className="text-xs text-gray-600">Vehicles</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <Package className="w-4 h-4 text-green-600 mx-auto mb-1" />
                  <div className="text-sm font-medium">{usageAnalysis.jobCount}</div>
                  <div className="text-xs text-gray-600">Jobs</div>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded">
                  <Route className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                  <div className="text-sm font-medium">{usageAnalysis.shipmentCount}</div>
                  <div className="text-xs text-gray-600">Shipments</div>
                </div>
              </div>

              {/* Warnings */}
              {usageAnalysis.warnings.length > 0 && (
                <Alert variant={usageAnalysis.canDelete ? "default" : "destructive"}>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {usageAnalysis.warnings.map((warning, index) => (
                        <div key={index} className="text-sm">• {warning}</div>
                      ))}
                    </div>
                    {!usageAnalysis.canDelete && (
                      <div className="mt-2 text-sm font-medium">
                        You must remove these references before deleting the location.
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {usageAnalysis.canDelete && usageAnalysis.warnings.length === 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This location is not referenced by any vehicles, jobs, or shipments. 
                    It's safe to delete.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting || (usageAnalysis && !usageAnalysis.canDelete)}
          >
            {isDeleting ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Deleting...
              </>
            ) : (
              'Delete Location'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}