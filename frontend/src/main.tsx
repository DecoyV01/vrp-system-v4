import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { ConvexReactClient } from 'convex/react'
import { BrowserRouter } from 'react-router-dom'
import { ConvexProviderWithAuth } from 'convex/react'
import App from './App.tsx'
import './index.css'
import './utils/uatHealthCheck'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

// Set JWT token if available in localStorage
const token = localStorage.getItem('convex-auth-token')
if (token) {
  convex.setAuth(token)
}

// Custom useAuth hook for ConvexProviderWithAuth
const useAuth = () => {
  const [authState, setAuthState] = useState({
    isLoading: false,
    isAuthenticated: !!token,
  })

  return {
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    fetchAccessToken: async ({
      forceRefreshToken,
    }: {
      forceRefreshToken: boolean
    }) => {
      const currentToken = localStorage.getItem('convex-auth-token')
      if (currentToken) {
        return currentToken
      }
      return null
    },
  }
}

// Initialize UAT health checks in development
if (import.meta.env.DEV) {
  console.log('UAT Health Check system enabled')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConvexProviderWithAuth client={convex} useAuth={useAuth}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConvexProviderWithAuth>
  </React.StrictMode>
)
