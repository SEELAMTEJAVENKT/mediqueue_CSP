import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { DashboardPage } from './pages/patient/DashboardPage';
import { ProfilePage } from './pages/patient/ProfilePage';
import { HospitalsPage } from './pages/patient/HospitalsPage';
import { HospitalDetailPage } from './pages/patient/HospitalDetailPage';
import { DoctorsPage } from './pages/patient/DoctorsPage';
import { DoctorDetailPage } from './pages/patient/DoctorDetailPage';
import { AppointmentsPage } from './pages/patient/AppointmentsPage';
import { BookAppointmentPage } from './pages/patient/BookAppointmentPage';
import { ReportsPage } from './pages/patient/ReportsPage';
import { SymptomCheckerPage } from './pages/patient/SymptomCheckerPage';
import { DoctorDashboardPage } from './pages/doctor/DoctorDashboardPage';
import { DoctorSchedulePage } from './pages/doctor/DoctorSchedulePage';
import { WritePrescriptionPage } from './pages/doctor/WritePrescriptionPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { UserRole } from './types';

// Navigation logger component
function NavigationLogger() {
  const location = useLocation();
  useEffect(() => {
    console.log('[Navigation]', location.pathname);
  }, [location.pathname]);
  return null;
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: UserRole[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function RoleBasedDashboard() {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'doctor') return <Navigate to="/doctor" replace />;
  return <DashboardPage />;
}

function AppRoutes() {
  return (
    <>
      <NavigationLogger />
      <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="hospitals" element={<HospitalsPage />} />
        <Route path="hospitals/:id" element={<HospitalDetailPage />} />
        <Route path="doctors" element={<DoctorsPage />} />
        <Route path="doctors/:id" element={<DoctorDetailPage />} />
        <Route path="symptom-checker" element={<SymptomCheckerPage />} />
      </Route>

      {/* Auth Routes - wrapped with ErrorBoundary */}
      <Route path="/login" element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
      <Route path="/register" element={<ErrorBoundary><RegisterPage /></ErrorBoundary>} />
      <Route path="/forgot-password" element={<ErrorBoundary><ForgotPasswordPage /></ErrorBoundary>} />
      <Route path="/reset-password" element={<ErrorBoundary><ResetPasswordPage /></ErrorBoundary>} />

      {/* Protected Routes */}
      <Route path="/" element={<Layout />}>
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <RoleBasedDashboard />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <ProfilePage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="appointments"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <AppointmentsPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="appointments/book"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <BookAppointmentPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <ReportsPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Doctor Routes */}
      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ErrorBoundary><DoctorDashboardPage /></ErrorBoundary>} />
        <Route path="schedule" element={<ErrorBoundary><DoctorSchedulePage /></ErrorBoundary>} />
        <Route path="prescriptions" element={<ErrorBoundary><WritePrescriptionPage /></ErrorBoundary>} />
        <Route path="profile" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ErrorBoundary><AdminDashboardPage /></ErrorBoundary>} />
        <Route path="profile" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
