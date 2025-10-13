import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import FormBuilder from './components/FormBuilder';
import FormView from './components/FormView';
import FormResponses from './components/FormResponses';
import CollaboratorManagement from './components/Collaborators/CollaboratorManagement';
import Navbar from './components/Navbar';
import ShareForm from "./components/Sharing/ShareForm";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/dashboard" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/forms/new" 
              element={
                <ProtectedRoute>
                  <FormBuilder />
                </ProtectedRoute>
              } 
            />
            {/* ✅ FIXED: Updated route to match Dashboard links */}
            <Route 
              path="/forms/:id/edit" 
              element={
                <ProtectedRoute>
                  <FormBuilder />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/forms/:id" 
              element={<FormView />} 
            />
            <Route 
              path="/forms/:id/responses" 
              element={
                <ProtectedRoute>
                  <FormResponses />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/forms/:id/collaborators" 
              element={
                <ProtectedRoute>
                  <CollaboratorManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/forms/:id/share" 
              element={
                <ProtectedRoute>
                  <ShareForm />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;