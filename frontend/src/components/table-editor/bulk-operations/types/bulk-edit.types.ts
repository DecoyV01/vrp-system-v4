import type { OperationStatus, OperationProgress, OperationError } from './shared.types'

export interface BulkEditOperation {
  field: string
  operation: 'set' | 'clear' | 'increment' | 'multiply' | 'copy' | 'formula'
  value?: any
  condition?: BulkEditCondition
  formula?: string
  sourceField?: string // for copy operations
}

export interface BulkEditCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'empty' | 'not_empty'
  value?: any
}

export interface BulkEditState {
  status: OperationStatus
  selectedFields: string[]
  operations: BulkEditOperation[]
  previewData: any[]
  validationErrors: OperationError[]
  progress: OperationProgress
  undoStack: BulkEditUndoState[]
}

export interface BulkEditUndoState {
  operationId: string
  timestamp: Date
  affectedRecords: Array<{
    id: string
    originalValues: Record<string, any>
    newValues: Record<string, any>
  }>
  description: string
}

export interface FieldUpdatePreview {
  recordId: string
  field: string
  currentValue: any
  newValue: any
  willChange: boolean
  error?: string
}