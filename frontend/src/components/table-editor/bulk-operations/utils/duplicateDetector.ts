import type { DuplicateMatch, VRPTableType } from '../types/shared.types'

interface DuplicateDetectionOptions {
  fuzzyMatchThreshold?: number
  enableFuzzyMatching?: boolean
  naturalKeyFields?: string[]
  ignoreCase?: boolean
}

interface DetectionResult {
  duplicates: DuplicateMatch[]
  uniqueRows: any[]
  statistics: {
    totalRows: number
    uniqueRows: number
    duplicateRows: number
    idMatches: number
    naturalKeyMatches: number
    fuzzyMatches: number
  }
}

export class DuplicateDetector {
  private readonly defaultOptions: DuplicateDetectionOptions = {
    fuzzyMatchThreshold: 0.85,
    enableFuzzyMatching: true,
    naturalKeyFields: [],
    ignoreCase: true
  }

  /**
   * Detect duplicates between import data and existing records
   */
  detectDuplicates(
    importData: any[],
    existingData: any[],
    tableType: VRPTableType,
    options?: Partial<DuplicateDetectionOptions>
  ): DetectionResult {
    const config = { ...this.defaultOptions, ...options }
    const duplicates: DuplicateMatch[] = []
    const uniqueRows: any[] = []
    
    const statistics = {
      totalRows: importData.length,
      uniqueRows: 0,
      duplicateRows: 0,
      idMatches: 0,
      naturalKeyMatches: 0,
      fuzzyMatches: 0
    }

    importData.forEach((importRow, index) => {
      const duplicateMatch = this.findDuplicateMatch(
        importRow,
        existingData,
        tableType,
        index,
        config
      )

      if (duplicateMatch) {
        duplicates.push(duplicateMatch)
        statistics.duplicateRows++
        
        // Update match type statistics
        switch (duplicateMatch.matchType) {
          case 'id':
            statistics.idMatches++
            break
          case 'natural-key':
            statistics.naturalKeyMatches++
            break
          case 'fuzzy':
            statistics.fuzzyMatches++
            break
        }
      } else {
        uniqueRows.push(importRow)
        statistics.uniqueRows++
      }
    })

    return {
      duplicates,
      uniqueRows,
      statistics
    }
  }

  /**
   * Find duplicate match for a single import row
   */
  private findDuplicateMatch(
    importRow: any,
    existingData: any[],
    tableType: VRPTableType,
    importRowIndex: number,
    options: DuplicateDetectionOptions
  ): DuplicateMatch | null {
    // 1. Check for ID-based matches first (highest priority)
    const idMatch = this.findIdMatch(importRow, existingData, importRowIndex)
    if (idMatch) return idMatch

    // 2. Check for natural key matches
    const naturalKeyMatch = this.findNaturalKeyMatch(
      importRow,
      existingData,
      tableType,
      importRowIndex,
      options
    )
    if (naturalKeyMatch) return naturalKeyMatch

    // 3. Check for fuzzy matches if enabled
    if (options.enableFuzzyMatching) {
      const fuzzyMatch = this.findFuzzyMatch(
        importRow,
        existingData,
        tableType,
        importRowIndex,
        options
      )
      if (fuzzyMatch) return fuzzyMatch
    }

    return null
  }

  /**
   * Find ID-based duplicate matches
   */
  private findIdMatch(
    importRow: any,
    existingData: any[],
    importRowIndex: number
  ): DuplicateMatch | null {
    const importId = importRow._id || importRow.id

    if (!importId) return null

    const existingMatch = existingData.find(existing => 
      existing._id === importId || existing.id === importId
    )

    if (!existingMatch) return null

    const conflictingFields = this.findConflictingFields(importRow, existingMatch)

    return {
      importRowIndex,
      existingRecordId: existingMatch._id || existingMatch.id,
      matchType: 'id',
      confidence: 1.0,
      conflictingFields
    }
  }

  /**
   * Find natural key-based duplicate matches
   */
  private findNaturalKeyMatch(
    importRow: any,
    existingData: any[],
    tableType: VRPTableType,
    importRowIndex: number,
    options: DuplicateDetectionOptions
  ): DuplicateMatch | null {
    const naturalKeys = options.naturalKeyFields || this.getNaturalKeys(tableType)
    
    if (naturalKeys.length === 0) return null

    const existingMatch = existingData.find(existing => {
      return naturalKeys.every(key => {
        const importValue = this.normalizeValue(importRow[key], options.ignoreCase)
        const existingValue = this.normalizeValue(existing[key], options.ignoreCase)
        
        return importValue !== null && 
               existingValue !== null && 
               importValue === existingValue
      })
    })

    if (!existingMatch) return null

    const conflictingFields = this.findConflictingFields(importRow, existingMatch)

    return {
      importRowIndex,
      existingRecordId: existingMatch._id || existingMatch.id,
      matchType: 'natural-key',
      confidence: 0.95,
      conflictingFields
    }
  }

  /**
   * Find fuzzy duplicate matches
   */
  private findFuzzyMatch(
    importRow: any,
    existingData: any[],
    tableType: VRPTableType,
    importRowIndex: number,
    options: DuplicateDetectionOptions
  ): DuplicateMatch | null {
    const fuzzyFields = this.getFuzzyMatchFields(tableType)
    let bestMatch: { record: any; confidence: number } | null = null

    existingData.forEach(existing => {
      const similarity = this.calculateRowSimilarity(importRow, existing, fuzzyFields, options)
      
      if (similarity >= (options.fuzzyMatchThreshold || 0.85) && 
          (!bestMatch || similarity > bestMatch.confidence)) {
        bestMatch = { record: existing, confidence: similarity }
      }
    })

    if (!bestMatch) return null

    const conflictingFields = this.findConflictingFields(importRow, bestMatch.record)

    return {
      importRowIndex,
      existingRecordId: bestMatch.record._id || bestMatch.record.id,
      matchType: 'fuzzy',
      confidence: bestMatch.confidence,
      conflictingFields
    }
  }

  /**
   * Get natural key fields for each table type
   */
  private getNaturalKeys(tableType: VRPTableType): string[] {
    const naturalKeys = {
      vehicles: ['description'], // Vehicle description as natural key
      jobs: ['description', 'locationLat', 'locationLon'], // Job description + location
      locations: ['name'], // Location name as natural key
      routes: ['vehicleId'] // Route by vehicle assignment
    }

    return naturalKeys[tableType] || []
  }

  /**
   * Get fields used for fuzzy matching
   */
  private getFuzzyMatchFields(tableType: VRPTableType): string[] {
    const fuzzyFields = {
      vehicles: ['description', 'profile', 'startLat', 'startLon'],
      jobs: ['description', 'locationLat', 'locationLon', 'priority'],
      locations: ['name', 'address', 'locationLat', 'locationLon'],
      routes: ['vehicleId', 'cost', 'distance', 'duration']
    }

    return fuzzyFields[tableType] || []
  }

  /**
   * Calculate similarity between two rows
   */
  private calculateRowSimilarity(
    row1: any,
    row2: any,
    fields: string[],
    options: DuplicateDetectionOptions
  ): number {
    if (fields.length === 0) return 0

    let totalSimilarity = 0
    let validComparisons = 0

    fields.forEach(field => {
      const value1 = row1[field]
      const value2 = row2[field]

      // Skip if either value is null/undefined
      if (value1 == null || value2 == null) return

      const similarity = this.calculateFieldSimilarity(value1, value2, options)
      totalSimilarity += similarity
      validComparisons++
    })

    return validComparisons > 0 ? totalSimilarity / validComparisons : 0
  }

  /**
   * Calculate similarity between two field values
   */
  private calculateFieldSimilarity(
    value1: any,
    value2: any,
    options: DuplicateDetectionOptions
  ): number {
    // Handle different data types
    if (typeof value1 !== typeof value2) return 0

    if (typeof value1 === 'string') {
      const str1 = this.normalizeValue(value1, options.ignoreCase) as string
      const str2 = this.normalizeValue(value2, options.ignoreCase) as string
      
      if (str1 === str2) return 1.0
      
      return this.calculateStringSimilarity(str1, str2)
    }

    if (typeof value1 === 'number') {
      if (value1 === value2) return 1.0
      
      // For numbers, calculate relative similarity
      const maxValue = Math.max(Math.abs(value1), Math.abs(value2))
      if (maxValue === 0) return 1.0
      
      const difference = Math.abs(value1 - value2)
      return Math.max(0, 1 - (difference / maxValue))
    }

    if (Array.isArray(value1) && Array.isArray(value2)) {
      return this.calculateArraySimilarity(value1, value2)
    }

    // For other types, check exact equality
    return value1 === value2 ? 1.0 : 0
  }

  /**
   * Calculate similarity between arrays
   */
  private calculateArraySimilarity(arr1: any[], arr2: any[]): number {
    if (arr1.length === 0 && arr2.length === 0) return 1.0
    if (arr1.length === 0 || arr2.length === 0) return 0

    const intersection = arr1.filter(item => arr2.includes(item))
    const union = [...new Set([...arr1, ...arr2])]

    return intersection.length / union.length
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
   * Normalize value for comparison
   */
  private normalizeValue(value: any, ignoreCase?: boolean): any {
    if (value == null) return null
    
    if (typeof value === 'string') {
      let normalized = value.trim()
      if (ignoreCase) {
        normalized = normalized.toLowerCase()
      }
      return normalized
    }

    return value
  }

  /**
   * Find conflicting fields between import and existing record
   */
  private findConflictingFields(importRow: any, existingRow: any): string[] {
    const conflictingFields: string[] = []

    Object.keys(importRow).forEach(key => {
      if (key === '_id' || key === 'id') return // Skip ID fields

      const importValue = this.normalizeValue(importRow[key], true)
      const existingValue = this.normalizeValue(existingRow[key], true)

      // Only consider it a conflict if both values exist and are different
      if (importValue != null && 
          existingValue != null && 
          importValue !== existingValue) {
        conflictingFields.push(key)
      }
    })

    return conflictingFields
  }

  /**
   * Resolve duplicates based on strategy
   */
  resolveDuplicates(
    duplicates: DuplicateMatch[],
    strategy: 'replace' | 'create' | 'skip'
  ): {
    toReplace: DuplicateMatch[]
    toCreate: DuplicateMatch[]
    toSkip: DuplicateMatch[]
  } {
    const result = {
      toReplace: [] as DuplicateMatch[],
      toCreate: [] as DuplicateMatch[],
      toSkip: [] as DuplicateMatch[]
    }

    duplicates.forEach(duplicate => {
      const resolvedStrategy = duplicate.resolution || strategy

      switch (resolvedStrategy) {
        case 'replace':
          result.toReplace.push(duplicate)
          break
        case 'create':
          result.toCreate.push(duplicate)
          break
        case 'skip':
          result.toSkip.push(duplicate)
          break
      }
    })

    return result
  }

  /**
   * Generate duplicate resolution report
   */
  generateReport(detectionResult: DetectionResult): string {
    const { statistics, duplicates } = detectionResult
    
    let report = `Duplicate Detection Report\n`
    report += `═══════════════════════════\n\n`
    
    report += `Total rows processed: ${statistics.totalRows}\n`
    report += `Unique rows: ${statistics.uniqueRows}\n`
    report += `Duplicate rows: ${statistics.duplicateRows}\n\n`
    
    if (statistics.duplicateRows > 0) {
      report += `Duplicate breakdown:\n`
      report += `• ID matches: ${statistics.idMatches}\n`
      report += `• Natural key matches: ${statistics.naturalKeyMatches}\n`
      report += `• Fuzzy matches: ${statistics.fuzzyMatches}\n\n`
      
      report += `Recommendations:\n`
      duplicates.forEach((duplicate, index) => {
        report += `${index + 1}. Row ${duplicate.importRowIndex + 1}: ${duplicate.matchType} match `
        report += `(confidence: ${(duplicate.confidence * 100).toFixed(1)}%)\n`
        
        if (duplicate.conflictingFields.length > 0) {
          report += `   Conflicting fields: ${duplicate.conflictingFields.join(', ')}\n`
        }
      })
    }
    
    return report
  }
}

// Export singleton instance
export const duplicateDetector = new DuplicateDetector()