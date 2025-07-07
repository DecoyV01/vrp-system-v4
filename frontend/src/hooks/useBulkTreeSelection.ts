import { useState, useCallback, useMemo } from 'react'
import type { TreeNode } from './useTreeNavigation'

export interface TreeSelectionState {
  selectedNodeIds: Set<string>
  selectionMode: 'none' | 'single' | 'multi'
  lastSelectedNodeId?: string
  isAllSelected: boolean
  isIndeterminate: boolean
}

export interface TreeSelectionStatus {
  selectedCount: number
  totalSelectableCount: number
  isAllSelected: boolean
  isIndeterminate: boolean
  hasSelection: boolean
  isMaxSelection: boolean
  selectedByType: {
    scenarios: number
    datasets: number
  }
}

export interface TreeBulkSelectionOptions {
  treeData: TreeNode[]
  maxSelection?: number
  selectableTypes?: ('scenario' | 'dataset')[]
  onSelectionChange?: (selectedNodeIds: string[], selectedNodes: TreeNode[]) => void
}

export interface UseBulkTreeSelectionReturn {
  // State
  selectionState: TreeSelectionState
  selectionStatus: TreeSelectionStatus
  
  // Actions
  toggleNodeSelection: (nodeId: string, isSelected: boolean, withModifiers?: { ctrl?: boolean, shift?: boolean }) => void
  selectAll: (nodeType?: 'scenario' | 'dataset') => void
  clearSelection: () => void
  selectAllInParent: (parentNodeId: string) => void
  
  // Helpers
  isNodeSelected: (nodeId: string) => boolean
  isNodeSelectable: (node: TreeNode) => boolean
  getSelectedNodes: () => TreeNode[]
  getSelectedNodeIds: () => string[]
  getSelectableNodes: () => TreeNode[]
}

/**
 * Custom hook for managing bulk selection in tree structures
 * Specifically designed for VRP hierarchy: Projects > Scenarios > Datasets
 * Only scenarios and datasets are selectable for bulk operations
 */
export const useBulkTreeSelection = ({
  treeData,
  maxSelection = 1000,
  selectableTypes = ['scenario', 'dataset'],
  onSelectionChange
}: TreeBulkSelectionOptions): UseBulkTreeSelectionReturn => {
  
  // Core selection state
  const [selectionState, setSelectionState] = useState<TreeSelectionState>({
    selectedNodeIds: new Set<string>(),
    selectionMode: 'none',
    lastSelectedNodeId: undefined,
    isAllSelected: false,
    isIndeterminate: false
  })

  // Flatten tree to get all selectable nodes
  const selectableNodes = useMemo(() => {
    const flatten = (nodes: TreeNode[]): TreeNode[] => {
      const result: TreeNode[] = []
      
      const traverse = (nodeList: TreeNode[]) => {
        for (const node of nodeList) {
          // Add node if it's a selectable type
          if (selectableTypes.includes(node.type as any)) {
            result.push(node)
          }
          
          // Traverse children regardless of expansion state for selection purposes
          if (node.children && node.children.length > 0) {
            traverse(node.children)
          }
        }
      }
      
      traverse(nodes)
      return result
    }
    
    return flatten(treeData)
  }, [treeData, selectableTypes])

  // Calculate selection status with type breakdown
  const selectionStatus: TreeSelectionStatus = useMemo(() => {
    const selectedCount = selectionState.selectedNodeIds.size
    const totalSelectableCount = selectableNodes.length
    
    // Count selected nodes by type
    const selectedNodes = selectableNodes.filter(node => 
      selectionState.selectedNodeIds.has(node.id)
    )
    
    const selectedByType = {
      scenarios: selectedNodes.filter(node => node.type === 'scenario').length,
      datasets: selectedNodes.filter(node => node.type === 'dataset').length
    }
    
    return {
      selectedCount,
      totalSelectableCount,
      isAllSelected: selectedCount > 0 && selectedCount === totalSelectableCount,
      isIndeterminate: selectedCount > 0 && selectedCount < totalSelectableCount,
      hasSelection: selectedCount > 0,
      isMaxSelection: selectedCount >= maxSelection,
      selectedByType
    }
  }, [selectionState.selectedNodeIds, selectableNodes, maxSelection])

  // Check if a node is selectable
  const isNodeSelectable = useCallback((node: TreeNode): boolean => {
    return selectableTypes.includes(node.type as any)
  }, [selectableTypes])

  // Check if a specific node is selected
  const isNodeSelected = useCallback((nodeId: string): boolean => {
    return selectionState.selectedNodeIds.has(nodeId)
  }, [selectionState.selectedNodeIds])

  // Get currently selected nodes
  const getSelectedNodes = useCallback((): TreeNode[] => {
    return selectableNodes.filter(node => 
      selectionState.selectedNodeIds.has(node.id)
    )
  }, [selectableNodes, selectionState.selectedNodeIds])

  // Get selected node IDs as array
  const getSelectedNodeIds = useCallback((): string[] => {
    return Array.from(selectionState.selectedNodeIds)
  }, [selectionState.selectedNodeIds])

  // Get all selectable nodes
  const getSelectableNodes = useCallback((): TreeNode[] => {
    return selectableNodes
  }, [selectableNodes])

  // Toggle single node selection with modifier key support
  const toggleNodeSelection = useCallback((
    nodeId: string, 
    isSelected: boolean, 
    withModifiers: { ctrl?: boolean, shift?: boolean } = {}
  ) => {
    const node = selectableNodes.find(n => n.id === nodeId)
    if (!node || !isNodeSelectable(node)) {
      return
    }

    setSelectionState(prev => {
      let newSelected = new Set(prev.selectedNodeIds)
      
      // Handle different selection modes
      if (withModifiers.shift && prev.lastSelectedNodeId) {
        // Range selection (Shift+Click)
        const currentIndex = selectableNodes.findIndex(n => n.id === nodeId)
        const lastIndex = selectableNodes.findIndex(n => n.id === prev.lastSelectedNodeId)
        
        if (currentIndex >= 0 && lastIndex >= 0) {
          const startIndex = Math.min(currentIndex, lastIndex)
          const endIndex = Math.max(currentIndex, lastIndex)
          
          // Add all nodes in range up to max limit
          for (let i = startIndex; i <= endIndex && newSelected.size < maxSelection; i++) {
            newSelected.add(selectableNodes[i].id)
          }
        }
      } else if (withModifiers.ctrl) {
        // Multi-selection (Ctrl+Click)
        if (isSelected && !prev.selectedNodeIds.has(nodeId)) {
          if (newSelected.size >= maxSelection) {
            console.warn(`Maximum selection of ${maxSelection} nodes reached`)
            return prev
          }
          newSelected.add(nodeId)
        } else if (!isSelected && prev.selectedNodeIds.has(nodeId)) {
          newSelected.delete(nodeId)
        }
      } else {
        // Single selection (regular click)
        if (isSelected) {
          if (newSelected.size >= maxSelection && !prev.selectedNodeIds.has(nodeId)) {
            console.warn(`Maximum selection of ${maxSelection} nodes reached`)
            return prev
          }
          newSelected = new Set([nodeId])
        } else {
          newSelected = new Set()
        }
      }

      const newState: TreeSelectionState = {
        selectedNodeIds: newSelected,
        selectionMode: newSelected.size > 1 ? 'multi' : newSelected.size === 1 ? 'single' : 'none',
        lastSelectedNodeId: nodeId,
        isAllSelected: newSelected.size === selectableNodes.length && selectableNodes.length > 0,
        isIndeterminate: newSelected.size > 0 && newSelected.size < selectableNodes.length
      }

      // Notify selection change
      const selectedNodes = selectableNodes.filter(n => newSelected.has(n.id))
      onSelectionChange?.(Array.from(newSelected), selectedNodes)
      
      return newState
    })
  }, [selectableNodes, isNodeSelectable, maxSelection, onSelectionChange])

  // Select all nodes of a specific type or all selectable nodes
  const selectAll = useCallback((nodeType?: 'scenario' | 'dataset') => {
    const nodesToSelect = nodeType 
      ? selectableNodes.filter(node => node.type === nodeType)
      : selectableNodes

    const idsToSelect = nodesToSelect
      .slice(0, maxSelection)
      .map(node => node.id)
    
    const newSelected = new Set(idsToSelect)
    
    setSelectionState(_prev => ({
      selectedNodeIds: newSelected,
      selectionMode: newSelected.size > 1 ? 'multi' : newSelected.size === 1 ? 'single' : 'none',
      lastSelectedNodeId: idsToSelect[idsToSelect.length - 1],
      isAllSelected: idsToSelect.length === selectableNodes.length,
      isIndeterminate: false
    }))
    
    const selectedNodes = selectableNodes.filter(n => newSelected.has(n.id))
    onSelectionChange?.(idsToSelect, selectedNodes)
  }, [selectableNodes, maxSelection, onSelectionChange])

  // Clear all selection
  const clearSelection = useCallback(() => {
    setSelectionState({
      selectedNodeIds: new Set(),
      selectionMode: 'none',
      lastSelectedNodeId: undefined,
      isAllSelected: false,
      isIndeterminate: false
    })
    
    onSelectionChange?.([], [])
  }, [onSelectionChange])

  // Select all children of a specific parent node
  const selectAllInParent = useCallback((parentNodeId: string) => {
    const findChildrenRecursive = (nodes: TreeNode[], targetParentId: string): TreeNode[] => {
      for (const node of nodes) {
        if (node.id === targetParentId && node.children) {
          // Found the parent, get all selectable children
          const selectableChildren: TreeNode[] = []
          
          const collectSelectableChildren = (childNodes: TreeNode[]) => {
            for (const child of childNodes) {
              if (isNodeSelectable(child)) {
                selectableChildren.push(child)
              }
              if (child.children) {
                collectSelectableChildren(child.children)
              }
            }
          }
          
          collectSelectableChildren(node.children)
          return selectableChildren
        }
        
        if (node.children) {
          const found = findChildrenRecursive(node.children, targetParentId)
          if (found.length > 0) return found
        }
      }
      return []
    }

    const childrenToSelect = findChildrenRecursive(treeData, parentNodeId)
    const idsToSelect = childrenToSelect
      .slice(0, maxSelection - selectionState.selectedNodeIds.size)
      .map(node => node.id)
    
    setSelectionState(prev => {
      const newSelected = new Set([...Array.from(prev.selectedNodeIds), ...idsToSelect])
      
      const newState: TreeSelectionState = {
        selectedNodeIds: newSelected,
        selectionMode: newSelected.size > 1 ? 'multi' : newSelected.size === 1 ? 'single' : 'none',
        lastSelectedNodeId: idsToSelect[idsToSelect.length - 1] || prev.lastSelectedNodeId,
        isAllSelected: newSelected.size === selectableNodes.length && selectableNodes.length > 0,
        isIndeterminate: newSelected.size > 0 && newSelected.size < selectableNodes.length
      }
      
      const selectedNodes = selectableNodes.filter(n => newSelected.has(n.id))
      onSelectionChange?.(Array.from(newSelected), selectedNodes)
      
      return newState
    })
  }, [treeData, maxSelection, selectionState.selectedNodeIds, selectableNodes, isNodeSelectable, onSelectionChange])

  return {
    // State
    selectionState,
    selectionStatus,
    
    // Actions
    toggleNodeSelection,
    selectAll,
    clearSelection,
    selectAllInParent,
    
    // Helpers
    isNodeSelected,
    isNodeSelectable,
    getSelectedNodes,
    getSelectedNodeIds,
    getSelectableNodes
  }
}