import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Edit2, 
  Trash2, 
  Eye, 
  MoreHorizontal,
  TrendingUp,
  Clock,
  MapIcon
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'

interface LocationCardProps {
  location: any
  isSelected?: boolean
  onSelect?: () => void
  onEdit?: () => void
  onDelete?: () => void
  showUsageMetrics?: boolean
  className?: string
}

export const LocationCard = ({
  location,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  showUsageMetrics = false,
  className = ""
}: LocationCardProps) => {
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'exact':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'interpolated':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'approximate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'manual':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'depot':
        return 'bg-purple-100 text-purple-800'
      case 'customer':
        return 'bg-blue-100 text-blue-800'
      case 'warehouse':
        return 'bg-orange-100 text-orange-800'
      case 'distribution_center':
        return 'bg-green-100 text-green-800'
      case 'pickup_point':
        return 'bg-cyan-100 text-cyan-800'
      case 'delivery_point':
        return 'bg-pink-100 text-pink-800'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
      } ${className}`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg mb-1 truncate">{location.name}</CardTitle>
            <CardDescription className="text-sm">
              {location.description || 'No description'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 ml-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-8 p-0"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MapIcon className="w-4 h-4 mr-2" />
                  View on Map
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete()
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Location Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 truncate">
              {location.address || 'No address provided'}
            </span>
          </div>
          
          {location.locationLat && location.locationLon && (
            <div className="text-xs text-gray-500 font-mono">
              {location.locationLat.toFixed(6)}, {location.locationLon.toFixed(6)}
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {location.locationType && (
            <Badge className={`text-xs ${getTypeColor(location.locationType)}`}>
              {location.locationType.replace('_', ' ')}
            </Badge>
          )}
          
          {location.geocodeQuality && (
            <Badge 
              variant="outline" 
              className={`text-xs ${getQualityColor(location.geocodeQuality)}`}
            >
              {location.geocodeQuality}
            </Badge>
          )}
        </div>

        {/* Usage Metrics */}
        {showUsageMetrics && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Usage</div>
                <div className="text-sm font-medium">
                  {location.usageCount || 0} times
                </div>
              </div>
            </div>
            
            {location.lastUsedAt && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500">Last Used</div>
                  <div className="text-sm font-medium">
                    {formatDistanceToNow(new Date(location.lastUsedAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Operating Hours */}
        {location.operatingHours && (
          <div className="text-xs text-gray-600">
            <span className="font-medium">Hours:</span> {location.operatingHours}
          </div>
        )}

        {/* Contact Info */}
        {location.contactInfo && (
          <div className="text-xs text-gray-600">
            <span className="font-medium">Contact:</span> {location.contactInfo}
          </div>
        )}

        {/* Created/Updated */}
        <div className="text-xs text-gray-400 pt-1 border-t border-gray-50">
          Created {formatDistanceToNow(new Date(location._creationTime), { addSuffix: true })}
          {location.updatedAt && location.updatedAt !== location._creationTime && (
            <span className="ml-2">
              • Updated {formatDistanceToNow(new Date(location.updatedAt), { addSuffix: true })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}