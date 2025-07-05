import { useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Loader2,
  TrendingUp,
  Activity,
  Download,
  X
} from 'lucide-react'

export interface ProgressStep {
  id: string
  label: string
  status: 'pending' | 'in_progress' | 'completed' | 'error' | 'skipped'
  progress?: number
  startTime?: Date
  endTime?: Date
  details?: string
  errorMessage?: string
}

export interface ProgressStats {
  totalItems: number
  processedItems: number
  successfulItems: number
  errorItems: number
  skippedItems: number
  estimatedTimeRemaining?: number
  processingRate?: number
}

interface ProgressTrackerProps {
  title: string
  description?: string
  steps: ProgressStep[]
  stats?: ProgressStats
  overallProgress: number
  isComplete: boolean
  canCancel?: boolean
  canDownloadLog?: boolean
  onCancel?: () => void
  onDownloadLog?: () => void
  className?: string
}

export function ProgressTracker({
  title,
  description,
  steps,
  stats,
  overallProgress,
  isComplete,
  canCancel = false,
  canDownloadLog = false,
  onCancel,
  onDownloadLog,
  className
}: ProgressTrackerProps) {
  // Calculate step metrics
  const stepMetrics = useMemo(() => {
    const completed = steps.filter(s => s.status === 'completed').length
    const errors = steps.filter(s => s.status === 'error').length
    const inProgress = steps.filter(s => s.status === 'in_progress').length
    const pending = steps.filter(s => s.status === 'pending').length
    const skipped = steps.filter(s => s.status === 'skipped').length

    return { completed, errors, inProgress, pending, skipped, total: steps.length }
  }, [steps])

  // Format time estimates
  const formatTimeEstimate = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h`
  }

  // Format processing rate
  const formatRate = (rate: number): string => {
    if (rate < 1) return `${(rate * 60).toFixed(1)}/min`
    return `${rate.toFixed(1)}/s`
  }

  // Get step icon
  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      case 'skipped':
        return <X className="h-4 w-4 text-gray-400" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  // Get step badge variant
  const getStepBadgeVariant = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed':
        return 'default' as const
      case 'in_progress':
        return 'secondary' as const
      case 'error':
        return 'destructive' as const
      case 'skipped':
        return 'outline' as const
      default:
        return 'secondary' as const
    }
  }

  // Calculate step duration
  const getStepDuration = (step: ProgressStep): string => {
    if (!step.startTime) return ''
    const endTime = step.endTime || new Date()
    const duration = Math.round((endTime.getTime() - step.startTime.getTime()) / 1000)
    return formatTimeEstimate(duration)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Activity className="h-5 w-5 text-blue-500" />
                )}
                {title}
              </CardTitle>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {canDownloadLog && onDownloadLog && (
                <Button variant="outline" size="sm" onClick={onDownloadLog} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Log
                </Button>
              )}
              {canCancel && onCancel && !isComplete && (
                <Button variant="outline" size="sm" onClick={onCancel} className="gap-2">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              )}
              <Badge variant={isComplete ? "default" : "secondary"}>
                {Math.round(overallProgress)}% Complete
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Overall Progress */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>

            {/* Statistics */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.successfulItems}</div>
                  <div className="text-xs text-muted-foreground">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.errorItems}</div>
                  <div className="text-xs text-muted-foreground">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-500">{stats.skippedItems}</div>
                  <div className="text-xs text-muted-foreground">Skipped</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.processedItems}</div>
                  <div className="text-xs text-muted-foreground">Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.totalItems}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            )}

            {/* Processing Rate & Time Estimate */}
            {stats && (stats.processingRate || stats.estimatedTimeRemaining) && (
              <div className="flex items-center justify-center gap-6 pt-2 text-sm text-muted-foreground">
                {stats.processingRate && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>{formatRate(stats.processingRate)}</span>
                  </div>
                )}
                {stats.estimatedTimeRemaining && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatTimeEstimate(stats.estimatedTimeRemaining)} remaining</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Process Steps</CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{stepMetrics.completed} of {stepMetrics.total} completed</span>
            {stepMetrics.errors > 0 && (
              <span className="text-destructive">{stepMetrics.errors} errors</span>
            )}
            {stepMetrics.skipped > 0 && (
              <span>{stepMetrics.skipped} skipped</span>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-3 p-3 rounded-lg border">
                {/* Step Number */}
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>

                {/* Step Icon */}
                <div className="flex-shrink-0">
                  {getStepIcon(step)}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{step.label}</span>
                    <Badge variant={getStepBadgeVariant(step.status)} className="text-xs">
                      {step.status.replace('_', ' ')}
                    </Badge>
                    {step.status === 'completed' && (
                      <span className="text-xs text-muted-foreground">
                        ({getStepDuration(step)})
                      </span>
                    )}
                  </div>

                  {/* Step Progress Bar */}
                  {step.status === 'in_progress' && step.progress !== undefined && (
                    <div className="mb-2">
                      <Progress value={step.progress} className="h-1" />
                    </div>
                  )}

                  {/* Step Details */}
                  {step.details && (
                    <p className="text-xs text-muted-foreground">{step.details}</p>
                  )}

                  {/* Error Message */}
                  {step.status === 'error' && step.errorMessage && (
                    <p className="text-xs text-destructive mt-1">{step.errorMessage}</p>
                  )}
                </div>

                {/* Step Status Indicator */}
                <div className="flex-shrink-0">
                  {step.status === 'in_progress' && step.progress !== undefined && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {Math.round(step.progress)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary for completed operations */}
      {isComplete && stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Operation Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="text-lg font-bold text-green-600">{stats.successfulItems}</div>
                  <div className="text-sm text-green-700 dark:text-green-300">Successful</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <div className="text-lg font-bold text-red-600">{stats.errorItems}</div>
                  <div className="text-sm text-red-700 dark:text-red-300">Errors</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20">
                  <div className="text-lg font-bold text-gray-600">{stats.skippedItems}</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">Skipped</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="text-lg font-bold text-blue-600">{stats.totalItems}</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Total</div>
                </div>
              </div>

              {stepMetrics.errors === 0 && stepMetrics.total > 0 && (
                <div className="text-center py-2">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-green-600 font-medium">
                    All steps completed successfully!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}