import { useState } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Settings, 
  Target,
  Database,
  Eye
} from 'lucide-react'
import type { BulkEditOperation, BulkEditOptions } from '../types/bulk-edit.types'

interface BulkEditFormProps {
  operations: BulkEditOperation[]
  options: BulkEditOptions
  onOperationsChange: (operations: BulkEditOperation[]) => void
  onOptionsChange: (options: BulkEditOptions) => void
  availableFields: string[]
  selectedRowsCount: number
  onPreview: () => void
  isValid: boolean
  className?: string
}

export function BulkEditForm({
  operations,
  options,
  onOperationsChange,
  onOptionsChange,
  availableFields,
  selectedRowsCount,
  onPreview,
  isValid,
  className
}: BulkEditFormProps) {
  const [newOperation, setNewOperation] = useState<Partial<BulkEditOperation>>({
    field: '',
    operation: 'set',
    value: ''
  })

  const addOperation = () => {
    if (!newOperation.field || newOperation.value === undefined || newOperation.value === '') {
      alert('Please fill in all fields for the operation')
      return
    }

    const operation: BulkEditOperation = {
      field: newOperation.field,
      operation: newOperation.operation as BulkEditOperation['operation'],
      value: newOperation.value,
      condition: newOperation.condition
    }

    onOperationsChange([...operations, operation])
    
    // Reset form
    setNewOperation({
      field: '',
      operation: 'set',
      value: ''
    })
  }

  const removeOperation = (index: number) => {
    const updated = operations.filter((_, i) => i !== index)
    onOperationsChange(updated)
  }

  const updateOperation = (index: number, updates: Partial<BulkEditOperation>) => {
    const updated = operations.map((op, i) => 
      i === index ? { ...op, ...updates } : op
    )
    onOperationsChange(updated)
  }

  const getOperationDescription = (op: BulkEditOperation['operation']) => {
    switch (op) {
      case 'set': return 'Replace the current value'
      case 'increment': return 'Add to the current numeric value'
      case 'multiply': return 'Multiply the current numeric value'
      case 'append': return 'Add to the end of text/array'
      case 'prepend': return 'Add to the beginning of text/array'
      default: return ''
    }
  }

  const isNumericOperation = (op: string) => {
    return ['increment', 'multiply'].includes(op)
  }

  const isTextOperation = (op: string) => {
    return ['append', 'prepend'].includes(op)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Operations Builder */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            <CardTitle>Edit Operations</CardTitle>
          </div>
          <CardDescription>
            Define the changes you want to apply to selected records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Add New Operation */}
            <div className="p-4 border rounded-lg bg-muted/30">
              <h4 className="font-semibold mb-4">Add Operation</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Field</Label>
                  <Select
                    value={newOperation.field}
                    onValueChange={(value) => setNewOperation({ ...newOperation, field: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Operation</Label>
                  <Select
                    value={newOperation.operation}
                    onValueChange={(value) => setNewOperation({ 
                      ...newOperation, 
                      operation: value as BulkEditOperation['operation']
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="set">Set Value</SelectItem>
                      <SelectItem value="increment">Increment (+)</SelectItem>
                      <SelectItem value="multiply">Multiply (×)</SelectItem>
                      <SelectItem value="append">Append Text</SelectItem>
                      <SelectItem value="prepend">Prepend Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    placeholder={
                      isNumericOperation(newOperation.operation || 'set') 
                        ? 'Enter number' 
                        : 'Enter value'
                    }
                    type={isNumericOperation(newOperation.operation || 'set') ? 'number' : 'text'}
                    value={newOperation.value}
                    onChange={(e) => setNewOperation({ 
                      ...newOperation, 
                      value: isNumericOperation(newOperation.operation || 'set') 
                        ? parseFloat(e.target.value) || 0
                        : e.target.value
                    })}
                  />
                  {newOperation.operation && (
                    <p className="text-xs text-muted-foreground">
                      {getOperationDescription(newOperation.operation)}
                    </p>
                  )}
                </div>

                <div className="flex items-end">
                  <Button onClick={addOperation} className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Existing Operations */}
            {operations.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">Configured Operations</h4>
                {operations.map((operation, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">Field</Label>
                          <p className="font-medium">{operation.field}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Operation</Label>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {operation.operation}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Value</Label>
                          <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                            {String(operation.value)}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeOperation(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Edit Options</CardTitle>
          </div>
          <CardDescription>
            Configure how the bulk edit should be applied
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Edit Mode */}
            <div className="space-y-4">
              <Label>Edit Mode</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    options.mode === 'update' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted hover:border-muted-foreground/50'
                  }`}
                  onClick={() => onOptionsChange({ ...options, mode: 'update' })}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4" />
                    <span className="font-medium">Update Mode</span>
                    <Badge variant="secondary">Safe</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Update only the specified fields, preserve others
                  </p>
                </div>

                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    options.mode === 'replace' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted hover:border-muted-foreground/50'
                  }`}
                  onClick={() => onOptionsChange({ ...options, mode: 'replace' })}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4" />
                    <span className="font-medium">Replace Mode</span>
                    <Badge variant="destructive">Caution</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Replace entire records with new values
                  </p>
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Update Existing Values</Label>
                  <p className="text-sm text-muted-foreground">
                    Overwrite fields that already have values
                  </p>
                </div>
                <Switch
                  checked={options.updateExisting}
                  onCheckedChange={(checked) => 
                    onOptionsChange({ ...options, updateExisting: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Preserve Empty Values</Label>
                  <p className="text-sm text-muted-foreground">
                    Keep empty/null values instead of updating them
                  </p>
                </div>
                <Switch
                  checked={options.preserveEmpty}
                  onCheckedChange={(checked) => 
                    onOptionsChange({ ...options, preserveEmpty: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Validation Level</Label>
                <Select
                  value={options.validationLevel}
                  onValueChange={(value: 'strict' | 'moderate' | 'permissive') => 
                    onOptionsChange({ ...options, validationLevel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strict">Strict - Validate all changes</SelectItem>
                    <SelectItem value="moderate">Moderate - Basic validation</SelectItem>
                    <SelectItem value="permissive">Permissive - Minimal validation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>Edit Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Records:</span>
              <span className="ml-2 font-semibold">{selectedRowsCount}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Operations:</span>
              <span className="ml-2 font-semibold">{operations.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Mode:</span>
              <span className="ml-2 font-semibold capitalize">{options.mode}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Validation:</span>
              <span className="ml-2 font-semibold capitalize">{options.validationLevel}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Action */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isValid 
            ? `Ready to edit ${selectedRowsCount} records with ${operations.length} operations`
            : 'Add at least one operation to continue'
          }
        </div>
        <Button 
          onClick={onPreview}
          disabled={!isValid}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          Preview Changes
        </Button>
      </div>
    </div>
  )
}