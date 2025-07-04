import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { BrowserRouter } from 'react-router-dom'
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
    <ConvexProvider client={convex}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConvexProvider>
  </React.StrictMode>,
)