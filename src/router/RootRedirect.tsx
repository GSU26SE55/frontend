import { Navigate } from 'react-router-dom'
import { useSessionStore } from '@/shared/stores/sessionStore'

const roleRoutes: Record<string, string> = {
  '1': '/admin/users',
  '2': '/manager/dashboard',
  '3': '/staff/tickets',
  '4': '/login',
}

export function RootRedirect() {
  const user = useSessionStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={roleRoutes[user.role] ?? '/login'} replace />
}
