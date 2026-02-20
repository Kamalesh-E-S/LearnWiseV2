import React from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, Navigate } from 'react-router-dom';
import { Auth } from './components/Auth';
import { Home } from './components/Home';
import { RoadmapForm } from './components/RoadmapForm';
import { OngoingRoadmaps } from './components/OngoingRoadmaps';
import { useAuthStore } from './store/authStore';
import { CompletedRoadmaps } from './components/CompletedRoadmaps';
import { Jobs } from './components/Jobs';
import { Profile } from './components/Profile';
import { User } from 'lucide-react';

/* ─── Shared Layout with themed navbar ─────────────────────────────── */
function Layout({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const linkCls = ({ isActive }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-coral' : 'text-slate-500 hover:text-midnight'
    }`;

  return (
    <div className="min-h-screen bg-parchment font-sans">
      {/* navbar — matches Home.jsx header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-midnight flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-midnight">LearnWise</span>
          </Link>

          {/* Nav */}
          <div className="flex items-center gap-5">
            {isAuthenticated ? (
              <>
                <NavLink to="/ongoing" className={linkCls}>My Roadmaps</NavLink>
                <NavLink to="/completed" className={linkCls}>Completed</NavLink>
                <NavLink to="/jobs" className={linkCls}>Jobs</NavLink>
                <NavLink
                  to="/create"
                  className="bg-coral text-white text-sm font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-all shadow-sm"
                >
                  + New Roadmap
                </NavLink>
                <NavLink
                  to="/profile"
                  title="Account"
                  className={({ isActive }) =>
                    `p-1.5 rounded-full transition-colors ${isActive ? 'bg-coral/10 text-coral' : 'text-slate-400 hover:text-midnight hover:bg-sage'}`}
                >
                  <User className="h-5 w-5" />
                </NavLink>
              </>
            ) : (
              <>
                <Link to="/auth" className="text-sm font-semibold text-midnight hover:text-coral transition-colors">Log In</Link>
                <Link
                  to="/auth"
                  className="bg-coral text-white text-sm font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-all shadow-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">{children}</main>
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
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={isAuthenticated ? <Navigate to="/ongoing" replace /> : <Auth />} />

        <Route path="/ongoing" element={<ProtectedRoute><Layout><OngoingRoadmaps /></Layout></ProtectedRoute>} />
        <Route path="/ongoing/:id" element={<ProtectedRoute><Layout><OngoingRoadmaps /></Layout></ProtectedRoute>} />
        <Route path="/completed" element={<ProtectedRoute><Layout><CompletedRoadmaps /></Layout></ProtectedRoute>} />
        <Route path="/completed/:id" element={<ProtectedRoute><Layout><CompletedRoadmaps /></Layout></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><Layout><RoadmapForm /></Layout></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute><Layout><Jobs /></Layout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;