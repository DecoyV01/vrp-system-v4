import { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Download, 
  FileText, 
  CheckCircle2
} from 'lucide-react'
import type { VRPTableType } from '../types/shared.types'

interface CSVExportModalProps {
  isOpen: boolean
  onClose: () => void
  tableType: VRPTableType
  data: any[]
  className?: string
}

export function CSVExportModal({
  isOpen,
  onClose,
  tableType,
  data,
  className
}: CSVExportModalProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      
      // Simple CSV export logic
      if (data.length === 0) {
        alert('No data to export')
        return
      }

      // Get all unique keys from the data
      const headers = [...new Set(data.flatMap(row => Object.keys(row)))]
      
      // Helper function to format values for Excel compatibility
      const formatValueForExcel = (value: any, header: string): string => {
        if (value === null || value === undefined) return ''
        
        // Handle timestamp fields (Convex _creationTime and updatedAt)
        if ((header === '_creationTime' || header === 'updatedAt') && typeof value === 'number') {
          // Convert Unix timestamp (milliseconds) to Excel-compatible ISO date
          const date = new Date(value)
          return date.toISOString().replace('T', ' ').replace('Z', '')
        }
        
        // Handle time window fields (seconds since midnight)
        if ((header === 'twStart' || header === 'twEnd') && typeof value === 'number') {
          // Convert seconds since midnight to HH:MM:SS format
          const hours = Math.floor(value / 3600)
          const minutes = Math.floor((value % 3600) / 60)
          const seconds = value % 60
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        }
        
        // Handle arrays (convert to JSON for Excel)
        if (typeof value === 'object' && Array.isArray(value)) {
          return `"${JSON.stringify(value)}"`
        }
        
        // Handle other objects
        if (typeof value === 'object') {
          return `"${JSON.stringify(value)}"`
        }
        
        // Handle strings with commas (quote them)
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`
        }
        
        // Handle strings with quotes (escape them)
        if (typeof value === 'string' && value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        
        return String(value)
      }
      
      // Create CSV content
      const csvContent = [
        headers.join(','), // Header row
        ...data.map(row => 
          headers.map(header => formatValueForExcel(row[header], header)).join(',')
        )
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${tableType}_export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-md ${className}`} aria-describedby="export-dialog-description">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Export CSV</DialogTitle>
              <DialogDescription id="export-dialog-description">
                Export {tableType} data to CSV file
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            {/* Export Summary */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Export Summary</h4>
                <Badge variant="outline">{tableType}</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Records:</span>
                  <span className="ml-2 font-semibold">{data.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Format:</span>
                  <span className="ml-2 font-semibold">CSV</span>
                </div>
              </div>
            </div>

            {/* Export Info */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>All table columns will be included</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Data will be formatted for Excel compatibility</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              Export will download immediately
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleExport} 
                disabled={isExporting || data.length === 0}
                className="gap-2"
              >
                {isExporting ? (
                  <>Exporting...</>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export CSV
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}