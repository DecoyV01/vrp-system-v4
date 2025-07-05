import { useState } from 'react'
import { Download, FileText, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { templateGenerator } from '../utils/templateGenerator'
import type { VRPTableType } from '../types/shared.types'

interface TemplateDownloadProps {
  tableType: VRPTableType
  variant?: 'default' | 'secondary' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

interface TemplateOptions {
  includeSystemFields: boolean
  includeSampleData: boolean
  sampleRowCount: number
  includeDescriptions: boolean
}

const TABLE_TYPE_LABELS: Record<VRPTableType, string> = {
  vehicles: 'Vehicles',
  jobs: 'Jobs', 
  locations: 'Locations',
  routes: 'Routes'
}

export function TemplateDownload({ 
  tableType, 
  variant = 'outline', 
  size = 'sm',
  className 
}: TemplateDownloadProps) {
  const [options, setOptions] = useState<TemplateOptions>({
    includeSystemFields: true,
    includeSampleData: true,
    sampleRowCount: 3,
    includeDescriptions: false
  })

  const downloadTemplate = (customOptions?: Partial<TemplateOptions>) => {
    try {
      const finalOptions = { ...options, ...customOptions }
      const csvContent = templateGenerator.generateTemplate(tableType, finalOptions)
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `${tableType}_template.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to generate template:', error)
      // TODO: Add proper error handling with toast notification
    }
  }

  const getRequiredFieldsCount = () => {
    return templateGenerator.getRequiredFields(tableType).length
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={className}
        >
          <Download className="h-4 w-4" />
          <span className="text-sm font-normal">Template</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="text-base font-semibold">
          Download CSV Template
        </DropdownMenuLabel>
        
        <div className="px-2 py-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-foreground" />
            <span className="text-sm font-normal">{TABLE_TYPE_LABELS[tableType]} Template</span>
            <Badge variant="secondary" className="text-sm">
              {getRequiredFieldsCount()} required
            </Badge>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Quick download options */}
        <DropdownMenuItem 
          onClick={() => downloadTemplate({ includeSampleData: false, includeDescriptions: true })}
          className="cursor-pointer"
        >
          <div className="flex flex-col gap-1">
            <span className="text-sm font-normal">Empty Template</span>
            <span className="text-sm text-muted-foreground">Headers and descriptions only</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => downloadTemplate({ includeSampleData: true, sampleRowCount: 3 })}
          className="cursor-pointer"
        >
          <div className="flex flex-col gap-1">
            <span className="text-sm font-normal">Template with Examples</span>
            <span className="text-sm text-muted-foreground">Includes 3 sample rows</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Advanced options */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <Settings className="h-4 w-4" />
            <span className="text-sm font-normal">Advanced Options</span>
          </DropdownMenuSubTrigger>
          
          <DropdownMenuSubContent className="w-64">
            <DropdownMenuLabel className="text-sm font-semibold">
              Template Configuration
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuCheckboxItem
              checked={options.includeSystemFields}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, includeSystemFields: checked }))
              }
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-normal">Include System Fields</span>
                <span className="text-sm text-muted-foreground">_id and other system columns</span>
              </div>
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuCheckboxItem
              checked={options.includeDescriptions}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, includeDescriptions: checked }))
              }
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-normal">Include Field Descriptions</span>
                <span className="text-sm text-muted-foreground">First row with field explanations</span>
              </div>
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuCheckboxItem
              checked={options.includeSampleData}
              onCheckedChange={(checked) => 
                setOptions(prev => ({ ...prev, includeSampleData: checked }))
              }
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-normal">Include Sample Data</span>
                <span className="text-sm text-muted-foreground">Example rows with realistic values</span>
              </div>
            </DropdownMenuCheckboxItem>
            
            {options.includeSampleData && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-2">
                  <label className="text-sm font-normal">Sample Rows</label>
                  <div className="flex gap-2 mt-2">
                    {[1, 3, 5, 10].map(count => (
                      <Button
                        key={count}
                        variant={options.sampleRowCount === count ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setOptions(prev => ({ ...prev, sampleRowCount: count }))}
                        className="h-8 w-8 p-0 text-sm"
                      >
                        {count}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={() => downloadTemplate()}
              className="cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm font-normal">Download Custom Template</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        <DropdownMenuSeparator />
        
        {/* Help text */}
        <div className="px-2 py-2 text-sm text-muted-foreground">
          <div className="space-y-1">
            <p>• Required fields are marked with descriptions</p>
            <p>• Use _id column for updating existing records</p>
            <p>• Leave _id empty for new records</p>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}