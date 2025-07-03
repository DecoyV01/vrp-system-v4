import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import MainLayout from './components/layout/MainLayout'
import ProjectsPage from './pages/ProjectsPage'
import TableEditorPage from './pages/TableEditorPage'
import LoginPage from './pages/auth/LoginPage'
import './App.css'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<ProjectsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:projectId/scenarios/:scenarioId/datasets/:datasetId/:tableType" element={<TableEditorPage />} />
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </div>
  )
}

export default App