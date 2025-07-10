import {
  ChevronRight,
  ChevronLeft,
  Folder,
  Database,
  Table,
  Plus,
  MoreHorizontal,
  Edit2,
  Copy,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import {
  useHierarchy,
  useTreeData,
  useProjectScenarios,
  useScenarioDatasets,
  getNodeUrl,
  type TreeNode,
} from '@/hooks/useHierarchy'
import { useCreateProject } from '@/hooks/useVRPData'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'
import useSidebarStore from '@/stores/useSidebarStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useTreeNavigation } from '@/hooks/useTreeNavigation'
import { useModal } from '@/contexts/ModalContext'
import { useHierarchyOperations } from '@/hooks/useHierarchyOperations'
import { useToastNotifications } from '@/hooks/useToastNotifications'
import { useBulkTreeSelection } from '@/hooks/useBulkTreeSelection'
import { ModalManager } from '@/components/ui/ModalManager'
import BulkOperationsToolbar from './BulkOperationsToolbar'
import BulkDeleteConfirmationModal from './BulkDeleteConfirmationModal'
import BulkCloneModal from './BulkCloneModal'

const TreeNodeComponent = ({
  node,
  level = 0,
  bulkSelection,
  onPrepareDelete,
}: {
  node: TreeNode
  level?: number
  bulkSelection?: ReturnType<typeof useBulkTreeSelection>
  onPrepareDelete?: (
    entityType: string,
    entityId: string,
    parentProjectId?: string,
    parentScenarioId?: string
  ) => void
}) => {
  const navigate = useNavigate()
  const { toggleNode, setSelectedNode, selectedNode } = useHierarchy()
  const { openEditModal, openDeleteModal, openCloneModal } = useModal()
  const { getCascadeInfo } = useHierarchyOperations()
  const isSelected = selectedNode?.id === node.id
  const isBulkSelected = bulkSelection?.isNodeSelected(node.id) || false
  const isSelectable = bulkSelection?.isNodeSelectable(node) || false

  // Get child data based on node type
  const scenarios = useProjectScenarios(
    node.type === 'project' ? (node.realId as any) : undefined
  )
  const datasets = useScenarioDatasets(
    node.type === 'scenario' ? (node.realId as any) : undefined,
    node.metadata?.projectId
  )

  const getIcon = () => {
    switch (node.type) {
      case 'project':
        return <Folder className="w-4 h-4" />
      case 'scenario':
        return <Database className="w-4 h-4" />
      case 'dataset':
        return <Database className="w-4 h-4" />
      case 'table':
        return <Table className="w-4 h-4" />
      default:
        return <Folder className="w-4 h-4" />
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    // Handle bulk selection if enabled and node is selectable
    if (isSelectable && bulkSelection) {
      // Check for modifier keys
      const withCtrl = e.ctrlKey || e.metaKey
      const withShift = e.shiftKey

      if (withCtrl || withShift) {
        // Bulk selection mode
        e.preventDefault()
        bulkSelection.toggleNodeSelection(node.id, !isBulkSelected, {
          ctrl: withCtrl,
          shift: withShift,
        })
        return
      }
    }

    setSelectedNode(node)

    // Toggle expansion for non-leaf nodes
    if (node.type !== 'table') {
      toggleNode(node.id)
    }

    // Navigate to the appropriate URL
    const url = getNodeUrl(node)
    navigate(url)
  }

  const getChildren = () => {
    if (node.type === 'project' && node.expanded) {
      return scenarios
    } else if (node.type === 'scenario' && node.expanded) {
      return datasets
    } else if (node.type === 'dataset' && node.expanded) {
      return node.children // Table nodes are static
    }
    return []
  }

  const children = getChildren()
  const hasChildren =
    (node.type === 'project' && scenarios?.length > 0) ||
    (node.type === 'scenario' && datasets?.length > 0) ||
    (node.type === 'dataset' && node.children && node.children.length > 0)

  // Context menu handlers
  const handleEdit = useCallback(
    async (e: React.MouseEvent) => {
      console.log(
        'handleEdit called for node:',
        node.name,
        node.type,
        node.realId
      )
      e.stopPropagation()
      if (!node.realId || node.type === 'table') {
        console.log(
          'handleEdit - early return due to missing realId or table type'
        )
        return
      }

      console.log('Opening edit modal for:', node.type, node.realId, node.name)
      openEditModal(
        node.type as 'project' | 'scenario' | 'dataset',
        node.realId,
        node.name
      )
    },
    [node, openEditModal]
  )

  const handleClone = useCallback(
    async (e: React.MouseEvent) => {
      console.log(
        'handleClone called for node:',
        node.name,
        node.type,
        node.realId
      )
      e.stopPropagation()
      if (!node.realId || node.type === 'project' || node.type === 'table') {
        console.log('handleClone - early return due to invalid conditions')
        return
      }

      const parentId =
        node.type === 'scenario'
          ? node.metadata?.projectId
          : node.metadata?.scenarioId

      console.log(
        'Opening clone modal for:',
        node.type,
        node.realId,
        node.name,
        'parentId:',
        parentId
      )
      openCloneModal(
        node.type as 'scenario' | 'dataset',
        node.realId,
        node.name,
        parentId
      )
    },
    [node, openCloneModal]
  )

  const handleDelete = useCallback(
    async (e: React.MouseEvent) => {
      console.log(
        'handleDelete called for node:',
        node.name,
        node.type,
        node.realId
      )
      e.stopPropagation()
      if (!node.realId || node.type === 'table') {
        console.log('handleDelete - early return due to invalid conditions')
        return
      }

      // Show loading state while analyzing cascade effects
      const loadingToast = toast.loading(
        `Analyzing delete impact for ${node.name}...`
      )

      let toastDismissed = false
      const dismissToast = () => {
        if (!toastDismissed) {
          toast.dismiss(loadingToast)
          toastDismissed = true
        }
      }

      try {
        console.log('Getting cascade info for:', node.type, node.realId)
        const cascadeInfo = await getCascadeInfo(
          node.type as 'project' | 'scenario' | 'dataset',
          node.realId
        )

        // Dismiss loading toast
        dismissToast()

        console.log(
          'Opening delete modal for:',
          node.type,
          node.realId,
          node.name,
          'cascadeInfo:',
          cascadeInfo
        )

        // Store context for post-delete navigation
        onPrepareDelete?.(
          node.type,
          node.realId,
          node.metadata?.projectId,
          node.metadata?.scenarioId
        )

        openDeleteModal(
          node.type as 'project' | 'scenario' | 'dataset',
          node.realId,
          node.name,
          cascadeInfo
        )
      } catch (error) {
        console.error('Failed to get cascade info:', error)
        dismissToast()
        toast.error('Failed to analyze delete impact. Please try again.')
      }
    },
    [node, openDeleteModal, getCascadeInfo, onPrepareDelete]
  )

  // Keyboard shortcut handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isSelected) return

      switch (e.key) {
        case 'F2':
          e.preventDefault()
          handleEdit(e as any)
          break
        case 'Delete':
          e.preventDefault()
          handleDelete(e as any)
          break
      }

      // Ctrl+D for clone
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault()
        handleClone(e as any)
      }
    },
    [isSelected, handleEdit, handleDelete, handleClone]
  )

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
          isSelected
            ? 'bg-accent text-accent-foreground'
            : isBulkSelected
              ? 'bg-primary/10 text-foreground border border-primary/20'
              : 'hover:bg-muted text-foreground'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={hasChildren ? node.expanded : undefined}
        aria-label={`${node.type}: ${node.name}`}
        data-node-id={node.id}
      >
        {/* Bulk selection checkbox for selectable nodes */}
        {isSelectable && bulkSelection && (
          <Checkbox
            checked={isBulkSelected}
            onCheckedChange={checked => {
              bulkSelection.toggleNodeSelection(node.id, checked as boolean)
            }}
            onClick={e => e.stopPropagation()}
            className="mr-1"
            aria-label={`Select ${node.name}`}
          />
        )}

        {hasChildren && (
          <ChevronRight
            className={`w-4 h-4 transition-transform ${node.expanded ? 'rotate-90' : ''}`}
          />
        )}
        {!hasChildren && <div className="w-4" />}
        {getIcon()}
        <span className="text-sm truncate flex-1">{node.name}</span>

        {/* Enhanced context menu for certain node types */}
        {(node.type === 'project' ||
          node.type === 'scenario' ||
          node.type === 'dataset') && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                onClick={e => {
                  console.log('DropdownMenuTrigger button clicked')
                  e.stopPropagation()
                }}
                aria-label={`More options for ${node.name}`}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={e => {
                  console.log('Edit dropdown menu item clicked')
                  handleEdit(e)
                }}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
                <DropdownMenuShortcut>F2</DropdownMenuShortcut>
              </DropdownMenuItem>

              {/* Clone only available for scenarios and datasets */}
              {(node.type === 'scenario' || node.type === 'dataset') && (
                <DropdownMenuItem
                  onClick={e => {
                    console.log('Clone dropdown menu item clicked')
                    handleClone(e)
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Clone
                  <DropdownMenuShortcut>Ctrl+D</DropdownMenuShortcut>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={e => {
                  console.log('Delete dropdown menu item clicked')
                  handleDelete(e)
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
                <DropdownMenuShortcut>Del</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {node.expanded && children && children.length > 0 && (
        <div>
          {children.map(child => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              bulkSelection={bulkSelection}
              onPrepareDelete={onPrepareDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const SecondarySidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const treeData = useTreeData()
  const createProject = useCreateProject()
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [showBulkCloneModal, setShowBulkCloneModal] = useState(false)
  const [deletedNodeContext, setDeletedNodeContext] = useState<{
    entityType: string
    entityId: string
    parentProjectId?: string
    parentScenarioId?: string
  } | null>(null)
  const { secondary, toggleSecondary } = useSidebarStore()
  const treeNavigation = useTreeNavigation({
    autoExpandOnSelect: false,
    autoExpandToSelection: true,
  })

  const { startProgress, updateProgress } = useToastNotifications()
  const hierarchyOperations = useHierarchyOperations()
  const { modalState } = useModal()

  // Clean up delete context when modal is closed without deletion
  useEffect(() => {
    if (!modalState.isOpen && deletedNodeContext) {
      console.log('Modal closed, clearing delete context')
      setDeletedNodeContext(null)
    }
  }, [modalState.isOpen, deletedNodeContext])

  // Handle delete preparation - store context for post-delete navigation
  const handlePrepareDelete = useCallback(
    (
      entityType: string,
      entityId: string,
      parentProjectId?: string,
      parentScenarioId?: string
    ) => {
      console.log('Preparing delete context:', {
        entityType,
        entityId,
        parentProjectId,
        parentScenarioId,
      })
      setDeletedNodeContext({
        entityType,
        entityId,
        parentProjectId,
        parentScenarioId,
      })
    },
    []
  )

  // Bulk selection functionality
  const bulkSelection = useBulkTreeSelection({
    treeData: treeData || [],
    maxSelection: 100, // Reasonable limit for tree selection
    selectableTypes: ['scenario', 'dataset'],
    onSelectionChange: (selectedNodeIds, selectedNodes) => {
      console.log('Bulk selection changed:', {
        selectedCount: selectedNodeIds.length,
        selectedTypes: selectedNodes.reduce(
          (acc, node) => {
            acc[node.type] = (acc[node.type] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        ),
      })
    },
  })

  // Helper function to get all visible nodes in tree order
  const getAllVisibleNodes = useCallback(
    (nodes: TreeNode[]): TreeNode[] => {
      const result: TreeNode[] = []

      const traverse = (nodeList: TreeNode[]) => {
        for (const node of nodeList) {
          result.push(node)

          if (
            node.expanded &&
            node.children &&
            treeNavigation.expandedNodeIds.has(node.id)
          ) {
            traverse(node.children)
          }
        }
      }

      traverse(nodes)
      return result
    },
    [treeNavigation.expandedNodeIds]
  )

  // Smart auto-expansion based on current route
  useEffect(() => {
    if (treeData && treeData.length > 0 && location.pathname) {
      // Auto-expand to current route when tree data loads or route changes
      treeNavigation.autoExpandToCurrentRoute(treeData, location.pathname)
    }
  }, [treeData, location.pathname, treeNavigation])

  // Initialize smart expansion on first load
  useEffect(() => {
    if (treeData && treeData.length > 0) {
      // Check if this is first load (no nodes expanded yet)
      if (treeNavigation.expandedNodeIds.size === 0) {
        // Apply smart expansion pattern based on tree size
        if (treeData.length === 1) {
          // Single project: expand it and first scenario
          treeNavigation.smartExpansion(treeData, 'current-project')
        } else if (treeData.length <= 3) {
          // Few projects: expand active scenarios
          treeNavigation.smartExpansion(treeData, 'active-scenarios')
        }
        // For many projects, keep collapsed by default
      }

      // Auto-select first node if none selected for better keyboard navigation
      if (!treeNavigation.selectedNodeId && treeData.length > 0) {
        treeNavigation.selectNode(treeData[0].id)
      }
    }
  }, [treeData, treeNavigation])

  // Global keyboard event handling for tree navigation
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Only handle if sidebar is focused
      const activeElement = document.activeElement
      const isTreeFocused = activeElement?.closest('[role="tree"]') !== null

      if (!isTreeFocused || !treeData) return

      // Global shortcuts with modifiers
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'e':
            event.preventDefault()
            treeNavigation.expandAll(treeData)
            return
          case 'r':
            event.preventDefault()
            treeNavigation.collapseAll()
            return
        }
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          if (treeNavigation.selectedNodeId) {
            const nextId = treeNavigation.getNextSelectableNode(
              treeNavigation.selectedNodeId,
              treeData
            )
            if (nextId) {
              treeNavigation.selectNode(nextId)
              // Focus the element
              const nextElement = document.querySelector(
                `[data-node-id="${nextId}"]`
              )
              if (nextElement instanceof HTMLElement) {
                nextElement.focus()
              }
            }
          }
          break

        case 'ArrowUp':
          event.preventDefault()
          if (treeNavigation.selectedNodeId) {
            const prevId = treeNavigation.getPreviousSelectableNode(
              treeNavigation.selectedNodeId,
              treeData
            )
            if (prevId) {
              treeNavigation.selectNode(prevId)
              // Focus the element
              const prevElement = document.querySelector(
                `[data-node-id="${prevId}"]`
              )
              if (prevElement instanceof HTMLElement) {
                prevElement.focus()
              }
            }
          }
          break

        case 'ArrowRight':
          event.preventDefault()
          if (
            treeNavigation.selectedNodeId &&
            !treeNavigation.isNodeExpanded(treeNavigation.selectedNodeId)
          ) {
            treeNavigation.expandNode(treeNavigation.selectedNodeId)
          }
          break

        case 'ArrowLeft':
          event.preventDefault()
          if (
            treeNavigation.selectedNodeId &&
            treeNavigation.isNodeExpanded(treeNavigation.selectedNodeId)
          ) {
            treeNavigation.collapseNode(treeNavigation.selectedNodeId)
          }
          break

        case 'Enter':
        case ' ':
          event.preventDefault()
          if (treeNavigation.selectedNodeId) {
            treeNavigation.toggleNode(treeNavigation.selectedNodeId)
          }
          break

        case 'Home':
          event.preventDefault()
          // Jump to first node
          if (treeData.length > 0) {
            const firstNodeId = treeData[0].id
            treeNavigation.selectNode(firstNodeId)
            const firstElement = document.querySelector(
              `[data-node-id="${firstNodeId}"]`
            )
            if (firstElement instanceof HTMLElement) {
              firstElement.focus()
            }
          }
          break

        case 'End':
          event.preventDefault()
          // Jump to last visible node
          const visibleNodes = getAllVisibleNodes(treeData)
          if (visibleNodes.length > 0) {
            const lastNodeId = visibleNodes[visibleNodes.length - 1].id
            treeNavigation.selectNode(lastNodeId)
            const lastElement = document.querySelector(
              `[data-node-id="${lastNodeId}"]`
            )
            if (lastElement instanceof HTMLElement) {
              lastElement.focus()
            }
          }
          break

        case 'PageDown':
          event.preventDefault()
          // Jump down by 5 nodes
          if (treeNavigation.selectedNodeId) {
            let currentId = treeNavigation.selectedNodeId
            for (let i = 0; i < 5; i++) {
              const nextId = treeNavigation.getNextSelectableNode(
                currentId,
                treeData
              )
              if (nextId) {
                currentId = nextId
              } else {
                break
              }
            }
            if (currentId !== treeNavigation.selectedNodeId) {
              treeNavigation.selectNode(currentId)
              const element = document.querySelector(
                `[data-node-id="${currentId}"]`
              )
              if (element instanceof HTMLElement) {
                element.focus()
              }
            }
          }
          break

        case 'PageUp':
          event.preventDefault()
          // Jump up by 5 nodes
          if (treeNavigation.selectedNodeId) {
            let currentId = treeNavigation.selectedNodeId
            for (let i = 0; i < 5; i++) {
              const prevId = treeNavigation.getPreviousSelectableNode(
                currentId,
                treeData
              )
              if (prevId) {
                currentId = prevId
              } else {
                break
              }
            }
            if (currentId !== treeNavigation.selectedNodeId) {
              treeNavigation.selectNode(currentId)
              const element = document.querySelector(
                `[data-node-id="${currentId}"]`
              )
              if (element instanceof HTMLElement) {
                element.focus()
              }
            }
          }
          break

        case 'Escape':
          event.preventDefault()
          // Clear selection and remove focus
          treeNavigation.selectNode(null)
          const activeElement = document.activeElement
          if (activeElement instanceof HTMLElement) {
            activeElement.blur()
          }
          break
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [treeNavigation, treeData, getAllVisibleNodes])

  // Bulk operation handlers
  const handleBulkEdit = useCallback(() => {
    const selectedNodes = bulkSelection.getSelectedNodes()
    console.log('Bulk edit requested for:', selectedNodes)
    // TODO: Implement bulk edit modal in future task
    toast.info(
      `Bulk edit for ${selectedNodes.length} items (Coming in Phase 5)`
    )
  }, [bulkSelection])

  const handleBulkClone = useCallback(() => {
    const selectedNodes = bulkSelection.getSelectedNodes()
    if (selectedNodes.length === 0) return

    console.log('Opening bulk clone modal for:', selectedNodes)
    setShowBulkCloneModal(true)
  }, [bulkSelection])

  const handleBulkDelete = useCallback(() => {
    const selectedNodes = bulkSelection.getSelectedNodes()
    if (selectedNodes.length === 0) return

    console.log('Opening bulk delete modal for:', selectedNodes)
    setShowBulkDeleteModal(true)
  }, [bulkSelection])

  // Bulk clone execution
  const executeBulkClone = useCallback(
    async (namePrefix: string, namingStrategy: string) => {
      const selectedNodes = bulkSelection.getSelectedNodes()
      const toastId = startProgress('Cloning', `${selectedNodes.length} items`)

      try {
        // Group nodes by type for separate processing
        const scenarioNodes = selectedNodes.filter(
          node => node.type === 'scenario'
        )
        const datasetNodes = selectedNodes.filter(
          node => node.type === 'dataset'
        )

        let totalSuccess = 0
        let totalFailed = 0
        const errors: string[] = []

        // Clone scenarios
        if (scenarioNodes.length > 0) {
          const scenarioIds = scenarioNodes
            .map(node => node.realId)
            .filter(Boolean) as any[]
          try {
            const result = await hierarchyOperations.bulkClone(
              'scenario',
              scenarioIds,
              namePrefix
            )
            totalSuccess += result.success
            totalFailed += result.failed
            errors.push(...result.errors)
          } catch (error) {
            console.error('Failed to clone scenarios:', error)
            totalFailed += scenarioNodes.length
            errors.push(`Failed to clone ${scenarioNodes.length} scenarios`)
          }
        }

        // Clone datasets
        if (datasetNodes.length > 0) {
          const datasetIds = datasetNodes
            .map(node => node.realId)
            .filter(Boolean) as any[]
          try {
            const result = await hierarchyOperations.bulkClone(
              'dataset',
              datasetIds,
              namePrefix
            )
            totalSuccess += result.success
            totalFailed += result.failed
            errors.push(...result.errors)
          } catch (error) {
            console.error('Failed to clone datasets:', error)
            totalFailed += datasetNodes.length
            errors.push(`Failed to clone ${datasetNodes.length} datasets`)
          }
        }

        // Update progress based on results
        if (totalSuccess > 0 && totalFailed === 0) {
          updateProgress(
            toastId,
            true,
            `Successfully cloned ${totalSuccess} items`
          )
          bulkSelection.clearSelection()
        } else if (totalSuccess > 0 && totalFailed > 0) {
          updateProgress(
            toastId,
            true,
            `Cloned ${totalSuccess} items, ${totalFailed} failed`
          )
        } else {
          updateProgress(
            toastId,
            false,
            `Failed to clone items: ${errors[0] || 'Unknown error'}`
          )
        }

        return { success: totalSuccess, failed: totalFailed, errors }
      } catch (error) {
        console.error('Bulk clone operation failed:', error)
        updateProgress(toastId, false, 'Bulk clone operation failed')
        throw error
      }
    },
    [bulkSelection, hierarchyOperations, startProgress, updateProgress]
  )

  // Bulk delete execution
  const executeBulkDelete = useCallback(async () => {
    const selectedNodes = bulkSelection.getSelectedNodes()
    const toastId = startProgress('Deleting', `${selectedNodes.length} items`)

    try {
      // Group nodes by type for separate processing
      const scenarioNodes = selectedNodes.filter(
        node => node.type === 'scenario'
      )
      const datasetNodes = selectedNodes.filter(node => node.type === 'dataset')

      let totalSuccess = 0
      let totalFailed = 0
      const errors: string[] = []

      // Delete scenarios first (they may contain datasets)
      if (scenarioNodes.length > 0) {
        const scenarioIds = scenarioNodes
          .map(node => node.realId)
          .filter(Boolean) as any[]
        try {
          const result = await hierarchyOperations.bulkDelete(
            'scenario',
            scenarioIds
          )
          totalSuccess += result.success
          totalFailed += result.failed
          errors.push(...result.errors)
        } catch (error) {
          console.error('Failed to delete scenarios:', error)
          totalFailed += scenarioNodes.length
          errors.push(`Failed to delete ${scenarioNodes.length} scenarios`)
        }
      }

      // Delete datasets
      if (datasetNodes.length > 0) {
        const datasetIds = datasetNodes
          .map(node => node.realId)
          .filter(Boolean) as any[]
        try {
          const result = await hierarchyOperations.bulkDelete(
            'dataset',
            datasetIds
          )
          totalSuccess += result.success
          totalFailed += result.failed
          errors.push(...result.errors)
        } catch (error) {
          console.error('Failed to delete datasets:', error)
          totalFailed += datasetNodes.length
          errors.push(`Failed to delete ${datasetNodes.length} datasets`)
        }
      }

      // Update progress based on results
      if (totalSuccess > 0 && totalFailed === 0) {
        updateProgress(
          toastId,
          true,
          `Successfully deleted ${totalSuccess} items`
        )
        bulkSelection.clearSelection()
      } else if (totalSuccess > 0 && totalFailed > 0) {
        updateProgress(
          toastId,
          true,
          `Deleted ${totalSuccess} items, ${totalFailed} failed`
        )
      } else {
        updateProgress(
          toastId,
          false,
          `Failed to delete items: ${errors[0] || 'Unknown error'}`
        )
      }

      return { success: totalSuccess, failed: totalFailed, errors }
    } catch (error) {
      console.error('Bulk delete operation failed:', error)
      updateProgress(toastId, false, 'Bulk delete operation failed')
      throw error
    }
  }, [bulkSelection, hierarchyOperations, startProgress, updateProgress])

  const handleCreateProject = async () => {
    const toastId = startProgress('Creating', 'project')

    try {
      setIsCreatingProject(true)
      const projectName = `New Project ${Date.now()}`

      await createProject({
        name: projectName,
        description: 'A new VRP project',
      })

      updateProgress(
        toastId,
        true,
        `Project "${projectName}" created successfully`
      )
    } catch (error) {
      console.error('Failed to create project:', error)
      const message =
        error instanceof Error ? error.message : 'Failed to create project'
      updateProgress(toastId, false, message)
    } finally {
      setIsCreatingProject(false)
    }
  }

  // Show toggle button when collapsed
  if (secondary.collapsed) {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 left-2 z-10 w-8 h-8 p-0 bg-background border border-border shadow-sm hover:bg-muted"
          onClick={toggleSecondary}
          title="Show projects sidebar"
          data-slot="SidebarToggle"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  if (treeData === undefined) {
    return (
      <div
        className="w-64 bg-background border-r border-border flex flex-col transition-all duration-150 ease-out"
        data-slot="SecondarySidebar"
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            VRP Projects
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 hover:bg-muted"
            onClick={toggleSecondary}
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div
      className="w-64 bg-background border-r border-border flex flex-col transition-all duration-150 ease-out"
      data-slot="SecondarySidebar"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">VRP Projects</h2>
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0 hover:bg-muted"
          onClick={toggleSecondary}
          title="Collapse sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      {/* Tree */}
      <div
        className="flex-1 overflow-y-auto p-2"
        role="tree"
        aria-label="VRP Projects navigation tree"
      >
        {treeData.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm mt-8">
            <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No projects yet.</p>
            <p>Create your first project to get started.</p>
          </div>
        ) : (
          treeData.map(node => (
            <TreeNodeComponent
              key={node.id}
              node={node}
              bulkSelection={bulkSelection}
              onPrepareDelete={handlePrepareDelete}
            />
          ))
        )}
      </div>

      {/* Bulk Operations Toolbar - shown when items are selected */}
      {bulkSelection.selectionStatus.hasSelection && (
        <BulkOperationsToolbar
          selectionStatus={bulkSelection.selectionStatus}
          selectedNodes={bulkSelection.getSelectedNodes()}
          onBulkEdit={handleBulkEdit}
          onBulkClone={handleBulkClone}
          onBulkDelete={handleBulkDelete}
          onClearSelection={bulkSelection.clearSelection}
          onSelectAll={bulkSelection.selectAll}
        />
      )}

      {/* Actions */}
      <div className="p-4 border-t border-border">
        <Button
          size="sm"
          className="w-full"
          onClick={handleCreateProject}
          disabled={isCreatingProject}
        >
          {isCreatingProject ? (
            <>
              <LoadingSpinner className="w-4 h-4 mr-2" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </>
          )}
        </Button>
      </div>

      {/* Modal Manager for all hierarchy operations */}
      <ModalManager
        onEditSuccess={(entityType, entityId) => {
          console.log(`${entityType} ${entityId} updated successfully`)
          // Tree will automatically refresh due to Convex real-time updates
        }}
        onDeleteSuccess={(entityType, entityId) => {
          console.log(`${entityType} ${entityId} deleted successfully`)

          // Navigate to appropriate parent page after successful deletion
          if (deletedNodeContext && deletedNodeContext.entityId === entityId) {
            switch (deletedNodeContext.entityType) {
              case 'project':
                // Navigate to projects list after project deletion
                navigate('/projects')
                console.log('Navigating to /projects after project deletion')
                break

              case 'scenario':
                // Navigate to parent project after scenario deletion
                if (deletedNodeContext.parentProjectId) {
                  navigate(`/projects/${deletedNodeContext.parentProjectId}`)
                  console.log(
                    `Navigating to /projects/${deletedNodeContext.parentProjectId} after scenario deletion`
                  )
                } else {
                  navigate('/projects')
                }
                break

              case 'dataset':
                // Navigate to parent scenario after dataset deletion
                if (
                  deletedNodeContext.parentProjectId &&
                  deletedNodeContext.parentScenarioId
                ) {
                  navigate(
                    `/projects/${deletedNodeContext.parentProjectId}/scenarios/${deletedNodeContext.parentScenarioId}`
                  )
                  console.log(
                    `Navigating to /projects/${deletedNodeContext.parentProjectId}/scenarios/${deletedNodeContext.parentScenarioId} after dataset deletion`
                  )
                } else if (deletedNodeContext.parentProjectId) {
                  navigate(`/projects/${deletedNodeContext.parentProjectId}`)
                } else {
                  navigate('/projects')
                }
                break

              default:
                // Fallback to projects list
                navigate('/projects')
                break
            }

            // Clear the context after navigation
            setDeletedNodeContext(null)
          }

          // Tree will automatically refresh due to Convex real-time updates
        }}
        onCloneSuccess={entityType => {
          console.log(`${entityType} cloned successfully`)
          // Tree will automatically refresh due to Convex real-time updates
        }}
      />

      {/* Bulk Operations Modals */}
      <BulkDeleteConfirmationModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={executeBulkDelete}
        selectedNodes={bulkSelection.getSelectedNodes()}
        isDeleting={hierarchyOperations.isBulkOperating}
      />

      <BulkCloneModal
        isOpen={showBulkCloneModal}
        onClose={() => setShowBulkCloneModal(false)}
        onConfirm={executeBulkClone}
        selectedNodes={bulkSelection.getSelectedNodes()}
        isCloning={hierarchyOperations.isBulkOperating}
      />
    </div>
  )
}

export default SecondarySidebar
