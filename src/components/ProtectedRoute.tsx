import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useAccountStatus } from '@/hooks/useAccountStatus';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, signOut } = useAuth();
  const { status, loading: statusLoading } = useAccountStatus();

  useEffect(() => {
    if (status?.expired) {
      toast.error('Your account has expired. Please contact the admin.');
      signOut();
    }
  }, [status, signOut]);

  if (loading || (user && statusLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (status?.expired) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
