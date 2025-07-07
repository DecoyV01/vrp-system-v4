// Web Worker for background bulk edit processing
// This worker handles large dataset edits without blocking the main thread

interface EditWorkerData {
  data: any[]
  operations: BulkEditOperation[]
  options: BulkEditOptions
  tableType: string
}

interface BulkEditOperation {
  field: string
  operation: 'set' | 'increment' | 'multiply' | 'append' | 'prepend'
  value: any
  condition?: {
    field: string
    operator: 'equals' | 'contains' | 'greater' | 'less'
    value: any
  }
}

interface BulkEditOptions {
  mode: 'update' | 'replace'
  updateExisting: boolean
  preserveEmpty: boolean
  validationLevel: 'strict' | 'moderate' | 'permissive'
}

interface EditWorkerMessage {
  type: 'progress' | 'complete' | 'error' | 'validation'
  data?: any
  error?: string
  progress?: number
  validationResults?: any[]
}

// Worker message handler
self.onmessage = async (e: MessageEvent<EditWorkerData>) => {
  const { data, operations, options, tableType } = e.data

  try {
    // Send initial progress
    postMessage({
      type: 'progress',
      progress: 0,
      data: { message: 'Starting bulk edit...' }
    } as EditWorkerMessage)

    // Validate operations
    const validationResults = await validateOperations(data, operations, options)
    
    postMessage({
      type: 'validation',
      data: { validationResults }
    } as EditWorkerMessage)

    if (validationResults.hasErrors && options.validationLevel === 'strict') {
      throw new Error('Validation failed: ' + validationResults.errors.join(', '))
    }

    // Process data in chunks to avoid memory issues
    const chunkSize = 100
    const updatedRows: any[] = []
    let affectedCount = 0
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      const processedChunk = await processDataChunk(chunk, operations, options)
      
      updatedRows.push(...processedChunk.rows)
      affectedCount += processedChunk.affectedCount
      
      // Send progress update
      const progress = Math.min(Math.round((i + chunkSize) / data.length * 100), 100)
      postMessage({
        type: 'progress',
        progress,
        data: { message: `Processing records ${i + 1} to ${Math.min(i + chunkSize, data.length)}...` }
      } as EditWorkerMessage)
    }

    // Send completion message
    postMessage({
      type: 'complete',
      data: {
        updatedRows,
        affectedCount,
        totalRecords: data.length
      }
    } as EditWorkerMessage)

  } catch (error) {
    postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Edit failed'
    } as EditWorkerMessage)
  }
}

async function processDataChunk(
  chunk: any[], 
  operations: BulkEditOperation[], 
  options: BulkEditOptions
): Promise<{ rows: any[]; affectedCount: number }> {
  const processedRows: any[] = []
  let affectedCount = 0

  for (const row of chunk) {
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

    processedRows.push(updatedRow)
  }

  return { rows: processedRows, affectedCount }
}

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

  // Apply conditional logic if specified
  if (operation.condition) {
    const conditionMet = evaluateCondition(row, operation.condition)
    if (!conditionMet) {
      return { row: updatedRow, changed: false }
    }
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

function evaluateCondition(
  row: any, 
  condition: BulkEditOperation['condition']
): boolean {
  if (!condition) return true

  const fieldValue = row[condition.field]
  const conditionValue = condition.value

  switch (condition.operator) {
    case 'equals':
      return fieldValue === conditionValue
    case 'contains':
      return String(fieldValue).includes(String(conditionValue))
    case 'greater':
      return Number(fieldValue) > Number(conditionValue)
    case 'less':
      return Number(fieldValue) < Number(conditionValue)
    default:
      return true
  }
}

export {}