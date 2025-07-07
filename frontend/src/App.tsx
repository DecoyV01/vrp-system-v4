import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Authenticated, Unauthenticated, useConvexAuth } from 'convex/react'
import { useEffect } from 'react'
import MainLayout from './components/layout/MainLayout'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import ScenarioDetailPage from './pages/ScenarioDetailPage'
import DatasetDetailPage from './pages/DatasetDetailPage'
import TableEditorPage from './pages/TableEditorPage'
import LoginPage from './pages/auth/LoginPage'
import UATErrorBoundary from './components/UATErrorBoundary'
import { ConfirmationDialogProvider } from './components/ui/ConfirmationDialogProvider'
import './App.css'

function AuthenticatedApp() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoading, isAuthenticated } = useConvexAuth()

  useEffect(() => {
    // If we're authenticated and on the login page, redirect to projects
    if (!isLoading && isAuthenticated && location.pathname === '/auth/login') {
      navigate('/projects', { replace: true })
    }
    // If we're authenticated and on root, redirect to projects
    else if (!isLoading && isAuthenticated && location.pathname === '/') {
      navigate('/projects', { replace: true })
    }
  }, [isLoading, isAuthenticated, location.pathname, navigate])

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<ProjectsPage />} />
        <Route path="projects" element={<ProjectsPage />} />

        {/* Deep linking routes for VRP hierarchy */}
        <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        <Route
          path="projects/:projectId/scenarios/:scenarioId"
          element={<ScenarioDetailPage />}
        />
        <Route
          path="projects/:projectId/scenarios/:scenarioId/datasets/:datasetId"
          element={<DatasetDetailPage />}
        />
        <Route
          path="projects/:projectId/scenarios/:scenarioId/datasets/:datasetId/:tableType"
          element={<TableEditorPage />}
        />

        {/* Legacy routes for backwards compatibility */}
        <Route
          path="tables/:datasetId/:tableType"
          element={<TableEditorPage />}
        />
      </Route>
    </Routes>
  )
}

function UnauthenticatedApp() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Redirect unauthenticated users from root to login
    if (location.pathname === '/') {
      navigate('/auth/login', { replace: true })
    }
  }, [location.pathname, navigate])

  return (
    <Routes>
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="*" element={<LoginPage />} />
    </Routes>
  )
}

function App() {
  return (
    <UATErrorBoundary>
      <ConfirmationDialogProvider>
        <div className="App">
          <Authenticated>
            <AuthenticatedApp />
          </Authenticated>

          <Unauthenticated>
            <UnauthenticatedApp />
          </Unauthenticated>

          <Toaster position="top-right" />
        </div>
      </ConfirmationDialogProvider>
    </UATErrorBoundary>
  )
}

export default App
