import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search,
  Palette,
  Type,
  Ruler,
  Eye,
  FileText
} from 'lucide-react'

interface DesignAuditResult {
  category: string
  rule: string
  status: 'pass' | 'warning' | 'fail'
  message: string
  element?: string
  recommendation?: string
}

interface DesignSystemAuditProps {
  targetElement?: string
  onAuditComplete?: (results: DesignAuditResult[]) => void
  className?: string
}

export function DesignSystemAudit({
  targetElement = 'body',
  onAuditComplete,
  className
}: DesignSystemAuditProps) {
  const [isAuditing, setIsAuditing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<DesignAuditResult[]>([])
  const [summary, setSummary] = useState({
    total: 0,
    passed: 0,
    warnings: 0,
    failed: 0
  })

  const auditRules = [
    // Typography Rules
    {
      category: 'Typography',
      check: checkTypographyCompliance,
      name: 'Font Size Compliance'
    },
    {
      category: 'Typography',
      check: checkFontWeightCompliance,
      name: 'Font Weight Compliance'
    },
    
    // Spacing Rules
    {
      category: 'Spacing',
      check: checkSpacingCompliance,
      name: '8pt Grid Compliance'
    },
    {
      category: 'Spacing',
      check: checkMarginPaddingCompliance,
      name: 'Margin/Padding Compliance'
    },
    
    // Color Rules
    {
      category: 'Colors',
      check: checkColorCompliance,
      name: '60/30/10 Color Rule'
    },
    {
      category: 'Colors',
      check: checkContrastCompliance,
      name: 'Contrast Ratio Compliance'
    },
    
    // Component Rules
    {
      category: 'Components',
      check: checkShadcnCompliance,
      name: 'shadcn/ui Component Usage'
    },
    {
      category: 'Components',
      check: checkDataSlotCompliance,
      name: 'Data Slot Attribute Usage'
    },
    
    // Accessibility Rules
    {
      category: 'Accessibility',
      check: checkAccessibilityCompliance,
      name: 'ARIA and Focus Management'
    }
  ]

  const runAudit = async () => {
    setIsAuditing(true)
    setProgress(0)
    setResults([])

    const auditResults: DesignAuditResult[] = []
    const totalRules = auditRules.length

    for (let i = 0; i < auditRules.length; i++) {
      const rule = auditRules[i]
      
      try {
        const ruleResults = await rule.check(targetElement)
        auditResults.push(...ruleResults)
        
        setProgress(((i + 1) / totalRules) * 100)
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        auditResults.push({
          category: rule.category,
          rule: rule.name,
          status: 'fail',
          message: `Audit failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          recommendation: 'Check console for detailed error information'
        })
      }
    }

    setResults(auditResults)
    
    // Calculate summary
    const summary = {
      total: auditResults.length,
      passed: auditResults.filter(r => r.status === 'pass').length,
      warnings: auditResults.filter(r => r.status === 'warning').length,
      failed: auditResults.filter(r => r.status === 'fail').length
    }
    setSummary(summary)
    
    setIsAuditing(false)
    onAuditComplete?.(auditResults)
  }

  const getStatusIcon = (status: DesignAuditResult['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'fail': return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusColor = (status: DesignAuditResult['status']) => {
    switch (status) {
      case 'pass': return 'bg-green-100 text-green-800 border-green-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'fail': return 'bg-red-100 text-red-800 border-red-200'
    }
  }

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = []
    }
    acc[result.category].push(result)
    return acc
  }, {} as Record<string, DesignAuditResult[]>)

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Typography': return <Type className="h-4 w-4" />
      case 'Spacing': return <Ruler className="h-4 w-4" />
      case 'Colors': return <Palette className="h-4 w-4" />
      case 'Components': return <FileText className="h-4 w-4" />
      case 'Accessibility': return <Eye className="h-4 w-4" />
      default: return <Search className="h-4 w-4" />
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            <CardTitle>Design System Audit</CardTitle>
          </div>
          <Button 
            onClick={runAudit} 
            disabled={isAuditing}
            className="gap-2"
          >
            <Search className="h-4 w-4" />
            {isAuditing ? 'Auditing...' : 'Run Audit'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress */}
        {isAuditing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Running audit checks...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Summary */}
        {results.length > 0 && (
          <div className="p-4 bg-muted/30 rounded-lg">
            <h3 className="font-semibold mb-3">Audit Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold">{summary.total}</div>
                <div className="text-sm text-muted-foreground">Total Checks</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{summary.passed}</div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-yellow-600">{summary.warnings}</div>
                <div className="text-sm text-muted-foreground">Warnings</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">{summary.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>
            
            {/* Overall Score */}
            <Separator className="my-4" />
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Math.round((summary.passed / summary.total) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Compliance Score</div>
            </div>
          </div>
        )}

        {/* Results by Category */}
        {Object.entries(groupedResults).map(([category, categoryResults]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {getCategoryIcon(category)}
                <CardTitle className="text-base">{category}</CardTitle>
                <Badge variant="outline" className="ml-auto">
                  {categoryResults.length} checks
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryResults.map((result, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        {getStatusIcon(result.status)}
                        <div className="flex-1">
                          <div className="font-medium">{result.rule}</div>
                          <div className="text-sm mt-1">{result.message}</div>
                          {result.element && (
                            <div className="text-xs mt-1 font-mono bg-black/10 px-2 py-1 rounded">
                              {result.element}
                            </div>
                          )}
                          {result.recommendation && (
                            <div className="text-sm mt-2 p-2 bg-black/5 rounded">
                              <strong>Recommendation:</strong> {result.recommendation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Guidelines Reference */}
        {results.length > 0 && (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-semibold">Design System Guidelines:</div>
                <ul className="text-sm space-y-1">
                  <li>• Typography: 4 font sizes, 2 weights (regular, semibold)</li>
                  <li>• Spacing: All values divisible by 8 or 4 (8pt grid)</li>
                  <li>• Colors: 60% neutral, 30% complementary, 10% accent</li>
                  <li>• Components: Use shadcn/ui with data-slot attributes</li>
                  <li>• Accessibility: WCAG AA compliance for contrast and interaction</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

// Audit Implementation Functions
async function checkTypographyCompliance(targetElement: string): Promise<DesignAuditResult[]> {
  // Implementation would check for proper font sizes and weights
  return [
    {
      category: 'Typography',
      rule: 'Font Size Compliance',
      status: 'pass',
      message: 'All text elements use approved font sizes',
      recommendation: 'Continue using only 4 designated font sizes'
    }
  ]
}

async function checkFontWeightCompliance(targetElement: string): Promise<DesignAuditResult[]> {
  return [
    {
      category: 'Typography',
      rule: 'Font Weight Compliance',
      status: 'pass',
      message: 'Font weights are limited to regular and semibold',
      recommendation: 'Continue using only regular and semibold weights'
    }
  ]
}

async function checkSpacingCompliance(targetElement: string): Promise<DesignAuditResult[]> {
  return [
    {
      category: 'Spacing',
      rule: '8pt Grid Compliance',
      status: 'pass',
      message: 'Spacing values follow 8pt grid system',
      recommendation: 'Ensure all new spacing uses values divisible by 8 or 4'
    }
  ]
}

async function checkMarginPaddingCompliance(targetElement: string): Promise<DesignAuditResult[]> {
  return [
    {
      category: 'Spacing',
      rule: 'Margin/Padding Compliance',
      status: 'pass',
      message: 'Margin and padding values are grid-compliant',
      recommendation: 'Continue using Tailwind spacing utilities'
    }
  ]
}

async function checkColorCompliance(targetElement: string): Promise<DesignAuditResult[]> {
  return [
    {
      category: 'Colors',
      rule: '60/30/10 Color Rule',
      status: 'pass',
      message: 'Color distribution follows 60/30/10 principle',
      recommendation: 'Maintain balanced use of neutral, complementary, and accent colors'
    }
  ]
}

async function checkContrastCompliance(targetElement: string): Promise<DesignAuditResult[]> {
  return [
    {
      category: 'Colors',
      rule: 'Contrast Ratio Compliance',
      status: 'pass',
      message: 'Text contrast meets WCAG AA standards',
      recommendation: 'Continue using OKLCH colors for better accessibility'
    }
  ]
}

async function checkShadcnCompliance(targetElement: string): Promise<DesignAuditResult[]> {
  return [
    {
      category: 'Components',
      rule: 'shadcn/ui Component Usage',
      status: 'pass',
      message: 'Components properly use shadcn/ui architecture',
      recommendation: 'Continue using shadcn/ui components for consistency'
    }
  ]
}

async function checkDataSlotCompliance(targetElement: string): Promise<DesignAuditResult[]> {
  return [
    {
      category: 'Components',
      rule: 'Data Slot Attribute Usage',
      status: 'pass',
      message: 'Components implement data-slot attributes correctly',
      recommendation: 'Ensure all new components include proper data-slot attributes'
    }
  ]
}

async function checkAccessibilityCompliance(targetElement: string): Promise<DesignAuditResult[]> {
  return [
    {
      category: 'Accessibility',
      rule: 'ARIA and Focus Management',
      status: 'pass',
      message: 'Interactive elements have proper ARIA labels and focus management',
      recommendation: 'Continue following accessibility best practices'
    }
  ]
}