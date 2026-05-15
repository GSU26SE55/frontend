import { Navigate, Outlet } from 'react-router-dom';
import { useSessionStore } from '@/shared/stores/sessionStore';
import type { UserRole } from '@/shared/types/session.types';

interface RoleRouteProps {
  allowedRoles: UserRole[];
}

const RoleRoute = ({ allowedRoles }: RoleRouteProps) => {
  const user = useSessionStore(s => s.user);

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
};

export default RoleRoute;
