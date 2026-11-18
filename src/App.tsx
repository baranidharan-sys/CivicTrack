import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public & Auth Pages
import { LandingPage } from './pages/public/LandingPage';
import { TrackComplaintPage } from './pages/public/TrackComplaintPage';
import { CitizenLoginPage } from './pages/auth/CitizenLoginPage';
import { CitizenRegisterPage } from './pages/auth/CitizenRegisterPage';
import { AdminLoginPage } from './pages/auth/AdminLoginPage';

// Citizen Portal Pages
import { CitizenDashboard } from './pages/citizen/CitizenDashboard';
import { ReportProblemPage } from './pages/citizen/ReportProblemPage';
import { MyComplaintsPage } from './pages/citizen/MyComplaintsPage';
import { CitizenComplaintDetailPage } from './pages/citizen/CitizenComplaintDetailPage';
import { CitizenTrackPage } from './pages/citizen/CitizenTrackPage';
import { NotificationsPage } from './pages/citizen/NotificationsPage';
import { CitizenProfilePage } from './pages/citizen/CitizenProfilePage';

// Admin Portal Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminComplaintsPage } from './pages/admin/AdminComplaintsPage';
import { AdminComplaintDetailPage } from './pages/admin/AdminComplaintDetailPage';
import { AdminManagementPage } from './pages/admin/AdminManagementPage';
import { AdminDepartmentsPage } from './pages/admin/AdminDepartmentsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminProfilePage } from './pages/admin/AdminProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="bottom-right" richColors closeButton />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/track" element={<TrackComplaintPage />} />
          <Route path="/login" element={<CitizenLoginPage />} />
          <Route path="/register" element={<CitizenRegisterPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Citizen Portal (Role-Protected) */}
          <Route
            path="/citizen"
            element={<Navigate to="/citizen/dashboard" replace />}
          />
          <Route
            path="/citizen/dashboard"
            element={
              <ProtectedRoute allowedRole="citizen">
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/report"
            element={
              <ProtectedRoute allowedRole="citizen">
                <ReportProblemPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/complaints"
            element={
              <ProtectedRoute allowedRole="citizen">
                <MyComplaintsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/complaints/:id"
            element={
              <ProtectedRoute allowedRole="citizen">
                <CitizenComplaintDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/track"
            element={
              <ProtectedRoute allowedRole="citizen">
                <CitizenTrackPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/notifications"
            element={
              <ProtectedRoute allowedRole="citizen">
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/profile"
            element={
              <ProtectedRoute allowedRole="citizen">
                <CitizenProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Admin Portal (Role-Protected) */}
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminComplaintsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/complaints/:id"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminComplaintDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/management"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDepartmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
