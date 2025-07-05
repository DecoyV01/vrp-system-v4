import type { OperationStatus, OperationProgress, OperationError } from './shared.types'

export interface BulkImportOptions {
  duplicateHandling: 'replace' | 'create' | 'skip'
  includeSystemFields: boolean
  validateBeforeImport: boolean
  chunkSize: number
  allowPartialImport: boolean
}

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

export interface ColumnMapping {
  sourceColumn: string
  targetField: string
  confidence: number
  dataType: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date'
  isRequired: boolean
  validation?: ValidationRule[]
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

export interface ImportState {
  status: OperationStatus
  file?: File
  parseResult?: CSVParseResult
  columnMappings: ColumnMapping[]
  duplicates: DuplicateMatch[]
  validationErrors: OperationError[]
  progress: OperationProgress
  options: BulkImportOptions
}