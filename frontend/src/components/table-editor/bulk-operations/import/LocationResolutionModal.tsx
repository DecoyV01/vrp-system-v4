import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  MapPin, 
  Navigation,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  Target,
  ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import type { 
  LocationResolution,
  LocationMatch,
  LocationImportOptions
} from '../types/shared.types'

interface LocationResolutionModalProps {
  isOpen: boolean
  onClose: () => void
  resolutions: LocationResolution[]
  existingLocations: any[]
  importOptions: LocationImportOptions
  onResolutionUpdate: (resolutions: LocationResolution[]) => void
  onCreateLocation?: (locationData: any) => Promise<string>
  className?: string
}

export function LocationResolutionModal({
  isOpen,
  onClose,
  resolutions,
  existingLocations,
  importOptions,
  onResolutionUpdate,
  onCreateLocation,
  className
}: LocationResolutionModalProps) {
  const [currentResolutionIndex, setCurrentResolutionIndex] = useState(0)
  const [isCreatingLocation, setIsCreatingLocation] = useState(false)
  const [newLocationData, setNewLocationData] = useState({
    name: '',
    address: '',
    locationLat: '',
    locationLon: '',
    locationType: 'customer'
  })

  const currentResolution = resolutions[currentResolutionIndex]
  const hasUnresolvedConflicts = resolutions.some(r => r.resolution === 'manual_select')

  // Get resolution statistics
  const stats = useMemo(() => {
    const total = resolutions.length
    const resolved = resolutions.filter(r => 
      r.resolution === 'use_existing' || 
      r.resolution === 'create_new' || 
      r.resolution === 'skip'
    ).length
    const needsAttention = resolutions.filter(r => r.resolution === 'manual_select').length
    
    return { total, resolved, needsAttention }
  }, [resolutions])

  // Update current resolution
  const updateCurrentResolution = (updates: Partial<LocationResolution>) => {
    const updatedResolutions = resolutions.map((resolution, index) => 
      index === currentResolutionIndex ? { ...resolution, ...updates } : resolution
    )
    onResolutionUpdate(updatedResolutions)
  }

  // Handle location selection
  const handleLocationSelect = (locationId: string) => {
    updateCurrentResolution({
      resolution: 'use_existing',
      selectedLocationId: locationId
    })
  }

  // Handle create new location
  const handleCreateNew = () => {
    const sourceData = currentResolution
    setNewLocationData({
      name: sourceData.sourceAddress?.split(',')[0] || `Location ${currentResolution.importRowIndex + 1}`,
      address: sourceData.sourceAddress || '',
      locationLat: sourceData.sourceCoordinates?.[1]?.toString() || '',
      locationLon: sourceData.sourceCoordinates?.[0]?.toString() || '',
      locationType: 'customer'
    })
    
    updateCurrentResolution({
      resolution: 'create_new',
      newLocationData: {
        name: newLocationData.name,
        address: newLocationData.address,
        coordinates: sourceData.sourceCoordinates
      }
    })
  }

  // Handle skip
  const handleSkip = () => {
    updateCurrentResolution({
      resolution: 'skip'
    })
  }

  // Navigate between resolutions
  const navigateResolution = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentResolutionIndex > 0) {
      setCurrentResolutionIndex(currentResolutionIndex - 1)
    } else if (direction === 'next' && currentResolutionIndex < resolutions.length - 1) {
      setCurrentResolutionIndex(currentResolutionIndex + 1)
    }
  }

  // Auto-resolve all with default strategy
  const autoResolveAll = () => {
    const updatedResolutions = resolutions.map(resolution => {
      if (resolution.resolution === 'manual_select') {
        // Use best match if confidence > 0.8
        const bestMatch = resolution.matches[0]
        if (bestMatch && bestMatch.confidence > 0.8) {
          return {
            ...resolution,
            resolution: 'use_existing' as const,
            selectedLocationId: bestMatch.id
          }
        } else {
          // Create new location
          return {
            ...resolution,
            resolution: 'create_new' as const,
            newLocationData: {
              name: resolution.sourceAddress?.split(',')[0] || `Location ${resolution.importRowIndex + 1}`,
              address: resolution.sourceAddress,
              coordinates: resolution.sourceCoordinates
            }
          }
        }
      }
      return resolution
    })
    
    onResolutionUpdate(updatedResolutions)
    toast.success('Auto-resolved all location conflicts')
  }

  // Get confidence badge color
  const getConfidenceBadgeVariant = (confidence: number) => {
    if (confidence >= 0.9) return 'default'
    if (confidence >= 0.7) return 'secondary'
    return 'outline'
  }

  // Format confidence percentage
  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`
  }

  if (!currentResolution) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-5xl max-h-[95vh] overflow-hidden flex flex-col ${className}`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Resolve Location Conflicts</DialogTitle>
              <DialogDescription>
                Review and resolve location matching conflicts for import
              </DialogDescription>
            </div>
            <Badge variant="outline">
              {currentResolutionIndex + 1} of {resolutions.length}
            </Badge>
          </div>
        </DialogHeader>

        {/* Progress Summary */}
        <div className="grid grid-cols-3 gap-4 py-4 border-b">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                <div className="text-sm text-muted-foreground">Resolved</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.needsAttention}</div>
                <div className="text-sm text-muted-foreground">Need Attention</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Conflicts</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Resolution Content */}
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Source Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Import Data (Row {currentResolution.importRowIndex + 1})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {currentResolution.sourceAddress && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm"><strong>Address:</strong> {currentResolution.sourceAddress}</span>
                </div>
              )}
              {currentResolution.sourceCoordinates && (
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">
                    <strong>Coordinates:</strong> {currentResolution.sourceCoordinates[1].toFixed(6)}, {currentResolution.sourceCoordinates[0].toFixed(6)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resolution Options */}
          <Tabs value={currentResolution.resolution} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger 
                value="use_existing"
                onClick={() => updateCurrentResolution({ resolution: 'use_existing' })}
                disabled={currentResolution.matches.length === 0}
              >
                Use Existing
              </TabsTrigger>
              <TabsTrigger 
                value="create_new"
                onClick={() => handleCreateNew()}
              >
                Create New
              </TabsTrigger>
              <TabsTrigger 
                value="skip"
                onClick={() => handleSkip()}
              >
                Skip
              </TabsTrigger>
              <TabsTrigger 
                value="manual_select"
                onClick={() => updateCurrentResolution({ resolution: 'manual_select' })}
                disabled={currentResolution.matches.length === 0}
              >
                Manual Select
              </TabsTrigger>
            </TabsList>

            {/* Use Existing Tab */}
            <TabsContent value="use_existing" className="space-y-4">
              {currentResolution.matches.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium">Select existing location:</h4>
                  {currentResolution.matches.slice(0, 5).map((match) => (
                    <Card 
                      key={match.id}
                      className={`cursor-pointer transition-colors ${
                        currentResolution.selectedLocationId === match.id 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleLocationSelect(match.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="font-medium">{match.name}</div>
                            {match.address && (
                              <div className="text-sm text-muted-foreground">{match.address}</div>
                            )}
                            {match.coordinates && (
                              <div className="text-xs text-muted-foreground font-mono">
                                {match.coordinates[1].toFixed(6)}, {match.coordinates[0].toFixed(6)}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getConfidenceBadgeVariant(match.confidence)}>
                              {formatConfidence(match.confidence)} {match.matchType}
                            </Badge>
                            {match.distance !== undefined && (
                              <Badge variant="outline" className="text-xs">
                                {match.distance.toFixed(1)}km
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No existing locations found that match the import data.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Create New Tab */}
            <TabsContent value="create_new" className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium">Create new location:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newLocationName">Name *</Label>
                    <Input
                      id="newLocationName"
                      value={newLocationData.name}
                      onChange={(e) => setNewLocationData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Location name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newLocationType">Type</Label>
                    <Select 
                      value={newLocationData.locationType} 
                      onValueChange={(value) => setNewLocationData(prev => ({ ...prev, locationType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="depot">Depot</SelectItem>
                        <SelectItem value="warehouse">Warehouse</SelectItem>
                        <SelectItem value="distribution_center">Distribution Center</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="newLocationAddress">Address</Label>
                  <Input
                    id="newLocationAddress"
                    value={newLocationData.address}
                    onChange={(e) => setNewLocationData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Street address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newLocationLat">Latitude</Label>
                    <Input
                      id="newLocationLat"
                      value={newLocationData.locationLat}
                      onChange={(e) => setNewLocationData(prev => ({ ...prev, locationLat: e.target.value }))}
                      placeholder="37.7749"
                      type="number"
                      step="any"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newLocationLon">Longitude</Label>
                    <Input
                      id="newLocationLon"
                      value={newLocationData.locationLon}
                      onChange={(e) => setNewLocationData(prev => ({ ...prev, locationLon: e.target.value }))}
                      placeholder="-122.4194"
                      type="number"
                      step="any"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Skip Tab */}
            <TabsContent value="skip" className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This row will be skipped during import. No location data will be processed for this record.
                </AlertDescription>
              </Alert>
            </TabsContent>

            {/* Manual Select Tab */}
            <TabsContent value="manual_select" className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Manual selection required. Please choose one of the other resolution options.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </div>

        {/* Navigation and Actions */}
        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {stats.needsAttention > 0 && (
                <Button variant="outline" onClick={autoResolveAll}>
                  Auto-Resolve All
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigateResolution('prev')}
                disabled={currentResolutionIndex === 0}
              >
                Previous
              </Button>
              
              {currentResolutionIndex < resolutions.length - 1 ? (
                <Button
                  onClick={() => navigateResolution('next')}
                  disabled={currentResolution.resolution === 'manual_select'}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={onClose}
                  disabled={hasUnresolvedConflicts}
                >
                  {hasUnresolvedConflicts ? (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Resolve All Conflicts
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Complete Resolution
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}