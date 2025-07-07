import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuthActions } from '@convex-dev/auth/react'
import { ConvexError } from 'convex/values'
import { toast } from 'sonner'

const LoginPage = () => {
  const { signIn } = useAuthActions()
  const [flow, setFlow] = useState<'signIn' | 'signUp'>('signIn')
  const [submitting, setSubmitting] = useState(false)

  // Force complete session reset to fix WebSocket authentication mismatch
  useEffect(() => {
    const forceSessionReset = () => {
      console.log('🔍 Debug: VITE_CONVEX_URL:', import.meta.env.VITE_CONVEX_URL)
      console.log('🔍 Debug: Current location:', window.location.href)

      // Get all storage keys that could contain auth/session data
      const allStorageKeys = [
        ...Object.keys(localStorage),
        ...Object.keys(sessionStorage),
      ]

      console.log('🔍 Debug: All storage keys:', allStorageKeys)

      // Clear ALL Convex-related storage to force fresh session
      const convexKeys = allStorageKeys.filter(
        key =>
          key.toLowerCase().includes('convex') ||
          key.toLowerCase().includes('auth') ||
          key.toLowerCase().includes('session') ||
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('refresh') ||
          key.includes('mild-elephant-70') ||
          key.includes('modest-bat-713')
      )

      if (convexKeys.length > 0) {
        console.log(
          '🧹 FORCE: Clearing all auth/session data for fresh start:',
          convexKeys
        )
        convexKeys.forEach(key => {
          localStorage.removeItem(key)
          sessionStorage.removeItem(key)
        })

        // Also clear ALL cookies
        document.cookie.split(';').forEach(cookie => {
          const eqPos = cookie.indexOf('=')
          const name =
            eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
        })

        console.log(
          '🔄 FORCE: Session reset complete, will reload once for clean state'
        )
        setTimeout(() => window.location.reload(), 100)
      } else {
        console.log('✅ Clean session - no auth data found')
      }
    }

    forceSessionReset()
  }, [])

  // No complex logic needed - Convex Auth handles everything automatically

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>VRP System Access</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one to access your VRP
            projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col space-y-4"
            onSubmit={event => {
              event.preventDefault()
              setSubmitting(true)
              const formData = new FormData(event.currentTarget)

              signIn('password', formData)
                .then(() => {
                  console.log('✅ Authentication successful')
                  // Don't set submitting to false here - let the redirect handle it
                  // The component will unmount when authentication state changes
                })
                .catch(error => {
                  console.error('❌ Authentication error:', error)
                  let errorMessage: string

                  if (error instanceof ConvexError) {
                    errorMessage = error.data || 'Authentication failed'
                  } else {
                    errorMessage =
                      flow === 'signIn'
                        ? 'Could not sign in, did you mean to sign up?'
                        : 'Could not sign up, did you mean to sign in?'
                  }

                  toast.error(errorMessage)
                  setSubmitting(false)
                })
            }}
          >
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                name="email"
                id="email"
                type="email"
                autoComplete="email"
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                type="password"
                name="password"
                id="password"
                placeholder={
                  flow === 'signIn'
                    ? 'Enter your password'
                    : 'Create a strong password'
                }
                autoComplete={
                  flow === 'signIn' ? 'current-password' : 'new-password'
                }
                required
              />
              {flow === 'signUp' && (
                <p className="text-xs text-gray-500">
                  Password must be at least 8 characters with uppercase,
                  lowercase, and numbers
                </p>
              )}
            </div>

            <input name="flow" value={flow} type="hidden" />

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting
                ? 'Please wait...'
                : flow === 'signIn'
                  ? 'Sign In'
                  : 'Create Account'}
            </Button>

            <Button
              variant="link"
              type="button"
              onClick={() => setFlow(flow === 'signIn' ? 'signUp' : 'signIn')}
              className="w-full"
            >
              {flow === 'signIn'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Secure authentication powered by Convex Auth</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage
