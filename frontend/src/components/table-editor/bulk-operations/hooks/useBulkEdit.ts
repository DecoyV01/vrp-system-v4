import { useState, useCallback, useRef } from 'react'
import type { BulkEditOperation, BulkEditOptions, BulkEditState } from '../types/bulk-edit.types'
import type { VRPTableType } from '../types/shared.types'

interface EditWorkerMessage {
  type: 'progress' | 'complete' | 'error' | 'validation'
  data?: any
  error?: string
  progress?: number
  validationResults?: any[]
}

export function useBulkEdit() {
  const [editState, setEditState] = useState<BulkEditState>({
    status: 'idle',
    operations: [],
    options: {
      mode: 'update',
      updateExisting: true,
      preserveEmpty: false,
      validationLevel: 'strict'
    },
    progress: {
      current: 0,
      total: 0,
      phase: 'idle',
      message: ''
    }
  })

  const workerRef = useRef<Worker | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const startBulkEdit = useCallback(async (
    data: any[],
    operations: BulkEditOperation[],
    options: BulkEditOptions,
    tableType: VRPTableType
  ) => {
    try {
      // Initialize edit state
      setEditState(prev => ({
        ...prev,
        status: 'running',
        operations,
        options,
        progress: {
          current: 0,
          total: data.length,
          phase: 'validating',
          message: 'Validating operations...'
        }
      }))

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController()

      // Validate operations first
      const validationResults = await validateOperations(data, operations, options)
      
      if (validationResults.hasErrors && options.validationLevel === 'strict') {
        throw new Error('Validation failed: ' + validationResults.errors.join(', '))
      }

      // For small datasets, process directly
      if (data.length <= 500) {
        const result = await processEditDirect(data, operations, options, tableType)
        
        setEditState(prev => ({
          ...prev,
          status: 'completed',
          progress: {
            current: data.length,
            total: data.length,
            phase: 'completed',
            message: 'Edit completed'
          },
          updatedRows: result.updatedRows,
          affectedCount: result.affectedCount
        }))

        return result
      }

      // For large datasets, use web worker
      return await processEditWithWorker(data, operations, options, tableType)

    } catch (error) {
      setEditState(prev => ({
        ...prev,
        status: 'error',
        progress: {
          ...prev.progress,
          phase: 'error',
          message: error instanceof Error ? error.message : 'Edit failed'
        }
      }))
      throw error
    }
  }, [])

  const processEditDirect = useCallback(async (
    data: any[],
    operations: BulkEditOperation[],
    options: BulkEditOptions,
    tableType: VRPTableType
  ) => {
    const updatedRows: any[] = []
    let affectedCount = 0

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      let updatedRow = { ...row }
      let hasChanges = false

      // Apply each operation
      for (const operation of operations) {
        const result = applyOperation(updatedRow, operation, options)
        if (result.changed) {
          updatedRow = result.row
          hasChanges = true
        }
      }

      // Update timestamp if changes were made
      if (hasChanges) {
        updatedRow.updatedAt = Date.now()
        affectedCount++
      }

      updatedRows.push(updatedRow)

      // Update progress
      setEditState(prev => ({
        ...prev,
        progress: {
          ...prev.progress,
          current: i + 1,
          message: `Processing record ${i + 1} of ${data.length}...`
        }
      }))

      // Small delay to allow UI updates
      if (i % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1))
      }
    }

    return {
      updatedRows,
      affectedCount,
      totalRecords: data.length
    }
  }, [])

  const processEditWithWorker = useCallback(async (
    data: any[],
    operations: BulkEditOperation[],
    options: BulkEditOptions,
    tableType: VRPTableType
  ) => {
    return new Promise((resolve, reject) => {
      // Create worker for background processing
      const worker = new Worker(new URL('../workers/editWorker.ts', import.meta.url), {
        type: 'module'
      })
      
      workerRef.current = worker

      worker.onmessage = (e: MessageEvent<EditWorkerMessage>) => {
        const { type, data: workerData, error, progress } = e.data

        switch (type) {
          case 'progress':
            setEditState(prev => ({
              ...prev,
              progress: {
                ...prev.progress,
                current: progress || 0,
                message: workerData?.message || 'Processing...'
              }
            }))
            break

          case 'validation':
            setEditState(prev => ({
              ...prev,
              progress: {
                ...prev.progress,
                phase: 'processing',
                message: 'Validation complete, applying changes...'
              }
            }))
            break

          case 'complete':
            setEditState(prev => ({
              ...prev,
              status: 'completed',
              progress: {
                current: data.length,
                total: data.length,
                phase: 'completed',
                message: 'Edit completed'
              },
              updatedRows: workerData.updatedRows,
              affectedCount: workerData.affectedCount
            }))
            resolve(workerData)
            break

          case 'error':
            setEditState(prev => ({
              ...prev,
              status: 'error',
              progress: {
                ...prev.progress,
                phase: 'error',
                message: error || 'Edit failed'
              }
            }))
            reject(new Error(error))
            break
        }
      }

      worker.onerror = (error) => {
        setEditState(prev => ({
          ...prev,
          status: 'error',
          progress: {
            ...prev.progress,
            phase: 'error',
            message: 'Worker error occurred'
          }
        }))
        reject(error)
      }

      // Send data to worker
      worker.postMessage({
        data,
        operations,
        options,
        tableType
      })
    })
  }, [])

  const cancelEdit = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }

    setEditState(prev => ({
      ...prev,
      status: 'cancelled',
      progress: {
        ...prev.progress,
        phase: 'cancelled',
        message: 'Edit cancelled'
      }
    }))
  }, [])

  const resetEdit = useCallback(() => {
    setEditState(prev => ({
      ...prev,
      status: 'idle',
      progress: {
        current: 0,
        total: 0,
        phase: 'idle',
        message: ''
      },
      updatedRows: undefined,
      affectedCount: undefined
    }))
  }, [])

  return {
    editState,
    startBulkEdit,
    cancelEdit,
    resetEdit,
    isEditing: editState.status === 'running',
    isCompleted: editState.status === 'completed',
    hasError: editState.status === 'error'
  }
}

// Helper functions
async function validateOperations(
  data: any[],
  operations: BulkEditOperation[],
  options: BulkEditOptions
): Promise<{ hasErrors: boolean; errors: string[]; warnings: string[] }> {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate each operation
  for (const operation of operations) {
    // Check if field exists in data - handle nested properties and arrays
    if (data.length > 0) {
      const sampleRow = data[0]
      const fieldExists = operation.field in sampleRow || 
                         sampleRow.hasOwnProperty(operation.field) ||
                         operation.field.includes('.') // Allow dot notation for nested fields
      
      if (!fieldExists) {
        errors.push(`Field '${operation.field}' does not exist`)
      }
    }

    // Validate operation type vs value type
    if (['increment', 'multiply'].includes(operation.operation)) {
      if (typeof operation.value !== 'number') {
        errors.push(`Operation '${operation.operation}' requires a numeric value`)
      }
    }

    // Check for potential data type mismatches
    if (data.length > 0) {
      const sampleValue = data[0][operation.field]
      const valueType = typeof sampleValue
      const operationValueType = typeof operation.value

      if (operation.operation === 'set' && valueType !== operationValueType && sampleValue !== null) {
        warnings.push(`Type mismatch: field '${operation.field}' is ${valueType} but setting ${operationValueType}`)
      }
    }
  }

  return { hasErrors: errors.length > 0, errors, warnings }
}

function applyOperation(
  row: any,
  operation: BulkEditOperation,
  options: BulkEditOptions
): { row: any; changed: boolean } {
  const updatedRow = { ...row }
  const currentValue = row[operation.field]
  let hasChanged = false

  // Check if we should update based on options
  if (!options.updateExisting && currentValue !== null && currentValue !== undefined && currentValue !== '') {
    return { row: updatedRow, changed: false }
  }

  if (options.preserveEmpty && (currentValue === null || currentValue === undefined || currentValue === '')) {
    return { row: updatedRow, changed: false }
  }

  // Apply operation based on type
  switch (operation.operation) {
    case 'set':
      if (updatedRow[operation.field] !== operation.value) {
        updatedRow[operation.field] = operation.value
        hasChanged = true
      }
      break

    case 'increment':
      if (typeof currentValue === 'number' && typeof operation.value === 'number') {
        updatedRow[operation.field] = currentValue + operation.value
        hasChanged = true
      }
      break

    case 'multiply':
      if (typeof currentValue === 'number' && typeof operation.value === 'number') {
        updatedRow[operation.field] = currentValue * operation.value
        hasChanged = true
      }
      break

    case 'append':
      if (typeof currentValue === 'string' && typeof operation.value === 'string') {
        updatedRow[operation.field] = currentValue + operation.value
        hasChanged = true
      } else if (Array.isArray(currentValue)) {
        updatedRow[operation.field] = [...currentValue, operation.value]
        hasChanged = true
      }
      break

    case 'prepend':
      if (typeof currentValue === 'string' && typeof operation.value === 'string') {
        updatedRow[operation.field] = operation.value + currentValue
        hasChanged = true
      } else if (Array.isArray(currentValue)) {
        updatedRow[operation.field] = [operation.value, ...currentValue]
        hasChanged = true
      }
      break
  }

  return { row: updatedRow, changed: hasChanged }
}