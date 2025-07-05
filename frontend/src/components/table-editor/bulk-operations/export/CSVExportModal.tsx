import { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
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
      
      // Create CSV content
      const csvContent = [
        headers.join(','), // Header row
        ...data.map(row => 
          headers.map(header => {
            const value = row[header]
            if (value === null || value === undefined) return ''
            if (typeof value === 'object') return JSON.stringify(value)
            if (typeof value === 'string' && value.includes(',')) return `"${value}"`
            return String(value)
          }).join(',')
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
      <DialogContent className={`max-w-md ${className}`}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Export CSV</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Export {tableType} data to CSV file
              </p>
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