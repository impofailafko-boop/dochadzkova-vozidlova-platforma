import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import RoleGuard from "@/components/common/RoleGuard";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
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

            {/* Protected Employee routes - will be added in Phase 4 */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRole="employee">
                    <Index />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />

            {/* Protected Admin routes - will be added in Phase 5 */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <RoleGuard allowedRole="admin">
                    <Index />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
