import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorMessageProps {
  message: string
  className?: string
}

const ErrorMessage = ({ message, className }: ErrorMessageProps) => {
  return (
    <div className={cn(
      'flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-md',
      className
    )}>
      <AlertCircle className="w-5 h-5 text-destructive" />
      <p className="text-sm text-destructive">{message}</p>
    </div>
  )
}

export { ErrorMessage }