import {
  Folder,
  User,
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { api } from '../../../../convex/_generated/api'
import { useNavigate, useLocation } from 'react-router-dom'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'sonner'
import { AuthErrorHandling, logError } from '@/utils/errorHandling'
import { useState, useEffect } from 'react'
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
  // Use chef pattern - direct query instead of custom hook
  const user = useQuery(api.auth.currentUser)
  const { signOut } = useAuthActions()
  const { primary, togglePrimary } = useSidebarStore()
  const { isMobile, isTablet } = useResponsive()

  const [isSigningOut, setIsSigningOut] = useState(false)

  // Add keyboard shortcut for sign out (Ctrl+Shift+Q)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'Q' && user) {
        event.preventDefault()
        handleSignOut()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [user])

  const handleSignOut = async () => {
    // Add confirmation dialog
    const confirmed = window.confirm('Are you sure you want to sign out?')
    if (!confirmed) return

    try {
      setIsSigningOut(true)
      await signOut()
      toast.success('Signed out successfully')
      navigate('/auth/login')
    } catch (error) {
      logError(error, 'Sign out')

      // Use centralized error handling
      const errorMessage = AuthErrorHandling.signOut(error)
      toast.error(errorMessage)

      // If sign out fails, still try to navigate to login as a fallback
      setTimeout(() => {
        navigate('/auth/login')
      }, 2000)
    } finally {
      setIsSigningOut(false)
    }
  }

  const isProjectsActive =
    location.pathname.startsWith('/projects') || location.pathname === '/'

  if (user === undefined) {
    return (
      <div
        className={`bg-background border-r border-border flex flex-col transition-all duration-150 ease-out ${
          primary.collapsed ? 'w-16 items-center' : 'w-60 items-start'
        } py-4`}
      >
        <div
          className={`${primary.collapsed ? 'w-8 h-8 mx-auto' : 'w-8 h-8 mx-4'} bg-primary rounded-md flex items-center justify-center text-white text-sm font-semibold mb-6`}
        >
          V
        </div>
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner className="w-5 h-5" />
        </div>
      </div>
    )
  }

  if (user === null) {
    return (
      <div
        className={`bg-background border-r border-border flex flex-col transition-all duration-150 ease-out ${
          primary.collapsed ? 'w-16 items-center' : 'w-60 items-start'
        } py-4`}
      >
        <div
          className={`${primary.collapsed ? 'w-8 h-8 mx-auto' : 'w-8 h-8 mx-4'} bg-primary rounded-md flex items-center justify-center text-white text-sm font-semibold mb-6`}
        >
          V
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Button
            variant="ghost"
            className={`${primary.collapsed ? 'w-12 h-12' : 'w-full justify-start h-12 px-4'} hover:bg-primary/10 hover:text-primary`}
            onClick={() => navigate('/auth/login')}
            title={primary.collapsed ? 'Sign In' : undefined}
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
      <div
        className={`${primary.collapsed ? 'w-8 h-8 mx-auto' : 'w-8 h-8 mx-4'} bg-primary rounded-md flex items-center justify-center text-white text-sm font-semibold mb-6`}
      >
        V
      </div>

      {/* Navigation */}
      <nav
        className={`flex flex-col gap-2 ${primary.collapsed ? 'items-center' : 'w-full px-4'}`}
      >
        <Button
          variant="ghost"
          className={`${
            primary.collapsed ? 'w-12 h-12' : 'w-full justify-start h-12 px-4'
          } ${
            isProjectsActive
              ? 'bg-primary text-white'
              : 'hover:bg-primary/10 hover:text-primary'
          }`}
          onClick={() => navigate('/projects')}
          title={primary.collapsed ? 'Projects' : undefined}
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
            title={primary.collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
      <div
        className={`flex flex-col gap-2 ${primary.collapsed ? 'items-center' : 'w-full px-4'}`}
      >
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
              title={
                primary.collapsed
                  ? `${user?.name || user?.email || 'User'} - Profile`
                  : undefined
              }
            >
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-normal text-primary">
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              {!primary.collapsed && (
                <div className="ml-3 flex flex-col items-start text-left overflow-hidden">
                  <span className="text-sm font-normal truncate max-w-full">
                    {user?.name || 'User'}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-full">
                    {user?.email}
                  </span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-normal leading-none">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
              {isSigningOut ? (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              <span>{isSigningOut ? 'Signing out...' : 'Sign out'}</span>
              {!isSigningOut && (
                <span className="ml-auto text-xs text-muted-foreground">
                  Ctrl+Shift+Q
                </span>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default PrimarySidebar
