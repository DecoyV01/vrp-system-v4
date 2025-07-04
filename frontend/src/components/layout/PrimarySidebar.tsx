import { Folder, User, LogOut, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCurrentUser, useAuthActions } from '@/hooks/useConvexAuth'
import { useNavigate, useLocation } from 'react-router-dom'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'
import useSidebarStore from '@/stores/useSidebarStore'
import useResponsive from '@/hooks/useResponsive'
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
  const { primary, togglePrimary } = useSidebarStore()
  const { isMobile, isTablet } = useResponsive()

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
      <div 
        className={`bg-background border-r border-border flex flex-col transition-all duration-150 ease-out ${
          primary.collapsed ? 'w-16 items-center' : 'w-60 items-start'
        } py-4`}
      >
        <div className={`${primary.collapsed ? 'w-8 h-8 mx-auto' : 'w-8 h-8 mx-4'} bg-primary rounded-md flex items-center justify-center text-white text-sm font-semibold mb-6`}>
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
      <div 
        className={`bg-background border-r border-border flex flex-col transition-all duration-150 ease-out ${
          primary.collapsed ? 'w-16 items-center' : 'w-60 items-start'
        } py-4`}
      >
        <div className={`${primary.collapsed ? 'w-8 h-8 mx-auto' : 'w-8 h-8 mx-4'} bg-primary rounded-md flex items-center justify-center text-white text-sm font-semibold mb-6`}>
          V
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Button 
            variant="ghost" 
            className={`${primary.collapsed ? 'w-12 h-12' : 'w-full justify-start h-12 px-4'}`}
            onClick={() => navigate('/auth/login')}
            title={primary.collapsed ? "Sign In" : undefined}
          >
            <User className="w-5 h-5" />
            {!primary.collapsed && (
              <span className="ml-3 text-sm font-normal">Sign In</span>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`bg-background border-r border-border flex flex-col transition-all duration-150 ease-out ${
        primary.collapsed ? 'w-16 items-center' : 'w-60 items-start'
      } py-4`}
    >
      {/* Logo/Brand */}
      <div className={`${primary.collapsed ? 'w-8 h-8 mx-auto' : 'w-8 h-8 mx-4'} bg-primary rounded-md flex items-center justify-center text-white text-sm font-semibold mb-6`}>
        V
      </div>
      
      {/* Navigation */}
      <nav className={`flex flex-col gap-2 ${primary.collapsed ? 'items-center' : 'w-full px-4'}`}>
        <Button 
          variant="ghost" 
          className={`${
            primary.collapsed 
              ? 'w-12 h-12' 
              : 'w-full justify-start h-12 px-4'
          } ${
            isProjectsActive 
              ? 'bg-primary text-white' 
              : 'hover:bg-primary/10 hover:text-primary'
          }`}
          onClick={() => navigate('/projects')}
          title={primary.collapsed ? "Projects" : undefined}
        >
          <Folder className="w-5 h-5" />
          {!primary.collapsed && (
            <span className="ml-3 text-sm font-normal">Projects</span>
          )}
        </Button>
        
        {/* Toggle button - only show on desktop */}
        {!isMobile && !isTablet && (
          <Button
            variant="ghost"
            className={`${
              primary.collapsed 
                ? 'w-12 h-12 mt-2' 
                : 'w-full justify-start h-12 px-4 mt-2'
            } hover:bg-muted`}
            onClick={togglePrimary}
            title={primary.collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {primary.collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="ml-3 text-sm font-normal">Collapse</span>
              </>
            )}
          </Button>
        )}
      </nav>
      
      {/* Spacer */}
      <div className="flex-1" />
      
      {/* User section */}
      <div className={`flex flex-col gap-2 ${primary.collapsed ? 'items-center' : 'w-full px-4'}`}>
        <Separator className={primary.collapsed ? 'w-8' : 'w-full'} />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={`${
                primary.collapsed 
                  ? 'w-12 h-12' 
                  : 'w-full justify-start h-12 px-4'
              } hover:bg-muted`}
              title={primary.collapsed ? `${user.name || user.email || 'User'} - Profile` : undefined}
            >
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-normal text-primary">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              {!primary.collapsed && (
                <div className="ml-3 flex flex-col items-start text-left overflow-hidden">
                  <span className="text-sm font-normal truncate max-w-full">
                    {user.name || 'User'}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-full">
                    {user.email}
                  </span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-normal leading-none">
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