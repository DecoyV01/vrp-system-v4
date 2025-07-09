import { Navigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Use chef pattern - direct query instead of custom hook
  const user = useQuery(api.auth.currentUser)

  console.log(
    '🛡️ ProtectedRoute check - user:',
    user === undefined
      ? 'loading'
      : user === null
        ? 'not authenticated'
        : 'authenticated'
  )

  if (user === undefined) {
    console.log('🛡️ ProtectedRoute - Still loading, showing spinner')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner className="w-8 h-8" />
          <p className="text-sm text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    )
  }

  if (user === null) {
    console.log('🛡️ ProtectedRoute - Not authenticated, redirecting to login')
    return <Navigate to="/auth/login" replace />
  }

  console.log('🛡️ ProtectedRoute - Authenticated, rendering children')
  return <>{children}</>
}
