import { useState } from 'react'
import { useConvexAuth } from 'convex/react'
import { useConvex } from 'convex/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const client = useConvex()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Client-side validation for sign-up
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error('Name is required')
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long')
        }
      }

      // Call our JWT authentication endpoint
      const response = await fetch(
        `${import.meta.env.VITE_CONVEX_URL}/jwt-login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            flow: isSignUp ? 'signUp' : 'signIn',
            name: isSignUp ? name : undefined,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Authentication failed')
      }

      const { token, user } = await response.json()

      // Set the JWT token for the Convex client
      client.setAuth(token)

      // Store token in localStorage for persistence
      localStorage.setItem('convex-auth-token', token)
      localStorage.setItem('convex-user', JSON.stringify(user))

      if (isSignUp) {
        toast.success('Account created successfully! Welcome!')
      } else {
        toast.success('Welcome back!')
      }

      // JWT Debugging - log for jwt.io analysis
      if (import.meta.env.DEV) {
        console.log('🔍 JWT Debug: Token received:', token)
        console.log('🔍 Copy token to https://jwt.io for analysis')
      }

      // Redirect to dashboard
      window.location.href = '/dashboard'
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Authentication failed'

      // Provide helpful error messages
      if (
        errorMessage.includes('InvalidAccountId') ||
        errorMessage.includes('No auth provider found')
      ) {
        setError(
          'Account not found. Would you like to create an account instead?'
        )
        toast.error('Account not found. Try creating an account instead.')
      } else {
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isSignUp
              ? 'Get started with VRP System projects and datasets'
              : 'Access your VRP System projects and datasets'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isSignUp ? 'Get started' : 'Welcome back'}</CardTitle>
            <CardDescription>
              {isSignUp
                ? 'Create your account to get started'
                : 'Enter your credentials to access your account'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={
                    isSignUp
                      ? 'Create a password (min. 6 characters)'
                      : 'Enter your password'
                  }
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  disabled={isLoading}
                  minLength={isSignUp ? 6 : undefined}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? isSignUp
                    ? 'Creating account...'
                    : 'Signing in...'
                  : isSignUp
                    ? 'Create account'
                    : 'Sign in'}
              </Button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError('')
                  setName('')
                }}
                className="text-sm text-indigo-600 hover:text-indigo-500"
                disabled={isLoading}
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Create one"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
