import { useState, useCallback, useMemo } from 'react'
import type { Id } from '../convex/_generated/dataModel'

export interface TreeNode {
  id: string
  name: string
  type: 'project' | 'scenario' | 'dataset' | 'table'
  realId?: Id<'projects'> | Id<'scenarios'> | Id<'datasets'>
  expanded?: boolean
  children?: TreeNode[]
  metadata?: {
    projectId?: Id<'projects'>
    scenarioId?: Id<'scenarios'>
    datasetId?: Id<'datasets'>
  }
}

export interface TreeNavigationState {
  selectedNodeId: string | null
  expandedNodeIds: Set<string>
  focusedNodeId: string | null
}

export interface UseTreeNavigationOptions {
  autoExpandOnSelect?: boolean
  autoExpandToSelection?: boolean
  initialExpandedIds?: string[]
  initialSelectedId?: string | null
}

export interface UseTreeNavigationReturn {
  // State
  selectedNodeId: string | null
  expandedNodeIds: Set<string>
  focusedNodeId: string | null
  
  // Actions
  selectNode: (nodeId: string | null) => void
  expandNode: (nodeId: string) => void
  collapseNode: (nodeId: string) => void
  toggleNode: (nodeId: string) => void
  setFocusedNodeId: (nodeId: string | null) => void
  
  // Bulk operations
  expandAll: (treeData: TreeNode[]) => void
  collapseAll: () => void
  expandToNode: (nodeId: string, treeData: TreeNode[]) => void
  
  // Smart navigation
  autoExpandToCurrentRoute: (treeData: TreeNode[], currentPath: string) => void
  smartExpansion: (treeData: TreeNode[], pattern?: 'current-project' | 'active-scenarios' | 'recent-datasets') => void
  
  // Helpers
  isNodeExpanded: (nodeId: string) => boolean
  isNodeSelected: (nodeId: string) => boolean
  isNodeFocused: (nodeId: string) => boolean
  
  // Navigation
  getNextSelectableNode: (currentNodeId: string, treeData: TreeNode[]) => string | null
  getPreviousSelectableNode: (currentNodeId: string, treeData: TreeNode[]) => string | null
  getParentNode: (nodeId: string, treeData: TreeNode[]) => TreeNode | null
}

/**
 * Custom hook for managing tree navigation state and operations
 * Following React.dev patterns for state management and derived values
 */
export const useTreeNavigation = (options: UseTreeNavigationOptions = {}): UseTreeNavigationReturn => {
  const {
    autoExpandOnSelect = false,
    autoExpandToSelection = true,
    initialExpandedIds = [],
    initialSelectedId = null
  } = options

  // Core state management
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialSelectedId)
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(
    new Set(initialExpandedIds)
  )
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)

  // Memoized helper functions for better performance
  const isNodeExpanded = useCallback((nodeId: string): boolean => {
    return expandedNodeIds.has(nodeId)
  }, [expandedNodeIds])

  const isNodeSelected = useCallback((nodeId: string): boolean => {
    return selectedNodeId === nodeId
  }, [selectedNodeId])

  const isNodeFocused = useCallback((nodeId: string): boolean => {
    return focusedNodeId === nodeId
  }, [focusedNodeId])

  // Node selection with optional auto-expansion
  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId)
    
    if (nodeId && autoExpandOnSelect) {
      setExpandedNodeIds(prev => new Set([...prev, nodeId]))
    }
  }, [autoExpandOnSelect])

  // Node expansion operations
  const expandNode = useCallback((nodeId: string) => {
    setExpandedNodeIds(prev => new Set([...prev, nodeId]))
  }, [])

  const collapseNode = useCallback((nodeId: string) => {
    setExpandedNodeIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(nodeId)
      return newSet
    })
  }, [])

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodeIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }, [])

  // Bulk operations
  const expandAll = useCallback((treeData: TreeNode[]) => {
    const getAllExpandableNodeIds = (nodes: TreeNode[]): string[] => {
      const result: string[] = []
      
      const traverse = (nodeList: TreeNode[]) => {
        for (const node of nodeList) {
          // Add node if it has children (is expandable)
          if (node.children && node.children.length > 0) {
            result.push(node.id)
            traverse(node.children)
          }
        }
      }
      
      traverse(nodes)
      return result
    }

    const expandableIds = getAllExpandableNodeIds(treeData)
    setExpandedNodeIds(new Set(expandableIds))
  }, [])

  const collapseAll = useCallback(() => {
    setExpandedNodeIds(new Set())
  }, [])

  // Find path to node and expand all parents
  const expandToNode = useCallback((nodeId: string, treeData: TreeNode[]) => {
    const findNodePath = (nodes: TreeNode[], targetId: string, path: string[] = []): string[] | null => {
      for (const node of nodes) {
        const currentPath = [...path, node.id]
        
        if (node.id === targetId) {
          return currentPath
        }
        
        if (node.children && node.children.length > 0) {
          const childPath = findNodePath(node.children, targetId, currentPath)
          if (childPath) {
            return childPath
          }
        }
      }
      return null
    }

    const path = findNodePath(treeData, nodeId)
    if (path) {
      // Expand all nodes in the path except the target (unless it has children)
      const nodesToExpand = path.slice(0, -1)
      setExpandedNodeIds(prev => new Set([...prev, ...nodesToExpand]))
    }
  }, [])

  // Navigation helpers for keyboard navigation
  const flattenVisibleNodes = useCallback((nodes: TreeNode[]): TreeNode[] => {
    const result: TreeNode[] = []
    
    const traverse = (nodeList: TreeNode[]) => {
      for (const node of nodeList) {
        result.push(node)
        
        if (node.expanded && node.children && expandedNodeIds.has(node.id)) {
          traverse(node.children)
        }
      }
    }
    
    traverse(nodes)
    return result
  }, [expandedNodeIds])

  const getNextSelectableNode = useCallback((currentNodeId: string, treeData: TreeNode[]): string | null => {
    const visibleNodes = flattenVisibleNodes(treeData)
    const currentIndex = visibleNodes.findIndex(node => node.id === currentNodeId)
    
    if (currentIndex >= 0 && currentIndex < visibleNodes.length - 1) {
      return visibleNodes[currentIndex + 1].id
    }
    
    return null
  }, [flattenVisibleNodes])

  const getPreviousSelectableNode = useCallback((currentNodeId: string, treeData: TreeNode[]): string | null => {
    const visibleNodes = flattenVisibleNodes(treeData)
    const currentIndex = visibleNodes.findIndex(node => node.id === currentNodeId)
    
    if (currentIndex > 0) {
      return visibleNodes[currentIndex - 1].id
    }
    
    return null
  }, [flattenVisibleNodes])

  const getParentNode = useCallback((nodeId: string, treeData: TreeNode[]): TreeNode | null => {
    const findParent = (nodes: TreeNode[], targetId: string, parent: TreeNode | null = null): TreeNode | null => {
      for (const node of nodes) {
        if (node.id === targetId) {
          return parent
        }
        
        if (node.children && node.children.length > 0) {
          const result = findParent(node.children, targetId, node)
          if (result) {
            return result
          }
        }
      }
      return null
    }

    return findParent(treeData, nodeId)
  }, [])

  // Smart auto-expansion based on URL/route
  const autoExpandToCurrentRoute = useCallback((treeData: TreeNode[], currentPath: string) => {
    // Parse URL to determine which nodes should be expanded
    // Examples: /projects/123/scenarios/456/datasets/789
    const pathSegments = currentPath.split('/').filter(Boolean)
    
    if (pathSegments.length >= 2) {
      const entityType = pathSegments[pathSegments.length - 2] // 'projects', 'scenarios', 'datasets'
      const entityId = pathSegments[pathSegments.length - 1] // actual ID
      
      // Find the node that corresponds to this route
      const findNodeByRouteInfo = (nodes: TreeNode[], type: string, id: string): TreeNode | null => {
        for (const node of nodes) {
          // Check if this node matches the route
          if (node.type === type.slice(0, -1) && // 'projects' -> 'project'
              (node.realId === id || node.id.includes(id))) {
            return node
          }
          
          if (node.children) {
            const found = findNodeByRouteInfo(node.children, type, id)
            if (found) return found
          }
        }
        return null
      }
      
      const targetNode = findNodeByRouteInfo(treeData, entityType, entityId)
      if (targetNode) {
        expandToNode(targetNode.id, treeData)
        selectNode(targetNode.id)
      }
    }
  }, [expandToNode, selectNode])

  // Smart expansion patterns for different scenarios
  const smartExpansion = useCallback((treeData: TreeNode[], pattern: 'current-project' | 'active-scenarios' | 'recent-datasets' = 'current-project') => {
    switch (pattern) {
      case 'current-project':
        // Expand the first project and its first level children
        if (treeData.length > 0) {
          const firstProject = treeData[0]
          expandNode(firstProject.id)
          
          // If it has scenarios, expand the first one too
          if (firstProject.children && firstProject.children.length > 0) {
            const firstScenario = firstProject.children[0]
            expandNode(firstScenario.id)
          }
        }
        break
        
      case 'active-scenarios':
        // Expand all projects and their active scenarios
        treeData.forEach(project => {
          expandNode(project.id)
          if (project.children) {
            project.children.forEach(scenario => {
              // Could check scenario.metadata.isActive here if available
              expandNode(scenario.id)
            })
          }
        })
        break
        
      case 'recent-datasets':
        // Expand to show recent datasets (implementation would depend on timestamp metadata)
        treeData.forEach(project => {
          expandNode(project.id)
          if (project.children) {
            project.children.forEach(scenario => {
              expandNode(scenario.id)
              // Expand first dataset of each scenario
              if (scenario.children && scenario.children.length > 0) {
                expandNode(scenario.children[0].id)
              }
            })
          }
        })
        break
    }
  }, [expandNode])

  // Auto-expand to selection when selectedNodeId changes
  useMemo(() => {
    if (selectedNodeId && autoExpandToSelection) {
      // This will be called when treeData is available in the component
      // The component should call expandToNode when needed
    }
  }, [selectedNodeId, autoExpandToSelection])

  return {
    // State
    selectedNodeId,
    expandedNodeIds,
    focusedNodeId,
    
    // Actions
    selectNode,
    expandNode,
    collapseNode,
    toggleNode,
    setFocusedNodeId,
    
    // Bulk operations
    expandAll,
    collapseAll,
    expandToNode,
    
    // Smart navigation
    autoExpandToCurrentRoute,
    smartExpansion,
    
    // Helpers
    isNodeExpanded,
    isNodeSelected,
    isNodeFocused,
    
    // Navigation
    getNextSelectableNode,
    getPreviousSelectableNode,
    getParentNode
  }
}