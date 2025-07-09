import { useState, useCallback, useRef } from 'react'
import type {
  BulkEditOperation,
  BulkEditOptions,
  BulkEditState,
} from '../types/bulk-edit.types'
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
      validationLevel: 'strict',
    },
    progress: {
      current: 0,
      total: 0,
      phase: 'idle',
      message: '',
    },
  })

  const workerRef = useRef<Worker | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const startBulkEdit = useCallback(
    async (
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
            message: 'Validating operations...',
          },
        }))

        // Create abort controller for cancellation
        abortControllerRef.current = new AbortController()

        // Validate operations first
        const validationResults = await validateOperations(
          data,
          operations,
          options,
          tableType
        )

        if (
          validationResults.hasErrors &&
          options.validationLevel === 'strict'
        ) {
          throw new Error(
            'Validation failed: ' + validationResults.errors.join(', ')
          )
        }

        // For small datasets, process directly
        if (data.length <= 500) {
          const result = await processEditDirect(
            data,
            operations,
            options,
            tableType
          )

          setEditState(prev => ({
            ...prev,
            status: 'completed',
            progress: {
              current: data.length,
              total: data.length,
              phase: 'completed',
              message: 'Edit completed',
            },
            updatedRows: result.updatedRows,
            affectedCount: result.affectedCount,
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
            message: error instanceof Error ? error.message : 'Edit failed',
          },
        }))
        throw error
      }
    },
    []
  )

  const processEditDirect = useCallback(
    async (
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
            message: `Processing record ${i + 1} of ${data.length}...`,
          },
        }))

        // Small delay to allow UI updates
        if (i % 50 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1))
        }
      }

      return {
        updatedRows,
        affectedCount,
        totalRecords: data.length,
      }
    },
    []
  )

  const processEditWithWorker = useCallback(
    async (
      data: any[],
      operations: BulkEditOperation[],
      options: BulkEditOptions,
      tableType: VRPTableType
    ) => {
      return new Promise((resolve, reject) => {
        // Create worker for background processing
        const worker = new Worker(
          new URL('../workers/editWorker.ts', import.meta.url),
          {
            type: 'module',
          }
        )

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
                  message: workerData?.message || 'Processing...',
                },
              }))
              break

            case 'validation':
              setEditState(prev => ({
                ...prev,
                progress: {
                  ...prev.progress,
                  phase: 'processing',
                  message: 'Validation complete, applying changes...',
                },
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
                  message: 'Edit completed',
                },
                updatedRows: workerData.updatedRows,
                affectedCount: workerData.affectedCount,
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
                  message: error || 'Edit failed',
                },
              }))
              reject(new Error(error))
              break
          }
        }

        worker.onerror = error => {
          setEditState(prev => ({
            ...prev,
            status: 'error',
            progress: {
              ...prev.progress,
              phase: 'error',
              message: 'Worker error occurred',
            },
          }))
          reject(error)
        }

        // Send data to worker
        worker.postMessage({
          data,
          operations,
          options,
          tableType,
        })
      })
    },
    []
  )

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
        message: 'Edit cancelled',
      },
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
        message: '',
      },
      updatedRows: undefined,
      affectedCount: undefined,
    }))
  }, [])

  return {
    editState,
    startBulkEdit,
    cancelEdit,
    resetEdit,
    isEditing: editState.status === 'running',
    isCompleted: editState.status === 'completed',
    hasError: editState.status === 'error',
  }
}

// Helper functions
async function validateOperations(
  data: any[],
  operations: BulkEditOperation[],
  options: BulkEditOptions,
  tableType?: VRPTableType
): Promise<{ hasErrors: boolean; errors: string[]; warnings: string[] }> {
  const errors: string[] = []
  const warnings: string[] = []

  // Define valid fields for each table type
  const validFields = {
    vehicles: [
      'description',
      'profile',
      'startLat',
      'startLon',
      'endLat',
      'endLon',
      'capacity',
      'skills',
      'twStart',
      'twEnd',
      'speedFactor',
      'maxTasks',
      'costFixed',
      'costPerHour',
      'costPerKm',
    ],
    jobs: [
      'description',
      'locationLat',
      'locationLon',
      'setup',
      'service',
      'delivery',
      'pickup',
      'priority',
    ],
    locations: [
      'name',
      'locationLat',
      'locationLon',
      'address',
      'description',
      'locationType',
      'operatingHours',
      'contactInfo',
    ],
    routes: [
      'vehicleId',
      'type',
      'locationId',
      'jobId',
      'service',
      'waiting',
      'arrivalTime',
      'departureTime',
    ],
  }

  // Determine table type - use provided tableType or fallback to auto-detection
  let detectedTableType = tableType || 'vehicles' // Use provided tableType or default
  if (!tableType && data.length > 0) {
    const sampleRow = data[0]
    if ('locationId' in sampleRow || 'vehicleId' in sampleRow) {
      detectedTableType = 'routes'
    } else if ('name' in sampleRow && 'locationLat' in sampleRow) {
      detectedTableType = 'locations'
    } else if ('locationLat' in sampleRow && 'service' in sampleRow) {
      detectedTableType = 'jobs'
    }
  }

  // Validate each operation
  for (const operation of operations) {
    // Check if field exists in schema or data - handle nested properties and arrays
    const isValidField =
      validFields[detectedTableType as keyof typeof validFields]?.includes(
        operation.field
      ) ||
      operation.field.includes('.') || // Allow dot notation for nested fields
      (data.length > 0 &&
        (operation.field in data[0] || data[0].hasOwnProperty(operation.field)))

    if (!isValidField) {
      errors.push(`Field '${operation.field}' does not exist`)
    }

    // Validate operation type vs value type
    if (['increment', 'multiply'].includes(operation.operation)) {
      if (typeof operation.value !== 'number') {
        errors.push(
          `Operation '${operation.operation}' requires a numeric value`
        )
      }
    }

    // Check for potential data type mismatches
    if (data.length > 0) {
      const sampleValue = data[0][operation.field]
      const valueType = typeof sampleValue
      const operationValueType = typeof operation.value

      if (
        operation.operation === 'set' &&
        valueType !== operationValueType &&
        sampleValue !== null
      ) {
        warnings.push(
          `Type mismatch: field '${operation.field}' is ${valueType} but setting ${operationValueType}`
        )
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
  if (
    !options.updateExisting &&
    currentValue !== null &&
    currentValue !== undefined &&
    currentValue !== ''
  ) {
    return { row: updatedRow, changed: false }
  }

  if (
    options.preserveEmpty &&
    (currentValue === null || currentValue === undefined || currentValue === '')
  ) {
    return { row: updatedRow, changed: false }
  }

  // Apply operation based on type
  switch (operation.operation) {
    case 'set':
      // Convert value to proper type based on field type
      let convertedValue = operation.value

      // Define field type mappings based on Convex validators
      const fieldTypes = {
        // Vehicle fields
        description: 'string',
        profile: 'string',
        startLat: 'number',
        startLon: 'number',
        endLat: 'number',
        endLon: 'number',
        startLocationId: 'id',
        endLocationId: 'id',
        capacity: 'array_number',
        skills: 'array_number',
        timeWindow: 'array_number',
        speedFactor: 'number',
        maxTasks: 'number',
        maxTravelTime: 'number',
        maxDistance: 'number',
        costFixed: 'number',
        costPerHour: 'number',
        costPerKm: 'number',
        datasetName: 'string',
        datasetVersion: 'number',

        // Job fields
        locationId: 'id',
        locationLat: 'number',
        locationLon: 'number',
        setup: 'number',
        service: 'number',
        delivery: 'array_number',
        pickup: 'array_number',
        priority: 'number',
        timeWindows: 'array_array_number',

        // Location fields
        name: 'string',
        clusterId: 'id',
        address: 'string',
        locationType: 'string',
        operatingHours: 'string',
        contactInfo: 'string',
        timezone: 'string',
      }

      const fieldType = fieldTypes[operation.field as keyof typeof fieldTypes]

      // Convert based on detected field type
      if (
        fieldType &&
        operation.value !== undefined &&
        operation.value !== null
      ) {
        switch (fieldType) {
          case 'number':
            if (typeof operation.value === 'string' && operation.value !== '') {
              const numValue = parseFloat(operation.value)
              if (!isNaN(numValue)) {
                convertedValue = numValue
              }
            } else if (typeof operation.value === 'number') {
              convertedValue = operation.value
            }
            break

          case 'string':
            if (typeof operation.value !== 'string') {
              convertedValue = String(operation.value)
            }
            break

          case 'id':
            // IDs should be strings in the correct format
            if (typeof operation.value !== 'string') {
              convertedValue = String(operation.value)
            }
            break

          case 'array_number':
            // Handle array of numbers (capacity, skills, delivery, pickup, timeWindow)
            if (Array.isArray(operation.value)) {
              // Convert array elements to numbers
              convertedValue = operation.value.map(val => {
                const num = parseFloat(val)
                return isNaN(num) ? 0 : num
              })
            } else if (
              typeof operation.value === 'string' &&
              operation.value !== ''
            ) {
              try {
                const parsed = JSON.parse(operation.value)
                if (Array.isArray(parsed)) {
                  convertedValue = parsed.map(val => {
                    const num = parseFloat(val)
                    return isNaN(num) ? 0 : num
                  })
                } else {
                  const num = parseFloat(parsed)
                  convertedValue = [isNaN(num) ? 0 : num]
                }
              } catch {
                const num = parseFloat(operation.value)
                convertedValue = [isNaN(num) ? 0 : num]
              }
            } else {
              const num = parseFloat(operation.value)
              convertedValue = [isNaN(num) ? 0 : num]
            }
            break

          case 'array_array_number':
            // Handle array of arrays of numbers (timeWindows)
            if (Array.isArray(operation.value)) {
              convertedValue = operation.value.map(item => {
                if (Array.isArray(item)) {
                  return item.map(val => {
                    const num = parseFloat(val)
                    return isNaN(num) ? 0 : num
                  })
                }
                return [parseFloat(item) || 0]
              })
            } else if (
              typeof operation.value === 'string' &&
              operation.value !== ''
            ) {
              try {
                const parsed = JSON.parse(operation.value)
                if (Array.isArray(parsed)) {
                  convertedValue = parsed.map(item => {
                    if (Array.isArray(item)) {
                      return item.map(val => parseFloat(val) || 0)
                    }
                    return [parseFloat(item) || 0]
                  })
                } else {
                  convertedValue = [[parseFloat(parsed) || 0]]
                }
              } catch {
                convertedValue = [[parseFloat(operation.value) || 0]]
              }
            } else {
              convertedValue = [[parseFloat(operation.value) || 0]]
            }
            break

          default:
            // For unknown types, keep original value
            convertedValue = operation.value
        }
      }

      if (updatedRow[operation.field] !== convertedValue) {
        updatedRow[operation.field] = convertedValue
        hasChanged = true
      }
      break

    case 'increment':
      if (
        typeof currentValue === 'number' &&
        typeof operation.value === 'number'
      ) {
        updatedRow[operation.field] = currentValue + operation.value
        hasChanged = true
      }
      break

    case 'multiply':
      if (
        typeof currentValue === 'number' &&
        typeof operation.value === 'number'
      ) {
        updatedRow[operation.field] = currentValue * operation.value
        hasChanged = true
      }
      break

    case 'append':
      if (
        typeof currentValue === 'string' &&
        typeof operation.value === 'string'
      ) {
        updatedRow[operation.field] = currentValue + operation.value
        hasChanged = true
      } else if (Array.isArray(currentValue)) {
        updatedRow[operation.field] = [...currentValue, operation.value]
        hasChanged = true
      }
      break

    case 'prepend':
      if (
        typeof currentValue === 'string' &&
        typeof operation.value === 'string'
      ) {
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
