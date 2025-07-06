import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Cpu, 
  Pause, 
  Play, 
  Square, 
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react'
import { usePerformanceOptimization } from '../hooks/usePerformanceOptimization'

interface DataProcessorProps<T, R> {
  data: T[]
  processor: (chunk: T[]) => Promise<R[]> | R[]
  onComplete: (results: R[]) => void
  onError?: (error: Error) => void
  autoStart?: boolean
  title?: string
  description?: string
  className?: string
}

export function DataProcessor<T, R>({
  data,
  processor,
  onComplete,
  onError,
  autoStart = false,
  title = 'Processing Data',
  description = 'Processing large dataset in optimized chunks',
  className
}: DataProcessorProps<T, R>) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<R[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [processingTime, setProcessingTime] = useState<number>(0)
  const [startTime, setStartTime] = useState<number>(0)

  const {
    performanceState,
    processInChunks,
    measureRenderTime
  } = usePerformanceOptimization(data.length)

  // Process data in chunks
  const processData = useCallback(async () => {
    if (isProcessing || data.length === 0) return

    setIsProcessing(true)
    setIsPaused(false)
    setError(null)
    setResults([])
    setProgress(0)
    setStartTime(Date.now())

    const stopMeasuring = measureRenderTime('data-processing')

    try {
      const processedResults = await processInChunks(
        data,
        processor,
        (progressPercent) => {
          setProgress(progressPercent)
          setProcessingTime(Date.now() - startTime)
        }
      )

      setResults(processedResults)
      onComplete(processedResults)
      
      setProgress(100)
      setProcessingTime(Date.now() - startTime)
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Processing failed')
      setError(error)
      onError?.(error)
    } finally {
      setIsProcessing(false)
      stopMeasuring()
    }
  }, [data, processor, processInChunks, measureRenderTime, onComplete, onError, isProcessing, startTime])

  // Pause processing (simulation - actual implementation would need worker support)
  const pauseProcessing = useCallback(() => {
    setIsPaused(true)
  }, [])

  // Resume processing
  const resumeProcessing = useCallback(() => {
    setIsPaused(false)
  }, [])

  // Stop processing
  const stopProcessing = useCallback(() => {
    setIsProcessing(false)
    setIsPaused(false)
    setProgress(0)
    setResults([])
  }, [])

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && data.length > 0) {
      processData()
    }
  }, [autoStart, data.length, processData])

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const getProcessingSpeed = () => {
    if (processingTime === 0 || progress === 0) return 0
    const recordsProcessed = Math.floor((progress / 100) * data.length)
    return Math.round(recordsProcessed / (processingTime / 1000))
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isProcessing && (
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(processingTime)}
              </Badge>
            )}
            {performanceState.config.enableWorkers && (
              <Badge variant="outline" className="text-xs">
                Workers Enabled
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          {isProcessing && (
            <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
              <div>
                <span>Processed:</span>
                <span className="ml-1 font-semibold">
                  {Math.floor((progress / 100) * data.length).toLocaleString()}
                </span>
              </div>
              <div>
                <span>Remaining:</span>
                <span className="ml-1 font-semibold">
                  {(data.length - Math.floor((progress / 100) * data.length)).toLocaleString()}
                </span>
              </div>
              <div>
                <span>Speed:</span>
                <span className="ml-1 font-semibold">
                  {getProcessingSpeed().toLocaleString()}/s
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Configuration Display */}
        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Dataset Size:</span>
              <span className="ml-2 font-semibold">{data.length.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Chunk Size:</span>
              <span className="ml-2 font-semibold">{performanceState.config.chunkSize}</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-semibold">Processing Error</div>
                <div className="text-sm">{error.message}</div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Display */}
        {!isProcessing && !error && results.length > 0 && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-semibold">Processing Complete</div>
                <div className="text-sm">
                  Processed {results.length.toLocaleString()} records in {formatTime(processingTime)}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {!isProcessing && !error && results.length === 0 && 'Ready to process'}
            {isProcessing && !isPaused && 'Processing...'}
            {isProcessing && isPaused && 'Paused'}
            {error && 'Processing failed'}
            {!isProcessing && results.length > 0 && 'Processing complete'}
          </div>
          
          <div className="flex items-center gap-2">
            {!isProcessing && !error && (
              <Button onClick={processData} className="gap-2">
                <Play className="h-4 w-4" />
                Start Processing
              </Button>
            )}
            
            {isProcessing && !isPaused && (
              <Button variant="outline" onClick={pauseProcessing} className="gap-2">
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            )}
            
            {isProcessing && isPaused && (
              <Button onClick={resumeProcessing} className="gap-2">
                <Play className="h-4 w-4" />
                Resume
              </Button>
            )}
            
            {isProcessing && (
              <Button variant="destructive" onClick={stopProcessing} className="gap-2">
                <Square className="h-4 w-4" />
                Stop
              </Button>
            )}
            
            {error && (
              <Button onClick={processData} className="gap-2">
                <Play className="h-4 w-4" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}