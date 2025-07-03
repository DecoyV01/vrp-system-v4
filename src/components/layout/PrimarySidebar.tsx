import { Folder, User, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCurrentUser, useAuthActions } from '@/hooks/useConvexAuth'
import { useNavigate, useLocation } from 'react-router-dom'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const PrimarySidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useCurrentUser()
  const { signOut } = useAuthActions()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
      navigate('/auth/login')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
    }
  }

  const isProjectsActive = location.pathname.startsWith('/projects') || location.pathname === '/'

  if (user.isLoading) {
    return (
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4">
        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white text-sm font-bold mb-6">
          V
        </div>
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner className="w-5 h-5" />
        </div>
      </div>
    )
  }

  if (!user.isAuthenticated) {
    return (
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4">
        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white text-sm font-bold mb-6">
          V
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-12 h-12"
            onClick={() => navigate('/auth/login')}
            title="Sign In"
          >
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    )
  }

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
          className={`w-12 h-12 ${
            isProjectsActive 
              ? 'bg-primary text-white' 
              : 'hover:bg-primary/10 hover:text-primary'
          }`}
          onClick={() => navigate('/projects')}
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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-12 h-12 hover:bg-gray-100"
              title={`${user.name || user.email || 'User'} - Profile`}
            >
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user.name || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default PrimarySidebar