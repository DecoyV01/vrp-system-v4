import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Filter, X } from 'lucide-react'

interface LocationFiltersProps {
  filters: {
    locationType?: string[]
    geocodeQuality?: string[]
    hasUsage?: boolean
    searchQuery?: string
  }
  onFiltersChange: (filters: any) => void
  locationTypeOptions: { value: string; label: string }[]
  qualityOptions: { value: string; label: string }[]
}

export const LocationFilters = ({
  filters,
  onFiltersChange,
  locationTypeOptions,
  qualityOptions,
}: LocationFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleLocationTypeChange = (type: string, checked: boolean) => {
    const currentTypes = filters.locationType || []
    const newTypes = checked
      ? [...currentTypes, type]
      : currentTypes.filter(t => t !== type)
    
    onFiltersChange({
      ...filters,
      locationType: newTypes.length > 0 ? newTypes : undefined
    })
  }

  const handleQualityChange = (quality: string, checked: boolean) => {
    const currentQualities = filters.geocodeQuality || []
    const newQualities = checked
      ? [...currentQualities, quality]
      : currentQualities.filter(q => q !== quality)
    
    onFiltersChange({
      ...filters,
      geocodeQuality: newQualities.length > 0 ? newQualities : undefined
    })
  }

  const handleUsageChange = (value: boolean | undefined) => {
    onFiltersChange({
      ...filters,
      hasUsage: value
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({})
  }

  const activeFilterCount = [
    filters.locationType?.length || 0,
    filters.geocodeQuality?.length || 0,
    filters.hasUsage !== undefined ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0)

  return (
    <div className="flex items-center gap-2">
      {/* Active filter badges */}
      {activeFilterCount > 0 && (
        <>
          <div className="flex items-center gap-1">
            {filters.locationType?.map(type => (
              <Badge key={type} variant="secondary" className="text-xs">
                {locationTypeOptions.find(opt => opt.value === type)?.label || type}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLocationTypeChange(type, false)}
                  className="h-auto w-auto p-0 ml-1 hover:bg-transparent"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
            {filters.geocodeQuality?.map(quality => (
              <Badge key={quality} variant="secondary" className="text-xs">
                {qualityOptions.find(opt => opt.value === quality)?.label || quality}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQualityChange(quality, false)}
                  className="h-auto w-auto p-0 ml-1 hover:bg-transparent"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
            {filters.hasUsage !== undefined && (
              <Badge variant="secondary" className="text-xs">
                {filters.hasUsage ? 'Has Usage' : 'No Usage'}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUsageChange(undefined)}
                  className="h-auto w-auto p-0 ml-1 hover:bg-transparent"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs text-gray-500"
          >
            Clear All
          </Button>
        </>
      )}

      {/* Filter popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Location Type</h4>
              <div className="grid grid-cols-2 gap-2">
                {locationTypeOptions.map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${option.value}`}
                      checked={filters.locationType?.includes(option.value) || false}
                      onCheckedChange={(checked) => 
                        handleLocationTypeChange(option.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={`type-${option.value}`} className="text-sm">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium text-sm mb-2">Geocode Quality</h4>
              <div className="grid grid-cols-2 gap-2">
                {qualityOptions.map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`quality-${option.value}`}
                      checked={filters.geocodeQuality?.includes(option.value) || false}
                      onCheckedChange={(checked) => 
                        handleQualityChange(option.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={`quality-${option.value}`} className="text-sm">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium text-sm mb-2">Usage Status</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-usage"
                    checked={filters.hasUsage === true}
                    onCheckedChange={(checked) => 
                      handleUsageChange(checked ? true : undefined)
                    }
                  />
                  <Label htmlFor="has-usage" className="text-sm">
                    Has Usage
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="no-usage"
                    checked={filters.hasUsage === false}
                    onCheckedChange={(checked) => 
                      handleUsageChange(checked ? false : undefined)
                    }
                  />
                  <Label htmlFor="no-usage" className="text-sm">
                    No Usage
                  </Label>
                </div>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <>
                <Separator />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}