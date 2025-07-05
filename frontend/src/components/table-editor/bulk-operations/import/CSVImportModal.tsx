import { useState, useCallback } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  FileText, 
  Settings, 
  Copy, 
  CheckCircle2, 
  AlertTriangle,
  X,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { FileUploadZone } from './FileUploadZone'
import { PreviewTable } from './PreviewTable'
import { ColumnMapper } from './ColumnMapper'
import { ValidationDisplay } from './ValidationDisplay'
import { DuplicateResolution } from './DuplicateResolution'
import { duplicateDetector } from '../utils/duplicateDetector'
import type { 
  CSVParseResult, 
  ColumnMapping, 
  DuplicateMatch, 
  VRPTableType 
} from '../types/shared.types'

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  tableType: VRPTableType
  existingData: any[]
  onImport: (data: any[], mappings: ColumnMapping[]) => Promise<void>
  className?: string
}

type ImportStep = 'upload' | 'preview' | 'mapping' | 'validation' | 'duplicates' | 'importing' | 'complete'

interface ImportState {
  step: ImportStep
  file: File | null
  parseResult: CSVParseResult | null
  columnMappings: ColumnMapping[]
  duplicates: DuplicateMatch[]
  progress: number
  error: string | null
  importStats: {
    totalRows: number
    processedRows: number
    successfulRows: number
    errorRows: number
    skippedRows: number
  } | null
}

export function CSVImportModal({
  isOpen,
  onClose,
  tableType,
  existingData,
  onImport,
  className
}: CSVImportModalProps) {
  const [state, setState] = useState<ImportState>({
    step: 'upload',
    file: null,
    parseResult: null,
    columnMappings: [],
    duplicates: [],
    progress: 0,
    error: null,
    importStats: null
  })

  // Reset state when modal opens/closes
  const handleClose = useCallback(() => {
    setState({
      step: 'upload',
      file: null,
      parseResult: null,
      columnMappings: [],
      duplicates: [],
      progress: 0,
      error: null,
      importStats: null
    })
    onClose()
  }, [onClose])

  // Handle file upload and parsing
  const handleFileProcessed = useCallback((parseResult: CSVParseResult, file: File) => {
    setState(prev => ({
      ...prev,
      file,
      parseResult,
      step: 'preview',
      error: null
    }))
  }, [])

  // Handle file removal
  const handleFileRemoved = useCallback(() => {
    setState(prev => ({
      ...prev,
      file: null,
      parseResult: null,
      step: 'upload',
      error: null
    }))
  }, [])

  // Move to column mapping step
  const handleProceedToMapping = useCallback(() => {
    if (!state.parseResult) return
    
    setState(prev => ({
      ...prev,
      step: 'mapping'
    }))
  }, [state.parseResult])

  // Handle column mapping changes
  const handleMappingChange = useCallback((mappings: ColumnMapping[]) => {
    setState(prev => ({
      ...prev,
      columnMappings: mappings
    }))
  }, [])

  // Move to validation step
  const handleProceedToValidation = useCallback(() => {
    setState(prev => ({
      ...prev,
      step: 'validation'
    }))
  }, [])

  // Move to duplicate resolution step
  const handleProceedToDuplicates = useCallback(async () => {
    if (!state.parseResult) return

    try {
      // Detect duplicates
      const detectionResult = duplicateDetector.detectDuplicates(
        state.parseResult.data,
        existingData,
        tableType
      )

      setState(prev => ({
        ...prev,
        duplicates: detectionResult.duplicates,
        step: 'duplicates'
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to detect duplicates'
      }))
    }
  }, [state.parseResult, existingData, tableType])

  // Handle duplicate resolution changes
  const handleDuplicateResolutionChange = useCallback((duplicates: DuplicateMatch[]) => {
    setState(prev => ({
      ...prev,
      duplicates
    }))
  }, [])

  // Start import process
  const handleStartImport = useCallback(async () => {
    if (!state.parseResult) return

    setState(prev => ({
      ...prev,
      step: 'importing',
      progress: 0,
      importStats: {
        totalRows: state.parseResult!.data.length,
        processedRows: 0,
        successfulRows: 0,
        errorRows: 0,
        skippedRows: 0
      }
    }))

    try {
      // Process data based on duplicate resolutions
      const dataToImport: any[] = []
      let processedRows = 0
      let successfulRows = 0
      let errorRows = 0
      let skippedRows = 0

      for (let i = 0; i < state.parseResult.data.length; i++) {
        const row = state.parseResult.data[i]
        const duplicate = state.duplicates.find(d => d.importRowIndex === i)

        // Update progress
        processedRows++
        setState(prev => ({
          ...prev,
          progress: Math.round((processedRows / state.parseResult!.data.length) * 100),
          importStats: prev.importStats ? {
            ...prev.importStats,
            processedRows,
            successfulRows,
            errorRows,
            skippedRows
          } : null
        }))

        // Handle duplicate resolution
        if (duplicate) {
          switch (duplicate.resolution) {
            case 'skip':
              skippedRows++
              continue
            case 'replace':
              // Add replace logic here - for now, treat as create
              dataToImport.push(row)
              successfulRows++
              break
            case 'create':
            default:
              dataToImport.push(row)
              successfulRows++
              break
          }
        } else {
          dataToImport.push(row)
          successfulRows++
        }

        // Simulate processing delay for UX
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }

      // Final stats update
      setState(prev => ({
        ...prev,
        importStats: {
          totalRows: state.parseResult!.data.length,
          processedRows,
          successfulRows,
          errorRows,
          skippedRows
        }
      }))

      // Call the import handler
      await onImport(dataToImport, state.columnMappings)

      setState(prev => ({
        ...prev,
        step: 'complete',
        progress: 100
      }))

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Import failed',
        step: 'validation' // Go back to validation step
      }))
    }
  }, [state.parseResult, state.duplicates, state.columnMappings, onImport])

  // Get step information
  const getStepInfo = (step: ImportStep) => {
    const steps = {
      upload: { title: 'Upload File', icon: Upload, description: 'Select and upload your CSV file' },
      preview: { title: 'Preview Data', icon: FileText, description: 'Review your data before import' },
      mapping: { title: 'Map Columns', icon: Settings, description: 'Map CSV columns to table fields' },
      validation: { title: 'Validate Data', icon: AlertTriangle, description: 'Review validation results' },
      duplicates: { title: 'Resolve Duplicates', icon: Copy, description: 'Handle duplicate records' },
      importing: { title: 'Importing', icon: Loader2, description: 'Processing your data...' },
      complete: { title: 'Complete', icon: CheckCircle2, description: 'Import completed successfully' }
    }
    return steps[step]
  }

  // Check if current step can proceed
  const canProceed = () => {
    switch (state.step) {
      case 'preview':
        return state.parseResult && state.parseResult.data.length > 0
      case 'mapping':
        const requiredFieldsMapped = state.columnMappings.filter(m => m.isRequired).length > 0
        return state.columnMappings.length > 0 && requiredFieldsMapped
      case 'validation':
        return state.parseResult && state.parseResult.errors.length === 0
      case 'duplicates':
        const unresolvedDuplicates = state.duplicates.filter(d => !d.resolution).length
        return unresolvedDuplicates === 0
      default:
        return false
    }
  }

  // Get next step action
  const getNextStepAction = () => {
    switch (state.step) {
      case 'preview':
        return { text: 'Map Columns', action: handleProceedToMapping }
      case 'mapping':
        return { text: 'Validate Data', action: handleProceedToValidation }
      case 'validation':
        return { text: 'Check Duplicates', action: handleProceedToDuplicates }
      case 'duplicates':
        return { text: 'Start Import', action: handleStartImport }
      default:
        return null
    }
  }

  const stepInfo = getStepInfo(state.step)
  const nextStepAction = getNextStepAction()
  const StepIcon = stepInfo.icon

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`max-w-6xl max-h-[90vh] ${className}`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <StepIcon className={`h-5 w-5 text-primary ${state.step === 'importing' ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <DialogTitle>{stepInfo.title}</DialogTitle>
                <DialogDescription>{stepInfo.description}</DialogDescription>
              </div>
            </div>
            <Badge variant="outline">
              {tableType} Import
            </Badge>
          </div>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Import Progress</span>
            <span>Step {['upload', 'preview', 'mapping', 'validation', 'duplicates', 'importing', 'complete'].indexOf(state.step) + 1} of 7</span>
          </div>
          <Progress 
            value={state.step === 'importing' ? state.progress : 
                   (['upload', 'preview', 'mapping', 'validation', 'duplicates', 'importing', 'complete'].indexOf(state.step) / 6) * 100} 
            className="h-2" 
          />
        </div>

        <Separator />

        {/* Error Display */}
        {state.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <div className="flex-1 overflow-auto min-h-96">
          {state.step === 'upload' && (
            <FileUploadZone
              tableType={tableType}
              onFileProcessed={handleFileProcessed}
              onFileRemoved={handleFileRemoved}
            />
          )}

          {state.step === 'preview' && state.parseResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Data Preview</h3>
                <Badge variant="secondary">
                  {state.parseResult.data.length} rows, {state.parseResult.headers.length} columns
                </Badge>
              </div>
              <PreviewTable parseResult={state.parseResult} />
            </div>
          )}

          {state.step === 'mapping' && state.parseResult && (
            <ColumnMapper
              parseResult={state.parseResult}
              tableType={tableType}
              onMappingChange={handleMappingChange}
            />
          )}

          {state.step === 'validation' && state.parseResult && (
            <ValidationDisplay
              parseResult={state.parseResult}
              duplicates={state.duplicates}
            />
          )}

          {state.step === 'duplicates' && (
            <DuplicateResolution
              duplicates={state.duplicates}
              importData={state.parseResult?.data || []}
              existingData={existingData}
              tableType={tableType}
              onResolutionChange={handleDuplicateResolutionChange}
            />
          )}

          {state.step === 'importing' && state.importStats && (
            <div className="space-y-6 text-center py-8">
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <h3 className="text-lg font-semibold">Importing Data...</h3>
                <p className="text-muted-foreground">
                  Processing {state.importStats.processedRows} of {state.importStats.totalRows} rows
                </p>
              </div>
              
              <div className="space-y-2">
                <Progress value={state.progress} className="h-3" />
                <div className="text-sm text-muted-foreground">
                  {state.progress}% complete
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{state.importStats.successfulRows}</div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-500">{state.importStats.skippedRows}</div>
                  <div className="text-sm text-muted-foreground">Skipped</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{state.importStats.errorRows}</div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{state.importStats.processedRows}</div>
                  <div className="text-sm text-muted-foreground">Processed</div>
                </div>
              </div>
            </div>
          )}

          {state.step === 'complete' && state.importStats && (
            <div className="space-y-6 text-center py-8">
              <div className="space-y-4">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                <h3 className="text-xl font-semibold">Import Completed Successfully!</h3>
                <p className="text-muted-foreground">
                  Your data has been imported into the {tableType} table.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{state.importStats.successfulRows}</div>
                  <div className="text-sm text-muted-foreground">Records Added</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-500">{state.importStats.skippedRows}</div>
                  <div className="text-sm text-muted-foreground">Skipped</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{state.importStats.errorRows}</div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{state.importStats.totalRows}</div>
                  <div className="text-sm text-muted-foreground">Total Rows</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {state.file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{state.file.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {(state.file.size / 1024 / 1024).toFixed(1)} MB
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleClose}>
                {state.step === 'complete' ? 'Close' : 'Cancel'}
              </Button>
              
              {nextStepAction && (
                <Button 
                  onClick={nextStepAction.action} 
                  disabled={!canProceed()}
                  className="gap-2"
                >
                  {nextStepAction.text}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}