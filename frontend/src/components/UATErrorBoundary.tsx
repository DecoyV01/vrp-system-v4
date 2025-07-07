import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class UATErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Special handling for auth errors
    if (error.message?.includes('CONVEX') && error.message?.includes('auth')) {
      console.error('Authentication error detected:', error)
      // Redirect to login page for auth errors
      setTimeout(() => {
        window.location.href = '/auth/login'
      }, 2000)
    }

    // Log to UAT health check system in development
    if (import.meta.env.DEV && (window as any).__UAT_HEALTH__) {
      ;(window as any).__UAT_HEALTH__.logAction('react_error_boundary', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        isAuthError:
          error.message?.includes('CONVEX') && error.message?.includes('auth'),
      })
    }

    // Log to console for debugging
    console.error('React Error Boundary caught an error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      // Check if this is an auth error
      const isAuthError =
        this.state.error?.message?.includes('CONVEX') &&
        this.state.error?.message?.includes('auth')

      // In development, show error details for UAT debugging
      if (import.meta.env.DEV) {
        return (
          <div
            className="error-boundary"
            style={{
              padding: '2rem',
              border: '2px solid red',
              margin: '1rem',
              backgroundColor: '#ffe6e6',
              borderRadius: '8px',
            }}
          >
            <h2 style={{ color: 'red', marginBottom: '1rem' }}>
              React Error Boundary Triggered
            </h2>
            <details style={{ marginBottom: '1rem' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Error Details (Development Only)
              </summary>
              <pre
                style={{
                  backgroundColor: '#f5f5f5',
                  padding: '1rem',
                  borderRadius: '4px',
                  marginTop: '0.5rem',
                  overflow: 'auto',
                  fontSize: '0.8rem',
                }}
              >
                {this.state.error?.message}
                {'\n\n'}
                {this.state.error?.stack}
              </pre>
            </details>
            <button
              onClick={() =>
                this.setState({ hasError: false, error: undefined })
              }
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        )
      }

      // In production, show a simple error message
      return (
        <div
          className="error-boundary"
          style={{
            padding: '2rem',
            textAlign: 'center',
            color: '#666',
          }}
        >
          <h2>Something went wrong</h2>
          <p>Please refresh the page to try again.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default UATErrorBoundary
