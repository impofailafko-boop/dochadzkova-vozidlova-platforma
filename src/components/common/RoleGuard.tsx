import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRole: 'admin' | 'employee';
}

const RoleGuard = ({ children, allowedRole }: RoleGuardProps) => {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role !== allowedRole) {
    // Redirect to appropriate dashboard based on actual role
    if (role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (role === 'employee') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/auth" replace />;
    }
  }

  return <>{children}</>;
};

export default RoleGuard;
