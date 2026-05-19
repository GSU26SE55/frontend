import { Navigate, Outlet } from 'react-router-dom';
import { useSessionStore } from '@/shared/stores/sessionStore';
import { useAuthContext } from '@/shared/context/authContext';

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="size-8 animate-spin rounded-full border-b-2 border-primary" />
  </div>
);

const ProtectedRoute = () => {
  const { isHydrating } = useAuthContext();
  const isAuthenticated = useSessionStore(s => s.isAuthenticated);

  if (isHydrating) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
};

export default ProtectedRoute;
