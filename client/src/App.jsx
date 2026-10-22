import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { Footer } from './components/Footer.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';

import { Home } from './pages/Home.jsx';
import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { Profile } from './pages/Profile.jsx';
import { Events } from './pages/Events.jsx';
import { EventDetail } from './pages/EventDetail.jsx';
import { Teams } from './pages/Teams.jsx';
import { TeamDetail } from './pages/TeamDetail.jsx';
import { TeamDashboard } from './pages/TeamDashboard.jsx';
import { CreateTeam } from './pages/CreateTeam.jsx';
import { MyTeams } from './pages/MyTeams.jsx';
import { Notifications } from './pages/Notifications.jsx';
import { Admin } from './pages/Admin.jsx';
import { AdminRoute } from './components/AdminRoute.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <div className="app-layout">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Home Landing Page */}
                <Route path="/" element={<Home />} />

                {/* Events & Details */}
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetail />} />

                {/* Teams Discovery & Details */}
                <Route path="/teams" element={<Teams />} />
                <Route path="/teams/:id" element={<TeamDetail />} />

                {/* Team Dashboard (Leader only, protected) */}
                <Route
                  path="/teams/:id/dashboard"
                  element={
                    <ProtectedRoute requireCompleteProfile={true}>
                      <TeamDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Create Team: Protected */}
                <Route
                  path="/teams/create"
                  element={
                    <ProtectedRoute requireCompleteProfile={true}>
                      <CreateTeam />
                    </ProtectedRoute>
                  }
                />

                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Profile Route: Protected but allows incomplete so student can complete it */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute requireCompleteProfile={false}>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                {/* My Teams Route: Protected */}
                <Route
                  path="/my-teams"
                  element={
                    <ProtectedRoute requireCompleteProfile={true}>
                      <MyTeams />
                    </ProtectedRoute>
                  }
                />

                {/* Notifications Page: Protected */}
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute requireCompleteProfile={false}>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Moderation Panel: Admin role only */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <Admin />
                    </AdminRoute>
                  }
                />

                {/* Fallback Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
