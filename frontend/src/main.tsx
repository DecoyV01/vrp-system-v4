import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConvexReactClient } from 'convex/react'
import { BrowserRouter } from 'react-router-dom'
import { ConvexAuthWrapper } from '@/components/auth/ConvexAuthWrapper'
import App from './App.tsx'
import './index.css'
import './utils/uatHealthCheck'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

// Initialize UAT health checks in development
if (import.meta.env.DEV) {
  console.log('UAT Health Check system enabled')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConvexAuthWrapper client={convex}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConvexAuthWrapper>
  </React.StrictMode>
)
