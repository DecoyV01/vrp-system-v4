import { useState, useCallback, useRef } from 'react'
import type { BulkExportOptions, ExportState, ExportMetadata } from '../types/bulk-export.types'
import type { VRPTableType } from '../types/shared.types'

interface ExportWorkerMessage {
  type: 'progress' | 'complete' | 'error'
  data?: any
  error?: string
  progress?: number
}

export function useBulkExport() {
  const [exportState, setExportState] = useState<ExportState>({
    status: 'idle',
    options: {
      scope: 'all',
      format: 'csv',
      includeSystemFields: false,
      includeConvexIds: false,
      selectedColumns: [],
      compression: false
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

  const startExport = useCallback(async (
    data: any[],
    tableType: VRPTableType,
    options: Partial<BulkExportOptions> = {}
  ) => {
    try {
      // Initialize export state
      const exportOptions: BulkExportOptions = {
        ...exportState.options,
        ...options
      }

      setExportState(prev => ({
        ...prev,
        status: 'running',
        options: exportOptions,
        progress: {
          current: 0,
          total: data.length,
          phase: 'preparing',
          message: 'Preparing export...'
        }
      }))

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController()

      // For small datasets, process directly
      if (data.length <= 1000) {
        const result = await processExportDirect(data, tableType, exportOptions)
        
        setExportState(prev => ({
          ...prev,
          status: 'completed',
          progress: {
            current: data.length,
            total: data.length,
            phase: 'completed',
            message: 'Export completed'
          },
          downloadUrl: result.downloadUrl,
          expiresAt: result.expiresAt
        }))

        return result
      }

      // For large datasets, use web worker
      return await processExportWithWorker(data, tableType, exportOptions)

    } catch (error) {
      setExportState(prev => ({
        ...prev,
        status: 'error',
        progress: {
          ...prev.progress,
          phase: 'error',
          message: error instanceof Error ? error.message : 'Export failed'
        }
      }))
      throw error
    }
  }, [exportState.options])

  const processExportDirect = useCallback(async (
    data: any[],
    tableType: VRPTableType,
    options: BulkExportOptions
  ) => {
    // Filter data based on scope
    let exportData = data
    if (options.scope === 'selected' && options.selectedColumns.length > 0) {
      exportData = data.map(row => 
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
      exportData = exportData.map(row => {
        const filtered = { ...row }
        if (!options.includeConvexIds) {
          delete filtered._id
        }
        delete filtered._creationTime
        delete filtered.updatedAt
        return filtered
      })
    }

    // Generate export content based on format
    let content: string
    let mimeType: string
    let extension: string

    switch (options.format) {
      case 'csv':
        content = generateCSV(exportData)
        mimeType = 'text/csv;charset=utf-8;'
        extension = 'csv'
        break
      case 'excel':
        content = generateExcelCompatibleCSV(exportData)
        mimeType = 'text/csv;charset=utf-8;'
        extension = 'csv'
        break
      case 'json':
        content = JSON.stringify(exportData, null, 2)
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
    const filename = options.filename || `${tableType}_export_${timestamp}.${extension}`

    return {
      downloadUrl,
      filename,
      size: blob.size,
      recordCount: exportData.length,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
  }, [])

  const processExportWithWorker = useCallback(async (
    data: any[],
    tableType: VRPTableType,
    options: BulkExportOptions
  ) => {
    return new Promise((resolve, reject) => {
      // Create worker for background processing
      const worker = new Worker(new URL('../workers/exportWorker.ts', import.meta.url), {
        type: 'module'
      })
      
      workerRef.current = worker

      worker.onmessage = (e: MessageEvent<ExportWorkerMessage>) => {
        const { type, data: workerData, error, progress } = e.data

        switch (type) {
          case 'progress':
            setExportState(prev => ({
              ...prev,
              progress: {
                ...prev.progress,
                current: progress || 0,
                message: workerData?.message || 'Processing...'
              }
            }))
            break

          case 'complete':
            setExportState(prev => ({
              ...prev,
              status: 'completed',
              progress: {
                current: data.length,
                total: data.length,
                phase: 'completed',
                message: 'Export completed'
              },
              downloadUrl: workerData.downloadUrl,
              expiresAt: workerData.expiresAt
            }))
            resolve(workerData)
            break

          case 'error':
            setExportState(prev => ({
              ...prev,
              status: 'error',
              progress: {
                ...prev.progress,
                phase: 'error',
                message: error || 'Export failed'
              }
            }))
            reject(new Error(error))
            break
        }
      }

      worker.onerror = (error) => {
        setExportState(prev => ({
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
        tableType,
        options
      })
    })
  }, [])

  const cancelExport = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }

    setExportState(prev => ({
      ...prev,
      status: 'cancelled',
      progress: {
        ...prev.progress,
        phase: 'cancelled',
        message: 'Export cancelled'
      }
    }))
  }, [])

  const resetExport = useCallback(() => {
    setExportState(prev => ({
      ...prev,
      status: 'idle',
      progress: {
        current: 0,
        total: 0,
        phase: 'idle',
        message: ''
      },
      downloadUrl: undefined,
      expiresAt: undefined
    }))
  }, [])

  return {
    exportState,
    startExport,
    cancelExport,
    resetExport,
    isExporting: exportState.status === 'running',
    isCompleted: exportState.status === 'completed',
    hasError: exportState.status === 'error'
  }
}

// Helper functions
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