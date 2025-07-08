import { createRoot } from 'react-dom/client'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { ConvexReactClient } from 'convex/react'
import App from './App.tsx'
import './index.css'
import './utils/uatHealthCheck'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

// Initialize UAT health checks in development
if (import.meta.env.DEV) {
  console.log('UAT Health Check system enabled')
}

createRoot(document.getElementById('root')!).render(
  <ConvexAuthProvider client={convex}>
    <App />
  </ConvexAuthProvider>
)
