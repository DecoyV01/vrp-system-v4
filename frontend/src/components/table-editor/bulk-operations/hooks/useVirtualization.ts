import { useState, useCallback, useMemo, useRef, useEffect } from 'react'

interface VirtualizationOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
  scrollToIndex?: number
}

interface VirtualizedData<T> {
  items: T[]
  startIndex: number
  endIndex: number
  totalHeight: number
  offsetY: number
}

export function useVirtualization<T>(
  data: T[],
  options: VirtualizationOptions
): {
  virtualizedData: VirtualizedData<T>
  scrollElementProps: {
    ref: React.RefObject<HTMLDivElement>
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void
    style: React.CSSProperties
  }
  containerProps: {
    style: React.CSSProperties
  }
} {
  const { itemHeight, containerHeight, overscan = 5, scrollToIndex } = options
  const [scrollTop, setScrollTop] = useState(0)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const itemsInView = Math.ceil(containerHeight / itemHeight)
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      data.length - 1,
      startIndex + itemsInView + overscan * 2
    )

    return { startIndex, endIndex, itemsInView }
  }, [scrollTop, containerHeight, itemHeight, overscan, data.length])

  // Get visible items
  const virtualizedData = useMemo((): VirtualizedData<T> => {
    const { startIndex, endIndex } = visibleRange
    const items = data.slice(startIndex, endIndex + 1)
    const totalHeight = data.length * itemHeight
    const offsetY = startIndex * itemHeight

    return {
      items,
      startIndex,
      endIndex,
      totalHeight,
      offsetY
    }
  }, [data, visibleRange, itemHeight])

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    setScrollTop(scrollTop)
  }, [])

  // Scroll to specific index
  useEffect(() => {
    if (scrollToIndex !== undefined && scrollElementRef.current) {
      const targetScrollTop = scrollToIndex * itemHeight
      scrollElementRef.current.scrollTop = targetScrollTop
      setScrollTop(targetScrollTop)
    }
  }, [scrollToIndex, itemHeight])

  return {
    virtualizedData,
    scrollElementProps: {
      ref: scrollElementRef,
      onScroll: handleScroll,
      style: {
        height: containerHeight,
        overflow: 'auto'
      }
    },
    containerProps: {
      style: {
        height: virtualizedData.totalHeight,
        position: 'relative'
      }
    }
  }
}