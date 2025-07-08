import { useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
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
  const { signIn } = useAuthActions()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (isSignUp) {
        // Sign up flow
        if (!name.trim()) {
          throw new Error('Name is required')
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long')
        }
        await signIn('password', {
          email,
          password,
          name: name.trim(),
          flow: 'signUp',
        })
        toast.success('Account created successfully! Welcome!')
      } else {
        // Sign in flow - if user doesn't exist, suggest sign up
        try {
          await signIn('password', { email, password })
          toast.success('Welcome back!')
        } catch (signInError) {
          const errorMsg =
            signInError instanceof Error
              ? signInError.message
              : 'Authentication failed'

          // If account doesn't exist, suggest sign up
          if (
            errorMsg.includes('InvalidAccountId') ||
            errorMsg.includes('No auth provider found')
          ) {
            setError(
              'Account not found. Would you like to create an account instead?'
            )
            toast.error('Account not found. Try creating an account instead.')
          } else {
            setError(errorMsg)
            toast.error(errorMsg)
          }
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Authentication failed'
      setError(errorMessage)
      toast.error(errorMessage)
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
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={
                    isSignUp
                      ? 'Create a password (min. 6 characters)'
                      : 'Enter your password'
                  }
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
