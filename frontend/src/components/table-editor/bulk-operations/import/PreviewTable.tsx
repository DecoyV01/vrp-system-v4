import { useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { CSVParseResult, ColumnMapping, DuplicateMatch } from '../types/shared.types'

interface PreviewTableProps {
  parseResult: CSVParseResult
  columnMappings?: ColumnMapping[]
  duplicates?: DuplicateMatch[]
  maxRows?: number
  className?: string
}

interface CellStatus {
  type: 'error' | 'warning' | 'duplicate' | 'normal'
  message?: string
}

export function PreviewTable({
  parseResult,
  columnMappings = [],
  duplicates = [],
  maxRows = 50,
  className
}: PreviewTableProps) {
  const { data, headers, errors, warnings } = parseResult

  // Create lookup maps for quick access
  const errorMap = useMemo(() => {
    const map = new Map<string, string[]>()
    errors.forEach(error => {
      const key = `${error.row}-${error.column || ''}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(error.message)
    })
    return map
  }, [errors])

  const warningMap = useMemo(() => {
    const map = new Map<string, string[]>()
    warnings.forEach(warning => {
      const key = `${warning.row}-${warning.column || ''}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(warning.message)
    })
    return map
  }, [warnings])

  const duplicateRowsSet = useMemo(() => {
    const set = new Set<number>()
    duplicates.forEach(duplicate => {
      set.add(duplicate.importRowIndex + 1) // Convert to 1-based indexing
    })
    return set
  }, [duplicates])

  // Get mapped column info
  const getColumnMapping = (header: string) => {
    return columnMappings.find(mapping => mapping.sourceColumn === header)
  }

  // Get cell status
  const getCellStatus = (rowIndex: number, columnName: string): CellStatus => {
    const rowNumber = rowIndex + 1 // Convert to 1-based for error matching
    const errorKey = `${rowNumber}-${columnName}`
    const warningKey = `${rowNumber}-${columnName}`

    if (errorMap.has(errorKey)) {
      return {
        type: 'error',
        message: errorMap.get(errorKey)!.join('; ')
      }
    }

    if (warningMap.has(warningKey)) {
      return {
        type: 'warning',
        message: warningMap.get(warningKey)!.join('; ')
      }
    }

    if (duplicateRowsSet.has(rowNumber)) {
      return {
        type: 'duplicate',
        message: 'Potential duplicate row detected'
      }
    }

    return { type: 'normal' }
  }

  // Get cell styling based on status
  const getCellClassName = (status: CellStatus): string => {
    const baseClass = 'relative'
    
    switch (status.type) {
      case 'error':
        return `${baseClass} bg-destructive/10 border-destructive/20`
      case 'warning':
        return `${baseClass} bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800/20`
      case 'duplicate':
        return `${baseClass} bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/20`
      default:
        return baseClass
    }
  }

  // Format cell value for display
  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) {
      return ''
    }

    if (Array.isArray(value)) {
      return JSON.stringify(value)
    }

    if (typeof value === 'object') {
      return JSON.stringify(value)
    }

    return String(value)
  }

  // Show preview data (limit rows for performance)
  const previewData = data.slice(0, maxRows)
  const hasMoreRows = data.length > maxRows

  if (data.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No data to preview. The CSV file appears to be empty or contains only headers.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary Information */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span>
            <span className="font-semibold">{data.length}</span> rows
          </span>
          <span>
            <span className="font-semibold">{headers.length}</span> columns
          </span>
          {hasMoreRows && (
            <Badge variant="secondary" className="text-xs">
              Showing first {maxRows} rows
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {errors.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {errors.length} Error{errors.length !== 1 ? 's' : ''}
            </Badge>
          )}
          {warnings.length > 0 && (
            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {warnings.length} Warning{warnings.length !== 1 ? 's' : ''}
            </Badge>
          )}
          {duplicates.length > 0 && (
            <Badge variant="outline" className="text-xs">
              <Info className="h-3 w-3 mr-1" />
              {duplicates.length} Duplicate{duplicates.length !== 1 ? 's' : ''}
            </Badge>
          )}
          {errors.length === 0 && warnings.length === 0 && duplicates.length === 0 && (
            <Badge className="text-xs bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              No Issues
            </Badge>
          )}
        </div>
      </div>

      {/* Table Preview */}
      <div className="border rounded-lg">
        <ScrollArea className="h-96 w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                {headers.map((header) => {
                  const mapping = getColumnMapping(header)
                  return (
                    <TableHead key={header} className="min-w-32">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{header}</span>
                          {mapping && mapping.targetField !== header && (
                            <Badge variant="outline" className="text-xs">
                              → {mapping.targetField}
                            </Badge>
                          )}
                        </div>
                        {mapping && (
                          <div className="flex items-center gap-1">
                            <Badge 
                              variant={mapping.isRequired ? "destructive" : "secondary"} 
                              className="text-xs"
                            >
                              {mapping.dataType}
                            </Badge>
                            {mapping.confidence < 1.0 && (
                              <Badge variant="secondary" className="text-xs">
                                {Math.round(mapping.confidence * 100)}% match
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </TableHead>
                  )
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewData.map((row, rowIndex) => (
                <TableRow 
                  key={rowIndex}
                  className={duplicateRowsSet.has(rowIndex + 1) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
                >
                  <TableCell className="text-center text-muted-foreground font-mono text-sm">
                    {rowIndex + 1}
                  </TableCell>
                  {headers.map((header) => {
                    const status = getCellStatus(rowIndex, header)
                    const value = row[header]
                    
                    return (
                      <TableCell 
                        key={`${rowIndex}-${header}`}
                        className={getCellClassName(status)}
                        title={status.message}
                      >
                        <div className="max-w-xs truncate">
                          {formatCellValue(value)}
                        </div>
                        {status.type !== 'normal' && (
                          <div className="absolute top-1 right-1">
                            {status.type === 'error' && (
                              <AlertTriangle className="h-3 w-3 text-destructive" />
                            )}
                            {status.type === 'warning' && (
                              <AlertTriangle className="h-3 w-3 text-yellow-600" />
                            )}
                            {status.type === 'duplicate' && (
                              <Info className="h-3 w-3 text-blue-600" />
                            )}
                          </div>
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Additional Information */}
      {hasMoreRows && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Only the first {maxRows} rows are shown in the preview. All {data.length} rows will be processed during import.
          </AlertDescription>
        </Alert>
      )}

      {/* Legend */}
      {(errors.length > 0 || warnings.length > 0 || duplicates.length > 0) && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Legend:</h4>
          <div className="flex flex-wrap gap-4 text-sm">
            {errors.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-destructive/10 border border-destructive/20 rounded"></div>
                <span>Errors (must be fixed)</span>
              </div>
            )}
            {warnings.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded dark:bg-yellow-900/20 dark:border-yellow-800/20"></div>
                <span>Warnings (recommended to review)</span>
              </div>
            )}
            {duplicates.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded dark:bg-blue-900/20 dark:border-blue-800/20"></div>
                <span>Potential duplicates</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}