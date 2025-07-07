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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'signIn' | 'signUp'>('signIn')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await signIn('password', { email, password, flow: step })
      toast.success(
        step === 'signIn' ? 'Welcome back!' : 'Account created successfully!'
      )
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
            {step === 'signIn'
              ? 'Sign in to your account'
              : 'Create your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Access your VRP System projects and datasets
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 'signIn' ? 'Welcome back' : 'Get started'}
            </CardTitle>
            <CardDescription>
              {step === 'signIn'
                ? 'Enter your credentials to access your account'
                : 'Create a new account to start managing your VRP projects'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? 'Processing...'
                  : step === 'signIn'
                    ? 'Sign in'
                    : 'Sign up'}
              </Button>
            </form>

            <Button
              type="button"
              variant="link"
              onClick={() => setStep(step === 'signIn' ? 'signUp' : 'signIn')}
              className="w-full"
              disabled={isLoading}
            >
              {step === 'signIn'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
