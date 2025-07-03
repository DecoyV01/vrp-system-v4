import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import MainLayout from './components/layout/MainLayout'
import ProjectsPage from './pages/ProjectsPage'
import TableEditorPage from './pages/TableEditorPage'
import LoginPage from './pages/auth/LoginPage'
import './App.css'

// Placeholder pages for future implementation
const ProjectDetailPage = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-2">Project Details</h1>
      <p className="text-gray-600">Coming soon...</p>
    </div>
  </div>
)

const ScenarioDetailPage = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-2">Scenario Details</h1>
      <p className="text-gray-600">Coming soon...</p>
    </div>
  </div>
)

const DatasetDetailPage = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-2">Dataset Overview</h1>
      <p className="text-gray-600">Coming soon...</p>
    </div>
  </div>
)

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<ProjectsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          
          {/* Deep linking routes for VRP hierarchy */}
          <Route path="projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="projects/:projectId/scenarios/:scenarioId" element={<ScenarioDetailPage />} />
          <Route path="projects/:projectId/scenarios/:scenarioId/datasets/:datasetId" element={<DatasetDetailPage />} />
          <Route path="projects/:projectId/scenarios/:scenarioId/datasets/:datasetId/:tableType" element={<TableEditorPage />} />
          
          {/* Legacy routes for backwards compatibility */}
          <Route path="tables/:datasetId/:tableType" element={<TableEditorPage />} />
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </div>
  )
}

export default App