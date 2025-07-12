import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ZoomIn, ZoomOut, RotateCcw, MapPin, Plus, Focus } from 'lucide-react'
import type { Id } from '../../../../../convex/_generated/dataModel'

// Debounce utility for performance optimization
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle utility for smooth performance
const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Enhanced easing functions for professional map animations
const easingFunctions = {
  // Smooth and professional - good for zoom operations
  easeOutQuad: (t: number) => t * (2 - t),

  // More dramatic - good for fit-to-bounds operations
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  // Very smooth - good for reset operations
  easeOutCubic: (t: number) => --t * t * t + 1,

  // Gentle spring - good for marker focus
  easeOutBack: (t: number) => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  },
}

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
  interactive?: boolean
  className?: string
  autoFitBounds?: boolean // Control whether to auto-fit to bounds on location changes
}

export const LocationMap = ({
  locations,
  selectedLocationId,
  onLocationSelect,
  onLocationCreate,
  viewport,
  onViewportChange,
  interactive = true,
  className = '',
  autoFitBounds = false,
}: LocationMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({})
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isCreatingLocation, setIsCreatingLocation] = useState(false)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)

  // Memoize valid locations to prevent unnecessary recalculations
  const validLocations = useMemo(
    () => locations.filter(loc => loc.locationLat && loc.locationLon),
    [locations]
  )

  // Debounced viewport change handler
  const debouncedViewportChange = useMemo(
    () => (onViewportChange ? debounce(onViewportChange, 300) : undefined),
    [onViewportChange]
  )

  // Throttled marker update for smooth performance
  const throttledMarkerUpdate = useMemo(
    () => throttle(() => {}, 16), // 60fps - placeholder function
    []
  )

  // Memoized marker colors to avoid repeated object creation
  const markerTypeColors = useMemo(
    () => ({
      depot: '#8B5CF6',
      customer: '#3B82F6',
      warehouse: '#F97316',
      distribution_center: '#10B981',
      pickup_point: '#06B6D4',
      delivery_point: '#EC4899',
    }),
    []
  )

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

      // Handle viewport changes with debouncing for smooth performance
      if (debouncedViewportChange) {
        map.on('moveend', () => {
          const center = map.getCenter()
          const zoom = map.getZoom()
          debouncedViewportChange({
            latitude: center.lat,
            longitude: center.lng,
            zoom,
          })
        })
      }

      // Track user interactions to prevent auto-fit from interrupting
      map.on('movestart', e => {
        // Only mark as user interaction if it's not programmatic
        if (e.originalEvent) {
          setHasUserInteracted(true)
        }
      })

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

  // Optimized marker management with incremental updates
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    const map = mapRef.current

    // Get current marker IDs
    const currentMarkerIds = new Set(Object.keys(markersRef.current))
    const newLocationIds = new Set(validLocations.map(loc => loc._id))

    // Remove markers for locations that no longer exist
    currentMarkerIds.forEach(markerId => {
      if (!newLocationIds.has(markerId)) {
        markersRef.current[markerId]?.remove()
        delete markersRef.current[markerId]
      }
    })

    // Add or update markers
    validLocations.forEach(location => {
      const existingMarker = markersRef.current[location._id]

      if (existingMarker) {
        // Update existing marker position if needed
        const currentLngLat = existingMarker.getLngLat()
        if (
          Math.abs(currentLngLat.lng - location.locationLon!) > 0.0001 ||
          Math.abs(currentLngLat.lat - location.locationLat!) > 0.0001
        ) {
          existingMarker.setLngLat([
            location.locationLon!,
            location.locationLat!,
          ])
        }

        // Update marker styling for selection with smooth transitions
        const markerElement = existingMarker.getElement()
        if (location._id === selectedLocationId) {
          markerElement.style.borderColor = '#EF4444'
          markerElement.style.borderWidth = '3px'
          markerElement.style.transform = 'scale(1.2)'
          markerElement.style.boxShadow =
            '0 4px 12px rgba(239, 68, 68, 0.4), 0 2px 4px rgba(0,0,0,0.3)'
          markerElement.style.zIndex = '1000'
        } else {
          markerElement.style.borderColor = 'white'
          markerElement.style.borderWidth = '2px'
          markerElement.style.transform = 'scale(1)'
          markerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
          markerElement.style.zIndex = '1'
        }
      } else {
        // Create new marker
        const el = createMarkerElement(location, selectedLocationId)

        const marker = new mapboxgl.Marker(el)
          .setLngLat([location.locationLon!, location.locationLat!])
          .addTo(map)

        // Add optimized click handler
        el.addEventListener('click', createMarkerClickHandler(location, map))

        markersRef.current[location._id] = marker
      }
    })

    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      throttledMarkerUpdate()
    })
  }, [
    validLocations,
    mapLoaded,
    selectedLocationId,
    onLocationSelect,
    throttledMarkerUpdate,
  ])

  // Auto-fit bounds when appropriate (only if enabled and user hasn't manually moved the map)
  useEffect(() => {
    if (
      !mapRef.current ||
      !mapLoaded ||
      !autoFitBounds ||
      hasUserInteracted ||
      validLocations.length === 0
    ) {
      return
    }

    // Delay auto-fit to allow markers to be placed first
    const timeoutId = setTimeout(() => {
      if (!hasUserInteracted) {
        handleFitToBounds()
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [
    validLocations,
    mapLoaded,
    autoFitBounds,
    hasUserInteracted,
    handleFitToBounds,
  ])

  // Smooth focus on selected location
  useEffect(() => {
    if (!selectedLocationId || !mapLoaded || hasUserInteracted) return

    const selectedLocation = validLocations.find(
      loc => loc._id === selectedLocationId
    )
    if (selectedLocation) {
      focusOnLocation(selectedLocation)
    }
  }, [
    selectedLocationId,
    mapLoaded,
    hasUserInteracted,
    validLocations,
    focusOnLocation,
  ])

  // Memoized marker element creator for better performance
  const createMarkerElement = useCallback(
    (location: Location, selectedId?: Id<'locations'> | null) => {
      const el = document.createElement('div')
      el.className = 'location-marker'
      el.style.width = '24px'
      el.style.height = '24px'
      el.style.borderRadius = '50%'
      el.style.cursor = 'pointer'
      el.style.border =
        location._id === selectedId ? '3px solid #EF4444' : '2px solid white'
      el.style.transform =
        location._id === selectedId ? 'scale(1.2)' : 'scale(1)'
      el.style.boxShadow =
        location._id === selectedId
          ? '0 4px 12px rgba(239, 68, 68, 0.4), 0 2px 4px rgba(0,0,0,0.3)'
          : '0 2px 4px rgba(0,0,0,0.3)'
      el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' // Professional easing
      el.style.zIndex = location._id === selectedId ? '1000' : '1'

      // Use memoized colors for better performance
      el.style.backgroundColor =
        markerTypeColors[location.locationType || 'customer'] || '#6B7280'

      return el
    },
    [markerTypeColors]
  )

  // Helper function to create optimized click handler
  const createMarkerClickHandler =
    (location: Location, map: mapboxgl.Map) => (e: Event) => {
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
        className: 'location-popup',
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
            ${location.locationLat!.toFixed(6)}, ${location.locationLon!.toFixed(6)}
          </div>
        </div>
      `
        )
        .addTo(map)

      popupRef.current = popup
    }

  // Enhanced map control handlers with smooth animations
  const handleZoomIn = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.easeTo({
        zoom: mapRef.current.getZoom() + 1,
        duration: 400,
        easing: easingFunctions.easeOutQuad,
      })
    }
  }, [])

  const handleZoomOut = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.easeTo({
        zoom: mapRef.current.getZoom() - 1,
        duration: 400,
        easing: easingFunctions.easeOutQuad,
      })
    }
  }, [])

  const handleFitToBounds = useCallback(() => {
    if (!mapRef.current || validLocations.length === 0) return

    const map = mapRef.current
    const bounds = new mapboxgl.LngLatBounds()

    validLocations.forEach(location => {
      bounds.extend([location.locationLon!, location.locationLat!])
    })

    // Reset user interaction flag since this is a manual action
    setHasUserInteracted(false)

    if (validLocations.length === 1) {
      // Single location - center with appropriate zoom using gentle spring easing
      const location = validLocations[0]
      map.flyTo({
        center: [location.locationLon!, location.locationLat!],
        zoom: 14,
        duration: 1200,
        easing: easingFunctions.easeOutBack,
      })
    } else {
      // Multiple locations - fit bounds with smooth dramatic animation
      map.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 15,
        duration: 1000,
        easing: easingFunctions.easeInOutQuad,
      })
    }
  }, [validLocations])

  const handleResetView = useCallback(() => {
    if (mapRef.current && viewport) {
      mapRef.current.flyTo({
        center: [viewport.longitude, viewport.latitude],
        zoom: viewport.zoom,
        duration: 800,
        easing: easingFunctions.easeOutCubic,
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

  // Smooth focus on selected location with professional animation
  const focusOnLocation = useCallback((location: Location) => {
    if (!mapRef.current || !location.locationLat || !location.locationLon)
      return

    mapRef.current.easeTo({
      center: [location.locationLon, location.locationLat],
      zoom: Math.max(mapRef.current.getZoom(), 12),
      duration: 600,
      easing: easingFunctions.easeOutQuad,
    })
  }, [])

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
              onClick={handleFitToBounds}
              className="w-8 h-8 p-0"
              title="Fit to Bounds"
              disabled={validLocations.length === 0}
            >
              <Focus className="w-4 h-4" />
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
