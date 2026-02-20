import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Auth } from './components/Auth';
import { Home } from './components/Home';
import { RoadmapForm } from './components/RoadmapForm';
import { OngoingRoadmaps } from './components/OngoingRoadmaps';
import { useAuthStore } from './store/authStore';
import { useRoadmapStore } from './store/roadmapStore';
import { CompletedRoadmaps } from './components/CompletedRoadmaps';
import { Jobs } from './components/Jobs';

function Layout({ children }) {
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-xl font-bold text-gray-800">
                  LearnWise
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/ongoing"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    My Roadmaps
                  </Link>
                  <Link
                    to="/completed"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Completed
                  </Link>
                  <Link
                    to="/jobs"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Jobs
                  </Link>
                  <Link
                    to="/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <span>Create Roadmap</span>
                  </Link>
                  <button
                    onClick={() => useAuthStore.getState().signOut()}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/auth" replace />;
}

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public home route */}
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />

        {/* Auth route */}
        <Route
          path="/auth"
          element={
            isAuthenticated ? (
              <Navigate to="/ongoing" replace />
            ) : (
              <Auth />
            )
          }
        />

        {/* Protected routes */}
        <Route
          path="/ongoing"
          element={
            <ProtectedRoute>
              <Layout>
                <OngoingRoadmaps />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ongoing/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <OngoingRoadmaps />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/completed"
          element={
            <ProtectedRoute>
              <Layout>
                <CompletedRoadmaps />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/completed/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <CompletedRoadmaps />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <Layout>
                <RoadmapForm />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <Layout>
                <Jobs />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch all redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;