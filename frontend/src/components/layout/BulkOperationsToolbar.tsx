import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Edit2,
  Copy,
  Trash2,
  X,
  ChevronDown,
  CheckSquare,
  Square,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import type { TreeSelectionStatus } from '@/hooks/useBulkTreeSelection'
import type { TreeNode } from '@/hooks/useTreeNavigation'

interface BulkOperationsToolbarProps {
  selectionStatus: TreeSelectionStatus
  selectedNodes: TreeNode[]
  onBulkEdit?: () => void
  onBulkClone?: () => void
  onBulkDelete?: () => void
  onClearSelection?: () => void
  onSelectAll?: (nodeType?: 'scenario' | 'dataset') => void
  className?: string
}

const BulkOperationsToolbar = ({
  selectionStatus,
  selectedNodes,
  onBulkEdit,
  onBulkClone,
  onBulkDelete,
  onClearSelection,
  onSelectAll,
  className = '',
}: BulkOperationsToolbarProps) => {
  const {
    selectedCount,
    totalSelectableCount,
    selectedByType,
    isMaxSelection,
  } = selectionStatus

  // Determine if mixed types are selected
  const hasMixedTypes =
    selectedByType.scenarios > 0 && selectedByType.datasets > 0
  const hasOnlyScenarios =
    selectedByType.scenarios > 0 && selectedByType.datasets === 0
  const hasOnlyDatasets =
    selectedByType.datasets > 0 && selectedByType.scenarios === 0

  return (
    <div
      className={`bg-muted/50 border-t border-border p-3 transition-all duration-200 ${className}`}
      data-slot="BulkOperationsToolbar"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Selection Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectionStatus.isAllSelected}
              ref={checkbox => {
                if (checkbox && selectionStatus.isIndeterminate) {
                  checkbox.indeterminate = true
                }
              }}
              onCheckedChange={checked => {
                if (checked) {
                  onSelectAll?.()
                } else {
                  onClearSelection?.()
                }
              }}
              aria-label="Select all items"
            />

            <span className="text-sm font-medium">
              {selectedCount} of {totalSelectableCount} selected
            </span>

            {isMaxSelection && (
              <Badge
                variant="outline"
                className="text-warning border-warning/20"
              >
                Max reached
              </Badge>
            )}
          </div>

          {/* Type breakdown */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {selectedByType.scenarios > 0 && (
                <Badge variant="secondary" className="text-sm">
                  {selectedByType.scenarios} scenario
                  {selectedByType.scenarios !== 1 ? 's' : ''}
                </Badge>
              )}
              {selectedByType.datasets > 0 && (
                <Badge variant="secondary" className="text-sm">
                  {selectedByType.datasets} dataset
                  {selectedByType.datasets !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Smart selection dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <CheckSquare className="w-4 h-4 mr-2" />
                Select
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Selection Options</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => onSelectAll?.()}>
                <CheckSquare className="w-4 h-4 mr-2" />
                Select All
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onSelectAll?.('scenario')}>
                <CheckSquare className="w-4 h-4 mr-2" />
                Select All Scenarios
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onSelectAll?.('dataset')}>
                <CheckSquare className="w-4 h-4 mr-2" />
                Select All Datasets
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={onClearSelection}>
                <Square className="w-4 h-4 mr-2" />
                Clear Selection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6" />

          {/* Bulk operations */}
          <div className="flex items-center gap-2">
            {/* Bulk Edit - only for single type selection */}
            {!hasMixedTypes && selectedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkEdit}
                disabled={selectedCount === 0}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Bulk Edit
              </Button>
            )}

            {/* Bulk Clone - only for scenarios and datasets, not mixed */}
            {!hasMixedTypes && selectedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkClone}
                disabled={selectedCount === 0}
              >
                <Copy className="w-4 h-4 mr-2" />
                Bulk Clone
              </Button>
            )}

            {/* Bulk Delete - works for all selections */}
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
              disabled={selectedCount === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete {selectedCount > 1 ? 'Selected' : 'Item'}
            </Button>

            {/* Clear Selection */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              disabled={selectedCount === 0}
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Warning for mixed type operations */}
      {hasMixedTypes && (
        <div className="mt-2 p-2 bg-warning/10 border border-warning/20 rounded text-sm text-warning-foreground">
          <strong>Mixed Selection:</strong> Bulk edit and clone are not
          available when both scenarios and datasets are selected. Consider
          selecting items of the same type for these operations.
        </div>
      )}
    </div>
  )
}

export default BulkOperationsToolbar
