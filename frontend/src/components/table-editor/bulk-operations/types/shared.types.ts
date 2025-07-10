// Note: We don't need the Id type here as it's only used in the backend
// If needed in the future, import from the proper path

// Base operation status
export type OperationStatus = 'idle' | 'processing' | 'completed' | 'error' | 'cancelled'

// Progress tracking
export interface OperationProgress {
  total: number
  completed: number
  percentage: number
  estimatedTimeRemaining?: number
  currentStep: string
  errors: OperationError[]
  warnings: OperationWarning[]
}

// Error handling
export interface OperationError {
  id: string
  row?: number
  field?: string
  message: string
  type: 'validation' | 'duplicate' | 'system' | 'network'
  severity: 'error' | 'warning'
  suggestions?: string[]
}

export interface OperationWarning {
  id: string
  message: string
  affectedRows: number[]
}

// Table types
export type VRPTableType = 'vehicles' | 'jobs' | 'locations' | 'routes'

// Legacy types for backward compatibility
export interface CSVParseResult {
  data: any[]
  headers: string[]
  errors: ParseError[]
  warnings: ParseWarning[]
  meta: {
    rowCount: number
    columnCount: number
    encoding: string
    size: number
  }
}

export interface ColumnMapping {
  sourceColumn: string
  targetField: string
  confidence: number
  dataType: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date'
  isRequired: boolean
  validation?: ValidationRule[]
}

export interface ParseError {
  row: number
  column?: string
  message: string
  value?: any
}

export interface ParseWarning {
  row: number
  column?: string
  message: string
  suggestion?: string
}

export interface ValidationRule {
  type: 'required' | 'type' | 'format' | 'range' | 'pattern'
  params?: any
  message: string
}

export interface DuplicateMatch {
  importRowIndex: number
  existingRecordId: string
  matchType: 'id' | 'natural-key' | 'fuzzy'
  confidence: number
  conflictingFields: string[]
  resolution?: 'replace' | 'create' | 'skip'
}

// =============================================================================
// LOCATION MASTER SUPPORT TYPES
// =============================================================================

// Location matching types for import
export interface LocationMatch {
  id: string
  name: string
  address?: string
  coordinates?: [number, number] // [longitude, latitude]
  matchType: 'exact' | 'address' | 'coordinate' | 'fuzzy'
  confidence: number // 0-1
  distance?: number // km, for coordinate matching
}

// Location resolution during import
export interface LocationResolution {
  importRowIndex: number
  sourceAddress?: string
  sourceCoordinates?: [number, number]
  resolution: 'use_existing' | 'create_new' | 'skip' | 'manual_select'
  selectedLocationId?: string
  newLocationData?: {
    name: string
    address?: string
    coordinates?: [number, number]
    locationType?: string
  }
  matches: LocationMatch[]
}

// Location validation result
export interface LocationValidationResult {
  isValid: boolean
  hasCoordinates: boolean
  hasAddress: boolean
  needsGeocoding: boolean
  warnings: string[]
  errors: string[]
  duplicates: LocationMatch[]
}

// Import mapping with location support
export interface LocationAwareColumnMapping {
  sourceColumn: string
  targetField: string
  confidence: number
  dataType: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date' | 'location_id' | 'coordinate'
  isRequired: boolean
  isLocationReference?: boolean
  requiresLocationResolution?: boolean
  validation?: ValidationRule[]
}

// Enhanced CSV parse result with location analysis
export interface LocationAwareParseResult {
  data: any[]
  headers: string[]
  errors: ParseError[]
  warnings: ParseWarning[]
  meta: {
    rowCount: number
    columnCount: number
    encoding: string
    size: number
  }
  locationAnalysis: {
    hasCoordinateColumns: boolean
    hasAddressColumns: boolean
    hasLocationIdColumns: boolean
    coordinateColumns: string[]
    addressColumns: string[]
    locationIdColumns: string[]
    needsLocationResolution: boolean
    estimatedLocationCount: number
  }
}

// Location import options
export interface LocationImportOptions {
  geocodingEnabled: boolean
  autoCreateLocations: boolean
  duplicateHandling: 'skip' | 'merge' | 'create_new'
  coordinateMatchThreshold: number // km
  addressMatchThreshold: number // similarity 0-1
  validateAddresses: boolean
  requireCoordinates: boolean
}

// Export options with location master support
export interface LocationAwareExportOptions {
  includeLocationIds: boolean
  includeLocationNames: boolean
  includeCoordinates: boolean
  includeAddresses: boolean
  resolveLocationReferences: boolean
  locationReferenceFormat: 'id' | 'name' | 'address' | 'coordinates'
}

// Selection state
export interface SelectionState {
  selectedRows: Set<string>
  selectionMode: 'none' | 'single' | 'multi'
  lastSelectedIndex?: number
  isAllSelected: boolean
  isIndeterminate: boolean
}

// Operation result
export interface OperationResult<T = any> {
  success: boolean
  data?: T
  errors: OperationError[]
  warnings: OperationWarning[]
  summary: {
    total: number
    successful: number
    failed: number
    skipped: number
  }
}