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
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AuthErrorHandling, logError } from '@/utils/errorHandling'
// Frontend validation functions (matching backend schema)
const validateUserLogin = (data: { email: string; password: string }) => {
  const errors: string[] = []

  if (!data.email || data.email.length === 0) {
    errors.push('Email is required')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format')
  } else if (data.email.length > 255) {
    errors.push('Email too long')
  }

  if (!data.password || data.password.length === 0) {
    errors.push('Password is required')
  } else if (data.password.length < 6) {
    errors.push('Password must be at least 6 characters')
  } else if (data.password.length > 100) {
    errors.push('Password too long')
  }

  if (errors.length > 0) {
    const error = new Error(errors[0])
    ;(error as any).errors = errors.map((msg, i) => ({
      path: i === 0 && msg.includes('Email') ? ['email'] : ['password'],
      message: msg,
    }))
    throw error
  }

  return data
}

const validateUserRegister = (data: {
  name: string
  email: string
  password: string
  confirmPassword: string
}) => {
  const errors: Record<string, string> = {}

  if (!data.name || data.name.length === 0) {
    errors.name = 'Name is required'
  } else if (data.name.length > 100) {
    errors.name = 'Name too long'
  }

  if (!data.email || data.email.length === 0) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email format'
  } else if (data.email.length > 255) {
    errors.email = 'Email too long'
  }

  if (!data.password || data.password.length === 0) {
    errors.password = 'Password is required'
  } else if (data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
  } else if (data.password.length > 100) {
    errors.password = 'Password too long'
  }

  if (!data.confirmPassword || data.confirmPassword.length === 0) {
    errors.confirmPassword = 'Password confirmation required'
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords don't match"
  }

  if (Object.keys(errors).length > 0) {
    const error = new Error('Validation failed')
    ;(error as any).errors = Object.entries(errors).map(([path, message]) => ({
      path: [path],
      message,
    }))
    throw error
  }

  return data
}

export function LoginPage() {
  const { signIn } = useAuthActions()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isRegisterMode = searchParams.get('mode') === 'register'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Clear field error when user starts typing
  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setFieldErrors({})

    // Validate using Zod schemas
    try {
      if (isRegisterMode) {
        const validatedData = validateUserRegister({
          name,
          email,
          password,
          confirmPassword,
        })
        // If validation passes, validatedData contains the validated data
      } else {
        const validatedData = validateUserLogin({
          email,
          password,
        })
        // If validation passes, validatedData contains the validated data
      }
    } catch (validationError: any) {
      setIsLoading(false)
      // Handle Zod validation errors
      if (validationError.errors) {
        const errors: Record<string, string> = {}
        validationError.errors.forEach((err: any) => {
          errors[err.path[0]] = err.message
        })
        setFieldErrors(errors)
        return
      } else {
        setError(validationError.message || 'Validation failed')
        return
      }
    }

    try {
      if (isRegisterMode) {
        await signIn('password', {
          email,
          password,
          name: name || email.split('@')[0],
          flow: 'signUp',
        })
        toast.success('Account created successfully! Welcome!')
      } else {
        await signIn('password', { email, password, flow: 'signIn' })
        toast.success('Welcome back!')
      }

      // Navigate to home after successful authentication
      // The App component will handle the redirection automatically
      // but we can also explicitly navigate to ensure consistent behavior
      navigate('/', { replace: true })
    } catch (err) {
      logError(
        err,
        `Authentication - ${isRegisterMode ? 'sign up' : 'sign in'}`
      )

      // Use centralized error handling
      const errorMessage = isRegisterMode
        ? AuthErrorHandling.signUp(err)
        : AuthErrorHandling.signIn(err)

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
            {isRegisterMode ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isRegisterMode ? 'Or ' : 'Or '}
            <Link
              to={isRegisterMode ? '/auth/login' : '/auth/login?mode=register'}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              {isRegisterMode
                ? 'sign in to your existing account'
                : 'create a new account'}
            </Link>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {isRegisterMode ? 'Welcome to VRP System' : 'Welcome back'}
            </CardTitle>
            <CardDescription>
              {isRegisterMode
                ? 'Create your account to get started with vehicle routing optimization'
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
              {isRegisterMode && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={e => {
                      setName(e.target.value)
                      clearFieldError('name')
                    }}
                    placeholder="Enter your full name"
                    disabled={isLoading}
                    autoComplete="name"
                    className={fieldErrors.name ? 'border-red-500' : ''}
                  />
                  {fieldErrors.name && (
                    <p className="text-sm text-red-600">{fieldErrors.name}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value)
                    clearFieldError('email')
                  }}
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  className={fieldErrors.email ? 'border-red-500' : ''}
                />
                {fieldErrors.email && (
                  <p className="text-sm text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value)
                    clearFieldError('password')
                  }}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                  minLength={isRegisterMode ? 6 : undefined}
                  autoComplete={
                    isRegisterMode ? 'new-password' : 'current-password'
                  }
                  className={fieldErrors.password ? 'border-red-500' : ''}
                />
                {fieldErrors.password && (
                  <p className="text-sm text-red-600">{fieldErrors.password}</p>
                )}
                {isRegisterMode && !fieldErrors.password && (
                  <p className="text-sm text-gray-500">
                    Password must be at least 6 characters
                  </p>
                )}
              </div>

              {isRegisterMode && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value)
                      clearFieldError('confirmPassword')
                    }}
                    placeholder="Confirm your password"
                    required
                    disabled={isLoading}
                    minLength={6}
                    autoComplete="new-password"
                    className={
                      fieldErrors.confirmPassword ? 'border-red-500' : ''
                    }
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="text-sm text-red-600">
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? isRegisterMode
                    ? 'Creating account...'
                    : 'Signing in...'
                  : isRegisterMode
                    ? 'Create Account'
                    : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
