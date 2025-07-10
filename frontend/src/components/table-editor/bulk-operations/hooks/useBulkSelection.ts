import { useState, useCallback, useMemo } from 'react'
import type { SelectionState } from '../types/shared.types'

interface UseBulkSelectionOptions {
  data: any[]
  maxSelection?: number
  onSelectionChange?: (selectedIds: string[]) => void
}

interface SelectionStatus {
  selectedCount: number
  totalCount: number
  isAllSelected: boolean
  isIndeterminate: boolean
  hasSelection: boolean
  isMaxSelection: boolean
}

export const useBulkSelection = ({
  data,
  maxSelection = 1000,
  onSelectionChange,
}: UseBulkSelectionOptions) => {
  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedRows: new Set<string>(),
    selectionMode: 'none',
    lastSelectedIndex: undefined,
    isAllSelected: false,
    isIndeterminate: false,
  })

  // Calculate selection status
  const selectionStatus: SelectionStatus = useMemo(() => {
    const selectedCount = selectionState.selectedRows.size
    const totalCount = data.length

    return {
      selectedCount,
      totalCount,
      isAllSelected: selectedCount > 0 && selectedCount === totalCount,
      isIndeterminate: selectedCount > 0 && selectedCount < totalCount,
      hasSelection: selectedCount > 0,
      isMaxSelection: selectedCount >= maxSelection,
    }
  }, [selectionState.selectedRows, data.length, maxSelection])

  // Toggle single row selection with enhanced accessibility
  const toggleRowSelection = useCallback(
    (
      rowId: string,
      isSelected: boolean,
      event?: React.MouseEvent | React.KeyboardEvent
    ) => {
      // Prevent event bubbling to avoid conflicts with row click handlers
      if (event) {
        event.stopPropagation()
      }

      setSelectionState(prev => {
        const newSelected = new Set(prev.selectedRows)

        if (isSelected && !prev.selectedRows.has(rowId)) {
          if (newSelected.size >= maxSelection) {
            // Show warning about max selection reached
            console.warn(`Maximum selection of ${maxSelection} rows reached`)
            return prev
          }
          newSelected.add(rowId)
        } else if (!isSelected && prev.selectedRows.has(rowId)) {
          newSelected.delete(rowId)
        }

        const newState = {
          ...prev,
          selectedRows: newSelected,
          selectionMode:
            newSelected.size > 0 ? ('multi' as const) : ('none' as const),
          isAllSelected: newSelected.size === data.length && data.length > 0,
          isIndeterminate:
            newSelected.size > 0 && newSelected.size < data.length,
        }

        onSelectionChange?.(Array.from(newSelected))
        return newState
      })
    },
    [maxSelection, onSelectionChange, data.length]
  )

  // Select all rows (up to max limit)
  const selectAll = useCallback(() => {
    const allIds = data
      .slice(0, maxSelection)
      .map(item => item._id)
      .filter(Boolean)
    const newSelected = new Set(allIds)

    setSelectionState(prev => ({
      ...prev,
      selectedRows: newSelected,
      selectionMode: 'multi',
      isAllSelected: allIds.length === data.length,
      isIndeterminate: false,
    }))

    onSelectionChange?.(allIds)
  }, [data, maxSelection, onSelectionChange])

  // Clear all selection
  const clearSelection = useCallback(() => {
    setSelectionState(prev => ({
      ...prev,
      selectedRows: new Set(),
      selectionMode: 'none',
      isAllSelected: false,
      isIndeterminate: false,
      lastSelectedIndex: undefined,
    }))

    onSelectionChange?.([])
  }, [onSelectionChange])

  // Select filtered rows (when table has filters applied)
  const selectFiltered = useCallback(
    (filteredData: any[]) => {
      const filteredIds = filteredData
        .slice(0, maxSelection)
        .map(item => item._id)
        .filter(Boolean)
      const newSelected = new Set(filteredIds)

      setSelectionState(prev => ({
        ...prev,
        selectedRows: newSelected,
        selectionMode: 'multi',
        isAllSelected: filteredIds.length === data.length,
        isIndeterminate:
          filteredIds.length > 0 && filteredIds.length < data.length,
      }))

      onSelectionChange?.(filteredIds)
    },
    [data.length, maxSelection, onSelectionChange]
  )

  // Range selection (Shift+click support)
  const selectRange = useCallback(
    (fromIndex: number, toIndex: number) => {
      const startIndex = Math.min(fromIndex, toIndex)
      const endIndex = Math.max(fromIndex, toIndex)
      const rangeData = data.slice(startIndex, endIndex + 1)
      const rangeIds = rangeData.map(item => item._id).filter(Boolean)

      setSelectionState(prev => {
        const newSelected = new Set(prev.selectedRows)

        // Add range ids up to max limit
        rangeIds.forEach(id => {
          if (newSelected.size < maxSelection) {
            newSelected.add(id)
          }
        })

        const newState = {
          ...prev,
          selectedRows: newSelected,
          selectionMode:
            newSelected.size > 0 ? ('multi' as const) : ('none' as const),
          lastSelectedIndex: toIndex,
          isAllSelected: newSelected.size === data.length && data.length > 0,
          isIndeterminate:
            newSelected.size > 0 && newSelected.size < data.length,
        }

        onSelectionChange?.(Array.from(newSelected))
        return newState
      })
    },
    [data, maxSelection, onSelectionChange]
  )

  // Check if specific row is selected
  const isRowSelected = useCallback(
    (rowId: string) => {
      return selectionState.selectedRows.has(rowId)
    },
    [selectionState.selectedRows]
  )

  // Get selected row data
  const getSelectedData = useCallback(() => {
    return data.filter(item => selectionState.selectedRows.has(item._id))
  }, [data, selectionState.selectedRows])

  // Get selected IDs as array
  const getSelectedIds = useCallback(() => {
    return Array.from(selectionState.selectedRows)
  }, [selectionState.selectedRows])

  return {
    selectionState,
    selectionStatus,
    toggleRowSelection,
    selectAll,
    clearSelection,
    selectFiltered,
    selectRange,
    isRowSelected,
    getSelectedData,
    getSelectedIds,
  }
}
