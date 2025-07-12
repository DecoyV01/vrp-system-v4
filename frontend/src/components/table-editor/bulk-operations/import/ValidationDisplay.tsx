import { useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
  FileText,
  BarChart3,
} from 'lucide-react'
import type {
  ParseError,
  ParseWarning,
  DuplicateMatch,
  CSVParseResult,
} from '../types/shared.types'

interface ValidationDisplayProps {
  parseResult: CSVParseResult
  duplicates?: DuplicateMatch[]
  className?: string
}

interface GroupedValidationItem {
  type: 'error' | 'warning' | 'duplicate'
  count: number
  items: Array<ParseError | ParseWarning | DuplicateMatch>
  description: string
}

interface ValidationSummary {
  totalIssues: number
  errorCount: number
  warningCount: number
  duplicateCount: number
  canProceed: boolean
  blockerCount: number
}

export function ValidationDisplay({
  parseResult,
  duplicates = [],
  className,
}: ValidationDisplayProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['errors'])
  )

  // Group validation issues by type and category
  const groupedValidation = useMemo((): GroupedValidationItem[] => {
    const groups: GroupedValidationItem[] = []

    // Group errors by message type
    const errorGroups = new Map<string, ParseError[]>()
    parseResult.errors.forEach(error => {
      const key = error.message.split(':')[0] // Group by message prefix
      if (!errorGroups.has(key)) {
        errorGroups.set(key, [])
      }
      errorGroups.get(key)!.push(error)
    })

    errorGroups.forEach((errors, messageType) => {
      groups.push({
        type: 'error',
        count: errors.length,
        items: errors,
        description: messageType,
      })
    })

    // Group warnings by message type
    const warningGroups = new Map<string, ParseWarning[]>()
    parseResult.warnings.forEach(warning => {
      const key = warning.message.split(':')[0] // Group by message prefix
      if (!warningGroups.has(key)) {
        warningGroups.set(key, [])
      }
      warningGroups.get(key)!.push(warning)
    })

    warningGroups.forEach((warnings, messageType) => {
      groups.push({
        type: 'warning',
        count: warnings.length,
        items: warnings,
        description: messageType,
      })
    })

    // Group duplicates by match type
    const duplicateGroups = new Map<string, DuplicateMatch[]>()
    duplicates.forEach(duplicate => {
      const key = duplicate.matchType
      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, [])
      }
      duplicateGroups.get(key)!.push(duplicate)
    })

    duplicateGroups.forEach((duplicateItems, matchType) => {
      groups.push({
        type: 'duplicate',
        count: duplicateItems.length,
        items: duplicateItems,
        description: `${matchType} matches`,
      })
    })

    return groups
  }, [parseResult.errors, parseResult.warnings, duplicates])

  // Calculate validation summary
  const summary = useMemo((): ValidationSummary => {
    const errorCount = parseResult.errors.length
    const warningCount = parseResult.warnings.length
    const duplicateCount = duplicates.length
    const totalIssues = errorCount + warningCount + duplicateCount

    // Errors are blockers, high-confidence duplicates might be blockers too
    const blockerCount =
      errorCount + duplicates.filter(d => d.confidence > 0.95).length
    const canProceed = blockerCount === 0

    return {
      totalIssues,
      errorCount,
      warningCount,
      duplicateCount,
      canProceed,
      blockerCount,
    }
  }, [parseResult.errors, parseResult.warnings, duplicates])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const getIssueIcon = (type: 'error' | 'warning' | 'duplicate') => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      case 'warning':
        return <Info className="h-4 w-4 text-orange-500" />
      case 'duplicate':
        return <MapPin className="h-4 w-4 text-blue-500" />
    }
  }

  const getIssueVariant = (type: 'error' | 'warning' | 'duplicate') => {
    switch (type) {
      case 'error':
        return 'destructive' as const
      case 'warning':
        return 'secondary' as const
      case 'duplicate':
        return 'outline' as const
    }
  }

  const formatLocation = (item: ParseError | ParseWarning | DuplicateMatch) => {
    if ('importRowIndex' in item) {
      // Duplicate match
      return `Row ${item.importRowIndex + 1}`
    } else if ('row' in item) {
      // Parse error or warning
      return item.column
        ? `Row ${item.row}, Column ${item.column}`
        : `Row ${item.row}`
    }
    return 'Unknown location'
  }

  if (summary.totalIssues === 0) {
    return (
      <Card className={`${className}`}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Issues Found</h3>
            <p className="text-muted-foreground">
              Your CSV file passed all validation checks and is ready for
              import.
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
              <CardTitle className="text-lg">Validation Results</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Found {summary.totalIssues} issue
                {summary.totalIssues !== 1 ? 's' : ''} that need attention
              </p>
            </div>
            <div className="flex items-center gap-2">
              {summary.canProceed ? (
                <Badge className="bg-green-100 text-green-800 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Can Proceed
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {summary.blockerCount} Blocker
                  {summary.blockerCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-semibold text-destructive">
                {summary.errorCount}
              </div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-orange-500">
                {summary.warningCount}
              </div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-foreground">
                {summary.duplicateCount}
              </div>
              <div className="text-sm text-muted-foreground">Duplicates</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold">
                {parseResult.data.length - summary.errorCount}
              </div>
              <div className="text-sm text-muted-foreground">Valid Rows</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issue Details */}
      <Tabs defaultValue="by-type" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="by-type" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            By Type
          </TabsTrigger>
          <TabsTrigger value="by-location" className="gap-2">
            <MapPin className="h-4 w-4" />
            By Location
          </TabsTrigger>
        </TabsList>

        <TabsContent value="by-type" className="space-y-4">
          {groupedValidation.map((group, index) => (
            <Card key={`${group.type}-${index}`}>
              <Collapsible
                open={expandedSections.has(`${group.type}-${index}`)}
                onOpenChange={() => toggleSection(`${group.type}-${index}`)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getIssueIcon(group.type)}
                        <div>
                          <h4 className="font-semibold">{group.description}</h4>
                          <p className="text-sm text-muted-foreground">
                            {group.count} occurrence
                            {group.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getIssueVariant(group.type)}>
                          {group.count}
                        </Badge>
                        {expandedSections.has(`${group.type}-${index}`) ? (
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
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                        {group.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {formatLocation(item)}
                                </Badge>
                                {'confidence' in item && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {Math.round(item.confidence * 100)}%
                                    confidence
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm">
                                {'message' in item
                                  ? item.message
                                  : `${item.matchType} duplicate detected`}
                              </p>
                              {'suggestion' in item && item.suggestion && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  💡 {item.suggestion}
                                </p>
                              )}
                              {'conflictingFields' in item &&
                                item.conflictingFields.length > 0 && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Conflicting fields:{' '}
                                    {item.conflictingFields.join(', ')}
                                  </p>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="by-location" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Issues by Row
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {/* Group all issues by row number */}
                  {Array.from(
                    new Set([
                      ...parseResult.errors.map(e => e.row),
                      ...parseResult.warnings.map(w => w.row),
                      ...duplicates.map(d => d.importRowIndex + 1),
                    ])
                  )
                    .sort((a, b) => a - b)
                    .map(rowNumber => {
                      const rowErrors = parseResult.errors.filter(
                        e => e.row === rowNumber
                      )
                      const rowWarnings = parseResult.warnings.filter(
                        w => w.row === rowNumber
                      )
                      const rowDuplicates = duplicates.filter(
                        d => d.importRowIndex + 1 === rowNumber
                      )

                      return (
                        <div key={rowNumber} className="p-3 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">Row {rowNumber}</Badge>
                            {rowErrors.length > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {rowErrors.length} Error
                                {rowErrors.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                            {rowWarnings.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {rowWarnings.length} Warning
                                {rowWarnings.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                            {rowDuplicates.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {rowDuplicates.length} Duplicate
                                {rowDuplicates.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-1 text-sm">
                            {rowErrors.map((error, index) => (
                              <div
                                key={`error-${index}`}
                                className="flex items-start gap-2"
                              >
                                <AlertTriangle className="h-3 w-3 text-destructive mt-0.5 flex-shrink-0" />
                                <span>{error.message}</span>
                              </div>
                            ))}
                            {rowWarnings.map((warning, index) => (
                              <div
                                key={`warning-${index}`}
                                className="flex items-start gap-2"
                              >
                                <Info className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                                <span>{warning.message}</span>
                              </div>
                            ))}
                            {rowDuplicates.map((duplicate, index) => (
                              <div
                                key={`duplicate-${index}`}
                                className="flex items-start gap-2"
                              >
                                <MapPin className="h-3 w-3 text-foreground mt-0.5 flex-shrink-0" />
                                <span>
                                  {duplicate.matchType} duplicate (confidence:{' '}
                                  {Math.round(duplicate.confidence * 100)}%)
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Recommendations */}
      {!summary.canProceed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Action Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.errorCount > 0 && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm font-medium">
                    Resolve {summary.errorCount} error
                    {summary.errorCount !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Errors must be fixed before import can proceed. Check data
                    formats, required fields, and value ranges.
                  </p>
                </div>
              )}

              {duplicates.filter(d => d.confidence > 0.95).length > 0 && (
                <div className="p-3 rounded-lg bg-muted border border-border">
                  <p className="text-sm font-medium">
                    Review {duplicates.filter(d => d.confidence > 0.95).length}{' '}
                    high-confidence duplicate
                    {duplicates.filter(d => d.confidence > 0.95).length !== 1
                      ? 's'
                      : ''}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    High-confidence duplicates should be reviewed to prevent
                    data conflicts.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
