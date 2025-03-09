/**
 * Main Application Component
 * This file handles the routing configuration and authentication protection for the application.
 */
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/auth.service';

// Eagerly loaded components
import KudosHistory from './pages/KudosHistory/KudosHistory';
import KudosReceived from './pages/KudosReceived/KudosReceived';
import Profile from './pages/Profile/Profile';

// Lazy loaded components for better initial load performance
// These components will only be loaded when they are needed
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Leaderboard = lazy(() => import('./pages/Leaderboard/Leaderboard'));
const Team = lazy(() => import('./pages/Team/Team'));

/**
 * ProtectedRoute Component
 * Ensures that only authenticated users can access certain routes
 * Redirects unauthorized users to the login page, saving their intended destination
 */
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    // Redirect to login with the attempted path in state for post-login redirect
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }
  
  return children;
};

/**
 * PublicRoute Component
 * Handles routes that should only be accessible to non-authenticated users
 * Redirects authenticated users to the dashboard
 */
const PublicRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  
  if (isAuthenticated) {
    // Prevent authenticated users from accessing login/register pages
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

/**
 * App Component
 * Main component that sets up routing and navigation structure
 */
function App() {
  return (
    <Router>
      {/* Suspense wrapper for lazy-loaded components with loading spinner */}
      <Suspense fallback={
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      }>
        <Routes>
          {/* Public Routes - Accessible only to non-authenticated users */}
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
          
          {/* Protected Routes - Require authentication */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/leaderboard" 
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/team" 
            element={
              <ProtectedRoute>
                <Team />
              </ProtectedRoute>
            } 
          />
          
    

        
          <Route path="/kudos-history" element={<ProtectedRoute><KudosHistory /></ProtectedRoute>} />
          <Route path="/kudos-received" element={<ProtectedRoute><KudosReceived /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Root Route - Smart redirect based on authentication status */}
          <Route 
            path="/" 
            element={
              authService.isAuthenticated() 
                ? <Navigate to="/dashboard" replace /> 
                : <Navigate to="/login" replace />
            } 
          />

          {/* Catch-all route for undefined paths */}
          <Route 
            path="*" 
            element={
              <Navigate to="/" replace />
            } 
          />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App; 