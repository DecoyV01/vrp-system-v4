import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LocationSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export const LocationSearch = ({ 
  value, 
  onChange, 
  placeholder = "Search locations...",
  className = ""
}: LocationSearchProps) => {
  const handleClear = () => {
    onChange('')
  }

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-10"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}