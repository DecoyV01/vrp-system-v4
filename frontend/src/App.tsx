import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Authenticated, Unauthenticated } from 'convex/react'
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

function App() {
  return (
    <UATErrorBoundary>
      <ConfirmationDialogProvider>
        <div className="App">
          <Authenticated>
            <Routes>
              <Route path="/" element={<MainLayout />}>
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
            </Routes>
          </Authenticated>

          <Unauthenticated>
            <LoginPage />
          </Unauthenticated>

          <Toaster position="top-right" />
        </div>
      </ConfirmationDialogProvider>
    </UATErrorBoundary>
  )
}

export default App
