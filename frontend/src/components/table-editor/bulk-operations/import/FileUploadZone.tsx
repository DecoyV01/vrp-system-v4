import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertTriangle, CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { csvProcessor } from '../utils/csvProcessor'
import type { VRPTableType, CSVParseResult } from '../types/shared.types'

interface FileUploadZoneProps {
  tableType: VRPTableType
  onFileProcessed: (result: CSVParseResult, file: File) => void
  onFileRemoved: () => void
  disabled?: boolean
  className?: string
}

interface FileState {
  file: File | null
  isProcessing: boolean
  progress: number
  result: CSVParseResult | null
  error: string | null
}

export function FileUploadZone({
  tableType,
  onFileProcessed,
  onFileRemoved,
  disabled = false,
  className
}: FileUploadZoneProps) {
  const [fileState, setFileState] = useState<FileState>({
    file: null,
    isProcessing: false,
    progress: 0,
    result: null,
    error: null
  })

  const processFile = useCallback(async (file: File) => {
    setFileState(prev => ({
      ...prev,
      file,
      isProcessing: true,
      progress: 10,
      error: null
    }))

    try {
      // Simulate progress updates
      setFileState(prev => ({ ...prev, progress: 30 }))
      
      // Process the CSV file
      const result = await csvProcessor.parseCSV(file, tableType)
      
      setFileState(prev => ({ ...prev, progress: 80 }))
      
      // Final validation and processing
      await new Promise(resolve => setTimeout(resolve, 200)) // Simulate processing time
      
      setFileState(prev => ({
        ...prev,
        isProcessing: false,
        progress: 100,
        result,
        error: result.errors.length > 0 ? 'File contains errors that need to be resolved' : null
      }))

      onFileProcessed(result, file)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file'
      setFileState(prev => ({
        ...prev,
        isProcessing: false,
        progress: 0,
        error: errorMessage
      }))
    }
  }, [tableType, onFileProcessed])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0])
    }
  }, [processFile])

  const onDropRejected = useCallback((rejectedFiles: any[]) => {
    const error = rejectedFiles[0]?.errors[0]?.message || 'Invalid file format'
    setFileState(prev => ({
      ...prev,
      error: `File rejected: ${error}`
    }))
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'text/csv': ['.csv'],
      'application/csv': ['.csv'],
      'text/plain': ['.csv']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: disabled || fileState.isProcessing
  })

  const removeFile = useCallback(() => {
    setFileState({
      file: null,
      isProcessing: false,
      progress: 0,
      result: null,
      error: null
    })
    onFileRemoved()
  }, [onFileRemoved])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getResultSummary = (result: CSVParseResult | null) => {
    if (!result) return null

    const hasErrors = result.errors.length > 0
    const hasWarnings = result.warnings.length > 0

    return {
      hasErrors,
      hasWarnings,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      rowCount: result.meta.rowCount,
      columnCount: result.meta.columnCount
    }
  }

  const summary = getResultSummary(fileState.result)

  // If file is uploaded and processed, show file info
  if (fileState.file && !fileState.isProcessing) {
    return (
      <div className={`border rounded-lg p-6 space-y-4 ${className}`}>
        {/* File Info Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-semibold">{fileState.file.name}</h4>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(fileState.file.size)} • CSV File
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={removeFile}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Processing Progress */}
        {fileState.progress > 0 && fileState.progress < 100 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing...</span>
              <span>{fileState.progress}%</span>
            </div>
            <Progress value={fileState.progress} className="h-2" />
          </div>
        )}

        {/* Error Display */}
        {fileState.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{fileState.error}</AlertDescription>
          </Alert>
        )}

        {/* Success Summary */}
        {summary && !fileState.error && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold">File processed successfully</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Rows:</span>
                <span className="ml-2 font-semibold">{summary.rowCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Columns:</span>
                <span className="ml-2 font-semibold">{summary.columnCount}</span>
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex items-center gap-2">
              {summary.hasErrors && (
                <Badge variant="destructive" className="text-xs">
                  {summary.errorCount} Error{summary.errorCount !== 1 ? 's' : ''}
                </Badge>
              )}
              {summary.hasWarnings && (
                <Badge variant="secondary" className="text-xs">
                  {summary.warningCount} Warning{summary.warningCount !== 1 ? 's' : ''}
                </Badge>
              )}
              {!summary.hasErrors && !summary.hasWarnings && (
                <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                  No Issues
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Show upload zone
  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive && !isDragReject ? 'border-primary bg-primary/5' : ''}
        ${isDragReject ? 'border-destructive bg-destructive/5' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'}
        ${!isDragActive && !isDragReject ? 'border-border' : ''}
        ${className}
      `}
    >
      <input {...getInputProps()} />
      
      <div className="space-y-4">
        {/* Upload Icon */}
        <div className="flex justify-center">
          <div className={`
            p-4 rounded-full 
            ${isDragActive && !isDragReject ? 'bg-primary text-primary-foreground' : 'bg-muted'}
          `}>
            <Upload className="h-8 w-8" />
          </div>
        </div>

        {/* Upload Text */}
        <div className="space-y-2">
          {isDragActive ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                {isDragReject ? 'Invalid file type' : 'Drop your CSV file here'}
              </p>
              {isDragReject && (
                <p className="text-sm text-muted-foreground">
                  Only CSV files are accepted
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                Drop your {tableType} CSV file here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Supports CSV files up to 10MB
              </p>
            </div>
          )}
        </div>

        {/* Upload Requirements */}
        {!isDragActive && (
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-center gap-4">
              <span>• CSV format required</span>
              <span>• First row should contain headers</span>
              <span>• Max file size: 10MB</span>
            </div>
          </div>
        )}

        {/* Processing State */}
        {fileState.isProcessing && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">Processing file...</p>
            <Progress value={fileState.progress} className="h-2 max-w-xs mx-auto" />
          </div>
        )}
      </div>
    </div>
  )
}