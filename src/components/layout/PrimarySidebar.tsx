import { Folder, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const PrimarySidebar = () => {
  return (
    <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4">
      {/* Logo/Brand */}
      <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white text-sm font-bold mb-6">
        V
      </div>
      
      {/* Navigation */}
      <nav className="flex flex-col gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-12 h-12 bg-primary/10 text-primary hover:bg-primary hover:text-white"
          title="Projects"
        >
          <Folder className="w-5 h-5" />
        </Button>
      </nav>
      
      {/* Spacer */}
      <div className="flex-1" />
      
      {/* User section */}
      <div className="flex flex-col items-center gap-2">
        <Separator className="w-8" />
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-12 h-12"
          title="Profile"
        >
          <User className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}

export default PrimarySidebar