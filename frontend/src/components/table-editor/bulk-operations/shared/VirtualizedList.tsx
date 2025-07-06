import { memo, useMemo } from 'react'
import { useVirtualization } from '../hooks/useVirtualization'

interface VirtualizedListProps<T> {
  data: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  getItemKey: (item: T, index: number) => string | number
  overscan?: number
  scrollToIndex?: number
  className?: string
}

function VirtualizedListComponent<T>({
  data,
  itemHeight,
  containerHeight,
  renderItem,
  getItemKey,
  overscan = 5,
  scrollToIndex,
  className
}: VirtualizedListProps<T>) {
  const { virtualizedData, scrollElementProps, containerProps } = useVirtualization(
    data,
    {
      itemHeight,
      containerHeight,
      overscan,
      scrollToIndex
    }
  )

  // Memoize rendered items to prevent unnecessary re-renders
  const renderedItems = useMemo(() => {
    return virtualizedData.items.map((item, localIndex) => {
      const globalIndex = virtualizedData.startIndex + localIndex
      const key = getItemKey(item, globalIndex)
      
      return (
        <div
          key={key}
          style={{
            position: 'absolute',
            top: (virtualizedData.startIndex + localIndex) * itemHeight,
            left: 0,
            right: 0,
            height: itemHeight
          }}
        >
          {renderItem(item, globalIndex)}
        </div>
      )
    })
  }, [
    virtualizedData.items,
    virtualizedData.startIndex,
    itemHeight,
    renderItem,
    getItemKey
  ])

  return (
    <div
      {...scrollElementProps}
      className={`relative ${className}`}
      data-testid="virtualized-list-container"
    >
      <div {...containerProps}>
        {renderedItems}
      </div>
    </div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const VirtualizedList = memo(VirtualizedListComponent) as <T>(
  props: VirtualizedListProps<T>
) => JSX.Element