import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  MapPin,
  Search,
  Navigation,
  AlertTriangle,
  CheckCircle,
  Target,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getGeocodingService,
  GeocodingResult,
  VRPErrorHandling,
} from '@/utils/errorHandling'

interface LocationFormProps {
  mode: 'create' | 'edit'
  location?: any
  onSave: (locationData: any) => Promise<void>
  onCancel: () => void
  initialCoordinates?: [number, number]
  initialAddress?: string
}

export const LocationForm = ({
  mode,
  location,
  onSave,
  onCancel,
  initialCoordinates,
  initialAddress,
}: LocationFormProps) => {
  const [formData, setFormData] = useState({
    name: location?.name || '',
    address: location?.address || initialAddress || '',
    description: location?.description || '',
    locationLat: location?.locationLat || initialCoordinates?.[1] || '',
    locationLon: location?.locationLon || initialCoordinates?.[0] || '',
    locationType: location?.locationType || 'customer',
    operatingHours: location?.operatingHours || '',
    contactInfo: location?.contactInfo || '',
    timezone: location?.timezone || '',
  })

  const [isGeocoding, setIsGeocoding] = useState(false)
  const [geocodeResult, setGeocodeResult] = useState<GeocodingResult | null>(
    null
  )
  const [geocodeError, setGeocodeError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCoordinatePicker, setShowCoordinatePicker] = useState(false)

  // Handle form field changes
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear geocode results when address changes
    if (field === 'address') {
      setGeocodeResult(null)
      setGeocodeError(null)
    }
  }

  // Handle geocoding using real Mapbox API
  const handleGeocode = async () => {
    if (!formData.address.trim()) {
      toast.error('Please enter an address to geocode')
      return
    }

    setIsGeocoding(true)
    setGeocodeError(null)

    try {
      const geocodingService = getGeocodingService()
      const result = await geocodingService.geocodeAddress(formData.address)
      setGeocodeResult(result)
      setFormData(prev => ({
        ...prev,
        locationLat: result.coordinates[1].toString(),
        locationLon: result.coordinates[0].toString(),
        address: result.address, // Use formatted address from geocoder
      }))
      toast.success(`Address geocoded with ${result.confidence} confidence`)
    } catch (error) {
      const errorMessage = VRPErrorHandling.geocoding.forward(error)
      setGeocodeError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsGeocoding(false)
    }
  }

  // Handle reverse geocoding when coordinates change
  const handleReverseGeocode = async () => {
    const lat = parseFloat(formData.locationLat as string)
    const lon = parseFloat(formData.locationLon as string)

    if (!lat || !lon) {
      toast.error('Please enter valid coordinates')
      return
    }

    setIsGeocoding(true)

    try {
      const geocodingService = getGeocodingService()
      const result = await geocodingService.reverseGeocode(lat, lon)

      setFormData(prev => ({ ...prev, address: result.address }))
      setGeocodeResult(result)
      toast.success('Address found for coordinates')
    } catch (error) {
      const errorMessage = VRPErrorHandling.geocoding.reverse(error)
      toast.error(errorMessage)
    } finally {
      setIsGeocoding(false)
    }
  }

  // Validate coordinates
  const validateCoordinates = (lat: string, lon: string) => {
    const latNum = parseFloat(lat)
    const lonNum = parseFloat(lon)

    if (isNaN(latNum) || isNaN(lonNum)) {
      return 'Coordinates must be valid numbers'
    }

    if (latNum < -90 || latNum > 90) {
      return 'Latitude must be between -90 and 90'
    }

    if (lonNum < -180 || lonNum > 180) {
      return 'Longitude must be between -180 and 180'
    }

    return null
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Location name is required')
      return
    }

    // Validate coordinates if provided
    if (formData.locationLat && formData.locationLon) {
      const coordError = validateCoordinates(
        formData.locationLat as string,
        formData.locationLon as string
      )
      if (coordError) {
        toast.error(coordError)
        return
      }
    }

    setIsSubmitting(true)

    try {
      const submitData = {
        ...formData,
        locationLat: formData.locationLat
          ? parseFloat(formData.locationLat as string)
          : undefined,
        locationLon: formData.locationLon
          ? parseFloat(formData.locationLon as string)
          : undefined,
        geocodeQuality:
          geocodeResult?.confidence ||
          (formData.locationLat && formData.locationLon ? 'manual' : undefined),
        geocodeSource: geocodeResult ? 'mapbox' : 'manual',
        geocodeTimestamp: geocodeResult ? Date.now() : undefined,
      }

      await onSave(submitData)
    } catch (error) {
      console.error('Failed to save location:', error)
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  const coordinateError =
    formData.locationLat && formData.locationLon
      ? validateCoordinates(
          formData.locationLat as string,
          formData.locationLon as string
        )
      : null

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Location' : 'Edit Location'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new location to your project. You can enter an address to automatically geocode coordinates.'
              : 'Update the location details. Changes will be saved immediately.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Location Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="Enter location name"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="locationType">Location Type</Label>
              <Select
                value={formData.locationType}
                onValueChange={value => handleChange('locationType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="depot">Depot</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="warehouse">Warehouse</SelectItem>
                  <SelectItem value="distribution_center">
                    Distribution Center
                  </SelectItem>
                  <SelectItem value="pickup_point">Pickup Point</SelectItem>
                  <SelectItem value="delivery_point">Delivery Point</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address and Geocoding */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              <Label className="text-base font-medium">
                Address & Coordinates
              </Label>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <div className="flex gap-2">
                <Input
                  id="address"
                  value={formData.address}
                  onChange={e => handleChange('address', e.target.value)}
                  placeholder="Enter street address"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGeocode}
                  disabled={isGeocoding || !formData.address.trim()}
                >
                  {isGeocoding ? (
                    <LoadingSpinner className="w-4 h-4" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {geocodeError && (
                <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  {geocodeError}
                </div>
              )}
            </div>

            {/* Geocoding Result */}
            {geocodeResult && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Geocoding Successful
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {geocodeResult.confidence}
                  </Badge>
                </div>
                <div className="text-sm text-green-700">
                  <div>Address: {geocodeResult.address}</div>
                  <div className="font-mono">
                    Coordinates: {geocodeResult.coordinates[1].toFixed(6)},{' '}
                    {geocodeResult.coordinates[0].toFixed(6)}
                  </div>
                </div>
              </div>
            )}

            {/* Manual Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <div className="flex gap-2">
                  <Input
                    id="latitude"
                    value={formData.locationLat}
                    onChange={e => handleChange('locationLat', e.target.value)}
                    placeholder="37.7749"
                    type="number"
                    step="any"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <div className="flex gap-2">
                  <Input
                    id="longitude"
                    value={formData.locationLon}
                    onChange={e => handleChange('locationLon', e.target.value)}
                    placeholder="-122.4194"
                    type="number"
                    step="any"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReverseGeocode}
                    disabled={
                      isGeocoding ||
                      !formData.locationLat ||
                      !formData.locationLon
                    }
                    title="Find address for coordinates"
                  >
                    {isGeocoding ? (
                      <LoadingSpinner className="w-4 h-4" />
                    ) : (
                      <Navigation className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {coordinateError && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertTriangle className="w-4 h-4" />
                {coordinateError}
              </div>
            )}
          </div>

          {/* Operational Information */}
          <div className="space-y-4 border-t pt-4">
            <Label className="text-base font-medium">Operational Details</Label>

            <div>
              <Label htmlFor="operatingHours">Operating Hours</Label>
              <Input
                id="operatingHours"
                value={formData.operatingHours}
                onChange={e => handleChange('operatingHours', e.target.value)}
                placeholder="e.g., Mon-Fri 9:00-17:00"
              />
            </div>

            <div>
              <Label htmlFor="contactInfo">Contact Information</Label>
              <Input
                id="contactInfo"
                value={formData.contactInfo}
                onChange={e => handleChange('contactInfo', e.target.value)}
                placeholder="Phone, email, or contact person"
              />
            </div>

            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={formData.timezone}
                onChange={e => handleChange('timezone', e.target.value)}
                placeholder="e.g., America/Los_Angeles"
              />
            </div>
          </div>
        </form>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting || !!coordinateError || !formData.name.trim()
            }
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : mode === 'create' ? (
              'Create Location'
            ) : (
              'Update Location'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
