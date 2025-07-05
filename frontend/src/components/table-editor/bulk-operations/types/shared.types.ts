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