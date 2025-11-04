import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import RoleGuard from '@/components/common/RoleGuard';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useRouteTracking, getAndClearLastFormRoute } from '@/hooks/useRouteTracking';
import { useEffect, useRef } from 'react';

// Layouts
import EmployeeLayout from '@/components/layouts/EmployeeLayout';
import AdminLayout from '@/components/layouts/AdminLayout';

// Auth
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';

// Employee Pages
import Dashboard from '@/pages/employee/Dashboard';
import Attendance from '@/pages/employee/Attendance';
import VehicleUse from '@/pages/employee/VehicleUse';
import Fueling from '@/pages/employee/Fueling';
import History from '@/pages/employee/History';
import Profile from '@/pages/employee/Profile';
import Settings from '@/pages/employee/Settings';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import Employees from '@/pages/admin/Employees';
import Vehicles from '@/pages/admin/Vehicles';
import VehicleDetail from '@/pages/admin/VehicleDetail';
import Projects from '@/pages/admin/Projects';
import AttendanceOverview from '@/pages/admin/AttendanceOverview';
import DrivesOverview from '@/pages/admin/DrivesOverview';
import FuelingsOverview from '@/pages/admin/FuelingsOverview';
import Reports from '@/pages/admin/Reports';
import Calendar from '@/pages/admin/Calendar';
import AIReports from '@/pages/admin/AIReports';
import AdminSettings from '@/pages/employee/Settings'; // Reuse the same Settings component

const queryClient = new QueryClient();

const AppContent = () => {
  const navigate = useNavigate();
  const { user, loading, role } = useAuth();
  const hasRestoredRoute = useRef(false);
  
  // Track current route for form persistence
  useRouteTracking();

  // Restore last form route on app load (ONE-TIME ONLY - fixes tab switch issue)
  useEffect(() => {
    if (!loading && user && role && !hasRestoredRoute.current) {
      hasRestoredRoute.current = true;
      const lastFormRoute = getAndClearLastFormRoute();
      if (lastFormRoute && window.location.pathname !== lastFormRoute) {
        navigate(lastFormRoute, { replace: true });
      }
    }
  }, [loading, user, role, navigate]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<Auth />} />

      {/* Employee Routes */}
      <Route element={<ProtectedRoute><RoleGuard allowedRole='employee'><EmployeeLayout /></RoleGuard></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/vehicle-use" element={<VehicleUse />} />
        <Route path="/fueling" element={<Fueling />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Admin Routes */}
      <Route element={<ProtectedRoute><RoleGuard allowedRole='admin'><AdminLayout /></RoleGuard></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/employees" element={<Employees />} />
        <Route path="/admin/projects" element={<Projects />} />
        <Route path="/admin/vehicles" element={<Vehicles />} />
        <Route path="/admin/vehicles/:id" element={<VehicleDetail />} />
        <Route path="/admin/attendance-overview" element={<AttendanceOverview />} />
        <Route path="/admin/drives-overview" element={<DrivesOverview />} />
        <Route path="/admin/fuelings-overview" element={<FuelingsOverview />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/calendar" element={<Calendar />} />
        <Route path="/admin/ai-reports" element={<AIReports />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <AppContent />
              <Toaster />
              <Sonner />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
