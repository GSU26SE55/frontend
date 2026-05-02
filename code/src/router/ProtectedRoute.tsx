import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner'
import { useSessionStore } from '@/shared/stores/sessionStore'

export function ProtectedRoute() {
  const location = useLocation()
  const accessToken = useSessionStore((state) => state.accessToken)
  const isHydrated = useSessionStore((state) => state.isHydrated)

  if (!isHydrated) {
    return <LoadingSpinner label="Đang kiểm tra phiên đăng nhập..." />
  }

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
