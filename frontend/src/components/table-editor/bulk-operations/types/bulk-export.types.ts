import type { OperationStatus, OperationProgress, VRPTableType } from './shared.types'

export interface BulkExportOptions {
  scope: 'all' | 'filtered' | 'selected'
  format: 'csv' | 'excel' | 'json'
  includeSystemFields: boolean
  includeConvexIds: boolean
  selectedColumns: string[]
  filename?: string
  compression: boolean
}

export interface ExportState {
  status: OperationStatus
  options: BulkExportOptions
  progress: OperationProgress
  downloadUrl?: string
  expiresAt?: Date
}

export interface ExportMetadata {
  exportedAt: Date
  recordCount: number
  tableType: VRPTableType
  filters?: any
  columns: string[]
  format: string
}