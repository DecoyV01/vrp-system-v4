import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Copy,
  SkipForward,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import type { DuplicateMatch, VRPTableType } from '../types/shared.types'

interface DuplicateResolutionProps {
  duplicates: DuplicateMatch[]
  importData: any[]
  existingData: any[]
  tableType: VRPTableType
  onResolutionChange: (duplicates: DuplicateMatch[]) => void
  className?: string
}

type ResolutionStrategy = 'replace' | 'create' | 'skip'

interface ResolutionSummary {
  totalDuplicates: number
  toReplace: number
  toCreate: number
  toSkip: number
  unresolved: number
}

export function DuplicateResolution({
  duplicates,
  importData,
  existingData,
  tableType,
  onResolutionChange,
  className,
}: DuplicateResolutionProps) {
  const [expandedDuplicates, setExpandedDuplicates] = useState<Set<number>>(
    new Set()
  )
  const [globalStrategy, setGlobalStrategy] =
    useState<ResolutionStrategy>('replace')

  // Group duplicates by match type and confidence
  const groupedDuplicates = useMemo(() => {
    const groups = {
      'high-confidence': duplicates.filter(d => d.confidence >= 0.95),
      'medium-confidence': duplicates.filter(
        d => d.confidence >= 0.8 && d.confidence < 0.95
      ),
      'low-confidence': duplicates.filter(d => d.confidence < 0.8),
    }
    return groups
  }, [duplicates])

  // Calculate resolution summary
  const summary = useMemo((): ResolutionSummary => {
    const toReplace = duplicates.filter(d => d.resolution === 'replace').length
    const toCreate = duplicates.filter(d => d.resolution === 'create').length
    const toSkip = duplicates.filter(d => d.resolution === 'skip').length
    const unresolved = duplicates.filter(d => !d.resolution).length

    return {
      totalDuplicates: duplicates.length,
      toReplace,
      toCreate,
      toSkip,
      unresolved,
    }
  }, [duplicates])

  // Update resolution for a specific duplicate
  const updateResolution = (
    importRowIndex: number,
    resolution: ResolutionStrategy
  ) => {
    const updatedDuplicates = duplicates.map(duplicate =>
      duplicate.importRowIndex === importRowIndex
        ? { ...duplicate, resolution }
        : duplicate
    )
    onResolutionChange(updatedDuplicates)
  }

  // Apply global strategy to all unresolved duplicates
  const applyGlobalStrategy = () => {
    const updatedDuplicates = duplicates.map(duplicate =>
      !duplicate.resolution
        ? { ...duplicate, resolution: globalStrategy }
        : duplicate
    )
    onResolutionChange(updatedDuplicates)
  }

  // Apply strategy to specific confidence group
  const applyGroupStrategy = (
    confidence: 'high-confidence' | 'medium-confidence' | 'low-confidence',
    strategy: ResolutionStrategy
  ) => {
    const groupDuplicates = groupedDuplicates[confidence]
    const updatedDuplicates = duplicates.map(duplicate => {
      const isInGroup = groupDuplicates.some(
        g => g.importRowIndex === duplicate.importRowIndex
      )
      return isInGroup ? { ...duplicate, resolution: strategy } : duplicate
    })
    onResolutionChange(updatedDuplicates)
  }

  const toggleDuplicateExpansion = (index: number) => {
    setExpandedDuplicates(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const getResolutionIcon = (resolution?: ResolutionStrategy) => {
    switch (resolution) {
      case 'replace':
        return <RefreshCw className="h-4 w-4 text-orange-500" />
      case 'create':
        return <Copy className="h-4 w-4 text-blue-500" />
      case 'skip':
        return <SkipForward className="h-4 w-4 text-gray-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-destructive" />
    }
  }

  const getResolutionBadgeVariant = (resolution?: ResolutionStrategy) => {
    switch (resolution) {
      case 'replace':
        return 'default' as const
      case 'create':
        return 'secondary' as const
      case 'skip':
        return 'outline' as const
      default:
        return 'destructive' as const
    }
  }

  const getMatchTypeDescription = (matchType: string) => {
    switch (matchType) {
      case 'id':
        return 'Exact ID match - same record identifier'
      case 'natural-key':
        return 'Natural key match - same business identifier'
      case 'fuzzy':
        return 'Fuzzy match - similar field values'
      default:
        return 'Unknown match type'
    }
  }

  const formatFieldDifferences = (
    importRow: any,
    existingRow: any,
    conflictingFields: string[]
  ) => {
    return conflictingFields.map(field => ({
      field,
      importValue: importRow[field],
      existingValue: existingRow[field],
    }))
  }

  if (duplicates.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Duplicates Found</h3>
            <p className="text-muted-foreground">
              All import data appears to be unique. No duplicate resolution is
              needed.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Duplicate Resolution</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Found {duplicates.length} potential duplicate
                {duplicates.length !== 1 ? 's' : ''} that need resolution
              </p>
            </div>
            <Badge variant={summary.unresolved > 0 ? 'destructive' : 'default'}>
              {summary.unresolved > 0
                ? `${summary.unresolved} Unresolved`
                : 'All Resolved'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-xl font-semibold text-orange-500">
                {summary.toReplace}
              </div>
              <div className="text-sm text-muted-foreground">Replace</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-blue-500">
                {summary.toCreate}
              </div>
              <div className="text-sm text-muted-foreground">Create New</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-gray-500">
                {summary.toSkip}
              </div>
              <div className="text-sm text-muted-foreground">Skip</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-destructive">
                {summary.unresolved}
              </div>
              <div className="text-sm text-muted-foreground">Unresolved</div>
            </div>
          </div>

          {/* Global Actions */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Label htmlFor="global-strategy">Apply to unresolved:</Label>
              <RadioGroup
                value={globalStrategy}
                onValueChange={value =>
                  setGlobalStrategy(value as ResolutionStrategy)
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="replace" id="global-replace" />
                  <Label htmlFor="global-replace">Replace</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="create" id="global-create" />
                  <Label htmlFor="global-create">Create New</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="skip" id="global-skip" />
                  <Label htmlFor="global-skip">Skip</Label>
                </div>
              </RadioGroup>
            </div>
            <Button onClick={applyGlobalStrategy} size="sm">
              Apply to All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Duplicate Groups */}
      <Tabs defaultValue="by-confidence" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="by-confidence">By Confidence</TabsTrigger>
          <TabsTrigger value="individual">Individual Review</TabsTrigger>
        </TabsList>

        <TabsContent value="by-confidence" className="space-y-4">
          {/* High Confidence Duplicates */}
          {groupedDuplicates['high-confidence'].length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      High Confidence Duplicates
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {groupedDuplicates['high-confidence'].length} duplicate(s)
                      with 95%+ confidence
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        applyGroupStrategy('high-confidence', 'replace')
                      }
                    >
                      Replace All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        applyGroupStrategy('high-confidence', 'skip')
                      }
                    >
                      Skip All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-3">
                  These are very likely duplicates. Consider replacing existing
                  records or skipping import.
                </div>
                <div className="space-y-2">
                  {groupedDuplicates['high-confidence'].map(
                    (duplicate, index) => (
                      <div
                        key={duplicate.importRowIndex}
                        className="p-3 rounded-lg border bg-red-50 dark:bg-red-900/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">
                              Row {duplicate.importRowIndex + 1}
                            </Badge>
                            <Badge variant="outline">
                              {Math.round(duplicate.confidence * 100)}% match
                            </Badge>
                            <span className="text-sm">
                              {getMatchTypeDescription(duplicate.matchType)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getResolutionIcon(duplicate.resolution)}
                            <Badge
                              variant={getResolutionBadgeVariant(
                                duplicate.resolution
                              )}
                            >
                              {duplicate.resolution || 'Unresolved'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Medium Confidence Duplicates */}
          {groupedDuplicates['medium-confidence'].length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Info className="h-4 w-4 text-orange-500" />
                      Medium Confidence Duplicates
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {groupedDuplicates['medium-confidence'].length}{' '}
                      duplicate(s) with 80-95% confidence
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        applyGroupStrategy('medium-confidence', 'create')
                      }
                    >
                      Create All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        applyGroupStrategy('medium-confidence', 'skip')
                      }
                    >
                      Skip All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-3">
                  These might be duplicates. Review individual cases or create
                  as new records.
                </div>
                <div className="space-y-2">
                  {groupedDuplicates['medium-confidence'].map(
                    (duplicate, index) => (
                      <div
                        key={duplicate.importRowIndex}
                        className="p-3 rounded-lg border bg-orange-50 dark:bg-orange-900/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              Row {duplicate.importRowIndex + 1}
                            </Badge>
                            <Badge variant="outline">
                              {Math.round(duplicate.confidence * 100)}% match
                            </Badge>
                            <span className="text-sm">
                              {getMatchTypeDescription(duplicate.matchType)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getResolutionIcon(duplicate.resolution)}
                            <Badge
                              variant={getResolutionBadgeVariant(
                                duplicate.resolution
                              )}
                            >
                              {duplicate.resolution || 'Unresolved'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Low Confidence Duplicates */}
          {groupedDuplicates['low-confidence'].length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-500" />
                      Low Confidence Duplicates
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {groupedDuplicates['low-confidence'].length} duplicate(s)
                      with &lt;80% confidence
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        applyGroupStrategy('low-confidence', 'create')
                      }
                    >
                      Create All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-3">
                  These are probably not duplicates. Safe to create as new
                  records.
                </div>
                <div className="space-y-2">
                  {groupedDuplicates['low-confidence'].map(
                    (duplicate, index) => (
                      <div
                        key={duplicate.importRowIndex}
                        className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-900/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              Row {duplicate.importRowIndex + 1}
                            </Badge>
                            <Badge variant="outline">
                              {Math.round(duplicate.confidence * 100)}% match
                            </Badge>
                            <span className="text-sm">
                              {getMatchTypeDescription(duplicate.matchType)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getResolutionIcon(duplicate.resolution)}
                            <Badge
                              variant={getResolutionBadgeVariant(
                                duplicate.resolution
                              )}
                            >
                              {duplicate.resolution || 'Unresolved'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="individual" className="space-y-4">
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {duplicates.map((duplicate, index) => {
                const importRow = importData[duplicate.importRowIndex]
                const existingRow = existingData.find(
                  row => (row._id || row.id) === duplicate.existingRecordId
                )
                const fieldDifferences = existingRow
                  ? formatFieldDifferences(
                      importRow,
                      existingRow,
                      duplicate.conflictingFields
                    )
                  : []

                return (
                  <Card key={duplicate.importRowIndex}>
                    <Collapsible
                      open={expandedDuplicates.has(index)}
                      onOpenChange={() => toggleDuplicateExpansion(index)}
                    >
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">
                                Row {duplicate.importRowIndex + 1}
                              </Badge>
                              <Badge variant="secondary">
                                {Math.round(duplicate.confidence * 100)}%
                                confidence
                              </Badge>
                              <Badge variant="outline">
                                {duplicate.matchType} match
                              </Badge>
                              {duplicate.conflictingFields.length > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  {duplicate.conflictingFields.length} conflict
                                  {duplicate.conflictingFields.length !== 1
                                    ? 's'
                                    : ''}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {getResolutionIcon(duplicate.resolution)}
                              <Badge
                                variant={getResolutionBadgeVariant(
                                  duplicate.resolution
                                )}
                              >
                                {duplicate.resolution || 'Unresolved'}
                              </Badge>
                              {expandedDuplicates.has(index) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="space-y-4">
                            {/* Field Differences */}
                            {fieldDifferences.length > 0 && (
                              <div>
                                <h5 className="text-sm font-semibold mb-2">
                                  Field Differences:
                                </h5>
                                <div className="space-y-2">
                                  {fieldDifferences.map(
                                    ({ field, importValue, existingValue }) => (
                                      <div
                                        key={field}
                                        className="p-2 rounded border text-sm"
                                      >
                                        <div className="font-medium text-xs text-muted-foreground mb-1">
                                          {field}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <span className="text-xs text-muted-foreground">
                                              Import:
                                            </span>
                                            <div className="font-mono bg-blue-50 p-1 rounded dark:bg-blue-900/20">
                                              {JSON.stringify(importValue)}
                                            </div>
                                          </div>
                                          <div>
                                            <span className="text-xs text-muted-foreground">
                                              Existing:
                                            </span>
                                            <div className="font-mono bg-gray-50 p-1 rounded dark:bg-gray-900/20">
                                              {JSON.stringify(existingValue)}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                            <Separator />

                            {/* Resolution Options */}
                            <div>
                              <h5 className="text-sm font-semibold mb-2">
                                Resolution:
                              </h5>
                              <RadioGroup
                                value={duplicate.resolution || ''}
                                onValueChange={value =>
                                  updateResolution(
                                    duplicate.importRowIndex,
                                    value as ResolutionStrategy
                                  )
                                }
                                className="space-y-2"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value="replace"
                                    id={`replace-${index}`}
                                  />
                                  <Label
                                    htmlFor={`replace-${index}`}
                                    className="flex items-center gap-2"
                                  >
                                    <RefreshCw className="h-4 w-4 text-orange-500" />
                                    Replace existing record with import data
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value="create"
                                    id={`create-${index}`}
                                  />
                                  <Label
                                    htmlFor={`create-${index}`}
                                    className="flex items-center gap-2"
                                  >
                                    <Copy className="h-4 w-4 text-blue-500" />
                                    Create as new record (ignore similarity)
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value="skip"
                                    id={`skip-${index}`}
                                  />
                                  <Label
                                    htmlFor={`skip-${index}`}
                                    className="flex items-center gap-2"
                                  >
                                    <SkipForward className="h-4 w-4 text-gray-500" />
                                    Skip this import row
                                  </Label>
                                </div>
                              </RadioGroup>
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
