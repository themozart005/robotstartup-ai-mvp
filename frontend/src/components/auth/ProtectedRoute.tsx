// frontend/src/components/auth/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/AuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
  requiredTier?: 'premium' | 'classroom';
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center"><div className="text-white">Loading...</div></div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <div>{children}</div>;
}