import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Navigation,
  MapPin,
  Plus,
} from 'lucide-react'
import type { Id } from '../../../../../convex/_generated/dataModel'

// Mapbox access token - in a real app this should be in environment variables
const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  'pk.eyJ1IjoidnJwLXN5c3RlbSIsImEiOiJjbHNuNXBhbmIwMDA0M2twbTZmYTBlcnE3In0.example'

interface Location {
  _id: Id<'locations'>
  name: string
  locationLat?: number
  locationLon?: number
  locationType?: string
  geocodeQuality?: string
  geocodeSource?: string
  geocodeTimestamp?: number
  usageCount?: number
  address?: string
  description?: string
}

interface MapViewport {
  latitude: number
  longitude: number
  zoom: number
}

interface LocationMapProps {
  locations: Location[]
  selectedLocationId?: Id<'locations'> | null
  onLocationSelect?: (locationId: Id<'locations'>) => void
  onLocationCreate?: (coordinates: [number, number], address?: string) => void
  viewport?: MapViewport
  onViewportChange?: (viewport: MapViewport) => void
  showClusters?: boolean
  interactive?: boolean
  className?: string
}

export const LocationMap = ({
  locations,
  selectedLocationId,
  onLocationSelect,
  onLocationCreate,
  viewport,
  onViewportChange,
  showClusters = true,
  interactive = true,
  className = '',
}: LocationMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({})
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isCreatingLocation, setIsCreatingLocation] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    // Check if we have a valid token
    if (!MAPBOX_TOKEN || MAPBOX_TOKEN.includes('example')) {
      console.warn(
        'Mapbox token not configured. Map functionality will be limited.'
      )
      return
    }

    mapboxgl.accessToken = MAPBOX_TOKEN

    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: viewport ? [viewport.longitude, viewport.latitude] : [0, 0],
        zoom: viewport?.zoom || 2,
        interactive,
      })

      map.on('load', () => {
        setMapLoaded(true)

        // Add navigation control
        map.addControl(new mapboxgl.NavigationControl(), 'top-right')

        // Add fullscreen control
        map.addControl(new mapboxgl.FullscreenControl(), 'top-right')
      })

      // Handle viewport changes
      if (onViewportChange) {
        map.on('moveend', () => {
          const center = map.getCenter()
          const zoom = map.getZoom()
          onViewportChange({
            latitude: center.lat,
            longitude: center.lng,
            zoom,
          })
        })
      }

      // Handle map clicks for creating locations
      if (onLocationCreate) {
        map.on('click', e => {
          if (isCreatingLocation) {
            const { lng, lat } = e.lngLat
            onLocationCreate([lng, lat])
            setIsCreatingLocation(false)
            map.getCanvas().style.cursor = ''
          }
        })

        map.on('mousemove', () => {
          if (isCreatingLocation) {
            map.getCanvas().style.cursor = 'crosshair'
          }
        })
      }

      mapRef.current = map

      return () => {
        map.remove()
        mapRef.current = null
        setMapLoaded(false)
      }
    } catch (error) {
      console.error('Failed to initialize Mapbox map:', error)
    }
  }, [
    viewport?.latitude,
    viewport?.longitude,
    viewport?.zoom,
    interactive,
    onViewportChange,
    onLocationCreate,
    isCreatingLocation,
  ])

  // Update markers when locations change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    const map = mapRef.current

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove())
    markersRef.current = {}

    // Add new markers for locations with coordinates
    locations.forEach(location => {
      if (!location.locationLat || !location.locationLon) return

      const el = document.createElement('div')
      el.className = 'location-marker'
      el.style.width = '24px'
      el.style.height = '24px'
      el.style.borderRadius = '50%'
      el.style.cursor = 'pointer'
      el.style.border = '2px solid white'
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'

      // Color based on location type
      const typeColors: { [key: string]: string } = {
        depot: '#8B5CF6',
        customer: '#3B82F6',
        warehouse: '#F97316',
        distribution_center: '#10B981',
        pickup_point: '#06B6D4',
        delivery_point: '#EC4899',
      }

      el.style.backgroundColor =
        typeColors[location.locationType || 'customer'] || '#6B7280'

      // Highlight selected location
      if (location._id === selectedLocationId) {
        el.style.borderColor = '#EF4444'
        el.style.borderWidth = '3px'
        el.style.transform = 'scale(1.2)'
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat([location.locationLon, location.locationLat])
        .addTo(map)

      // Add click handler
      el.addEventListener('click', e => {
        e.stopPropagation()
        onLocationSelect?.(location._id)

        // Close existing popup
        if (popupRef.current) {
          popupRef.current.remove()
        }

        // Create popup with location details
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false,
        })
          .setLngLat([location.locationLon!, location.locationLat!])
          .setHTML(
            `
            <div class="p-3 min-w-48">
              <h3 class="font-semibold text-sm mb-2">${location.name}</h3>
              ${location.address ? `<p class="text-xs text-gray-600 mb-2">${location.address}</p>` : ''}
              <div class="space-y-1">
                ${
                  location.locationType
                    ? `
                  <div class="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                    ${location.locationType.replace('_', ' ')}
                  </div>
                `
                    : ''
                }
                ${
                  location.geocodeQuality
                    ? `
                  <div class="inline-block px-2 py-1 text-xs rounded bg-gray-100 text-gray-800 ml-1">
                    ${location.geocodeQuality}
                  </div>
                `
                    : ''
                }
              </div>
              ${
                location.usageCount !== undefined
                  ? `
                <p class="text-xs text-gray-500 mt-2">Used ${location.usageCount} times</p>
              `
                  : ''
              }
              <div class="text-xs text-gray-400 mt-2 font-mono">
                ${location.locationLat.toFixed(6)}, ${location.locationLon.toFixed(6)}
              </div>
            </div>
          `
          )
          .addTo(map)

        popupRef.current = popup
      })

      markersRef.current[location._id] = marker
    })

    // Fit bounds to show all markers if there are locations
    if (locations.length > 0) {
      const validLocations = locations.filter(
        l => l.locationLat && l.locationLon
      )
      if (validLocations.length > 0) {
        const bounds = new mapboxgl.LngLatBounds()
        validLocations.forEach(location => {
          bounds.extend([location.locationLon!, location.locationLat!])
        })

        // Only fit bounds if we have more than one location or if the map is not already focused
        if (validLocations.length > 1) {
          map.fitBounds(bounds, { padding: 50, maxZoom: 15 })
        }
      }
    }
  }, [locations, mapLoaded, selectedLocationId, onLocationSelect])

  // Map control handlers
  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn()
  }, [])

  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomOut()
  }, [])

  const handleResetView = useCallback(() => {
    if (mapRef.current && viewport) {
      mapRef.current.flyTo({
        center: [viewport.longitude, viewport.latitude],
        zoom: viewport.zoom,
        duration: 1000,
      })
    }
  }, [viewport])

  const handleToggleCreateMode = useCallback(() => {
    setIsCreatingLocation(!isCreatingLocation)
    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = isCreatingLocation
        ? ''
        : 'crosshair'
    }
  }, [isCreatingLocation])

  // Show fallback if no Mapbox token
  if (!MAPBOX_TOKEN || MAPBOX_TOKEN.includes('example')) {
    return (
      <div
        className={`h-full bg-gray-100 flex items-center justify-center ${className}`}
      >
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Map Not Available</h3>
            <p className="text-gray-600 mb-4">
              Mapbox integration requires an API token to be configured.
            </p>
            <Badge variant="secondary">
              {locations.length} location{locations.length !== 1 ? 's' : ''}{' '}
              available
            </Badge>

            {/* Show location list as fallback */}
            {locations.length > 0 && (
              <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                {locations.map(location => (
                  <div
                    key={location._id}
                    className={`p-2 border rounded cursor-pointer text-left ${
                      location._id === selectedLocationId
                        ? 'bg-primary/5 border-primary/20'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => onLocationSelect?.(location._id)}
                  >
                    <div className="font-medium text-sm">{location.name}</div>
                    <div className="text-xs text-gray-600">
                      {location.address || 'No address'}
                    </div>
                    {location.locationLat && location.locationLon && (
                      <div className="text-xs text-gray-400 font-mono">
                        {location.locationLat.toFixed(4)},{' '}
                        {location.locationLon.toFixed(4)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`relative h-full ${className}`}>
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Map Controls */}
      {mapLoaded && (
        <div className="absolute top-4 left-4 space-y-2">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="w-8 h-8 p-0"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="w-8 h-8 p-0"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetView}
              className="w-8 h-8 p-0"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {onLocationCreate && (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-1">
              <Button
                variant={isCreatingLocation ? 'default' : 'ghost'}
                size="sm"
                onClick={handleToggleCreateMode}
                className={
                  isCreatingLocation
                    ? 'w-8 h-8 p-0 bg-green-500 hover:bg-green-600 text-white'
                    : 'w-8 h-8 p-0'
                }
                title={isCreatingLocation ? 'Cancel Create' : 'Create Location'}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create mode indicator */}
      {isCreatingLocation && (
        <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg">
          <div className="text-sm font-medium">
            Click on map to create location
          </div>
          <div className="text-xs opacity-90">
            Click anywhere to place a new location
          </div>
        </div>
      )}

      {/* Location count badge */}
      <div className="absolute bottom-4 left-4">
        <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
          {locations.filter(l => l.locationLat && l.locationLon).length} of{' '}
          {locations.length} locations on map
        </Badge>
      </div>
    </div>
  )
}
