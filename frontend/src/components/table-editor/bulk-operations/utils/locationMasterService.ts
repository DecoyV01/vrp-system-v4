import { getGeocodingService, VRPErrorHandling } from '@/utils/errorHandling'
import type { 
  LocationMatch,
  LocationResolution,
  LocationValidationResult,
  LocationImportOptions
} from '../types/shared.types'

// =============================================================================
// LOCATION MATCHING SERVICE
// =============================================================================

export class LocationMasterService {
  private readonly COORDINATE_MATCH_THRESHOLD_KM = 0.1 // 100 meters
  private readonly ADDRESS_MATCH_THRESHOLD = 0.85 // 85% similarity
  private readonly FUZZY_MATCH_THRESHOLD = 0.7 // 70% similarity

  /**
   * Find existing locations that match import data
   */
  async findLocationMatches(
    importData: {
      address?: string
      coordinates?: [number, number]
      name?: string
    },
    existingLocations: any[],
    options: Partial<LocationImportOptions> = {}
  ): Promise<LocationMatch[]> {
    const matches: LocationMatch[] = []
    const coordinateThreshold = options.coordinateMatchThreshold || this.COORDINATE_MATCH_THRESHOLD_KM
    const addressThreshold = options.addressMatchThreshold || this.ADDRESS_MATCH_THRESHOLD

    for (const location of existingLocations) {
      // Exact name match (high confidence)
      if (importData.name && location.name?.toLowerCase() === importData.name.toLowerCase()) {
        matches.push({
          id: location._id,
          name: location.name,
          address: location.address,
          coordinates: location.locationLon && location.locationLat 
            ? [location.locationLon, location.locationLat] 
            : undefined,
          matchType: 'exact',
          confidence: 0.95
        })
        continue
      }

      // Coordinate-based matching
      if (importData.coordinates && location.locationLon && location.locationLat) {
        const distance = this.calculateDistance(
          importData.coordinates[1], // lat
          importData.coordinates[0], // lon
          location.locationLat,
          location.locationLon
        )

        if (distance <= coordinateThreshold) {
          matches.push({
            id: location._id,
            name: location.name,
            address: location.address,
            coordinates: [location.locationLon, location.locationLat],
            matchType: 'coordinate',
            confidence: Math.max(0.7, 1 - (distance / coordinateThreshold)),
            distance
          })
          continue
        }
      }

      // Address-based matching
      if (importData.address && location.address) {
        const addressSimilarity = this.calculateStringSimilarity(
          this.normalizeAddress(importData.address),
          this.normalizeAddress(location.address)
        )

        if (addressSimilarity >= addressThreshold) {
          matches.push({
            id: location._id,
            name: location.name,
            address: location.address,
            coordinates: location.locationLon && location.locationLat 
              ? [location.locationLon, location.locationLat] 
              : undefined,
            matchType: 'address',
            confidence: addressSimilarity
          })
          continue
        }
      }

      // Fuzzy name matching
      if (importData.name && location.name) {
        const nameSimilarity = this.calculateStringSimilarity(
          importData.name.toLowerCase(),
          location.name.toLowerCase()
        )

        if (nameSimilarity >= this.FUZZY_MATCH_THRESHOLD) {
          matches.push({
            id: location._id,
            name: location.name,
            address: location.address,
            coordinates: location.locationLon && location.locationLat 
              ? [location.locationLon, location.locationLat] 
              : undefined,
            matchType: 'fuzzy',
            confidence: nameSimilarity
          })
        }
      }
    }

    // Sort by confidence (highest first)
    return matches.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Validate location data and suggest improvements
   */
  async validateLocationData(
    locationData: {
      name?: string
      address?: string
      coordinates?: [number, number]
    },
    existingLocations: any[] = []
  ): Promise<LocationValidationResult> {
    const result: LocationValidationResult = {
      isValid: true,
      hasCoordinates: Boolean(locationData.coordinates),
      hasAddress: Boolean(locationData.address),
      needsGeocoding: false,
      warnings: [],
      errors: [],
      duplicates: []
    }

    // Validate coordinates if provided
    if (locationData.coordinates) {
      const [lon, lat] = locationData.coordinates
      if (!this.isValidCoordinate(lat, lon)) {
        result.isValid = false
        result.errors.push('Invalid coordinates: latitude must be -90 to 90, longitude must be -180 to 180')
      }
    }

    // Check if geocoding is needed
    if (locationData.address && !locationData.coordinates) {
      result.needsGeocoding = true
      result.warnings.push('Address provided without coordinates - geocoding recommended')
    }

    // Warn about missing data
    if (!locationData.address && !locationData.coordinates) {
      result.warnings.push('No address or coordinates provided - location may be difficult to route to')
    }

    if (!locationData.name) {
      result.errors.push('Location name is required')
      result.isValid = false
    }

    // Check for duplicates
    if (locationData.name || locationData.address || locationData.coordinates) {
      const duplicates = await this.findLocationMatches(locationData, existingLocations)
      result.duplicates = duplicates.filter(d => d.confidence > 0.8)
      
      if (result.duplicates.length > 0) {
        result.warnings.push(`Found ${result.duplicates.length} potential duplicate location(s)`)
      }
    }

    return result
  }

  /**
   * Geocode address and enhance location data
   */
  async enhanceLocationData(
    locationData: {
      name?: string
      address?: string
      coordinates?: [number, number]
    }
  ): Promise<{
    name: string
    address?: string
    coordinates?: [number, number]
    geocodeQuality?: string
    geocodeSource?: string
  }> {
    const enhanced = { ...locationData }

    try {
      // Geocode address if provided but no coordinates
      if (enhanced.address && !enhanced.coordinates) {
        const geocodingService = getGeocodingService()
        const result = await geocodingService.geocodeAddress(enhanced.address)
        
        enhanced.coordinates = result.coordinates
        enhanced.address = result.address // Use normalized address
        ;(enhanced as any).geocodeQuality = result.confidence
        ;(enhanced as any).geocodeSource = 'mapbox'
      }
      
      // Reverse geocode coordinates if no address
      else if (enhanced.coordinates && !enhanced.address) {
        const geocodingService = getGeocodingService()
        const [lon, lat] = enhanced.coordinates
        const result = await geocodingService.reverseGeocode(lat, lon)
        
        enhanced.address = result.address
        ;(enhanced as any).geocodeQuality = 'interpolated'
        ;(enhanced as any).geocodeSource = 'mapbox'
      }
      
      // Mark manual coordinates
      else if (enhanced.coordinates && enhanced.address) {
        ;(enhanced as any).geocodeQuality = 'manual'
        ;(enhanced as any).geocodeSource = 'manual'
      }
    } catch (error) {
      console.warn('Geocoding failed:', error)
      // Continue without geocoding enhancement
    }

    // Ensure name is provided
    if (!enhanced.name) {
      if (enhanced.address) {
        enhanced.name = enhanced.address.split(',')[0] // Use first part of address
      } else if (enhanced.coordinates) {
        enhanced.name = `Location ${enhanced.coordinates[1].toFixed(4)}, ${enhanced.coordinates[0].toFixed(4)}`
      } else {
        enhanced.name = `Location ${Date.now()}`
      }
    }

    return enhanced as any
  }

  /**
   * Create location resolution suggestions for import conflicts
   */
  createLocationResolution(
    importRowIndex: number,
    importData: {
      address?: string
      coordinates?: [number, number]
      name?: string
    },
    matches: LocationMatch[]
  ): LocationResolution {
    const resolution: LocationResolution = {
      importRowIndex,
      sourceAddress: importData.address,
      sourceCoordinates: importData.coordinates,
      resolution: 'create_new', // Default action
      matches
    }

    // If there's a high-confidence match, suggest using existing
    const bestMatch = matches[0]
    if (bestMatch && bestMatch.confidence > 0.9) {
      resolution.resolution = 'use_existing'
      resolution.selectedLocationId = bestMatch.id
    }
    // If there are moderate matches, require manual selection
    else if (matches.length > 0 && bestMatch.confidence > 0.7) {
      resolution.resolution = 'manual_select'
    }
    // Otherwise, suggest creating new location
    else {
      resolution.resolution = 'create_new'
      resolution.newLocationData = {
        name: importData.name || 'Imported Location',
        address: importData.address,
        coordinates: importData.coordinates
      }
    }

    return resolution
  }

  /**
   * Process batch location resolution for import
   */
  async processBatchLocationResolution(
    importData: any[],
    existingLocations: any[],
    options: LocationImportOptions
  ): Promise<LocationResolution[]> {
    const resolutions: LocationResolution[] = []

    for (let i = 0; i < importData.length; i++) {
      const row = importData[i]
      
      // Extract location data from row
      const locationData = this.extractLocationDataFromRow(row)
      
      if (locationData.address || locationData.coordinates || locationData.name) {
        // Find matches
        const matches = await this.findLocationMatches(locationData, existingLocations, options)
        
        // Create resolution
        const resolution = this.createLocationResolution(i, locationData, matches)
        resolutions.push(resolution)
      }
    }

    return resolutions
  }

  /**
   * Extract location data from import row
   */
  private extractLocationDataFromRow(row: any): {
    name?: string
    address?: string
    coordinates?: [number, number]
  } {
    const locationData: any = {}

    // Try to find location name
    if (row.name) locationData.name = row.name
    else if (row.locationName) locationData.name = row.locationName
    else if (row.description) locationData.name = row.description

    // Try to find address
    if (row.address) locationData.address = row.address
    else if (row.locationAddress) locationData.address = row.locationAddress

    // Try to find coordinates
    if (row.locationLat && row.locationLon) {
      const lat = parseFloat(row.locationLat)
      const lon = parseFloat(row.locationLon)
      if (!isNaN(lat) && !isNaN(lon)) {
        locationData.coordinates = [lon, lat]
      }
    }
    else if (row.startLat && row.startLon) {
      const lat = parseFloat(row.startLat)
      const lon = parseFloat(row.startLon)
      if (!isNaN(lat) && !isNaN(lon)) {
        locationData.coordinates = [lon, lat]
      }
    }

    return locationData
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0
    if (str1.length === 0 || str2.length === 0) return 0

    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    const editDistance = this.getEditDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  /**
   * Calculate edit distance between strings
   */
  private getEditDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i] + 1, // deletion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        )
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Normalize address for comparison
   */
  private normalizeAddress(address: string): string {
    return address
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  /**
   * Validate coordinate values
   */
  private isValidCoordinate(lat: number, lon: number): boolean {
    return (
      typeof lat === 'number' &&
      typeof lon === 'number' &&
      !isNaN(lat) &&
      !isNaN(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180
    )
  }
}

// =============================================================================
// LOCATION DATA TRANSFORMATION UTILITIES
// =============================================================================

export class LocationDataTransformer {
  /**
   * Transform import data to include location references
   */
  static transformImportDataWithLocations(
    importData: any[],
    locationResolutions: LocationResolution[],
    createdLocationMap: Map<string, string> // address/coords -> locationId
  ): any[] {
    return importData.map((row, index) => {
      const resolution = locationResolutions.find(r => r.importRowIndex === index)
      const transformedRow = { ...row }

      if (resolution) {
        switch (resolution.resolution) {
          case 'use_existing':
            if (resolution.selectedLocationId) {
              transformedRow.locationId = resolution.selectedLocationId
              // Remove raw coordinate data in favor of location reference
              delete transformedRow.locationLat
              delete transformedRow.locationLon
              delete transformedRow.startLat
              delete transformedRow.startLon
            }
            break
            
          case 'create_new':
            // Location will be created during import, ID will be assigned
            const locationKey = this.createLocationKey(resolution.sourceAddress, resolution.sourceCoordinates)
            const locationId = createdLocationMap.get(locationKey)
            if (locationId) {
              transformedRow.locationId = locationId
              // Remove raw coordinate data
              delete transformedRow.locationLat
              delete transformedRow.locationLon
              delete transformedRow.startLat
              delete transformedRow.startLon
            }
            break
            
          case 'skip':
            // Remove location-related data
            delete transformedRow.locationLat
            delete transformedRow.locationLon
            delete transformedRow.startLat
            delete transformedRow.startLon
            delete transformedRow.address
            break
        }
      }

      return transformedRow
    })
  }

  /**
   * Transform export data to include location details
   */
  static transformExportDataWithLocations(
    exportData: any[],
    locationMap: Map<string, any>, // locationId -> location object
    options: {
      includeLocationIds?: boolean
      includeLocationNames?: boolean
      includeCoordinates?: boolean
      includeAddresses?: boolean
    } = {}
  ): any[] {
    return exportData.map(row => {
      const transformedRow = { ...row }

      // Handle location references
      if (row.locationId) {
        const location = locationMap.get(row.locationId)
        if (location) {
          if (options.includeLocationNames) {
            transformedRow.locationName = location.name
          }
          if (options.includeAddresses && location.address) {
            transformedRow.locationAddress = location.address
          }
          if (options.includeCoordinates && location.locationLat && location.locationLon) {
            transformedRow.locationLat = location.locationLat
            transformedRow.locationLon = location.locationLon
          }
          if (!options.includeLocationIds) {
            delete transformedRow.locationId
          }
        }
      }

      // Handle start location references (for vehicles)
      if (row.startLocationId) {
        const location = locationMap.get(row.startLocationId)
        if (location) {
          if (options.includeLocationNames) {
            transformedRow.startLocationName = location.name
          }
          if (options.includeAddresses && location.address) {
            transformedRow.startLocationAddress = location.address
          }
          if (options.includeCoordinates && location.locationLat && location.locationLon) {
            transformedRow.startLat = location.locationLat
            transformedRow.startLon = location.locationLon
          }
          if (!options.includeLocationIds) {
            delete transformedRow.startLocationId
          }
        }
      }

      // Handle end location references (for vehicles)
      if (row.endLocationId) {
        const location = locationMap.get(row.endLocationId)
        if (location) {
          if (options.includeLocationNames) {
            transformedRow.endLocationName = location.name
          }
          if (options.includeAddresses && location.address) {
            transformedRow.endLocationAddress = location.address
          }
          if (options.includeCoordinates && location.locationLat && location.locationLon) {
            transformedRow.endLat = location.locationLat
            transformedRow.endLon = location.locationLon
          }
          if (!options.includeLocationIds) {
            delete transformedRow.endLocationId
          }
        }
      }

      return transformedRow
    })
  }

  /**
   * Create unique key for location matching
   */
  private static createLocationKey(address?: string, coordinates?: [number, number]): string {
    if (coordinates) {
      return `coords:${coordinates[1].toFixed(6)},${coordinates[0].toFixed(6)}`
    }
    if (address) {
      return `address:${address.toLowerCase().replace(/\s+/g, ' ').trim()}`
    }
    return `unknown:${Date.now()}`
  }
}

// Export singleton service instance
export const locationMasterService = new LocationMasterService()