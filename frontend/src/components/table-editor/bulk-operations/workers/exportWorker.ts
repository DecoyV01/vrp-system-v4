// Web Worker for background CSV export processing
// This worker handles large dataset exports without blocking the main thread

interface ExportWorkerData {
  data: any[]
  tableType: string
  options: {
    scope: 'all' | 'filtered' | 'selected'
    format: 'csv' | 'excel' | 'json'
    includeSystemFields: boolean
    includeConvexIds: boolean
    selectedColumns: string[]
    filename?: string
    compression: boolean
  }
}

interface ExportWorkerMessage {
  type: 'progress' | 'complete' | 'error'
  data?: any
  error?: string
  progress?: number
}

// Worker message handler
self.onmessage = async (e: MessageEvent<ExportWorkerData>) => {
  const { data, tableType, options } = e.data

  try {
    // Send initial progress
    postMessage({
      type: 'progress',
      progress: 0,
      data: { message: 'Starting export...' }
    } as ExportWorkerMessage)

    // Process data in chunks to avoid memory issues
    const chunkSize = 1000
    let processedData: any[] = []
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      const processedChunk = await processDataChunk(chunk, options)
      processedData.push(...processedChunk)
      
      // Send progress update
      const progress = Math.min(Math.round((i + chunkSize) / data.length * 100), 100)
      postMessage({
        type: 'progress',
        progress,
        data: { message: `Processing records ${i + 1} to ${Math.min(i + chunkSize, data.length)}...` }
      } as ExportWorkerMessage)
    }

    // Generate export content
    postMessage({
      type: 'progress',
      progress: 95,
      data: { message: 'Generating export file...' }
    } as ExportWorkerMessage)

    const exportResult = await generateExportContent(processedData, tableType, options)

    // Send completion message
    postMessage({
      type: 'complete',
      data: exportResult
    } as ExportWorkerMessage)

  } catch (error) {
    postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Export failed'
    } as ExportWorkerMessage)
  }
}

async function processDataChunk(chunk: any[], options: ExportWorkerData['options']): Promise<any[]> {
  let processedChunk = chunk

  // Filter columns if specific columns are selected
  if (options.scope === 'selected' && options.selectedColumns.length > 0) {
    processedChunk = chunk.map(row => 
      options.selectedColumns.reduce((acc, col) => {
        if (row.hasOwnProperty(col)) {
          acc[col] = row[col]
        }
        return acc
      }, {} as any)
    )
  }

  // Filter out system fields if requested
  if (!options.includeSystemFields) {
    processedChunk = processedChunk.map(row => {
      const filtered = { ...row }
      if (!options.includeConvexIds) {
        delete filtered._id
      }
      delete filtered._creationTime
      delete filtered.updatedAt
      return filtered
    })
  }

  return processedChunk
}

async function generateExportContent(
  data: any[], 
  tableType: string, 
  options: ExportWorkerData['options']
): Promise<any> {
  let content: string
  let mimeType: string
  let extension: string

  switch (options.format) {
    case 'csv':
      content = generateCSV(data)
      mimeType = 'text/csv;charset=utf-8;'
      extension = 'csv'
      break
    case 'excel':
      content = generateExcelCompatibleCSV(data)
      mimeType = 'text/csv;charset=utf-8;'
      extension = 'xlsx'
      break
    case 'json':
      content = JSON.stringify(data, null, 2)
      mimeType = 'application/json;charset=utf-8;'
      extension = 'json'
      break
    default:
      throw new Error(`Unsupported format: ${options.format}`)
  }

  // Create blob and download URL
  const blob = new Blob([content], { type: mimeType })
  const downloadUrl = URL.createObjectURL(blob)

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0]
  const finalExtension = options.format === 'excel' ? 'xlsx' : extension
  const filename = options.filename 
    ? `${options.filename}.${finalExtension}`
    : `${tableType}_export_${timestamp}.${finalExtension}`

  return {
    downloadUrl,
    filename,
    size: blob.size,
    recordCount: data.length,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  }
}

function generateCSV(data: any[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const rows = data.map(row => 
    headers.map(header => formatCSVValue(row[header])).join(',')
  )

  return [headers.join(','), ...rows].join('\n')
}

function generateExcelCompatibleCSV(data: any[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const rows = data.map(row => 
    headers.map(header => formatValueForExcel(row[header], header)).join(',')
  )

  return [headers.join(','), ...rows].join('\n')
}

function formatCSVValue(value: any): string {
  if (value === null || value === undefined) return ''
  
  const stringValue = String(value)
  
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  
  return stringValue
}

function formatValueForExcel(value: any, header: string): string {
  if (value === null || value === undefined) return ''
  
  // Handle timestamp fields
  if ((header === '_creationTime' || header === 'updatedAt') && typeof value === 'number') {
    const date = new Date(value)
    return date.toISOString().replace('T', ' ').replace('Z', '')
  }
  
  // Handle time window fields
  if ((header === 'twStart' || header === 'twEnd') && typeof value === 'number') {
    const hours = Math.floor(value / 3600)
    const minutes = Math.floor((value % 3600) / 60)
    const seconds = value % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  
  // Handle arrays and objects
  if (typeof value === 'object') {
    return `"${JSON.stringify(value)}"`
  }
  
  return formatCSVValue(value)
}

export {}