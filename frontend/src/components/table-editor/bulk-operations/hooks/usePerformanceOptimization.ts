import { useState, useCallback, useMemo, useRef, useEffect } from 'react'

interface PerformanceMetrics {
  renderTime: number
  scrollPerformance: number
  memoryUsage: number
  operationLatency: number
}

interface OptimizationConfig {
  enableVirtualization: boolean
  chunkSize: number
  debounceDelay: number
  enableMemoization: boolean
  enableWorkers: boolean
  maxMemoryUsage: number
}

interface PerformanceState {
  isOptimized: boolean
  metrics: PerformanceMetrics
  config: OptimizationConfig
  warnings: string[]
}

export function usePerformanceOptimization(dataSize: number) {
  const [performanceState, setPerformanceState] = useState<PerformanceState>({
    isOptimized: false,
    metrics: {
      renderTime: 0,
      scrollPerformance: 0,
      memoryUsage: 0,
      operationLatency: 0
    },
    config: {
      enableVirtualization: dataSize > 1000,
      chunkSize: Math.min(Math.max(Math.floor(dataSize / 10), 100), 1000),
      debounceDelay: dataSize > 5000 ? 300 : 150,
      enableMemoization: true,
      enableWorkers: dataSize > 500,
      maxMemoryUsage: 100 * 1024 * 1024 // 100MB
    },
    warnings: []
  })

  const performanceObserverRef = useRef<PerformanceObserver | null>(null)
  const renderStartTime = useRef<number>(0)

  // Auto-optimize based on data size
  const autoOptimize = useCallback(() => {
    const warnings: string[] = []
    const config: OptimizationConfig = { ...performanceState.config }

    // Adjust chunk size based on data size
    if (dataSize > 10000) {
      config.chunkSize = 500
      config.debounceDelay = 500
      warnings.push('Large dataset detected: Increased chunk processing and debounce delay')
    } else if (dataSize > 5000) {
      config.chunkSize = 250
      config.debounceDelay = 300
      warnings.push('Medium dataset detected: Moderate optimization applied')
    }

    // Enable/disable features based on performance requirements
    if (dataSize > 1000) {
      config.enableVirtualization = true
      if (dataSize > 2000) {
        warnings.push('Virtualization enabled for large dataset')
      }
    }

    if (dataSize > 500) {
      config.enableWorkers = true
      if (dataSize > 1000) {
        warnings.push('Web Workers enabled for background processing')
      }
    }

    setPerformanceState(prev => ({
      ...prev,
      isOptimized: true,
      config,
      warnings
    }))
  }, [dataSize, performanceState.config])

  // Monitor performance metrics
  const startPerformanceMonitoring = useCallback(() => {
    if (!window.performance || !window.PerformanceObserver) {
      return
    }

    // Monitor paint and layout metrics
    performanceObserverRef.current = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          setPerformanceState(prev => ({
            ...prev,
            metrics: {
              ...prev.metrics,
              renderTime: entry.duration
            }
          }))
        }
      })
    })

    performanceObserverRef.current.observe({ 
      entryTypes: ['measure', 'navigation', 'paint'] 
    })
  }, [])

  // Stop performance monitoring
  const stopPerformanceMonitoring = useCallback(() => {
    if (performanceObserverRef.current) {
      performanceObserverRef.current.disconnect()
      performanceObserverRef.current = null
    }
  }, [])

  // Measure render performance
  const measureRenderTime = useCallback((operationName: string) => {
    renderStartTime.current = performance.now()
    
    return () => {
      const endTime = performance.now()
      const duration = endTime - renderStartTime.current
      
      performance.mark(`${operationName}-start`)
      performance.mark(`${operationName}-end`)
      performance.measure(operationName, `${operationName}-start`, `${operationName}-end`)
      
      setPerformanceState(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          operationLatency: duration
        }
      }))
    }
  }, [])

  // Memory usage monitoring
  const checkMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory
      const usedMemory = memoryInfo.usedJSHeapSize
      
      setPerformanceState(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          memoryUsage: usedMemory
        }
      }))

      // Warn about high memory usage
      if (usedMemory > performanceState.config.maxMemoryUsage) {
        setPerformanceState(prev => ({
          ...prev,
          warnings: [
            ...prev.warnings.filter(w => !w.includes('High memory usage')),
            `High memory usage detected: ${Math.round(usedMemory / 1024 / 1024)}MB`
          ]
        }))
      }
    }
  }, [performanceState.config.maxMemoryUsage])

  // Debounced function factory
  const createDebouncedFunction = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay?: number
  ): T => {
    const timeoutRef = useRef<NodeJS.Timeout>()
    
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        func(...args)
      }, delay || performanceState.config.debounceDelay)
    }) as T
  }, [performanceState.config.debounceDelay])

  // Chunked processing function
  const processInChunks = useCallback(async <T, R>(
    data: T[],
    processor: (chunk: T[]) => Promise<R[]> | R[],
    onProgress?: (progress: number) => void
  ): Promise<R[]> => {
    const results: R[] = []
    const chunkSize = performanceState.config.chunkSize
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      const chunkResults = await processor(chunk)
      results.push(...chunkResults)
      
      // Update progress
      if (onProgress) {
        const progress = Math.min(((i + chunkSize) / data.length) * 100, 100)
        onProgress(progress)
      }

      // Yield control to browser between chunks
      await new Promise(resolve => setTimeout(resolve, 0))
    }
    
    return results
  }, [performanceState.config.chunkSize])

  // Memoized data processing
  const memoizedProcessor = useCallback(<T, R>(
    processor: (data: T[]) => R,
    deps: any[]
  ) => {
    return useMemo(() => processor, deps)
  }, [])

  // Performance optimization recommendations
  const getOptimizationRecommendations = useCallback(() => {
    const recommendations: string[] = []
    
    if (dataSize > 1000 && !performanceState.config.enableVirtualization) {
      recommendations.push('Enable virtualization for better scroll performance')
    }
    
    if (dataSize > 500 && !performanceState.config.enableWorkers) {
      recommendations.push('Enable Web Workers for background processing')
    }
    
    if (performanceState.metrics.renderTime > 100) {
      recommendations.push('Consider reducing rendered elements or using memoization')
    }
    
    if (performanceState.metrics.memoryUsage > performanceState.config.maxMemoryUsage * 0.8) {
      recommendations.push('High memory usage detected - consider data pagination')
    }
    
    return recommendations
  }, [dataSize, performanceState])

  // Initialize performance monitoring
  useEffect(() => {
    autoOptimize()
    startPerformanceMonitoring()
    
    return () => {
      stopPerformanceMonitoring()
    }
  }, [autoOptimize, startPerformanceMonitoring, stopPerformanceMonitoring])

  // Periodic memory check
  useEffect(() => {
    const interval = setInterval(checkMemoryUsage, 5000) // Check every 5 seconds
    return () => clearInterval(interval)
  }, [checkMemoryUsage])

  return {
    performanceState,
    measureRenderTime,
    createDebouncedFunction,
    processInChunks,
    memoizedProcessor,
    getOptimizationRecommendations,
    checkMemoryUsage
  }
}