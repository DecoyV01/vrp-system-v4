import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { Toaster } from "sonner";

export default function App() {
  const user = useQuery(api.auth.currentUser);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          {/* Public routes */}
          <Route 
            path="/auth/login" 
            element={user ? <Navigate to="/projects" replace /> : <LoginPage />} 
          />
          <Route 
            path="/auth/register" 
            element={user ? <Navigate to="/projects" replace /> : <RegisterPage />} 
          />
          
          {/* Protected routes */}
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          
          {/* Default redirect */}
          <Route
            path="/"
            element={
              user === undefined ? (
                <div className="flex justify-center items-center min-h-screen">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : user ? (
                <Navigate to="/projects" replace />
              ) : (
                <Navigate to="/auth/login" replace />
              )
            }
          />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}
