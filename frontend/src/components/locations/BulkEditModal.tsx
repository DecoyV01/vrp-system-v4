import { useState } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Separator } from '@/components/ui/separator'
import { 
  Edit2, 
  MapPin, 
  AlertTriangle,
  Info
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface BulkEditModalProps {
  isOpen: boolean
  onClose: () => void
  selectedLocations: any[]
  onEditComplete: () => void
}

interface BulkEditFields {
  locationType?: string
  description?: string
  operatingHours?: string
  contactInfo?: string
  timezone?: string
  appendToDescription?: boolean
}

interface FieldUpdate {
  field: keyof BulkEditFields
  enabled: boolean
  value: any
}

export const BulkEditModal = ({
  isOpen,
  onClose,
  selectedLocations,
  onEditComplete
}: BulkEditModalProps) => {
  const [fieldUpdates, setFieldUpdates] = useState<{ [K in keyof BulkEditFields]: FieldUpdate }>({
    locationType: { field: 'locationType', enabled: false, value: '' },
    description: { field: 'description', enabled: false, value: '' },
    operatingHours: { field: 'operatingHours', enabled: false, value: '' },
    contactInfo: { field: 'contactInfo', enabled: false, value: '' },
    timezone: { field: 'timezone', enabled: false, value: '' },
    appendToDescription: { field: 'appendToDescription', enabled: false, value: false }
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  // Handle field enable/disable
  const toggleField = (field: keyof BulkEditFields, enabled: boolean) => {
    setFieldUpdates(prev => ({
      ...prev,
      [field]: { ...prev[field], enabled }
    }))
  }

  // Handle field value changes
  const updateFieldValue = (field: keyof BulkEditFields, value: any) => {
    setFieldUpdates(prev => ({
      ...prev,
      [field]: { ...prev[field], value }
    }))
  }

  // Get enabled updates
  const getEnabledUpdates = () => {
    return Object.values(fieldUpdates).filter(update => update.enabled)
  }

  // Apply updates to a location
  const applyUpdatesToLocation = (location: any): any => {
    const updates: any = { ...location }
    
    Object.values(fieldUpdates).forEach(update => {
      if (!update.enabled) return
      
      switch (update.field) {
        case 'locationType':
        case 'operatingHours':
        case 'contactInfo':
        case 'timezone':
          updates[update.field] = update.value
          break
        case 'description':
          if (fieldUpdates.appendToDescription.enabled && fieldUpdates.appendToDescription.value) {
            // Append to existing description
            const currentDesc = location.description || ''
            updates.description = currentDesc ? `${currentDesc}\n${update.value}` : update.value
          } else {
            // Replace description
            updates.description = update.value
          }
          break
      }
    })
    
    return updates
  }

  // Handle preview
  const handlePreview = () => {
    setPreviewMode(true)
  }

  // Handle bulk edit submission
  const handleSubmit = async () => {
    const enabledUpdates = getEnabledUpdates()
    
    if (enabledUpdates.length === 0) {
      toast.error('Please select at least one field to update')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Mock bulk update (in real app, this would call API)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success(`Updated ${selectedLocations.length} location${selectedLocations.length !== 1 ? 's' : ''} successfully`)
      onEditComplete()
    } catch (error) {
      console.error('Bulk edit failed:', error)
      toast.error('Failed to update locations')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get preview of changes
  const getPreviewData = () => {
    return selectedLocations.map(location => ({
      original: location,
      updated: applyUpdatesToLocation(location)
    }))
  }

  if (previewMode) {
    const previewData = getPreviewData()
    
    return (
      <Dialog open={isOpen} onOpenChange={() => !isSubmitting && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Bulk Changes</DialogTitle>
            <DialogDescription>
              Review the changes that will be applied to {selectedLocations.length} location{selectedLocations.length !== 1 ? 's' : ''}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary of changes */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Changes to Apply:</h4>
              <div className="space-y-1">
                {getEnabledUpdates().map(update => (
                  <div key={update.field} className="text-sm">
                    <span className="font-medium">{update.field}:</span> {String(update.value)}
                  </div>
                ))}
              </div>
            </div>

            {/* Preview table */}
            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 border-b">Location</th>
                    <th className="text-left p-3 border-b">Current Type</th>
                    <th className="text-left p-3 border-b">New Type</th>
                    <th className="text-left p-3 border-b">Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((item, index) => {
                    const changedFields = getEnabledUpdates().map(update => update.field)
                    
                    return (
                      <tr key={item.original._id} className="border-b">
                        <td className="p-3">
                          <div className="font-medium">{item.original.name}</div>
                          <div className="text-xs text-gray-600 truncate max-w-48">
                            {item.original.address || 'No address'}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs">
                            {item.original.locationType || 'None'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {changedFields.includes('locationType') ? (
                            <Badge variant="default" className="text-xs">
                              {item.updated.locationType}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              {item.original.locationType || 'None'}
                            </Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            {changedFields.map(field => {
                              const oldValue = item.original[field] || 'None'
                              const newValue = item.updated[field] || 'None'
                              
                              if (oldValue === newValue) return null
                              
                              return (
                                <div key={field} className="text-xs">
                                  <span className="text-gray-600">{field}:</span>{' '}
                                  <span className="line-through text-red-600">{oldValue}</span>{' '}
                                  → <span className="text-green-600">{newValue}</span>
                                </div>
                              )
                            })}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setPreviewMode(false)}
              disabled={isSubmitting}
            >
              Back to Edit
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Applying Changes...
                </>
              ) : (
                'Apply Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => !isSubmitting && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="w-5 h-5" />
            Bulk Edit Locations
          </DialogTitle>
          <DialogDescription>
            Edit multiple locations at once. Only selected fields will be updated.
            Editing {selectedLocations.length} location{selectedLocations.length !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected locations summary */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div>Selected locations ({selectedLocations.length}):</div>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {selectedLocations.slice(0, 10).map(location => (
                    <Badge key={location._id} variant="secondary" className="text-xs">
                      {location.name}
                    </Badge>
                  ))}
                  {selectedLocations.length > 10 && (
                    <Badge variant="outline" className="text-xs">
                      +{selectedLocations.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Field updates */}
          <div className="space-y-4">
            <h4 className="font-medium">Select fields to update:</h4>

            {/* Location Type */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="update-type"
                  checked={fieldUpdates.locationType.enabled}
                  onCheckedChange={(checked) => toggleField('locationType', checked as boolean)}
                />
                <Label htmlFor="update-type" className="font-medium">Location Type</Label>
              </div>
              {fieldUpdates.locationType.enabled && (
                <Select 
                  value={fieldUpdates.locationType.value} 
                  onValueChange={(value) => updateFieldValue('locationType', value)}
                >
                  <SelectTrigger className="ml-6">
                    <SelectValue placeholder="Select location type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="depot">Depot</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                    <SelectItem value="distribution_center">Distribution Center</SelectItem>
                    <SelectItem value="pickup_point">Pickup Point</SelectItem>
                    <SelectItem value="delivery_point">Delivery Point</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="update-description"
                  checked={fieldUpdates.description.enabled}
                  onCheckedChange={(checked) => toggleField('description', checked as boolean)}
                />
                <Label htmlFor="update-description" className="font-medium">Description</Label>
              </div>
              {fieldUpdates.description.enabled && (
                <div className="ml-6 space-y-2">
                  <Textarea
                    value={fieldUpdates.description.value}
                    onChange={(e) => updateFieldValue('description', e.target.value)}
                    placeholder="Enter description"
                    rows={3}
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="append-description"
                      checked={fieldUpdates.appendToDescription.value}
                      onCheckedChange={(checked) => updateFieldValue('appendToDescription', checked)}
                    />
                    <Label htmlFor="append-description" className="text-sm">
                      Append to existing description instead of replacing
                    </Label>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Operating Hours */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="update-hours"
                  checked={fieldUpdates.operatingHours.enabled}
                  onCheckedChange={(checked) => toggleField('operatingHours', checked as boolean)}
                />
                <Label htmlFor="update-hours" className="font-medium">Operating Hours</Label>
              </div>
              {fieldUpdates.operatingHours.enabled && (
                <Input
                  className="ml-6"
                  value={fieldUpdates.operatingHours.value}
                  onChange={(e) => updateFieldValue('operatingHours', e.target.value)}
                  placeholder="e.g., Mon-Fri 9:00-17:00"
                />
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="update-contact"
                  checked={fieldUpdates.contactInfo.enabled}
                  onCheckedChange={(checked) => toggleField('contactInfo', checked as boolean)}
                />
                <Label htmlFor="update-contact" className="font-medium">Contact Information</Label>
              </div>
              {fieldUpdates.contactInfo.enabled && (
                <Input
                  className="ml-6"
                  value={fieldUpdates.contactInfo.value}
                  onChange={(e) => updateFieldValue('contactInfo', e.target.value)}
                  placeholder="Phone, email, or contact person"
                />
              )}
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="update-timezone"
                  checked={fieldUpdates.timezone.enabled}
                  onCheckedChange={(checked) => toggleField('timezone', checked as boolean)}
                />
                <Label htmlFor="update-timezone" className="font-medium">Timezone</Label>
              </div>
              {fieldUpdates.timezone.enabled && (
                <Input
                  className="ml-6"
                  value={fieldUpdates.timezone.value}
                  onChange={(e) => updateFieldValue('timezone', e.target.value)}
                  placeholder="e.g., America/Los_Angeles"
                />
              )}
            </div>
          </div>

          {/* Warning */}
          {getEnabledUpdates().length > 0 && (
            <Alert variant="default">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Changes will be applied to all {selectedLocations.length} selected location{selectedLocations.length !== 1 ? 's' : ''}. 
                Use the preview to verify changes before applying.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            variant="secondary"
            onClick={handlePreview}
            disabled={getEnabledUpdates().length === 0}
          >
            Preview Changes
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={getEnabledUpdates().length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Updating...
              </>
            ) : (
              'Apply Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}