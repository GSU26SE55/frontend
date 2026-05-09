import { Navigate, Outlet } from 'react-router-dom'
import { useSessionStore } from '@/shared/stores/sessionStore'

export function ProtectedRoute() {
  const { accessToken } = useSessionStore()
  if (!accessToken) return <Navigate to="/login" replace />
  return <Outlet />
}
