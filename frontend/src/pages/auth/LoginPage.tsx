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
import { useConvexAuth } from 'convex/react'

const LoginPage = () => {
  const { signIn, signOut } = useAuthActions()
  const { isAuthenticated } = useConvexAuth()
  const [flow, setFlow] = useState<'signIn' | 'signUp'>('signIn')
  const [submitting, setSubmitting] = useState(false)

  // Force sign out any existing sessions to prevent token mismatch
  useEffect(() => {
    const forceCleanAuth = async () => {
      console.log('🔍 Debug: VITE_CONVEX_URL:', import.meta.env.VITE_CONVEX_URL)
      console.log('🔍 Debug: Current location:', window.location.href)
      console.log('🔍 Debug: isAuthenticated:', isAuthenticated)

      // If there's any existing authentication, force sign out to clear it
      if (isAuthenticated) {
        console.log(
          '🔄 FORCE: Signing out existing session to clear token mismatch'
        )
        try {
          await signOut()
          console.log('✅ Existing session signed out')
        } catch (error) {
          console.log('⚠️ Error signing out existing session:', error)
        }
      }

      // Clear any remaining storage
      const allStorageKeys = [
        ...Object.keys(localStorage),
        ...Object.keys(sessionStorage),
      ]

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
        console.log('🧹 Clearing remaining auth storage:', convexKeys)
        convexKeys.forEach(key => {
          localStorage.removeItem(key)
          sessionStorage.removeItem(key)
        })
      }
    }

    forceCleanAuth()
  }, [isAuthenticated, signOut])

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
