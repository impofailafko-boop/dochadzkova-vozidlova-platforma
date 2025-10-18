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
import AdminDashboard from "./pages/admin/AdminDashboard";
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
              {/* Additional employee routes will be added in Phase 4 */}
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
              {/* Additional admin routes will be added in Phase 5 */}
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
