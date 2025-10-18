import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import RoleGuard from "@/components/common/RoleGuard";
import EmployeeLayout from "@/components/layouts/EmployeeLayout";
import AdminLayout from "@/components/layouts/AdminLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/employee/Dashboard";
import Attendance from "./pages/employee/Attendance";
import VehicleUse from "./pages/employee/VehicleUse";
import Fueling from "./pages/employee/Fueling";
import History from "./pages/employee/History";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Employees from "./pages/admin/Employees";
import Vehicles from "./pages/admin/Vehicles";
import Projects from "./pages/admin/Projects";
import AttendanceOverview from "./pages/admin/AttendanceOverview";
import DrivesOverview from "./pages/admin/DrivesOverview";
import FuelingsOverview from "./pages/admin/FuelingsOverview";
import Reports from "./pages/admin/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />

            {/* Protected Employee routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRole="employee">
                    <EmployeeLayout />
                  </RoleGuard>
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="vehicle-use" element={<VehicleUse />} />
              <Route path="fueling" element={<Fueling />} />
              <Route path="history" element={<History />} />
            </Route>

            {/* Protected Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRole="admin">
                    <AdminLayout />
                  </RoleGuard>
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="employees" element={<Employees />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="projects" element={<Projects />} />
              <Route path="attendance-overview" element={<AttendanceOverview />} />
              <Route path="drives-overview" element={<DrivesOverview />} />
              <Route path="fuelings-overview" element={<FuelingsOverview />} />
              <Route path="reports" element={<Reports />} />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
