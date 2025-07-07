import { Navigate } from 'react-router-dom'
import { useCurrentUser } from '@/hooks/useConvexAuth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useCurrentUser()

  console.log(
    '🛡️ ProtectedRoute check - isLoading:',
    isLoading,
    'isAuthenticated:',
    isAuthenticated
  )

  if (isLoading) {
    console.log('🛡️ ProtectedRoute - Still loading, showing spinner')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log('🛡️ ProtectedRoute - Not authenticated, redirecting to login')
    return <Navigate to="/auth/login" replace />
  }

  console.log('🛡️ ProtectedRoute - Authenticated, rendering children')
  return <>{children}</>
}
