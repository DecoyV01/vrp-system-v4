import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import { Toaster } from 'sonner'
import MainLayout from './components/layout/MainLayout'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import ScenarioDetailPage from './pages/ScenarioDetailPage'
import DatasetDetailPage from './pages/DatasetDetailPage'
import TableEditorPage from './pages/TableEditorPage'
import LoginPage from './pages/auth/LoginPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import UATErrorBoundary from './components/UATErrorBoundary'
import { ConfirmationDialogProvider } from './components/ui/ConfirmationDialogProvider'
import './App.css'

export default function App() {
  const user = useQuery(api.auth.currentUser)

  return (
    <UATErrorBoundary>
      <ConfirmationDialogProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public routes */}
              <Route
                path="/auth/login"
                element={user ? <Navigate to="/" replace /> : <LoginPage />}
              />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ProjectsPage />} />
                <Route path="projects" element={<ProjectsPage />} />

                {/* Deep linking routes for VRP hierarchy */}
                <Route
                  path="projects/:projectId"
                  element={<ProjectDetailPage />}
                />
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

              {/* Default redirect based on auth state */}
              <Route
                path="*"
                element={
                  user === undefined ? (
                    <div className="flex justify-center items-center min-h-screen">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : user ? (
                    <Navigate to="/" replace />
                  ) : (
                    <Navigate to="/auth/login" replace />
                  )
                }
              />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </ConfirmationDialogProvider>
    </UATErrorBoundary>
  )
}
