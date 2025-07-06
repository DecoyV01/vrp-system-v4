import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  Zap, 
  Memory, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  Settings
} from 'lucide-react'
import { usePerformanceOptimization } from '../hooks/usePerformanceOptimization'

interface PerformanceMonitorProps {
  dataSize: number
  isVisible: boolean
  onToggle: () => void
  className?: string
}

export function PerformanceMonitor({
  dataSize,
  isVisible,
  onToggle,
  className
}: PerformanceMonitorProps) {
  const {
    performanceState,
    getOptimizationRecommendations,
    checkMemoryUsage
  } = usePerformanceOptimization(dataSize)

  const [isExpanded, setIsExpanded] = useState(false)

  const formatMemory = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const formatTime = (ms: number) => {
    return `${ms.toFixed(1)} ms`
  }

  const getPerformanceStatus = () => {
    const { renderTime, memoryUsage } = performanceState.metrics
    const maxMemory = performanceState.config.maxMemoryUsage
    
    if (renderTime > 200 || memoryUsage > maxMemory * 0.9) {
      return { status: 'poor', color: 'red', icon: AlertTriangle }
    } else if (renderTime > 100 || memoryUsage > maxMemory * 0.7) {
      return { status: 'moderate', color: 'yellow', icon: Activity }
    } else {
      return { status: 'good', color: 'green', icon: CheckCircle2 }
    }
  }

  const performanceStatus = getPerformanceStatus()
  const recommendations = getOptimizationRecommendations()

  if (!isVisible) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          className="gap-2 bg-background shadow-lg"
        >
          <Activity className="h-4 w-4" />
          Performance
        </Button>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 w-80 ${className}`}>
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <performanceStatus.icon 
                className={`h-5 w-5 text-${performanceStatus.color}-600`} 
              />
              <CardTitle className="text-base">Performance Monitor</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={performanceStatus.status === 'good' ? 'default' : 'destructive'}
                className="capitalize"
              >
                {performanceStatus.status}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Render Time</span>
              </div>
              <span className="font-semibold">
                {formatTime(performanceState.metrics.renderTime)}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Memory className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Memory</span>
              </div>
              <span className="font-semibold">
                {formatMemory(performanceState.metrics.memoryUsage)}
              </span>
            </div>
          </div>

          {/* Memory Usage Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Memory Usage</span>
              <span>
                {Math.round((performanceState.metrics.memoryUsage / performanceState.config.maxMemoryUsage) * 100)}%
              </span>
            </div>
            <Progress 
              value={(performanceState.metrics.memoryUsage / performanceState.config.maxMemoryUsage) * 100}
              className="h-2"
            />
          </div>

          {/* Dataset Info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Dataset Size:</span>
              <span className="font-semibold">{dataSize.toLocaleString()} records</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Optimizations:</span>
              <div className="flex items-center gap-1">
                {performanceState.config.enableVirtualization && (
                  <Badge variant="outline" className="text-xs">Virtual</Badge>
                )}
                {performanceState.config.enableWorkers && (
                  <Badge variant="outline" className="text-xs">Workers</Badge>
                )}
                {performanceState.config.enableMemoization && (
                  <Badge variant="outline" className="text-xs">Memo</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="space-y-4 border-t pt-4">
              {/* Configuration */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Configuration</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Chunk Size:</span>
                    <span className="ml-2">{performanceState.config.chunkSize}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Debounce:</span>
                    <span className="ml-2">{performanceState.config.debounceDelay}ms</span>
                  </div>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Detailed Metrics</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Operation Latency:</span>
                    <span>{formatTime(performanceState.metrics.operationLatency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scroll Performance:</span>
                    <span>{formatTime(performanceState.metrics.scrollPerformance)}</span>
                  </div>
                </div>
              </div>

              {/* Manual Actions */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Actions</h4>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={checkMemoryUsage}
                    className="text-xs"
                  >
                    Check Memory
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.gc && window.gc()}
                    className="text-xs"
                    disabled={!window.gc}
                  >
                    Force GC
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {performanceState.warnings.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <div className="space-y-1">
                  {performanceState.warnings.slice(0, 2).map((warning, index) => (
                    <div key={index}>{warning}</div>
                  ))}
                  {performanceState.warnings.length > 2 && (
                    <div className="text-muted-foreground">
                      +{performanceState.warnings.length - 2} more warnings
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <div className="space-y-1">
                  <div className="font-semibold">Performance Tips:</div>
                  {recommendations.slice(0, 2).map((rec, index) => (
                    <div key={index}>• {rec}</div>
                  ))}
                  {recommendations.length > 2 && (
                    <div className="text-muted-foreground">
                      +{recommendations.length - 2} more recommendations
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}