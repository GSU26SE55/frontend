import { Navigate, Outlet } from 'react-router-dom'
import { useSessionStore } from '@/shared/stores/sessionStore'

export function ProtectedRoute() {
  const user = useSessionStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
