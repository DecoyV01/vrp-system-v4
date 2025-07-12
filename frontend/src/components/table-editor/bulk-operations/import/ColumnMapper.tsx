import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Info,
} from 'lucide-react'
import { csvProcessor } from '../utils/csvProcessor'
import type {
  ColumnMapping,
  VRPTableType,
  CSVParseResult,
} from '../types/shared.types'

interface ColumnMapperProps {
  parseResult: CSVParseResult
  tableType: VRPTableType
  onMappingChange: (mappings: ColumnMapping[]) => void
  className?: string
}

interface MappingState {
  mappings: ColumnMapping[]
  autoMappingEnabled: boolean
  unmappedColumns: string[]
  requiredFieldsMissing: string[]
}

export function ColumnMapper({
  parseResult,
  tableType,
  onMappingChange,
  className,
}: ColumnMapperProps) {
  const [mappingState, setMappingState] = useState<MappingState>(() => {
    // Generate initial auto-mappings
    const initialMappings = csvProcessor.generateColumnMappings(
      parseResult.headers,
      tableType
    )
    const unmappedColumns = parseResult.headers.filter(
      header =>
        !initialMappings.some(
          mapping =>
            mapping.sourceColumn === header && mapping.confidence >= 0.6
        )
    )

    return {
      mappings: initialMappings,
      autoMappingEnabled: true,
      unmappedColumns,
      requiredFieldsMissing: [],
    }
  })

  // Schema fields for the current table type
  const schemaFields = useMemo(() => {
    const schemas = {
      vehicles: [
        { field: 'description', dataType: 'string', isRequired: false },
        { field: 'profile', dataType: 'string', isRequired: false },
        { field: 'startLat', dataType: 'number', isRequired: false },
        { field: 'startLon', dataType: 'number', isRequired: false },
        { field: 'endLat', dataType: 'number', isRequired: false },
        { field: 'endLon', dataType: 'number', isRequired: false },
        { field: 'capacity', dataType: 'array', isRequired: false },
        { field: 'skills', dataType: 'array', isRequired: false },
        { field: 'twStart', dataType: 'number', isRequired: false },
        { field: 'twEnd', dataType: 'number', isRequired: false },
        { field: 'speedFactor', dataType: 'number', isRequired: false },
        { field: 'maxTasks', dataType: 'number', isRequired: false },
        { field: 'costFixed', dataType: 'number', isRequired: false },
        { field: 'costPerHour', dataType: 'number', isRequired: false },
        { field: 'costPerKm', dataType: 'number', isRequired: false },
      ],
      jobs: [
        { field: 'description', dataType: 'string', isRequired: false },
        { field: 'locationLat', dataType: 'number', isRequired: false },
        { field: 'locationLon', dataType: 'number', isRequired: false },
        { field: 'setup', dataType: 'number', isRequired: false },
        { field: 'service', dataType: 'number', isRequired: false },
        { field: 'delivery', dataType: 'array', isRequired: false },
        { field: 'pickup', dataType: 'array', isRequired: false },
        { field: 'priority', dataType: 'number', isRequired: false },
        { field: 'timeWindows', dataType: 'array', isRequired: false },
      ],
      locations: [
        { field: 'name', dataType: 'string', isRequired: true },
        { field: 'address', dataType: 'string', isRequired: false },
        { field: 'description', dataType: 'string', isRequired: false },
        { field: 'locationLat', dataType: 'number', isRequired: false },
        { field: 'locationLon', dataType: 'number', isRequired: false },
        { field: 'locationType', dataType: 'string', isRequired: false },
        { field: 'operatingHours', dataType: 'string', isRequired: false },
        { field: 'contactInfo', dataType: 'string', isRequired: false },
      ],
      routes: [
        { field: 'vehicleId', dataType: 'string', isRequired: true },
        { field: 'cost', dataType: 'number', isRequired: false },
        { field: 'distance', dataType: 'number', isRequired: false },
        { field: 'duration', dataType: 'number', isRequired: false },
        { field: 'arrivalTime', dataType: 'number', isRequired: false },
        { field: 'departureTime', dataType: 'number', isRequired: false },
      ],
    }
    return schemas[tableType] || []
  }, [tableType])

  const requiredFields = useMemo(
    () => schemaFields.filter(field => field.isRequired),
    [schemaFields]
  )

  // Update mapping for a specific column
  const updateMapping = (sourceColumn: string, targetField: string) => {
    // Handle "no mapping" special case
    if (targetField === '__no_mapping__') {
      targetField = sourceColumn // Reset to original column name (unmapped)
    }

    const schemaField = schemaFields.find(f => f.field === targetField)

    setMappingState(prev => {
      const newMappings = prev.mappings.map(mapping => {
        if (mapping.sourceColumn === sourceColumn) {
          return {
            ...mapping,
            targetField,
            dataType: schemaField?.dataType || 'string',
            isRequired: schemaField?.isRequired || false,
            confidence:
              targetField === sourceColumn ? 1.0 : schemaField ? 0.8 : 0,
          }
        }
        return mapping
      })

      onMappingChange(newMappings)

      // Update unmapped columns and missing required fields
      const unmappedColumns = parseResult.headers.filter(
        header =>
          !newMappings.some(
            mapping =>
              mapping.sourceColumn === header && mapping.targetField !== header
          )
      )

      const mappedRequiredFields = newMappings
        .filter(mapping => mapping.isRequired)
        .map(mapping => mapping.targetField)

      const requiredFieldsMissing = requiredFields
        .map(field => field.field)
        .filter(field => !mappedRequiredFields.includes(field))

      return {
        ...prev,
        mappings: newMappings,
        unmappedColumns,
        requiredFieldsMissing,
      }
    })
  }

  // Auto-map columns
  const autoMapColumns = () => {
    const newMappings = csvProcessor.generateColumnMappings(
      parseResult.headers,
      tableType
    )
    setMappingState(prev => {
      onMappingChange(newMappings)

      const unmappedColumns = parseResult.headers.filter(
        header =>
          !newMappings.some(
            mapping =>
              mapping.sourceColumn === header && mapping.confidence >= 0.6
          )
      )

      const mappedRequiredFields = newMappings
        .filter(mapping => mapping.isRequired)
        .map(mapping => mapping.targetField)

      const requiredFieldsMissing = requiredFields
        .map(field => field.field)
        .filter(field => !mappedRequiredFields.includes(field))

      return {
        ...prev,
        mappings: newMappings,
        unmappedColumns,
        requiredFieldsMissing,
      }
    })
  }

  // Get mapping status for UI feedback
  const getMappingStatus = () => {
    const totalColumns = parseResult.headers.length
    const mappedColumns = mappingState.mappings.filter(
      m => m.confidence >= 0.6
    ).length
    const hasRequiredMissing = mappingState.requiredFieldsMissing.length > 0

    return {
      totalColumns,
      mappedColumns,
      hasRequiredMissing,
      mappingPercentage: Math.round((mappedColumns / totalColumns) * 100),
    }
  }

  const status = getMappingStatus()

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Column Mapping</h3>
            <p className="text-sm text-muted-foreground">
              Map CSV columns to {tableType} table fields
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-mapping" className="text-sm">
                Auto-map
              </Label>
              <Switch
                id="auto-mapping"
                checked={mappingState.autoMappingEnabled}
                onCheckedChange={checked => {
                  setMappingState(prev => ({
                    ...prev,
                    autoMappingEnabled: checked,
                  }))
                  if (checked) {
                    autoMapColumns()
                  }
                }}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={autoMapColumns}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Re-map
            </Button>
          </div>
        </div>

        {/* Status Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl font-semibold">
                  {status.mappedColumns}/{status.totalColumns}
                </div>
                <div className="text-sm text-muted-foreground">
                  Columns Mapped
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold">
                  {status.mappingPercentage}%
                </div>
                <div className="text-sm text-muted-foreground">Coverage</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold">
                  {mappingState.requiredFieldsMissing.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Missing Required
                </div>
              </div>
              <div className="text-center flex justify-center">
                {status.hasRequiredMissing ? (
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                ) : (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {mappingState.requiredFieldsMissing.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Missing required fields:{' '}
            {mappingState.requiredFieldsMissing.join(', ')}. These must be
            mapped before import can proceed.
          </AlertDescription>
        </Alert>
      )}

      {mappingState.unmappedColumns.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {mappingState.unmappedColumns.length} column(s) remain unmapped:{' '}
            {mappingState.unmappedColumns.join(', ')}. These will be ignored
            during import.
          </AlertDescription>
        </Alert>
      )}

      {/* Mapping Interface */}
      <div className="space-y-4">
        <h4 className="text-base font-semibold">Column Mappings</h4>

        <div className="space-y-3">
          {parseResult.headers.map(header => {
            const mapping = mappingState.mappings.find(
              m => m.sourceColumn === header
            )
            const isHighConfidence = mapping && mapping.confidence >= 0.8
            const isMapped = mapping && mapping.targetField !== header

            return (
              <Card
                key={header}
                className={`p-4 ${isHighConfidence ? 'bg-green-50 dark:bg-green-900/10' : ''}`}
              >
                <div className="flex items-center gap-4">
                  {/* Source Column */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {header}
                      </code>
                      {mapping && mapping.confidence > 0 && (
                        <Badge
                          variant={
                            mapping.confidence >= 0.8 ? 'default' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {Math.round(mapping.confidence * 100)}% match
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />

                  {/* Target Field Selector */}
                  <div className="flex-1">
                    <Select
                      value={mapping?.targetField || '__no_mapping__'}
                      onValueChange={value => updateMapping(header, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select target field" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        <SelectItem value="__no_mapping__">
                          No mapping
                        </SelectItem>
                        <Separator />
                        {schemaFields.map(field => (
                          <SelectItem key={field.field} value={field.field}>
                            <div className="flex items-center gap-2">
                              <span>{field.field}</span>
                              <Badge
                                variant={
                                  field.isRequired ? 'destructive' : 'secondary'
                                }
                                className="text-xs"
                              >
                                {field.dataType}
                              </Badge>
                              {field.isRequired && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Required
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Icon */}
                  <div className="w-6 flex justify-center">
                    {isMapped && isHighConfidence && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    {isMapped && !isHighConfidence && (
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Required Fields Reference */}
      {requiredFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Required Fields for {tableType}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {requiredFields.map(field => {
                const isMapped = mappingState.mappings.some(
                  mapping =>
                    mapping.targetField === field.field &&
                    mapping.confidence >= 0.6
                )

                return (
                  <Badge
                    key={field.field}
                    variant={isMapped ? 'default' : 'destructive'}
                    className="gap-1"
                  >
                    {field.field}
                    {isMapped ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <AlertTriangle className="h-3 w-3" />
                    )}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
