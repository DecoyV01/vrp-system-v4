import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Download, 
  X, 
  CheckCircle2,
  AlertCircle,
  FileText,
  Settings
} from 'lucide-react'
import { ExportOptionsForm } from './ExportOptionsForm'
import { useBulkExport } from '../hooks/useBulkExport'
import type { VRPTableType } from '../types/shared.types'
import type { BulkExportOptions } from '../types/bulk-export.types'

interface CSVExportModalProps {
  isOpen: boolean
  onClose: () => void
  tableType: VRPTableType
  data?: any[]
  selectedRows?: any[]
  filteredData?: any[]
  className?: string
}

export function CSVExportModal({
  isOpen,
  onClose,
  tableType,
  data = [],
  selectedRows = [],
  filteredData = [],
  className
}: CSVExportModalProps) {
  const [currentView, setCurrentView] = useState<'options' | 'progress' | 'complete'>('options')
  const [exportOptions, setExportOptions] = useState<BulkExportOptions>({
    scope: 'all',
    format: 'csv',
    includeSystemFields: false,
    includeConvexIds: false,
    selectedColumns: [],
    compression: false
  })

  const { 
    exportState, 
    startExport, 
    cancelExport, 
    resetExport, 
    isExporting, 
    isCompleted, 
    hasError 
  } = useBulkExport()

  // Get available columns from data with safe access
  const availableColumns = data && data.length > 0 ? Object.keys(data[0]) : []

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentView('options')
      resetExport()
    }
  }, [isOpen, resetExport])

  // Update view based on export state
  useEffect(() => {
    if (isExporting) {
      setCurrentView('progress')
    } else if (isCompleted) {
      setCurrentView('complete')
    } else if (hasError) {
      setCurrentView('options')
    }
  }, [isExporting, isCompleted, hasError])

  const handleStartExport = async () => {
    try {
      // Get data based on scope with safe access
      let exportData = data || []
      switch (exportOptions.scope) {
        case 'filtered':
          exportData = filteredData || []
          break
        case 'selected':
          exportData = selectedRows || []
          break
        default:
          exportData = data || []
      }

      if (!exportData || exportData.length === 0) {
        alert('No data to export')
        return
      }

      await startExport(exportData, tableType, exportOptions)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleDownload = () => {
    if (exportState.downloadUrl) {
      const link = document.createElement('a')
      link.href = exportState.downloadUrl
      link.download = `${tableType}_export_${new Date().toISOString().split('T')[0]}.${exportOptions.format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      onClose()
    }
  }

  const handleCancel = () => {
    if (isExporting) {
      cancelExport()
    }
    onClose()
  }

  const renderContent = () => {
    switch (currentView) {
      case 'options':
        return (
          <ExportOptionsForm
            options={exportOptions}
            onOptionsChange={setExportOptions}
            availableColumns={availableColumns}
            selectedRowsCount={selectedRows?.length || 0}
            totalRowsCount={data?.length || 0}
            filteredRowsCount={filteredData?.length || 0}
            onStartExport={handleStartExport}
            isExporting={isExporting}
          />
        )

      case 'progress':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="p-4 bg-primary/10 rounded-lg inline-block mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Exporting Data</h3>
              <p className="text-muted-foreground">
                Please wait while we prepare your export...
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>{exportState.progress.current}/{exportState.progress.total}</span>
                </div>
                <Progress 
                  value={exportState.progress.total > 0 ? (exportState.progress.current / exportState.progress.total) * 100 : 0}
                  className="h-2"
                />
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                {exportState.progress.message}
              </div>
            </div>

            <div className="flex justify-center">
              <Button variant="outline" onClick={handleCancel}>
                Cancel Export
              </Button>
            </div>
          </div>
        )

      case 'complete':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="p-4 bg-green-100 rounded-lg inline-block mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Export Complete</h3>
              <p className="text-muted-foreground">
                Your export has been prepared successfully
              </p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Records:</span>
                  <span className="ml-2 font-semibold">{exportState.progress.current}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Format:</span>
                  <span className="ml-2 font-semibold">{exportOptions.format.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {hasError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {exportState.progress.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleDownload} disabled={!exportState.downloadUrl}>
                <Download className="h-4 w-4 mr-2" />
                Download Export
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${className}`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                {currentView === 'options' && <Settings className="h-5 w-5 text-primary" />}
                {currentView === 'progress' && <FileText className="h-5 w-5 text-primary" />}
                {currentView === 'complete' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </div>
              <div>
                <DialogTitle>
                  {currentView === 'options' && 'Export Options'}
                  {currentView === 'progress' && 'Exporting Data'}
                  {currentView === 'complete' && 'Export Complete'}
                </DialogTitle>
                <DialogDescription>
                  {currentView === 'options' && `Configure export settings for ${tableType} data`}
                  {currentView === 'progress' && 'Please wait while we prepare your export'}
                  {currentView === 'complete' && 'Your export is ready for download'}
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="py-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}