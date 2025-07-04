import * as Papa from 'papaparse'
import type { 
  CSVParseResult, 
  ParseError, 
  ParseWarning, 
  ColumnMapping,
  VRPTableType 
} from '../types/shared.types'

interface CSVProcessorOptions {
  delimiter?: string
  skipEmptyLines?: boolean
  header?: boolean
  dynamicTyping?: boolean
  encoding?: string
  maxFileSize?: number // in MB
}

interface FileValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  size: number
  type: string
}

export class CSVProcessor {
  private readonly defaultOptions: CSVProcessorOptions = {
    delimiter: ',',
    skipEmptyLines: true,
    header: true,
    dynamicTyping: false,
    encoding: 'UTF-8',
    maxFileSize: 10 // 10MB default
  }

  /**
   * Validate file before processing
   */
  validateFile(file: File): FileValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check file type
    const validTypes = ['text/csv', 'application/csv', 'text/plain']
    const isValidType = validTypes.includes(file.type) || file.name.toLowerCase().endsWith('.csv')
    
    if (!isValidType) {
      errors.push('File must be a CSV file (.csv extension)')
    }

    // Check file size
    const sizeInMB = file.size / (1024 * 1024)
    if (sizeInMB > (this.defaultOptions.maxFileSize || 10)) {
      errors.push(`File size (${sizeInMB.toFixed(1)}MB) exceeds maximum limit of ${this.defaultOptions.maxFileSize}MB`)
    }

    // Check if file is empty
    if (file.size === 0) {
      errors.push('File is empty')
    }

    // Size warnings
    if (sizeInMB > 5) {
      warnings.push('Large file detected. Processing may take longer.')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      size: file.size,
      type: file.type
    }
  }

  /**
   * Parse CSV file and return structured result
   */
  async parseCSV(
    file: File, 
    tableType: VRPTableType,
    options?: Partial<CSVProcessorOptions>
  ): Promise<CSVParseResult> {
    const processingOptions = { ...this.defaultOptions, ...options }

    // Validate file first
    const validation = this.validateFile(file)
    if (!validation.isValid) {
      return {
        data: [],
        headers: [],
        errors: validation.errors.map((error, index) => ({
          row: 0,
          message: error,
          value: null
        })),
        warnings: validation.warnings.map((warning, index) => ({
          row: 0,
          message: warning,
          suggestion: 'Consider using a smaller file for better performance'
        })),
        meta: {
          rowCount: 0,
          columnCount: 0,
          encoding: processingOptions.encoding || 'UTF-8',
          size: file.size
        }
      }
    }

    return new Promise((resolve) => {
      Papa.parse(file, {
        ...processingOptions,
        complete: (results) => {
          const processedResult = this.processParseResults(results, tableType)
          resolve(processedResult)
        },
        error: (error) => {
          resolve({
            data: [],
            headers: [],
            errors: [{
              row: 0,
              message: `Parse error: ${error.message}`,
              value: null
            }],
            warnings: [],
            meta: {
              rowCount: 0,
              columnCount: 0,
              encoding: processingOptions.encoding || 'UTF-8',
              size: file.size
            }
          })
        }
      })
    })
  }

  /**
   * Process Papa Parse results into our format
   */
  private processParseResults(results: Papa.ParseResult<any>, tableType: VRPTableType): CSVParseResult {
    const errors: ParseError[] = []
    const warnings: ParseWarning[] = []
    
    // Convert Papa Parse errors to our format
    if (results.errors && results.errors.length > 0) {
      results.errors.forEach((error) => {
        errors.push({
          row: error.row || 0,
          column: error.field,
          message: error.message,
          value: error.code
        })
      })
    }

    // Extract headers
    const headers = results.meta.fields || []
    
    // Clean and validate data
    const cleanedData: any[] = []
    const dataArray = results.data as any[]

    dataArray.forEach((row, index) => {
      // Skip empty rows
      if (this.isEmptyRow(row)) {
        warnings.push({
          row: index + 1,
          message: 'Empty row detected',
          suggestion: 'Empty rows will be skipped during import'
        })
        return
      }

      // Validate row structure
      const validationResult = this.validateRowStructure(row, headers, index + 1)
      errors.push(...validationResult.errors)
      warnings.push(...validationResult.warnings)

      // Clean the row data
      const cleanedRow = this.cleanRowData(row, headers)
      cleanedData.push(cleanedRow)
    })

    // Additional validation for VRP table type
    const tableValidation = this.validateTableSpecificData(cleanedData, tableType)
    errors.push(...tableValidation.errors)
    warnings.push(...tableValidation.warnings)

    return {
      data: cleanedData,
      headers,
      errors,
      warnings,
      meta: {
        rowCount: cleanedData.length,
        columnCount: headers.length,
        encoding: 'UTF-8',
        size: results.meta.size || 0
      }
    }
  }

  /**
   * Check if a row is empty
   */
  private isEmptyRow(row: any): boolean {
    if (!row || typeof row !== 'object') return true
    
    const values = Object.values(row)
    return values.every(value => 
      value === null || 
      value === undefined || 
      (typeof value === 'string' && value.trim() === '')
    )
  }

  /**
   * Validate row structure
   */
  private validateRowStructure(row: any, headers: string[], rowNumber: number): {
    errors: ParseError[]
    warnings: ParseWarning[]
  } {
    const errors: ParseError[] = []
    const warnings: ParseWarning[] = []

    if (!row || typeof row !== 'object') {
      errors.push({
        row: rowNumber,
        message: 'Invalid row format',
        value: row
      })
      return { errors, warnings }
    }

    // Check for extra columns
    const rowKeys = Object.keys(row)
    const extraColumns = rowKeys.filter(key => !headers.includes(key))
    
    if (extraColumns.length > 0) {
      warnings.push({
        row: rowNumber,
        message: `Extra columns detected: ${extraColumns.join(', ')}`,
        suggestion: 'Extra columns will be ignored during import'
      })
    }

    return { errors, warnings }
  }

  /**
   * Clean row data
   */
  private cleanRowData(row: any, headers: string[]): any {
    const cleaned: any = {}

    headers.forEach(header => {
      let value = row[header]

      // Handle null/undefined values
      if (value === null || value === undefined) {
        cleaned[header] = null
        return
      }

      // Trim string values
      if (typeof value === 'string') {
        value = value.trim()
        
        // Convert empty strings to null
        if (value === '') {
          cleaned[header] = null
          return
        }

        // Try to parse JSON arrays/objects
        if (value.startsWith('[') || value.startsWith('{')) {
          try {
            cleaned[header] = JSON.parse(value)
            return
          } catch {
            // Keep as string if JSON parsing fails
          }
        }
      }

      cleaned[header] = value
    })

    return cleaned
  }

  /**
   * Validate table-specific data
   */
  private validateTableSpecificData(data: any[], tableType: VRPTableType): {
    errors: ParseError[]
    warnings: ParseWarning[]
  } {
    const errors: ParseError[] = []
    const warnings: ParseWarning[] = []

    data.forEach((row, index) => {
      const rowNumber = index + 1

      switch (tableType) {
        case 'vehicles':
          this.validateVehicleRow(row, rowNumber, errors, warnings)
          break
        case 'jobs':
          this.validateJobRow(row, rowNumber, errors, warnings)
          break
        case 'locations':
          this.validateLocationRow(row, rowNumber, errors, warnings)
          break
        case 'routes':
          this.validateRouteRow(row, rowNumber, errors, warnings)
          break
      }
    })

    return { errors, warnings }
  }

  /**
   * Validate vehicle-specific data
   */
  private validateVehicleRow(row: any, rowNumber: number, errors: ParseError[], warnings: ParseWarning[]): void {
    // Validate coordinates
    if (row.startLat !== null && (row.startLat < -90 || row.startLat > 90)) {
      errors.push({
        row: rowNumber,
        column: 'startLat',
        message: 'Latitude must be between -90 and 90',
        value: row.startLat
      })
    }

    if (row.startLon !== null && (row.startLon < -180 || row.startLon > 180)) {
      errors.push({
        row: rowNumber,
        column: 'startLon',
        message: 'Longitude must be between -180 and 180',
        value: row.startLon
      })
    }

    // Validate capacity array (handle both string and array formats)
    if (row.capacity) {
      let capacityArray = row.capacity
      
      // If it's a string, try to parse it as JSON
      if (typeof row.capacity === 'string') {
        try {
          // Clean the string of potential CSV artifacts
          let cleanCapacity = row.capacity.trim()
          
          // Remove outer quotes if present (CSV might quote the field)
          if ((cleanCapacity.startsWith('"') && cleanCapacity.endsWith('"')) ||
              (cleanCapacity.startsWith("'") && cleanCapacity.endsWith("'"))) {
            cleanCapacity = cleanCapacity.slice(1, -1)
          }
          
          capacityArray = JSON.parse(cleanCapacity)
        } catch (error) {
          
          // Try alternate parsing method for common formats
          try {
            // Handle space-separated numbers in brackets: "[1000 50 20]"
            let fallbackCapacity = row.capacity.trim()
            if (fallbackCapacity.startsWith('[') && fallbackCapacity.endsWith(']')) {
              const innerContent = fallbackCapacity.slice(1, -1).trim()
              const numbers = innerContent.split(/[\s,]+/).filter(s => s.length > 0).map(s => parseFloat(s))
              if (numbers.every(n => !isNaN(n))) {
                capacityArray = numbers
              } else {
                throw new Error('Contains non-numeric values')
              }
            } else {
              throw new Error('Not in bracket format')
            }
          } catch (fallbackError) {
            errors.push({
              row: rowNumber,
              column: 'capacity',
              message: `Capacity must be a valid array format like [1000,50,20]. Got: "${row.capacity}"`,
              value: row.capacity
            })
            return // Skip further validation if parsing failed
          }
        }
      }
      
      // Now validate that it's actually an array
      if (!Array.isArray(capacityArray)) {
        errors.push({
          row: rowNumber,
          column: 'capacity',
          message: 'Capacity must be an array of numbers',
          value: row.capacity
        })
      } else {
        // Validate that all elements are numbers
        const hasNonNumbers = capacityArray.some(val => typeof val !== 'number' || isNaN(val))
        if (hasNonNumbers) {
          errors.push({
            row: rowNumber,
            column: 'capacity',
            message: 'All capacity values must be numbers',
            value: row.capacity
          })
        }
      }
    }

    // Validate time windows (handle both string and number formats)
    if (row.twStart !== null && row.twStart !== undefined && 
        row.twEnd !== null && row.twEnd !== undefined) {
      
      // Convert to numbers if they're strings
      const twStart = typeof row.twStart === 'string' ? parseFloat(row.twStart) : row.twStart
      const twEnd = typeof row.twEnd === 'string' ? parseFloat(row.twEnd) : row.twEnd
      
      // Validate that they're valid numbers
      if (isNaN(twStart) || isNaN(twEnd)) {
        errors.push({
          row: rowNumber,
          column: 'twStart',
          message: 'Time window values must be numbers (seconds since midnight)',
          value: `twStart: ${row.twStart}, twEnd: ${row.twEnd}`
        })
      } else if (twStart >= twEnd) {
        warnings.push({
          row: rowNumber,
          column: 'twStart',
          message: 'Start time should be before end time',
          suggestion: 'Check time window values'
        })
      }
    }
  }

  /**
   * Validate job-specific data
   */
  private validateJobRow(row: any, rowNumber: number, errors: ParseError[], warnings: ParseWarning[]): void {
    // Validate coordinates
    if (row.locationLat !== null && (row.locationLat < -90 || row.locationLat > 90)) {
      errors.push({
        row: rowNumber,
        column: 'locationLat',
        message: 'Latitude must be between -90 and 90',
        value: row.locationLat
      })
    }

    if (row.locationLon !== null && (row.locationLon < -180 || row.locationLon > 180)) {
      errors.push({
        row: rowNumber,
        column: 'locationLon',
        message: 'Longitude must be between -180 and 180',
        value: row.locationLon
      })
    }

    // Validate priority
    if (row.priority !== null && (row.priority < 0 || row.priority > 100)) {
      warnings.push({
        row: rowNumber,
        column: 'priority',
        message: 'Priority should be between 0 and 100',
        suggestion: 'Adjust priority value for optimal routing'
      })
    }
  }

  /**
   * Validate location-specific data
   */
  private validateLocationRow(row: any, rowNumber: number, errors: ParseError[], warnings: ParseWarning[]): void {
    // Name is required for locations
    if (!row.name || (typeof row.name === 'string' && row.name.trim() === '')) {
      errors.push({
        row: rowNumber,
        column: 'name',
        message: 'Location name is required',
        value: row.name
      })
    }

    // Validate coordinates
    if (row.locationLat !== null && (row.locationLat < -90 || row.locationLat > 90)) {
      errors.push({
        row: rowNumber,
        column: 'locationLat',
        message: 'Latitude must be between -90 and 90',
        value: row.locationLat
      })
    }

    if (row.locationLon !== null && (row.locationLon < -180 || row.locationLon > 180)) {
      errors.push({
        row: rowNumber,
        column: 'locationLon',
        message: 'Longitude must be between -180 and 180',
        value: row.locationLon
      })
    }
  }

  /**
   * Validate route-specific data
   */
  private validateRouteRow(row: any, rowNumber: number, errors: ParseError[], warnings: ParseWarning[]): void {
    // Route validation is more complex and depends on the optimization context
    // For now, just basic validation
    
    if (row.arrivalTime !== null && row.departureTime !== null && row.arrivalTime > row.departureTime) {
      warnings.push({
        row: rowNumber,
        message: 'Arrival time should be before departure time',
        suggestion: 'Check time values for logical consistency'
      })
    }
  }

  /**
   * Generate column mapping suggestions
   */
  generateColumnMappings(csvHeaders: string[], tableType: VRPTableType): ColumnMapping[] {
    const mappings: ColumnMapping[] = []
    const schemaFields = this.getSchemaFields(tableType)

    csvHeaders.forEach(csvHeader => {
      const bestMatch = this.findBestFieldMatch(csvHeader, schemaFields)
      
      mappings.push({
        sourceColumn: csvHeader,
        targetField: bestMatch.field,
        confidence: bestMatch.confidence,
        dataType: bestMatch.dataType,
        isRequired: bestMatch.isRequired,
        validation: bestMatch.validation
      })
    })

    return mappings
  }

  /**
   * Get schema fields for table type
   */
  private getSchemaFields(tableType: VRPTableType) {
    const schemas = {
      vehicles: [
        { field: 'description', dataType: 'string' as const, isRequired: false },
        { field: 'profile', dataType: 'string' as const, isRequired: false },
        { field: 'startLat', dataType: 'number' as const, isRequired: false },
        { field: 'startLon', dataType: 'number' as const, isRequired: false },
        { field: 'endLat', dataType: 'number' as const, isRequired: false },
        { field: 'endLon', dataType: 'number' as const, isRequired: false },
        { field: 'capacity', dataType: 'array' as const, isRequired: false },
        { field: 'skills', dataType: 'array' as const, isRequired: false },
        { field: 'twStart', dataType: 'number' as const, isRequired: false },
        { field: 'twEnd', dataType: 'number' as const, isRequired: false },
        { field: 'speedFactor', dataType: 'number' as const, isRequired: false },
        { field: 'maxTasks', dataType: 'number' as const, isRequired: false },
        { field: 'costFixed', dataType: 'number' as const, isRequired: false },
        { field: 'costPerHour', dataType: 'number' as const, isRequired: false },
        { field: 'costPerKm', dataType: 'number' as const, isRequired: false }
      ],
      jobs: [
        { field: 'description', dataType: 'string' as const, isRequired: false },
        { field: 'locationLat', dataType: 'number' as const, isRequired: false },
        { field: 'locationLon', dataType: 'number' as const, isRequired: false },
        { field: 'setup', dataType: 'number' as const, isRequired: false },
        { field: 'service', dataType: 'number' as const, isRequired: false },
        { field: 'delivery', dataType: 'array' as const, isRequired: false },
        { field: 'pickup', dataType: 'array' as const, isRequired: false },
        { field: 'priority', dataType: 'number' as const, isRequired: false },
        { field: 'timeWindows', dataType: 'array' as const, isRequired: false }
      ],
      locations: [
        { field: 'name', dataType: 'string' as const, isRequired: true },
        { field: 'address', dataType: 'string' as const, isRequired: false },
        { field: 'description', dataType: 'string' as const, isRequired: false },
        { field: 'locationLat', dataType: 'number' as const, isRequired: false },
        { field: 'locationLon', dataType: 'number' as const, isRequired: false },
        { field: 'locationType', dataType: 'string' as const, isRequired: false },
        { field: 'operatingHours', dataType: 'string' as const, isRequired: false },
        { field: 'contactInfo', dataType: 'string' as const, isRequired: false }
      ],
      routes: [
        { field: 'vehicleId', dataType: 'string' as const, isRequired: true },
        { field: 'cost', dataType: 'number' as const, isRequired: false },
        { field: 'distance', dataType: 'number' as const, isRequired: false },
        { field: 'duration', dataType: 'number' as const, isRequired: false },
        { field: 'arrivalTime', dataType: 'number' as const, isRequired: false },
        { field: 'departureTime', dataType: 'number' as const, isRequired: false }
      ]
    }

    return schemas[tableType] || []
  }

  /**
   * Find best field match using fuzzy matching
   */
  private findBestFieldMatch(csvHeader: string, schemaFields: any[]) {
    let bestMatch = {
      field: csvHeader, // Default to same name
      confidence: 0,
      dataType: 'string' as const,
      isRequired: false,
      validation: undefined
    }

    const normalizedHeader = csvHeader.toLowerCase().replace(/[_\s-]/g, '')

    schemaFields.forEach(schemaField => {
      const normalizedField = schemaField.field.toLowerCase().replace(/[_\s-]/g, '')
      
      // Exact match
      if (normalizedHeader === normalizedField) {
        bestMatch = {
          field: schemaField.field,
          confidence: 1.0,
          dataType: schemaField.dataType,
          isRequired: schemaField.isRequired,
          validation: undefined
        }
        return
      }

      // Partial matches
      const similarity = this.calculateStringSimilarity(normalizedHeader, normalizedField)
      if (similarity > bestMatch.confidence && similarity > 0.6) {
        bestMatch = {
          field: schemaField.field,
          confidence: similarity,
          dataType: schemaField.dataType,
          isRequired: schemaField.isRequired,
          validation: undefined
        }
      }
    })

    return bestMatch
  }

  /**
   * Calculate string similarity using simple character matching
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = this.getEditDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  /**
   * Calculate edit distance between strings
   */
  private getEditDistance(str1: string, str2: string): number {
    const matrix = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }
}

// Export singleton instance
export const csvProcessor = new CSVProcessor()